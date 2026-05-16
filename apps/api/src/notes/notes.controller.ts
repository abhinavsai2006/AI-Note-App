import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Headers, UseGuards } from '@nestjs/common';
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

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createNoteDto: CreateNoteDto, @Headers('authorization') authorization?: string) {
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

  @Post(':noteId/share')
  @UseGuards(JwtAuthGuard)
  share(@Param('noteId') noteId: string) {
    return this.shareService.createShare(noteId);
  }

  @Post(':noteId/generate-summary')
  @UseGuards(JwtAuthGuard)
  async generateSummary(@Param('noteId') noteId: string) {
    return this.notesService.generateSummary(noteId);
  }

  @Get()
  findAll(@Query('email') email?: string) {
    return this.notesService.findAll(email);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.notesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateNoteDto: UpdateNoteDto) {
    return this.notesService.update(id, updateNoteDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.notesService.remove(id);
  }
}
