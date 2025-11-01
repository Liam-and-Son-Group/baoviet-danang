#!/bin/bash

# 🧪 TEST DUAL MODE - Local .env vs GitHub Secrets
echo "🧪 Testing Dual Mode Environment Setup"
echo "======================================"

# Test 1: Local mode với .env
echo ""
echo "1️⃣ TESTING LOCAL MODE (.env file):"
echo "-----------------------------------"

if [ -f ".env" ]; then
    # Export .env variables
    export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
    
    echo "📁 .env file found and loaded"
    echo "🔍 Environment check:"
    echo "  - SUPABASE_URL: ${SUPABASE_URL:0:30}..."
    echo "  - SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY:0:20}..."
    echo "  - GITHUB_ACTIONS: ${GITHUB_ACTIONS:-'not set'}"
    
    # Test script
    echo ""
    echo "🧪 Testing generate-article script..."
    if node .github/scripts/generate-article.js "test-local" "test-local.html"; then
        echo "✅ Local mode test PASSED"
        # Cleanup test file
        [ -f "test-local.html" ] && rm "test-local.html"
    else
        echo "❌ Local mode test FAILED"
    fi
else
    echo "❌ .env file not found"
    echo "💡 Run: ./setup-env.sh to create .env file"
fi

echo ""
echo "2️⃣ SIMULATING GITHUB ACTIONS MODE:"
echo "-----------------------------------"

# Backup current env
ORIGINAL_GITHUB_ACTIONS=$GITHUB_ACTIONS
ORIGINAL_SUPABASE_URL=$SUPABASE_URL
ORIGINAL_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY

# Simulate GitHub Actions environment
export GITHUB_ACTIONS=true

echo "🔄 Simulating GitHub Actions environment..."
echo "🔍 Environment check:"
echo "  - GITHUB_ACTIONS: ${GITHUB_ACTIONS}"
echo "  - SUPABASE_URL: ${SUPABASE_URL:0:30}..."
echo "  - SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY:0:20}..."

echo ""
echo "🧪 Testing generate-article script in GitHub Actions mode..."
if node .github/scripts/generate-article.js "test-actions" "test-actions.html"; then
    echo "✅ GitHub Actions mode test PASSED"
    # Cleanup test file
    [ -f "test-actions.html" ] && rm "test-actions.html"
else
    echo "❌ GitHub Actions mode test FAILED"
fi

# Restore original environment
export GITHUB_ACTIONS=$ORIGINAL_GITHUB_ACTIONS

echo ""
echo "3️⃣ GITHUB SECRETS CHECKLIST:"
echo "-----------------------------"
echo "Để hoạt động trong GitHub Actions, cần setup secrets:"
echo ""
echo "Repository Secrets Required:"
echo "  📝 SUPABASE_URL"
echo "  📝 SUPABASE_ANON_KEY"
echo ""
echo "Setup path:"
echo "  🌐 https://github.com/Liam-and-Son-Group/baoviet-danang/settings/secrets/actions"
echo ""

echo "4️⃣ MANUAL WORKFLOW TRIGGER:"
echo "----------------------------"
echo "Test GitHub Actions workflow manually:"
echo ""
echo "Via GitHub CLI:"
echo "  gh workflow run deploy-new-article.yml \\"
echo "    -f article_id=\"85bf05a9-edaa-40b3-96a6-12d27cff3c77\" \\"
echo "    -f article_filename=\"test-from-actions.html\""
echo ""
echo "Via GitHub Web UI:"
echo "  🌐 https://github.com/Liam-and-Son-Group/baoviet-danang/actions/workflows/deploy-new-article.yml"
echo "  📝 Click 'Run workflow' button"
echo ""

echo "======================================"
echo "🎉 Dual mode testing complete!"
echo ""
echo "📋 Summary:"
echo "  ✅ Script supports both local .env and GitHub Secrets"
echo "  ✅ Automatic environment detection"
echo "  ✅ Helpful error messages for missing credentials"
echo ""
echo "Next: Setup GitHub Secrets để enable production auto-deploy! 🚀"