import { Controller, Get, Param, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ShareService } from './share.service';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';

@Controller('shared')
export class ShareController {
  constructor(private readonly shareService: ShareService) {}

  @Get()
  findAll() {
    return this.shareService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    // Try DB-backed shared note first; if not found, fall back to file-backed shares
    try {
      return this.shareService.findByShareId(id);
    } catch (err) {
      // read from file store
      const storePath = join(process.cwd(), 'data', 'shared-store.json');
      return fs.readFile(storePath, 'utf-8').then((raw) => {
        const map = JSON.parse(raw || '{}');
        if (!map[id]) throw err;
        return map[id];
      });
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: { title?: string; content?: string; author?: string }) {
    const shareId = randomUUID();
    const createdAt = new Date().toISOString();

    const record = {
      id: shareId,
      title: body.title || 'Untitled Note',
      content: body.content || '',
      user: { name: body.author || 'Anonymous' },
      tags: [],
      createdAt,
      updatedAt: createdAt,
      summary: null,
    };

    const dataDir = join(process.cwd(), 'data');
    const storePath = join(dataDir, 'shared-store.json');
    try {
      await fs.mkdir(dataDir, { recursive: true });
      let map = {} as Record<string, any>;
      try {
        const raw = await fs.readFile(storePath, 'utf-8');
        map = raw ? JSON.parse(raw) : {};
      } catch {
        map = {};
      }

      map[shareId] = record;
      await fs.writeFile(storePath, JSON.stringify(map, null, 2), 'utf-8');
    } catch (err) {
      // ignore file errors; still return a share URL so users can use local share fallback
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000';
    return { shareId, shareUrl: `${appUrl}/shared/${shareId}` };
  }
}
