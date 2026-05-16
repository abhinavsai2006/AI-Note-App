import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe, HttpException } from '@nestjs/common';
import compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

export async function createServer() {
  const expressApp = express();

  // Parse CORS origins from environment variable
  // Default to production frontend URL if not specified
  const corsOriginEnv = process.env.CORS_ORIGIN || 'https://web-beta-rouge-77.vercel.app';
  const corsOrigins = corsOriginEnv
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  // Always include localhost for development
  if (process.env.NODE_ENV !== 'production') {
    if (!corsOrigins.includes('http://localhost:3000')) corsOrigins.push('http://localhost:3000');
    if (!corsOrigins.includes('http://localhost:5173')) corsOrigins.push('http://localhost:5173');
    if (!corsOrigins.includes('http://127.0.0.1:3000')) corsOrigins.push('http://127.0.0.1:3000');
  }

  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin'],
  });
  app.use(helmet());
  app.use(compression());
  
  // Request logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const statusCode = res.statusCode;
      const statusColor = statusCode < 400 ? '\x1b[32m' : statusCode < 500 ? '\x1b[33m' : '\x1b[31m';
      Logger.debug(
        `${statusColor}${req.method} ${req.path}${'\x1b[0m'} - ${statusCode} (${duration}ms)`,
        'HTTP'
      );
    });
    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidUnknownValues: true,
    }),
  );
  
  // Global error handling middleware
  app.use((err: any, req: any, res: any, next: any) => {
    if (res.headersSent) return next(err);
    
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal server error';
    
    Logger.error(
      `${req.method} ${req.path} - ${status}: ${message}`,
      err.stack,
      'HTTP Error'
    );
    
    res.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: req.path,
    });
  });
  
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
