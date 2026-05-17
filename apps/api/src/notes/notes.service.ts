import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { AiService } from '../ai/ai.service';

@Injectable()
export class NotesService {
  constructor(private prisma: PrismaService, private aiService: AiService) {}

  private mapNote(note: any) {
    const latestSummary = note.aiSummaries?.[0];
    return {
      id: note.id,
      title: note.title,
      content: note.content,
      isArchived: note.isArchived,
      isPublic: note.isPublic,
      shareId: note.shareId ?? null,
      tags: (note.tags ?? []).map(({ tag }: any) => ({ id: tag.id, name: tag.name })),
      createdAt: note.createdAt instanceof Date ? note.createdAt.toISOString() : String(note.createdAt),
      updatedAt: note.updatedAt instanceof Date ? note.updatedAt.toISOString() : String(note.updatedAt),
      summary: latestSummary
        ? {
            summary: latestSummary.summary,
            action_items: latestSummary.actionItems ?? [],
            suggested_title: latestSummary.suggestedTitle ?? null,
          }
        : null,
    };
  }

  private async resolveUserId(email?: string) {
    if (!email) {
      throw new InternalServerErrorException('Authenticated user is required');
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new InternalServerErrorException('User not found');
    }

    return user.id;
  }

  async create(createNoteDto: CreateNoteDto) {
    const { title = 'Untitled Note', content = '', userEmail } = createNoteDto;
    const userId = await this.resolveUserId(userEmail);

    const note = await this.prisma.note.create({
      data: {
        title,
        content,
        userId,
      },
      include: {
        aiSummaries: { orderBy: { createdAt: 'desc' }, take: 1 },
        tags: { include: { tag: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return this.mapNote(note);
  }

  async findAll(userEmail?: string) {
    const userId = await this.resolveUserId(userEmail);
    const notes = await this.prisma.note.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        aiSummaries: { orderBy: { createdAt: 'desc' }, take: 1 },
        tags: { include: { tag: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return notes.map((note) => this.mapNote(note));
  }

  async findOne(id: string, userEmail?: string) {
    const userId = await this.resolveUserId(userEmail);
    const note = await this.prisma.note.findFirst({
      where: { id, userId },
      include: { aiSummaries: { orderBy: { createdAt: 'desc' }, take: 1 }, tags: { include: { tag: true } }, user: { select: { id: true, name: true, email: true } } },
    });

    return note ? this.mapNote(note) : null;
  }

  async update(id: string, updateNoteDto: UpdateNoteDto, userEmail?: string) {
    const { title, content, isArchived, isPublic } = updateNoteDto as any;
    const userId = await this.resolveUserId(userEmail);
    const existing = await this.prisma.note.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new InternalServerErrorException('Note not found');
    }

    const data: any = {};
    if (title !== undefined) data.title = title;
    if (content !== undefined) data.content = content;
    if (isArchived !== undefined) data.isArchived = isArchived;
    if (isPublic !== undefined) data.isPublic = isPublic;

    const updated = await this.prisma.note.update({
      where: { id },
      data,
      include: { aiSummaries: { orderBy: { createdAt: 'desc' }, take: 1 }, tags: { include: { tag: true } }, user: { select: { id: true, name: true, email: true } } },
    });

    return this.mapNote(updated);
  }

  async remove(id: string, userEmail?: string) {
    const userId = await this.resolveUserId(userEmail);
    const note = await this.prisma.note.findFirst({ where: { id, userId } });
    if (!note) {
      throw new InternalServerErrorException('Note not found');
    }

    return this.prisma.note.delete({ where: { id } });
  }

  async generateSummary(noteId: string, userEmail?: string) {
    const userId = await this.resolveUserId(userEmail);
    const note = await this.prisma.note.findFirst({ where: { id: noteId, userId } });

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

    const summaryData = {
      summary: parsed.summary ?? '',
      actionItems: parsed.action_items ?? [],
      suggestedTitle: parsed.suggested_title ?? null,
      tokensUsed: 0,
      model: modelName,
      createdAt: new Date().toISOString(),
    };

    try {
      const record = await this.prisma.aiSummary.create({
        data: {
          noteId,
          summary: summaryData.summary,
          actionItems: summaryData.actionItems,
          suggestedTitle: summaryData.suggestedTitle,
          tokensUsed: summaryData.tokensUsed,
          model: summaryData.model,
        },
      });
      return record;
    } catch {
      throw new InternalServerErrorException('Failed to save AI summary');
    }
  }
}
