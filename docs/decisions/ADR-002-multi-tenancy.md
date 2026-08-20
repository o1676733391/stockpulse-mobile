# ADR-002: Shared-Database Shared-Schema Multi-Tenancy with PostgreSQL Row-Level Security

## Status
**Accepted**

## Date
2026-08-20

## Context
StockPulse serves restaurant groups, franchises, and multi-unit chains. The system requires strict tenant isolation at two hierarchical levels:
1. **Organization Tier**: Multi-unit restaurant group (e.g. *Bella Cucina Hospitality Group*), holding Stripe subscriptions and global users.
2. **Store Tier**: Individual kitchen/branch location (e.g. *Berlin Mitte*, *Munich West*), holding isolated inventory balances, suppliers, recipes, and team shifts.

Key constraints:
- Zero cross-store data leakage.
- Low infrastructure cost when scaling from 10 to 1,000+ stores.
- Ability for franchise managers/superadmins to query aggregated reports while floor staff are restricted to their active store.

## Decision
Implement **Shared-Database, Shared-Schema Multi-Tenancy** enforced at the PostgreSQL kernel level using **Row-Level Security (RLS)**:
- Every tenant table includes `store_id UUID NOT NULL REFERENCES stores(id)` and/or `organization_id UUID NOT NULL REFERENCES organizations(id)`.
- Tenant context is passed via `X-Store-Id` HTTP headers, validated by NestJS `TenantStoreGuard`, and bound in PostgreSQL transactions using `SET LOCAL app.current_store_id = '<storeId>'`.
- Declarative PostgreSQL RLS policies evaluate `store_id = get_auth_store_id() OR is_superadmin()`.
- Partial unique indexes enforce uniqueness within the active store context (e.g. `UNIQUE (store_id, sku) WHERE deleted_at IS NULL`).

## Alternatives Considered

### Alternative 1: Database-per-Tenant (Isolated Databases)
- *Pros*: Maximum physical isolation; easy per-tenant backups.
- *Cons*: Prohibitive infrastructure costs; complex connection pool management; running migrations across 500+ databases is slow and error-prone.
- *Rejected*: Over-engineered and commercially unviable for multi-location SMBs.

### Alternative 2: Schema-per-Tenant (PostgreSQL Schemas)
- *Pros*: Logical separation within one database instance.
- *Cons*: PostgreSQL table cache bloat at $> 200$ schemas; complex cross-store analytics and reporting for franchise owners.
- *Rejected*: Inefficient scaling profile for restaurant chains.

### Alternative 3: Application-Only Filtering (`WHERE store_id = ?`)
- *Pros*: Simple SQL queries without database-level RLS policies.
- *Cons*: Vulnerable to developer error; a single missing `WHERE` clause can cause a catastrophic cross-tenant data leak.
- *Rejected*: Unacceptable security risk.

## Consequences
- **Positive**: Guaranteed database-level isolation; cost-effective shared infrastructure; simplified aggregated analytics for SuperAdmins.
- **Positive**: Works natively with Supabase Realtime CDC and Supabase Storage RLS.
- **Negative / Trade-off**: Requires careful indexing on `(store_id, ...)` and session variable injection on every database transaction.
