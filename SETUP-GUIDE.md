# 🚀 Complete Setup Guide - Bảo Việt Đà Nẵng

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Supabase Setup](#supabase-setup)
4. [GitHub Setup](#github-setup)
5. [Admin System Setup](#admin-system-setup)
6. [Auto-Deploy System](#auto-deploy-system)
7. [Testing & Verification](#testing--verification)
8. [Troubleshooting](#troubleshooting)
9. [Monitoring & Maintenance](#monitoring--maintenance)

---

## 🎯 Overview

This project is a content management system for Bảo Việt Đà Nẵng insurance website with the following features:

- **Admin Panel**: Create and manage articles
- **Auto-Deploy**: Automatic deployment to GitHub Pages
- **Image Management**: Upload and manage images via Supabase Storage
- **User Analytics**: Track user interactions
- **Template Engine**: Generate HTML from templates

### System Architecture

```
User Input → Supabase Database → Edge Function → GitHub Actions → GitHub Pages
```

---

## 📋 Prerequisites

- GitHub account
- Supabase account (free tier available)
- Node.js installed (for local development)
- Supabase CLI (for Edge Functions)

---

## 🗄️ Supabase Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key (Settings → API)

### 2. Database Tables Setup

Run the following SQL in Supabase SQL Editor:

```sql
-- Articles table
CREATE TABLE IF NOT EXISTS articles (
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

-- Registrations table
CREATE TABLE IF NOT EXISTS registrations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name varchar,
  name varchar,
  email varchar,
  phone varchar,
  service_interest text,
  message text,
  status varchar DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'completed')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Article images table
CREATE TABLE IF NOT EXISTS article_images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id uuid REFERENCES articles(id) ON DELETE CASCADE,
  filename varchar NOT NULL,
  original_name varchar NOT NULL,
  file_path varchar NOT NULL,
  public_url text NOT NULL,
  file_size integer,
  file_type varchar,
  source varchar DEFAULT 'upload',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Webhook logs table
CREATE TABLE IF NOT EXISTS webhook_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type varchar NOT NULL,
  payload jsonb,
  status varchar DEFAULT 'pending',
  response_data jsonb,
  error_message text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for articles
CREATE POLICY "Enable read access for all users" ON articles FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON articles FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON articles FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON articles FOR DELETE USING (true);

-- RLS Policies for registrations
CREATE POLICY "Enable read access for all users" ON registrations FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON registrations FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON registrations FOR DELETE USING (true);

-- RLS Policies for article_images
CREATE POLICY "Enable read access for all users" ON article_images FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON article_images FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON article_images FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON article_images FOR DELETE USING (true);

-- RLS Policies for webhook_logs
CREATE POLICY "Enable read access for all users" ON webhook_logs FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON webhook_logs FOR INSERT WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_article_images_article_id ON article_images(article_id);
CREATE INDEX IF NOT EXISTS idx_articles_filename ON articles(filename);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(is_published, published_date);
```

### 3. Storage Bucket Setup

1. Go to **Storage** in Supabase Dashboard
2. Click **"New bucket"**
3. Name: `images`
4. Enable **Public bucket**
5. Create bucket

Then run this SQL for storage policies:

```sql
-- Allow public access to images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for images bucket
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can upload images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update own images" ON storage.objects
FOR UPDATE USING (bucket_id = 'images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete images" ON storage.objects
FOR DELETE USING (bucket_id = 'images' AND auth.role() = 'authenticated');
```

### 4. Enable HTTP Extension

1. Go to **Extensions** in Supabase Dashboard
2. Find and enable **"HTTP"** extension
3. Confirm enable

### 5. Run Auto-Deploy SQL

Execute `supabase-auto-deploy.sql` in SQL Editor to set up deployment functions.

---

## 🔧 GitHub Setup

### 1. Repository Configuration

1. Go to repository: `https://github.com/Liam-and-Son-Group/baoviet-danang`
2. **Settings** → **Pages**
3. Source: `Deploy from a branch`
4. Branch: `gh-pages` (will be created automatically)

### 2. Create GitHub Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token (classic)"**
3. **Note**: `Baoviet Deploy Token`
4. **Expiration**: `No expiration` (or 1 year)
5. **Select scopes**:
   - ✅ `repo` - Full control of private repositories
   - ✅ `workflow` - Update GitHub Action workflows
6. **Generate token** and **COPY IT** (only shown once!)

### 3. Setup GitHub Repository Secrets

1. Go to: `https://github.com/Liam-and-Son-Group/baoviet-danang/settings/secrets/actions`
2. Click **"New repository secret"** for each:

   - **Name**: `SUPABASE_URL`

     - **Value**: `https://your-project-ref.supabase.co`

   - **Name**: `SUPABASE_ANON_KEY`
     - **Value**: Your Supabase anon public key

   Get these from: Supabase Dashboard → Settings → API

### 4. GitHub Actions Workflow

The workflow files are already in place:

- `.github/workflows/deploy-new-article.yml`
- `.github/scripts/generate-article.js`
- `.github/scripts/update-sitemap.js`

**Note**: `GITHUB_TOKEN` is automatically provided by GitHub Actions - no setup needed!

---

## 🚀 Edge Function Setup (Auto-Deploy)

### 1. Install Supabase CLI

```bash
# Option 1: NPM
npm install -g supabase

# Option 2: Homebrew (macOS)
brew install supabase/tap/supabase
```

### 2. Login and Link Project

```bash
# Login to Supabase
supabase login

# Link to your project (get project-ref from Supabase Dashboard URL)
supabase link --project-ref YOUR_PROJECT_REF
```

### 3. Set GitHub Token Secret

```bash
# Set the GitHub token as a Supabase secret
supabase secrets set GITHUB_TOKEN=ghp_your_github_token_here

# Verify secret (won't show value, just name)
supabase secrets list
```

### 4. Deploy Edge Function

```bash
# Deploy the deploy-article function
supabase functions deploy deploy-article

# Function URL will be:
# https://YOUR_PROJECT_REF.supabase.co/functions/v1/deploy-article
```

### 5. Test Edge Function

```bash
# View function logs
supabase functions logs deploy-article --follow

# Test locally (optional)
supabase functions serve deploy-article
```

---

## 👨‍💼 Admin System Setup

### 1. Admin Login

- **URL**: `admin-dashboard.html`
- Default password is configured in `admin-auth-manager.js`
- Configure Supabase URL and anon key in admin interface

### 2. Admin Dashboard

- **URL**: `admin-dashboard.html`
- View statistics and manage content
- Manage articles and registrations

### 3. Article Composer

- **URL**: `admin-compose-e8d6c754705d3fce.html`
- Create/edit articles with TinyMCE editor
- Upload images and manage drafts
- Auto-deploy to GitHub Pages

### 4. Key Files

- `admin-auth-manager.js` - Authentication system
- `admin-api-manager.js` - API management
- `user-analytics.js` - Analytics tracking
- `supabase-key-manager.js` - Key management

---

## 🔄 Auto-Deploy System

### How It Works

1. User creates/edits article in Admin Panel
2. User clicks **"☁️ Lưu vào DB + Auto Deploy"**
3. Article data saved to Supabase
4. Edge Function triggers GitHub repository dispatch
5. GitHub Actions workflow:
   - Fetches article data from Supabase
   - Generates HTML using template
   - Updates sitemap
   - Commits and pushes changes
   - GitHub Pages automatically deploys

### Workflow Diagram

```
Admin Panel → Save to Supabase → Edge Function → GitHub API →
GitHub Actions → Generate HTML → Update Sitemap → Commit & Push →
GitHub Pages → Live Website
```

### Manual Deploy

You can also manually trigger deployment:

- Click **"🚀 Deploy GitHub Pages"** button in admin panel
- Or use SQL: `SELECT manual_deploy_article(article_id);`

---

## 🧪 Testing & Verification

### 1. Test Database Setup

```sql
-- Test manual deploy function
SELECT manual_deploy_article((SELECT id FROM articles LIMIT 1));

-- Check logs
SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 5;
```

### 2. Test Edge Function

```bash
# Check function logs
supabase functions logs deploy-article --follow
```

### 3. Test Admin Panel

1. Open `admin-dashboard.html`
2. Login with credentials
3. Create a test article
4. Click **"☁️ Lưu vào DB + Auto Deploy"**
5. Check console logs
6. Verify GitHub Actions: `https://github.com/Liam-and-Son-Group/baoviet-danang/actions`

### 4. Test GitHub Actions

1. After saving article, check GitHub Actions tab
2. Workflow should run automatically
3. Check for successful completion
4. Verify HTML file created in repository
5. Check GitHub Pages URL

### 5. Test Local Development

```bash
# Test workflow locally
./test-workflow.sh

# Test dual mode (local + GitHub)
./test-dual-mode.sh
```

---

## 🔧 Troubleshooting

### GitHub Token Error

**Error**: `authentication failed` or `401 Unauthorized`

**Solution**:

1. Check GitHub token in Supabase secrets: `supabase secrets list`
2. Verify token has correct permissions: `repo`, `workflow`
3. Check if token expired
4. Update token: `supabase secrets set GITHUB_TOKEN=new_token`

### HTTP Extension Error

**Error**: `function http() does not exist`

**Solution**: Enable HTTP extension in Supabase Dashboard → Extensions

### Template Not Found

**Error**: `Could not load template`

**Solution**: Verify template files exist in repository:

- `templates/news/article.html`
- `templates/partials/header.html`
- `templates/partials/footer.html`

### GitHub Actions Fails

**Common Issues**:

1. **Supabase credentials missing**: Check Repository Secrets
2. **Template file missing**: Verify files in repository
3. **Permission denied**: Check GitHub token permissions
4. **Workflow syntax error**: Check `.github/workflows/deploy-new-article.yml`

**Debug Steps**:

1. Go to GitHub Actions tab
2. Click on failed workflow
3. View detailed error logs
4. Check each step for errors

### Deploy Success but Page Not Found

**Solution**:

1. Check GitHub Pages settings
2. Ensure `gh-pages` branch is selected
3. Wait 5-10 minutes for GitHub Pages to update
4. Clear browser cache

### Edge Function Not Found

**Error**: `404 Not Found` when calling Edge Function

**Solution**:

1. Verify function deployed: `supabase functions list`
2. Check function URL format: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/deploy-article`
3. Redeploy: `supabase functions deploy deploy-article`

### Secret Not Found

**Error**: `GITHUB_TOKEN not found in environment variables`

**Solution**:

```bash
# Set secret again
supabase secrets set GITHUB_TOKEN=your_token

# Redeploy function
supabase functions deploy deploy-article
```

---

## 📊 Monitoring & Maintenance

### Check Deployment History

```sql
SELECT
  event_type,
  (payload->>'client_payload'->>'article_filename') as filename,
  status,
  error_message,
  created_at
FROM webhook_logs
ORDER BY created_at DESC
LIMIT 10;
```

### Check Edge Function Logs

```bash
supabase functions logs deploy-article --follow
```

### Disable Auto-Deploy Temporarily

```sql
ALTER TABLE articles DISABLE TRIGGER auto_deploy_article_trigger;
```

### Re-enable Auto-Deploy

```sql
ALTER TABLE articles ENABLE TRIGGER auto_deploy_article_trigger;
```

### Manual Re-deploy All Articles

```sql
SELECT manual_deploy_article(id) FROM articles WHERE is_published = true;
```

### GitHub Actions Status

Visit: `https://github.com/Liam-and-Son-Group/baoviet-danang/actions`

---

## ✅ Success Indicators

When setup is complete, you should see:

1. ✅ **Admin Panel**: Shows "🎉 GitHub deploy đã được khởi động!" after saving
2. ✅ **GitHub Actions**: Workflow "Deploy New Article" runs successfully
3. ✅ **Repository**: New HTML files created in root folder
4. ✅ **GitHub Pages**: Website live at project URL
5. ✅ **Sitemap**: Automatically updated with new URLs

---

## 🔐 Security Features

1. **GitHub Token Security**: Stored as Supabase secret, never exposed to client
2. **Edge Function**: Server-side execution prevents token leakage
3. **Repository Dispatch**: Secure webhook trigger mechanism
4. **RLS Policies**: Row Level Security enabled on all tables
5. **Session Management**: Admin sessions timeout after 30 minutes

---

## 📝 Quick Reference

### Important URLs

- **Admin Dashboard**: `admin-dashboard.html`
- **Article Composer**: `admin-compose-e8d6c754705d3fce.html`
- **GitHub Actions**: `https://github.com/Liam-and-Son-Group/baoviet-danang/actions`
- **Supabase Dashboard**: `https://supabase.com/dashboard`

### Key Commands

```bash
# Deploy Edge Function
supabase functions deploy deploy-article

# Set GitHub token
supabase secrets set GITHUB_TOKEN=your_token

# View function logs
supabase functions logs deploy-article --follow

# List secrets
supabase secrets list
```

### Environment Variables

**GitHub Repository Secrets** (required):

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

**Supabase Secrets** (required):

- `GITHUB_TOKEN`

**Automatic** (no setup needed):

- `GITHUB_TOKEN` (in GitHub Actions workflow)

---

## 🆘 Support

If you encounter issues:

1. Check Supabase Edge Function logs
2. Review GitHub Actions workflow logs
3. Verify environment variables are set correctly
4. Test Edge Function connectivity using debug tools
5. Check database logs in Supabase Dashboard

---

**Last Updated**: 2025
**Version**: 1.0
