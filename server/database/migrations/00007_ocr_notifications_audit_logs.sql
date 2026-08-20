-- ============================================================================
-- Migration 00007: OCR Documents, BOM Deductions, Notifications & Audit Logs
-- ============================================================================

-- 1. OCR Documents (POS Reports & Invoices)
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
    created_by UUID,
    updated_by UUID,
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID
);

CREATE INDEX IF NOT EXISTS idx_ocr_documents_store_status 
    ON ocr_documents (store_id, status) 
    WHERE deleted_at IS NULL;

-- 2. OCR Extracted Line Items
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

CREATE INDEX IF NOT EXISTS idx_ocr_doc_items_doc 
    ON ocr_document_items (ocr_document_id);

-- 3. OCR BOM Ingredient Deductions
CREATE TABLE IF NOT EXISTS ocr_bom_deductions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ocr_document_id UUID NOT NULL REFERENCES ocr_documents(id) ON DELETE CASCADE,
    ocr_item_id UUID NOT NULL REFERENCES ocr_document_items(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
    quantity_deducted NUMERIC(12, 4) NOT NULL,
    unit unit_of_measure_enum NOT NULL,
    unit_cost NUMERIC(10, 4) NOT NULL,
    total_cost NUMERIC(12, 4) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Notifications Table (In-App Inbox)
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
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
    ON notifications (store_id, user_id, is_read, created_at DESC);

-- 5. Device Tokens (Push Notifications)
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

-- 6. Audit Logs (Partitioned Append-Only Immutable WORM Ledger)
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

-- Partitions for 2026
CREATE TABLE IF NOT EXISTS audit_logs_2026_08 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-08-01 00:00:00+00') TO ('2026-09-01 00:00:00+00');
CREATE TABLE IF NOT EXISTS audit_logs_2026_09 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-09-01 00:00:00+00') TO ('2026-10-01 00:00:00+00');
CREATE TABLE IF NOT EXISTS audit_logs_2026_10 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2026-11-01 00:00:00+00');

-- Indexes on Audit Logs
CREATE INDEX IF NOT EXISTS idx_audit_store_action_date 
    ON audit_logs (store_id, event_action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_actor_date 
    ON audit_logs (store_id, actor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_entity 
    ON audit_logs (store_id, entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_audit_diff_gin 
    ON audit_logs USING GIN (state_diff);

-- Immutability Trigger: Block any UPDATE or DELETE on audit_logs
CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit records are strictly immutable. UPDATE and DELETE operations are forbidden.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_block_audit_mutation ON audit_logs;
CREATE TRIGGER trg_block_audit_mutation
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();
