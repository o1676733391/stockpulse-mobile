# ADR-001: Cloud-First Modular SaaS Architecture (NestJS + Supabase + Expo)

## Status
**Accepted**

## Date
2026-08-20

## Context
StockPulse is a cloud-first, mobile-first SaaS platform purpose-built for the Food & Beverage (F&B) industry to automate inventory tracking, recipe Bill of Materials (BOM) theoretical consumption, and AI-powered receipt OCR reconciliation.

Key requirements:
- Native iOS and Android mobile experience with offline resilience and hardware biometric authentication.
- Enterprise-grade backend with modular bounded contexts, strong typing, and dependency injection.
- Scalable, managed database infrastructure with ACID transactions, Row-Level Security (RLS), and Realtime Change Data Capture (CDC).
- Fast time-to-market with low operational overhead and multi-store tenant isolation.

## Decision
Adopt a decoupled three-tier SaaS architecture:
1. **Frontend**: **Expo (React Native + TypeScript)** for cross-platform mobile native performance, SecureStore biometrics, and offline-first caching.
2. **Backend**: **NestJS (Node.js + TypeScript)** adhering to Clean Architecture, Dependency Injection, and the Repository Pattern, containerized on **Google Cloud Run**.
3. **Database & Auth**: **Supabase (PostgreSQL 16 + GoTrue Auth + S3 Storage + Realtime WebSockets)** for managed database operations, tenant RLS isolation, and live synchronization.

## Alternatives Considered

### Alternative 1: Direct Client-to-Supabase Architecture (No Dedicated Backend)
- *Pros*: Faster initial prototyping; fewer backend services to deploy.
- *Cons*: Business logic (BOM calculation, fuzzy recipe matching, POQ replenishment formulas) leaks into client code; difficulty integrating third-party AI/OCR APIs (Google Cloud Document AI) securely without exposing service credentials.
- *Rejected*: Insufficient security, complex audit logging, and lack of backend domain encapsulation.

### Alternative 2: Express.js Monolith with Self-Hosted SQLite/PostgreSQL on AWS EC2
- *Pros*: Total infrastructure control; low third-party SaaS dependency.
- *Cons*: High DevOps maintenance overhead; lacking structured dependency injection; manual WebSocket and storage pipeline implementation.
- *Rejected*: Unnecessary ops burden that slows feature delivery and scales poorly.

## Consequences
- **Positive**: Clean separation of concerns with domain modules; type safety from database to mobile client; built-in Swagger OpenAPI docs and RFC 7807 problem details.
- **Positive**: Serverless deployment via Google Cloud Run with zero idle costs and multi-region scaling.
- **Negative / Trade-off**: Requires maintaining both NestJS backend models and Supabase PostgreSQL schema migrations in sync.
