# 🔑 GITHUB_TOKEN - Built-in Secret Explanation

## ❓ **Câu hỏi**: `GITHUB_TOKEN` được set qua đâu?

## ✅ **Trả lời**: GITHUB_TOKEN là **AUTOMATIC** - không cần setup!

## 🤖 GITHUB_TOKEN là gì?

`GITHUB_TOKEN` là một **built-in secret** được GitHub Actions tự động tạo cho mỗi workflow run. **KHÔNG CẦN SETUP MANUAL!**

### 🔍 Trong workflow hiện tại:

```yaml
# Line 26: Checkout repository
- name: 📥 Checkout Repository
  uses: actions/checkout@v4
  with:
    token: ${{ secrets.GITHUB_TOKEN }} # ← Tự động có sẵn
    fetch-depth: 0

# Line 64: Deploy to GitHub Pages
- name: 🎯 Deploy to GitHub Pages
  uses: peaceiris/actions-gh-pages@v3
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }} # ← Tự động có sẵn
```

## 🆚 So Sánh Các Loại Tokens

| Token Type              | Setup Required      | Purpose                 | In Workflow    |
| ----------------------- | ------------------- | ----------------------- | -------------- |
| **`GITHUB_TOKEN`**      | ❌ **Automatic**    | Basic repo operations   | ✅ Built-in    |
| **`SUPABASE_URL`**      | ✅ **Manual setup** | Connect to Supabase     | ❌ Need to add |
| **`SUPABASE_ANON_KEY`** | ✅ **Manual setup** | Supabase authentication | ❌ Need to add |

## 🔐 GITHUB_TOKEN Permissions

GitHub tự động cấp permissions cho `GITHUB_TOKEN`:

- ✅ **Read repository content**
- ✅ **Write to repository** (commit, push)
- ✅ **Deploy to GitHub Pages**
- ✅ **Access repository metadata**

## 🎯 Tokens Bạn CẦN Setup

### ❌ KHÔNG CẦN:

- `GITHUB_TOKEN` ← **Automatic**

### ✅ CẦN SETUP:

```bash
# Trong GitHub Repository Secrets:
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key
```

## 📍 Cách Setup Repository Secrets

### Bước 1: Vào Repository Settings

```
https://github.com/Liam-and-Son-Group/baoviet-danang/settings/secrets/actions
```

### Bước 2: Add Repository Secrets

```
1. Click "New repository secret"
2. Name: SUPABASE_URL
   Value: [Supabase Project URL]

3. Click "New repository secret"
4. Name: SUPABASE_ANON_KEY
   Value: [Supabase anon key]
```

### Bước 3: Lấy Values từ Supabase

```
1. Vào: https://supabase.com/dashboard
2. Chọn project: baoviet-danang
3. Settings → API
4. Copy "Project URL" → SUPABASE_URL
5. Copy "anon public" → SUPABASE_ANON_KEY
```

## 🧪 Test Workflow

Sau khi setup Supabase secrets:

```bash
# Manual trigger
gh workflow run deploy-new-article.yml \
  -f article_id="85bf05a9-edaa-40b3-96a6-12d27cff3c77" \
  -f article_filename="test.html"
```

## 📋 Final Checklist

- [x] ✅ **GITHUB_TOKEN** - Automatic, không cần setup
- [ ] 🔲 **SUPABASE_URL** - Cần setup trong Repository Secrets
- [ ] 🔲 **SUPABASE_ANON_KEY** - Cần setup trong Repository Secrets

## 🎉 Summary

**GITHUB_TOKEN không cần setup** - GitHub tự động cung cấp!

Chỉ cần setup **SUPABASE credentials** trong Repository Secrets là workflow sẽ hoạt động! 🚀
