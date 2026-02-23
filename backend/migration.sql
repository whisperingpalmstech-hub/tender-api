-- ============================================
-- TENDER SYSTEM: Complete Schema Migration
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================

-- 1. Add missing columns to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS designation TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Create pending_invitations table for invite flow
CREATE TABLE IF NOT EXISTS pending_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    tenant_id TEXT NOT NULL,
    role TEXT DEFAULT 'BID_WRITER',
    full_name TEXT,
    designation TEXT,
    department TEXT,
    invited_by UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pending_invitations ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies (safe to re-run)
DROP POLICY IF EXISTS "Service role full access on pending_invitations" ON pending_invitations;
CREATE POLICY "Service role full access on pending_invitations"
    ON pending_invitations FOR ALL USING (true) WITH CHECK (true);

-- 3. Create discovery_config table for tender search preferences
CREATE TABLE IF NOT EXISTS discovery_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL UNIQUE,
    keywords JSONB DEFAULT '[]'::jsonb,
    preferred_domains JSONB DEFAULT '[]'::jsonb,
    regions JSONB DEFAULT '[]'::jsonb,
    min_match_score INTEGER DEFAULT 30,
    max_results INTEGER DEFAULT 50,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE discovery_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on discovery_config" ON discovery_config;
CREATE POLICY "Service role full access on discovery_config"
    ON discovery_config FOR ALL USING (true) WITH CHECK (true);

-- 4. RLS policy for documents table (allow users to delete their own docs)
DROP POLICY IF EXISTS "Users can delete own documents" ON documents;
CREATE POLICY "Users can delete own documents"
    ON documents FOR DELETE
    USING (
        user_id = auth.uid()
        OR tenant_id IN (
            SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
        )
    );

-- 5. Verify everything
SELECT 'user_profiles columns:' AS info;
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

SELECT 'pending_invitations columns:' AS info;
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'pending_invitations'
ORDER BY ordinal_position;

SELECT 'discovery_config columns:' AS info;
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'discovery_config'
ORDER BY ordinal_position;
