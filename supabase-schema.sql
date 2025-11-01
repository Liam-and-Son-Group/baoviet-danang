-- Supabase Database Schema for Bảo Việt Đà Nẵng Admin Editor
-- Execute this SQL in your Supabase SQL Editor

-- Create articles table
CREATE TABLE articles
(
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'TIN TỨC',
  keywords TEXT,
  filename TEXT UNIQUE NOT NULL,
  published_date DATE DEFAULT CURRENT_DATE,
  is_published BOOLEAN DEFAULT false,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_email TEXT,
  author_name TEXT,
  created_at TIMESTAMP
  WITH TIME ZONE DEFAULT timezone
  ('utc'::text, now
  ()) NOT NULL,
    updated_at TIMESTAMP
  WITH TIME ZONE DEFAULT timezone
  ('utc'::text, now
  ()) NOT NULL
);

  -- Create user profiles table for role management
  CREATE TABLE user_profiles
  (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT CHECK (role IN ('admin', 'editor', 'writer', 'viewer')) DEFAULT 'writer',
    department TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP
    WITH TIME ZONE DEFAULT timezone
    ('utc'::text, now
    ()) NOT NULL,
    updated_at TIMESTAMP
    WITH TIME ZONE DEFAULT timezone
    ('utc'::text, now
    ()) NOT NULL
);

    -- Create images table for managing uploads
    CREATE TABLE article_images
    (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_size INTEGER,
      file_type TEXT,
      file_path TEXT NOT NULL,
      public_url TEXT,
      uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      created_at TIMESTAMP
      WITH TIME ZONE DEFAULT timezone
      ('utc'::text, now
      ()) NOT NULL
);

      -- Create RLS (Row Level Security) policies
      ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE article_images ENABLE ROW LEVEL SECURITY;
      ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

      -- Helper function to get user role
      CREATE OR REPLACE FUNCTION get_user_role
      (user_id UUID)
RETURNS TEXT AS $$
      DECLARE
    user_role TEXT;
      BEGIN
        SELECT role
        INTO user_role
        FROM user_profiles
        WHERE id = user_id AND is_active = true;

        RETURN COALESCE(user_role, 'viewer');
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      -- User Profiles Policies
      CREATE POLICY "Users can view own profile" ON user_profiles
    FOR
      SELECT USING (auth.uid() = id);

      CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR
      SELECT USING (get_user_role(auth.uid()) = 'admin');

      CREATE POLICY "Admins can manage all profiles" ON user_profiles
    FOR ALL USING
      (get_user_role
      (auth.uid
      ()) = 'admin');

      -- Articles Policies
      -- SELECT: Everyone can read published articles, authors can read their own articles
      CREATE POLICY "Public can read published articles" ON articles
    FOR
      SELECT USING (is_published = true);

      CREATE POLICY "Authors can read own articles" ON articles
    FOR
      SELECT USING (auth.uid() = author_id);

      CREATE POLICY "Admins and editors can read all articles" ON articles
    FOR
      SELECT USING (get_user_role(auth.uid()) IN ('admin', 'editor'));

      -- INSERT: Writers, editors, and admins can create articles
      CREATE POLICY "Writers can create articles" ON articles
    FOR
      INSERT WITH CHECK (
        get_user_role(
      auth.uid()
      ) IN
      ('writer', 'editor', 'admin') 
        AND auth.uid
      () = author_id
    );

      -- UPDATE: Authors can edit their own unpublished articles, editors/admins can edit any
      CREATE POLICY "Authors can edit own unpublished articles" ON articles
    FOR
      UPDATE USING (
        auth.uid()
      = author_id 
        AND is_published = false
    );

      CREATE POLICY "Editors can edit any unpublished articles" ON articles
    FOR
      UPDATE USING (
        get_user_role(auth.uid())
      IN
      ('editor', 'admin')
        AND is_published = false
    );

      CREATE POLICY "Admins can edit any articles" ON articles
    FOR
      UPDATE USING (get_user_role(auth.uid())
      = 'admin');

      -- DELETE: Only admins can delete articles
      CREATE POLICY "Admins can delete articles" ON articles
    FOR
      DELETE USING (get_user_role
      (auth.uid
      ()) = 'admin');

      -- Article Images Policies
      CREATE POLICY "Anyone can view images" ON article_images
    FOR
      SELECT USING (true);

      CREATE POLICY "Authenticated users can upload images" ON article_images
    FOR
      INSERT WITH CHECK (
        auth.role() = 'authenticated' 
        AND
      auth.uid()
      = uploaded_by
    );

      CREATE POLICY "Users can manage own images" ON article_images
    FOR
      UPDATE USING (auth.uid()
      = uploaded_by);

      CREATE POLICY "Users can delete own images" ON article_images
    FOR
      DELETE USING (auth.uid
      () = uploaded_by);

      CREATE POLICY "Admins can manage all images" ON article_images
    FOR ALL USING
      (get_user_role
      (auth.uid
      ()) = 'admin');

      -- Create storage bucket for images
      INSERT INTO storage.buckets
        (id, name, public)
      VALUES
        ('images', 'images', true);

      -- Create storage policy for article images
      CREATE POLICY "Allow authenticated users to upload images" ON storage.objects
    FOR
      INSERT WITH CHECK
        (
        bucket_
      d = 'images'
        AND auth.role
      () = 'authenticated'
    );

      CREATE POLICY "Allow public access to images" ON storage.objects
    FOR
      SELECT USING (bucket_id = 'images');

      CREATE POLICY "Allow users to update own images" ON storage.objects
    FOR
      UPDATE USING (
        bucket_id = 'images'
      AND auth.uid
      ()::text =
      (storage.foldername
      (name))[1]
    );

      CREATE POLICY "Allow users to delete own images" ON storage.objects
    FOR
      DELETE USING (
        bucket_id
      = 'images' 
        AND auth.uid
      ()::text =
      (storage.foldername
      (name))[1]
    );

      CREATE POLICY "Allow admins to manage all images" ON storage.objects
    FOR ALL USING
      (
        bucket_id = 'images' 
        AND get_user_role
      (auth.uid
      ()) = 'admin'
    );

      -- Create function to update updated_at timestamp
      CREATE OR REPLACE FUNCTION update_updated_at_column
      ()
