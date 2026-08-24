-- ============================================================================
-- StockPulse — Migration 00009: Production RBAC & Supabase RLS Refinement
-- Target Database: Supabase PostgreSQL
-- ============================================================================

-- 1. Standardize User Roles
-- Ensure both 'admin' and 'superadmin' are present for backward compatibility.
INSERT INTO roles (name, description, is_system) VALUES
    ('admin', 'Organization Administrator and Store Owner with unrestricted operational, financial, and team authority', true),
    ('superadmin', 'Organization Administrator (Alias for admin)', true),
    ('manager', 'Store Operations Manager authorized for day-to-day catalog, purchase orders, count variance approvals, and analytics', true),
    ('supervisor', 'Shift Supervisor authorized for stock counts, variance approvals, OCR scan reviews, and waste triage', true),
    ('staff', 'Floor and Kitchen Staff authorized for physical stock counts, scan uploads, and goods receipt intake', true),
    ('auditor', 'Financial & Compliance Auditor with strict read-only access to catalog, costs, variances, and audit ledger', true)
ON CONFLICT (name) DO UPDATE SET 
    description = EXCLUDED.description,
    is_system = true;

-- 2. Comprehensive Permissions Catalog
INSERT INTO permissions (code, module, description) VALUES
    -- Inventory & Costs
    ('inventory:view', 'inventory', 'View inventory catalog, stock levels, and storage locations'),
    ('inventory:view_costs', 'inventory', 'View unit purchase costs, stock valuation, and recipe cost metrics'),
    ('inventory:manage_skus', 'inventory', 'Create, update, and archive master SKU definitions and categories'),
    ('inventory:adjust', 'inventory', 'Execute manual stock adjustments with audit reason codes'),
    -- Stock Counts & Variances
    ('stock_count:conduct', 'stock_count', 'Initiate, record, and submit physical stock audit sessions'),
    ('stock_count:approve', 'stock_count', 'Review and approve inventory variance discrepancies and sync ledger'),
    -- POS & AI OCR
    ('ocr:scan', 'ocr', 'Upload and trigger AI OCR processing on POS receipts and invoices'),
    ('ocr:review', 'ocr', 'Inspect OCR extractions, edit confidence mappings, and review line items'),
    ('ocr:confirm', 'ocr', 'Confirm POS report and trigger atomic recipe BOM stock deductions'),
    -- Expiration & Waste
    ('bbd:view', 'expiration', 'View batch expiration dates and shelf-life warning alerts'),
    ('bbd:action_waste', 'expiration', 'Log batch waste discards, quarantine spoiled items, and record spoilage'),
    -- Procurement & Orders
    ('procurement:view_poq', 'procurement', 'View periodic order quantity recommendations and supplier schedules'),
    ('procurement:create_po', 'procurement', 'Draft and modify purchase orders'),
    ('procurement:approve_po', 'procurement', 'Approve, dispatch, or cancel purchase orders to contracted suppliers'),
    ('procurement:goods_receipt', 'procurement', 'Check in physical delivery shipments and generate lot batches'),
    -- Analytics & Financials
    ('analytics:view', 'analytics', 'View inventory turnover, usage analytics, and operational metrics'),
    ('analytics:view_financials', 'analytics', 'View theoretical vs actual food cost and monetary shrinkage valuation'),
    ('analytics:export_reports', 'analytics', 'Export audit logs, variance reports, and accounting summaries'),
    -- Team & IAM
    ('team:view', 'iam', 'View active store team roster, avatars, and assigned roles'),
    ('team:manage', 'iam', 'Invite store staff, assign roles, and modify user permissions'),
    -- Settings & Audit
    ('settings:view', 'settings', 'View store profile, regional currency, and operational preferences'),
    ('settings:manage_store', 'settings', 'Configure store location attributes, thresholds, and tax identifiers'),
    ('audit:view', 'audit', 'Inspect cryptographic WORM audit logs and verify SHA-256 chain integrity')
ON CONFLICT (code) DO UPDATE SET 
    description = EXCLUDED.description,
    module = EXCLUDED.module;

