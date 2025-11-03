# 🗂️ Hướng Dẫn Setup Supabase Storage

## Tổng quan

Hệ thống admin sử dụng Supabase Storage để lưu trữ ảnh và database để quản lý metadata. Hướng dẫn này sẽ giúp bạn thiết lập đầy đủ.

## 📋 Yêu cầu

- Tài khoản Supabase (miễn phí tại [supabase.com](https://supabase.com))
- Project Supabase đã tạo

## 🚀 Các bước thực hiện

### Bước 1: Tạo Storage Bucket

1. **Đăng nhập** vào [Supabase Dashboard](https://supabase.com/dashboard)
2. **Chọn project** của bạn
3. Vào **Storage** trong sidebar trái
4. Nhấn **"New bucket"**
5. Điền thông tin:
   - **Name**: `images`
   - **Public bucket**: ✅ **Bật** (để có thể truy cập public URLs)
6. Nhấn **"Create bucket"**

### Bước 2: Cấu hình Storage Policies

Vào **Storage** > **Policies** và thêm các policies sau:

```sql
-- 1. Allow public read access (đọc công khai)
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'images');

-- 2. Allow authenticated uploads (upload với auth)
CREATE POLICY "Allow uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'images');

-- 3. Allow authenticated updates (cập nhật với auth)
CREATE POLICY "Allow updates" ON storage.objects
FOR UPDATE USING (bucket_id = 'images');

-- 4. Allow authenticated deletes (xóa với auth)
CREATE POLICY "Allow deletes" ON storage.objects
FOR DELETE USING (bucket_id = 'images');
```

### Bước 3: Tạo Database Tables

Vào **SQL Editor** và chạy script sau:

```sql
-- Tạo bảng articles (bài viết)
CREATE TABLE IF NOT EXISTS articles (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  category TEXT DEFAULT 'TIN TỨC',
  keywords TEXT,
  filename TEXT UNIQUE,
  published_date DATE,
  is_published BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'draft',
  feature_image_url TEXT, -- URL của ảnh đại diện
  tags TEXT,
  is_featured BOOLEAN DEFAULT false,
  rendered_html TEXT,
  template_version TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tạo bảng article_images (metadata ảnh)
CREATE TABLE IF NOT EXISTS article_images (
  id BIGSERIAL PRIMARY KEY,
  article_id BIGINT REFERENCES articles(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_name TEXT,
  file_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  source TEXT DEFAULT 'upload', -- 'upload', 'tinymce-editor', 'feature'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tạo indexes để tối ưu performance
CREATE INDEX IF NOT EXISTS idx_article_images_article_id ON article_images(article_id);
CREATE INDEX IF NOT EXISTS idx_articles_filename ON articles(filename);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(is_published, published_date);
```

### Bước 4: Thiết lập Row Level Security (RLS)

```sql
-- Bật RLS cho tất cả tables
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_images ENABLE ROW LEVEL SECURITY;

-- Policies cho bảng articles
CREATE POLICY "Allow public read access" ON articles
FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert" ON articles
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON articles
FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated delete" ON articles
FOR DELETE USING (true);

-- Policies cho bảng article_images
CREATE POLICY "Allow public read access" ON article_images
FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert" ON article_images
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON article_images
FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated delete" ON article_images
FOR DELETE USING (true);
```

### Bước 5: Lấy thông tin kết nối

1. Vào **Settings** > **API**
2. Copy các thông tin sau:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public key**: `eyJ0eXAiOiJKV1Qi...` (chuỗi rất dài)

### Bước 6: Cấu hình trong Admin Interface

1. **Mở file**: `admin-compose-e8d6c754705d3fce.html`
2. **Tìm đoạn code**:
   ```javascript
   const SUPABASE_CONFIG = {
     url: "https://your-project-id.supabase.co", // ⚠️ THAY ĐỔI URL NÀY
     anonKey: null,
   };
   ```
3. **Thay thế URL** bằng Project URL của bạn
4. **Lưu file**

### Bước 7: Nhập Anon Key

1. **Mở admin interface** trong browser
2. **Nhấn nút "⚙️ Cấu hình"**
3. **Nhập anon public key** vào popup
4. **Nhấn nút "🧪 Test kết nối"** để kiểm tra

## ✅ Kiểm tra Setup

### Test cơ bản:

1. **Status indicator** phải hiển thị màu xanh: `✅ Supabase đã kết nối`
2. **Test connection** phải thành công
3. **Upload ảnh** trong TinyMCE editor phải hoạt động

### Test upload ảnh:

1. Mở TinyMCE editor
2. Nhấn nút **Image** trong toolbar
3. Chọn ảnh để upload
4. Ảnh phải được upload lên Storage thành công

### Test feature image:

1. Drag & drop ảnh vào khung **Feature Image**
2. Ảnh phải hiện preview
3. Khi lưu bài viết, feature image URL phải được lưu vào database

## 🚨 Troubleshooting

### Lỗi "ERR_CONNECTION_TIMED_OUT":

- ✅ Kiểm tra URL Supabase đúng
- ✅ Kiểm tra anon key hợp lệ
- ✅ Kiểm tra kết nối internet

### Lỗi "StorageUnknownError":

- ✅ Kiểm tra bucket `images` đã tạo
- ✅ Kiểm tra bucket policies đã thiết lập
- ✅ Kiểm tra bucket là **public**

### Upload ảnh thất bại:

- ✅ Hệ thống sẽ tự động fallback sang base64
- ✅ Ảnh vẫn sẽ hiện trong editor
- ✅ Kiểm tra console để xem lỗi chi tiết

### Database connection failed:

- ✅ Kiểm tra RLS policies đã thiết lập
- ✅ Kiểm tra bảng `articles` và `article_images` đã tạo
- ✅ Thử chạy lại SQL scripts

## 🎯 Kết quả mong đợi

Sau khi setup thành công:

- ✅ Upload ảnh trong TinyMCE lên Supabase Storage
- ✅ Upload feature image cho bài viết
- ✅ Lưu metadata ảnh vào database
- ✅ Hiển thị status kết nối real-time
- ✅ Auto-fallback sang base64 khi có lỗi
- ✅ Cleanup ảnh không sử dụng

## 📞 Hỗ trợ

Nếu gặp vấn đề, kiểm tra:

1. **Browser Console** để xem error logs
2. **Supabase Logs** trong dashboard
3. **Network tab** để kiểm tra requests
4. **Storage bucket** có tồn tại và public không

---

📚 **Tài liệu tham khảo**: [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
