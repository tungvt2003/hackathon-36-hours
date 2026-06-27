// Chạy: npx ts-node scripts/gen-openapi.ts
// Output: openapi.json ở root apps/api/ — mobile dùng để codegen types
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { AppModule } from '../src/app.module';

async function main() {
  const app = await NestFactory.create(AppModule, { logger: false });
  const config = new DocumentBuilder()
    .setTitle('Voice Mobility API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  writeFileSync('openapi.json', JSON.stringify(document, null, 2));
  await app.close();
  console.log('openapi.json generated');
}

main();
