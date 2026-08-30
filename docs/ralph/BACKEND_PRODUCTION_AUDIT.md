# StockPulse Backend Production Audit

## Document Purpose

This document is the master production-readiness specification for the
StockPulse backend.

It defines:

- required backend capabilities
- production acceptance criteria
- API requirements
- database requirements
- authentication requirements
- authorization requirements
- store isolation requirements
- external integrations
- testing requirements
- error handling
- production constraints
- definition of REAL_WORKING
- completion criteria

This document is NOT a progress report.

It defines WHAT must be working.

---

# 1. Production Philosophy

StockPulse must be evaluated using:

> ZERO TRUST IN MOCKED PASSES

A test passing does not prove that a feature works.

A feature is considered REAL_WORKING only when the actual execution
path works.

Expected architecture:

Client / Mobile
    ↓
Real HTTP API
    ↓
NestJS Controller
    ↓
NestJS Service
    ↓
Repository
    ↓
PostgreSQL / Real External Service
    ↓
Real Response
    ↓
Client State / UI

---

# 2. Production Classification

Every capability must be classified as one of:

## REAL_WORKING

The complete required execution path has been verified.

## PARTIAL

Some layers are implemented but the complete execution path is not
verified or is incomplete.

## MOCKED

The production implementation depends on mock/static/demo data.

## BROKEN

The feature exists but does not operate correctly.

## MISSING

The feature has not been implemented.

## BLOCKED

Implementation cannot be completed because of an external dependency.

## FALLBACK

Production code still converts real failures into fake/mock responses.

Target:

REAL_WORKING = all production-critical capabilities

MOCKED = 0

FALLBACK = 0

BROKEN = 0

MISSING = 0 for required features

---

# 3. Absolute Production Rules

## 3.1 No Production Mock Data

Production code MUST NOT use:

- mock users
- mock inventory
- mock recipes
- mock analytics
- mock team members
- mock store data
- hardcoded business data
- demo business data
- fake API responses

Test fixtures are allowed only inside explicit test infrastructure.

---

## 3.2 No Silent Fallback

Never do:

try {
    return await apiCall();
} catch {
    return mockData;
}

Never do:

if (apiError) {
    return [];
}

Never convert backend failure into fake success.

Real failures must remain observable.

---

## 3.3 No Fake Success

The UI/API must only report success after the real operation succeeds.

For mutations:

API success
≠ automatically database success

The database state must be verified where appropriate.

---

## 3.4 No Test Manipulation

Do not:

- remove failing tests
- skip failing tests
- weaken assertions
- mock the system under test
- modify expected results only to obtain PASS

Tests may be corrected if the test itself is objectively incorrect,
but the reason must be documented.

---

# 4. Authentication

The authentication system must use the existing authentication
architecture.

Verify:

- registration
- login
- logout
- session restoration
- email verification
- password recovery
- JWT validation
- expired session
- invalid session
- unauthorized access

The backend must correctly identify:

- user ID
- verified email
- store membership
- role
- permissions

Do not create a duplicate authentication system.

---

# 5. User / Profile

Verify:

- get current user
- get user profile
- update profile
- phone number
- email
- credentials where applicable
- role
- store membership

Profile information must come from the authoritative backend/database
rather than static frontend state.

---

# 6. Store Management

Required capabilities:

- create store
- retrieve store
- update store
- store ownership
- store membership
- store isolation

Business rules must prevent:

- unauthorized store creation
- duplicate ownership where prohibited
- invalid store relationships
- unauthorized store modification

A user must not be able to manipulate another store by changing
store_id in the request.

---

# 7. Team Management

Required:

- list team members
- retrieve member
- invite member
- change member role
- remove member
- membership status

Role changes must persist.

Removing a member must revoke their access to store resources.

---

# 8. Staff Invitation

Implement production-grade invitation onboarding.

Invitation must contain:

- store_id
- invited email
- role
- secure invitation code/hash
- status
- expiration
- created_by
- accepted_by
- accepted_at
- revoked_at
- timestamps

Statuses:

- PENDING
- ACCEPTED
- EXPIRED
- REVOKED

Rules:

1. Invitation belongs to one store.
2. Invitation is bound to an email.
3. Authenticated email must match invitation email.
4. Invitation code is one-time use.
5. Expired invitations cannot be accepted.
6. Revoked invitations cannot be accepted.
7. Accepted invitations cannot be reused.
8. Invitation validation must be rate limited.
9. Only authorized administrators can create invitations.
10. Staff cannot assign themselves a role.
11. Staff cannot select an arbitrary store.
12. Backend is authoritative.

---

# 9. RBAC

Roles:

- admin
- manager
- supervisor
- staff
- auditor

Permissions must be enforced server-side.

