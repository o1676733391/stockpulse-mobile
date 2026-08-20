-- ============================================================================
-- Migration 00004: Inventory, Categories, FEFO Batches, Transactions & Recipes
-- ============================================================================

-- 1. Categories
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_store_name_unique 
    ON categories (store_id, name) 
    WHERE deleted_at IS NULL;

-- 2. Inventory Items (Master SKU Record)
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
    reorder_point NUMERIC(12, 4) GENERATED ALWAYS AS (safety_stock) STORED,
    status stock_status_enum NOT NULL DEFAULT 'healthy',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,
    CONSTRAINT chk_positive_physical_stock CHECK (physical_stock >= 0),
    CONSTRAINT chk_positive_target_stock CHECK (target_stock >= 0),
    CONSTRAINT chk_positive_safety_stock CHECK (safety_stock >= 0),
    CONSTRAINT chk_positive_cost CHECK (cost_per_unit >= 0)
);

-- Partial Unique Index for SKU per Store (Active Only)
CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_items_store_sku_unique 
    ON inventory_items (store_id, sku) 
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_items_store_category 
    ON inventory_items (store_id, category_id) 
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_items_name_trgm 
    ON inventory_items USING GIN (name gin_trgm_ops) 
    WHERE deleted_at IS NULL;

-- 3. Inventory Batches (FEFO Tracking)
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
    created_by UUID,
    updated_by UUID,
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,
    CONSTRAINT chk_positive_batch_quantity CHECK (quantity >= 0)
);

-- FEFO Expiry Sorting Index
CREATE INDEX IF NOT EXISTS idx_batches_item_fefo 
    ON inventory_batches (item_id, expiry_date ASC) 
    WHERE status = 'active' AND deleted_at IS NULL;

-- 4. Inventory Transactions (Append-Only Immutable Ledger)
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

CREATE INDEX IF NOT EXISTS idx_inv_tx_store_item_date 
    ON inventory_transactions (store_id, item_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inv_tx_reference 
    ON inventory_transactions (reference_type, reference_id);

-- 5. Recipes (Menu Dishes & Sub-Recipes)
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
    created_by UUID,
    updated_by UUID,
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_recipes_store_code_unique 
    ON recipes (store_id, code) 
    WHERE deleted_at IS NULL;

-- 6. Recipe Ingredients (Bill of Materials - BOM)
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
    quantity NUMERIC(12, 4) NOT NULL,
    unit unit_of_measure_enum NOT NULL,
    waste_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_positive_ingredient_quantity CHECK (quantity > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_recipe_ingredients_unique 
    ON recipe_ingredients (recipe_id, item_id);
