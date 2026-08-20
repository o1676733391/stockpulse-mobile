# StockPulse Documentation Portal

Welcome to the **StockPulse** technical documentation library. This repository contains the canonical reference architecture, architectural decision records (ADRs), domain models, database schema, API specifications, and operational guides for the StockPulse cross-platform mobile application and multi-tenant backend cloud ecosystem.

---

## 🏛️ Master Architectural Source of Truth

- 🌟 **[Cloud-First Multi-Tenant SaaS Backend Architecture](file:///d:/Project%20Local/fnb-mobile/docs/architecture/SAAS_ARCHITECTURE_SOURCE_OF_TRUTH.md)** — **The Official Backend Source of Truth** for StockPulse. Covers multi-tenant shared-database architecture, organization & store hierarchies, Stripe subscription & metered OCR billing, multi-store RBAC, complete SaaS ERD, NestJS module boundaries, security architecture, and Cloud Run deployment.

---

## 📑 Architectural Decision Records (ADRs)

- **[ADR-001: Cloud-First Modular SaaS Architecture](file:///d:/Project%20Local/fnb-mobile/docs/decisions/ADR-001-architecture.md)** — Adoption of NestJS backend, Supabase PostgreSQL, and Expo React Native mobile client.
- **[ADR-002: Shared-Database Shared-Schema Multi-Tenancy](file:///d:/Project%20Local/fnb-mobile/docs/decisions/ADR-002-multi-tenancy.md)** — Row-Level Security (RLS) store isolation, dynamic tenant context, and partial unique indexing.
- **[ADR-003: Pluggable OCR Provider Abstraction](file:///d:/Project%20Local/fnb-mobile/docs/decisions/ADR-003-ocr-strategy.md)** — Google Cloud Document AI integration with extensible provider strategy for Gemini/Textract.
- **[ADR-004: Supabase Auth JWT with Mobile Biometrics and RBAC](file:///d:/Project%20Local/fnb-mobile/docs/decisions/ADR-004-auth-strategy.md)** — Asymmetric JWT validation, Refresh Token Rotation, Keychain/KeyStore biometrics, and 5-role RBAC.
- **[ADR-005: Supabase Managed Cloud Platform Integration](file:///d:/Project%20Local/fnb-mobile/docs/decisions/ADR-005-supabase-integration.md)** — PostgreSQL 16, S3-compatible private storage, and Realtime CDC WebSockets.

---

## 📚 Documentation Portals

### 1. [API Specifications Portal](file:///d:/Project%20Local/fnb-mobile/docs/api/README.md)
- **[Inventory OpenAPI 3.1 Specification](file:///d:/Project%20Local/fnb-mobile/docs/architecture/INVENTORY_OPENAPI_SPEC.yaml)** — Inventory listing, FEFO batches, adjustments, stock counting, and transaction ledger.
- **[Procurement OpenAPI 3.1 Specification](file:///d:/Project%20Local/fnb-mobile/docs/architecture/PROCUREMENT_OPENAPI_SPEC.yaml)** — Suppliers, POQ replenishment, PO approvals, and Goods Receipt influx.
- **[OCR & Document AI APIs](file:///d:/Project%20Local/fnb-mobile/docs/architecture/OCR_ARCHITECTURE.md)** — Presigned URLs, receipt scanning, and BOM deduction preview endpoints.

### 2. [Database & Storage Portal](file:///d:/Project%20Local/fnb-mobile/docs/database/README.md)
- **[Complete Supabase PostgreSQL Schema](file:///d:/Project%20Local/fnb-mobile/docs/architecture/SUPABASE_SCHEMA.md)** — PostgreSQL DDL, foreign keys, partial unique indexes, and audit fields.
- **[Row-Level Security (RLS) Policy Design](file:///d:/Project%20Local/fnb-mobile/docs/architecture/RLS_POLICY_DESIGN.md)** — Tenant store isolation and role permission matrices.
- **[Complete Domain Model Specification](file:///d:/Project%20Local/fnb-mobile/docs/architecture/DOMAIN_MODEL.md)** — 16 domain entities, TypeScript interface catalog, and ERD diagrams.
- **[Immutable Audit Logging System](file:///d:/Project%20Local/fnb-mobile/docs/architecture/AUDIT_LOGGING_SYSTEM.md)** — WORM audit ledger, HMAC-SHA256 chaining, and monthly partitioning.

### 3. [Architecture Blueprints](file:///d:/Project%20Local/fnb-mobile/docs/architecture/BACKEND_ARCHITECTURE.md)
- **[NestJS Module Structure & Engineering Standards](file:///d:/Project%20Local/fnb-mobile/docs/architecture/NESTJS_MODULE_STRUCTURE.md)** — Clean Architecture directory mapping, DTO validation, and service contracts.
- **[Notification Architecture Specification](file:///d:/Project%20Local/fnb-mobile/docs/architecture/NOTIFICATION_ARCHITECTURE.md)** — In-app inbox and Expo push notification dispatch.
- **[Production Deployment Architecture](file:///d:/Project%20Local/fnb-mobile/docs/architecture/DEPLOYMENT_ARCHITECTURE.md)** — Google Cloud Run hosting, environment isolation, and rollback runbooks.

---

## ⚖️ Compliance & Third-Party Licensing
- **[Third-Party Software & Open-Source Register](file:///d:/Project%20Local/fnb-mobile/docs/compliance/THIRD_PARTY_SOFTWARE.md)** — Complete audit register of third-party software, libraries, licenses, and commercial redistribution rights.
