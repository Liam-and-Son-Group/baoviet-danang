# 📰 Supabase Edge Function: update-news-page

## 🎯 Mục đích

Tự động cập nhật file `tin-tuc.html` với danh sách bài viết mới nhất từ database.

## 🔧 Setup và Deploy

### 1. **Tạo thư mục**

```bash
mkdir -p supabase/functions/update-news-page
```

### 2. **Copy code**

Đã tạo file `supabase/functions/update-news-page/index.ts`

### 3. **Set Environment Variables**

```bash
# Set GitHub Token cho Supabase
supabase secrets set GITHUB_TOKEN=your_github_personal_access_token
```

**GitHub Token cần permissions:**

- `repo` (Full repository access)
- `workflow` (Update GitHub Actions workflows)

### 4. **Deploy Edge Function**

```bash
# Deploy function lên Supabase
supabase functions deploy update-news-page

# Verify function đã deploy
supabase functions list
```

## 📋 Function Input/Output

### **Input** (từ admin interface)

```typescript
{
  articles: Article[],        // Array 15 bài viết unique
  total_count: number,        // Số lượng gốc từ database
  unique_count: number,       // Số lượng sau deduplicate
  trigger_source: string      // 'admin_interface'
}
```

### **Output** (trả về admin)

```typescript
// Success
{
  success: true,
  articles_count: 15,
  total_count: 20,
  unique_count: 15,
  github_update: {
    commit_sha: "abc123...",
    commit_url: "https://github.com/...",
    file_url: "https://github.com/..."
  },
  trigger_source: "admin_interface",
  updated_at: "2025-11-02T10:30:00.000Z"
}

// Error
{
  success: false,
  error: "Error message",
  timestamp: "2025-11-02T10:30:00.000Z"
}
```

## 🎨 Function Features

### ✅ **Auto HTML Generation**

- Tạo full HTML từ template
- Dynamic news items từ database
- Responsive design với CSS
- SEO-friendly meta tags

### ✅ **Smart Image Mapping**

- Map filename → image path
- Fallback pattern cho articles mới
- Support existing image structure

### ✅ **GitHub Integration**

- Tự động commit vào repository
- Update file `tin-tuc.html` trên branch `master`
- Professional commit messages

### ✅ **Error Handling**

- CORS support
- Detailed error messages
- Graceful fallbacks

## 🔍 Testing

### **Local Test**

```bash
# Start Supabase locally
supabase start

# Test function
curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/update-news-page' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "articles": [...],
    "total_count": 20,
    "unique_count": 15,
    "trigger_source": "test"
  }'
```

### **Production Test**

Từ admin interface → Click nút "📰 Cập nhật Trang Tin Tức"

## 📁 File Structure Generated

```html
tin-tuc.html ├── Header/Navigation (giữ nguyên) ├── Breadcrumb ├── Title + Meta
info ├── News Items Loop: │ ├── Article card với image │ ├── Title, description,
category │ ├── Publish date │ └── "Xem chi tiết" link └── Footer (giữ nguyên)
```

## 🚀 Auto-trigger Workflow

1. **Admin viết bài** → Click "Lưu và Xuất bản"
2. **saveAndPublish()** → Gọi `triggerGitHubDeploy()`
3. **triggerGitHubDeploy()** → Gọi `updateNewsPage()`
4. **updateNewsPage()** → Gọi Edge Function này
5. **Edge Function** → Cập nhật `tin-tuc.html` trên GitHub
6. **GitHub Pages** → Auto deploy từ commit mới

## ⚡ Performance

- **Fast**: Chỉ update 1 file HTML
- **Efficient**: Deduplicated data input
- **Scalable**: Works với unlimited articles
- **Reliable**: Error handling + retry logic

## 🔒 Security

- **GitHub Token**: Stored as Supabase secret
- **CORS**: Properly configured
- **Auth**: Requires Supabase authentication
- **Validation**: Input validation cho articles

---

**Deploy command:**

```bash
supabase functions deploy update-news-page
```

**Test command:**

```javascript
// From admin interface console
window.updateNewsPage();
```

🎉 **Ready to use!**
