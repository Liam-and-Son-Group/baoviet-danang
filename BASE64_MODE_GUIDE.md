# 📱 Hướng Dẫn Base64 Mode

## Tổng quan

Hệ thống admin đã được cập nhật để sử dụng **Base64 Mode** - tất cả ảnh sẽ được chuyển đổi sang định dạng base64 và lưu trực tiếp trong database/HTML thay vì upload lên Storage.

## ✅ Ưu điểm Base64 Mode

### 🚀 **Đơn giản**

- Không cần setup Supabase Storage
- Không cần cấu hình bucket hay policies
- Không phụ thuộc vào external storage
- Không có /your-project-id.supabase.colỗi network timeout

### 💾 **Độc lập**

- Ảnh được embed trực tiếp trong HTML
- Không cần lo về broken image links
- Backup dễ dàng (chỉ cần backup database)
- Hoạt động offline

### 🔒 **Bảo mật**

- Không cần public storage bucket
- Ảnh được bảo vệ bởi database security
- Không có public URLs có thể bị truy cập trái phép

## ⚠️ Lưu ý Base64 Mode

### 📏 **Kích thước file**

- Base64 tăng kích thước ảnh lên ~33%
- Nên sử dụng ảnh dưới 1MB
- Tối đa cho phép: 5MB

### 🌐 **Performance**

- HTML file sẽ lớn hơn
- Caching browser hiệu quả hơn (không cần request riêng cho ảnh)
- Phù hợp cho website có ít ảnh

## 🛠️ Hướng dẫn sử dụng

### 1. **Upload ảnh trong TinyMCE Editor**

1. Nhấn nút **Image** trong toolbar
2. Chọn ảnh từ máy tính
3. Ảnh sẽ tự động chuyển đổi sang base64
4. Hiển thị ngay trong editor

### 2. **Upload Feature Image**

1. Drag & drop ảnh vào khung **Feature Image**
2. Ảnh sẽ được chuyển đổi sang base64
3. Preview hiển thị ngay lập tức
4. Lưu cùng bài viết

### 3. **Upload ảnh bổ sung**

1. Drag & drop vào khung **Upload Images**
2. Nhấn nút **📝** để chèn vào editor
3. Hoặc nhấn **📋** để copy path

## 📊 So sánh với Storage Mode

| Tiêu chí         | Base64 Mode        | Storage Mode            |
| ---------------- | ------------------ | ----------------------- |
| **Setup**        | ✅ Không cần       | ❌ Cần setup phức tạp   |
| **Dependencies** | ✅ Không có        | ❌ Cần Supabase Storage |
| **Network**      | ✅ Không phụ thuộc | ❌ Cần internet ổn định |
| **File size**    | ⚠️ +33% size       | ✅ Nhỏ gọn              |
| **Caching**      | ✅ Cache cùng HTML | ⚠️ Cache riêng biệt     |
| **Backup**       | ✅ Đơn giản        | ❌ Phức tạp             |

## 💡 Best Practices

### 🖼️ **Tối ưu ảnh trước upload**

- Resize ảnh về kích thước phù hợp
- Sử dụng WebP format để giảm size
- Compress ảnh trước khi upload

### 📝 **Content Strategy**

- Sử dụng ít ảnh cho bài viết ngắn
- Ảnh chất lượng cao cho feature image
- Cân nhắc sử dụng icon thay vì ảnh nhỏ

### 🗄️ **Database Management**

- Định kỳ cleanup ảnh không sử dụng
- Monitor database size
- Backup thường xuyên

## 🔧 Technical Details

### **Base64 Encoding**

```
Original Image → FileReader.readAsDataURL() → Base64 String
```

### **Storage trong Database**

```sql
-- Feature image được lưu trong articles.feature_image_url
-- Content images được embed trực tiếp trong articles.content
-- Không cần article_images table cho base64 mode
```

### **HTML Output**

```html
<!-- Feature Image -->
<img src="data:image/jpeg;base64,/9j/4AAQSkZJRgABA..." alt="Feature" />

<!-- Content Images -->
<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..." alt="Content" />
```

## 🚨 Troubleshooting

### **Ảnh không hiển thị**

- ✅ Kiểm tra ảnh có được chuyển đổi thành công
- ✅ Xem console log có lỗi FileReader
- ✅ Đảm bảo file là định dạng ảnh hợp lệ

### **Upload chậm**

- ✅ Giảm kích thước ảnh
- ✅ Sử dụng format WebP thay vì PNG
- ✅ Kiểm tra RAM browser

### **Database quá lớn**

- ✅ Cleanup ảnh không sử dụng
- ✅ Resize ảnh về kích thước nhỏ hơn
- ✅ Cân nhắc chuyển lại Storage mode

## ✨ Kết luận

**Base64 Mode** là lựa chọn tốt cho:

- ✅ Websites nhỏ và vừa
- ✅ Không muốn phụ thuộc external storage
- ✅ Ưu tiên đơn giản hóa setup
- ✅ Số lượng ảnh ít

**Chuyển lại Storage Mode** nếu:

- ❌ Website có nhiều ảnh lớn
- ❌ Database size quá lớn
- ❌ Cần optimize performance tối đa
- ❌ Có team devops để manage storage

---

📚 **Cần hỗ trợ?** Kiểm tra browser console để xem error logs chi tiết.
