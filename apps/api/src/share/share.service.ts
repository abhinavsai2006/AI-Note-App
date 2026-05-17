import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ShareService {
  // Local fallback paths
  private readonly backupDir = path.join(process.cwd(), 'data');
  private readonly backupFile = path.join(this.backupDir, 'notes-store.json');

  constructor(private readonly prisma: PrismaService) {}

  private async readStore(): Promise<any[]> {
    try {
      if (!fs.existsSync(this.backupDir)) {
        fs.mkdirSync(this.backupDir, { recursive: true });
      }
      if (!fs.existsSync(this.backupFile)) {
        fs.writeFileSync(this.backupFile, JSON.stringify([]));
      }
      const data = fs.readFileSync(this.backupFile, 'utf8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private async writeStore(data: any[]): Promise<void> {
    try {
      if (!fs.existsSync(this.backupDir)) {
        fs.mkdirSync(this.backupDir, { recursive: true });
      }
      fs.writeFileSync(this.backupFile, JSON.stringify(data, null, 2));
    } catch {
      // ignore
    }
  }

  async createShare(noteId: string) {
    let note: any = null;
    let isDbEnabled = true;
    try {
      note = await this.prisma.note.findUnique({
        where: { id: noteId },
        select: { id: true, shareId: true },
      });
    } catch (err) {
      console.warn('[Resilience Mode] Prisma connection error during share check — falling back to local note store');
      isDbEnabled = false;
      const notes = await this.readStore();
      note = notes.find((n) => n.id === noteId);
    }

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    const shareId = note.shareId ?? randomUUID();

    let updated: any = null;
    if (isDbEnabled) {
      try {
        updated = await this.prisma.note.update({
          where: { id: noteId },
          data: {
            isPublic: true,
            shareId,
          },
          select: { shareId: true },
        });
      } catch (err) {
        console.error('[Resilience Mode] Prisma failed to share note. Falling back to local store.', err?.message ?? err);
        isDbEnabled = false;
      }
    }

    if (!isDbEnabled || !updated) {
      const notes = await this.readStore();
      const idx = notes.findIndex((n) => n.id === noteId);
      if (idx !== -1) {
        notes[idx].isPublic = true;
        notes[idx].shareId = shareId;
        notes[idx].updatedAt = new Date().toISOString();
        await this.writeStore(notes);
        updated = { shareId };
      } else {
        throw new NotFoundException('Note not found in local store');
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000';

    return {
      shareId: updated.shareId,
      shareUrl: `${appUrl}/shared/${updated.shareId}`,
    };
  }

  async findByShareId(shareId: string) {
    let note: any = null;
    let isDbEnabled = true;
    try {
      note = await this.prisma.note.findFirst({
        where: {
          shareId,
          isPublic: true,
        },
        include: {
          user: { select: { name: true } },
          tags: {
            include: {
              tag: { select: { id: true, name: true } },
            },
          },
          aiSummaries: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { summary: true, actionItems: true, suggestedTitle: true },
          },
        },
      });
    } catch (err) {
      console.warn('[Resilience Mode] Prisma connection error during shared fetch — falling back to local note store');
      isDbEnabled = false;
      const notes = await this.readStore();
      const backupNote = notes.find((n) => n.shareId === shareId && n.isPublic);
      if (backupNote) {
        note = {
          id: backupNote.id,
          title: backupNote.title,
          content: backupNote.content,
          createdAt: backupNote.createdAt,
          updatedAt: backupNote.updatedAt,
          user: { name: backupNote.userName || 'Offline User' },
          tags: [],
          aiSummaries: backupNote.summary
            ? [
                {
                  summary: backupNote.summary,
                  actionItems: backupNote.actionItems || [],
                  suggestedTitle: backupNote.suggestedTitle || null,
                },
              ]
            : [],
        };
      }
    }

    if (!note) {
      throw new NotFoundException('Shared note not found');
    }

    if (isDbEnabled) {
      return {
        id: note.id,
        title: note.title,
        content: note.content,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        user: note.user,
        tags: note.tags ? note.tags.map(({ tag }: any) => tag) : [],
        summary:
          note.aiSummaries && note.aiSummaries[0] !== undefined
            ? {
                summary: note.aiSummaries[0]?.summary ?? null,
                action_items: note.aiSummaries[0]?.actionItems ?? [],
                suggested_title: note.aiSummaries[0]?.suggestedTitle ?? null,
              }
            : null,
      };
    } else {
      return {
        id: note.id,
        title: note.title,
        content: note.content,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        user: note.user,
        tags: [],
        summary:
          note.aiSummaries && note.aiSummaries[0] !== undefined
            ? {
                summary: note.aiSummaries[0]?.summary ?? null,
                action_items: note.aiSummaries[0]?.actionItems ?? [],
                suggested_title: note.aiSummaries[0]?.suggestedTitle ?? null,
              }
            : null,
      };
    }
  }

  findAll() {
    return [];
  }

  findOne(id: number) {
    return `This action returns a #${id} share`;
  }
}
