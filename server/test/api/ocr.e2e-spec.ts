import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TEST_STORE_ID } from '../fixtures/auth.fixture';
import { createTestApp } from '../test-app.helper';

describe('OCR API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/ocr/documents - should reject unauthenticated request with 401', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/ocr/documents')
      .set('X-Store-Id', TEST_STORE_ID);

    expect(res.status).toBe(401);
  });

  it('GET /api/v1/ocr/documents - should return OCR documents list when authenticated', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/ocr/documents')
      .set('Authorization', 'Bearer mock-jwt')
      .set('X-Store-Id', TEST_STORE_ID);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('meta');
  });

  it('POST /api/v1/ocr/presigned-upload - should generate presigned upload URL for valid image', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/ocr/presigned-upload')
      .set('Authorization', 'Bearer mock-jwt')
      .set('X-Store-Id', TEST_STORE_ID)
      .send({
        mimeType: 'image/jpeg',
        fileSizeBytes: 204800,
        documentType: 'pos_z_report',
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('uploadUrl');
    expect(res.body.data).toHaveProperty('storagePath');
    expect(res.body.data).toHaveProperty('documentId');
  });

  it('POST /api/v1/ocr/presigned-upload - should reject oversized file (>10MB) with 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/ocr/presigned-upload')
      .set('Authorization', 'Bearer mock-jwt')
      .set('X-Store-Id', TEST_STORE_ID)
      .send({
        mimeType: 'image/jpeg',
        fileSizeBytes: 15000000, // 15MB
        documentType: 'pos_z_report',
      });

    expect(res.status).toBe(400);
  });

  it('POST /api/v1/ocr/presigned-upload - should reject invalid MIME type with 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/ocr/presigned-upload')
      .set('Authorization', 'Bearer mock-jwt')
      .set('X-Store-Id', TEST_STORE_ID)
      .send({
        mimeType: 'image/gif',
        fileSizeBytes: 100000,
        documentType: 'pos_z_report',
      });

    expect(res.status).toBe(400);
  });

  it('POST /api/v1/ocr/scan - should trigger OCR scan for uploaded document', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/ocr/scan')
      .set('Authorization', 'Bearer mock-jwt')
      .set('X-Store-Id', TEST_STORE_ID)
      .send({
        storagePath: 'stores/store-01/ocr/raw/pos_z_report_20260820.jpg',
        documentType: 'pos_z_report',
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('documentId');
    expect(res.body.data.status).toBe('review_pending');
  });

  it('GET /api/v1/ocr/documents/:id - should return document review details and extracted lines', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/ocr/documents/doc-01')
      .set('Authorization', 'Bearer mock-jwt')
      .set('X-Store-Id', TEST_STORE_ID);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('extractedLines');
    expect(res.body.data).toHaveProperty('bomPreview');
  });

  it('PATCH /api/v1/ocr/documents/:id/items/:itemId - should correct line item during review', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/v1/ocr/documents/doc-01/items/item-01')
      .set('Authorization', 'Bearer mock-jwt')
      .set('X-Store-Id', TEST_STORE_ID)
      .send({
        description: 'Corrected Item Description',
        quantity: 2,
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('success');
    expect(res.body.data.success).toBe(true);
  });

  it('POST /api/v1/ocr/documents/:id/confirm - should confirm document and trigger BOM deductions', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/ocr/documents/doc-01/confirm')
      .set('Authorization', 'Bearer mock-jwt')
      .set('X-Store-Id', TEST_STORE_ID)
      .send({
        applyDeductions: true,
        notes: 'Confirmed in E2E test',
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('success');
    expect(res.body.data.success).toBe(true);
  });

  it('POST /api/v1/ocr/documents/:id/reject - should reject OCR document', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/ocr/documents/doc-02/reject')
      .set('Authorization', 'Bearer mock-jwt')
      .set('X-Store-Id', TEST_STORE_ID)
      .send({
        reason: 'Image is unreadable',
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('success');
    expect(res.body.data.success).toBe(true);
  });
});
