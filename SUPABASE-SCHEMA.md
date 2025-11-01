# 🗄️ SUPABASE DATABASE SCHEMA

## 📋 **CẤU TRÚC BẢNG `articles` CẬP NHẬT**

### **Bảng chính: `articles`**

```sql
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'TIN TỨC',
  keywords TEXT,
  tags TEXT,
  filename TEXT UNIQUE NOT NULL,
  published_date DATE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,

  -- TEMPLATE ENGINE FIELDS (MỚI)
  rendered_html TEXT, -- HTML template đã render hoàn chỉnh
  template_version TEXT DEFAULT '1.0', -- Phiên bản template sử dụng

  -- METADATA
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- INDEXES
  CONSTRAINT unique_filename UNIQUE (filename)
);

-- Indexes for performance
CREATE INDEX idx_articles_category ON articles(category);
CREATE INDEX idx_articles_published_date ON articles(published_date);
CREATE INDEX idx_articles_is_featured ON articles(is_featured);
CREATE INDEX idx_articles_is_published ON articles(is_published);
CREATE INDEX idx_articles_created_at ON articles(created_at);
```

### **Bảng hình ảnh: `article_images` (đã có)**

```sql
CREATE TABLE article_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔄 **UPDATE EXISTING TABLE**

Nếu bảng `articles` đã tồn tại, chạy các lệnh sau để thêm fields mới:

```sql
-- Thêm cột rendered_html để lưu HTML template hoàn chỉnh
ALTER TABLE articles
ADD COLUMN rendered_html TEXT;

-- Thêm cột template_version để track phiên bản template
ALTER TABLE articles
ADD COLUMN template_version TEXT DEFAULT '1.0';

-- Thêm cột tags nếu chưa có
ALTER TABLE articles
ADD COLUMN tags TEXT;

-- Thêm cột is_featured nếu chưa có
ALTER TABLE articles
ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;

-- Update existing records
UPDATE articles
SET template_version = '1.0'
WHERE template_version IS NULL;
```

## 📊 **QUERY EXAMPLES**

### **1. Lấy bài viết với HTML hoàn chỉnh:**

```sql
SELECT
  id, title, description, category,
  rendered_html, template_version,
  created_at, updated_at
FROM articles
WHERE filename = 'bao-hiem-xe-oto.html';
```

### **2. Lấy danh sách bài viết có template:**

```sql
SELECT
  id, title, category,
  CASE
    WHEN rendered_html IS NOT NULL AND LENGTH(rendered_html) > 0
    THEN 'Có template'
    ELSE 'Chỉ có dữ liệu thô'
  END as template_status
FROM articles
ORDER BY created_at DESC;
```

### **3. Thống kê template:**

```sql
SELECT
  template_version,
  COUNT(*) as total_articles,
  COUNT(rendered_html) as with_template
FROM articles
GROUP BY template_version;
```

### **4. Tìm bài viết nổi bật có template:**

```sql
SELECT title, filename, template_version
FROM articles
WHERE is_featured = TRUE
  AND rendered_html IS NOT NULL
ORDER BY created_at DESC;
```

## 🔧 **ADMIN FUNCTIONS**

### **JavaScript functions để làm việc với rendered HTML:**

```javascript
// Lấy HTML hoàn chỉnh từ database
async function getRenderedHTML(articleId) {
  const { data, error } = await supabase
    .from("articles")
    .select("rendered_html, title, template_version")
    .eq("id", articleId)
    .single();

  if (error) throw error;
  return data;
}

// Update chỉ rendered HTML
async function updateRenderedHTML(articleId, newHTML) {
  const { data, error } = await supabase
    .from("articles")
    .update({
      rendered_html: newHTML,
      updated_at: new Date().toISOString(),
    })
    .eq("id", articleId);

  if (error) throw error;
  return data;
}

// Regenerate tất cả template
async function regenerateAllTemplates() {
  const { data: articles } = await supabase.from("articles").select("*");

  for (const article of articles) {
    const templateData = prepareTemplateData(article);
    const renderedHTML = await templateEngine.processTemplate(
      "./templates/news/article.html",
      templateData
    );

    await updateRenderedHTML(article.id, renderedHTML);
  }
}
```

## 💾 **BACKUP & MIGRATION**

### **Backup rendered HTML:**

```sql
-- Export tất cả rendered HTML ra file
COPY (
  SELECT filename, rendered_html
  FROM articles
  WHERE rendered_html IS NOT NULL
) TO '/path/to/backup/rendered_html_backup.csv'
WITH CSV HEADER;
```

### **Migration script:**

```sql
-- Migrate từ hệ thống cũ sang mới
INSERT INTO articles (
  title, description, content, category,
  keywords, filename, published_date,
  rendered_html, template_version
)
SELECT
  title, description, content, category,
  keywords, filename, published_date,
  NULL as rendered_html, -- Sẽ generate sau
  '1.0' as template_version
FROM old_articles_table;
```

## 🎯 **BENEFITS CỦA VIỆC LUU RENDERED HTML**

### **✅ Ưu điểm:**

1. **Performance**: Không cần render template mỗi lần hiển thị
2. **Consistency**: HTML luôn giống như lúc tạo
3. **Backup**: Có bản backup HTML hoàn chỉnh
4. **Version Control**: Track được template version
5. **Independence**: Không phụ thuộc vào template engine khi hiển thị

### **📊 Storage Impact:**

- Mỗi bài viết: ~20-50KB HTML rendered
- 1000 bài viết: ~20-50MB storage
- Acceptable cho Supabase free tier

### **🔄 Update Strategy:**

1. Khi sửa template → Regenerate cho tất cả bài viết
2. Khi sửa content → Chỉ render lại bài viết đó
3. Background job để sync template changes

## 🚀 **DEPLOYMENT CHECKLIST**

- [ ] Update Supabase schema
- [ ] Test template rendering
- [ ] Backup existing data
- [ ] Update admin interface
- [ ] Test load/save functionality
- [ ] Monitor storage usage
- [ ] Set up regeneration jobs

**🎉 Với schema này, bạn có thể lưu và quản lý HTML templates hoàn chỉnh trong Supabase!**
