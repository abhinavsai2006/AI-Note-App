import { Controller, Get, Param } from '@nestjs/common';
import { ShareService } from './share.service';

@Controller('shared')
export class ShareController {
  constructor(private readonly shareService: ShareService) {}

  @Get()
  findAll() {
    return this.shareService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shareService.findByShareId(id);
  }
}
