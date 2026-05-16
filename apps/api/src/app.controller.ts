import { Controller, Get, All, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @All('*')
  notFound(@Req() req: Request) {
    return {
      statusCode: 404,
      message: `Route ${req.method} ${req.path} not found`,
      timestamp: new Date().toISOString(),
    };
  }
}
