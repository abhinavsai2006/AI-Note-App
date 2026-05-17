import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { NotesModule } from './notes/notes.module';
import { AiModule } from './ai/ai.module';
import { TagsModule } from './tags/tags.module';
import { ShareModule } from './share/share.module';
import { InsightsModule } from './insights/insights.module';
import { EventsGateway } from './events/events.gateway';
import { HealthModule } from './health/health.module';

@Module({
  imports: [PrismaModule, AuthModule, NotesModule, AiModule, TagsModule, ShareModule, InsightsModule, HealthModule],
  controllers: [AppController],
  providers: [AppService, EventsGateway],
})
export class AppModule {}
