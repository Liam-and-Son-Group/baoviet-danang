import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AnonKeyConfig {
  id?: string;
  anon_key: string;
  created_at?: string;
  last_used?: string;
  is_active: boolean;
  domain_whitelist?: string[];
  usage_count?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key (có full permissions)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const url = new URL(req.url);
    const method = req.method;
    const origin =
      req.headers.get("origin") || req.headers.get("referer") || "";

    // Security: Check domain whitelist
    const allowedDomains = [
      "baohiembaovietdanang.vn",
      "www.baohiembaovietdanang.vn",
      "localhost",
      "127.0.0.1",
    ];

    const isAllowedDomain = allowedDomains.some(
      (domain) =>
        origin.includes(domain) ||
        origin.includes("localhost") ||
        origin.includes("127.0.0.1")
    );

    if (!isAllowedDomain && Deno.env.get("ENVIRONMENT") === "production") {
      return new Response(JSON.stringify({ error: "Domain not allowed" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET: Retrieve anon key
    if (method === "GET") {
      // For GET requests, allow without auth but still try to get from database
      let configData = null;
      let configError = null;

      try {
        const result = await supabaseAdmin
          .from("anon_key_config")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1);

        configData = result.data;
        configError = result.error;
      } catch (error) {
        console.error("Database access error:", error);
        // Continue with fallback
      }

      if (configError) {
        console.error("Config fetch error:", configError);
        // Don't return error, continue with fallback
      }

      if (!configData || configData.length === 0) {
        // No config found, return the default anon key from environment
        let defaultKey = Deno.env.get("SUPABASE_ANON_KEY");

        // Fallback to hardcoded key if environment variable not available
        if (!defaultKey) {
          defaultKey =
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpYXhyc2l5Y3N3cnd1Y3RoaWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDA2NDY3NjQsImV4cCI6MjAxNjIyMjc2NH0.bJhkUrUvKhQmNabgp8rqYYNKqglLpykUJ5wOhJHyqhE";
        }

        if (!defaultKey) {
          return new Response(
            JSON.stringify({ error: "No anon key configured" }),
            {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Create initial config record
        const { error: insertError } = await supabaseAdmin
          .from("anon_key_config")
          .insert([
            {
              anon_key: defaultKey,
              is_active: true,
              domain_whitelist: allowedDomains,
              usage_count: 1,
            },
          ]);

        if (insertError) {
          console.error("Initial config creation error:", insertError);
        }

        return new Response(
          JSON.stringify({
            anon_key: defaultKey,
            created_at: new Date().toISOString(),
            usage_count: 1,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const config = configData[0];

      // Update usage statistics
      const { error: updateError } = await supabaseAdmin
        .from("anon_key_config")
        .update({
          last_used: new Date().toISOString(),
          usage_count: (config.usage_count || 0) + 1,
        })
        .eq("id", config.id);

      if (updateError) {
        console.error("Usage update error:", updateError);
      }

      return new Response(
        JSON.stringify({
          anon_key: config.anon_key,
          created_at: config.created_at,
          last_used: new Date().toISOString(),
          usage_count: (config.usage_count || 0) + 1,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // POST: Update/Reset anon key (requires admin authentication)
    if (method === "POST") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return new Response(
          JSON.stringify({ error: "Missing or invalid authorization header" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Verify admin access (you can customize this logic)
      const token = authHeader.replace("Bearer ", "");
      const adminSecret = Deno.env.get("ADMIN_SECRET_KEY");

      if (token !== adminSecret) {
        return new Response(
          JSON.stringify({ error: "Unauthorized: Invalid admin token" }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const body = await req.json();
      const { new_anon_key, action = "update" } = body;

      if (action === "reset") {
        // Generate new anon key (in real scenario, you'd call Supabase API to generate new key)
        const newKey = new_anon_key || Deno.env.get("SUPABASE_ANON_KEY");

        if (!newKey) {
          return new Response(
            JSON.stringify({ error: "No new anon key provided" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Deactivate old keys
        const { error: deactivateError } = await supabaseAdmin
          .from("anon_key_config")
          .update({ is_active: false })
          .eq("is_active", true);

        if (deactivateError) {
          console.error("Key deactivation error:", deactivateError);
        }

        // Insert new key
        const { data: newConfigData, error: insertError } = await supabaseAdmin
          .from("anon_key_config")
          .insert([
            {
              anon_key: newKey,
              is_active: true,
              domain_whitelist: allowedDomains,
              usage_count: 0,
            },
          ])
          .select();

        if (insertError) {
          console.error("New key insertion error:", insertError);
          return new Response(
            JSON.stringify({ error: "Failed to reset anon key" }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        return new Response(
          JSON.stringify({
            message: "Anon key reset successfully",
            new_key_id: newConfigData?.[0]?.id,
            reset_at: new Date().toISOString(),
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Method not allowed
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
