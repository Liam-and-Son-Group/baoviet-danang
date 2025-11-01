# 🔐 Setup GitHub Secrets cho Auto-Deploy

## 🎯 Mục Tiêu
Script sẽ lấy Supabase credentials từ GitHub Secrets thay vì file .env local.

## 📋 GitHub Secrets Cần Thiết

### 1️⃣ SUPABASE_URL
- **Value**: https://your-project-ref.supabase.co
- **Cách lấy**: Supabase Dashboard → Settings → API → Project URL

### 2️⃣ SUPABASE_ANON_KEY  
- **Value**: your-anon-public-key
- **Cách lấy**: Supabase Dashboard → Settings → API → anon public key

## 🔧 Cách Setup GitHub Secrets

### Bước 1: Vào Repository Settings
```
1. Vào repository: https://github.com/Liam-and-Son-Group/baoviet-danang
2. Click "Settings" tab
3. Sidebar: "Secrets and variables" → "Actions"
```

### Bước 2: Thêm Repository Secrets
```
1. Click "New repository secret"
2. Name: SUPABASE_URL
   Value: [paste Supabase Project URL]
   
3. Click "New repository secret"  
4. Name: SUPABASE_ANON_KEY
   Value: [paste Supabase anon key]
```

## 🧪 Test Setup

### Test Local (với .env file)
```bash
# Tạo/edit .env file cho local testing
./test-env.sh

# Test generate script
node .github/scripts/generate-article.js "test-id" "test.html"
```

### Test GitHub Actions (với GitHub Secrets)
```bash
# Trigger manual workflow
gh workflow run deploy-new-article.yml \
  -f article_id="85bf05a9-edaa-40b3-96a6-12d27cff3c77" \
  -f article_filename="test-article.html"
```

## 🔍 Workflow Environment Variables

GitHub Actions workflow đã được config để sử dụng secrets:

```yaml
- name: 🏗️ Generate Article HTML
  env:
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
  run: |
    node .github/scripts/generate-article.js "${{ github.event.client_payload.article_id }}" "${{ github.event.client_payload.article_filename }}"
```

## ✅ Verification

Script sẽ hiển thị environment check:

```
🔍 Environment check:
  - Running in: GitHub Actions
  - SUPABASE_URL: ✅ Set
  - SUPABASE_ANON_KEY: ✅ Set
```

## 🛡️ Security Benefits

1. **GitHub Secrets**: Encrypted, không hiển thị trong logs
2. **Scope limited**: Chỉ available trong GitHub Actions
3. **Access control**: Chỉ repository collaborators có thể edit
4. **Audit trail**: GitHub log mọi thay đổi secrets

## 🔄 Dual Mode Support

Script support cả hai mode:

| Environment | Credentials Source | Use Case |
|-------------|-------------------|----------|
| **Local** | `.env` file | Development & testing |
| **GitHub Actions** | GitHub Secrets | Production auto-deploy |

## 📝 Next Steps

1. ✅ Setup GitHub Secrets (SUPABASE_URL, SUPABASE_ANON_KEY)
2. ✅ Test workflow manually  
3. ✅ Test via Edge Function trigger
4. ✅ Monitor deployment logs

Sau khi setup, GitHub Actions sẽ tự động lấy credentials từ secrets! 🚀