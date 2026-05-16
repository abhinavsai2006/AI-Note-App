import { Module } from '@nestjs/common';
import { NotesService } from './notes.service';
import { NotesController } from './notes.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ShareModule } from '../share/share.module';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Module({
  imports: [PrismaModule, ShareModule, AuthModule],
  controllers: [NotesController],
  providers: [NotesService, JwtAuthGuard],
})
export class NotesModule {}
