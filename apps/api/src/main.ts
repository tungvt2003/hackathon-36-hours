import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // OpenAPI spec — expose tại /api (UI) và /api-json (JSON cho codegen)
  const config = new DocumentBuilder()
    .setTitle('Voice Mobility API')
    .setDescription('API đặt xe / đồ ăn bằng giọng nói')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`API:      http://localhost:${port}`);
  console.log(`Swagger:  http://localhost:${port}/api`);
  console.log(`OpenAPI:  http://localhost:${port}/api-json`);
}

bootstrap();
