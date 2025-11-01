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
