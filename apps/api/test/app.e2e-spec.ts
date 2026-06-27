import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(() => {
    process.env.DATABASE_URL ??=
      'postgresql://vmuser:vmpass@localhost:5432/voice_mobility';
    process.env.PROVIDER_PARTNER = 'mock';
    process.env.PROVIDER_PLACES = 'mock';
    process.env.PROVIDER_WEATHER = 'mock';
    process.env.PROVIDER_STT = 'mock';
    process.env.NLU_MODE = 'keyword';
    process.env.ENABLE_TTS = 'false';
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({ ok: true });
      });
  });

  it('/voice/start (POST)', () => {
    return request(app.getHttpServer())
      .post('/voice/start')
      .send({ userId: 'e2e-user' })
      .expect(201)
      .expect(({ body }) => {
        expect(body.session_id).toEqual(expect.any(String));
        expect(body.nlg.plain_text).toContain('dat xe');
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
