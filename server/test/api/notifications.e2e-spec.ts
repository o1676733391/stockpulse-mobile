import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TEST_STORE_ID } from '../fixtures/auth.fixture';
import { createTestApp } from '../test-app.helper';

describe('Notifications API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/notifications - should reject unauthenticated request with 401', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/notifications')
      .set('X-Store-Id', TEST_STORE_ID);

    expect(res.status).toBe(401);
  });

  it('GET /api/v1/notifications - should return notification list when authenticated', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/notifications')
      .set('Authorization', 'Bearer mock-jwt')
      .set('X-Store-Id', TEST_STORE_ID);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('meta');
  });

  it('GET /api/v1/notifications/unread-count - should return unread metrics', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', 'Bearer mock-jwt')
      .set('X-Store-Id', TEST_STORE_ID);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('unreadCount');
    expect(res.body.data).toHaveProperty('criticalCount');
  });
});
