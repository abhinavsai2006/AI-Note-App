import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@Injectable()
export class NotesService {
  constructor(private prisma: PrismaService) {}

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
}
