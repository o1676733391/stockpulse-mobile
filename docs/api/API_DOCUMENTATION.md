# StockPulse SaaS — Production API Reference & Developer Guide

## Overview
StockPulse provides an enterprise-grade, multi-tenant REST API engineered with **NestJS**, **Supabase PostgreSQL**, and **Google Cloud Document AI**.

- **Base URL (Local / Dev)**: `http://localhost:3000/api/v1`
- **Interactive Swagger UI**: `http://localhost:3000/api/v1/docs`
- **OpenAPI 3.1 JSON Specification**: [`docs/api/openapi.json`](file:///d:/Project%20Local/fnb-mobile/docs/api/openapi.json)

---

## 1. Authentication & Security Protocols

### Universal Headers

| Header | Format | Description | Required? |
|---|---|---|---|
| `Authorization` | `Bearer <JWT>` | Supabase Auth Access Token | Yes (All protected routes) |
| `X-Store-Id` | `UUID` | Active store location UUID for tenant isolation | Yes (All store-scoped routes) |
| `Idempotency-Key` | `UUIDv4` | Mutation deduplication key | Recommended for state transitions |
| `If-Match` | `string` | Optimistic concurrency version tag (e.g. `3`) | Required for concurrent inventory edits |

### Authentication Workflow

1. **Sign Up / Register Tenant**:
   ```http
   POST /api/v1/auth/signup
   Content-Type: application/json

   {
     "email": "chef@restaurant.com",
     "password": "SecurePassword123!",
     "name": "Gordon Ramsay",
     "organizationName": "Union Street Cafe Group",
     "organizationSlug": "union-street-cafe",
     "phone": "+1 555-0144"
   }
   ```
   **Response (`201 Created`)**:
   ```json
   {
     "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "refreshToken": "v1.refresh-token-abc123xyz...",
     "expiresIn": 3600,
     "tokenType": "Bearer",
     "user": {
       "id": "01915dfa-b1c4-7221-9988-51b72e04e001",
       "email": "chef@restaurant.com",
       "name": "Gordon Ramsay",
       "role": "superadmin",
       "organizationId": "01915dfa-9012-7000-8000-000000000001",
       "defaultStoreId": "01915dfa-9012-7000-8000-000000000002",
       "assignedStoreIds": ["01915dfa-9012-7000-8000-000000000002"],
       "permissions": ["*"]
     }
   }
   ```

2. **Login**:
   ```http
   POST /api/v1/auth/login
   Content-Type: application/json

   {
     "email": "mario@stockpulse.app",
     "password": "SecretPassword123!"
   }
   ```

3. **Switch Active Store Tenant**:
   ```http
   POST /api/v1/auth/switch-store
   Authorization: Bearer <JWT>
   Content-Type: application/json

   {
     "storeId": "01915dfa-9012-7000-8000-000000000003"
   }
   ```

---

## 2. Inventory Module API

### List Inventory Items (Paginated)
```http
GET /api/v1/inventory/items?page=1&limit=20&status=low&search=milk
Authorization: Bearer <JWT>
X-Store-Id: 01915dfa-9012-7000-8000-000000000002
```
**Response (`200 OK`)**:
```json
{
  "data": [
    {
      "id": "01915dfa-b1c4-7221-9988-51b72e04e0a1",
      "storeId": "01915dfa-9012-7000-8000-000000000002",
      "sku": "DAI-001",
      "name": "Whole Milk 3.5% Fat (1L)",
      "categoryName": "Dairy & Eggs",
      "unit": "L",
      "physicalStock": 8.0,
      "theoreticalStock": 8.0,
      "targetStock": 40.0,
      "safetyStock": 15.0,
      "reorderPoint": 15.0,
      "costPerUnit": 1.25,
      "totalValue": 10.0,
      "status": "low",
      "version": 4,
      "isArchived": false,
      "createdAt": "2026-08-20T00:00:00.000Z",
      "updatedAt": "2026-08-20T08:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

### Manual Stock Adjustment (Shrinkage / Waste)
```http
POST /api/v1/inventory/items/01915dfa-b1c4-7221-9988-51b72e04e0a1/adjust
Authorization: Bearer <JWT>
X-Store-Id: 01915dfa-9012-7000-8000-000000000002
Content-Type: application/json

{
  "delta": -2.0,
  "reasonCode": "SPOILAGE_TRIM_LOSS",
  "note": "Curdled milk discarded during morning fridge temperature check"
}
```
**Response (`200 OK`)**:
```json
{
  "transactionId": "01915dfa-b1c4-7221-9988-51b72e04e088",
  "transactionNumber": "TX-20260820-0001",
  "itemId": "01915dfa-b1c4-7221-9988-51b72e04e0a1",
  "previousStock": 8.0,
  "newStock": 6.0,
  "delta": -2.0,
  "costImpact": -2.5,
  "status": "critical",
  "version": 5,
  "timestamp": "2026-08-20T08:15:00.000Z"
}
```

---

## 3. Stock Count & Variance Module API

### Start Blind Stock Count Session
```http
POST /api/v1/stock-count/sessions/start
Authorization: Bearer <JWT>
X-Store-Id: 01915dfa-9012-7000-8000-000000000002
Content-Type: application/json

{
  "countType": "blind",
  "notes": "Friday evening closing inventory audit"
}
```

### Record Count Items
```http
POST /api/v1/stock-count/sessions/01915dfa-b1c4-7221-9988-51b72e04e055/items
Authorization: Bearer <JWT>
X-Store-Id: 01915dfa-9012-7000-8000-000000000002
Content-Type: application/json

{
  "items": [
    {
      "itemId": "01915dfa-b1c4-7221-9988-51b72e04e0a1",
      "countedQty": 6.0,
      "unit": "L",
      "notes": "Counted in walk-in fridge"
    }
  ]
}
```

### Approve Variance & Synchronize Inventory Ledger
```http
POST /api/v1/stock-count/sessions/01915dfa-b1c4-7221-9988-51b72e04e055/variance/approve
Authorization: Bearer <JWT>
X-Store-Id: 01915dfa-9012-7000-8000-000000000002
Content-Type: application/json

{
  "notes": "Approved by store manager"
}
```

---

## 4. OCR & Document AI Module API

### 1. Request Presigned Upload URL
```http
POST /api/v1/ocr/presigned-upload
Authorization: Bearer <JWT>
X-Store-Id: 01915dfa-9012-7000-8000-000000000002
Content-Type: application/json

{
  "mimeType": "image/jpeg",
  "fileSizeBytes": 204800,
  "documentType": "pos_z_report"
}
```
**Response (`201 Created`)**:
```json
{
  "uploadUrl": "https://supabase.stockpulse.app/storage/v1/object/upload/sign/ocr/pos_z_report_20260820.jpg",
  "storagePath": "stores/store-01/ocr/raw/pos_z_report_20260820.jpg",
  "expiresAt": "2026-08-20T08:45:00.000Z"
}
```

### 2. Trigger Document AI OCR Scan
```http
POST /api/v1/ocr/scan
Authorization: Bearer <JWT>
X-Store-Id: 01915dfa-9012-7000-8000-000000000002
Content-Type: application/json

{
  "storagePath": "stores/store-01/ocr/raw/pos_z_report_20260820.jpg",
  "documentType": "pos_z_report"
}
```

### 3. Confirm Report & Deduct BOM Raw Ingredients
```http
POST /api/v1/ocr/reports/01915dfa-b1c4-7221-9988-51b72e04e055/confirm
Authorization: Bearer <JWT>
X-Store-Id: 01915dfa-9012-7000-8000-000000000002
Content-Type: application/json

{
  "applyDeductions": true,
  "notes": "POS shift numbers validated against cash drawer"
}
```

---

## 5. Procurement Module API

### State Machine Workflow:
`Draft` $\rightarrow$ `Submitted` $\rightarrow$ `Approved` $\rightarrow$ `Received` (or `Cancelled`)

```http
POST /api/v1/procurement/purchase-orders
Authorization: Bearer <JWT>
X-Store-Id: 01915dfa-9012-7000-8000-000000000002
Content-Type: application/json

{
  "supplierId": "01915dfa-b1c4-7221-9988-51b72e04e020",
  "orderDate": "2026-08-20",
  "expectedDeliveryDate": "2026-08-22",
  "items": [
    {
      "itemId": "01915dfa-b1c4-7221-9988-51b72e04e0a1",
      "quantityOrdered": 50,
      "unit": "L",
      "unitPrice": 1.25
    }
  ],
  "notes": "Weekend stock replenishment"
}
```

### Transition Endpoints:
- `POST /api/v1/procurement/purchase-orders/:id/submit`
- `POST /api/v1/procurement/purchase-orders/:id/approve`
- `POST /api/v1/procurement/purchase-orders/:id/cancel`
- `POST /api/v1/procurement/goods-receipts` (Creates FEFO lot batches & syncs stock)

---

## 6. Notifications Module API

- `GET /api/v1/notifications`: Paginated in-app notification history.
- `GET /api/v1/notifications/unread-count`: Unread badge metrics.
- `PATCH /api/v1/notifications/:id/read`: Mark single notification as read.
- `POST /api/v1/notifications/read-all`: Mark all notifications as read.
- `GET /api/v1/notifications/preferences`: Get notification channels and category settings.
- `PUT /api/v1/notifications/preferences`: Update preferences.
- `POST /api/v1/notifications/device-tokens`: Register Expo push token.

---

## 7. Audit Module API

### Search Immutable Audit Records
```http
GET /api/v1/audit/logs?eventAction=INVENTORY_ADJUST&page=1&limit=20
Authorization: Bearer <JWT>
X-Store-Id: 01915dfa-9012-7000-8000-000000000002
```

### Verify Cryptographic Ledger Chain Integrity
```http
GET /api/v1/audit/verify-chain
Authorization: Bearer <JWT>
X-Store-Id: 01915dfa-9012-7000-8000-000000000002
```
**Response (`200 OK`)**:
```json
{
  "isValid": true,
  "totalRecordsVerified": 152,
  "tamperedRecordId": null,
  "message": "Successfully verified all 152 audit ledger entries with 100% cryptographic integrity.",
  "verifiedAt": "2026-08-20T08:40:00.000Z"
}
```

---

## 8. Standard Error Responses

### `400 Bad Request` (Validation Failure)
```json
{
  "statusCode": 400,
  "message": [
    "Quantity ordered must be greater than 0",
    "Supplier ID must be a valid UUID"
  ],
  "error": "Bad Request",
  "timestamp": "2026-08-20T08:30:00.000Z",
  "path": "/api/v1/procurement/purchase-orders"
}
```

### `401 Unauthorized` (Invalid or Expired JWT)
```json
{
  "statusCode": 401,
  "message": "Invalid or expired Supabase JWT token",
  "error": "Unauthorized",
  "timestamp": "2026-08-20T08:30:00.000Z",
  "path": "/api/v1/inventory/items"
}
```

### `403 Forbidden` (Insufficient RBAC Permissions)
```json
{
  "statusCode": 403,
  "message": "User does not possess the required permissions: [procurement:approve]",
  "error": "Forbidden",
  "timestamp": "2026-08-20T08:30:00.000Z",
  "path": "/api/v1/procurement/purchase-orders/po-01/approve"
}
```

### `404 Not Found` (Entity Missing)
```json
{
  "statusCode": 404,
  "message": "Inventory item '01915dfa-b1c4-7221-9988-51b72e04e0a1' not found in store '01915dfa-9012-7000-8000-000000000002'",
  "error": "Not Found",
  "timestamp": "2026-08-20T08:30:00.000Z",
  "path": "/api/v1/inventory/items/01915dfa-b1c4-7221-9988-51b72e04e0a1"
}
```

### `409 Conflict` (Duplicate Unique Key)
```json
{
  "statusCode": 409,
  "message": "Inventory SKU 'DAI-001' already exists in store",
  "error": "Conflict",
  "timestamp": "2026-08-20T08:30:00.000Z",
  "path": "/api/v1/inventory/items"
}
```
