-- ============================================================================
-- Migration 00005: Stock Counts, Audit Schedules, Variances & Discrepancies
-- ============================================================================

-- 1. Count Schedules
CREATE TABLE IF NOT EXISTS count_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    frequency VARCHAR(50) NOT NULL DEFAULT 'daily',
    count_type stock_count_type_enum NOT NULL DEFAULT 'blind',
    target_category_ids UUID[],
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID
);

-- 2. Stock Counts (Stocktaking Sessions)
CREATE TABLE IF NOT EXISTS stock_counts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    schedule_id UUID REFERENCES count_schedules(id) ON DELETE SET NULL,
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
    created_by UUID,
    updated_by UUID,
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_stock_counts_store_session_unique 
    ON stock_counts (store_id, session_number) 
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_stock_counts_store_status 
    ON stock_counts (store_id, status) 
    WHERE deleted_at IS NULL;

-- 3. Stock Count Line Items
CREATE TABLE IF NOT EXISTS stock_count_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_count_id UUID NOT NULL REFERENCES stock_counts(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
    counted_quantity NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    unit unit_of_measure_enum NOT NULL,
    notes TEXT,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_positive_counted_qty CHECK (counted_quantity >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_stock_count_items_unique 
    ON stock_count_items (stock_count_id, item_id);

-- 4. Variances (Shrinkage & Reconciliation Summary)
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
    created_by UUID,
    updated_by UUID,
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_variances_store_num_unique 
    ON variances (store_id, variance_number) 
    WHERE deleted_at IS NULL;

-- 5. Variance Line Items
CREATE TABLE IF NOT EXISTS variance_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variance_id UUID NOT NULL REFERENCES variances(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
    expected_quantity NUMERIC(12, 4) NOT NULL,
    counted_quantity NUMERIC(12, 4) NOT NULL,
    variance_quantity NUMERIC(12, 4) NOT NULL,
    unit unit_of_measure_enum NOT NULL,
    unit_cost NUMERIC(10, 4) NOT NULL,
    variance_value NUMERIC(12, 4) NOT NULL,
    discrepancy_tier discrepancy_tier_enum NOT NULL DEFAULT 'none',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_variance_items_unique 
    ON variance_items (variance_id, item_id);
