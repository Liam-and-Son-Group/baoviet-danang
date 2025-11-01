# 🚀 Auto-Deploy System Setup Guide

## Overview

Hệ thống tự động deploy tạo và triển khai HTML files lên GitHub Pages sau khi người dùng lưu dữ liệu vào Supabase.

## Architecture Flow

```
User Input → Supabase Database → Edge Function → GitHub Actions → GitHub Pages
```

## 📋 Setup Checklist

### 1. Supabase Edge Function Deployment

```bash
# Deploy Edge Function
supabase functions deploy deploy-article

# Set GitHub token (create Personal Access Token với repo permissions)
supabase secrets set GITHUB_TOKEN=your_github_personal_access_token
```

### 2. GitHub Repository Settings

- Enable GitHub Actions in repository settings
- Ensure GitHub Pages is enabled and set to deploy from main branch

### 3. Environment Variables

Add these to your Supabase project:

- `GITHUB_TOKEN`: Personal Access Token with repo permissions
- `GITHUB_REPO_OWNER`: Your GitHub username
- `GITHUB_REPO_NAME`: Repository name

## 🧪 Testing

### Test Locally

```bash
# Run local test
./test-workflow.sh
```

### Test Edge Function

```bash
# Test via curl
curl -X POST "https://your-project-ref.supabase.co/functions/v1/deploy-article" \
  -H "Authorization: Bearer your-anon-key" \
  -H "Content-Type: application/json" \
  -d '{"article_id": "test-id", "filename": "test-article.html"}'
```

### Test Full Workflow

1. Open admin interface: `admin-e8d6c754705d3fce.html`
2. Create/edit an article
3. Click "Lưu và Deploy Tự Động"
4. Check deployment status in admin panel

## 📁 Files Structure

```
.github/
  workflows/
    deploy-new-article.yml    # GitHub Actions workflow
  scripts/
    generate-article.js       # HTML generation script
    update-sitemap.js        # Sitemap update script

supabase/
  functions/
    deploy-article/
      index.ts               # Edge Function for secure GitHub API calls

package.json                 # Dependencies for GitHub Actions
package-lock.json           # Dependency lock file for npm caching
```

## 🔧 Troubleshooting

### Common Issues

1. **"permission denied for schema vault"**

   - ✅ Fixed: Using Edge Functions instead of database triggers

2. **"client is not defined"**

   - ✅ Fixed: Added proper client initialization in admin interface

3. **GitHub Actions npm cache errors**
   - ✅ Fixed: Created package.json and package-lock.json

### Debug Tools

- `debug-deploy.html`: Simple Edge Function test interface
- `quick-deploy-test.html`: Quick deployment test tool
- Webhook logs in Supabase: Check `webhook_logs` table

## 🔍 Monitoring

### Check Deployment Status

```sql
-- View recent deployments
SELECT * FROM webhook_logs
ORDER BY created_at DESC
LIMIT 10;
```

### GitHub Actions Logs

- Go to repository → Actions tab
- Click on latest workflow run to see detailed logs

## 🛡️ Security Features

1. **GitHub Token Security**: Stored as Supabase secret, not exposed to client
2. **Edge Function**: Server-side execution prevents token leakage
3. **Repository Dispatch**: Secure webhook trigger mechanism

## 📈 Performance

- **Edge Function**: ~200ms response time
- **GitHub Actions**: ~2-3 minutes for full deployment
- **Caching**: NPM dependencies cached for faster workflow execution

## 🎯 Usage Workflow

1. User creates/edits article in admin interface
2. User clicks "Lưu và Deploy Tự Động"
3. Article data saved to Supabase
4. Edge Function triggers GitHub repository dispatch
5. GitHub Actions workflow automatically:
   - Fetches article data from Supabase
   - Generates HTML using template
   - Updates sitemap
   - Commits and pushes changes
   - GitHub Pages automatically deploys updated site

## ✅ Success Indicators

- ✅ Edge Function deployed and accessible
- ✅ GitHub token configured in Supabase secrets
- ✅ GitHub Actions workflow executes without errors
- ✅ HTML files generated and committed to repository
- ✅ Sitemap updated with new articles
- ✅ GitHub Pages reflects new content

## 🆘 Support

If you encounter issues:

1. Check Supabase Edge Function logs
2. Review GitHub Actions workflow logs
3. Verify environment variables are set correctly
4. Test Edge Function connectivity using debug tools
