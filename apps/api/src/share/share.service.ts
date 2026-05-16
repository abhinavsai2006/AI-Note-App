import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'crypto';

@Injectable()
export class ShareService {
  constructor(private readonly prisma: PrismaService) {}

  async createShare(noteId: string) {
    const note = await this.prisma.note.findUnique({
      where: { id: noteId },
      select: { id: true, shareId: true },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    const shareId = note.shareId ?? randomUUID();

    const updated = await this.prisma.note.update({
      where: { id: noteId },
      data: {
        isPublic: true,
        shareId,
      },
      select: { shareId: true },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000';

    return {
      shareId: updated.shareId,
      shareUrl: `${appUrl}/shared/${updated.shareId}`,
    };
  }

  async findByShareId(shareId: string) {
    const note = await this.prisma.note.findFirst({
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

    if (!note) {
      throw new NotFoundException('Shared note not found');
    }

    return {
      id: note.id,
      title: note.title,
      content: note.content,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      user: note.user,
      tags: note.tags.map(({ tag }) => tag),
      summary:
        note.aiSummaries[0] !== undefined
          ? {
              summary: note.aiSummaries[0]?.summary ?? null,
              action_items: note.aiSummaries[0]?.actionItems ?? [],
              suggested_title: note.aiSummaries[0]?.suggestedTitle ?? null,
            }
          : null,
    };
  }

  findAll() {
    return [];
  }

  findOne(id: number) {
    return `This action returns a #${id} share`;
  }
}
