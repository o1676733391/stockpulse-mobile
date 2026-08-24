-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tenants Table (Global SaaS entity)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subscription_status VARCHAR(50) NOT NULL DEFAULT 'active' 
        CHECK (subscription_status IN ('active', 'trial', 'past_due', 'canceled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(150) NOT NULL,
    
    role VARCHAR(50) NOT NULL DEFAULT 'staff' 
        CHECK (role IN ('super_admin', 'store_admin', 'staff')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_tenant ON users(tenant_id);

-- 3. Inventory Items Table (Raw ingredients / stock items)
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(30) NOT NULL CHECK (unit IN ('kg', 'g', 'l', 'ml', 'pcs', 'can', 'bottle')),
    unit_cost NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    current_physical_qty NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    current_theoretical_qty NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    safety_stock NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    target_stock NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tenant_sku UNIQUE (tenant_id, sku)
);
CREATE INDEX idx_inventory_tenant ON inventory_items(tenant_id);

-- 4. Menu Items Table (POS Sellable catalog)
CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    item_code VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    category VARCHAR(100) DEFAULT 'General',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tenant_item_code UNIQUE (tenant_id, item_code)
);
CREATE INDEX idx_menu_tenant ON menu_items(tenant_id);

-- 5. BOM (Bill of Materials) Recipes Table
CREATE TABLE bom_recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
    quantity_required NUMERIC(12, 4) NOT NULL CHECK (quantity_required > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_bom_mapping UNIQUE (tenant_id, menu_item_id, inventory_item_id)
);
CREATE INDEX idx_bom_tenant_menu ON bom_recipes(tenant_id, menu_item_id);

-- 6. POS Sales Logs (OCR Scans and background parsing records)
CREATE TABLE pos_sales_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    scanned_by UUID NOT NULL REFERENCES users(id),
    image_url TEXT NOT NULL,
    parsed_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    sales_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'processed' 
        CHECK (status IN ('pending', 'processed', 'failed', 'flagged')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_pos_sales_tenant_date ON pos_sales_logs(tenant_id, sales_date DESC);

-- 7. Inventory Counts Table (Periodic stocktakes & variance logs)
CREATE TABLE inventory_counts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    schedule_type VARCHAR(50) NOT NULL 
        CHECK (schedule_type IN ('daily', 'weekly', 'monthly', 'quarterly')),
    physical_qty NUMERIC(12, 4) NOT NULL,
    theoretical_qty NUMERIC(12, 4) NOT NULL,
    variance NUMERIC(12, 4) GENERATED ALWAYS AS (physical_qty - theoretical_qty) STORED,
    count_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_counts_tenant_item ON inventory_counts(tenant_id, inventory_item_id, count_date DESC);

-- 8. Suppliers Table
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Goods Receipts & Batch BBD Logs (Stock intake and expiration dates)
CREATE TABLE goods_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    received_by UUID NOT NULL REFERENCES users(id),
    qty_received NUMERIC(12, 4) NOT NULL CHECK (qty_received > 0),
    unit_price NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    batch_number VARCHAR(100),
    bbd_date DATE NOT NULL,
    alert_threshold_days INT NOT NULL DEFAULT 3,
    receipt_photo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_goods_receipts_bbd ON goods_receipts(tenant_id, bbd_date ASC);

-- 10. Purchase Orders Table (POQ Reordering)
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    calculated_poq_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' 
        CHECK (status IN ('draft', 'sent', 'fulfilled', 'cancelled')),
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_po_tenant_supplier ON purchase_orders(tenant_id, supplier_id);

-- 11. Audit Trail Logs (Append-only ledger)
CREATE TABLE audit_trail_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action_type VARCHAR(100) NOT NULL,
    qty_delta NUMERIC(12, 4) NOT NULL,
    previous_qty NUMERIC(12, 4) NOT NULL,
    new_qty NUMERIC(12, 4) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_tenant_time ON audit_trail_logs(tenant_id, created_at DESC);