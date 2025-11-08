# Supabase Anon Key Management System

Hệ thống quản lý anon key tự động cho Supabase, giúp các trang web có thể lấy key mà không cần nhập thủ công.

## 📁 Cấu trúc files

```
├── supabase/
│   ├── functions/
│   │   └── get-anon-key/
│   │       └── index.ts          # Edge Function chính
│   ├── migrations/
│   │   └── 001_create_anon_key_config.sql  # Tạo bảng quản lý keys
│   └── config.toml               # Config cho functions
├── supabase-key-manager.js       # JavaScript client utility
└── README-anon-key.md           # File này
```

## 🚀 Deployment Steps

### 1. Setup Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link project
supabase link --project-ref your-project-ref
```

### 2. Deploy Database Schema

```bash
# Run migration
supabase db push

# Or run SQL manually in Supabase Dashboard
```

### 3. Set Environment Variables

Trong Supabase Dashboard > Settings > Environment Variables:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-current-anon-key
ADMIN_SECRET_KEY=your-secure-admin-secret
ENVIRONMENT=production
```

### 4. Deploy Edge Function

```bash
# Deploy function
supabase functions deploy get-anon-key

# Set secrets
supabase secrets set ADMIN_SECRET_KEY=your-secure-admin-secret
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 5. Insert Initial Key

```sql
-- In Supabase SQL Editor
INSERT INTO anon_key_config (anon_key, is_active, notes)
VALUES ('your-actual-supabase-anon-key-here', true, 'Initial key setup');
```

## 💻 Usage Examples

### Basic Usage (Client-side)

```html
<!-- Include scripts -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="supabase-key-manager.js"></script>

<script>
  // Initialize Key Manager
  const keyManager = new SupabaseKeyManager({
    baseUrl: "https://your-project.supabase.co",
    cacheExpiry: 10 * 60 * 1000, // 10 minutes
  });

  // Get anon key automatically
  async function connectToSupabase() {
    try {
      const supabase = await keyManager.createSupabaseClient();
      console.log("Connected to Supabase!");
      return supabase;
    } catch (error) {
      console.error("Connection failed:", error);
    }
  }

  // Manual key retrieval
  async function getKey() {
    try {
      const key = await keyManager.getAnonKey();
      console.log("Got anon key:", key);
      return key;
    } catch (error) {
      console.error("Failed to get key:", error);
    }
  }
</script>
```

### Admin Key Reset

```javascript
// Reset anon key (requires admin secret)
async function resetKey() {
  try {
    const result = await keyManager.resetAnonKey(
      "new-anon-key-here",
      "your-admin-secret"
    );
    console.log("Key reset successfully:", result);
  } catch (error) {
    console.error("Reset failed:", error);
  }
}
```

### Cache Management

```javascript
// Check cache info
const cacheInfo = keyManager.getCacheInfo();
console.log("Cache info:", cacheInfo);

// Clear cache
keyManager.clearCache();

// Manual cache control
const keyManager = new SupabaseKeyManager({
  cacheExpiry: 5 * 60 * 1000, // 5 minutes
});
```

## 🔧 API Endpoints

### GET /functions/v1/get-anon-key

Lấy anon key hiện tại

**Response:**

```json
{
  "anon_key": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "created_at": "2025-01-08T10:30:00Z",
  "last_used": "2025-01-08T11:45:00Z",
  "usage_count": 42
}
```

### POST /functions/v1/get-anon-key

Reset anon key (requires admin auth)

**Headers:**

```
Authorization: Bearer your-admin-secret
Content-Type: application/json
```

**Body:**

```json
{
  "action": "reset",
  "new_anon_key": "new-key-here"
}
```

**Response:**

```json
{
  "message": "Anon key reset successfully",
  "new_key_id": "uuid-here",
  "reset_at": "2025-01-08T12:00:00Z"
}
```

## 🛡️ Security Features

### Domain Whitelist

- Chỉ cho phép domains được authorize
- Production mode kiểm tra strict
- Development mode cho phép localhost

### Admin Authentication

- Reset key cần admin secret
- Service role key chỉ dùng server-side
- Rate limiting tự động

### Cache Security

- Cache có expiry time
- Automatic cleanup
- localStorage isolation

## 📊 Monitoring & Analytics

### Database Tracking

```sql
-- View key usage statistics
SELECT
  anon_key,
  created_at,
  last_used,
  usage_count,
  is_active
FROM anon_key_config
ORDER BY created_at DESC;

-- View usage by day
SELECT
  DATE(last_used) as date,
  COUNT(*) as requests,
  MAX(usage_count) as max_usage
FROM anon_key_config
WHERE last_used >= NOW() - INTERVAL '7 days'
GROUP BY DATE(last_used);
```

### Client-side Debugging

```javascript
// Enable debug mode
const keyManager = new SupabaseKeyManager({
  debug: true, // Sẽ log chi tiết
});

// Check cache status
console.log("Cache info:", keyManager.getCacheInfo());

// Manual error handling
try {
  const key = await keyManager.getAnonKey();
} catch (error) {
  if (error.message.includes("Domain not allowed")) {
    console.error("Domain security error");
  } else if (error.message.includes("No anon key")) {
    console.error("Key not configured");
  }
}
```

## 🔄 Migration từ hệ thống cũ

### Bước 1: Backup

```javascript
// Backup current keys
const oldKey = localStorage.getItem("supabase_anon_key");
console.log("Old key backed up:", oldKey);
```

### Bước 2: Test mới

```javascript
// Test new system
const keyManager = new SupabaseKeyManager();
const newKey = await keyManager.getAnonKey();
console.log("New system works:", !!newKey);
```

### Bước 3: Cleanup

```javascript
// Remove old cache when confident
localStorage.removeItem("supabase_anon_key");
localStorage.removeItem("supabase_url");
```

## ⚠️ Troubleshooting

### Common Issues

1. **Edge Function không response**

   ```bash
   # Check function logs
   supabase functions serve get-anon-key --debug
   ```

2. **Domain not allowed error**

   - Check CORS settings
   - Verify domain whitelist
   - Test with localhost first

3. **Cache không work**

   ```javascript
   // Clear and retry
   keyManager.clearCache();
   const key = await keyManager.getAnonKey();
   ```

4. **Admin reset fails**
   - Verify admin secret
   - Check network connectivity
   - Confirm function deployment

### Debug Commands

```javascript
// Full debug info
console.log({
  cacheInfo: keyManager.getCacheInfo(),
  functionUrl: keyManager.getFunctionUrl(),
  hasSupabase: !!window.supabase,
  hasKeyManager: !!window.SupabaseKeyManager,
});
```

## 📝 Best Practices

1. **Cache Management**

   - Set appropriate cache expiry
   - Clear cache on key rotation
   - Monitor cache hit rates

2. **Error Handling**

   - Always have fallback strategy
   - Log errors for monitoring
   - Graceful degradation

3. **Security**

   - Rotate admin secrets regularly
   - Monitor usage patterns
   - Use HTTPS only

4. **Performance**
   - Cache keys appropriately
   - Minimize API calls
   - Use background prefetch

## 🎯 Roadmap

- [ ] Key rotation automation
- [ ] Usage analytics dashboard
- [ ] Multiple environment support
- [ ] Webhook notifications
- [ ] Rate limiting per domain
- [ ] Key versioning system
