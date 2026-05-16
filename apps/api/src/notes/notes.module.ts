import { Module } from '@nestjs/common';
import { NotesService } from './notes.service';
import { NotesController } from './notes.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ShareModule } from '../share/share.module';

@Module({
  imports: [PrismaModule, ShareModule],
  controllers: [NotesController],
  providers: [NotesService],
})
export class NotesModule {}
