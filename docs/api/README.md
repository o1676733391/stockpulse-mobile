# StockPulse — API Specifications & OpenAPI Catalog

Welcome to the **StockPulse REST API Documentation Library**. This directory contains OpenAPI 3.1 specifications, request/response DTO schemas, and endpoint interaction catalogs.

---

## 📚 API Specifications

1. **[Inventory OpenAPI 3.1 Specification](file:///d:/Project%20Local/fnb-mobile/docs/architecture/INVENTORY_OPENAPI_SPEC.yaml)**
   - Item catalog, category management, FEFO batch tracking, and status calculations.
   - Manual stock adjustments with reason codes and cost impact.
   - Multi-user blind stock count sessions and submission.
   - Variance shrinkage calculations and supervisor approval ledger sync.
   - Append-only immutable transaction ledger history.

2. **[Procurement OpenAPI 3.1 Specification](file:///d:/Project%20Local/fnb-mobile/docs/architecture/PROCUREMENT_OPENAPI_SPEC.yaml)**
   - Supplier master directory, payment terms, and lead times.
   - Algorithmic POQ (Purchase Order Quantity) replenishment recommendations.
   - Purchase Order lifecycle (Draft, Manager Approval, PDF Supplier Dispatch, Cancellation).
   - Goods Receipt delivery check-in, short-shipment discrepancy detection, and FEFO batch creation.

3. **[OCR & Document AI APIs](file:///d:/Project%20Local/fnb-mobile/docs/architecture/OCR_ARCHITECTURE.md)**
   - Presigned upload URL generation (`POST /api/v1/ocr/presigned-upload`).
   - Document AI scan execution (`POST /api/v1/ocr/scan`).
   - Report review & line item correction (`PATCH /api/v1/ocr/reports/:id/items/:itemId`).
   - Confirmation & atomic BOM stock deduction (`POST /api/v1/ocr/reports/:id/confirm`).

---

## 🔒 Universal Request Protocols

| Header | Format | Purpose |
|---|---|---|
| `Authorization` | `Bearer <JWT>` | Supabase Auth JWT Access Token |
| `X-Store-Id` | `UUID` | Active store location context |
| `Idempotency-Key` | `UUIDv4` | Mutation deduplication key |
| `If-Match` | `string` | Optimistic concurrency version tag (e.g. `"v14"`) |
