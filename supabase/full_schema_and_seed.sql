-- ============================================================================
-- StockPulse — Complete Database Schema & Initial Demo Seed Data
-- Target Database: Supabase PostgreSQL
-- ============================================================================

-- ============================================================================
-- 1. Extensions & Custom ENUM Types
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

DO $$ BEGIN
    CREATE TYPE plan_tier_enum AS ENUM ('trial', 'starter', 'pro', 'enterprise');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('superadmin', 'manager', 'supervisor', 'staff', 'auditor');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE unit_of_measure_enum AS ENUM ('kg', 'g', 'L', 'ml', 'pcs', 'can', 'bottle', 'pack');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE stock_status_enum AS ENUM ('healthy', 'low', 'critical', 'overstock');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE batch_status_enum AS ENUM ('active', 'consumed', 'wasted', 'expired');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE inventory_transaction_type_enum AS ENUM (
        'PURCHASE_RECEIPT',
        'POS_DEDUCTION',
        'COUNT_VARIANCE',
        'WASTE_DISCARD',
        'MANUAL_ADJUSTMENT',
        'TRANSFER_IN',
        'TRANSFER_OUT'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE stock_count_type_enum AS ENUM ('blind', 'standard');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE stock_count_status_enum AS ENUM ('draft', 'in_progress', 'completed', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE discrepancy_tier_enum AS ENUM ('none', 'minor', 'critical');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE po_status_enum AS ENUM ('draft', 'submitted', 'approved', 'sent', 'confirmed', 'partially_received', 'received', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE goods_receipt_status_enum AS ENUM ('draft', 'verified', 'discrepancy', 'completed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE ocr_status_enum AS ENUM ('processing', 'review_pending', 'confirmed', 'rejected', 'failed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE notification_urgency_enum AS ENUM ('NORMAL', 'CRITICAL');
EXCEPTION WHEN duplicate_object THEN null; END $$;


-- ============================================================================
-- 2. Organizations & Stores
-- ============================================================================

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    tax_identifier VARCHAR(100),
    plan_tier plan_tier_enum NOT NULL DEFAULT 'trial',
    stripe_customer_id VARCHAR(100),
    stripe_subscription_id VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_slug_unique 
    ON organizations (slug) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'DE',
    postal_code VARCHAR(20),
    phone VARCHAR(50),
    email VARCHAR(255),
    currency VARCHAR(10) NOT NULL DEFAULT 'EUR',
    timezone VARCHAR(50) NOT NULL DEFAULT 'Europe/Berlin',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_stores_org_code_unique 
    ON stores (organization_id, store_code) WHERE deleted_at IS NULL;


-- ============================================================================
-- 3. IAM, Roles & Users
-- ============================================================================

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO roles (name, description, is_system) VALUES
    ('admin', 'Organization Administrator and Store Owner with unrestricted operational, financial, and team authority', true),
    ('superadmin', 'Organization Administrator (Alias for admin)', true),
    ('manager', 'Store manager with full inventory, commercial, and team authority', true),
    ('supervisor', 'Shift supervisor authorized for stock audits and OCR confirmations', true),
    ('staff', 'Floor staff authorized for stock counts and basic receipt uploads', true),
    ('auditor', 'External read-only auditor for compliance and ledger inspection', true)
ON CONFLICT (name) DO NOTHING;

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
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_org_email_unique 
    ON users (organization_id, email) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS user_store_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

DO $$ BEGIN
    CREATE TYPE invitation_status_enum AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS store_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    token_hash VARCHAR(128) NOT NULL UNIQUE,
    invitation_code VARCHAR(32) NOT NULL UNIQUE,
    status invitation_status_enum NOT NULL DEFAULT 'PENDING',
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    accepted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    accepted_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES users(id) ON DELETE SET NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_invitations_store ON store_invitations (store_id);
CREATE INDEX IF NOT EXISTS idx_store_invitations_org ON store_invitations (organization_id);
CREATE INDEX IF NOT EXISTS idx_store_invitations_email ON store_invitations (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_store_invitations_status ON store_invitations (status);
CREATE INDEX IF NOT EXISTS idx_store_invitations_expires ON store_invitations (expires_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_store_invitations_unique_pending
    ON store_invitations (store_id, LOWER(email))
    WHERE status = 'PENDING';


-- ============================================================================
-- 4. Inventory, Categories, Batches & Recipes
-- ============================================================================

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_store_name_unique 
    ON categories (store_id, name) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    sku VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    unit unit_of_measure_enum NOT NULL,
    physical_stock NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    theoretical_stock NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    target_stock NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    safety_stock NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    cost_per_unit NUMERIC(10, 4) NOT NULL DEFAULT 0.0000,
    barcode VARCHAR(100),
    storage_area VARCHAR(100),
    shelf_life_days INTEGER,
    status stock_status_enum NOT NULL DEFAULT 'healthy',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_items_store_sku_unique 
    ON inventory_items (store_id, sku) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS inventory_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    batch_number VARCHAR(100) NOT NULL,
    quantity NUMERIC(12, 4) NOT NULL,
    initial_quantity NUMERIC(12, 4) NOT NULL,
    cost_per_unit NUMERIC(10, 4) NOT NULL,
    expiry_date DATE NOT NULL,
    received_date DATE NOT NULL DEFAULT CURRENT_DATE,
    supplier_id UUID,
    status batch_status_enum NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES inventory_batches(id) ON DELETE SET NULL,
    transaction_number VARCHAR(50) NOT NULL,
    transaction_type inventory_transaction_type_enum NOT NULL,
    delta NUMERIC(12, 4) NOT NULL,
    previous_stock NUMERIC(12, 4) NOT NULL,
    new_stock NUMERIC(12, 4) NOT NULL,
    cost_impact NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_name VARCHAR(255),
    reference_type VARCHAR(50),
    reference_id VARCHAR(100),
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    portion_yield NUMERIC(8, 2) NOT NULL DEFAULT 1.00,
    pos_item_name VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_recipes_store_code_unique 
    ON recipes (store_id, code) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
    quantity NUMERIC(12, 4) NOT NULL,
    unit unit_of_measure_enum NOT NULL,
    waste_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================================
-- 5. Stock Counts & Variances
-- ============================================================================

CREATE TABLE IF NOT EXISTS stock_counts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    session_number VARCHAR(50) NOT NULL,
    conducted_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status stock_count_status_enum NOT NULL DEFAULT 'draft',
    count_type stock_count_type_enum NOT NULL DEFAULT 'blind',
    total_items INTEGER NOT NULL DEFAULT 0,
    total_counted INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS stock_count_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_count_id UUID NOT NULL REFERENCES stock_counts(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
    counted_quantity NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    unit unit_of_measure_enum NOT NULL,
    notes TEXT,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS variances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    stock_count_id UUID NOT NULL UNIQUE REFERENCES stock_counts(id) ON DELETE CASCADE,
    variance_number VARCHAR(50) NOT NULL,
    total_expected_value NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    total_counted_value NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    net_variance_value NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    total_items_counted INTEGER NOT NULL DEFAULT 0,
    items_with_discrepancy_count INTEGER NOT NULL DEFAULT 0,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    ledger_synced_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMPTZ
);


-- ============================================================================
-- 6. Suppliers & Procurement
-- ============================================================================

CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    supplier_code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    lead_time_days INTEGER NOT NULL DEFAULT 1,
    payment_terms VARCHAR(100) DEFAULT 'Net 30 Days',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    order_number VARCHAR(50) NOT NULL,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_delivery_date DATE,
    status po_status_enum NOT NULL DEFAULT 'draft',
    subtotal NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    tax_amount NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    total_amount NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
    quantity_ordered NUMERIC(12, 4) NOT NULL,
    quantity_received NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    unit unit_of_measure_enum NOT NULL,
    unit_price NUMERIC(10, 4) NOT NULL,
    total_price NUMERIC(12, 4) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goods_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    receipt_number VARCHAR(50) NOT NULL,
    invoice_number VARCHAR(100) NOT NULL,
    receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    status goods_receipt_status_enum NOT NULL DEFAULT 'verified',
    received_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS goods_receipt_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goods_receipt_id UUID NOT NULL REFERENCES goods_receipts(id) ON DELETE CASCADE,
    po_item_id UUID REFERENCES purchase_order_items(id) ON DELETE SET NULL,
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
    quantity_received NUMERIC(12, 4) NOT NULL,
    unit unit_of_measure_enum NOT NULL,
    price_per_unit NUMERIC(10, 4) NOT NULL,
    batch_number VARCHAR(100) NOT NULL,
    expiry_date DATE NOT NULL,
    created_batch_id UUID REFERENCES inventory_batches(id) ON DELETE SET NULL,
    is_accepted BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================================
-- 7. OCR Documents, Notifications & Audit Logs
-- ============================================================================

CREATE TABLE IF NOT EXISTS ocr_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL DEFAULT 'pos_z_report',
    storage_path TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    status ocr_status_enum NOT NULL DEFAULT 'processing',
    overall_confidence NUMERIC(4, 3),
    raw_provider_response JSONB,
    processed_at TIMESTAMPTZ,
    confirmed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    confirmed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ocr_document_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ocr_document_id UUID NOT NULL REFERENCES ocr_documents(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    raw_text TEXT NOT NULL,
    description VARCHAR(255) NOT NULL,
    article_number VARCHAR(100),
    quantity NUMERIC(10, 3) NOT NULL DEFAULT 1.000,
    unit_price NUMERIC(10, 4),
    total_price NUMERIC(12, 4),
    confidence NUMERIC(4, 3) NOT NULL,
    matched_recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
    match_confidence NUMERIC(4, 3),
    match_status VARCHAR(50) NOT NULL DEFAULT 'UNMATCHED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    notification_number VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    urgency notification_urgency_enum NOT NULL DEFAULT 'NORMAL',
    route TEXT,
    metadata JSONB,
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS device_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    expo_push_token VARCHAR(255) NOT NULL UNIQUE,
    platform VARCHAR(20) NOT NULL,
    app_version VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    in_app_enabled BOOLEAN NOT NULL DEFAULT true,
    push_enabled BOOLEAN NOT NULL DEFAULT true,
    email_enabled BOOLEAN NOT NULL DEFAULT false,
    low_stock_alerts BOOLEAN NOT NULL DEFAULT true,
    expiring_batches BOOLEAN NOT NULL DEFAULT true,
    po_status_updates BOOLEAN NOT NULL DEFAULT true,
    stock_count_reminders BOOLEAN NOT NULL DEFAULT true,
    ocr_scan_completed BOOLEAN NOT NULL DEFAULT true,
    quiet_hours_start VARCHAR(10) DEFAULT '22:00',
    quiet_hours_end VARCHAR(10) DEFAULT '07:00',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, store_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    event_number VARCHAR(50) NOT NULL,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_name VARCHAR(255),
    actor_role VARCHAR(50),
    ip_address INET,
    user_agent TEXT,
    event_action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    entity_identifier VARCHAR(100),
    state_before JSONB,
    state_after JSONB,
    state_diff JSONB,
    reason_code VARCHAR(100),
    prev_hash VARCHAR(64) NOT NULL,
    current_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE IF NOT EXISTS audit_logs_2026_08 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-08-01 00:00:00+00') TO ('2026-09-01 00:00:00+00');
CREATE TABLE IF NOT EXISTS audit_logs_2026_09 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-09-01 00:00:00+00') TO ('2026-10-01 00:00:00+00');


-- ============================================================================
-- 8. Initial Demo Seed Data (Organizations, Stores, Users, Categories, SKUs, Recipes)
-- ============================================================================

-- 1. Demo Organization & Store
INSERT INTO organizations (id, name, slug, plan_tier) VALUES
    ('01915dfa-9012-7000-8000-000000000001', 'StockPulse Demo Organization', 'demo-org', 'pro')
ON CONFLICT (id) DO NOTHING;

INSERT INTO stores (id, organization_id, store_code, name, address, city, country, currency, timezone) VALUES
    ('01915dfa-9012-7000-8000-000000000002', '01915dfa-9012-7000-8000-000000000001', 'STORE-BERLIN-01', 'StockPulse Kitchen & Bar Berlin', 'Friedrichstraße 42', 'Berlin', 'DE', 'EUR', 'Europe/Berlin')
ON CONFLICT (id) DO NOTHING;

-- 2. Demo User & Store Assignment
INSERT INTO users (id, organization_id, email, name, default_store_id) VALUES
    ('01915dfa-9012-7000-8000-000000000099', '01915dfa-9012-7000-8000-000000000001', 'dev@stockpulse.io', 'Development Store Manager', '01915dfa-9012-7000-8000-000000000002')
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_store_assignments (user_id, store_id, role_id)
SELECT 
    '01915dfa-9012-7000-8000-000000000099',
    '01915dfa-9012-7000-8000-000000000002',
    r.id
FROM roles r WHERE r.name = 'manager'
ON CONFLICT DO NOTHING;

-- 3. Demo Categories
INSERT INTO categories (id, store_id, name, description, icon, sort_order) VALUES
    ('01915dfa-b1c4-7221-9988-51b72e04e011', '01915dfa-9012-7000-8000-000000000002', 'Dairy & Eggs', 'Milk, cheeses, creams and fresh eggs', 'egg', 1),
    ('01915dfa-b1c4-7221-9988-51b72e04e012', '01915dfa-9012-7000-8000-000000000002', 'Beverages & Coffee', 'Coffee beans, teas, syrups and soft drinks', 'coffee', 2),
    ('01915dfa-b1c4-7221-9988-51b72e04e013', '01915dfa-9012-7000-8000-000000000002', 'Pantry & Dry Goods', 'Flour, pasta, canned tomatoes, spices and oils', 'box', 3)
ON CONFLICT (id) DO NOTHING;

-- 4. Demo Inventory SKUs
INSERT INTO inventory_items (id, store_id, category_id, sku, name, unit, physical_stock, theoretical_stock, target_stock, safety_stock, cost_per_unit, storage_area, shelf_life_days, status) VALUES
    ('01915dfa-b1c4-7221-9988-51b72e04e0a1', '01915dfa-9012-7000-8000-000000000002', '01915dfa-b1c4-7221-9988-51b72e04e011', 'DAI-001', 'Whole Milk 3.5%', 'L', 24.0000, 24.0000, 40.0000, 10.0000, 1.2500, 'Walk-in Fridge', 14, 'healthy'),
    ('01915dfa-b1c4-7221-9988-51b72e04e0a2', '01915dfa-9012-7000-8000-000000000002', '01915dfa-b1c4-7221-9988-51b72e04e011', 'DAI-002', 'Mozzarella Block 2.5kg', 'kg', 12.5000, 12.5000, 25.0000, 5.0000, 7.8000, 'Walk-in Fridge', 21, 'healthy'),
    ('01915dfa-b1c4-7221-9988-51b72e04e0a3', '01915dfa-9012-7000-8000-000000000002', '01915dfa-b1c4-7221-9988-51b72e04e012', 'BEV-001', 'Espresso Roast Blend Beans', 'kg', 8.5000, 8.5000, 15.0000, 3.0000, 22.0000, 'Dry Storage', 90, 'healthy'),
    ('01915dfa-b1c4-7221-9988-51b72e04e0a4', '01915dfa-9012-7000-8000-000000000002', '01915dfa-b1c4-7221-9988-51b72e04e013', 'PAN-001', 'San Marzano Canned Tomatoes 2.5kg', 'can', 18.0000, 18.0000, 30.0000, 6.0000, 4.5000, 'Pantry Room', 365, 'healthy'),
    ('01915dfa-b1c4-7221-9988-51b72e04e0a5', '01915dfa-9012-7000-8000-000000000002', '01915dfa-b1c4-7221-9988-51b72e04e013', 'PAN-002', 'Tipo 00 Pizza Flour 25kg', 'kg', 75.0000, 75.0000, 150.0000, 25.0000, 0.9500, 'Dry Storage', 180, 'healthy')
ON CONFLICT (id) DO NOTHING;

-- 5. Demo Active FEFO Batches
INSERT INTO inventory_batches (id, item_id, batch_number, quantity, initial_quantity, cost_per_unit, expiry_date, received_date, status) VALUES
    ('01915dfa-b1c4-7221-9988-51b72e04e0b1', '01915dfa-b1c4-7221-9988-51b72e04e0a1', 'BAT-MILK-20260820', 24.0000, 24.0000, 1.2500, CURRENT_DATE + INTERVAL '10 days', CURRENT_DATE, 'active'),
    ('01915dfa-b1c4-7221-9988-51b72e04e0b2', '01915dfa-b1c4-7221-9988-51b72e04e0a2', 'BAT-MOZZ-20260818', 12.5000, 12.5000, 7.8000, CURRENT_DATE + INTERVAL '18 days', CURRENT_DATE, 'active'),
    ('01915dfa-b1c4-7221-9988-51b72e04e0b3', '01915dfa-b1c4-7221-9988-51b72e04e0a3', 'BAT-COF-20260801', 8.5000, 8.5000, 22.0000, CURRENT_DATE + INTERVAL '75 days', CURRENT_DATE, 'active')
ON CONFLICT (id) DO NOTHING;

-- 6. Demo Recipes & BOM Mappings
INSERT INTO recipes (id, store_id, code, name, category, portion_yield, pos_item_name) VALUES
    ('01915dfa-b1c4-7221-9988-51b72e04e0c1', '01915dfa-9012-7000-8000-000000000002', 'REC-PIZZA-MARG', 'Pizza Margherita 30cm', 'Pizza', 1.00, 'Pizza Margherita'),
    ('01915dfa-b1c4-7221-9988-51b72e04e0c2', '01915dfa-9012-7000-8000-000000000002', 'REC-COF-CAPP', 'Cappuccino Grande', 'Hot Drinks', 1.00, 'Cappuccino Grande')
ON CONFLICT (id) DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, item_id, quantity, unit, waste_percentage) VALUES
    ('01915dfa-b1c4-7221-9988-51b72e04e0c1', '01915dfa-b1c4-7221-9988-51b72e04e0a5', 0.2500, 'kg', 2.00), -- 250g Flour
    ('01915dfa-b1c4-7221-9988-51b72e04e0c1', '01915dfa-b1c4-7221-9988-51b72e04e0a2', 0.1500, 'kg', 0.00), -- 150g Mozzarella
    ('01915dfa-b1c4-7221-9988-51b72e04e0c1', '01915dfa-b1c4-7221-9988-51b72e04e0a4', 0.1000, 'can', 1.00), -- 100g Tomato sauce
    ('01915dfa-b1c4-7221-9988-51b72e04e0c2', '01915dfa-b1c4-7221-9988-51b72e04e0a3', 0.0180, 'kg', 0.00), -- 18g Coffee beans
    ('01915dfa-b1c4-7221-9988-51b72e04e0c2', '01915dfa-b1c4-7221-9988-51b72e04e0a1', 0.2000, 'L', 5.00)   -- 200ml Milk (+5% frothing waste)
ON CONFLICT DO NOTHING;

-- 7. Demo Contracted Supplier
INSERT INTO suppliers (id, store_id, supplier_code, name, contact_name, email, phone, lead_time_days, payment_terms) VALUES
    ('01915dfa-b1c4-7221-9988-51b72e04e020', '01915dfa-9012-7000-8000-000000000002', 'SUP-001', 'Alpine Fresh Dairy Supplies', 'Hans Gruber', 'orders@alpinedairy.com', '+49 30 555-0199', 2, 'Net 30 Days')
ON CONFLICT (id) DO NOTHING;
