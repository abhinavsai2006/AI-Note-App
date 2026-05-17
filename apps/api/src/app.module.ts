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
import { HealthModule } from './health/health.module';

const providers: any[] = [AppService];

// WebSockets (EventsGateway) are incompatible with serverless environments like Vercel and cause cold starts to hang.
if (!process.env.VERCEL) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { EventsGateway } = require('./events/events.gateway');
    providers.push(EventsGateway);
  } catch (err) {
    // fallback if gateway cannot be loaded
  }
}

@Module({
  imports: [PrismaModule, AuthModule, NotesModule, AiModule, TagsModule, ShareModule, InsightsModule, HealthModule],
  controllers: [AppController],
  providers: providers,
})
export class AppModule {}
