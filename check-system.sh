#!/bin/bash

# 🔍 Auto-Deploy System Status Checker
echo "🔍 Checking Auto-Deploy System Status..."
echo "=========================================="

# Check if required files exist
echo "📁 Checking file structure..."

check_file() {
    if [ -f "$1" ]; then
        echo "  ✅ $1"
    else
        echo "  ❌ $1 (missing)"
    fi
}

check_file ".github/workflows/deploy-new-article.yml"
check_file ".github/scripts/generate-article.js"
check_file ".github/scripts/update-sitemap.js"
check_file "supabase/functions/deploy-article/index.ts"
check_file "package.json"
check_file "package-lock.json"
check_file "admin-e8d6c754705d3fce.html"

echo ""
echo "📦 Checking dependencies..."
if [ -f "package.json" ]; then
    echo "  Node.js version: $(node --version 2>/dev/null || echo 'Not installed')"
    echo "  NPM version: $(npm --version 2>/dev/null || echo 'Not installed')"
    
    if [ -f "node_modules/.package-lock.json" ]; then
        echo "  ✅ Dependencies installed"
    else
        echo "  ⚠️ Dependencies not installed (run: npm install)"
    fi
else
    echo "  ❌ package.json missing"
fi

echo ""
echo "🔧 Checking Supabase CLI..."
if command -v supabase &> /dev/null; then
    echo "  ✅ Supabase CLI installed"
    echo "  Version: $(supabase --version)"
else
    echo "  ❌ Supabase CLI not installed"
    echo "     Install: npm install -g supabase"
fi

echo ""
echo "🔑 Environment Variables to Configure:"
echo "  - SUPABASE_URL (in GitHub Actions secrets)"
echo "  - SUPABASE_ANON_KEY (in GitHub Actions secrets)"
echo "  - GITHUB_TOKEN (in Supabase secrets)"

echo ""
echo "📋 Next Steps:"
echo "  1. Deploy Edge Function: supabase functions deploy deploy-article"
echo "  2. Set GitHub token: supabase secrets set GITHUB_TOKEN=your_token"
echo "  3. Test via admin interface"
echo "  4. Monitor webhook_logs table in Supabase"

echo ""
echo "🎯 Test URLs:"
echo "  - Admin Interface: file://$(pwd)/admin-e8d6c754705d3fce.html"
echo "  - Debug Tool: file://$(pwd)/debug-deploy.html"
echo "  - Quick Test: file://$(pwd)/quick-deploy-test.html"

echo ""
echo "=========================================="
echo "Status check complete! 🎉"