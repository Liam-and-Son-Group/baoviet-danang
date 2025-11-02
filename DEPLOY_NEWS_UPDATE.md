# 📰 Hướng Dẫn Cập Nhật Trang Tin Tức Tự Động

## 🎯 Tổng Quan

Khi deploy bài viết, hệ thống sẽ tự động cập nhật trang `tin-tuc.html` để hiển thị danh sách bài viết mới nhất.

## 🔄 Workflow Tự Động

### 1. Khi Lưu và Xuất Bản (`saveAndPublish`)

- Lưu bài viết vào database với trạng thái `published`
- Tự động trigger deploy workflow
- **Tự động cập nhật trang tin-tuc.html**

### 2. Khi Deploy Thủ Công (`manualDeploy`)

- Tìm bài viết theo filename
- Trigger deploy workflow
- **Tự động cập nhật trang tin-tuc.html**

### 3. Khi Lưu và Deploy (`saveAndDeploy`)

- Lưu bài viết và deploy ngay lập tức
- **Tự động cập nhật trang tin-tuc.html**

## 🛠️ Functions Mới

### `updateNewsPage()`

- Lấy 15 bài viết mới nhất đã published từ database
- Gọi Supabase Edge Function `update-news-page`
- Cập nhật file `tin-tuc.html` với danh sách mới

### Thứ tự thực hiện:

1. **Cập nhật trang tin tức trước** (`updateNewsPage()`)
2. **Deploy bài viết** (`deploy-article` Edge Function)

## 🎮 Sử Dụng

### Tự Động (Khuyến Nghị)

```javascript
// Khi click nút "Lưu và Xuất bản"
await saveAndPublish(); // Tự động cập nhật tin-tuc.html
```

### Thủ Công

```javascript
// Chỉ cập nhật trang tin tức (không deploy bài viết)
await updateNewsPage();

// Deploy bài viết cụ thể (cũng cập nhật tin-tuc.html)
await manualDeploy();
```

### Console Commands

```javascript
// Test cập nhật trang tin tức
window.updateNewsPage();

// Test deploy thủ công
window.manualDeploy();
```

## 📋 Yêu Cầu Edge Functions

### 1. `update-news-page`

- **Input**: Danh sách articles đã published
- **Output**: Cập nhật file tin-tuc.html trong GitHub repo
- **Status**: Cần deploy Edge Function này

### 2. `deploy-article` (Đã có)

- **Input**: article_id
- **Output**: Tạo file HTML cho bài viết
- **Status**: Đã hoạt động

## 🔍 Troubleshooting

### Lỗi "Edge Function not found"

```
❌ Edge Function "update-news-page" chưa được deploy!
```

**Giải pháp**: Deploy Edge Function `update-news-page` trên Supabase

### Lỗi không có bài viết

```
⚠️ Không có bài viết nào để cập nhật trang tin tức
```

**Giải pháp**: Đảm bảo có ít nhất 1 bài viết với `is_published = true`

## 🎨 UI Updates

### Nút Mới Thêm

- **📰 Cập nhật Trang Tin Tức**: Nút riêng để chỉ cập nhật tin-tuc.html
- **Màu**: Xanh lá (`#28a745`)
- **Vị trí**: Trong action buttons panel

### Thông Báo Status

- `📰 Đang cập nhật trang tin tức...`
- `✅ Đã cập nhật trang tin tức thành công!`
- `❌ Cập nhật trang tin tức thất bại: [error]`

## 🎭 Demo Workflow

1. **Viết bài mới** → Điền form
2. **Click "Lưu và Xuất bản"** → Auto save + auto deploy + auto update news page
3. **Kiểm tra trang tin-tuc.html** → Bài viết mới xuất hiện đầu danh sách
4. **Xong!** 🎉

---

**Note**: Tính năng này đảm bảo trang tin tức luôn đồng bộ với database, không cần cập nhật thủ công.
