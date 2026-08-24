import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TEST_STORE_ID } from '../fixtures/auth.fixture';
import { createTestApp } from '../test-app.helper';

describe('Stock Count API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/stock-counts/history - should reject unauthenticated request with 401', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/stock-counts/history')
      .set('X-Store-Id', TEST_STORE_ID);

    expect(res.status).toBe(401);
  });

  it('GET /api/v1/stock-counts/history - should return count history when authenticated', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/stock-counts/history')
      .set('Authorization', 'Bearer mock-jwt')
      .set('X-Store-Id', TEST_STORE_ID);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('meta');
  });

  it('POST /api/v1/stock-counts/sessions - should instantiate a new count session', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/stock-counts/sessions')
      .set('Authorization', 'Bearer mock-jwt')
      .set('X-Store-Id', TEST_STORE_ID)
      .send({
        countType: 'blind',
        notes: 'E2E blind stocktaking test',
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.countType).toBe('blind');
  });

  it('POST /api/v1/stock-counts/sessions/:id/items - should bulk record count items', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/stock-counts/sessions/01915dfa-b1c4-7221-9988-51b72e04e055_in_progress/items')
      .set('Authorization', 'Bearer mock-jwt')
      .set('X-Store-Id', TEST_STORE_ID)
      .send({
        items: [
          {
            itemId: '01915dfa-b1c4-7221-9988-51b72e04e0a1',
            countedQty: 24.5,
            unit: 'L',
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('success');
    expect(res.body.data.success).toBe(true);
  });

  it('GET /api/v1/stock-counts/sessions/:id/variance - should return variance analysis', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/stock-counts/sessions/01915dfa-b1c4-7221-9988-51b72e04e055_completed/variance')
      .set('Authorization', 'Bearer mock-jwt')
      .set('X-Store-Id', TEST_STORE_ID);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('varianceItems');
  });

  it('POST /api/v1/stock-counts/sessions/:id/variance/approve - should approve variance and sync physical stock', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/stock-counts/sessions/01915dfa-b1c4-7221-9988-51b72e04e055_completed/variance/approve')
      .set('Authorization', 'Bearer mock-jwt')
      .set('X-Store-Id', TEST_STORE_ID)
      .send({
        notes: 'Approved by store manager in E2E test',
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('success');
    expect(res.body.data.success).toBe(true);
  });
});
