import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
    } catch (err: any) {
      // Helpful error message for DB connectivity issues
      console.error('\nPrisma failed to connect to the database.');
      console.error('Please check that your DATABASE_URL is set in apps/api/.env and that the database is reachable.');
      if (process.env.DATABASE_URL) {
        console.error('DATABASE_URL (first 120 chars):', process.env.DATABASE_URL.slice(0, 120));
      } else {
        console.error('DATABASE_URL is not set.');
      }
      console.error('Original error:', err?.message ?? err);
      throw err;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
