import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    // If no DATABASE_URL is configured, skip connecting so the API can run
    // in a limited, file-backed mode (useful for local testing of shared notes).
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL not set — skipping Prisma client connect (file-backed fallback enabled)');
      return;
    }

    try {
      await this.$connect();
    } catch (err: any) {
      // Catch connection errors on startup without throwing
      // Prisma Client will automatically retry connecting lazily on the first query.
      // This prevents startup hangs during Vercel cold starts.
      console.error('\n[Resilience Mode] Prisma failed to connect proactively on startup.');
      console.error('Please check that your DATABASE_URL is set correctly and the database is reachable.');
      if (process.env.DATABASE_URL) {
        console.error('DATABASE_URL (first 120 chars):', process.env.DATABASE_URL.slice(0, 120));
      }
      console.error('Original error:', err?.message ?? err);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
