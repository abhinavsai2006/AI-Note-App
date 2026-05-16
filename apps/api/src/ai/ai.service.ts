import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateAiDto } from './dto/create-ai.dto';
import { UpdateAiDto } from './dto/update-ai.dto';

@Injectable()
export class AiService {
  private readonly openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';

  async create(createAiDto: CreateAiDto) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new InternalServerErrorException('OPENROUTER_API_KEY is not configured');
    }

    const model = createAiDto.model ?? process.env.OPENROUTER_MODEL ?? 'openai/gpt-5.2';
    const stream = createAiDto.stream ?? false;

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
      throw new BadRequestException('Provide either prompt or messages');
    }

    const response = await fetch(this.openRouterUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...(process.env.OPENROUTER_REFERER ? { 'HTTP-Referer': process.env.OPENROUTER_REFERER } : {}),
        ...(process.env.OPENROUTER_TITLE ? { 'X-OpenRouter-Title': process.env.OPENROUTER_TITLE } : {}),
      },
      body: JSON.stringify({
        model,
        messages,
        stream,
        max_tokens: 2000,
        ...(typeof createAiDto.temperature === 'number' ? { temperature: createAiDto.temperature } : {}),
      }),
    });

    if (!response.ok) {
      const errorPayload = await response.text();
      throw new BadRequestException(`OpenRouter error: ${errorPayload}`);
    }

    if (stream) {
      throw new BadRequestException('Streaming is not implemented in this endpoint yet. Use stream=false.');
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    return {
      model: data?.model ?? model,
      content,
      raw: data,
    };
  }

  findAll() {
    return `This action returns all ai`;
  }

  findOne(id: number) {
    return `This action returns a #${id} ai`;
  }

  update(id: number, updateAiDto: UpdateAiDto) {
    return `This action updates a #${id} ai`;
  }

  remove(id: number) {
    return `This action removes a #${id} ai`;
  }
}
