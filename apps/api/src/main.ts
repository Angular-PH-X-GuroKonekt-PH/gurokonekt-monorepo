/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ALLOWED_CORS_ORIGINS } from '@gurokonekt/models';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  const swaggerPrefix = 'api-docs';
  
  // Set the global prefix first
  app.setGlobalPrefix(globalPrefix);
  
  // Enable validation globally
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  app.enableCors({
    origin: (requestOrigin: string | undefined, 
      callback: (err: Error | null, allow?: boolean) => void) => {
      if (!requestOrigin || ALLOWED_CORS_ORIGINS.includes(requestOrigin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${requestOrigin} is not allowed by CORS`));
      }
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // =========== Swagger setup ===========
  const config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('API documentation for the application')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  
  SwaggerModule.setup(swaggerPrefix, app, document, {
    swaggerOptions: {
      deepLinking: false,
    },
    customSiteTitle: 'API Docs',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(`🚀 Swagger setup at: http://localhost:${port}/${swaggerPrefix}`);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();