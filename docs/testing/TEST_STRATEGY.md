# StockPulse — Test Strategy & Quality Assurance Architecture

## 1. Executive Summary
StockPulse is a cloud-first SaaS platform for F&B inventory intelligence, FEFO batch tracking, and Document AI OCR processing. Because inventory accuracy directly impacts cost of goods sold (COGS), shrinkage liability, and food safety compliance, StockPulse enforces a rigorous, multi-layered automated testing strategy.

---

## 2. Test Pyramid & Quality Layers

```
                                  ┌───────────────────────────┐
                                  │      E2E Workflows        │ 5%
                                  ├───────────────────────────┤
                                  │   Mobile UI & Component   │ 15%
                                  ├───────────────────────────┤
                                  │  API & HTTP Integration   │ 30%
                                  ├───────────────────────────┤
                                  │  Domain & Unit Test Suites│ 50%
                                  └───────────────────────────┘
```

### Layer 1: Domain & Unit Tests (50% of Suite)
- **Target**: Domain entities, calculations (shrinkage, variance tiering, BOM scaling), finite state machines, and repository mapping logic.
- **Execution Target**: `< 50ms` per suite, 100% offline with no network or live database dependencies.
- **Tools**: Jest, `ts-jest`, `@nestjs/testing`.

### Layer 2: API & Integration Tests (30% of Suite)
- **Target**: HTTP controllers, request validation pipes, JWT authentication guards, tenant isolation filters, and error formatting.
- **Execution Target**: Tests endpoint contracts, headers (`Authorization`, `X-Store-Id`), status codes (`200`, `201`, `400`, `401`, `403`, `404`, `409`), and payload structures.
- **Tools**: `supertest`, NestJS `Test.createTestingModule()`.

### Layer 3: Mobile Component & Hook Tests (15% of Suite)
- **Target**: React Native components, KPI cards, status badges, barcode scan sheets, form validation, and offline cache hooks.
- **Execution Target**: Validates UI hierarchy, state management, accessibility, and user interactions without physical devices.
- **Tools**: Jest Expo, `@testing-library/react-native`.

### Layer 4: End-to-End Workflows (5% of Suite)
- **Target**: Full business lifecycle flows:
  * User Registration $\rightarrow$ Store Assignment $\rightarrow$ Inventory Creation.
  * Goods Receipt $\rightarrow$ FEFO Batch Generation $\rightarrow$ Stock Balance & Audit Ledger Sync.
  * POS Z-Report Scan $\rightarrow$ Document AI Extraction $\rightarrow$ BOM Ingredient Deductions.
  * Stock Count $\rightarrow$ Variance Calculation $\rightarrow$ Shrinkage Approval.
  * Purchase Order State Lifecycle (`Draft` $\rightarrow$ `Submitted` $\rightarrow$ `Approved` $\rightarrow$ `Received`).

---

## 3. Testing Principles & Rules

### 1. Deterministic & Isolated Fixtures
- All test fixtures must use static, seeded UUIDs, deterministic timestamps, and reproducible values.
- Never use random generators that could cause flaky non-deterministic assertions.

### 2. Multi-Tenant Boundary Verification
- Every store-scoped endpoint must include tests asserting that querying Store A with a token for Store B returns `403 Forbidden` or empty results. Data bleeding across tenants is a critical regression.

### 3. Zero Secrets & Data Privacy
- **Rule**: Never commit live API keys, Supabase service keys, real user passwords, or actual customer receipt images into test files.
- Mock JWT secrets must use fixed non-production strings (e.g. `test-jwt-secret-key-1234567890`).

### 4. Regression Testing for Bug Fixes
- Every bug logged in [`docs/debugging/BUG_LOG.md`](file:///d:/Project%20Local/fnb-mobile/docs/debugging/BUG_LOG.md) must be accompanied by a dedicated test case that reproduces the original defect and proves the fix.

---

## 4. Coverage Targets & Quality Gates

| Metric | Target | Enforced By |
|---|---|---|
| Domain Unit Line Coverage | $\ge 90\%$ | Jest coverage threshold |
| Controller & Guard Coverage | $\ge 85\%$ | CI Pipeline Quality Gate |
| Critical State Machine Coverage | $100\%$ | Pull Request Automated Check |
| Cryptographic Hash Chain Verifications | $100\%$ | Unit + Integration Suite |
| TypeScript Compiler Errors | `0 errors` | `tsc --noEmit` in CI |
| Linter Warnings / Errors | `0 errors` | `npm run lint` in CI |
