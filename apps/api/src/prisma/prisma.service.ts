import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma?: PrismaService };

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // Reuse a single Prisma client instance across Lambda cold starts
    // to avoid exhausting database connections.
    if (globalForPrisma.prisma) {
      // Return the existing instance when available
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return globalForPrisma.prisma;
    }

    super();
    globalForPrisma.prisma = this;
  }

  async onModuleInit() {
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL not set — skipping Prisma client connect (file-backed fallback enabled)');
      return;
    }

    try {
      const connectTimeoutMs = Number(process.env.PRISMA_CONNECT_TIMEOUT_MS ?? 3000);
      await Promise.race([
        this.$connect(),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`Prisma connect timed out after ${connectTimeoutMs}ms`)), connectTimeoutMs);
        }),
      ]);
    } catch (err: any) {
      console.error('\n[Resilience Mode] Prisma failed to connect proactively on startup.');
      console.error('Please check that your DATABASE_URL is set correctly and the database is reachable.');
      if (process.env.DATABASE_URL) {
        console.error('DATABASE_URL (first 120 chars):', process.env.DATABASE_URL.slice(0, 120));
      }
      console.error('Original error:', err?.message ?? err);
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch (err) {
      // ignore disconnect errors during shutdown
    }
  }
}
