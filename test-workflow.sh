#!/bin/bash

# 🧪 Test GitHub Actions Workflow Locally
# This script simulates the GitHub Actions environment

echo "🧪 Testing GitHub Actions workflow locally..."

# Set environment variables (replace with actual values)
export SUPABASE_URL="https://your-project-ref.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"

# Test article data
TEST_ARTICLE_ID="test-article-id"
TEST_FILENAME="test-article.html"

echo "📋 Environment:"
echo "  Node version: $(node --version)"
echo "  NPM version: $(npm --version)"
echo "  SUPABASE_URL: ${SUPABASE_URL}"

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🏗️ Testing article generation..."
if node .github/scripts/generate-article.js "$TEST_ARTICLE_ID" "$TEST_FILENAME"; then
    echo "✅ Article generation test passed"
else
    echo "❌ Article generation test failed"
    exit 1
fi

echo ""
echo "📊 Testing sitemap update..."
if node .github/scripts/update-sitemap.js "$TEST_FILENAME"; then
    echo "✅ Sitemap update test passed"
else
    echo "❌ Sitemap update test failed"
    exit 1
fi

echo ""
echo "🎉 All tests passed! Workflow should work in GitHub Actions."