# 🚨 Fix GitHub Actions Permission Denied Error

## ❌ **Lỗi Hiện Tại**

```
remote: Permission to Liam-and-Son-Group/baoviet-danang.git denied to github-actions[bot].
fatal: unable to access 'https://github.com/...': The requested URL returned error: 403
Error: Process completed with exit code 128.
```

## 🔍 **Nguyên Nhân**

GitHub Actions `GITHUB_TOKEN` có **limited permissions** và không thể push vào repository trong một số trường hợp.

## ✅ **Solutions (2 Options)**

### 🛠️ **Option 1: Fix Permissions (đã áp dụng)**

#### ✅ Đã thêm permissions vào workflow:

```yaml
jobs:
  deploy-article:
    permissions:
      contents: write # Cho phép push code
      pages: write # Cho phép deploy GitHub Pages
      id-token: write # Cho phép authentication
```

#### ✅ Đã fix git push command:

```yaml
- name: 🔄 Commit & Push Changes
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: |
    git push origin HEAD  # Thay vì chỉ 'git push'
```

### 🔑 **Option 2: Personal Access Token (nếu Option 1 không work)**

#### Bước 1: Tạo Personal Access Token

```
1. Vào: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Scopes cần chọn:
   ✅ repo (Full control of private repositories)
   ✅ workflow (Update GitHub Action workflows)
4. Copy token
```

#### Bước 2: Thêm vào Repository Secrets

```
1. Vào: https://github.com/Liam-and-Son-Group/baoviet-danang/settings/secrets/actions
2. Click "New repository secret"
3. Name: PERSONAL_ACCESS_TOKEN
   Value: [paste token từ bước 1]
```

#### Bước 3: Update workflow để sử dụng PAT

```yaml
- name: 📥 Checkout Repository
  uses: actions/checkout@v4
  with:
    token: ${{ secrets.PERSONAL_ACCESS_TOKEN }} # Thay vì GITHUB_TOKEN
    fetch-depth: 0
```

## 🧪 **Test Fix**

### Test với permissions fix hiện tại:

```bash
# Trigger workflow manually
gh workflow run deploy-new-article.yml \
  -f article_id="85bf05a9-edaa-40b3-96a6-12d27cff3c77" \
  -f article_filename="test-permissions.html"
```

### Kiểm tra workflow logs:

```
1. Vào: https://github.com/Liam-and-Son-Group/baoviet-danang/actions
2. Click vào latest workflow run
3. Check "🔄 Commit & Push Changes" step
```

## 🔧 **Repository Settings Check**

Đảm bảo GitHub Actions có permissions:

### Bước 1: Repository Settings

```
Settings → Actions → General
```

### Bước 2: Workflow permissions

```
✅ Read and write permissions
✅ Allow GitHub Actions to create and approve pull requests
```

## 🎯 **Expected Fix Results**

Sau khi fix, workflow sẽ:

```
✅ Generate article HTML
✅ Update sitemap
✅ Commit changes
✅ Push to repository
✅ Deploy to GitHub Pages
```

## 📋 **Debug Steps nếu vẫn fail**

1. **Check repository permissions**: Settings → Actions → General
2. **Try Personal Access Token**: Theo Option 2 ở trên
3. **Check branch protection rules**: Có thể main/master branch có protection
4. **Verify secrets**: Đảm bảo SUPABASE credentials đã được set

## 🚀 **Next Actions**

1. ✅ **Permissions đã được thêm** - test lại workflow
2. 🔲 Nếu vẫn fail → Setup Personal Access Token
3. 🔲 Verify repository settings
4. 🔲 Test complete auto-deploy flow

Most likely **Option 1 permissions fix sẽ resolve** vấn đề này! 🎉
