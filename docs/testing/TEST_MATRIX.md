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
| **BOM Deduction** | Valid BOM Recipe Calculation | ✅ | ✅ | — | ✅ | Complete |
| **BOM Deduction** | Multi-Ingredient Recipe Aggregation | ✅ | ✅ | — | ✅ | Complete |
| **BOM Deduction** | Fractional Quantities & Waste Factors | ✅ | ✅ | — | ✅ | Complete |
| **BOM Deduction** | Missing & Incomplete BOM Handling | ✅ | ✅ | — | ✅ | Complete |
| **BOM Deduction** | Exact Stock to Zero Deductions | ✅ | ✅ | — | ✅ | Complete |
| **BOM Deduction** | Insufficient Stock Out Warnings | ✅ | ✅ | — | ✅ | Complete |
| **BOM Deduction** | **Transaction Atomicity & Rollback** | ✅ | ✅ | — | ✅ | Complete |
| **Stock Count**| Blind Count (Hidden Expected Stock) | ✅ | ✅ | ✅ | ✅ | Complete |
| **Stock Count**| Multi-Item Counting & Input | ✅ | ✅ | ✅ | ✅ | Complete |
| **Stock Count**| Variance & Discrepancy Tiering | ✅ | ✅ | ✅ | ✅ | Complete |
| **Stock Count**| Variance Approval & Ledger Sync | ✅ | ✅ | — | ✅ | Complete |
| **OCR Phase** | Presigned S3/Storage Upload | ✅ | ✅ | ✅ | ✅ | Complete |
| **OCR Phase** | File Size Limit (< 10MB) & Mime Types| ✅ | ✅ | — | ✅ | Complete |
| **OCR Phase** | Mock Provider Isolation (0 Cloud Calls)| ✅ | ✅ | — | ✅ | Complete |
| **OCR Phase** | Gemini Vision Multimodal Extraction | ✅ | ✅ | — | ✅ | Complete |
| **OCR Phase** | Document AI Provider Abstraction | ✅ | ✅ | — | ✅ | Complete |
| **OCR Phase** | Low Quality, Blurry & Cropped Layouts| ✅ | ✅ | — | ✅ | Complete |
| **OCR Phase** | Line Item Correction & Quantity Edit| ✅ | ✅ | ✅ | ✅ | Complete |
| **OCR Phase** | Review Confirmation & BOM Deductions| ✅ | ✅ | — | ✅ | Complete |
| **OCR Phase** | Review Rejection without Deductions | ✅ | ✅ | — | ✅ | Complete |
| **OCR Phase** | Provider Error & Failure Resilience | ✅ | ✅ | — | ✅ | Complete |
| **Procurement**| Supplier Directory CRUD & Archiving | ✅ | ✅ | ✅ | ✅ | Complete |
| **Procurement**| Supplier RBAC Authorization Guards | ✅ | ✅ | — | ✅ | Complete |
| **Procurement**| PO State Transitions (FSM) | ✅ | ✅ | ✅ | ✅ | Complete |
| **Procurement**| PO State Transition Bypass Protection | ✅ | ✅ | — | ✅ | Complete |
| **Procurement**| PO Drafting & Line Validation | ✅ | ✅ | ✅ | ✅ | Complete |
| **Procurement**| Partial & Full Goods Receipt | ✅ | ✅ | ✅ | ✅ | Complete |
| **Procurement**| Goods Receipt Inventory Sync & Atomicity| ✅ | ✅ | — | ✅ | Complete |
| **Notifications**| Notification Creation & Unread Badges | ✅ | ✅ | ✅ | ✅ | Complete |
| **Notifications**| Mark as Read & Batch Mark All Read | ✅ | ✅ | ✅ | ✅ | Complete |
| **Notifications**| Low Stock Alert Trigger | ✅ | ✅ | — | ✅ | Complete |
| **Notifications**| Batch Expiry Warning Trigger (FEFO) | ✅ | ✅ | — | ✅ | Complete |
| **Notifications**| PO & Goods Receipt Status Triggers | ✅ | ✅ | — | ✅ | Complete |
| **Notifications**| User Channel & Quiet Hours Preferences | ✅ | ✅ | ✅ | ✅ | Complete |
| **Notifications**| Mocked Expo Push Notification Provider | ✅ | ✅ | — | ✅ | Complete |
| **Audit** | SHA-256 Hash Chaining | ✅ | ✅ | — | ✅ | Complete |
| **Audit** | WORM Immutability Protection | ✅ | ✅ | — | ✅ | Complete |
| **Audit** | Cryptographic Chain Verification | ✅ | ✅ | — | ✅ | Complete |
| **Audit** | Store-level Log Filtering | ✅ | ✅ | — | ✅ | Complete |

---

## 2. Test Execution Profiles

| Suite Profile | Target Commands | Environment | Execution Time |
|---|---|---|---|
| **Unit & Domain Tests** | `npm test` in `server/` | Node.js (Mocked) | ~25s |
| **API End-to-End** | `npm run test:e2e` in `server/` | In-memory NestJS Test Server | ~19s |
| **Mobile Tests** | `npm test` in root | Jest Expo Sandbox | ~5s |
| **CI Quality Gate** | Multi-stage GitHub Actions | Headless Ubuntu Runner | < 2 min |
