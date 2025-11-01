# HỆ THỐNG TEMPLATE ENGINE - HƯỚNG DẪN SỬ DỤNG

## 🎯 **TỔNG QUAN HỆ THỐNG**

Hệ thống Template Engine đã được triển khai hoàn chỉnh với các tính năng:

### **📁 Cấu trúc file:**

```
📦 Project Root
├── 📄 admin-e8d6c754705d3fce.html      # Admin interface (đã cập nhật)
├── 📄 news-template-engine.js           # Template Engine core
└── 📁 templates/
    ├── 📁 news/
    │   └── 📄 article.html              # Main article template
    └── 📁 partials/
        ├── 📄 floating-buttons.html     # Floating buttons
        ├── 📄 header.html               # Header navigation
        └── 📄 footer.html               # Footer content
```

## 🚀 **CÁCH SỬ DỤNG**

### **Bước 1: Mở Admin Interface**

```
http://localhost/admin-e8d6c754705d3fce.html
```

### **Bước 2: Điền thông tin bài viết**

- ✅ **Tiêu đề bài viết**: Tiêu đề chính của bài viết
- ✅ **Mô tả ngắn**: SEO description (150-160 ký tự)
- ✅ **Danh mục**: Tin tức, Sự kiện, Hướng dẫn
- ✅ **Từ khóa SEO**: Phân tách bằng dấu phẩy
- ✅ **Tags bài viết**: Tags hiển thị trên trang
- ✅ **Ngày xuất bản**: Tự động set hôm nay
- ✅ **Bài viết nổi bật**: Checkbox để đánh dấu featured
- ✅ **Nội dung**: Sử dụng TinyMCE editor

### **Bước 3: Sử dụng Template Engine**

- 🔍 **Preview HTML**: Xem trước kết quả trong tab mới
- 📄 **Xuất HTML**: Tải file HTML hoàn chỉnh
- ☁️ **Lưu vào DB**: Lưu vào Supabase (như cũ)

## 🔧 **TÍNH NĂNG TEMPLATE ENGINE**

### **Advanced Template Features:**

```html
<!-- Variables -->
{{title}} {{content}} {{meta.description}}

<!-- Conditionals -->
{{#if meta.featured}}
<div class="featured-badge">⭐ Bài viết nổi bật</div>
{{/if}}

<!-- Loops -->
{{#each tags}}
<span class="tag">{{this}}</span>
{{/each}}

<!-- Helpers -->
{{formatDate publishDate}} {{truncate description 150}} {{slugify title}}
{{canonical filename}}

<!-- Includes -->
{{include "partials/header.html"}}
```

### **Data Structure được truyền vào template:**

```javascript
{
  title: "Tiêu đề bài viết",
  content: "<p>Nội dung HTML...</p>",
  category: "TIN TỨC",
  publishDate: "2024-01-15",
  meta: {
    description: "Mô tả SEO...",
    keywords: "từ, khóa, seo",
    featured: true,
    image: "URL hình ảnh",
    imageAlt: "Alt text"
  },
  tags: ["tag1", "tag2", "tag3"],
  relatedArticles: [...],
  site: {
    name: "Bảo Hiểm Bảo Việt Đà Nẵng"
  }
}
```

## 📋 **TEMPLATE VARIABLES CHÍNH**

| Variable                     | Mô tả            | Ví dụ                          |
| ---------------------------- | ---------------- | ------------------------------ |
| `{{title}}`                  | Tiêu đề bài viết | "Bảo hiểm xe ô tô 2024"        |
| `{{content}}`                | Nội dung HTML    | `<p>...</p>`                   |
| `{{category}}`               | Danh mục         | "TIN TỨC"                      |
| `{{meta.description}}`       | Mô tả SEO        | "Tìm hiểu về..."               |
| `{{meta.keywords}}`          | Từ khóa SEO      | "bảo hiểm, xe ô tô"            |
| `{{filename}}`               | Tên file         | "bao-hiem-xe-oto.html"         |
| `{{formatDate publishDate}}` | Ngày đăng        | "15/01/2024"                   |
| `{{canonical filename}}`     | URL canonical    | "https://domain.com/file.html" |

## 🎨 **TEMPLATE CUSTOMIZATION**

### **Thêm Helper mới:**

```javascript
// Trong news-template-engine.js
this.helpers.customHelper = (input, param) => {
  // Logic xử lý
  return result;
};
```

### **Thêm Partial mới:**

```html
<!-- templates/partials/new-component.html -->
<div class="new-component">
  <!-- Nội dung component -->
</div>
```

### **Sử dụng trong template:**

```html
{{include "partials/new-component.html"}} {{customHelper someValue "parameter"}}
```

## 🔍 **DEBUGGING & TROUBLESHOOTING**

### **Kiểm tra Console:**

- Mở F12 → Console để xem log chi tiết
- Template Engine sẽ log từng bước xử lý

### **Lỗi thường gặp:**

1. **Template not found**: Kiểm tra đường dẫn file template
2. **Variable undefined**: Kiểm tra data được truyền vào
3. **Helper error**: Kiểm tra tham số helper function
4. **Include failed**: Kiểm tra file partial tồn tại

### **Template Cache:**

```javascript
// Clear cache nếu cần
templateEngine.clearCache();

// Xem cache stats
console.log(templateEngine.getCacheStats());
```

## 🚀 **PRODUCTION DEPLOYMENT**

### **Chuẩn bị deploy:**

1. Upload tất cả files template lên server
2. Đảm bảo đường dẫn relative đúng
3. Test trên staging environment
4. Kiểm tra SEO meta tags

### **Performance Tips:**

- Template được cache tự động
- Minimize số lượng includes
- Optimize image sizes
- Sử dụng CDN cho assets

## 📈 **NEXT STEPS**

### **Tính năng có thể mở rộng:**

- [ ] Multiple template themes
- [ ] Dynamic related articles
- [ ] Auto image optimization
- [ ] SEO score checker
- [ ] Batch export multiple articles
- [ ] Template inheritance system
- [ ] Custom CSS injection
- [ ] Social media auto-posting

## 🎯 **KẾT QUẢ**

Hệ thống Template Engine hiện tại cung cấp:

✅ **Complete Template System** với conditionals, loops, helpers  
✅ **SEO Optimized** với structured data, meta tags  
✅ **Production Ready** với error handling, caching  
✅ **User Friendly** với preview và export functions  
✅ **Extensible** dễ dàng thêm features mới  
✅ **Consistent Design** theo đúng brand guidelines

**🎉 Bạn có thể bắt đầu sử dụng ngay bây giờ!**
