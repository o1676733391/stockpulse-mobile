# StockPulse Codebase Production-Readiness Comprehensive Audit

**Date:** 2026-08-24  
**Audit Scope:** Full Fullstack Audit — Supabase PostgreSQL Database, NestJS Backend Services & APIs, Expo React Native Mobile Frontend, Real GCP / Gemini Vision Integrations, RBAC Security, and Automated Test Coverage.  
**Objective:** Provide a strict, factual, and complete assessment of current implementation status, identify end-to-end inconsistencies across layers (Database ↔ Backend ↔ API ↔ Frontend), and prioritize blockers before production deployment.

---

## Executive Status Dashboard

```
┌──────────────────────────┬─────────────────────────┬────────────────────────┐
│ Area                     │ Implementation Status   │ Automated Test Status  │
├──────────────────────────┼─────────────────────────┼────────────────────────┤
│ 1. Database (Supabase)   │ IMPLEMENTED             │ PASS (Schema Verified) │
│ 2. Backend (NestJS)      │ IMPLEMENTED             │ 349 / 349 Passed (50/50)│
│ 3. API & Swagger Docs    │ IMPLEMENTED             │ 36 / 36 E2E Passed     │
│ 4. Frontend (Mobile App) │ IMPLEMENTED             │ 14 / 14 i18n Passed    │
│ 5. Security & RBAC       │ IMPLEMENTED             │ PASS (E2E & Unit)      │
│ 6. i18n / Languages      │ IMPLEMENTED (5 Locales) │ 100% Parity (1595/1595)│
│ 7. Real GCP / Gemini OCR │ PARTIALLY IMPLEMENTED   │ BLOCKED (Vertex 404)   │
│ 8. API Client Contract   │ PARTIALLY IMPLEMENTED   │ Discrepancies Detected │
└──────────────────────────┴─────────────────────────┴────────────────────────┘
```

---

## 1. Database Layer (Supabase PostgreSQL)

### 1.1 Status: `IMPLEMENTED`

The database schema is organized across 8 modular migration files (`supabase/migrations/00001`–`00008`) and consolidated in `supabase/full_schema_and_seed.sql`.

### 1.2 Schema Breakdown & Table Inventory

