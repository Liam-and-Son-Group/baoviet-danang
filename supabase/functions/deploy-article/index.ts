import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { article_id, trigger_source = "edge_function" } = await req.json();

    if (!article_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required field: article_id",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get GitHub token from Supabase secrets
    const githubToken = Deno.env.get("GITHUB_TOKEN");
    if (!githubToken) {
      console.error("❌ GITHUB_TOKEN not found in environment variables");
      console.error(
        "Set it using: supabase secrets set GITHUB_TOKEN=your_token",
      );
      return new Response(
        JSON.stringify({
          success: false,
          error: "GitHub token not configured. Please set GITHUB_TOKEN secret.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    // Get article data from database
    const { data: article, error: articleError } = await supabase
      .from("articles")
      .select("*")
      .eq("id", article_id)
      .single();

    if (articleError || !article) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Article not found",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        },
      );
    }

    // Log deploy attempt
    await supabase.rpc("log_deploy_attempt", {
      article_uuid: article.id,
      deploy_status: "initiated",
    });

    // Prepare GitHub webhook payload
    const payload = {
      event_type: "new-article-created",
      client_payload: {
        article_id: article.id,
        article_filename: article.filename,
        article_title: article.title,
        trigger_source,
        timestamp: new Date().toISOString(),
      },
    };

    console.log("🚀 Triggering GitHub deploy for:", article.filename);

    // Send webhook to GitHub
    const githubResponse = await fetch(
      "https://api.github.com/repos/Liam-and-Son-Group/baoviet-danang/dispatches",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
          "User-Agent": "Supabase-Edge-Function/1.0",
        },
        body: JSON.stringify(payload),
      },
    );

    const success = githubResponse.status === 204;

    console.log(`📊 GitHub API response: ${githubResponse.status}`);

    // Log result back to database
    await supabase.rpc("log_deploy_attempt", {
      article_uuid: article.id,
      deploy_status: success ? "success" : "failed",
      error_msg: success ? null : `HTTP ${githubResponse.status}`,
    });

    if (!success) {
      const errorText = await githubResponse.text();
      console.error("❌ GitHub API error:", errorText);
    }

    // Return result
    const result = {
      success,
      article_id: article.id,
      article_filename: article.filename,
      github_status: githubResponse.status,
      timestamp: new Date().toISOString(),
      trigger_source,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: success ? 200 : 500,
    });
  } catch (error) {
    console.error("❌ Deploy function error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