-- 3. Clear and Rebuild Role-Permission Mappings with 100% Determinism
DELETE FROM role_permissions WHERE role_id IN (SELECT id FROM roles WHERE name IN ('admin', 'superadmin', 'manager', 'supervisor', 'staff', 'auditor'));

-- 3.1 Admin & Superadmin (Full Access)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name IN ('admin', 'superadmin')
ON CONFLICT DO NOTHING;

-- 3.2 Operations Manager
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'manager'
  AND p.code IN (
    'inventory:view', 'inventory:view_costs', 'inventory:manage_skus', 'inventory:adjust',
    'stock_count:conduct', 'stock_count:approve',
    'ocr:scan', 'ocr:review', 'ocr:confirm',
    'bbd:view', 'bbd:action_waste',
    'procurement:view_poq', 'procurement:create_po', 'procurement:approve_po', 'procurement:goods_receipt',
    'analytics:view', 'analytics:view_financials', 'analytics:export_reports',
    'team:view', 'settings:view'
  )
ON CONFLICT DO NOTHING;

-- 3.3 Shift Supervisor
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'supervisor'
  AND p.code IN (
    'inventory:view',
    'stock_count:conduct', 'stock_count:approve',
    'ocr:scan', 'ocr:review', 'ocr:confirm',
    'bbd:view', 'bbd:action_waste',
    'procurement:view_poq', 'procurement:goods_receipt',
    'analytics:view',
    'team:view', 'settings:view'
  )
ON CONFLICT DO NOTHING;

-- 3.4 Kitchen & Bar Staff
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'staff'
  AND p.code IN (
    'inventory:view',
    'stock_count:conduct',
    'ocr:scan',
    'bbd:view',
    'procurement:goods_receipt'
  )
ON CONFLICT DO NOTHING;

-- 3.5 Financial Auditor (Read-Only)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'auditor'
  AND p.code IN (
    'inventory:view', 'inventory:view_costs',
    'analytics:view', 'analytics:view_financials', 'analytics:export_reports',
    'team:view', 'settings:view', 'audit:view'
  )
ON CONFLICT DO NOTHING;

-- 4. PostgreSQL Security Definer Context & Policy Evaluation Functions

-- 4.1 Get Authenticated User Organization ID
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
    SELECT organization_id FROM users 
    WHERE id = auth.uid() AND deleted_at IS NULL
    LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 4.2 Check if Authenticated User is Organization Admin
