import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, NotFoundException, BadRequestException, Req } from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { ShareService } from '../share/share.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Request } from 'express';

@Controller('notes')
export class NotesController {
  constructor(
    private readonly notesService: NotesService,
    private readonly shareService: ShareService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Req() req: Request & { user?: { email?: string } }) {
    try {
      return await this.notesService.findAll(req.user?.email);
    } catch (error) {
      throw new BadRequestException('Failed to fetch notes');
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string, @Req() req: Request & { user?: { email?: string } }) {
    if (!id) {
      throw new BadRequestException('Note ID is required');
    }
    const note = await this.notesService.findOne(id, req.user?.email);
    if (!note) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }
    return note;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createNoteDto: CreateNoteDto, @Req() req: Request & { user?: { email?: string; name?: string } }) {
    createNoteDto.userEmail = req.user?.email;
    createNoteDto.userName = req.user?.name;
    return this.notesService.create(createNoteDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() updateNoteDto: UpdateNoteDto, @Req() req: Request & { user?: { email?: string } }) {
    if (!id) {
      throw new BadRequestException('Note ID is required');
    }
    return this.notesService.update(id, updateNoteDto, req.user?.email);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @Req() req: Request & { user?: { email?: string } }) {
    if (!id) {
      throw new BadRequestException('Note ID is required');
    }
    return this.notesService.remove(id, req.user?.email);
  }

  @Post(':noteId/share')
  @UseGuards(JwtAuthGuard)
  async share(@Param('noteId') noteId: string, @Req() req: Request & { user?: { email?: string } }) {
    if (!noteId) {
      throw new BadRequestException('Note ID is required');
    }
    return this.shareService.createShare(noteId, req.user?.email);
  }

  @Post(':noteId/generate-summary')
  @UseGuards(JwtAuthGuard)
  async generateSummary(@Param('noteId') noteId: string, @Req() req: Request & { user?: { email?: string } }) {
    if (!noteId) {
      throw new BadRequestException('Note ID is required');
    }
    return this.notesService.generateSummary(noteId, req.user?.email);
  }
}
