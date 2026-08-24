# StockPulse — API Documentation & Developer Guide

## Overview

StockPulse is a cloud-first multi-tenant SaaS mobile and backend platform tailored for restaurant and cloud kitchen inventory management, FEFO lot tracking, Google Gemini Multimodal Vision Document AI OCR invoice processing, and finite-state procurement workflows.

This repository provides full OpenAPI 3.0-compliant specifications and an interactive Swagger UI.

---

## 1. Quick Reference & Endpoints

| Protocol / Spec | URL / Location | Description |
|---|---|---|
| **Base API URL** | `http://localhost:5000/api/v1` | Root API prefix for all v1 resource routes |
| **Interactive Swagger UI** | `http://localhost:5000/api/v1/docs` | Interactive API sandbox with JWT auth |
| **OpenAPI 3.0 JSON** | [`docs/api/openapi.json`](file:///d:/Project%20Local/fnb-mobile/docs/api/openapi.json) | Full machine-readable JSON schema |
| **OpenAPI 3.0 YAML** | [`docs/api/openapi.yaml`](file:///d:/Project%20Local/fnb-mobile/docs/api/openapi.yaml) | Standard YAML contract for API gateways & SDK generators |

---

## 2. Environment Configuration

Swagger UI is enabled by default in `development` and `staging` environments. In `production`, Swagger UI is gated by the `SWAGGER_ENABLED` environment variable.

```env
# Server Configuration
PORT=5000
API_PREFIX=/api/v1
NODE_ENV=development
SWAGGER_ENABLED=true

# Supabase Auth & Multi-Tenancy
SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# OCR Agent & Gemini Configuration
OCR_DEFAULT_PROVIDER=gemini_vision
GEMINI_API_KEY=AQ.Ab8RN6...
GEMINI_MODEL=gemini-2.0-flash
```

---

## 3. Universal Request Protocols

### A. Authentication (JWT Bearer)
All protected endpoints require an `Authorization` header containing a valid Supabase JWT access token:
```http
Authorization: Bearer <SUPABASE_ACCESS_TOKEN>
```
To test in Swagger UI, click the **Authorize** button at the top right, enter your token, and click **Authorize**.

### B. Multi-Tenant Store Context (`X-Store-Id`)
StockPulse enforces strict multi-tenant isolation. All store-scoped operations require the target store UUID passed via the `X-Store-Id` header:
```http
X-Store-Id: 01915dfa-9012-7000-8000-000000000002
```

### C. Standardized Error Response Envelope
All non-2xx responses follow the standardized NestJS error structure:
```json
{
  "statusCode": 400,
  "message": "Physical counted quantity must be greater than or equal to 0",
  "error": "Bad Request",
  "correlationId": "01915dfa-b1c4-7221-9988-51b72e04e099",
  "timestamp": "2026-08-21T00:00:00.000Z",
  "path": "/api/v1/stock-counts/sessions/01915dfa-b1c4-7221-9988-51b72e04e055/items"
}
```

Common HTTP status codes:
- `400 Bad Request`: Validation failure or illegal state machine transition
- `401 Unauthorized`: Missing, expired, or invalid JWT Bearer token
- `403 Forbidden`: User lacks required role/permission or cross-tenant store violation
- `404 Not Found`: Target entity UUID does not exist within the active store scope
- `409 Conflict`: Unique constraint violation (e.g. duplicate SKU) or optimistic locking conflict
- `422 Unprocessable Entity`: Semantic constraint failure

### D. Standardized Pagination
List endpoints accept `page` and `limit` query parameters and return a uniform pagination envelope:
```http
GET /api/v1/inventory?page=1&limit=20&search=milk
```
Response:
```json
{
  "data": [
    {
      "id": "01915dfa-b1c4-7221-9988-51b72e04e0a1",
      "sku": "DAI-001",
      "name": "Whole Milk 3.5%",
      "physicalStock": 24.0,
      "theoreticalStock": 24.0,
      "unit": "L",
      "costPerUnit": 1.25,
      "status": "healthy"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

## 4. API Modules & Endpoints Catalog

### 1. Authentication (`/api/v1/auth`)
- `POST /auth/login`: Authenticate with email/password $\rightarrow$ returns JWT session.
- `POST /auth/signup`: Register new tenant organization and superadmin owner.
- `POST /auth/refresh`: Rotate refresh token and issue fresh JWT access token.
- `POST /auth/logout`: Revoke active session token.
- `GET /auth/me`: Get authenticated user profile, permissions, and assigned stores.
- `POST /auth/switch-store`: Switch active store context for multi-store supervisors.
- `POST /auth/webhook`: Supabase Auth synchronization webhook receiver.

### 2. Inventory & FEFO Batches (`/api/v1/inventory`)
- `GET /inventory`: List paginated SKUs with search, category, and status filters.
- `GET /inventory/:id`: Get full item detail including active FEFO batches and recent transactions.
- `POST /inventory`: Create new inventory SKU definition (`manager`, `superadmin`).
- `PATCH /inventory/:id`: Update item metadata with optimistic locking (`version`).
- `DELETE /inventory/:id`: Soft-archive inventory SKU.
- `POST /inventory/:id/adjustments`: Execute manual stock adjustment with ledger sync (`inventory:adjust`).

### 3. Stock Count & Variance (`/api/v1/stock-counts`)
- `POST /stock-counts/sessions`: Instantiate a new blind or standard count session.
- `PUT /stock-counts/sessions/:sessionId/items/:itemId`: Record counted quantity for single SKU.
- `POST /stock-counts/sessions/:sessionId/items`: Bulk record multiple counted SKUs.
- `POST /stock-counts/sessions/:sessionId/submit`: Submit session and calculate variance ($\Delta, \%, \$$).
- `GET /stock-counts/sessions/:sessionId/variance`: Get shrinkage analysis and discrepancy breakdown.
- `POST /stock-counts/sessions/:sessionId/variance/approve`: Approve variance and synchronize inventory ledger (`stock_count:approve`).
- `GET /stock-counts/history`: List historical audit count sessions with pagination.
- `GET /stock-counts/sessions/:sessionId`: Get detailed count session information.

### 4. OCR & Gemini Multimodal Agent (`/api/v1/ocr`)
- `POST /ocr/presigned-upload`: Generate pre-signed S3/Supabase Storage URL for receipt image upload.
- `POST /ocr/scan`: Trigger Gemini Vision multimodal OCR processing on uploaded file.
- `GET /ocr/documents`: List historical OCR documents with status filters.
- `GET /ocr/documents/:id`: Get document extraction details, confidence scores, and BOM previews.
- `PATCH /ocr/documents/:id/items/:itemId`: Correct extracted line item during review workflow.
- `POST /ocr/documents/:id/confirm`: Confirm review and execute automated BOM deductions (`ocr:review`).
- `POST /ocr/documents/:id/reject`: Reject OCR document without inventory mutations.

### 5. Procurement & Goods Receipts (`/api/v1/procurement`)
- `POST /procurement/purchase-orders`: Draft a new Purchase Order for a supplier.
- `GET /procurement/purchase-orders`: List paginated POs with status filters.
- `GET /procurement/purchase-orders/:id`: Get Purchase Order detail with line items.
- `PATCH /procurement/purchase-orders/:id`: Update Purchase Order draft metadata or line items.
- `POST /procurement/purchase-orders/:id/submit`: Transition PO state: `draft` $\rightarrow$ `submitted`.
- `POST /procurement/purchase-orders/:id/approve`: Transition PO state: `submitted` $\rightarrow$ `approved`.
- `POST /procurement/purchase-orders/:id/cancel`: Transition PO state: `draft`/`submitted`/`approved` $\rightarrow$ `cancelled`.
- `POST /procurement/goods-receipts`: Receive supplier delivery, increment stock, and add FEFO batches.
- `GET /procurement/goods-receipts`: List paginated Goods Receipts history.
- `GET /procurement/goods-receipts/:id`: Get Goods Receipt details with batch numbers and invoice numbers.

### 6. Suppliers (`/api/v1/suppliers`)
- `GET /suppliers`: List contracted active suppliers for the store.
- `GET /suppliers/:id`: Get supplier details by ID.
- `POST /suppliers`: Register new supplier (`procurement:create`).
- `PATCH /suppliers/:id`: Update supplier contact, payment terms, or lead time.
- `DELETE /suppliers/:id`: Soft-delete / archive supplier.

### 7. Notifications (`/api/v1/notifications`)
- `GET /notifications`: List in-app notification history with pagination.
- `GET /notifications/unread-count`: Get unread badge counts for UI indicators.
- `PATCH /notifications/:id/read`: Mark single notification as read.
- `POST /notifications/read-all`: Batch mark all store notifications as read.
- `GET /notifications/preferences`: Get user channel and event category preferences.
- `PUT /notifications/preferences`: Update user channel toggles (push/in-app) and quiet hours.
- `POST /notifications/device-tokens`: Register Expo push token for mobile device.
- `DELETE /notifications/device-tokens/:token`: Unregister Expo push token on logout.
- `POST /notifications/send`: Broadcast system alert or custom store notification (`notifications:send`).

### 8. Audit Ledger (`/api/v1/audit`)
- `GET /audit/logs`: Search immutable audit logs with pagination and action filters (`audit:view`).
- `GET /audit/logs/:id`: Get audit record detail with before/after state diff.
- `GET /audit/verify-chain`: Verify cryptographic SHA-256 hash chain integrity of store audit ledger.
- `POST /audit/logs`: Append an immutable audit event (internal/system use).

---

## 5. End-to-End Workflow Examples

### A. Document AI / Gemini Vision OCR Ingestion Workflow
```
 ┌───────────────────────────┐
 │ 1. POST /ocr/presigned-url │ ──► Get storage upload URL & key
 └─────────────┬─────────────┘
               ▼
 ┌───────────────────────────┐
 │ 2. Direct Upload to S3/DB │ ──► Upload receipt JPEG/PNG/PDF (<10MB)
 └─────────────┬─────────────┘
               ▼
 ┌───────────────────────────┐
 │ 3. POST /ocr/scan         │ ──► Trigger Gemini Vision Agent extraction
 └─────────────┬─────────────┘
               ▼
 ┌───────────────────────────┐
 │ 4. PATCH /ocr/items/:id   │ ──► Review & correct line items / recipe mappings
 └─────────────┬─────────────┘
               ▼
 ┌───────────────────────────┐
 │ 5. POST /ocr/confirm      │ ──► Execute atomic BOM recipe deductions & write ledger
 └───────────────────────────┘
```
> [!IMPORTANT]
> Unconfirmed OCR documents **NEVER** modify inventory balances. Inventory stock mutations only execute upon explicit `POST /ocr/documents/:id/confirm`.

### B. Purchase Order $\rightarrow$ Goods Receipt Workflow
```
 ┌────────────────────────────────────────┐
 │ 1. POST /procurement/purchase-orders   │ (status: 'draft')
 └───────────────────┬────────────────────┘
                     ▼
 ┌────────────────────────────────────────┐
 │ 2. POST /procurement/purchase-orders/  │ (status: 'submitted')
 │    :id/submit                          │
 └───────────────────┬────────────────────┘
                     ▼
 ┌────────────────────────────────────────┐
 │ 3. POST /procurement/purchase-orders/  │ (status: 'approved' - Manager Only)
 │    :id/approve                         │
 └───────────────────┬────────────────────┘
                     ▼
 ┌────────────────────────────────────────┐
 │ 4. POST /procurement/goods-receipts    │ ──► Updates PO to 'received', increments
 └────────────────────────────────────────┘     physical stock, inserts FEFO batch
```

---

## 6. Mobile Application Integration Guidelines

The Expo React Native mobile client consumes these endpoints via `src/services/api/` and `src/hooks/`:

1. **Authentication Token Attachment**: Managed automatically by the API client interceptor using `expo-secure-store`.
2. **Store Tenant Scoping**: Active store UUID is persisted and automatically injected into the `X-Store-Id` header on all requests.
3. **Type Safety**: Client models and TypeScript interfaces match the OpenAPI schemas defined in `openapi.json`.
