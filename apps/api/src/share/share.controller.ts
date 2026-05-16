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
  async findOne(@Param('id') id: string) {
    // Try DB-backed shared note first; if not found or DB unavailable, fall back to file-backed shares
    try {
      const note = await this.shareService.findByShareId(id);
      return note;
    } catch (err) {
      // read from file store
      const storePath = join(process.cwd(), 'data', 'shared-store.json');
      const raw = await fs.readFile(storePath, 'utf-8').catch(() => null);
      const map = raw ? JSON.parse(raw || '{}') : {};
      if (!map[id]) throw err;
      return map[id];
    }
  }

  @Post(':id/generate-summary')
  async generateForShared(@Param('id') id: string) {
    const storePath = join(process.cwd(), 'data', 'shared-store.json');
    const raw = await fs.readFile(storePath, 'utf-8').catch(() => null);
    const map = raw ? JSON.parse(raw || '{}') : {};
    const record = map[id];
    if (!record) {
      return { error: 'Shared note not found' };
    }

    const text = record.content || '';
    const summary = text.length > 300 ? text.slice(0, 300) + '…' : text;
    const lines = text.split(/\r?\n/).map((l: string) => l.trim()).filter(Boolean);
    const action_items = (lines as string[]).filter((l: string) => /^(-|\*|\d+\.)\s+/.test(l) || /\b(todo|fix|implement|add|update)\b/i.test(l)).slice(0, 8);
    const suggested_title = record.title || undefined;

    record.summary = { summary, action_items, suggested_title };

    map[id] = record;
    await fs.mkdir(join(process.cwd(), 'data'), { recursive: true });
    await fs.writeFile(storePath, JSON.stringify(map, null, 2), 'utf-8');

    return record;
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
