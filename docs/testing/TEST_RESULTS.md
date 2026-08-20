# StockPulse — Automated Test Execution Baseline Report

## Summary
- **Total Test Suites Executed**: 33 (28 Unit + 5 API E2E)
- **Total Automated Tests**: 168
- **Pass Rate**: 100% (168 passed, 0 failed, 0 skipped)
- **Compilation Status**: 0 TypeScript errors (`npm run build` exits with code 0)
- **OpenAPI Schema Check**: 100% synchronized with controllers

---

## 1. Unit Test Suites (28 Suites, 152 Tests)

```bash
PASS src/notifications/providers/expo-push.provider.spec.ts
PASS src/audit/audit.repository.spec.ts
PASS src/notifications/notifications.repository.spec.ts
PASS src/audit/audit.service.spec.ts
PASS src/notifications/notifications.service.spec.ts
PASS src/audit/audit.controller.spec.ts
PASS src/notifications/notifications.controller.spec.ts
PASS src/suppliers/suppliers.controller.spec.ts
PASS src/auth/auth.controller.spec.ts
PASS src/ocr/ocr.controller.spec.ts
PASS src/ocr/ocr.service.spec.ts
PASS src/inventory/inventory.controller.spec.ts
PASS src/stock-count/stock-count.controller.spec.ts
PASS src/procurement/procurement.controller.spec.ts
PASS src/procurement/procurement.service.spec.ts
PASS src/inventory/inventory.repository.spec.ts
PASS src/auth/auth.service.spec.ts
PASS src/common/guards/supabase-auth.guard.spec.ts
PASS src/ocr/ocr.repository.spec.ts
PASS src/ocr/providers/google-document-ai.provider.spec.ts
PASS src/stock-count/stock-count.repository.spec.ts
PASS src/procurement/procurement.repository.spec.ts
PASS src/suppliers/suppliers.service.spec.ts
PASS src/stock-count/stock-count.service.spec.ts
PASS src/inventory/inventory.service.spec.ts
PASS src/common/guards/permissions.guard.spec.ts
PASS src/common/guards/roles.guard.spec.ts
PASS src/common/guards/tenant-store.guard.spec.ts

Test Suites: 28 passed, 28 total
Tests:       152 passed, 152 total
Time:        15.811 s
```

---

## 2. API End-to-End Test Suites (5 Suites, 16 Tests)

```bash
PASS test/api/notifications.e2e-spec.ts
PASS test/api/inventory.e2e-spec.ts
PASS test/api/procurement.e2e-spec.ts
PASS test/api/audit.e2e-spec.ts
PASS test/api/auth.e2e-spec.ts

Test Suites: 5 passed, 5 total
Tests:       16 passed, 16 total
Time:        7.697 s
```
