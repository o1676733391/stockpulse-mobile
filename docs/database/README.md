# StockPulse — Database & Storage Architecture Reference

This directory contains the database design reference, migration catalog, entity-relationship diagrams (ERD), and Row-Level Security (RLS) policies for **Supabase PostgreSQL 16+**.

---

## 📚 Database Documentation Index

1. **[Master Supabase PostgreSQL Schema](file:///d:/Project%20Local/fnb-mobile/docs/architecture/SUPABASE_SCHEMA.md)**
   - Complete PostgreSQL DDL, foreign key cascade matrix, check constraints, and generated columns.
2. **[Row-Level Security (RLS) Policy Design](file:///d:/Project%20Local/fnb-mobile/docs/architecture/RLS_POLICY_DESIGN.md)**
   - Multi-tenant isolation model, 5-role capability matrix, and security definer functions.
3. **[Complete Domain Model Specification](file:///d:/Project%20Local/fnb-mobile/docs/architecture/DOMAIN_MODEL.md)**
   - Entity-Relationship Diagram (ERD), 16 domain entities, TypeScript interface catalog, and audit field standards.
4. **[Immutable Audit Logging System](file:///d:/Project%20Local/fnb-mobile/docs/architecture/AUDIT_LOGGING_SYSTEM.md)**
   - Monthly table partitioning, HMAC-SHA256 cryptographic chaining, and WORM mutation blockers.

---

## 🗂️ PostgreSQL Migration Sequence

| Migration File | Domain Scope | Key Tables Created |
|---|---|---|
| `00001_extensions_and_enums.sql` | PostgreSQL Extensions & Enums | `uuid-ossp`, `pgcrypto`, `pg_trgm`, Enums |
| `00002_organizations_and_stores.sql` | Multi-Tenancy & Stores | `organizations`, `stores`, `store_settings` |
| `00003_iam_users_roles_permissions.sql` | IAM & RBAC | `users`, `roles`, `permissions`, `user_store_assignments` |
| `00004_inventory_and_recipes.sql` | Items, Batches & BOM Recipes | `categories`, `inventory_items`, `inventory_batches`, `inventory_transactions`, `recipes`, `recipe_ingredients` |
| `00005_stock_counts_and_variances.sql` | Audits & Shrinkage | `count_schedules`, `stock_counts`, `stock_count_items`, `variances`, `variance_items` |
| `00006_procurement_suppliers_goods_receipts.sql`| Procurement & Influx | `suppliers`, `purchase_orders`, `purchase_order_items`, `goods_receipts`, `goods_receipt_items` |
| `00007_ocr_notifications_audit_logs.sql` | OCR, Alerts & Audit Ledger | `ocr_documents`, `ocr_document_items`, `ocr_bom_deductions`, `notifications`, `device_tokens`, `audit_logs` |
| `00008_row_level_security.sql` | Multi-Store Tenant Isolation | RLS Policies & Security Definer Context Functions |
