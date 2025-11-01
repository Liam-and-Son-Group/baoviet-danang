# Hướng dẫn Row Level Security (RLS) cho CMS Bảo Việt Đà Nẵng

## 🎯 Tổng quan hệ thống phân quyền

Hệ thống sử dụng **Row Level Security (RLS)** của Supabase để kiểm soát quyền truy cập dữ liệu ở cấp độ hàng, đảm bảo người dùng chỉ có thể truy cập và thao tác với dữ liệu theo vai trò của mình.

## 👥 Các vai trò người dùng

### 1. **Admin** (Quản trị viên)

- **Quyền hạn:** Toàn quyền quản lý hệ thống
- **Có thể:**
  - ✅ Xem tất cả bài viết (đã/chưa xuất bản)
  - ✅ Chỉnh sửa bất kỳ bài viết nào
  - ✅ Xóa bài viết
  - ✅ Quản lý tài khoản người dùng
  - ✅ Quản lý tất cả hình ảnh
  - ✅ Xuất bản/hủy xuất bản bài viết

### 2. **Editor** (Biên tập viên)

- **Quyền hạn:** Chỉnh sửa nội dung
- **Có thể:**
  - ✅ Xem tất cả bài viết
  - ✅ Chỉnh sửa bài viết chưa xuất bản
  - ✅ Quản lý hình ảnh của mình
  - ❌ Không thể xóa bài viết
  - ❌ Không thể sửa bài viết đã xuất bản (trừ admin)

### 3. **Writer** (Người viết bài)

- **Quyền hạn:** Tạo và quản lý bài viết của mình
- **Có thể:**
  - ✅ Tạo bài viết mới
  - ✅ Xem và sửa bài viết của mình (chưa xuất bản)
  - ✅ Upload và quản lý hình ảnh của mình
  - ✅ Xem bài viết đã xuất bản của tất cả mọi người
  - ❌ Không thể sửa bài viết của người khác
  - ❌ Không thể xuất bản bài viết

### 4. **Viewer** (Người xem)

- **Quyền hạn:** Chỉ xem nội dung
- **Có thể:**
  - ✅ Xem bài viết đã xuất bản
  - ❌ Không thể tạo/sửa/xóa bài viết
  - ❌ Không thể upload hình ảnh

## 🔐 Cơ chế RLS hoạt động

### Bảng `articles`

```sql
-- Ai cũng có thể đọc bài viết đã xuất bản
CREATE POLICY "Public can read published articles" ON articles
    FOR SELECT USING (is_published = true);

-- Tác giả có thể đọc bài viết của mình
CREATE POLICY "Authors can read own articles" ON articles
    FOR SELECT USING (auth.uid() = author_id);

-- Writer có thể tạo bài viết và tự động thành tác giả
CREATE POLICY "Writers can create articles" ON articles
    FOR INSERT WITH CHECK (
        get_user_role(auth.uid()) IN ('writer', 'editor', 'admin')
        AND auth.uid() = author_id
    );

-- Tác giả chỉ có thể sửa bài viết chưa xuất bản của mình
CREATE POLICY "Authors can edit own unpublished articles" ON articles
    FOR UPDATE USING (
        auth.uid() = author_id
        AND is_published = false
    );
```

### Bảng `user_profiles`

```sql
-- User chỉ có thể xem profile của mình
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Admin có thể xem và quản lý tất cả profile
CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (get_user_role(auth.uid()) = 'admin');
```

### Storage `images`

```sql
-- Tự động phân quyền theo folder user
-- Upload: /user_id/filename.jpg
-- Mỗi user chỉ có thể quản lý file trong folder của mình
CREATE POLICY "Allow users to update own images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'images'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
```

## 🚀 Hướng dẫn triển khai

### 1. Tạo database schema

```bash
# Chạy file SQL trong Supabase SQL Editor
psql -f supabase-schema.sql
```

### 2. Cấu hình email templates (tuỳ chọn)

```sql
-- Trong Supabase Dashboard > Authentication > Email Templates
-- Thêm custom signup template để thu thập thông tin role
```

### 3. Tạo tài khoản admin đầu tiên

```sql
-- Sau khi user đăng ký qua Auth, cập nhật role thành admin
UPDATE user_profiles
SET role = 'admin', department = 'IT'
WHERE email = 'your-admin@email.com';
```

## 🛡️ Bảo mật và best practices

### 1. **Function bảo mật**

```sql
-- Tất cả functions dùng SECURITY DEFINER
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
-- Function chạy với quyền của owner, không phải caller
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. **Tự động populate author**

```sql
-- Trigger tự động điền thông tin tác giả khi tạo bài viết
CREATE TRIGGER populate_article_author
    BEFORE INSERT ON articles
    FOR EACH ROW EXECUTE FUNCTION populate_author_info();
```

### 3. **Audit trail**

- Tất cả bảng có `created_at` và `updated_at`
- Trigger tự động cập nhật `updated_at`
- Lưu thông tin `author_id`, `author_email`, `author_name`

## 📱 Cập nhật Admin Interface

### Thêm hiển thị role trong admin editor:

```javascript
// Thêm vào admin-e8d6c754705d3fce.html
async function getCurrentUserRole() {
  if (!supabase) return "viewer";

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return "viewer";

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role, full_name")
    .eq("id", user.user.id)
    .single();

  return profile?.role || "viewer";
}

async function showUserInfo() {
  const role = await getCurrentUserRole();
  const roleDisplay = {
    admin: "👑 Quản trị viên",
    editor: "✏️ Biên tập viên",
    writer: "📝 Người viết bài",
    viewer: "👁️ Người xem",
  };

  showStatus(`Chào mừng ${roleDisplay[role]}!`, "info");
}
```

### Điều kiện hiển thị nút theo role:

```javascript
async function setupUIByRole() {
  const role = await getCurrentUserRole();

  // Chỉ admin mới thấy nút xóa
  if (role !== "admin") {
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.style.display = "none";
    });
  }

  // Writer không thể xuất bản
  if (role === "writer") {
    document.getElementById("publishBtn").style.display = "none";
  }
}
```

## 🔄 Workflow thông thường

### 1. **Writer tạo bài viết:**

1. Đăng nhập với role `writer`
2. Tạo bài viết mới → tự động thành `author_id`
3. Upload hình ảnh → lưu trong folder `/user_id/`
4. Lưu bài viết với `is_published = false`
5. Gửi thông báo cho editor review

### 2. **Editor review:**

1. Đăng nhập với role `editor`
2. Xem danh sách bài viết chưa xuất bản
3. Chỉnh sửa nội dung nếu cần
4. Đánh dấu ready để admin xuất bản

### 3. **Admin xuất bản:**

1. Đăng nhập với role `admin`
2. Review cuối cùng
3. Cập nhật `is_published = true`
4. Bài viết hiển thị public

## ⚠️ Lưu ý quan trọng

1. **Không thể downgrade role:** Chỉ admin mới có thể thay đổi role
2. **Backup định kỳ:** Database có thông tin quan trọng
3. **Monitor logs:** Theo dõi các thao tác quan trọng
4. **SSL required:** Bắt buộc HTTPS cho production
5. **API Key security:** Không commit API keys vào code

---

_Hệ thống này đảm bảo bảo mật cao và phân quyền rõ ràng cho CMS của Bảo Việt Đà Nẵng!_ 🚀
