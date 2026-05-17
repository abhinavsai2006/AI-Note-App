import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    let db = 'disconnected';
    try {
      if (process.env.DATABASE_URL) {
        // lightweight check
        await this.prisma.$queryRaw`SELECT 1`;
        db = 'connected';
      }
    } catch (err) {
      db = 'error';
    }

    return { status: 'ok', db };
  }
}