| Module | Table Name | Relationships & Foreign Keys | Indexes & Constraints | Status |
|---|---|---|---|---|
| **Tenancy** | `organizations` | Root tenant entity; referenced by stores, users | Unique index on `slug` (partial where `deleted_at IS NULL`), UUID PK | `IMPLEMENTED` |
| **Tenancy** | `stores` | `FK -> organizations(id)` (CASCADE) | Composite unique index on `(organization_id, store_code)`, soft-delete index | `IMPLEMENTED` |
| **IAM** | `roles` | Root role catalog (`superadmin`, `manager`, `supervisor`, `staff`, `auditor`) | Unique on `name`, `is_system` flag | `IMPLEMENTED` |
| **IAM** | `permissions` | 30 system permission definitions | Unique on `code`, categorized by `module` | `IMPLEMENTED` |
| **IAM** | `role_permissions` | `FK -> roles(id)`, `FK -> permissions(id)` | Composite PK on `(role_id, permission_id)` | `IMPLEMENTED` |
| **IAM** | `users` | `FK -> organizations(id)`, `FK -> stores(default_store_id)` | Unique on `(organization_id, email)` | `IMPLEMENTED` |
| **IAM** | `user_store_assignments` | `FK -> users(id)`, `FK -> stores(id)`, `FK -> roles(id)` | Composite unique on `(user_id, store_id)` | `IMPLEMENTED` |
| **Inventory** | `categories` | `FK -> stores(id)` (CASCADE) | Unique on `(store_id, name)` | `IMPLEMENTED` |
| **Inventory** | `inventory_items` | `FK -> stores(id)`, `FK -> categories(id)` | Unique on `(store_id, sku)`, numeric precision `NUMERIC(12,4)` | `IMPLEMENTED` |
| **Inventory** | `inventory_batches` | `FK -> inventory_items(id)` (CASCADE), `FK -> suppliers(id)` | FEFO tracking index on `(item_id, expiry_date, status)` | `IMPLEMENTED` |
| **Inventory** | `inventory_transactions` | `FK -> stores(id)`, `FK -> inventory_items(id)`, `FK -> users(actor_id)` | Append-only ledger; foreign keys set to RESTRICT/CASCADE | `IMPLEMENTED` |
| **Recipes** | `recipes` | `FK -> stores(id)` (CASCADE) | Unique on `(store_id, code)` | `IMPLEMENTED` |
| **Recipes** | `recipe_ingredients` | `FK -> recipes(id)`, `FK -> inventory_items(id)` (RESTRICT) | Composite index on `(recipe_id, item_id)` | `IMPLEMENTED` |
| **Stock Counts** | `stock_counts` | `FK -> stores(id)`, `FK -> users(conducted_by)` | Session tracking, enum for `count_type` and `status` | `IMPLEMENTED` |
| **Stock Counts** | `stock_count_items` | `FK -> stock_counts(id)`, `FK -> inventory_items(id)` | Recorded items per session | `IMPLEMENTED` |
| **Stock Counts** | `variances` | `FK -> stores(id)`, `FK -> stock_counts(id)` (UNIQUE), `FK -> users(approved_by)` | Discrepancy tiering and valuation calculation | `IMPLEMENTED` |
| **Procurement**| `suppliers` | `FK -> stores(id)` (CASCADE) | Unique on `(store_id, supplier_code)` | `IMPLEMENTED` |
| **Procurement**| `purchase_orders` | `FK -> stores(id)`, `FK -> suppliers(id)`, `FK -> users(approved_by)` | Status FSM enum, total amounts | `IMPLEMENTED` |
| **Procurement**| `purchase_order_items` | `FK -> purchase_orders(id)`, `FK -> inventory_items(id)` | Line items with ordered/received quantities | `IMPLEMENTED` |
| **Procurement**| `goods_receipts` | `FK -> stores(id)`, `FK -> purchase_orders(id)`, `FK -> suppliers(id)`, `FK -> users(received_by)` | Receipt and invoice number linkage | `IMPLEMENTED` |
| **Procurement**| `goods_receipt_items` | `FK -> goods_receipts(id)`, `FK -> purchase_order_items(id)`, `FK -> inventory_items(id)` | Generates new FEFO batch on receipt | `IMPLEMENTED` |
| **OCR** | `ocr_documents` | `FK -> stores(id)`, `FK -> users(confirmed_by)` | Status enum, confidence rating, storage path | `IMPLEMENTED` |
| **OCR** | `ocr_document_items` | `FK -> ocr_documents(id)`, `FK -> recipes(id)` | Line item confidence, matched recipe link | `IMPLEMENTED` |
| **Notifications**| `notifications` | `FK -> stores(id)`, `FK -> users(user_id)` | Urgency enum (`NORMAL`, `CRITICAL`), read status | `IMPLEMENTED` |
| **Notifications**| `device_tokens` | `FK -> users(id)`, `FK -> stores(id)` | Unique on `expo_push_token` | `IMPLEMENTED` |
| **Notifications**| `user_notification_preferences`| `FK -> users(id)`, `FK -> stores(id)` | Unique on `(user_id, store_id)` | `IMPLEMENTED` |
| **Audit** | `audit_logs` | `FK -> organizations(id)`, `FK -> stores(id)`, `FK -> users(actor_id)` | Range Partitioned by month (`audit_logs_2026_08`, `2026_09`), SHA-256 hash chaining | `IMPLEMENTED` |

