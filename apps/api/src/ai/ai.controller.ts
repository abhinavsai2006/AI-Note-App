import { Body, Controller, Post, Req, Res, UsePipes, ValidationPipe, InternalServerErrorException } from '@nestjs/common';
import { AiService } from './ai.service';
import { CreateAiDto } from './dto/create-ai.dto';
import type { Request, Response } from 'express';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async create(@Body() createAiDto: CreateAiDto) {
    return this.aiService.create(createAiDto);
  }

  @Post('stream')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async stream(@Body() createAiDto: CreateAiDto, @Req() req: Request, @Res() res: Response) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new InternalServerErrorException('OPENROUTER_API_KEY is not configured');
    }

    const model = createAiDto.model ?? process.env.OPENROUTER_MODEL ?? 'openai/gpt-5.2';

    const messages =
      createAiDto.messages && createAiDto.messages.length > 0
        ? createAiDto.messages
        : [
            ...(createAiDto.system
              ? [
                  {
                    role: 'system',
                    content: createAiDto.system,
                  },
                ]
              : []),
            ...(createAiDto.prompt
              ? [
                  {
                    role: 'user',
                    content: createAiDto.prompt,
                  },
                ]
              : []),
          ];

    if (messages.length === 0) {
      throw new InternalServerErrorException('Provide either prompt or messages');
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...(process.env.OPENROUTER_REFERER ? { 'HTTP-Referer': process.env.OPENROUTER_REFERER } : {}),
        ...(process.env.OPENROUTER_TITLE ? { 'X-OpenRouter-Title': process.env.OPENROUTER_TITLE } : {}),
      },
      body: JSON.stringify({ model, messages, stream: true }),
    });

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text();
      res.status(502).json({ error: 'Upstream error', detail: text });
      return;
    }

    // Pipe upstream readable stream to response as-is. Upstream sends SSE-style chunks.
    const reader = upstream.body as any; // Node Readable

    // When client disconnects, destroy upstream reader
    const onClose = () => {
      try {
        reader.destroy && reader.destroy();
      } catch (e) {
        // ignore
      }
    };

    req.on('close', onClose);

    // Pipe data
    reader.pipe(res);
  }
}
