import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

export async function createServer() {
  const expressApp = express();

  const corsOrigins = (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : true,
    credentials: true,
  });
  app.use(helmet());
  app.use(compression());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidUnknownValues: true,
    }),
  );
  app.enableShutdownHooks();

  await app.init();

  return expressApp;
}

// When run directly (node dist/main.js), start a normal server
if (require.main === module) {
  (async () => {
    const expressApp = await createServer();
    const port = Number(process.env.PORT ?? 3001);
    expressApp.listen(port, () => {
      Logger.log(`API listening on port ${port}`, 'Bootstrap');
    });
  })();
}