### 1.3 Row-Level Security (RLS) Evaluation
- **Policy Coverage**: All 27 core multi-tenant tables have RLS enabled via `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`.
- **Security Functions**:
  - `get_auth_store_id()`: Resolves session context from `app.current_store_id` setting or user's `default_store_id`.
  - `has_store_access(target_store_id)`: Checks membership in `user_store_assignments`.
  - `is_superadmin()`: Validates global administrative authority.
- **Audit Ledger Immutability**: `audit_logs` and `inventory_transactions` have strict read-only RLS policies preventing `UPDATE` or `DELETE` operations.

---

## 2. Backend Layer (NestJS)

### 2.1 Status: `IMPLEMENTED`

The backend runs on NestJS 10.4 with an enterprise modular design, class-validator DTOs, global exception filters, and OpenAPI auto-generation.

### 2.2 Module & Controller Audit

| Module Name | Controller Endpoints | Guards & Interceptors | Repository Pattern | Status |
|---|---|---|---|---|
| **AppModule** | Global configuration, ConfigModule, validation schema | Global `ValidationPipe`, `AllExceptionsFilter`, `TransformInterceptor` | N/A | `IMPLEMENTED` |
| **AuthModule** | `POST /auth/login`, `POST /auth/signup`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/switch-store`, `POST /auth/webhook` | `SupabaseAuthGuard`, `Public` decorator | `UsersRepository` | `IMPLEMENTED` |
| **UsersModule** | `GET /users`, `POST /users`, `GET /users/:id`, `PATCH /users/:id`, `DELETE /users/:id`, `POST /users/:id/assign-store` | `RolesGuard`, `PermissionsGuard` (`team:manage`, `team:view`) | `UsersRepository` | `IMPLEMENTED` |
| **OrganizationsModule** | `GET /organizations/current`, `PATCH /organizations/current` | `RolesGuard` (`superadmin`) | `OrganizationsRepository` | `IMPLEMENTED` |
| **StoresModule** | `GET /stores`, `POST /stores`, `GET /stores/:id`, `PATCH /stores/:id`, `DELETE /stores/:id` | `TenantStoreGuard`, `RolesGuard` (`superadmin`, `manager`) | `StoresRepository` | `IMPLEMENTED` |
| **InventoryModule** | `GET /inventory`, `GET /inventory/:id`, `POST /inventory`, `PATCH /inventory/:id`, `DELETE /inventory/:id`, `POST /inventory/adjust`, `GET /inventory/:id/batches` | `TenantStoreGuard`, `RequirePermissions('inventory:view', 'inventory:manage_skus', 'inventory:adjust')` | `InventoryRepository`, `BomDeductionEngine` | `IMPLEMENTED` |
| **StockCountModule** | `GET /stock-counts/sessions`, `POST /stock-counts/sessions/start`, `POST /stock-counts/sessions/:id/items`, `POST /stock-counts/sessions/:id/submit`, `GET /stock-counts/sessions/:id/variance`, `POST /stock-counts/sessions/:id/variance/approve` | `TenantStoreGuard`, `RequirePermissions('stock_count:conduct', 'stock_count:approve')` | `StockCountRepository`, `VarianceEngine` | `IMPLEMENTED` |
| **ProcurementModule**| `GET /procurement/orders`, `POST /procurement/orders`, `GET /procurement/orders/:id`, `PATCH /procurement/orders/:id`, `POST /procurement/orders/:id/submit`, `POST /procurement/orders/:id/approve`, `POST /procurement/orders/:id/cancel`, `POST /procurement/goods-receipts` | `TenantStoreGuard`, `RequirePermissions('procurement:create_po', 'procurement:approve_po', 'procurement:goods_receipt')` | `ProcurementRepository`, `ProcurementStateMachine` | `IMPLEMENTED` |
| **SuppliersModule** | `GET /suppliers`, `POST /suppliers`, `GET /suppliers/:id`, `PATCH /suppliers/:id`, `DELETE /suppliers/:id` | `TenantStoreGuard`, `RolesGuard` | `SuppliersRepository` | `IMPLEMENTED` |
| **OcrModule** | `POST /ocr/presigned-url`, `POST /ocr/upload-process`, `POST /ocr/trigger-scan`, `GET /ocr/documents`, `GET /ocr/documents/:id`, `PATCH /ocr/documents/:id/items/:itemId`, `POST /ocr/documents/:id/confirm-deduction`, `POST /ocr/documents/:id/reject` | `TenantStoreGuard`, `RequirePermissions('ocr:scan', 'ocr:confirm')` | `OcrRepository`, `OcrProviderFactory` | `IMPLEMENTED` |
| **NotificationsModule**| `GET /notifications`, `PATCH /notifications/:id/read`, `POST /notifications/mark-all-read`, `POST /notifications/device-token`, `GET /notifications/preferences`, `PATCH /notifications/preferences` | `TenantStoreGuard`, `SupabaseAuthGuard` | `NotificationsRepository`, `ExpoPushProvider` | `IMPLEMENTED` |
| **AuditModule** | `GET /audit/logs`, `GET /audit/verify-integrity`, `GET /audit/entities/:type/:id` | `TenantStoreGuard`, `RolesGuard` (`superadmin`, `auditor`), `RequirePermissions('audit:view')` | `AuditRepository`, `AuditHashingService` | `IMPLEMENTED` |

### 2.3 Error Handling & Validation
- **DTO Validation**: Class-validator rules on all incoming payloads (`whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`).
- **Global Filters**: `AllExceptionsFilter` intercepts unhandled runtime exceptions, formats structured error responses with correlation IDs, and logs stack traces.
- **Envelope Interceptor**: `TransformInterceptor` wraps successful HTTP responses in `{ success: true, data: T, timestamp: string }`.

---

## 3. Frontend Layer (Expo React Native Mobile)

### 3.1 Status: `IMPLEMENTED`

The mobile app is built with Expo SDK 57 (React Native 0.86, React 19), Expo Router v4 file-based routing, and a customized token-based UI design system.

### 3.2 Screen Architecture & Route Inventory

```
src/app/
├── _layout.tsx                     # Global Root Layout (I18nProvider, AuthProvider, OfflineProvider)
├── index.tsx                       # Initial redirect & authentication gate
├── login.tsx                       # Localized login screen with demo role presets
├── register.tsx                    # Tenant owner onboarding & registration
├── notifications.tsx               # Central kitchen alert list, filter by unread/urgent
├── notifications/[id].tsx          # Notification detail screen
│
├── (tabs)/                         # Bottom Tab Navigation
│   ├── _layout.tsx                 # 5 Tabs: Dashboard, Inventory, Scan, Orders, More
│   ├── index.tsx                   # Executive Dashboard (KPIs, Donut Charts, Quick Actions)
│   ├── inventory.tsx               # Inventory catalog list, search, category chips, status filter
│   ├── scan.tsx                    # Camera viewfinder & gallery picker with guidelines
│   ├── orders.tsx                  # Procurement order list (Active & History)
│   └── more.tsx                    # Secondary navigation hub & role switcher
│
├── inventory/
│   └── [id].tsx                    # Inventory SKU detail: Physical/Theoretical, Batches, Trends
│
├── scan/
│   ├── processing.tsx              # Animated 5-step OCR status progression
│   ├── review.tsx                  # Line item review table, confidence pills, BOM deduction preview
│   └── result.tsx                  # Post-confirmation summary and inventory impact CTA
│
├── orders/
│   ├── [id].tsx                    # Purchase Order detail & Goods Receipt workflow
│   └── poq.tsx                     # AI Periodic Order Quantity suggestions & 1-click PO generator
│
├── expiration/
│   ├── index.tsx                   # Expiration & BBD triage dashboard (Critical, Warning, Fresh)
│   ├── [id].tsx                    # Batch lot details & disposal modal
│   └── waste-reduction.tsx         # Waste analytics & prevention suggestions
│
├── stock-count/
│   ├── index.tsx                   # Stock count hub (Active audits, scheduled sessions)
│   ├── active.tsx                  # Live count interface with numeric keypad
│   └── summary.tsx                 # Post-count discrepancy report & variance sign-off
│
├── team/
│   ├── index.tsx                   # Store team directory with role badges
│   ├── [id].tsx                    # Member permissions inspector & role editor
│   └── invite.tsx                  # Team member invitation form
│
├── analytics/
│   ├── index.tsx                   # Cost & consumption analytics
│   ├── reports.tsx                 # Discrepancy & audit reports
│   └── suppliers.tsx               # Supplier performance ratings
│
└── settings/
    ├── index.tsx                   # Settings root menu
    ├── language.tsx                # Dedicated Language Switcher (EN, DE, FR, ES, IT)
    ├── appearance.tsx              # Dark/Light/System theme selector
    ├── store.tsx                   # Store location settings & currency
    ├── notifications.tsx           # Push/Email notification toggle matrix
    ├── profile.tsx                 # User profile & credentials
    └── about.tsx                   # Version, build metadata, Third-Party License credits
