/**
 * Supabase Anon Key Manager
 * Utility để lấy anon key từ Edge Function
 */

class SupabaseKeyManager {
  constructor(options = {}) {
    this.baseUrl =
      options.baseUrl || "https://fiaxrsiycswrwucthian.supabase.co";
    this.functionName = options.functionName || "get-anon-key";
    this.cacheKey = "supabase_anon_key_cache";
    this.cacheExpiry = options.cacheExpiry || 5 * 60 * 1000; // 5 minutes
    this.adminSecret = options.adminSecret || null;
  }

  /**
   * Get Edge Function URL
   */
  getFunctionUrl() {
    return `${this.baseUrl}/functions/v1/${this.functionName}`;
  }

  /**
   * Get cached anon key if still valid
   */
  getCachedKey() {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      if (!cached) return null;

      const { key, timestamp, usage_count } = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is still valid
      if (now - timestamp < this.cacheExpiry) {
        console.log(`🔑 Using cached anon key (used ${usage_count} times)`);
        return key;
      }

      // Cache expired, remove it
      localStorage.removeItem(this.cacheKey);
      return null;
    } catch (error) {
      console.error("Cache read error:", error);
      localStorage.removeItem(this.cacheKey);
      return null;
    }
  }

  /**
   * Cache anon key with metadata (legacy method)
   * @deprecated Use autoSaveKey instead
   */
  cacheKey(keyData) {
    console.warn("⚠️ cacheKey is deprecated, using autoSaveKey instead");
    return this.autoSaveKey(keyData, "cache_method");
  }

  /**
   * Fetch anon key from Edge Function
   */
  async fetchFromEdgeFunction() {
    try {
      // First try without auth header
      let response = await fetch(this.getFunctionUrl(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // If 401, try with a basic anon key for bootstrapping
      if (response.status === 401) {
        console.log("🔄 Trying with bootstrap anon key...");
        const bootstrapKey =
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpYXhyc2l5Y3N3cnd1Y3RoaWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDA2NDY3NjQsImV4cCI6MjAxNjIyMjc2NH0.bJhkUrUvKhQmNabgp8rqYYNKqglLpykUJ5wOhJHyqhE";

        response = await fetch(this.getFunctionUrl(), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${bootstrapKey}`,
            apikey: bootstrapKey,
          },
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Edge function error: ${errorData.error || response.statusText}`
        );
      }

      const data = await response.json();
      console.log("✅ Retrieved anon key from edge function");

      // Auto-save the key with metadata
      this.autoSaveKey(data, "edge_function");

      return data.anon_key;
    } catch (error) {
      console.error("❌ Edge function fetch error:", error);
      throw error;
    }
  }

  /**
   * Get anon key with fallback strategy
   */
  async getAnonKey() {
    try {
      // 1. Try cache first
      const cachedKey = this.getCachedKey();
      if (cachedKey) {
        return cachedKey;
      }

      // 2. Try edge function
      console.log("🔄 Fetching anon key from edge function...");
      const edgeKey = await this.fetchFromEdgeFunction();
      if (edgeKey) {
        return edgeKey;
      }

      // 3. Fallback to localStorage (old method)
      console.log("⚠️ Falling back to localStorage");
      const localKey = localStorage.getItem("supabase_anon_key");
      if (localKey) {
        return localKey;
      }

      // 4. No key available
      throw new Error("No anon key available");
    } catch (error) {
      console.error("🚨 Failed to get anon key:", error);

      // Final fallback to localStorage
      const fallbackKey = localStorage.getItem("supabase_anon_key");
      if (fallbackKey) {
        console.log("🔄 Using fallback key from localStorage");
        return fallbackKey;
      }

      throw new Error("No anon key available from any source");
    }
  }

  /**
   * Reset anon key (requires admin authentication)
   */
  async resetAnonKey(newKey, adminSecret = null) {
    try {
      const secret = adminSecret || this.adminSecret;
      if (!secret) {
        throw new Error("Admin secret required for key reset");
      }

      const response = await fetch(this.getFunctionUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify({
          action: "reset",
          new_anon_key: newKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Reset failed: ${errorData.error || response.statusText}`
        );
      }

      const result = await response.json();
      console.log("✅ Anon key reset successfully:", result);

      // Clear cache to force fresh fetch
      localStorage.removeItem(this.cacheKey);
      localStorage.removeItem("supabase_anon_key"); // Clear old cache too

      return result;
    } catch (error) {
      console.error("❌ Key reset error:", error);
      throw error;
    }
  }

  /**
   * Initialize Supabase client with auto-fetched key
   */
  async createSupabaseClient(supabaseUrl = null) {
    try {
      const url = supabaseUrl || this.baseUrl;
      const key = await this.getAnonKey();

      if (!window.supabase) {
        throw new Error("Supabase client library not loaded");
      }

      const client = window.supabase.createClient(url, key);
      console.log("✅ Supabase client created successfully");

      return client;
    } catch (error) {
      console.error("❌ Supabase client creation failed:", error);
      throw error;
    }
  }

  /**
   * Manually supply and cache anon key
   * Use this when you have a valid anon key from Dashboard
   */
  supplyAnonKey(anonKey, options = {}) {
    try {
      if (!anonKey || typeof anonKey !== "string") {
        throw new Error("Invalid anon key provided");
      }

      // Validate JWT format (basic check)
      const parts = anonKey.split(".");
      if (parts.length !== 3) {
        throw new Error("Invalid JWT format");
      }

      // Try to decode payload to check if it looks like a Supabase key
      try {
        const payload = JSON.parse(atob(parts[1]));
        if (!payload.iss || !payload.ref || !payload.role) {
          console.warn("⚠️ JWT does not look like a Supabase anon key");
        }
        console.log(`🔍 JWT payload:`, {
          issuer: payload.iss,
          ref: payload.ref,
          role: payload.role,
          exp: payload.exp
            ? new Date(payload.exp * 1000).toISOString()
            : "No expiry",
        });
      } catch (decodeError) {
        console.warn("⚠️ Could not decode JWT payload:", decodeError.message);
      }

      const cacheData = {
        key: anonKey,
        timestamp: Date.now(),
        created_at: options.created_at || new Date().toISOString(),
        usage_count: options.usage_count || 0,
        source: "manual_supply",
        supplied_at: new Date().toISOString(),
      };

      // Save to main cache
      localStorage.setItem(this.cacheKey, JSON.stringify(cacheData));

      // Also save to legacy key for backward compatibility
      localStorage.setItem("supabase_anon_key", anonKey);

      console.log("🔑 Anon key supplied and cached successfully");
      console.log(
        `📦 Cache will expire in ${Math.floor(
          this.cacheExpiry / (60 * 1000)
        )} minutes`
      );

      return {
        success: true,
        message: "Anon key cached successfully",
        expires_in_minutes: Math.floor(this.cacheExpiry / (60 * 1000)),
        cached_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error("❌ Failed to supply anon key:", error);
      throw error;
    }
  }

  /**
   * Set anon key with extended cache time
   * Use this for keys you know are long-lived
   */
  setLongLivedKey(anonKey, cacheHours = 24) {
    const originalExpiry = this.cacheExpiry;

    try {
      // Temporarily extend cache expiry
      this.cacheExpiry = cacheHours * 60 * 60 * 1000; // Convert hours to milliseconds

      const result = this.supplyAnonKey(anonKey, {
        created_at: new Date().toISOString(),
        usage_count: 0,
      });

      console.log(`🕒 Extended cache time set to ${cacheHours} hours`);
      return result;
    } finally {
      // Restore original expiry
      this.cacheExpiry = originalExpiry;
    }
  }

  /**
   * Import key from Supabase Dashboard format
   * Handles the full response format from Dashboard
   */
  importFromDashboard(dashboardData) {
    try {
      let anonKey;

      // Handle different input formats
      if (typeof dashboardData === "string") {
        anonKey = dashboardData;
      } else if (dashboardData && dashboardData.anon_key) {
        anonKey = dashboardData.anon_key;
      } else if (dashboardData && dashboardData.key) {
        anonKey = dashboardData.key;
      } else {
        throw new Error("Could not extract anon key from dashboard data");
      }

      return this.supplyAnonKey(anonKey, {
        created_at: dashboardData.created_at || new Date().toISOString(),
        usage_count: dashboardData.usage_count || 0,
      });
    } catch (error) {
      console.error("❌ Failed to import from dashboard:", error);
      throw error;
    }
  }

  /**
   * Auto-save key after successful fetch
   * Called internally after successful Edge Function calls
   */
  autoSaveKey(keyData, source = "edge_function") {
    try {
      const cacheData = {
        key: keyData.anon_key || keyData,
        timestamp: Date.now(),
        created_at: keyData.created_at || new Date().toISOString(),
        usage_count: keyData.usage_count || 0,
        source: source,
        auto_saved_at: new Date().toISOString(),
      };

      localStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
      localStorage.setItem("supabase_anon_key", cacheData.key);

      console.log(`💾 Auto-saved anon key from ${source}`);
      return cacheData;
    } catch (error) {
      console.error("❌ Auto-save failed:", error);
      return null;
    }
  }

  /**
   * Clear all cached keys
   */
  clearCache() {
    localStorage.removeItem(this.cacheKey);
    localStorage.removeItem("supabase_anon_key");
    console.log("🧹 Anon key cache cleared");
  }

  /**
   * Get cache info for debugging
   */
  getCacheInfo() {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      if (!cached) return null;

      const data = JSON.parse(cached);
      const now = Date.now();
      const ageMinutes = Math.floor((now - data.timestamp) / (60 * 1000));
      const isExpired = now - data.timestamp >= this.cacheExpiry;

      return {
        ...data,
        age_minutes: ageMinutes,
        is_expired: isExpired,
        expires_in_minutes: Math.floor(
          (this.cacheExpiry - (now - data.timestamp)) / (60 * 1000)
        ),
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Validate anon key by testing it against Supabase
   */
  async validateAnonKey(anonKey = null) {
    try {
      const testKey = anonKey || (await this.getAnonKey());

      if (!testKey) {
        return { valid: false, error: "No anon key available" };
      }

      // Test the key by making a simple request to Supabase
      const testResponse = await fetch(`${this.baseUrl}/rest/v1/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${testKey}`,
          apikey: testKey,
        },
      });

      if (testResponse.ok || testResponse.status === 404) {
        // 200 OK or 404 Not Found are both valid responses (means auth worked)
        return {
          valid: true,
          status: testResponse.status,
          message: "Anon key is valid",
        };
      } else if (testResponse.status === 401) {
        return {
          valid: false,
          status: 401,
          error: "Invalid JWT - key is expired or incorrect",
        };
      } else {
        return {
          valid: false,
          status: testResponse.status,
          error: `Unexpected response: ${testResponse.statusText}`,
        };
      }
    } catch (error) {
      return {
        valid: false,
        error: error.message,
      };
    }
  }

  /**
   * Get all available anon keys and their sources
   */
  getAllKeys() {
    const keys = {};

    try {
      // Main cache
      const cached = localStorage.getItem(this.cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        keys.cached = {
          key: data.key,
          source: data.source || "unknown",
          age_minutes: Math.floor((Date.now() - data.timestamp) / (60 * 1000)),
          is_expired: Date.now() - data.timestamp >= this.cacheExpiry,
        };
      }

      // Legacy key
      const legacy = localStorage.getItem("supabase_anon_key");
      if (legacy) {
        keys.legacy = {
          key: legacy,
          source: "legacy_storage",
        };
      }

      return keys;
    } catch (error) {
      return { error: error.message };
    }
  }
}

// Global instance
window.SupabaseKeyManager = SupabaseKeyManager;

// Export for use
if (typeof module !== "undefined" && module.exports) {
  module.exports = SupabaseKeyManager;
}
