import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ZodExceptionFilter } from './common/filters/zod-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1', { exclude: ['health'] });

  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  });

  app.use(cookieParser());

  // Global filter: ZodError → HTTP 400 with field-level details
  app.useGlobalFilters(new ZodExceptionFilter());

  // Swagger/OpenAPI setup
  const config = new DocumentBuilder()
    .setTitle('PropVest API')
    .setDescription('Private UK Property Investment Marketplace API')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT access token',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document, {
    jsonDocumentUrl: 'openapi.json',
    yamlDocumentUrl: 'openapi.yaml',
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`🚀 PropVest API running on http://localhost:${port}`);
}
bootstrap();