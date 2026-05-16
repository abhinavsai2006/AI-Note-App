import { Controller, Get, All, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { Request } from 'express';

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
