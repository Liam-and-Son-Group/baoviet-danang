-- Create table to manage anon keys
CREATE TABLE
IF NOT EXISTS anon_key_config
(
  id UUID DEFAULT gen_random_uuid
() PRIMARY KEY,
  anon_key TEXT NOT NULL,
  created_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW
(),
  last_used TIMESTAMP
WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  domain_whitelist TEXT[] DEFAULT ARRAY['baohiembaovietdanang.vn', 'www.baohiembaovietdanang.vn', 'localhost', '127.0.0.1'],
  usage_count INTEGER DEFAULT 0,
  notes TEXT
);

-- Create index for better performance
CREATE INDEX
IF NOT EXISTS idx_anon_key_config_active ON anon_key_config
(is_active);
CREATE INDEX
IF NOT EXISTS idx_anon_key_config_created_at ON anon_key_config
(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE anon_key_config ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role to manage keys
CREATE POLICY "Service role can manage anon keys" ON anon_key_config
  FOR ALL USING
(auth.role
() = 'service_role');

-- Insert initial anon key (replace with your actual anon key)
-- INSERT INTO anon_key_config (anon_key, is_active, notes) 
-- VALUES ('your-actual-supabase-anon-key-here', true, 'Initial key setup');

-- Optional: Create a function to get active anon key
CREATE OR REPLACE FUNCTION get_active_anon_key
()
RETURNS TABLE
(
  anon_key TEXT,
  created_at TIMESTAMP
WITH TIME ZONE,
  last_used TIMESTAMP
WITH TIME ZONE,
  usage_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update usage count and last_used
  UPDATE anon_key_config 
  SET 
    usage_count = COALESCE(usage_count, 0) + 1,
    last_used = NOW()
  WHERE is_active = true;

  -- Return active key
  RETURN QUERY
  SELECT
    akc.anon_key,
    akc.created_at,
    akc.last_used,
    akc.usage_count
  FROM anon_key_config akc
  WHERE akc.is_active = true
  ORDER BY akc.created_at DESC
  LIMIT 1;
END;
$$;

-- Grant execute permission to anon user (public)
GRANT EXECUTE ON FUNCTION get_active_anon_key
  () TO anon;