-- =====================================================
-- COMPLETE RLS POLICIES FOR ALL TABLES
-- Run this in Supabase SQL Editor
-- =====================================================

-- ============ USER_PROFILES TABLE ============
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Create policies
CREATE POLICY "Users can read own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);


-- ============ DOCUMENTS TABLE ============
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own documents" ON documents;

CREATE POLICY "Users can manage own documents" ON documents
    FOR ALL USING (auth.uid() = user_id);


-- ============ REQUIREMENTS TABLE ============
ALTER TABLE requirements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view requirements for own documents" ON requirements;

CREATE POLICY "Users can view requirements for own documents" ON requirements
    FOR ALL USING (
        document_id IN (SELECT id FROM documents WHERE user_id = auth.uid())
    );


-- ============ KNOWLEDGE_BASE TABLE ============
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read knowledge base" ON knowledge_base;
DROP POLICY IF EXISTS "Authenticated users can manage knowledge base" ON knowledge_base;

-- Anyone authenticated can read active knowledge base items
CREATE POLICY "Authenticated users can read knowledge base" ON knowledge_base
    FOR SELECT USING (auth.role() = 'authenticated' AND is_active = TRUE);

-- Anyone authenticated can insert/update/delete knowledge base (for now)
CREATE POLICY "Authenticated users can manage knowledge base" ON knowledge_base
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update knowledge base" ON knowledge_base
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete knowledge base" ON knowledge_base
    FOR DELETE USING (auth.role() = 'authenticated');


-- ============ MATCH_RESULTS TABLE ============
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view matches for own documents" ON match_results;

CREATE POLICY "Users can view matches for own documents" ON match_results
    FOR ALL USING (
        document_id IN (SELECT id FROM documents WHERE user_id = auth.uid())
    );


-- ============ MATCH_SUMMARIES TABLE ============
ALTER TABLE match_summaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view summaries for own documents" ON match_summaries;

CREATE POLICY "Users can view summaries for own documents" ON match_summaries
    FOR ALL USING (
        document_id IN (SELECT id FROM documents WHERE user_id = auth.uid())
    );


-- ============ RESPONSES TABLE ============
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage responses for own documents" ON responses;

CREATE POLICY "Users can manage responses for own documents" ON responses
    FOR ALL USING (
        document_id IN (SELECT id FROM documents WHERE user_id = auth.uid())
    );


-- ============ EXPORTS TABLE ============
ALTER TABLE exports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own exports" ON exports;

CREATE POLICY "Users can view own exports" ON exports
    FOR ALL USING (exported_by = auth.uid());


-- ============ AI_PERCENTAGE_LOG TABLE ============
-- This table should NOT be accessible by users (internal only)
ALTER TABLE ai_percentage_log ENABLE ROW LEVEL SECURITY;
-- No policies = no access from client


-- ============ AUDIT_LOG TABLE ============
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_log;

CREATE POLICY "Users can view own audit logs" ON audit_log
    FOR SELECT USING (user_id = auth.uid());


-- =====================================================
-- VERIFICATION: Check all RLS is enabled
-- =====================================================
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'user_profiles',
    'documents', 
    'requirements',
    'knowledge_base',
    'match_results',
    'match_summaries',
    'responses',
    'exports',
    'ai_percentage_log',
    'audit_log'
);
