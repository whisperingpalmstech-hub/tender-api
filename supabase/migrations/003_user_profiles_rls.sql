-- Additional RLS policies for user_profiles table
-- Run this in Supabase SQL Editor

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Allow users to insert their own profile (for signup)
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Allow authenticated users to manage knowledge_base (for admins in future)
CREATE POLICY "Authenticated users can manage knowledge base" ON knowledge_base
    FOR ALL USING (auth.role() = 'authenticated');