CREATE OR REPLACE FUNCTION is_org_admin(target_org_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_store_assignments usa
        JOIN roles r ON r.id = usa.role_id
        JOIN users u ON u.id = usa.user_id
        WHERE u.id = auth.uid()
          AND u.organization_id = target_org_id
          AND r.name IN ('admin', 'superadmin')
          AND u.deleted_at IS NULL
          AND usa.deleted_at IS NULL
    ) OR EXISTS (
        SELECT 1 FROM users u
        JOIN user_store_assignments usa ON usa.user_id = u.id
        JOIN roles r ON r.id = usa.role_id
        WHERE u.id = auth.uid()
          AND u.organization_id = target_org_id
          AND r.name IN ('admin', 'superadmin')
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 4.3 Check if Authenticated User has Access to Target Store
CREATE OR REPLACE FUNCTION has_store_access(target_store_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_store_assignments
        WHERE user_id = auth.uid()
          AND store_id = target_store_id
          AND deleted_at IS NULL
    ) OR EXISTS (
        SELECT 1 FROM stores s
        WHERE s.id = target_store_id
          AND s.organization_id = get_user_organization_id()
          AND is_org_admin(s.organization_id)
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 4.4 Get Effective User Role Name in Store
CREATE OR REPLACE FUNCTION get_user_role(target_store_id UUID)
RETURNS VARCHAR AS $$
    SELECT COALESCE(
        (SELECT 'admin' WHERE is_org_admin((SELECT organization_id FROM stores WHERE id = target_store_id))),
        (SELECT r.name FROM user_store_assignments usa
         JOIN roles r ON r.id = usa.role_id
         WHERE usa.user_id = auth.uid()
           AND usa.store_id = target_store_id
           AND usa.deleted_at IS NULL
         LIMIT 1)
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 4.5 Check if Authenticated User Has Specific Permission in Target Store
CREATE OR REPLACE FUNCTION user_has_permission(required_perm VARCHAR, target_store_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_store_assignments usa
        JOIN role_permissions rp ON rp.role_id = usa.role_id
        JOIN permissions p ON p.id = rp.permission_id
        WHERE usa.user_id = auth.uid()
          AND (usa.store_id = target_store_id OR is_org_admin((SELECT organization_id FROM stores WHERE id = target_store_id)))
          AND p.code = required_perm
          AND usa.deleted_at IS NULL
    ) OR EXISTS (
        SELECT 1 FROM stores s
        WHERE s.id = target_store_id
          AND is_org_admin(s.organization_id)
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 5. Enhanced Row-Level Security (RLS) Policy Declarations

-- 5.1 Organizations
DROP POLICY IF EXISTS "organizations_select_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_update_policy" ON organizations;
CREATE POLICY "organizations_select_policy" ON organizations
    FOR SELECT USING (id = get_user_organization_id());
CREATE POLICY "organizations_update_policy" ON organizations
    FOR UPDATE USING (id = get_user_organization_id() AND is_org_admin(id));

-- 5.2 Stores
DROP POLICY IF EXISTS "stores_select_policy" ON stores;
DROP POLICY IF EXISTS "stores_modify_policy" ON stores;
CREATE POLICY "stores_select_policy" ON stores
    FOR SELECT USING (has_store_access(id));
CREATE POLICY "stores_modify_policy" ON stores
    FOR ALL USING (organization_id = get_user_organization_id() AND is_org_admin(organization_id));

-- 5.3 Users & Assignments
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_modify_policy" ON users;
CREATE POLICY "users_select_policy" ON users
    FOR SELECT USING (organization_id = get_user_organization_id());
CREATE POLICY "users_modify_policy" ON users
    FOR ALL USING (organization_id = get_user_organization_id() AND is_org_admin(organization_id));

DROP POLICY IF EXISTS "user_store_assignments_select" ON user_store_assignments;
DROP POLICY IF EXISTS "user_store_assignments_modify" ON user_store_assignments;
CREATE POLICY "user_store_assignments_select" ON user_store_assignments
    FOR SELECT USING (has_store_access(store_id));
CREATE POLICY "user_store_assignments_modify" ON user_store_assignments
    FOR ALL USING (has_store_access(store_id) AND get_user_role(store_id) IN ('admin', 'superadmin', 'manager'));

-- 5.4 Inventory Items (Auditor & Staff can SELECT, Only Manager & Admin can INSERT/UPDATE/DELETE)
DROP POLICY IF EXISTS "inventory_items_select" ON inventory_items;
DROP POLICY IF EXISTS "inventory_items_insert" ON inventory_items;
DROP POLICY IF EXISTS "inventory_items_update" ON inventory_items;
DROP POLICY IF EXISTS "inventory_items_delete" ON inventory_items;

CREATE POLICY "inventory_items_select" ON inventory_items
    FOR SELECT USING (has_store_access(store_id));

CREATE POLICY "inventory_items_insert" ON inventory_items
    FOR INSERT WITH CHECK (has_store_access(store_id) AND user_has_permission('inventory:manage_skus', store_id));

CREATE POLICY "inventory_items_update" ON inventory_items
    FOR UPDATE USING (has_store_access(store_id) AND (user_has_permission('inventory:manage_skus', store_id) OR user_has_permission('inventory:adjust', store_id)));

CREATE POLICY "inventory_items_delete" ON inventory_items
    FOR DELETE USING (has_store_access(store_id) AND user_has_permission('inventory:manage_skus', store_id));

-- 5.5 Inventory Batches & Transactions
DROP POLICY IF EXISTS "inventory_batches_select" ON inventory_batches;
DROP POLICY IF EXISTS "inventory_batches_modify" ON inventory_batches;
CREATE POLICY "inventory_batches_select" ON inventory_batches
    FOR SELECT USING (EXISTS (SELECT 1 FROM inventory_items i WHERE i.id = item_id AND has_store_access(i.store_id)));
CREATE POLICY "inventory_batches_modify" ON inventory_batches
    FOR ALL USING (EXISTS (SELECT 1 FROM inventory_items i WHERE i.id = item_id AND has_store_access(i.store_id) AND get_user_role(i.store_id) IN ('admin', 'superadmin', 'manager', 'supervisor')));

-- Transactions: STRICTLY SELECT & INSERT (Append-Only)
DROP POLICY IF EXISTS "inventory_transactions_select" ON inventory_transactions;
DROP POLICY IF EXISTS "inventory_transactions_insert" ON inventory_transactions;
CREATE POLICY "inventory_transactions_select" ON inventory_transactions
    FOR SELECT USING (has_store_access(store_id));
CREATE POLICY "inventory_transactions_insert" ON inventory_transactions
    FOR INSERT WITH CHECK (has_store_access(store_id));

-- 5.6 Stock Counts & Variances (Staff can count, but CANNOT approve variances)
DROP POLICY IF EXISTS "stock_counts_select" ON stock_counts;
DROP POLICY IF EXISTS "stock_counts_modify" ON stock_counts;
CREATE POLICY "stock_counts_select" ON stock_counts
    FOR SELECT USING (has_store_access(store_id));
CREATE POLICY "stock_counts_modify" ON stock_counts
    FOR ALL USING (has_store_access(store_id) AND user_has_permission('stock_count:conduct', store_id));

DROP POLICY IF EXISTS "variances_select" ON variances;
DROP POLICY IF EXISTS "variances_modify" ON variances;
CREATE POLICY "variances_select" ON variances
    FOR SELECT USING (has_store_access(store_id));
CREATE POLICY "variances_modify" ON variances
    FOR ALL USING (has_store_access(store_id) AND user_has_permission('stock_count:approve', store_id));

-- 5.7 Procurement & Purchase Orders (Staff CANNOT create/approve POs, only receive goods)
DROP POLICY IF EXISTS "purchase_orders_select" ON purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_modify" ON purchase_orders;
CREATE POLICY "purchase_orders_select" ON purchase_orders
    FOR SELECT USING (has_store_access(store_id));
CREATE POLICY "purchase_orders_modify" ON purchase_orders
    FOR ALL USING (has_store_access(store_id) AND user_has_permission('procurement:create_po', store_id));

DROP POLICY IF EXISTS "goods_receipts_select" ON goods_receipts;
DROP POLICY IF EXISTS "goods_receipts_modify" ON goods_receipts;
CREATE POLICY "goods_receipts_select" ON goods_receipts
    FOR SELECT USING (has_store_access(store_id));
CREATE POLICY "goods_receipts_modify" ON goods_receipts
    FOR ALL USING (has_store_access(store_id) AND user_has_permission('procurement:goods_receipt', store_id));

-- 5.8 OCR Documents & BOM Confirmations (Staff can upload, but ONLY supervisor/manager/admin can confirm BOM deductions)
DROP POLICY IF EXISTS "ocr_documents_select" ON ocr_documents;
DROP POLICY IF EXISTS "ocr_documents_insert" ON ocr_documents;
DROP POLICY IF EXISTS "ocr_documents_update" ON ocr_documents;
CREATE POLICY "ocr_documents_select" ON ocr_documents
    FOR SELECT USING (has_store_access(store_id));
CREATE POLICY "ocr_documents_insert" ON ocr_documents
    FOR INSERT WITH CHECK (has_store_access(store_id) AND user_has_permission('ocr:scan', store_id));
CREATE POLICY "ocr_documents_update" ON ocr_documents
    FOR UPDATE USING (has_store_access(store_id) AND user_has_permission('ocr:confirm', store_id));

-- 5.9 Audit Logs (Strictly SELECT only for authorized roles, INSERT only via backend service role)
DROP POLICY IF EXISTS "audit_logs_read" ON audit_logs;
CREATE POLICY "audit_logs_read" ON audit_logs
    FOR SELECT USING (has_store_access(store_id) AND user_has_permission('audit:view', store_id));
