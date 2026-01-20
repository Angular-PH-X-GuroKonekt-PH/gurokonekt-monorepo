/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

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