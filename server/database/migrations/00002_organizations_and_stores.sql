-- ============================================================================
-- Migration 00002: Organizations, Stores, and Store Settings
-- ============================================================================

-- 1. Organizations (Top-Level Tenant)
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
    created_by UUID,
    updated_by UUID,
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID
);

-- Partial Unique Index for Organization Slug (Active Only)
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_slug_unique 
    ON organizations (slug) 
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_plan 
    ON organizations (plan_tier) 
    WHERE deleted_at IS NULL;

-- 2. Stores (Individual Branches / Kitchen Locations)
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
    created_by UUID,
    updated_by UUID,
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID
);

-- Partial Unique Index for Store Code per Organization (Active Only)
CREATE UNIQUE INDEX IF NOT EXISTS idx_stores_org_code_unique 
    ON stores (organization_id, store_code) 
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_stores_organization 
    ON stores (organization_id) 
    WHERE deleted_at IS NULL;

-- 3. Store Settings
CREATE TABLE IF NOT EXISTS store_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL UNIQUE REFERENCES stores(id) ON DELETE CASCADE,
    default_tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 19.00,
    reduced_tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 7.00,
    safety_stock_multiplier NUMERIC(4, 2) NOT NULL DEFAULT 1.20,
    blind_count_enabled BOOLEAN NOT NULL DEFAULT true,
    variance_threshold_warning_eur NUMERIC(10, 2) NOT NULL DEFAULT 25.00,
    variance_threshold_critical_eur NUMERIC(10, 2) NOT NULL DEFAULT 100.00,
    operating_hours JSONB DEFAULT '{"mon": {"open": "09:00", "close": "22:00"}}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID
);
