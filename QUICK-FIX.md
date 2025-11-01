# 🔧 Quick Fix Guide - Environment Variables

## ❌ Lỗi Hiện Tại
```
❌ Missing Supabase credentials in environment variables
Error: Process completed with exit code 1.
```

## ✅ Cách Fix (2 Options)

### 🎯 Option 1: GitHub Secrets (Recommended for Production)

#### 1️⃣ Setup GitHub Repository Secrets
```
1. Vào: https://github.com/Liam-and-Son-Group/baoviet-danang/settings/secrets/actions
2. Click "New repository secret"
3. Thêm secrets:
   - Name: SUPABASE_URL
     Value: https://your-project-ref.supabase.co
   - Name: SUPABASE_ANON_KEY  
     Value: your-anon-public-key
```

#### 2️⃣ Lấy Supabase Credentials
```
1. Vào: https://supabase.com/dashboard
2. Chọn project: baoviet-danang
3. Vào: Settings → API
4. Copy "Project URL" → GitHub Secret SUPABASE_URL
5. Copy "anon public" key → GitHub Secret SUPABASE_ANON_KEY
```

#### 3️⃣ Test GitHub Actions
```bash
# Trigger manual workflow
gh workflow run deploy-new-article.yml \
  -f article_id="85bf05a9-edaa-40b3-96a6-12d27cff3c77" \
  -f article_filename="test.html"
```

### 🏠 Option 2: Local .env File (cho Development)

#### 1️⃣ Config File .env
```bash
# File .env đã được tạo, bạn cần chỉnh sửa:
nano .env

# Thay đổi từ:
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Thành thông tin thật từ Supabase Dashboard
```

#### 2️⃣ Test Local
```bash
# Test environment variables
./test-env.sh

# Test generate article
node .github/scripts/generate-article.js "85bf05a9-edaa-40b3-96a6-12d27cff3c77" "test.html"
```

## 🔍 Dual Mode Support

Script tự động detect environment:

| Environment | Credentials Source | Use Case |
|-------------|-------------------|----------|
| **Local** | `.env` file | Development & testing |
| **GitHub Actions** | GitHub Secrets | Production auto-deploy |

## 🧪 Test Cả Hai Mode
```bash
./test-dual-mode.sh
```

## 🔍 Files Đã Tạo
- ✅ `.env` - Environment variables file (local)
- ✅ `GITHUB-SECRETS-SETUP.md` - Hướng dẫn setup GitHub Secrets
- ✅ `test-dual-mode.sh` - Test cả hai mode
- ✅ `.gitignore` - Để không commit secrets

## 🚨 Lưu Ý Quan Trọng
- **GitHub Secrets**: Secure, encrypted, chỉ available trong GitHub Actions
- **Local .env**: Chỉ cho development, KHÔNG commit vào git
- **Auto-detection**: Script tự biết environment nào đang chạy

## 📋 Checklist Production Setup
- [ ] Setup SUPABASE_URL trong GitHub Secrets
- [ ] Setup SUPABASE_ANON_KEY trong GitHub Secrets  
- [ ] Test workflow manually
- [ ] Verify auto-deploy từ Edge Function

Sau khi setup GitHub Secrets, auto-deploy system sẽ hoạt động hoàn toàn! 🎉