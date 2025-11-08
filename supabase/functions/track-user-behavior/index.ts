import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const method = req.method;
    const clientIP =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    if (method === "POST") {
      const body = await req.json();
      const { events, batch_size } = body;

      if (!events || !Array.isArray(events)) {
        return new Response(
          JSON.stringify({ error: "Events array is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Process each event
      const processedEvents = events.map((event) => ({
        ...event,
        ip_address: clientIP,
        created_at: new Date().toISOString(),
      }));

      // Insert events into database
      const { error: insertError } = await supabaseAdmin
        .from("user_analytics_events")
        .insert(processedEvents);

      if (insertError) {
        console.error("Insert error:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to save analytics events" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Update aggregated statistics
      await updateAggregatedStats(supabaseAdmin, processedEvents);

      return new Response(
        JSON.stringify({
          success: true,
          events_processed: processedEvents.length,
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // GET: Retrieve analytics data (for admin dashboard)
    if (method === "GET") {
      const url = new URL(req.url);
      const type = url.searchParams.get("type") || "summary";
      const days = parseInt(url.searchParams.get("days") || "7");
      const page = url.searchParams.get("page");

      let result = {};

      switch (type) {
        case "summary":
          result = await getAnalyticsSummary(supabaseAdmin, days);
          break;
        case "pages":
          result = await getTopPages(supabaseAdmin, days);
          break;
        case "keywords":
          result = await getTopKeywords(supabaseAdmin, days);
          break;
        case "traffic_sources":
          result = await getTrafficSources(supabaseAdmin, days);
          break;
        case "page_details":
          if (page) {
            result = await getPageDetails(supabaseAdmin, page, days);
          } else {
            result = { error: "Page parameter required" };
          }
          break;
        default:
          result = { error: "Invalid type parameter" };
      }

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

// Helper functions

async function updateAggregatedStats(supabase, events) {
  try {
    for (const event of events) {
      if (event.event_type === "page_view") {
        // Update page stats
        await supabase.rpc("increment_page_stats", {
          page_path: event.page,
          page_title: event.title || "",
          category: event.category || "Khác",
          keywords: event.keywords || [],
          traffic_source: event.traffic_source || {
            source: "direct",
            medium: "none",
          },
        });
      }

      if (event.event_type === "page_end") {
        // Update time spent stats
        await supabase.rpc("update_time_stats", {
          page_path: event.page,
          time_spent: event.time_spent || 0,
          scroll_depth: event.scroll_depth || 0,
          clicks: event.clicks || 0,
        });
      }
    }
  } catch (error) {
    console.error("Aggregation error:", error);
  }
}

async function getAnalyticsSummary(supabase, days) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: summary } = await supabase
      .from("analytics_summary")
      .select("*")
      .gte("date", startDate.toISOString().split("T")[0])
      .order("date", { ascending: false });

    const { data: realtime } = await supabase
      .from("user_analytics_events")
      .select("session_id, user_id, page, timestamp")
      .gte("timestamp", new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes
      .eq("event_type", "heartbeat");

    return {
      summary: summary || [],
      active_users: realtime?.length || 0,
      period: `${days} days`,
    };
  } catch (error) {
    return { error: error.message };
  }
}

async function getTopPages(supabase, days) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data } = await supabase
      .from("page_analytics")
      .select("*")
      .gte("last_updated", startDate.toISOString())
      .order("total_views", { ascending: false })
      .limit(20);

    return { pages: data || [] };
  } catch (error) {
    return { error: error.message };
  }
}

async function getTopKeywords(supabase, days) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data } = await supabase
      .from("keyword_analytics")
      .select("*")
      .gte("last_updated", startDate.toISOString())
      .order("frequency", { ascending: false })
      .limit(50);

    return { keywords: data || [] };
  } catch (error) {
    return { error: error.message };
  }
}

async function getTrafficSources(supabase, days) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data } = await supabase
      .from("traffic_source_analytics")
      .select("*")
      .gte("last_updated", startDate.toISOString())
      .order("visits", { ascending: false });

    return { traffic_sources: data || [] };
  } catch (error) {
    return { error: error.message };
  }
}

async function getPageDetails(supabase, page, days) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: pageStats } = await supabase
      .from("page_analytics")
      .select("*")
      .eq("page_path", page)
      .single();

    const { data: timeSeriesData } = await supabase
      .from("user_analytics_events")
      .select("timestamp, time_spent, scroll_depth")
      .eq("page", page)
      .eq("event_type", "page_end")
      .gte("timestamp", startDate.toISOString())
      .order("timestamp", { ascending: true });

    return {
      page_stats: pageStats,
      time_series: timeSeriesData || [],
    };
  } catch (error) {
    return { error: error.message };
  }
}
