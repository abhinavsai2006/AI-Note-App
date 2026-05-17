import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { AiService } from '../ai/ai.service';
import { promises as fs } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

type StoredTag = {
  id: string;
  name: string;
};

type StoredNote = {
  id: string;
  title: string;
  content: string;
  isArchived: boolean;
  isPublic: boolean;
  shareId: string | null;
  tags: StoredTag[];
  createdAt: string;
  updatedAt: string;
  ownerEmail?: string;
  ownerName?: string;
  aiSummaries?: Array<{
    summary: string;
    actionItems: string[];
    suggestedTitle: string | null;
    tokensUsed: number;
    model: string;
    createdAt: string;
  }>;
};

const NOTES_STORE_PATH = join(process.cwd(), 'data', 'notes-store.json');

@Injectable()
export class NotesService {
  constructor(private prisma: PrismaService, private aiService: AiService) {}

  private toStoredTags(tags?: string[]) {
    return (tags ?? []).map((tagId) => ({ id: tagId, name: tagId }));
  }

  private async readStore(): Promise<StoredNote[]> {
    const raw = await fs.readFile(NOTES_STORE_PATH, 'utf-8').catch(() => null);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed as StoredNote[];
      }

      if (parsed && typeof parsed === 'object') {
        return Object.values(parsed as Record<string, StoredNote>);
      }
    } catch {
      return [];
    }

    return [];
  }

  private async writeStore(notes: StoredNote[]) {
    await fs.mkdir(join(process.cwd(), 'data'), { recursive: true });
    await fs.writeFile(NOTES_STORE_PATH, JSON.stringify(notes, null, 2), 'utf-8');
  }

  private sortByUpdated(notes: StoredNote[]) {
    return [...notes].sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
  }

  private async saveFallbackNote(note: StoredNote) {
    const notes = await this.readStore();
    const index = notes.findIndex((item) => item.id === note.id);

    if (index === -1) {
      notes.unshift(note);
    } else {
      notes[index] = note;
    }

    await this.writeStore(notes);
    return note;
  }

  private async updateFallbackNote(id: string, patch: Partial<StoredNote>) {
    const notes = await this.readStore();
    const index = notes.findIndex((item) => item.id === id);
    if (index === -1) {
      return null;
    }

    const updated: StoredNote = {
      ...notes[index],
      ...patch,
      tags: patch.tags ?? notes[index].tags,
      aiSummaries: patch.aiSummaries ?? notes[index].aiSummaries,
      updatedAt: new Date().toISOString(),
    };

    notes[index] = updated;
    await this.writeStore(notes);
    return updated;
  }

  async create(createNoteDto: CreateNoteDto) {
    const { title = 'Untitled Note', content = '', userEmail, userName, tags } = createNoteDto;
    const now = new Date().toISOString();
    const fallbackNote: StoredNote = {
      id: randomUUID(),
      title,
      content,
      isArchived: false,
      isPublic: false,
      shareId: randomUUID(),
      tags: this.toStoredTags(tags),
      createdAt: now,
      updatedAt: now,
      ownerEmail: userEmail,
      ownerName: userName ?? 'Anonymous',
      aiSummaries: [],
    };

    try {
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
    } catch {
      return this.saveFallbackNote(fallbackNote);
    }
  }

  async findAll(userEmail?: string) {
    try {
      if (userEmail) {
        const user = await this.prisma.user.findUnique({ where: { email: userEmail } });
        if (!user) return [];
        return this.prisma.note.findMany({ where: { userId: user.id }, orderBy: { updatedAt: 'desc' } });
      }

      // return public notes if no user provided
      return this.prisma.note.findMany({ where: { isPublic: true }, orderBy: { updatedAt: 'desc' } });
    } catch {
      const notes = await this.readStore();
      const filtered = userEmail
        ? notes.filter((note) => note.ownerEmail === userEmail)
        : notes.filter((note) => note.isPublic);

      return this.sortByUpdated(filtered);
    }
  }

  async findOne(id: string) {
    try {
      return await this.prisma.note.findUnique({
        where: { id },
        include: { aiSummaries: true, tags: { include: { tag: true } }, user: true },
      });
    } catch {
      return (await this.readStore()).find((note) => note.id === id) ?? null;
    }
  }

  async update(id: string, updateNoteDto: UpdateNoteDto) {
    const { title, content, isArchived, isPublic } = updateNoteDto as any;
    const data: any = {};
    if (title !== undefined) data.title = title;
    if (content !== undefined) data.content = content;
    if (isArchived !== undefined) data.isArchived = isArchived;
    if (isPublic !== undefined) data.isPublic = isPublic;

    try {
      return await this.prisma.note.update({ where: { id }, data });
    } catch {
      const updated = await this.updateFallbackNote(id, {
        ...(title !== undefined ? { title } : {}),
        ...(content !== undefined ? { content } : {}),
        ...(isArchived !== undefined ? { isArchived } : {}),
        ...(isPublic !== undefined ? { isPublic } : {}),
        ...(isPublic === true ? { shareId: randomUUID() } : {}),
      });

      if (!updated) {
        throw new InternalServerErrorException('Note not found');
      }

      return updated;
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.note.delete({ where: { id } });
    } catch {
      const notes = await this.readStore();
      const index = notes.findIndex((item) => item.id === id);

      if (index === -1) {
        throw new InternalServerErrorException('Note not found');
      }

      const [removed] = notes.splice(index, 1);
      await this.writeStore(notes);
      return removed;
    }
  }

  async generateSummary(noteId: string) {
    let note: { title: string; content: string } | null = null;

    try {
      note = await this.prisma.note.findUnique({ where: { id: noteId } });
    } catch {
      const fallbackNote = (await this.readStore()).find((item) => item.id === noteId) ?? null;
      note = fallbackNote ? { title: fallbackNote.title, content: fallbackNote.content } : null;
    }

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
    } catch (err) {
      // Fallback: save to local file store
      const notes = await this.readStore();
      const index = notes.findIndex((item) => item.id === noteId);
      if (index !== -1) {
        const fallbackNote = notes[index];
        fallbackNote.aiSummaries = fallbackNote.aiSummaries ?? [];
        fallbackNote.aiSummaries.push(summaryData);
        await this.writeStore(notes);
      }
      return {
        id: randomUUID(),
        noteId,
        ...summaryData,
      };
    }
  }
}