Frontend visibility is NOT security.

For protected endpoints verify:

- authentication
- store membership
- role
- permission

Test both allowed and denied operations.

---

# 10. Store / Tenant Isolation

This is a mandatory production requirement.

A user belonging to Store A must not access Store B data.

Audit:

- users
- inventory
- batches
- stock counts
- recipes
- BOM
- waste
- procurement
- purchase orders
- analytics
- team
- store settings

Test explicit cross-store access attempts.

Expected result:

403 or appropriate authorization response.

Never return Store B data.

---

# 11. Inventory

Verify real PostgreSQL execution for:

- inventory listing
- pagination
- item details
- batches
- stock adjustments
- stock counts
- discrepancies
- expiration
- FEFO
- waste

No mock inventory.

No static inventory.

No fallback inventory.

---

# 12. Recipes / BOM

Verify:

- create recipe
- retrieve recipe
- update recipe
- delete/archive recipe
- recipe ingredients
- ingredient quantities
- BOM calculation
- inventory deduction

Expected conceptual flow:

Recipe
+
Ingredients
+
Quantities
    ↓
BOM
    ↓
POS / Production event
    ↓
Inventory deduction
    ↓
PostgreSQL

Do not use static mockRecipes.

---

# 13. Procurement

Verify:

- purchase orders
- PO creation
- PO submission
- PO approval
- PO status lifecycle
- POQ recommendations
- goods receipt
- inventory batch creation

Role restrictions must be enforced.

All mutations must persist.

---

# 14. Analytics

Analytics must use real data.

Do not use:

- static chart values
- mock valuation
- fake revenue
- fake inventory valuation
- fake analytics responses

Verify calculations against database state.

---

# 15. Gemini / OCR

The production OCR path must use the configured real provider.

Expected:

Camera / Upload
    ↓
Backend
    ↓
Gemini / Vertex AI
    ↓
Structured result
    ↓
Business processing
    ↓
Database

External failures must remain real failures.

Do not replace provider calls with fake OCR responses.

---

# 16. API Contract

Every frontend API call must match the backend.

Verify:

- HTTP method
- route
- parameters
- request DTO
- response DTO
- authentication
- error response

Example:

Frontend:

GET /users/index

Backend:

GET /users

This is a contract defect and must be fixed at the correct layer.

Do not create unnecessary duplicate endpoints.

---

# 17. Error Handling

Verify:

400 validation error
401 authentication error
403 authorization error
404 resource not found
409 conflict
429 rate limit
500 unexpected error

Also test:

- invalid input
- duplicate resource
- missing resource
- expired session
- invalid token
- wrong store
- insufficient permissions
- network failure
- external provider failure

Errors must never become mock data.

---

# 18. Database Integrity

Inspect:

- foreign keys
- unique constraints
- indexes
- nullability
- transactions
- cascading behavior

Pay special attention to:

user
store
membership
role
invitation
recipe
recipe ingredients
inventory
purchase order

Multi-step mutations should use transactions where required.

---

# 19. Testing Requirements

Maintain:

## Unit Tests

Business logic in isolation.

## Integration Tests

Real NestJS components with a real test database where appropriate.

## E2E Tests

Real HTTP API execution.

Important features must not be considered complete from unit tests
alone.

---

# 20. Real Verification

For every important feature verify:

1. Authenticate real test user.
2. Execute real HTTP request.
3. Verify HTTP response.
4. Verify database state.
5. Query the API again.
6. Verify returned state.
7. Test authorization.
8. Test wrong-store access.
9. Test validation failures.
10. Test conflict/duplicate cases.

---

# 21. Priority

## P0

- authentication
- authorization
- store isolation
- data corruption
- production fallback
- critical API failures

## P1

- major missing features
- broken repositories
- incomplete persistence
- API contract failures
- important business workflows

## P2

- validation
- error handling
- performance
- API consistency

## P3

- refactoring
- cleanup
- documentation

P0 must be resolved before P1.

P1 before P2.

---

# 22. Definition of Complete

A feature is COMPLETE only when:

- implementation exists
- no production mock
- no fallback
- real API works
- database state is correct
- authentication works
- authorization works
- store isolation works
- error cases work
- appropriate tests pass
- real verification exists

---

# 23. Final Production Criteria

The backend can only be considered production-ready when:

- P0 issues = 0
- P1 issues = 0 or explicitly BLOCKED
- production fallback = 0
- production mock data = 0
- required repository stubs = 0
- authentication verified
- authorization verified
- store isolation verified
- critical APIs verified
- database mutations verified
- integration tests verified
- E2E/API smoke tests verified
- error paths verified
- external integrations verified or documented as BLOCKED

Never declare production-ready without evidence.