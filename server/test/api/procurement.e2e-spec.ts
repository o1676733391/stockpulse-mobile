import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TEST_STORE_ID } from '../fixtures/auth.fixture';
import { createTestApp } from '../test-app.helper';

describe('Procurement API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/procurement/purchase-orders - should reject unauthenticated request with 401', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/procurement/purchase-orders')
      .set('X-Store-Id', TEST_STORE_ID);

    expect(res.status).toBe(401);
  });

  it('GET /api/v1/procurement/purchase-orders - should list POs when authenticated', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/procurement/purchase-orders')
      .set('Authorization', 'Bearer mock-jwt')
      .set('X-Store-Id', TEST_STORE_ID);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('meta');
  });

  it('GET /api/v1/suppliers - should list store suppliers when authenticated', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/suppliers')
      .set('Authorization', 'Bearer mock-jwt')
      .set('X-Store-Id', TEST_STORE_ID);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
