import { Controller, Get, Param, Post, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { ShareService } from './share.service';

@Controller('shared')
export class ShareController {
  constructor(private readonly shareService: ShareService) {}

  @Get()
  findAll() {
    return this.shareService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.shareService.findByShareId(id);
  }

  @Post(':id/generate-summary')
  async generateForShared(@Param('id') _id: string) {
    throw new BadRequestException('Shared summary generation is no longer supported on file-backed records.');
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create() {
    throw new BadRequestException('Create shared note via /notes/:noteId/share while authenticated.');
  }
}
