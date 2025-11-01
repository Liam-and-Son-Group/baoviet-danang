# 🔧 FIX DATABASE ERROR - HƯỚNG DẪN

## ❌ **LỖI GẶP PHẢI:**

```
Could not find the 'is_featured' column of 'articles' in the schema cache
```

## 🎯 **NGUYÊN NHÂN:**

Code đang cố gắng lưu vào các cột chưa tồn tại trong database Supabase:

- `is_featured`
- `tags`
- `rendered_html`
- `template_version`

## ✅ **ĐÃ SỬA:**

Code admin đã được cập nhật để **chỉ lưu những cột đã có** trong database hiện tại.

### **Trạng thái hiện tại:**

- ✅ Có thể lưu bài viết bình thường
- ✅ Không gặp lỗi database
- ❌ Chưa có tính năng: tags, featured, rendered HTML

## 🚀 **2 PHƯƠNG ÁN:**

### **PHƯƠNG ÁN 1: SỬ DỤNG NGAY (Đơn giản)**

Không làm gì thêm. Hệ thống sẽ hoạt động với database hiện tại:

- Lưu được: title, description, content, category, keywords, filename, published_date
- Không lưu: tags, featured, rendered_html

### **PHƯƠNG ÁN 2: NÂNG CẤP DATABASE (Đầy đủ tính năng)**

#### **Bước 1: Cập nhật Supabase Schema**

Truy cập Supabase Dashboard → SQL Editor → Chạy lệnh:

```sql
-- Thêm cột tags
ALTER TABLE articles
ADD COLUMN tags TEXT;

-- Thêm cột featured
ALTER TABLE articles
ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;

-- Thêm cột rendered HTML
ALTER TABLE articles
ADD COLUMN rendered_html TEXT;

-- Thêm cột template version
ALTER TABLE articles
ADD COLUMN template_version TEXT DEFAULT '1.0';

-- Tạo index cho performance
CREATE INDEX idx_articles_is_featured ON articles(is_featured);
```

#### **Bước 2: Kích hoạt code trong Admin**

Sau khi tạo cột trong database, uncomment các dòng code:

**Trong function `saveToSupabase()`:**

```javascript
// Uncomment những dòng này:
if (formData.tags) {
  articleData.tags = formData.tags;
}

if (formData.featured !== undefined) {
  articleData.is_featured = formData.featured;
}

if (renderedHTML) {
  articleData.rendered_html = renderedHTML;
  articleData.template_version = "1.0";
}
```

## 🔍 **KIỂM TRA DATABASE HIỆN TẠI:**

### **Cách 1: Qua Supabase Dashboard**

1. Vào Supabase Dashboard
2. Table Editor → articles
3. Xem có những cột nào

### **Cách 2: Qua SQL**

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'articles';
```

## 📋 **CẤU TRÚC DATABASE TỐI THIỂU:**

### **Cột bắt buộc (đã có):**

```sql
CREATE TABLE articles (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  keywords TEXT,
  filename TEXT UNIQUE,
  published_date DATE,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### **Cột mở rộng (có thể thêm):**

```sql
-- Thêm vào để có đầy đủ tính năng
ALTER TABLE articles ADD COLUMN tags TEXT;
ALTER TABLE articles ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE articles ADD COLUMN rendered_html TEXT;
ALTER TABLE articles ADD COLUMN template_version TEXT DEFAULT '1.0';
```

## 🎯 **KHUYẾN NGHỊ:**

### **Nếu bạn muốn sử dụng ngay:**

→ Chọn **PHƯƠNG ÁN 1** - Không cần làm gì thêm

### **Nếu bạn muốn đầy đủ tính năng:**

→ Chọn **PHƯƠNG ÁN 2** - Cập nhật database

## 🔄 **MIGRATION SAFE:**

Code hiện tại đã được viết để:

- ✅ **Backward compatible**: Hoạt động với database cũ
- ✅ **Forward compatible**: Sẵn sàng cho database mới
- ✅ **No breaking changes**: Không làm hỏng dữ liệu hiện có

## 🆘 **NẾU VẪN GẶP LỖI:**

Kiểm tra lại:

1. **Supabase URL** đúng chưa?
2. **API Key** có quyền write không?
3. **Table name** là `articles` chưa?
4. **Network connection** ổn định không?

## 📞 **SUPPORT:**

Nếu cần hỗ trợ thêm, cung cấp:

- Screenshot Supabase table structure
- Console error log
- Current database schema
