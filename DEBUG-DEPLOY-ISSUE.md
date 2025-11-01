# 🔍 TROUBLESHOOTING: GITHUB ACTIONS KHÔNG TRIGGER

## ❌ **VẤN ĐỀ:**

- Webhook_logs không có records mới
- Articles có records mới nhưng không trigger GitHub Actions
- Deploy button không hoạt động

## 🕵️ **DEBUG STEPS:**

### **BƯỚC 1: KIỂM TRA EDGE FUNCTION ĐÃ DEPLOY CHƯA**

```bash
# Check if function exists
curl https://YOUR_PROJECT_REF.supabase.co/functions/v1/deploy-article \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"test": "ping"}'

# Expected response: Function should respond (even with error is OK)
# If 404: Function chưa deploy
```

### **BƯỚC 2: DEPLOY EDGE FUNCTION**

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Login
supabase login

# Get project ref from Supabase dashboard URL
# Example: https://app.supabase.com/project/abcdefghij123456
supabase link --project-ref YOUR_PROJECT_REF

# Deploy function
supabase functions deploy deploy-article

# Set GitHub token
supabase secrets set GITHUB_TOKEN=ghp_your_github_token_here
```

### **BƯỚC 3: TEST EDGE FUNCTION**

```bash
# Test with real article ID
curl https://YOUR_PROJECT_REF.supabase.co/functions/v1/deploy-article \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"article_id": "YOUR_ARTICLE_UUID"}'

# Check logs
supabase functions logs deploy-article --follow
```

### **BƯỚC 4: KIỂM TRA ADMIN INTERFACE**

Mở browser console và check:

1. **Admin có gọi Edge Function không:**

   ```javascript
   // Trong browser console
   console.log("Testing Edge Function call...");

   // Test call to Edge Function
   const { data, error } = await client.functions.invoke("deploy-article", {
     body: { article_id: "test-id" },
   });

   console.log("Result:", { data, error });
   ```

2. **Check Supabase client setup:**
   ```javascript
   // Check if client is properly initialized
   console.log("Supabase client:", client);
   console.log("Project URL:", client.supabaseUrl);
   ```

### **BƯỚC 5: FIX ADMIN INTERFACE NẾU CẦN**

Nếu admin interface không gọi Edge Function, cần update code:

```javascript
// Đảm bảo function triggerGitHubDeploy gọi Edge Function
async function triggerGitHubDeploy(article) {
  console.log("🚀 Calling Edge Function for:", article.filename);

  try {
    const { data, error } = await client.functions.invoke("deploy-article", {
      body: {
        article_id: article.id,
        trigger_source: "admin_interface",
      },
    });

    if (error) {
      console.error("Edge Function error:", error);
      throw error;
    }

    console.log("Edge Function result:", data);

    if (data && data.success) {
      showStatus(`🎉 Deploy triggered! Check GitHub Actions.`, "success");
    } else {
      throw new Error("Deploy failed: " + (data?.error || "Unknown error"));
    }
  } catch (error) {
    console.error("Deploy error:", error);
    showStatus(`❌ Deploy failed: ${error.message}`, "error");
    throw error;
  }
}
```

## 🔧 **QUICK FIXES:**

### **Fix 1: Simple Test Deploy Function**

Tạo file test đơn giản:

```javascript
// Trong browser console của admin page
async function testDeploy() {
  try {
    console.log("Testing deploy function...");

    // Get first article
    const { data: articles } = await client
      .from("articles")
      .select("id, filename")
      .limit(1);

    if (!articles || articles.length === 0) {
      console.log("No articles found");
      return;
    }

    const article = articles[0];
    console.log("Testing with article:", article);

    // Call Edge Function
    const { data, error } = await client.functions.invoke("deploy-article", {
      body: { article_id: article.id },
    });

    console.log("Deploy result:", { data, error });
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run test
testDeploy();
```

### **Fix 2: Manual GitHub API Call** (backup solution)

Nếu Edge Function không hoạt động, có thể gọi GitHub API trực tiếp:

```javascript
async function manualGitHubTrigger(article) {
  const githubToken = prompt("Enter GitHub token:");

  const payload = {
    event_type: "new-article-created",
    client_payload: {
      article_id: article.id,
      article_filename: article.filename,
      article_title: article.title,
    },
  };

  const response = await fetch(
    "https://api.github.com/repos/Liam-and-Son-Group/baoviet-danang/dispatches",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  console.log("GitHub API response:", response.status);
  return response.status === 204;
}
```

## 📊 **MONITORING:**

### **Check logs trong Supabase:**

```sql
-- Check webhook logs
SELECT * FROM webhook_logs ORDER BY created_at DESC;

-- Check articles
SELECT id, filename, title, created_at FROM articles ORDER BY created_at DESC LIMIT 5;
```

### **Check GitHub Actions:**

https://github.com/Liam-and-Son-Group/baoviet-danang/actions

### **Check Edge Function logs:**

```bash
supabase functions logs deploy-article --follow
```

## ✅ **SUCCESS INDICATORS:**

Khi hoạt động đúng:

1. ✅ Webhook_logs có records mới khi deploy
2. ✅ GitHub Actions xuất hiện trong Actions tab
3. ✅ Console logs show successful Edge Function calls
4. ✅ Files mới được tạo trong repository

**🎯 Chạy debug steps trên để tìm ra nguyên nhân!**
