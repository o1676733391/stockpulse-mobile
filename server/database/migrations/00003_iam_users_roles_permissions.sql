-- ============================================================================
-- Migration 00003: IAM, Users, Roles, Permissions, and Store Assignments
-- ============================================================================

-- 1. Roles Definition
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed System Roles
INSERT INTO roles (name, description, is_system) VALUES
    ('superadmin', 'Global organization administrator and billing owner', true),
    ('manager', 'Store manager with full inventory, commercial, and team authority', true),
    ('supervisor', 'Shift supervisor authorized for stock audits and OCR confirmations', true),
    ('staff', 'Floor staff authorized for stock counts and basic receipt uploads', true),
    ('auditor', 'External read-only auditor for compliance and ledger inspection', true)
ON CONFLICT (name) DO NOTHING;

-- 2. Permissions Catalog
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    module VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Standard Permissions
INSERT INTO permissions (code, module, description) VALUES
    ('inventory:view', 'inventory', 'View inventory balances and items'),
    ('inventory:adjust', 'inventory', 'Perform manual stock adjustments'),
    ('inventory:manage_skus', 'inventory', 'Create and modify SKU definitions'),
    ('stock_count:conduct', 'stock_count', 'Record counts in audit sessions'),
    ('stock_count:approve', 'stock_count', 'Approve variance discrepancies'),
    ('procurement:create_po', 'procurement', 'Draft purchase orders'),
    ('procurement:approve_po', 'procurement', 'Approve and dispatch purchase orders'),
    ('procurement:goods_receipt', 'procurement', 'Check in delivery goods receipts'),
    ('ocr:scan', 'ocr', 'Upload and process receipt scans'),
    ('ocr:confirm', 'ocr', 'Confirm receipt lines and deduct BOM recipes'),
    ('audit:view', 'audit', 'Inspect immutable audit ledger history'),
    ('team:manage', 'iam', 'Invite and manage team roles'),
    ('store:settings', 'stores', 'Configure store tax and operating rules')
ON CONFLICT (code) DO NOTHING;

-- 3. Role Permissions Mapping
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);

-- 4. Users Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    avatar_url TEXT,
    default_store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID
);

-- Partial Unique Index for Email within Organization (Active Only)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_org_email_unique 
    ON users (organization_id, email) 
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_organization 
    ON users (organization_id) 
    WHERE deleted_at IS NULL;

-- 5. User Store Assignments (Multi-Store RBAC Junction)
CREATE TABLE IF NOT EXISTS user_store_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID
);

-- Partial Unique Index for User Store Assignment (Active Only)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_store_assignment_unique 
    ON user_store_assignments (user_id, store_id) 
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_store_store 
    ON user_store_assignments (store_id) 
    WHERE deleted_at IS NULL;
