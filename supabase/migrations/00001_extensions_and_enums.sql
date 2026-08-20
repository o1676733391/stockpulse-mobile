-- ============================================================================
-- Migration 00001: Extensions and Core Enums
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Plan Tier Enum
DO $$ BEGIN
    CREATE TYPE plan_tier_enum AS ENUM ('trial', 'starter', 'pro', 'enterprise');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- User Role Enum
DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('superadmin', 'manager', 'supervisor', 'staff', 'auditor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Units of Measure Enum
DO $$ BEGIN
    CREATE TYPE unit_of_measure_enum AS ENUM ('kg', 'g', 'L', 'ml', 'pcs', 'can', 'bottle', 'pack');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Stock Health Status Enum
DO $$ BEGIN
    CREATE TYPE stock_status_enum AS ENUM ('healthy', 'low', 'critical', 'overstock');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Inventory Batch Status Enum
DO $$ BEGIN
    CREATE TYPE batch_status_enum AS ENUM ('active', 'consumed', 'wasted', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Inventory Transaction Type Enum
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
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Stock Count Types & Statuses
DO $$ BEGIN
    CREATE TYPE stock_count_type_enum AS ENUM ('blind', 'standard');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE stock_count_status_enum AS ENUM ('draft', 'in_progress', 'completed', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Discrepancy Tier Enum
DO $$ BEGIN
    CREATE TYPE discrepancy_tier_enum AS ENUM ('none', 'minor', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Purchase Order Status Enum
DO $$ BEGIN
    CREATE TYPE po_status_enum AS ENUM ('draft', 'sent', 'confirmed', 'partially_received', 'received', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Goods Receipt Status Enum
DO $$ BEGIN
    CREATE TYPE goods_receipt_status_enum AS ENUM ('draft', 'verified', 'discrepancy');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- OCR Document Status Enum
DO $$ BEGIN
    CREATE TYPE ocr_status_enum AS ENUM ('processing', 'review_pending', 'confirmed', 'rejected', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Notification Urgency Enum
DO $$ BEGIN
    CREATE TYPE notification_urgency_enum AS ENUM ('NORMAL', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
