# ADR-004: Supabase Auth JWT with Mobile Biometrics and 5-Role RBAC

## Status
**Accepted**

## Date
2026-08-20

## Context
StockPulse requires a secure, responsive authentication architecture supporting mobile floor staff, store managers, franchise owners, and external compliance auditors.

Key requirements:
- Asymmetric cryptographic JWT validation (stateless NestJS authorization without hitting the auth database on every API call).
- Fast, secure re-authentication on mobile devices using hardware biometrics (Face ID / Touch ID / Fingerprint) via Expo SecureStore.
- Fine-grained Role-Based Access Control (RBAC) across 5 primary roles (`SuperAdmin`, `Manager`, `Supervisor`, `Staff`, `Auditor`).
- Cryptographic link between Supabase `auth.users(id)` and domain `public.users(id)`.

## Decision
1. **Identity Provider**: Use **Supabase Auth (GoTrue)** issuing signed RS256/HS256 JWT access tokens (1-hour TTL) with Refresh Token Rotation (RTR).
2. **Stateless NestJS Verification**: NestJS `SupabaseAuthGuard` verifies the JWT signature locally via Supabase public key / secret and extracts `sub` (`user_id`), `role`, and assigned `store_ids`.
3. **5-Tier Authorization Pipeline**:
   - `SupabaseAuthGuard` (Verifies valid token)
   - `RolesGuard` (Evaluates `@Roles(...)` metadata)
   - `TenantStoreGuard` (Enforces `X-Store-Id` against assigned store list)
   - `PostgreSQL RLS` (Kernel-level database isolation)
4. **Mobile Biometrics**: Refresh tokens and device encryption keys are stored exclusively in iOS Keychain / Android KeyStore via `expo-secure-store`.

## Alternatives Considered

### Alternative 1: Custom Self-Hosted Authentication Service (Passport.js Local + Redis Sessions)
- *Pros*: Custom session storage; independent of Supabase Auth.
- *Cons*: High security maintenance burden (password hashing, rate-limiting, email verification, brute-force defense, OAuth compliance).
- *Rejected*: Re-inventing security primitives is error-prone and costly.

### Alternative 2: Auth0 / Okta
- *Pros*: Enterprise SSO features out of the box.
- *Cons*: Extremely expensive monthly active user (MAU) pricing for multi-location restaurant chains; does not integrate natively with PostgreSQL RLS policies.
- *Rejected*: Incompatible pricing model and added latency.

## Consequences
- **Positive**: Seamless integration with Supabase PostgreSQL and Storage RLS; robust security with zero maintenance burden for password hashing and email verification.
- **Negative / Trade-off**: Direct coupling to Supabase Auth user management APIs.
