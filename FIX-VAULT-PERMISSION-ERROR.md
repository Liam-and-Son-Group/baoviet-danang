# 🔧 FIX: Permission Denied for Schema Vault

## ❌ **LỖI GẶP PHẢI:**

```
permission denied for schema vault
```

## 🎯 **NGUYÊN NHÂN:**

Lỗi này xảy ra khi:

1. Code cũ vẫn cố gắng truy cập `vault.get_secret()`
2. Database triggers hoặc functions cũ chưa được xóa/cập nhật
3. Admin interface vẫn gọi database functions thay vì Edge Functions

## ✅ **GIẢI PHÁP:**

### **BƯỚC 1: XÓA CÁC TRIGGERS VÀ FUNCTIONS CŨ**

Chạy SQL sau trong Supabase Dashboard → SQL Editor:

```sql
-- Xóa trigger cũ nếu tồn tại
DROP TRIGGER IF EXISTS auto_deploy_article_trigger ON articles;

-- Xóa functions cũ nếu tồn tại
DROP FUNCTION IF EXISTS trigger_github_deploy();
DROP FUNCTION IF EXISTS manual_deploy_article(UUID);

-- Tạo lại functions mới (chỉ logging)
DROP FUNCTION IF EXISTS log_deploy_attempt(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS update_deploy_status(UUID, TEXT, TEXT);
```

### **BƯỚC 2: TẠO LẠI DATABASE FUNCTIONS (CLEAN VERSION)**

```sql
-- ================================================================
-- 🚀 CLEAN SUPABASE FUNCTIONS (NO VAULT ACCESS)
-- ================================================================

-- 1️⃣ CREATE LOGGING FUNCTIONS ONLY
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

    -- Tạo log entry
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

-- 2️⃣ CREATE UPDATE STATUS FUNCTION
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
        error_message = error_msg
    WHERE id = log_uuid;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 3️⃣ GRANT PERMISSIONS
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON webhook_logs TO authenticated;
GRANT EXECUTE ON FUNCTION log_deploy_attempt(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_deploy_status(UUID, TEXT, TEXT) TO authenticated;

-- 4️⃣ CREATE RLS POLICIES
DROP POLICY IF EXISTS "Users can view webhook logs" ON webhook_logs;
CREATE POLICY "Users can view webhook logs" ON webhook_logs
    FOR SELECT USING (true);
```

### **BƯỚC 3: VERIFY ADMIN INTERFACE**

Đảm bảo admin interface chỉ gọi Edge Functions:

1. **Auto-deploy sau khi lưu:** ✅ Gọi `client.functions.invoke('deploy-article')`
2. **Manual deploy button:** ✅ Gọi `client.functions.invoke('deploy-article')`
3. **Check logs:** ✅ Gọi `client.from('webhook_logs').select()`

### **BƯỚC 4: TEST CLEAN SETUP**

1. **Clear browser cache** để tránh cached code cũ
2. **Reload admin page**
3. **Test tạo bài viết mới**
4. **Check console** không có lỗi vault

## 🔍 **DEBUG STEPS:**

### **Check Active Functions:**

```sql
SELECT
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%deploy%';
```

### **Check Triggers:**

```sql
SELECT
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

### **Check Logs:**

```sql
SELECT
    event_type,
    status,
    error_message,
    created_at
FROM webhook_logs
ORDER BY created_at DESC
LIMIT 5;
```

## ✅ **EXPECTED RESULT:**

Sau khi fix:

- ✅ Không còn lỗi vault permission
- ✅ Admin interface hoạt động bình thường
- ✅ Deploy functions chỉ thông qua Edge Functions
- ✅ Database chỉ làm logging, không gọi external APIs

## 🚀 **WORKFLOW MỚI:**

```
1. User lưu bài viết → Supabase DB
2. Admin interface → Edge Function (deploy-article)
3. Edge Function → GitHub API (với token từ secrets)
4. GitHub Actions → Generate HTML + Deploy
5. Database → Log results only
```

**🎯 Chạy các SQL commands ở trên để fix lỗi vault permission!**
