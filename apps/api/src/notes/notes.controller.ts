import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Headers, UseGuards, NotFoundException, BadRequestException } from '@nestjs/common';
import { NotesService } from './notes.service';
import { JwtService } from '@nestjs/jwt';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { ShareService } from '../share/share.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('notes')
export class NotesController {
  constructor(
    private readonly notesService: NotesService,
    private readonly shareService: ShareService,
    private readonly jwtService: JwtService,
  ) {}

  @Get()
  async findAll(@Query('email') email?: string) {
    try {
      return await this.notesService.findAll(email);
    } catch (error) {
      throw new BadRequestException('Failed to fetch notes');
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    if (!id) {
      throw new BadRequestException('Note ID is required');
    }
    const note = await this.notesService.findOne(id);
    if (!note) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }
    return note;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createNoteDto: CreateNoteDto, @Headers('authorization') authorization?: string) {
    // If an auth token is provided, extract email to associate the note with the user
    if (authorization) {
      try {
        const token = authorization.replace(/^Bearer\s+/i, '');
        const payload: any = this.jwtService.verify(token);
        if (payload?.email) {
          // attach user info to DTO
          // @ts-ignore
          createNoteDto.userEmail = payload.email;
          // @ts-ignore
          createNoteDto.userName = payload.name ?? payload.email.split('@')[0];
        }
      } catch {
        // ignore invalid token — fallback to DTO as-is
      }
    }
    return this.notesService.create(createNoteDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() updateNoteDto: UpdateNoteDto) {
    if (!id) {
      throw new BadRequestException('Note ID is required');
    }
    return this.notesService.update(id, updateNoteDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    if (!id) {
      throw new BadRequestException('Note ID is required');
    }
    return this.notesService.remove(id);
  }

  @Post(':noteId/share')
  @UseGuards(JwtAuthGuard)
  async share(@Param('noteId') noteId: string) {
    if (!noteId) {
      throw new BadRequestException('Note ID is required');
    }
    return this.shareService.createShare(noteId);
  }

  @Post(':noteId/generate-summary')
  @UseGuards(JwtAuthGuard)
  async generateSummary(@Param('noteId') noteId: string) {
    if (!noteId) {
      throw new BadRequestException('Note ID is required');
    }
    return this.notesService.generateSummary(noteId);
  }
}
