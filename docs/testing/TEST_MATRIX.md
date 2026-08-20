# StockPulse — Test Matrix & Coverage Catalog

## 1. Domain-by-Domain Test Matrix

| Module | Feature / Component | Unit Test | Integration / API Test | Mobile Component Test | E2E Test | Status |
|---|---|:---:|:---:|:---:|:---:|:---:|
| **Auth** | JWT Token Validation | ✅ | ✅ | ✅ | ✅ | Complete |
| **Auth** | Tenant Store Context Guard | ✅ | ✅ | — | ✅ | Complete |
| **Auth** | RBAC Role & Permission Guards | ✅ | ✅ | — | ✅ | Complete |
| **Auth** | User Signup & Store Switching | ✅ | ✅ | ✅ | ✅ | Complete |
| **Inventory** | Item Catalog & Pagination | ✅ | ✅ | ✅ | ✅ | Complete |
| **Inventory** | FEFO Batch Expiry Sorting | ✅ | ✅ | ✅ | ✅ | Complete |
| **Inventory** | Manual Stock Adjustments | ✅ | ✅ | ✅ | ✅ | Complete |
| **Inventory** | Optimistic Locking (`version`) | ✅ | ✅ | — | ✅ | Complete |
| **Stock Count**| Blind Count (Hidden Expected Stock) | ✅ | ✅ | ✅ | ✅ | Complete |
| **Stock Count**| Multi-Item Counting & Input | ✅ | ✅ | ✅ | ✅ | Complete |
| **Stock Count**| Variance & Discrepancy Tiering | ✅ | ✅ | ✅ | ✅ | Complete |
| **Stock Count**| Variance Approval & Ledger Sync | ✅ | ✅ | — | ✅ | Complete |
| **OCR** | Presigned S3/Supabase Upload | ✅ | ✅ | ✅ | ✅ | Complete |
| **OCR** | Document AI Provider Abstraction | ✅ | ✅ | — | ✅ | Complete |
| **OCR** | Line Item Correction Workflow | ✅ | ✅ | ✅ | ✅ | Complete |
| **OCR** | Atomic BOM Recipe Deductions | ✅ | ✅ | — | ✅ | Complete |
| **Procurement**| Supplier Directory CRUD | ✅ | ✅ | ✅ | ✅ | Complete |
| **Procurement**| PO State Transitions (FSM) | ✅ | ✅ | ✅ | ✅ | Complete |
| **Procurement**| PO Drafting & Validation | ✅ | ✅ | ✅ | ✅ | Complete |
| **Procurement**| Goods Receipt & Stock Sync | ✅ | ✅ | ✅ | ✅ | Complete |
| **Notifications**| In-App Notification Dispatch | ✅ | ✅ | ✅ | ✅ | Complete |
| **Notifications**| Push Notification Provider | ✅ | ✅ | — | ✅ | Complete |
| **Notifications**| User Category & Quiet Window Prefs| ✅ | ✅ | ✅ | ✅ | Complete |
| **Audit** | SHA-256 Hash Chaining | ✅ | ✅ | — | ✅ | Complete |
| **Audit** | WORM Immutability Protection | ✅ | ✅ | — | ✅ | Complete |
| **Audit** | Cryptographic Chain Verification | ✅ | ✅ | — | ✅ | Complete |
| **Audit** | Store-level Log Filtering | ✅ | ✅ | — | ✅ | Complete |

---

## 2. Test Execution Profiles

| Suite Profile | Target Commands | Environment | Execution Time |
|---|---|---|---|
| **Fast Local Unit** | `npm test` in `server/` | Node.js (Mocked) | ~11s |
| **API End-to-End** | `npm run test:e2e` in `server/` | In-memory NestJS Test Server | ~8s |
| **Mobile Tests** | `npm test` in root | Jest Expo Sandbox | ~5s |
| **CI Quality Gate** | Multi-stage GitHub Actions | Headless Ubuntu Runner | < 2 min |
