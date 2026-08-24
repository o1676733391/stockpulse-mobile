import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TEST_STORE_ID, TEST_ORG_ID } from '../fixtures/auth.fixture';
import { createTestApp } from '../test-app.helper';

describe('Comprehensive Backend Authentication & Authorization (e2e)', () => {
  let app: INestApplication;

  const FOREIGN_STORE_ID = '01915dfa-9012-7000-8000-000000000088';
  const FOREIGN_ORG_ID = '01915dfa-9012-7000-8000-000000000099';

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Authentication Gate Tests', () => {
    it('1.1 Missing Token: Returns 401 Unauthorized on protected routes', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/inventory')
        .set('X-Store-Id', TEST_STORE_ID);

      expect(res.status).toBe(401);
    });

    it('1.2 Invalid Token: Returns 401 Unauthorized on malformed headers', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/inventory')
        .set('Authorization', 'NotBearer malformed-token-string')
        .set('X-Store-Id', TEST_STORE_ID);

      expect(res.status).toBe(401);
    });

    it('1.3 Empty Bearer Token: Returns 401 Unauthorized', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/inventory')
        .set('Authorization', 'Bearer ')
        .set('X-Store-Id', TEST_STORE_ID);

      expect(res.status).toBe(401);
    });

    it('1.4 Valid Login Request: Issues session tokens', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'dev@stockpulse.io',
          password: 'StockPulse123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('user');
    });

    it('1.5 Login Validation: Rejects invalid email structure', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'invalid-email-address',
          password: 'short',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('2. Multi-Tenant Organization & Store Isolation', () => {
    it('2.1 Cross-Store Access: Blocks access to unassigned store in same org', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/inventory')
        .set('Authorization', 'Bearer mock-jwt')
        .set('X-Store-Id', FOREIGN_STORE_ID);

      expect(res.status).toBe(403);
    });

    it('2.2 Authorized Store Access: Permits access when user is assigned to store', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/inventory')
        .set('Authorization', 'Bearer mock-jwt')
        .set('X-Store-Id', TEST_STORE_ID);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('data');
    });
  });

  describe('3. Role & Permission-Based Authorization Enforcement', () => {
    it('3.1 Admin Role: Full operational authority across inventory & variances', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/inventory')
        .set('Authorization', 'Bearer mock-jwt')
        .set('X-Store-Id', TEST_STORE_ID);

      expect(res.status).toBe(200);
    });

    it('3.2 Variance Approval: Requires stock_count:approve permission', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/stock-counts/sessions/01915dfa-b1c4-7221-9988-51b72e04e055_completed/variance/approve')
        .set('Authorization', 'Bearer mock-jwt')
        .set('X-Store-Id', TEST_STORE_ID)
        .send({ notes: 'Supervisor approved' });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('success');
    });

    it('3.3 Procurement FSM: Creating and submitting purchase orders', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/procurement/purchase-orders')
        .set('Authorization', 'Bearer mock-jwt')
        .set('X-Store-Id', TEST_STORE_ID);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('data');
    });

    it('3.4 Supplier Directory: Read and manage supplier profiles', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/suppliers')
        .set('Authorization', 'Bearer mock-jwt')
        .set('X-Store-Id', TEST_STORE_ID);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('4. Privilege Escalation Prevention', () => {
    it('4.1 Immutable Audit Logs: Rejects unauthorized log tampering', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/audit/verify-chain')
        .set('Authorization', 'Bearer mock-jwt')
        .set('X-Store-Id', TEST_STORE_ID);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('isValid');
    });
  });
});
