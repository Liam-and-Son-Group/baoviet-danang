#!/bin/bash

# 🔧 SETUP ENVIRONMENT VARIABLES
echo "🔧 Setting up Environment Variables for Auto-Deploy System"
echo "=========================================================="

# Check if .env exists
if [ -f ".env" ]; then
    echo "⚠️  File .env đã tồn tại!"
    echo "   Bạn có muốn backup và tạo mới? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        cp .env .env.backup
        echo "✅ Đã backup .env thành .env.backup"
    else
        echo "❌ Hủy bỏ setup. Vui lòng chỉnh sửa .env manually."
        exit 1
    fi
fi

# Create .env file
echo "📝 Tạo file .env..."
cat > .env << 'EOF'
# 🔑 Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# 🔒 GitHub Configuration (optional for local testing)
GITHUB_TOKEN=your_github_personal_access_token
EOF

echo "✅ Đã tạo file .env"
echo ""

# Instructions
echo "📋 HƯỚNG DẪN CONFIG:"
echo "==================="
echo ""
echo "1️⃣  LẤY SUPABASE CREDENTIALS:"
echo "   • Vào: https://supabase.com/dashboard"
echo "   • Chọn project: baoviet-danang"
echo "   • Vào: Settings → API"
echo "   • Copy 'Project URL' thay thế SUPABASE_URL"
echo "   • Copy 'anon public' key thay thế SUPABASE_ANON_KEY"
echo ""
echo "2️⃣  LẤY GITHUB TOKEN (optional):"
echo "   • Vào: https://github.com/settings/tokens"
echo "   • Tạo Personal Access Token với repo permissions"
echo "   • Copy token thay thế GITHUB_TOKEN"
echo ""
echo "3️⃣  CHỈNH SỬA FILE .env:"
echo "   • Mở file .env trong editor"
echo "   • Thay thế các giá trị placeholder"
echo "   • Lưu file"
echo ""
echo "4️⃣  TEST SETUP:"
echo "   • Chạy: ./test-env.sh"
echo "   • Hoặc: node .github/scripts/generate-article.js test-id test.html"
echo ""

# Create test script
echo "🧪 Tạo test script..."
cat > test-env.sh << 'EOF'
#!/bin/bash
echo "🧪 Testing Environment Variables..."

# Load .env
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✅ Loaded .env file"
else
    echo "❌ File .env không tồn tại!"
    exit 1
fi

# Check variables
if [ -z "$SUPABASE_URL" ] || [ "$SUPABASE_URL" = "https://your-project-ref.supabase.co" ]; then
    echo "❌ SUPABASE_URL chưa được config"
    exit 1
else
    echo "✅ SUPABASE_URL: $SUPABASE_URL"
fi

if [ -z "$SUPABASE_ANON_KEY" ] || [ "$SUPABASE_ANON_KEY" = "your-anon-key" ]; then
    echo "❌ SUPABASE_ANON_KEY chưa được config"
    exit 1
else
    echo "✅ SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY:0:20}..."
fi

echo "🎉 Environment variables đã được config đúng!"
EOF

chmod +x test-env.sh

echo "✅ Đã tạo test script: test-env.sh"
echo ""
echo "🎯 NEXT STEPS:"
echo "============="
echo "1. Chỉnh sửa file .env với thông tin thật"
echo "2. Chạy: ./test-env.sh để kiểm tra"
echo "3. Test generate article"
echo ""
echo "💡 TIP: Thêm .env vào .gitignore để không commit secrets!"

# Check .gitignore
if [ -f ".gitignore" ]; then
    if ! grep -q "^\.env$" .gitignore; then
        echo ".env" >> .gitignore
        echo "✅ Đã thêm .env vào .gitignore"
    fi
else
    echo ".env" > .gitignore
    echo "✅ Đã tạo .gitignore và thêm .env"
fi

echo ""
echo "🎉 Setup hoàn tất! Hãy config .env file."