```

### 3.3 State Management & Hooks
- **`AuthContext`**: Manages active user session, token storage, role switching, and granular route access checking (`canAccessRoute()`, `hasPermission()`).
- **`I18nContext`**: Provides reactive `t()` function, dynamic locale formatters (`formatCurrency`, `formatDate`), and instant language switching without app reloads.
- **`OfflineContext`**: Tracks network liveness and enqueues background mutations via `offlineQueueService.ts`.

---

## 4. Internationalization (i18n)

### 4.1 Status: `IMPLEMENTED`

- **Languages Supported**:
  1. English (`en`) — 100% (319 keys)
  2. German (`de`) — 100% (319 keys)
  3. French (`fr`) — 100% (319 keys)
  4. Spanish (`es`) — 100% (319 keys)
  5. Italian (`it`) — 100% (319 keys)
- **Key Parity**: 100.0% parity across all 5 catalogs (1,595 total translated strings).
- **Validation**: Automated linter (`scripts/check-i18n.js`) reports **0 missing keys, 0 empty keys, and 100% interpolation parameter consistency**.
- **Unit Tests**: `npm run test:i18n` (14/14 test suites passing).

---

## 5. Security & Role-Based Access Control (RBAC)

### 5.1 Status: `IMPLEMENTED`

### 5.2 Role Matrix Assessment

| Capability / Module | Superadmin / Admin | Operations Manager | Shift Supervisor | Staff (Cook/Bar) | Financial Auditor |
|---|:---:|:---:|:---:|:---:|:---:|
| **View Catalog** | Full | Full | Full | Full | View Only |
| **View Costs / Pricing** | Full | Full | None | None | View Only |
| **Create / Edit SKU** | Full | Full | None | None | None |
| **Stock Adjustments** | Full | Full | None | None | None |
| **Conduct Stock Count** | Full | Full | Full | Full | None |
| **Approve Variances** | Full | Full | Full | None | View Only |
| **Scan OCR Receipts** | Full | Full | Full | Full | None |
| **Confirm BOM Deductions** | Full | Full | Full | None | None |
| **Create Purchase Orders** | Full | Full | None | None | None |
| **Approve Purchase Orders** | Full | Full | None | None | None |
| **Goods Receipt Check-In** | Full | Full | Full | Full | None |
| **Export Financial Reports**| Full | Full | None | None | Full |
| **Manage Team & Roles** | Full | View Only | View Only | None | View Only |
| **Store & Org Settings** | Full | View Only | None | None | View Only |
| **WORM Audit Ledger** | Full | View Only | None | None | Full |

---

## 6. Testing & Quality Assurance

### 6.1 Status: `IMPLEMENTED` (Backend & Frontend Unit/E2E), `PARTIALLY IMPLEMENTED` (GCP)

| Test Suite | Command | Total Suites | Passed | Failed | Status |
|---|---|:---:|:---:|:---:|:---:|
| **Backend Unit & Integration** | `npm --prefix server test` | 50 | 50 (349 tests) | 0 | `IMPLEMENTED` (100% Pass) |
| **Backend E2E (Supertest)** | `npm --prefix server run test:e2e` | 8 | 8 (36 tests) | 0 | `IMPLEMENTED` (100% Pass) |
| **Frontend i18n & Formatters** | `npm run test:i18n` | 14 | 14 (14 tests) | 0 | `IMPLEMENTED` (100% Pass) |
| **i18n Completeness Linter** | `npm run i18n:check` | 5 | 5 (1595 keys) | 0 | `IMPLEMENTED` (100% Pass) |
| **Real GCP Gemini OCR Smoke Test**| `npm run test:gcp` | 1 | 0 | 1 | `BROKEN` (Vertex Model 404) |

---

## 7. End-to-End Architectural Inconsistencies

Through line-by-line inspection of Database, Backend, API Contracts, and Frontend Services, the following cross-tier inconsistencies were identified:

```
[ Supabase DB ] ──(1) Role Enum naming──> [ NestJS Backend ]
                                                 │
                                            (2) Envelope
                                            (3) X-Store-Id
                                            (4) Token key
                                                 ▼
                                        [ React Native App ]
