# StockPulse — Bug Log & Regression Test Register

## Purpose
This document tracks reported bugs, root causes, resolution steps, and corresponding regression test cases. Every bug fixed must have a reproducible regression test.

---

## Bug Registry

### [BUG-001] Tickets Type Incompatibility in ExpoPushNotificationProvider
- **Date**: 2026-08-20
- **Module**: Notifications Module
- **Severity**: Low (TypeScript Build Error)
- **Description**: The `tickets` array in `sendBatch` had inferred `never[]` type on empty initialization, causing `tsc` error TS2345 when pushing `{ status: 'ok' }` objects.
- **Root Cause**: Missing explicit `PushNotificationTicket[]` type annotation on local variable.
- **Fix**: Added `const tickets: PushNotificationTicket[] = [];`.
- **Regression Test**: `src/notifications/providers/expo-push.provider.spec.ts` -> `"should handle batch push notifications"`.
- **Status**: Verified & Fixed.

### [BUG-002] Purchase Order State Transition Skip Protection
- **Date**: 2026-08-20
- **Module**: Procurement Module
- **Severity**: High (State Machine Integrity)
- **Description**: Ensure `draft` purchase orders cannot be received directly without intermediate approval.
- **Root Cause**: Need strict validation in `receiveGoods` method checking for `approved` status.
- **Fix**: Added explicit guard throwing `BadRequestException` if linked PO is not `approved`.
- **Regression Test**: `src/procurement/procurement.service.spec.ts` -> `"should throw BadRequestException if receiving goods against unapproved draft PO"`.
- **Status**: Verified & Fixed.

---

## Bug Report Template

```markdown
### [BUG-XXX] Short Title
- **Date**: YYYY-MM-DD
- **Module**: [Auth | Inventory | Stock Count | OCR | Procurement | Notifications | Audit]
- **Severity**: [Critical | High | Medium | Low]
- **Description**: Detailed description of defect and observed behavior.
- **Root Cause**: Technical analysis of why the bug occurred.
- **Fix**: Code changes and files modified.
- **Regression Test**: File path and test description proving resolution.
- **Status**: [Open | In Progress | Verified & Fixed]
```
