import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { AiService } from '../ai/ai.service';

@Injectable()
export class NotesService {
  constructor(private prisma: PrismaService, private aiService: AiService) {}

  async create(createNoteDto: CreateNoteDto) {
    const { title = 'Untitled Note', content = '', userEmail, userName } = createNoteDto;

    let userId: string | undefined;

    if (userEmail) {
      const user = await this.prisma.user.upsert({
        where: { email: userEmail },
        update: { name: userName ?? undefined },
        create: { email: userEmail, name: userName ?? 'Anonymous', passwordHash: '' },
      });
      userId = user.id;
    }

    const note = await this.prisma.note.create({
      data: {
        title,
        content,
        userId: userId ?? '',
      },
    });

    return note;
  }

  async findAll(userEmail?: string) {
    if (userEmail) {
      const user = await this.prisma.user.findUnique({ where: { email: userEmail } });
      if (!user) return [];
      return this.prisma.note.findMany({ where: { userId: user.id }, orderBy: { updatedAt: 'desc' } });
    }

    // return public notes if no user provided
    return this.prisma.note.findMany({ where: { isPublic: true }, orderBy: { updatedAt: 'desc' } });
  }

  async findOne(id: string) {
    return this.prisma.note.findUnique({
      where: { id },
      include: { aiSummaries: true, tags: { include: { tag: true } }, user: true },
    });
  }

  async update(id: string, updateNoteDto: UpdateNoteDto) {
    const { title, content, isArchived, isPublic } = updateNoteDto as any;
    const data: any = {};
    if (title !== undefined) data.title = title;
    if (content !== undefined) data.content = content;
    if (isArchived !== undefined) data.isArchived = isArchived;
    if (isPublic !== undefined) data.isPublic = isPublic;

    return this.prisma.note.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.note.delete({ where: { id } });
  }

  async generateSummary(noteId: string) {
    const note = await this.prisma.note.findUnique({ where: { id: noteId } });
    if (!note) throw new InternalServerErrorException('Note not found');

    // Helper function to strip HTML tags from content
    const stripHtml = (html: string) => {
      return html
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
    };

    const prompt = `You are an assistant that generates a concise JSON summary for a user note.
Return valid JSON with keys: summary (string), action_items (array of strings), suggested_title (string).
Do not include any extra commentary. Note content follows:\n\n${stripHtml(note.content)}`;

    let parsed: { summary?: string; action_items?: string[]; suggested_title?: string } = {};

    if (!process.env.OPENROUTER_API_KEY) {
      // Fallback simple summary when no API key is configured (useful for local testing)
      const text = stripHtml(note.content || '');
      parsed.summary = text.length > 300 ? text.slice(0, 300) + '…' : text;
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      parsed.action_items = lines.filter((l) => /^(-|\*|\d+\.)\s+/.test(l) || /\b(todo|fix|implement|add|update)\b/i.test(l)).slice(0, 8);
      parsed.suggested_title = note.title || undefined;
    } else {
      const aiResponse = await this.aiService.create({ prompt });

      try {
        parsed = JSON.parse(aiResponse.content ?? '{}');
      } catch {
        parsed.summary = aiResponse.content ?? '';
        parsed.action_items = [];
        parsed.suggested_title = undefined;
      }
    }

    const modelName = (typeof (global as any).aiResponse !== 'undefined' ? (global as any).aiResponse?.model : undefined) ?? process.env.OPENROUTER_MODEL ?? 'local-fallback';

    const record = await this.prisma.aiSummary.create({
      data: {
        noteId,
        summary: parsed.summary ?? '',
        actionItems: parsed.action_items ?? [],
        suggestedTitle: parsed.suggested_title ?? null,
        tokensUsed: 0,
        model: modelName,
      },
    });

    return record;
  }
}
