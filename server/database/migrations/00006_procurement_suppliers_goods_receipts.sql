-- ============================================================================
-- Migration 00006: Suppliers, Purchase Orders, PO Items, Goods Receipts & Influx
-- ============================================================================

-- 1. Suppliers
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
    created_by UUID,
    updated_by UUID,
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,
    CONSTRAINT chk_positive_lead_time CHECK (lead_time_days >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_suppliers_store_code_unique 
    ON suppliers (store_id, supplier_code) 
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_suppliers_store_name 
    ON suppliers (store_id, name) 
    WHERE deleted_at IS NULL;

-- 2. Purchase Orders
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
    created_by UUID,
    updated_by UUID,
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_purchase_orders_store_num_unique 
    ON purchase_orders (store_id, order_number) 
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_purchase_orders_store_status 
    ON purchase_orders (store_id, status) 
    WHERE deleted_at IS NULL;

-- 3. Purchase Order Items
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
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_positive_qty_ordered CHECK (quantity_ordered > 0),
    CONSTRAINT chk_positive_qty_received CHECK (quantity_received >= 0),
    CONSTRAINT chk_positive_unit_price CHECK (unit_price >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_purchase_order_items_unique 
    ON purchase_order_items (purchase_order_id, item_id);

-- 4. Goods Receipts (Delivery Intake Records)
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
    created_by UUID,
    updated_by UUID,
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_goods_receipts_store_num_unique 
    ON goods_receipts (store_id, receipt_number) 
    WHERE deleted_at IS NULL;

-- 5. Goods Receipt Line Items
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_positive_received_qty CHECK (quantity_received >= 0)
);