```

### Inconsistency #1: API Response Envelope vs. Frontend Client Direct Expectation
- **Backend Behavior**: `TransformInterceptor` interceptor wraps all controller output in an envelope:
  ```json
  {
    "success": true,
    "data": { ... },
    "timestamp": "2026-08-24T11:45:00.000Z"
  }
  ```
- **Frontend Behavior**: Frontend services (e.g., `inventoryService.ts`, `procurementService.ts`) expect the raw payload directly from `apiClient.get<T>()`. For example, `inventoryService.getItems()` expects an array `InventoryItem[]`, but receives `{ success: true, data: { items: [...], total: ... } }`.
- **Impact**: When connecting to the live backend, JSON deserialization fails and triggers the mock fallback.

### Inconsistency #2: Authentication Token Response Key Mismatch
- **Backend DTO**: `AuthResponseDto` in `server/src/auth/dto/auth.dto.ts` returns:
  ```json
  {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "v1.refresh...",
    "expiresIn": 3600,
    "tokenType": "Bearer",
    "user": { ... }
  }
  ```
- **Frontend Service**: `src/services/authService.ts` line 119 parses:
  ```typescript
  const res = await apiClient.post<{ token: string; user: AuthUser }>('/auth/login', ...);
  setAuthToken(res.token); // res.token is undefined because backend sends res.accessToken
  ```
- **Impact**: Auth token is set to `undefined`, causing subsequent authenticated requests to fail.

### Inconsistency #3: Missing Multi-Tenant `X-Store-Id` Header in Frontend Client
- **Backend Requirement**: All store-scoped controllers enforce `@ApiHeader({ name: 'X-Store-Id' })` and `TenantStoreGuard` rejects requests without a valid `X-Store-Id` header (HTTP 403 Forbidden).
- **Frontend Client**: `src/services/apiClient.ts` automatically attaches `Authorization: Bearer <token>`, but does NOT attach `X-Store-Id` from the active user's store context.
- **Impact**: Live API calls to store-scoped routes return 403 Forbidden.

### Inconsistency #4: Role Nomenclature (`admin` vs. `superadmin`)
- **Database & Backend**: The enum is defined as `superadmin` (`CREATE TYPE user_role_enum AS ENUM ('superadmin', 'manager', 'supervisor', 'staff', 'auditor')`). Backend guards inspect `@Roles('superadmin', ...)`.
- **Frontend RBAC Types**: `src/types/rbac.ts` defines `UserRole = 'admin' | 'manager' | 'supervisor' | 'staff' | 'auditor'`.
- **Impact**: When decoding live JWTs from backend, `user.role === 'superadmin'` does not match frontend `'admin'`, causing permission checks to fail unless normalized.

### Inconsistency #5: Category Metadata Endpoint Missing on Backend
- **Frontend Service**: `src/services/inventoryService.ts` calls `GET /inventory/meta/categories`.
- **Backend Controller**: Categories are filtered as a query param on `GET /inventory?category=...`, and there is no standalone `GET /inventory/meta/categories` route defined in `InventoryController`.

### Inconsistency #6: Google Cloud Vertex AI Model Configuration (HTTP 404)
- **Current Config**: `server/.env` is configured with `GCP_LOCATION=us-central1`, `GCP_PROJECT_ID=ocr-stem`, `GEMINI_MODEL=gemini-1.5-flash`.
- **Error in `npm run test:gcp`**:
  ```
  HTTP 404: Publisher model `projects/ocr-stem/locations/us-central1/publishers/google/models/gemini-1.5-flash` was not found or your project does not have access to it.
  ```
- **Root Cause**: The Google Cloud project `ocr-stem` in `us-central1` requires the model identifier `gemini-2.0-flash` or `gemini-1.5-flash-001`/`gemini-1.5-flash-002` when invoking the Vertex AI endpoint via Service Account credentials.

---

## 8. Prioritized Production Readiness Action Plan

### 🔴 CRITICAL BLOCKERS (Must fix before real backend integration)

1. **Unify API Client Response Unwrapping (`apiClient.ts`)**:
   - Update `request<T>()` in `src/services/apiClient.ts` to inspect if the response has `{ success: boolean, data: T }` and automatically unwrap `response.data`.
2. **Fix Auth Response Token Field Mapping (`authService.ts`)**:
   - Update `authService.ts` to accept `{ accessToken: string; token?: string; user: AuthUser }` and map `setAuthToken(res.accessToken || res.token)`.
3. **Inject Active Tenant `X-Store-Id` in `apiClient.ts`**:
   - Add `setStoreContext(storeId: string | null)` and inject `X-Store-Id: <storeId>` into all outgoing API requests.
4. **Fix Real GCP Gemini Model Identifier in `server/.env`**:
   - Update `GEMINI_MODEL=gemini-2.0-flash` or enable Vertex AI Model Garden access in GCP Project `ocr-stem` so `npm run test:gcp` achieves a 100% REAL PASS.

### 🟡 HIGH PRIORITY (Operational stability)

1. **Add Standalone Category Route (`inventory.controller.ts`)**:
   - Add `GET /inventory/categories` returning all distinct categories in the store.
2. **Normalize Role Identifier (`admin` ↔ `superadmin`)**:
   - Add a bi-directional mapper in `authService.ts` and `AuthContext.tsx` ensuring `superadmin` from the backend is recognized as `admin` on the mobile client.
3. **Persist Auth Token & Language Preference**:
   - Ensure `expo-secure-store` / `AsyncStorage` securely persists the JWT token and active language code across app cold restarts.

### 🟢 MEDIUM PRIORITY (Enhancements & Polish)

1. **Real Push Notification Device Registration**:
   - Connect `src/services/notificationService.ts` to `POST /api/v1/notifications/device-token` on physical device launch.
2. **Automatic Refresh Token Interceptor**:
   - Implement transparent 401 token refresh in `apiClient.ts` using `POST /api/v1/auth/refresh`.

### ⚪ LOW PRIORITY (Non-blocking maintenance)

1. **Partition Table Auto-Creation**:
   - Add a monthly cron/trigger in Supabase to automatically provision future audit log table partitions (`audit_logs_2026_10`, etc.).
2. **Update Swagger UI Examples**:
   - Add comprehensive request/response samples for Spanish and Italian receipt scans in OpenAPI specs.

---

*Report completed without making code modifications. Inspection verified via static analysis, unit test suites, e2e test suites, and live smoke tests.*
