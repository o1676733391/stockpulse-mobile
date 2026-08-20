# StockPulse — Production REST & WebSocket API Catalog

> **Version:** 1.0.0  
> **Base URL:** `https://api.stockpulse.io/api/v1`  
> **WebSocket URL:** `wss://ws.stockpulse.io/api/v1/ws`  
> **Companion Document:** [BACKEND_ARCHITECTURE.md](file:///d:/Project%20Local/fnb-mobile/docs/architecture/BACKEND_ARCHITECTURE.md)

---

## 1. Global Standards & Protocols

### 1.1 Standard Request Headers
| Header | Type | Required | Description | Example |
|---|---|---|---|---|
| `Authorization` | String | Yes (Protected) | Bearer JWT access token. | `Bearer eyJhbGciOiJSUzI1Ni...` |
| `X-Store-Id` | String | Yes | Active store tenant context. | `store_berlin_01` |
| `Idempotency-Key` | UUIDv4 | Yes (Mutations) | Prevents duplicate operations on mobile retries. | `9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d` |
| `If-Match` | String | Conditional | Optimistic locking version tag. | `"v12"` |
| `X-Client-Platform` | String | Yes | Client OS environment. | `ios` / `android` |
| `X-Client-Version` | String | Yes | Semantic client application version. | `1.2.0` |

### 1.2 Standard Response & Error Formats (RFC 7807)
All successful API responses return JSON with standardized wrappers. Error responses strictly conform to **RFC 7807**:

#### Successful Response:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "req_01J8F9A3G4H5J6K7L8M9N0P1",
    "timestamp": "2026-08-18T10:00:00.124Z",
    "cursor": "eyJpZCI6ImkyIn0=",
    "hasMore": false
  }
}
```

#### Error Response (RFC 7807):
```json
{
  "type": "https://api.stockpulse.io/errors/stock-adjustment-conflict",
  "title": "Optimistic Concurrency Conflict",
  "status": 409,
  "detail": "The stock item has been modified by another user since it was fetched.",
  "instance": "/api/v1/inventory/i1/adjust",
  "errorCode": "ERR_OPTIMISTIC_LOCK_CONFLICT",
  "invalidParams": [
    { "name": "version", "reason": "Expected version 14, but current database version is 15." }
  ]
}
```

---

## 2. API Endpoint Specifications

---

### Domain 1: Authentication & Team

#### `POST /auth/login`
- **Description**: Authenticate user via email and password, or initiate biometric challenge verification.
- **Auth**: Public
- **Request Body**:
  ```json
  {
    "email": "marco.manager@restaurant.de",
    "password": "StockPulse123!",
    "storeId": "store_berlin_01",
    "deviceFingerprint": "iphone16,2_ios19_uuid"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "rt_88b1f2a3c4d5e6f7...",
    "expiresIn": 900,
    "user": {
      "id": "u2",
      "email": "marco.manager@restaurant.de",
      "name": "Marco Rossi",
      "role": "manager",
      "storeId": "store_berlin_01",
      "permissions": ["inventory:*", "procurement:*", "ocr:*", "analytics:*"]
    }
  }
  ```

#### `POST /auth/refresh`
- **Description**: Issue a new access token and rotate the refresh token family.
- **Auth**: Public (Requires valid Refresh Token in body)
- **Request Body**:
  ```json
  {
    "refreshToken": "rt_88b1f2a3c4d5e6f7...",
    "deviceFingerprint": "iphone16,2_ios19_uuid"
  }
  ```
- **Response `200 OK`**: Returns new `accessToken` and rotated `refreshToken`.

#### `POST /auth/biometrics/register`
- **Description**: Register the client device's hardware SecureStore public key for fast biometric unlock.
- **Auth**: Bearer JWT (`staff`, `manager`, `admin`)
- **Request Body**:
  ```json
  {
    "publicKeyPem": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...",
    "deviceModel": "iPhone 16 Pro",
    "biometricType": "FaceID"
  }
  ```

#### `GET /team/members`
- **Description**: List team members in the active store with role and biometric status.
- **Auth**: Bearer JWT (`manager`, `admin`, `supervisor`)
- **Response `200 OK`**: Array of user records.

---

### Domain 2: Stores & Settings

#### `GET /stores/current`
- **Description**: Fetch active store operational parameters, currency, tax rates, and count schedules.
- **Auth**: Bearer JWT (All Roles)
- **Response `200 OK`**:
  ```json
  {
    "id": "store_berlin_01",
    "name": "Bella Cucina Restaurant",
    "address": "Friedrichstraße 42, 10117 Berlin",
    "currency": "EUR",
    "currencySymbol": "€",
    "taxRate": 19.0,
    "timezone": "Europe/Berlin",
    "settings": {
      "countSchedule": "Daily 22:00",
      "defaultUnits": "Metric (kg, L)",
      "bbdAlertDays": 7,
      "safetyStockMultiplier": 1.2
    }
  }
  ```

#### `PATCH /settings`
- **Description**: Update store operational settings.
- **Auth**: Bearer JWT (`admin`, `manager`)

---

### Domain 3: Inventory & Batches

#### `GET /inventory`
- **Description**: Paginated list of inventory items with real-time stock balances and threshold alerts.
- **Auth**: Bearer JWT (All Roles)
- **Query Parameters**:
  - `category`: Category ID filter (e.g. `cat-1`)
  - `status`: Filter by status (`healthy`, `low`, `critical`, `overstock`)
  - `search`: Search query string
  - `cursor`: Pagination cursor
  - `limit`: Number of items (default: `50`, max: `100`)
- **Response `200 OK`**:
  ```json
  {
    "items": [
      {
        "id": "i1",
        "name": "Chicken Breast",
        "sku": "CHK-001",
        "categoryId": "cat-1",
        "categoryName": "Meat & Poultry",
        "unit": "kg",
        "physicalStock": 24.5,
        "theoreticalStock": 27.0,
        "targetStock": 35.0,
        "safetyStock": 5.0,
        "costPerUnit": 4.80,
        "status": "low",
        "version": 14
      }
    ],
    "meta": { "total": 68, "lowCount": 4, "criticalCount": 1 }
  }
  ```

#### `GET /inventory/:itemId`
- **Description**: Retrieve detailed view of an inventory item including all active FEFO batches.
- **Auth**: Bearer JWT (All Roles)
- **Response `200 OK`**:
  ```json
  {
    "item": { "id": "i1", "name": "Chicken Breast", "physicalStock": 24.5 },
    "batches": [
      { "id": "b5", "batchNumber": "B1024", "quantity": 10.0, "expiryDate": "2026-08-22", "status": "active" },
      { "id": "b6", "batchNumber": "B1029", "quantity": 14.5, "expiryDate": "2026-08-26", "status": "active" }
    ]
  }
  ```

#### `POST /inventory/:itemId/adjust`
- **Description**: Execute a manual emergency stock adjustment with audit logging.
- **Auth**: Bearer JWT (`manager`, `admin`, `supervisor`)
- **Headers**: `Idempotency-Key`, `If-Match`
- **Request Body**:
  ```json
  {
    "delta": -2.5,
    "reasonCode": "SPOILAGE_TRIM_LOSS",
    "note": "Trimmed damaged cuts from B1024"
  }
  ```

#### `GET /batches/expiring`
- **Description**: Fetch all inventory batches with expiration within the warning window.
- **Auth**: Bearer JWT (All Roles)
- **Query Parameters**: `days` (default: `7`)

---

### Domain 4: Recipes & BOM (Bill of Materials) Engine

#### `GET /recipes`
- **Description**: List active recipes and their theoretical portion cost.
- **Auth**: Bearer JWT (All Roles)

#### `GET /recipes/:recipeId`
- **Description**: Get recipe details and exact ingredient breakdown.
- **Auth**: Bearer JWT (All Roles)
- **Response `200 OK`**:
  ```json
  {
    "id": "rec-1",
    "name": "Grilled Chicken Salad",
    "category": "Main Course",
    "ingredients": [
      { "itemId": "i1", "itemName": "Chicken Breast", "quantityRequired": 0.20, "unit": "kg" },
      { "itemId": "i8", "itemName": "Romaine Lettuce", "quantityRequired": 0.10, "unit": "kg" },
      { "itemId": "i7", "itemName": "Tomatoes", "quantityRequired": 0.05, "unit": "kg" }
    ]
  }
  ```

---

### Domain 5: POS & OCR Ingestion

#### `POST /ocr/presigned-url`
- **Description**: Generate a secure S3 pre-signed upload URL for direct receipt upload.
- **Auth**: Bearer JWT (`staff`, `supervisor`, `manager`)
- **Request Body**:
  ```json
  {
    "fileType": "image/jpeg",
    "checksumSha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "purpose": "pos_shift_receipt"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "uploadUrl": "https://stockpulse-receipts-prod.s3.eu-central-1.amazonaws.com/stores/store-1/ocr/2026-08/rec_99.jpg?X-Amz-Algorithm=...",
    "fileKey": "stores/store-1/ocr/2026-08/rec_99.jpg",
    "expiresInSeconds": 300
  }
  ```

#### `POST /ocr/scan`
- **Description**: Enqueue uploaded S3 receipt for multi-modal AI extraction and BOM deduction preview.
- **Auth**: Bearer JWT (`staff`, `supervisor`, `manager`)
- **Request Body**:
  ```json
  {
    "fileKey": "stores/store-1/ocr/2026-08/rec_99.jpg"
  }
  ```

#### `GET /ocr/reports/:reportId`
- **Description**: Retrieve parsed OCR report, confidence scores, and preview BOM deductions.
- **Auth**: Bearer JWT (All Roles)

#### `POST /ocr/reports/:reportId/confirm`
- **Description**: Final supervisor confirmation committing atomic BOM deductions to the inventory ledger.
- **Auth**: Bearer JWT (`supervisor`, `manager`, `admin`)
- **Headers**: `Idempotency-Key`
- **Request Body**:
  ```json
  {
    "adjustments": [
      { "ocrItemId": "ocri-1", "recipeId": "rec-1", "quantity": 24 }
    ]
  }
  ```

---

### Domain 6: Stock Count & Variance Reconciliation

#### `GET /stock-counts/schedules`
- **Description**: List audit schedules (Daily, Weekly Meat & Seafood, Monthly Full Storetake).
- **Auth**: Bearer JWT (All Roles)

#### `POST /stock-counts/sessions`
- **Description**: Initiate or resume a blind stock count session.
- **Auth**: Bearer JWT (`staff`, `supervisor`, `manager`)
- **Request Body**:
  ```json
  {
    "scheduleId": "daily"
  }
  ```

#### `PUT /stock-counts/sessions/:sessionId/items/:itemId`
- **Description**: Record counted quantity for a specific item in the blind count session.
- **Auth**: Bearer JWT (`staff`, `supervisor`, `manager`)
- **Headers**: `Idempotency-Key`
- **Request Body**:
  ```json
  {
    "countedQty": 24.5,
    "unit": "kg",
    "notes": "Verified 2 unbroken packs"
  }
  ```

#### `POST /stock-counts/sessions/:sessionId/submit`
- **Description**: Finalize count session, calculate variance financial impact, and trigger review.
- **Auth**: Bearer JWT (`supervisor`, `manager`, `admin`)

---

### Domain 7: Procurement & POQ

#### `GET /procurement/poq-recommendations`
- **Description**: Retrieve algorithmic purchase order quantity recommendations based on target and safety stock.
- **Auth**: Bearer JWT (All Roles)
- **Response `200 OK`**:
  ```json
  {
    "recommendations": [
      {
        "itemId": "i1",
        "itemName": "Chicken Breast",
        "supplierId": "s1",
        "supplierName": "Metro Foods GmbH",
        "physicalStock": 24.5,
        "targetStock": 35.0,
        "recommendedOrderQty": 10.5,
        "unit": "kg",
        "costPerUnit": 4.80,
        "estimatedCost": 50.40
      }
    ]
  }
  ```

#### `POST /procurement/purchase-orders`
- **Description**: Create or auto-generate purchase orders grouped by supplier.
- **Auth**: Bearer JWT (`supervisor`, `manager`, `admin`)

#### `POST /procurement/goods-receipt`
- **Description**: Confirm arrival of delivery, log batch numbers, and generate new FEFO inventory batches.
- **Auth**: Bearer JWT (`staff`, `supervisor`, `manager`)
- **Request Body**:
  ```json
  {
    "poId": "po-1",
    "supplierId": "s1",
    "invoiceNumber": "INV-99812",
    "items": [
      {
        "itemId": "i1",
        "quantity": 50.0,
        "unit": "kg",
        "pricePerUnit": 4.80,
        "batchNumber": "B1045",
        "expiryDate": "2026-08-28"
      }
    ]
  }
  ```

---

### Domain 8: Waste Intelligence & Suggestions

#### `GET /waste/logs`
- **Description**: Retrieve historical food waste log entries with financial loss totals.
- **Auth**: Bearer JWT (All Roles)

#### `POST /waste/logs`
- **Description**: Log a discarded item or spoiled batch.
- **Auth**: Bearer JWT (`staff`, `supervisor`, `manager`)
- **Request Body**:
  ```json
  {
    "itemId": "i2",
    "batchId": "b1",
    "quantity": 4.2,
    "unit": "kg",
    "reason": "EXPIRED_BBD"
  }
  ```

#### `GET /waste/ai-suggestions`
- **Description**: Retrieve AI-generated promotional recommendations for batches nearing expiry.
- **Auth**: Bearer JWT (All Roles)

---

### Domain 9: Notifications & Real-Time

#### `GET /notifications`
- **Description**: Fetch in-app notifications for the active user and store.
- **Auth**: Bearer JWT (All Roles)

#### `PATCH /notifications/:id/read`
- **Description**: Mark a notification as read.
- **Auth**: Bearer JWT (All Roles)

#### `POST /notifications/device-token`
- **Description**: Register APNs or FCM push token.
- **Auth**: Bearer JWT (All Roles)
- **Request Body**:
  ```json
  {
    "token": "dGhpcyBpcyBhIGZha2UgdG9rZW4gZm9yIGV4YW1wbGU...",
    "platform": "ios",
    "appVersion": "1.2.0"
  }
  ```

---

### Domain 10: WebSocket Real-Time Gateway

- **Handshake Endpoint**: `wss://ws.stockpulse.io/api/v1/ws?token=<JWT>&storeId=<storeId>`
- **Channels**:
  - `store:{storeId}:stock_updates` — Broadcasts real-time inventory level changes.
  - `store:{storeId}:count_session:{sessionId}` — Live multi-user stock count item locking and updates.
  - `user:{userId}:notifications` — Instant badge count increment and critical alert popups.

#### Example WebSocket Item Lock Event:
```json
{
  "event": "STOCK_COUNT_ITEM_LOCKED",
  "data": {
    "sessionId": "ses_44921",
    "itemId": "i1",
    "lockedBy": { "userId": "u4", "userName": "Elena Fischer" },
    "lockedAt": "2026-08-18T10:02:15Z"
  }
}
```
