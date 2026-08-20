# ADR-005: Supabase Managed Cloud Platform Integration (PostgreSQL 16, Storage, Realtime CDC)

## Status
**Accepted**

## Date
2026-08-20

## Context
StockPulse requires real-time synchronization between kitchen staff conducting stock counts, shift supervisors scanning POS receipts, and store managers placing purchase orders.

Key requirements:
- High-concurrency relational data store with full ACID guarantees.
- Sub-second real-time change data capture (CDC) streaming to mobile devices.
- Private, S3-compatible encrypted object storage for scanned receipt images and PDF export bundles.
- Local offline development emulation matching production cloud capabilities.

## Decision
Adopt **Supabase Managed Cloud Platform (Pro/Enterprise Tier)**:
1. **PostgreSQL 16**: Managed engine with automated daily backups, point-in-time recovery (PITR), and connection pooling (Supavisor).
2. **Supabase Realtime**: Listen to PostgreSQL Write-Ahead Log (WAL) replication streams over WebSockets for instant inventory balance and count status updates on mobile.
3. **Supabase Storage**: S3-compatible private buckets (`receipts-private`, `exports-private`) with client uploads mediated via short-lived signed URLs.
4. **Local Development**: Supabase Local CLI (`supabase start` / `supabase db diff`) running containerized PostgreSQL, GoTrue, and Storage for zero-drift development.

## Alternatives Considered

### Alternative 1: AWS RDS PostgreSQL + AWS S3 + Redis Pub/Sub WebSockets
- *Pros*: Maximum granularity of AWS infrastructure configuration.
- *Cons*: Requires authoring, deploying, and maintaining custom WebSocket servers, S3 signed URL generators, and IAM policies; higher monthly base infrastructure cost.
- *Rejected*: Slower development velocity and higher maintenance overhead.

### Alternative 2: Firebase Firestore + Cloud Storage + Cloud Functions
- *Pros*: Native mobile SDK with offline replication.
- *Cons*: NoSQL document model is poorly suited for relational inventory math, complex BOM joins, multi-table transactions, and strict accounting audits.
- *Rejected*: Inadequate for financial and physical inventory reconciliation.

## Consequences
- **Positive**: Single unified backend infrastructure vendor for PostgreSQL, Auth, Storage, and Realtime; unified Row-Level Security across database and storage layers.
- **Negative / Trade-off**: Vendor dependency on Supabase; mitigated by using standard PostgreSQL DDL, standard S3 APIs, and standard OpenAPI REST protocols.
