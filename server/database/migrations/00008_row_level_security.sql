-- ============================================================================
-- Migration 00008: Row-Level Security (RLS) Policies & Context Functions
-- ============================================================================

-- 1. Helper Functions
CREATE OR REPLACE FUNCTION get_auth_store_id()
RETURNS UUID AS $$
    SELECT COALESCE(
        NULLIF(current_setting('app.current_store_id', true), '')::UUID,
        (SELECT default_store_id FROM users WHERE id = auth.uid())
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND deleted_at IS NULL
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_store_access(target_store_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_store_assignments
        WHERE user_id = auth.uid()
          AND store_id = target_store_id
          AND deleted_at IS NULL
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Enable Row-Level Security on All Multi-Tenant Tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_store_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE count_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_count_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE variances ENABLE ROW LEVEL SECURITY;
ALTER TABLE variance_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocr_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocr_document_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocr_bom_deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 3. Declarative RLS Policy Definitions

-- Organizations
DROP POLICY IF EXISTS "organizations_access_policy" ON organizations;
CREATE POLICY "organizations_access_policy" ON organizations
    FOR ALL USING (
        id IN (SELECT organization_id FROM users WHERE id = auth.uid() AND deleted_at IS NULL)
    );

-- Stores
DROP POLICY IF EXISTS "stores_access_policy" ON stores;
CREATE POLICY "stores_access_policy" ON stores
    FOR ALL USING (
        has_store_access(id) OR organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid() AND deleted_at IS NULL
        )
    );

-- Inventory Items
DROP POLICY IF EXISTS "inventory_items_store_isolation" ON inventory_items;
CREATE POLICY "inventory_items_store_isolation" ON inventory_items
    FOR ALL USING (
        store_id = get_auth_store_id() OR has_store_access(store_id)
    );

-- Inventory Batches
DROP POLICY IF EXISTS "inventory_batches_isolation" ON inventory_batches;
CREATE POLICY "inventory_batches_isolation" ON inventory_batches
    FOR ALL USING (
        item_id IN (SELECT id FROM inventory_items WHERE store_id = get_auth_store_id() OR has_store_access(store_id))
    );

-- Inventory Transactions (Read-Only via RLS)
DROP POLICY IF EXISTS "inventory_transactions_isolation" ON inventory_transactions;
CREATE POLICY "inventory_transactions_isolation" ON inventory_transactions
    FOR SELECT USING (
        store_id = get_auth_store_id() OR has_store_access(store_id)
    );

-- Stock Counts
DROP POLICY IF EXISTS "stock_counts_isolation" ON stock_counts;
CREATE POLICY "stock_counts_isolation" ON stock_counts
    FOR ALL USING (
        store_id = get_auth_store_id() OR has_store_access(store_id)
    );

-- Variances
DROP POLICY IF EXISTS "variances_isolation" ON variances;
CREATE POLICY "variances_isolation" ON variances
    FOR ALL USING (
        store_id = get_auth_store_id() OR has_store_access(store_id)
    );

-- Suppliers
DROP POLICY IF EXISTS "suppliers_isolation" ON suppliers;
CREATE POLICY "suppliers_isolation" ON suppliers
    FOR ALL USING (
        store_id = get_auth_store_id() OR has_store_access(store_id)
    );

-- Purchase Orders
DROP POLICY IF EXISTS "purchase_orders_isolation" ON purchase_orders;
CREATE POLICY "purchase_orders_isolation" ON purchase_orders
    FOR ALL USING (
        store_id = get_auth_store_id() OR has_store_access(store_id)
    );

-- Goods Receipts
DROP POLICY IF EXISTS "goods_receipts_isolation" ON goods_receipts;
CREATE POLICY "goods_receipts_isolation" ON goods_receipts
    FOR ALL USING (
        store_id = get_auth_store_id() OR has_store_access(store_id)
    );

-- OCR Documents
DROP POLICY IF EXISTS "ocr_documents_isolation" ON ocr_documents;
CREATE POLICY "ocr_documents_isolation" ON ocr_documents
    FOR ALL USING (
        store_id = get_auth_store_id() OR has_store_access(store_id)
    );

-- Notifications
DROP POLICY IF EXISTS "notifications_isolation" ON notifications;
CREATE POLICY "notifications_isolation" ON notifications
    FOR ALL USING (
        (user_id IS NULL AND has_store_access(store_id)) OR user_id = auth.uid()
    );

-- Audit Logs (Strictly SELECT only)
DROP POLICY IF EXISTS "audit_logs_read_isolation" ON audit_logs;
CREATE POLICY "audit_logs_read_isolation" ON audit_logs
    FOR SELECT USING (
        store_id = get_auth_store_id() OR has_store_access(store_id)
    );
