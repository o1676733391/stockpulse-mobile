import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TEST_STORE_ID } from '../fixtures/auth.fixture';
import { createTestApp } from '../test-app.helper';

describe('Security & RBAC Controls (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. Unauthenticated Request: Must reject with 401 Unauthorized', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/inventory')
      .set('X-Store-Id', TEST_STORE_ID);

    expect(res.status).toBe(401);
  });

  it('2. Cross-Tenant Store Access: Must reject mismatched X-Store-Id with 403 Forbidden', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/inventory')
      .set('Authorization', 'Bearer mock-jwt')
      .set('X-Store-Id', '01915dfa-9012-7000-8000-000000000999'); // Unauthorized foreign store

    expect(res.status).toBe(403);
  });

  it('3. Authorized Store & Role: Should permit authenticated manager to access inventory', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/inventory')
      .set('Authorization', 'Bearer mock-jwt')
      .set('X-Store-Id', TEST_STORE_ID);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('data');
  });

  it('4. Protected Endpoint: Variance approval permits manager role', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/stock-counts/sessions/01915dfa-b1c4-7221-9988-51b72e04e055_completed/variance/approve')
      .set('Authorization', 'Bearer mock-jwt')
      .set('X-Store-Id', TEST_STORE_ID)
      .send({ notes: 'Manager approved' });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('success');
  });
});