RETURNS TRIGGER AS $$
      BEGIN
    NEW.updated_at = timezone
      ('utc'::text, now
      ());
      RETURN NEW;
      END;
$$ language 'plpgsql';

      -- Create trigger to automatically update updated_at
      CREATE TRIGGER update_articles_updated_at BEFORE
      UPDATE ON articles
    FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column
      ();

      CREATE TRIGGER update_user_profiles_updated_at BEFORE
      UPDATE ON user_profiles
    FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column
      ();

      -- Function to automatically create user profile when user signs up
      CREATE OR REPLACE FUNCTION public.handle_new_user
      ()
RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO public.user_profiles
          (id, email, full_name, role)
        VALUES
          (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
            'writer'  -- Default role
    );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      -- Trigger to automatically create profile for new users
      CREATE TRIGGER on_auth_user_created
    AFTER
      INSERT ON
      auth.users
      FOR EACH ROW
      EXECUTE
      FUNCTION public.handle_new_user
      ();

      -- Function to auto-populate author info when creating articles
      CREATE OR REPLACE FUNCTION populate_author_info
      ()
RETURNS TRIGGER AS $$
      BEGIN
        -- Auto-populate author information from user profile
        IF NEW.author_id IS NULL THEN
        NEW.author_id = auth.uid
        ();
      END
      IF;
    
    -- Get author details from user profile
    SELECT email, full_name
      INTO NEW.author_email
      , NEW.author_name
    FROM user_profiles 
    WHERE id = NEW.author_id;

      RETURN NEW;
      END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

      -- Trigger to populate author info
      CREATE TRIGGER populate_article_author 
    BEFORE
      INSERT ON
      articles
      FOR
      EACH
      ROW
      EXECUTE FUNCTION populate_author_info
      ();

      -- Create indexes for better performance
      CREATE INDEX articles_filename_idx ON articles(filename);
      CREATE INDEX articles_category_idx ON articles(category);
      CREATE INDEX articles_published_date_idx ON articles(published_date);
      CREATE INDEX articles_is_published_idx ON articles(is_published);
      CREATE INDEX articles_author_id_idx ON articles(author_id);
      CREATE INDEX article_images_article_id_idx ON article_images(article_id);
      CREATE INDEX article_images_uploaded_by_idx ON article_images(uploaded_by);
      CREATE INDEX user_profiles_role_idx ON user_profiles(role);
      CREATE INDEX user_profiles_email_idx ON user_profiles(email);

      -- Insert sample data with roles
      -- First, manually insert some user profiles (normally these would be created via trigger)
      INSERT INTO user_profiles
        (id, email, full_name, role, department, is_active)
      VALUES
        (
          gen_random_uuid(),
          'admin@baoviet-danang.com',
          'Quản trị viên',
          'admin',
          'IT',
          true
),
        (
          gen_random_uuid(),
          'editor@baoviet-danang.com',
          'Biên tập viên',
          'editor',
          'Nội dung',
          true
),
        (
          gen_random_uuid(),
          'writer@baoviet-danang.com',
          'Người viết bài',
          'writer',
          'Marketing',
          true
);

      -- Sample article with author info
      INSERT INTO articles
        (
        title,
        description,
        content,
        category,
        keywords,
        filename,
        author_email,
        author_name,
        is_published
        )
      VALUES
        (
          'Hướng dẫn phân quyền RLS cho hệ thống CMS',
          'Cách thiết lập Row Level Security để quản lý quyền truy cập bài viết theo vai trò người dùng.',
          '<h2>Row Level Security (RLS) trong Supabase</h2><p>RLS cho phép kiểm soát quyền truy cập dữ liệu ở cấp độ hàng...</p><h3>Các vai trò người dùng:</h3><ul><li><strong>Admin:</strong> Toàn quyền quản lý</li><li><strong>Editor:</strong> Chỉnh sửa mọi bài viết chưa xuất bản</li><li><strong>Writer:</strong> Tạo và sửa bài viết của mình</li><li><strong>Viewer:</strong> Chỉ xem bài viết đã xuất bản</li></ul>',
          'HƯỚNG DẪN',
          'RLS, row level security, supabase, phân quyền, CMS',
          'huong-dan-phan-quyen-rls-cms.html',
          'admin@baoviet-danang.com',
          'Quản trị viên',
          true
);

      -- Display success message with role information
      SELECT
        'Database schema with RLS created successfully! 🎉' as status,
        'Roles: admin (full access), editor (edit unpublished), writer (own articles), viewer (read published)' as role_info;