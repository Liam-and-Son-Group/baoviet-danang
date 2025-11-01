-- ================================================================
-- 🚀 SUPABASE FUNCTIONS FOR GITHUB AUTO-DEPLOY (SIMPLIFIED)
-- ================================================================

-- 1️⃣ CREATE TABLE FOR WEBHOOK LOGS (Optional - for debugging)
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    payload JSONB,
    status TEXT DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- 2️⃣ CREATE FUNCTION TO LOG DEPLOY ATTEMPTS (Simplified)
CREATE OR REPLACE FUNCTION log_deploy_attempt(
    article_uuid UUID,
    deploy_status TEXT DEFAULT 'initiated',
    error_msg TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    article_data RECORD;
    log_id UUID;
    result JSONB;
BEGIN
    -- Lấy thông tin bài viết
    SELECT * INTO article_data FROM articles WHERE id = article_uuid;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Article not found'
        );
    END IF;
    
    -- Tạo payload
    INSERT INTO webhook_logs (event_type, payload, status, error_message) 
    VALUES (
        'deploy_attempt',
        jsonb_build_object(
            'article_id', article_data.id,
            'article_filename', article_data.filename,
            'article_title', article_data.title,
            'timestamp', NOW()
        ),
        deploy_status,
        error_msg
    ) RETURNING id INTO log_id;
    
    -- Return result
    result := jsonb_build_object(
        'success', true,
        'log_id', log_id,
        'article_id', article_data.id,
        'filename', article_data.filename,
        'status', deploy_status,
        'timestamp', NOW()
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 3️⃣ CREATE FUNCTION TO UPDATE DEPLOY STATUS
CREATE OR REPLACE FUNCTION update_deploy_status(
    log_uuid UUID,
    new_status TEXT,
    error_msg TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE webhook_logs 
    SET 
        status = new_status,
        error_message = error_msg,
        updated_at = NOW()
    WHERE id = log_uuid;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 4️⃣ GRANT PERMISSIONS
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON webhook_logs TO authenticated;
GRANT EXECUTE ON FUNCTION log_deploy_attempt(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_deploy_status(UUID, TEXT, TEXT) TO authenticated;

-- 5️⃣ CREATE RLS POLICIES
CREATE POLICY "Users can view webhook logs" ON webhook_logs
    FOR SELECT USING (true);

-- ================================================================
-- 📝 HƯỚNG DẪN SỬ DỤNG (CLIENT-SIDE APPROACH):
-- ================================================================

/*
APPROACH MỚI: Thay vì dùng database trigger + vault, 
ta sẽ gọi GitHub API trực tiếp từ client-side JavaScript.

1. LOG DEPLOY ATTEMPT:
   SELECT log_deploy_attempt('article-uuid-here', 'initiated');

2. UPDATE STATUS AFTER DEPLOY:
   SELECT update_deploy_status('log-uuid', 'success');

3. CHECK LOGS:
   SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 10;

4. CLIENT-SIDE DEPLOY:
   - Admin interface sẽ gọi GitHub API trực tiếp
   - Sử dụng GitHub token được lưu trong localStorage hoặc config
   - Log kết quả vào database
*/

-- ================================================================
-- 📝 HƯỚNG DẪN SỬ DỤNG:
-- ================================================================

/*
1. AUTO TRIGGER (Tự động):
   - Trigger sẽ chạy khi INSERT hoặc UPDATE articles
   - Chỉ trigger khi có thay đổi quan trọng (title, content, is_published)

2. MANUAL TRIGGER (Thủ công):
   SELECT manual_deploy_article('your-article-uuid-here');

3. CHECK LOGS:
   SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 10;

4. DISABLE AUTO TRIGGER (nếu cần):
   DROP TRIGGER auto_deploy_article_trigger ON articles;

5. GITHUB TOKEN SETUP:
   - Vào Supabase Dashboard > Project Settings > Vault
   - Tạo secret với tên 'github_token'
   - Giá trị là GitHub Personal Access Token với repo permissions
*/

-- ================================================================
-- 🔧 TROUBLESHOOTING QUERIES:
-- ================================================================

-- Xem log deploy gần đây
-- SELECT event_type, status, error_message, created_at FROM webhook_logs ORDER BY created_at DESC LIMIT 5;

-- Test manual deploy
-- SELECT manual_deploy_article((SELECT id FROM articles LIMIT 1));

-- Disable trigger tạm thời
-- ALTER TABLE articles DISABLE TRIGGER auto_deploy_article_trigger;

-- Enable lại trigger  
-- ALTER TABLE articles ENABLE TRIGGER auto_deploy_article_trigger;