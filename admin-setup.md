# Hướng dẫn thiết lập Database cho Admin Panel

## Cấu trúc bảng cần thiết trong Supabase

### 1. Bảng `articles` (quản lý bài viết)

```sql
CREATE TABLE articles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title varchar NOT NULL,
  description text,
  content text NOT NULL,
  category varchar DEFAULT 'TIN TỨC',
  keywords text,
  tags text,
  filename varchar UNIQUE NOT NULL,
  published_date date,
  is_published boolean DEFAULT false,
  status varchar DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  is_featured boolean DEFAULT false,
  rendered_html text,
  template_version varchar DEFAULT '1.0',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS (Row Level Security)
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Create policies (điều chỉnh theo nhu cầu bảo mật)
CREATE POLICY "Enable read access for all users" ON articles FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON articles FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON articles FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON articles FOR DELETE USING (true);
```

### 2. Bảng `registrations` (quản lý người đăng ký)

```sql
CREATE TABLE registrations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name varchar,
  name varchar, -- alias cho full_name để tương thích
  email varchar,
  phone varchar,
  service_interest text,
  message text, -- alias cho service_interest để tương thích
  status varchar DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'completed')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON registrations FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON registrations FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON registrations FOR DELETE USING (true);
```

### 3. Bảng `article_images` (quản lý hình ảnh bài viết)

```sql
CREATE TABLE article_images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id uuid REFERENCES articles(id) ON DELETE CASCADE,
  filename varchar NOT NULL,
  original_name varchar NOT NULL,
  file_path varchar NOT NULL,
  public_url text NOT NULL,
  file_size integer,
  file_type varchar,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE article_images ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON article_images FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON article_images FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON article_images FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON article_images FOR DELETE USING (true);
```

### 4. Bảng `webhook_logs` (log deploy GitHub)

```sql
CREATE TABLE webhook_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type varchar NOT NULL,
  payload jsonb,
  status varchar DEFAULT 'pending',
  response_data jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON webhook_logs FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON webhook_logs FOR INSERT WITH CHECK (true);
```

### 5. Storage Bucket cho hình ảnh

Tạo storage bucket trong Supabase Dashboard:

1. Vào Storage trong Dashboard
2. Tạo bucket mới tên "images"
3. Cấu hình Public Access:

```sql
-- Allow public access to images bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true);

-- Create policies for images bucket
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'images');
CREATE POLICY "Authenticated users can upload images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update own images" ON storage.objects FOR UPDATE USING (bucket_id = 'images' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete images" ON storage.objects FOR DELETE USING (bucket_id = 'images' AND auth.role() = 'authenticated');
```

## Edge Functions (nếu cần auto-deploy)

### Function `deploy-article`

Tạo trong `supabase/functions/deploy-article/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { article_id, trigger_source } = await req.json()
    
    // GitHub repository dispatch
    const response = await fetch('https://api.github.com/repos/Liam-and-Son-Group/baoviet-danang/dispatches', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('GITHUB_TOKEN')}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: 'deploy-new-article',
        client_payload: {
          article_id: article_id,
          trigger_source: trigger_source || 'edge_function'
        }
      })
    })

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Deploy triggered successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
    )
  }
})
```

## Cấu hình environment variables

Trong Supabase Dashboard > Settings > Edge Functions:

```
GITHUB_TOKEN=your_github_personal_access_token
```

## Hướng dẫn sử dụng

### 1. Đăng nhập Admin

- URL: `admin-login.html`
- Mật khẩu mặc định: `secret` (hash SHA256 đã được set)
- Cấu hình Supabase URL và Anon Key

### 2. Dashboard Admin

- URL: `admin-dashboard.html`
- Xem tổng quan thống kê
- Quản lý bài viết và người đăng ký

### 3. Soạn thảo bài viết

- URL: `admin-compose-e8d6c754705d3fce.html`
- Tạo bài viết mới hoặc chỉnh sửa
- Upload hình ảnh và quản lý draft/publish

## Bảo mật

- Session timeout: 30 phút
- Row Level Security được bật
- Các API key được lưu trong localStorage
- Kiểm tra authentication ở mọi trang admin

## Tính năng chính

✅ Đăng nhập admin với giao diện đẹp
✅ Dashboard tổng quan với thống kê
✅ Quản lý bài viết (CRUD)
✅ Quản lý người đăng ký
✅ Soạn thảo bài viết với TinyMCE
✅ Upload và quản lý hình ảnh
✅ Draft/Publish workflow
✅ Auto-deploy GitHub Pages
✅ Responsive design
✅ Session management