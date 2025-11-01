# 🔑 HƯỚNG DẪN LẤY VÀ SETUP GITHUB TOKEN

## 🎯 **TỔNG QUAN**

GitHub token cần thiết để Edge Function có thể gọi GitHub API và trigger GitHub Actions. Token này được lưu an toàn trong Supabase secrets.

---

## 📝 **BƯỚC 1: TẠO GITHUB PERSONAL ACCESS TOKEN**

### **1.1 Truy cập GitHub Settings**

1. Đăng nhập GitHub
2. Vào: https://github.com/settings/tokens
3. Hoặc: GitHub profile → Settings → Developer settings → Personal access tokens → Tokens (classic)

### **1.2 Generate New Token**

1. Click "Generate new token (classic)"
2. **Note:** `Baoviet Deploy Token`
3. **Expiration:** `No expiration` (hoặc 1 year)
4. **Select scopes:**
   - ✅ `repo` - Full control of private repositories
   - ✅ `workflow` - Update GitHub Action workflows
   - ✅ `write:packages` (optional)

### **1.3 Copy Token**

- Token sẽ bắt đầu với `ghp_` (classic) hoặc `github_pat_` (fine-grained)
- **⚠️ LƯU Ý:** Copy ngay vì chỉ hiển thị 1 lần!
- Example: `ghp_1234567890abcdefghijklmnopqrstuvwxyz1234`

---

## 🔧 **BƯỚC 2: SETUP SUPABASE CLI**

### **2.1 Install Supabase CLI**

```bash
# Cách 1: NPM
npm install -g supabase

# Cách 2: Homebrew (macOS)
brew install supabase/tap/supabase

# Cách 3: Direct download
# Download từ: https://github.com/supabase/cli/releases
```

### **2.2 Login to Supabase**

```bash
supabase login
```

- Sẽ mở browser để authenticate
- Đăng nhập với tài khoản Supabase của bạn

### **2.3 Link to Project**

```bash
# Get project reference từ Supabase Dashboard
# URL format: https://app.supabase.com/project/YOUR_PROJECT_REF

supabase link --project-ref YOUR_PROJECT_REF
```

---

## 🔐 **BƯỚC 3: SET GITHUB TOKEN SECRET**

### **3.1 Set Secret**

```bash
supabase secrets set GITHUB_TOKEN=ghp_your_actual_token_here
```

### **3.2 Verify Secret**

```bash
# List all secrets (không hiển thị value)
supabase secrets list

# Should show:
# GITHUB_TOKEN
```

### **3.3 Test Secret in Edge Function**

```bash
# Deploy function để test
supabase functions deploy deploy-article

# Check logs
supabase functions logs deploy-article --follow
```

---

## 🚀 **BƯỚC 4: DEPLOY EDGE FUNCTION**

### **4.1 Deploy Function**

```bash
supabase functions deploy deploy-article
```

### **4.2 Test Function**

```bash
# Test locally (optional)
supabase functions serve deploy-article
```

### **4.3 Verify Deployment**

Function URL sẽ là:

```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/deploy-article
```

---

## 🧪 **BƯỚC 5: TEST DEPLOYMENT**

### **5.1 Test từ Admin Interface**

1. Mở admin panel
2. Tạo bài viết test
3. Bấm "🚀 Deploy GitHub Pages"
4. Check console logs

### **5.2 Check GitHub Actions**

Vào: https://github.com/Liam-and-Son-Group/baoviet-danang/actions

### **5.3 Troubleshooting**

```bash
# Check function logs
supabase functions logs deploy-article --follow

# Common errors:
# - "GITHUB_TOKEN not found" → Set secret again
# - "401 Unauthorized" → Check token permissions
# - "404 Not Found" → Check repository name
```

---

## 🔍 **TROUBLESHOOTING**

### **❌ Token Permission Error**

```
Error: Bad credentials (401)
```

**Solution:**

1. Check token có đúng scopes: `repo`, `workflow`
2. Token chưa expired
3. Repository access permissions

### **❌ Secret Not Found**

```
Error: GITHUB_TOKEN not found in environment variables
```

**Solution:**

```bash
# Set lại secret
supabase secrets set GITHUB_TOKEN=your_token

# Redeploy function
supabase functions deploy deploy-article
```

### **❌ Repository Not Found**

```
Error: Not Found (404)
```

**Solution:**

- Check repository name trong Edge Function
- Đảm bảo token có access đến repository
- Repository phải là public hoặc token có đủ permissions

---

## 🔄 **UPDATE TOKEN**

### **When to Update:**

- Token expired
- Revoked token
- Changed permissions

### **How to Update:**

```bash
# Set new token
supabase secrets set GITHUB_TOKEN=new_token_here

# Redeploy function
supabase functions deploy deploy-article
```

---

## 📊 **MONITORING**

### **Check Deployment Status:**

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

### **Function Logs:**

```bash
supabase functions logs deploy-article --follow
```

---

## ✅ **SUCCESS CHECKLIST**

- [ ] GitHub token created with correct permissions
- [ ] Supabase CLI installed and logged in
- [ ] Project linked to Supabase
- [ ] Secret set: `GITHUB_TOKEN`
- [ ] Edge Function deployed successfully
- [ ] Test deployment works
- [ ] GitHub Actions triggered
- [ ] Monitoring setup working

**🎉 Khi complete checklist này, auto-deploy sẽ hoạt động hoàn hảo!**
