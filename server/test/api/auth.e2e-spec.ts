import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../test-app.helper';

describe('Auth API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/v1/auth/login - should validate email format', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'not-an-email',
        password: '123',
      });

    expect(res.status).toBe(400);
  });

  it('POST /api/v1/auth/signup - should validate required organization and user fields', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({
        email: 'invalid-email',
      });

    expect(res.status).toBe(400);
  });

  it('GET /api/v1/auth/me - should return 401 without Bearer token', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/auth/me - should return authenticated user profile with Bearer token', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer mock-jwt-token');

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.email).toBeDefined();
  });
});
