import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TEST_STORE_ID } from '../fixtures/auth.fixture';
import { createTestApp } from '../test-app.helper';

describe('Inventory API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/inventory - should reject unauthenticated requests with 401', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/inventory')
      .set('X-Store-Id', TEST_STORE_ID);

    expect(res.status).toBe(401);
  });

  it('GET /api/v1/inventory - should return paginated inventory items when authenticated', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/inventory?page=1&limit=10')
      .set('Authorization', 'Bearer mock-jwt')
      .set('X-Store-Id', TEST_STORE_ID);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('meta');
    expect(res.body.data.meta.page).toBe(1);
  });

  it('POST /api/v1/inventory - should reject creation if SKU or name is missing', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/inventory')
      .set('Authorization', 'Bearer mock-jwt')
      .set('X-Store-Id', TEST_STORE_ID)
      .send({
        costPerUnit: 5.0,
      });

    expect(res.status).toBe(400);
  });
});
