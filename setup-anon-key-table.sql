-- Test setup for Supabase Anon Key Management
-- Run this in Supabase SQL Editor

-- 1. Create the table (PostgreSQL syntax)
CREATE TABLE IF NOT EXISTS anon_key_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  anon_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  domain_whitelist TEXT[] DEFAULT ARRAY['baohiembaovietdanang.vn', 'www.baohiembaovietdanang.vn', 'localhost', '127.0.0.1'],
  usage_count INTEGER DEFAULT 0,
  notes TEXT
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_anon_key_config_active ON anon_key_config(is_active);
CREATE INDEX IF NOT EXISTS idx_anon_key_config_created_at ON anon_key_config(created_at);

-- 3. Enable RLS
ALTER TABLE anon_key_config ENABLE ROW LEVEL SECURITY;

-- 4. Create policies
CREATE POLICY "Service role can manage anon keys" ON anon_key_config
  FOR ALL USING (auth.role() = 'service_role');

-- 5. Insert test key (REPLACE 'your-actual-anon-key-here' with real key)
INSERT INTO anon_key_config (anon_key, is_active, notes) 
VALUES ('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpYXhyc2l5Y3N3cnd1Y3RoaWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEwNzg4NDcsImV4cCI6MjA0NjY1NDg0N30.example-key-replace-with-real', true, 'Initial test key - REPLACE WITH REAL KEY')
ON CONFLICT DO NOTHING;

-- 6. Test query
SELECT 
  id,
  LEFT(anon_key, 20) || '...' as anon_key_preview,
  created_at,
  is_active,
  usage_count,
  notes
FROM anon_key_config 
ORDER BY created_at DESC;