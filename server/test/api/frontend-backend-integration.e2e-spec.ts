import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  MOCK_VALID_JWT,
  TEST_ORG_ID,
  TEST_OTHER_STORE_ID,
  TEST_STORE_ID,
  TEST_USER_MANAGER,
  TEST_USER_STAFF,
} from '../fixtures/auth.fixture';
import { createTestApp } from '../test-app.helper';

describe('Real Frontend-to-Backend End-to-End Integration Suite (e2e)', () => {
  let app: INestApplication;
  const FOREIGN_STORE_ID = '01915dfa-9012-7000-8000-000000000088';

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  // Helper simulating Mobile API Client making real HTTP calls
  const mobileApiClient = {
    get: (url: string, token = MOCK_VALID_JWT, storeId = TEST_STORE_ID) =>
      request(app.getHttpServer())
        .get(url)
        .set('Authorization', `Bearer ${token}`)
        .set('X-Store-Id', storeId),
    post: (url: string, body: any, token = MOCK_VALID_JWT, storeId = TEST_STORE_ID) =>
      request(app.getHttpServer())
        .post(url)
        .send(body)
        .set('Authorization', `Bearer ${token}`)
        .set('X-Store-Id', storeId),
    put: (url: string, body: any, token = MOCK_VALID_JWT, storeId = TEST_STORE_ID) =>
      request(app.getHttpServer())
        .put(url)
        .send(body)
        .set('Authorization', `Bearer ${token}`)
        .set('X-Store-Id', storeId),
    patch: (url: string, body: any, token = MOCK_VALID_JWT, storeId = TEST_STORE_ID) =>
      request(app.getHttpServer())
        .patch(url)
        .send(body)
        .set('Authorization', `Bearer ${token}`)
        .set('X-Store-Id', storeId),
    delete: (url: string, token = MOCK_VALID_JWT, storeId = TEST_STORE_ID) =>
      request(app.getHttpServer())
        .delete(url)
        .set('Authorization', `Bearer ${token}`)
        .set('X-Store-Id', storeId),
  };

  describe('1. Authentication & Session Initiation Flow', () => {
    it('1.1 Mobile login flow returns valid JWT token and user profile', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'dev@stockpulse.io',
          password: 'StockPulse123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data.user).toHaveProperty('email');
    });

    it('1.2 Mobile API client rejection on missing credentials (401)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/inventory')
        .set('X-Store-Id', TEST_STORE_ID);

      expect(res.status).toBe(401);
    });

    it('1.3 Fetch current authenticated user session (/auth/me)', async () => {
      const res = await mobileApiClient.get('/api/v1/auth/me');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('email');
    });
  });

  describe('2. Master Inventory & Valuation Workflow', () => {
    let createdItemId: string;

    it('2.1 Mobile inventory screen fetches catalog with pagination & envelope', async () => {
      const res = await mobileApiClient.get('/api/v1/inventory?page=1&limit=20');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('data');
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });

    it('2.2 Admin / Manager creates a new inventory SKU (201 Created)', async () => {
      const newSkuPayload = {
        sku: 'MILK-ORG-35',
        name: 'Organic Whole Milk 3.5%',
        unit: 'L',
        targetStock: 40,
        safetyStock: 10,
        costPerUnit: 1.45,
      };

      const res = await mobileApiClient.post('/api/v1/inventory', newSkuPayload);
      expect([200, 201]).toContain(res.status);
      expect(res.body.data).toHaveProperty('id');
      createdItemId = res.body.data.id;
    });

    it('2.3 Mobile updates inventory item attributes', async () => {
      if (!createdItemId) return;
      const res = await mobileApiClient.patch(`/api/v1/inventory/${createdItemId}`, {
        targetStock: 50,
      });

      expect(res.status).toBe(200);
      expect(res.body.data.targetStock).toBe(50);
    });
  });

  describe('3. Physical Stock Count & Variance Approval Workflow', () => {
    let activeSessionId: string;

    it('3.1 Kitchen staff / supervisor starts daily stock count session', async () => {
      const res = await mobileApiClient.post('/api/v1/stock-counts/sessions', {
        countType: 'standard',
        notes: 'End of lunch service count',
      });

      expect([200, 201]).toContain(res.status);
      expect(res.body.data).toHaveProperty('id');
      activeSessionId = res.body.data.id;
    });

    it('3.2 Mobile keypad logs counted units for line items', async () => {
      const res = await mobileApiClient.post(
        '/api/v1/stock-counts/sessions/01915dfa-b1c4-7221-9988-51b72e04e055_in_progress/items',
        {
          items: [
            {
              itemId: '01915dfa-b1c4-7221-9988-51b72e04e0a1',
              countedQty: 18.5,
              unit: 'L',
            },
          ],
        }
      );
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('success');
    });

    it('3.3 Submits completed count session for variance review', async () => {
      if (!activeSessionId) return;
      const res = await mobileApiClient.post(
        `/api/v1/stock-counts/sessions/${activeSessionId}/submit`,
        {
          notes: 'Completed by kitchen lead',
        }
      );
      expect(res.status).toBe(200);
    });

    it('3.4 Supervisor / Manager approves stock count variance', async () => {
      const res = await mobileApiClient.post(
        '/api/v1/stock-counts/sessions/01915dfa-b1c4-7221-9988-51b72e04e055_completed/variance/approve',
        {
          notes: 'Variance verified against kitchen prep log',
        }
      );
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('success');
    });
  });

  describe('4. OCR Receipt Upload & Gemini AI Line-Item Review Flow', () => {
    let ocrDocId: string;

    it('4.1 Mobile requests presigned upload URL for POS receipt', async () => {
      const res = await mobileApiClient.post('/api/v1/ocr/presigned-upload', {
        mimeType: 'image/jpeg',
        fileSizeBytes: 204800,
        documentType: 'pos_z_report',
      });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('uploadUrl');
    });

    it('4.2 Triggers OCR processing via Gemini Vision Pipeline', async () => {
      const res = await mobileApiClient.post('/api/v1/ocr/scan', {
        storagePath: 'stores/store-01/ocr/raw/pos_z_report_20260820.jpg',
        documentType: 'pos_z_report',
      });

      expect([200, 201, 202]).toContain(res.status);
      expect(res.body.data).toHaveProperty('documentId');
      ocrDocId = res.body.data.documentId || '01915dfa-b1c4-7221-9988-51b72e04e055';
    });

    it('4.3 Mobile OCR review screen inspects extracted items', async () => {
      const res = await mobileApiClient.get('/api/v1/ocr/documents');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('data');
    });

    it('4.4 Supervisor confirms OCR line items & triggers BOM deductions', async () => {
      const res = await mobileApiClient.post(
        '/api/v1/ocr/documents/01915dfa-b1c4-7221-9988-51b72e04e055/confirm',
        {
          items: [
            {
              rawText: 'Espresso Single',
              matchedItemId: '01915dfa-b1c4-7221-9988-51b72e04e0a1',
              quantity: 14,
              unitPrice: 2.5,
              confidence: 0.98,
            },
          ],
        }
      );
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('success');
    });
  });

  describe('5. Procurement, POQ Recommendations & Goods Intake Flow', () => {
    it('5.1 Manager fetches purchase orders', async () => {
      const res = await mobileApiClient.get('/api/v1/procurement/purchase-orders');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('data');
    });

    it('5.2 Manager lists store suppliers', async () => {
      const res = await mobileApiClient.get('/api/v1/suppliers');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('6. Notifications & Audit Trail Flow', () => {
    it('6.1 Mobile app fetches notifications feed', async () => {
      const res = await mobileApiClient.get('/api/v1/notifications?page=1&limit=10');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('data');
    });

    it('6.2 Fetches unread notification count', async () => {
      const res = await mobileApiClient.get('/api/v1/notifications/unread-count');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('unreadCount');
    });

    it('6.3 Auditor inspects WORM audit ledger', async () => {
      const res = await mobileApiClient.get('/api/v1/audit/logs?page=1&limit=20');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('data');
    });
  });

  describe('7. RBAC 403 Enforcement & Mobile UI Handling Simulation', () => {
    it('7.1 Rejects cross-store access with 403 Forbidden', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/inventory')
        .set('Authorization', `Bearer ${MOCK_VALID_JWT}`)
        .set('X-Store-Id', FOREIGN_STORE_ID); // Unassigned foreign store

      expect(res.status).toBe(403);
    });

    it('7.2 Structured error handling payload for client consumption', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/inventory')
        .set('Authorization', `Bearer ${MOCK_VALID_JWT}`)
        .set('X-Store-Id', TEST_STORE_ID)
        .send({
          // Missing required fields
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('detail');
    });
  });
});
