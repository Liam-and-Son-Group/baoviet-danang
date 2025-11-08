/**
 * Admin Authentication & Key Management System
 * Tự động lấy và lưu keys sau khi đăng nhập admin
 */

class AdminKeyManager {
  constructor(options = {}) {
    this.baseUrl =
      options.baseUrl || "https://fiaxrsiycswrwucthian.supabase.co";
    this.adminSessionKey = "admin_session_data";
    this.adminKeysKey = "admin_keys_cache";
    this.sessionExpiry = options.sessionExpiry || 8 * 60 * 60 * 1000; // 8 hours
    this.keysExpiry = options.keysExpiry || 24 * 60 * 60 * 1000; // 24 hours

    // Key manager instance
    this.keyManager = new (window.SupabaseKeyManager || SupabaseKeyManager)();
  }

  /**
   * Admin login and key initialization
   */
  async loginAdmin(credentials) {
    try {
      console.log("🔐 Starting admin login process...");

      // Step 1: Validate admin credentials
      const loginResult = await this.validateAdminCredentials(credentials);
      if (!loginResult.success) {
        throw new Error(loginResult.error || "Invalid admin credentials");
      }

      // Step 2: Save admin session
      this.saveAdminSession(loginResult.session);

      // Step 3: Initialize keys
      console.log("🔑 Initializing admin keys...");
      const keysResult = await this.initializeAdminKeys(loginResult.session);

      // Step 4: Setup auto-refresh
      this.setupKeyRefresh();

      const result = {
        success: true,
        message: "Admin login successful",
        session: loginResult.session,
        keys: keysResult,
        logged_in_at: new Date().toISOString(),
      };

      console.log("✅ Admin login completed:", result);
      return result;
    } catch (error) {
      console.error("❌ Admin login failed:", error);
      this.clearAdminData();
      throw error;
    }
  }

  /**
   * Validate admin credentials
   */
  async validateAdminCredentials(credentials) {
    try {
      const { username, password, adminKey } = credentials;

      // Method 1: Username/Password authentication
      if (username && password) {
        // TODO: Implement your admin authentication logic here
        // This could be against your own backend, Supabase Auth, etc.

        // For now, simple hardcoded check (replace with real auth)
        const validCredentials = [
          { username: "admin", password: "admin123" },
          { username: "baoviet", password: "baoviet2024" },
        ];

        const isValid = validCredentials.some(
          (cred) => cred.username === username && cred.password === password
        );

        if (isValid) {
          return {
            success: true,
            session: {
              type: "username_password",
              username: username,
              logged_in_at: new Date().toISOString(),
              expires_at: new Date(
                Date.now() + this.sessionExpiry
              ).toISOString(),
            },
          };
        } else {
          return { success: false, error: "Invalid username or password" };
        }
      }

      // Method 2: Admin key authentication
      if (adminKey) {
        // Validate admin key format (should be a strong key)
        if (adminKey.length < 20) {
          return { success: false, error: "Admin key too short" };
        }

        return {
          success: true,
          session: {
            type: "admin_key",
            admin_key: adminKey,
            logged_in_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + this.sessionExpiry).toISOString(),
          },
        };
      }

      return { success: false, error: "No valid credentials provided" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Initialize all admin keys after login
   */
  async initializeAdminKeys(session) {
    try {
      const keys = {};

      // 1. Auto-fetch Supabase anon key from Edge Function
      console.log("🔑 Auto-fetching Supabase anon key from Edge Function...");
      try {
        keys.anon_key = await this.keyManager.getAnonKey();
        console.log(
          "✅ Anon key automatically obtained (no manual input needed)"
        );
      } catch (error) {
        console.warn("⚠️ Could not auto-fetch anon key:", error.message);
        keys.anon_key = null;
      }

      // 2. Get service role key (if admin has access)
      console.log("🔑 Checking service role access...");
      try {
        keys.service_role_key = await this.getServiceRoleKey(session);
        console.log("✅ Service role key obtained");
      } catch (error) {
        console.warn("⚠️ Could not get service role key:", error.message);
        keys.service_role_key = null;
      }

      // 3. Get admin-specific keys
      console.log("🔑 Fetching admin keys...");
      try {
        keys.admin_keys = await this.getAdminKeys(session);
        console.log("✅ Admin keys obtained");
      } catch (error) {
        console.warn("⚠️ Could not get admin keys:", error.message);
        keys.admin_keys = {};
      }

      // 4. Cache keys
      this.cacheAdminKeys(keys);

      return keys;
    } catch (error) {
      console.error("❌ Key initialization failed:", error);
      return { error: error.message };
    }
  }

  /**
   * Get service role key (only for authorized admins)
   */
  async getServiceRoleKey(session) {
    try {
      // This would typically call a secure endpoint that returns the service role key
      // Only for highly privileged admin operations

      if (session.type === "admin_key") {
        // Use admin key to get service role key from secure endpoint
        const response = await fetch(
          `${this.baseUrl}/functions/v1/get-service-key`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.admin_key}`,
            },
            body: JSON.stringify({
              action: "get_service_key",
              session_id: session.logged_in_at,
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          return data.service_role_key;
        }
      }

      // For username/password, service role is not provided for security
      return null;
    } catch (error) {
      console.error("Service role key fetch error:", error);
      return null;
    }
  }

  /**
   * Get admin-specific keys and configurations
   */
  async getAdminKeys(session) {
    try {
      const adminKeys = {
        // Analytics API key (if separate from anon key)
        analytics_key: await this.getAnalyticsKey(session),

        // Content management key
        cms_key: await this.getCMSKey(session),

        // User management key
        user_mgmt_key: await this.getUserMgmtKey(session),

        // Other service keys
        other_keys: {},
      };

      return adminKeys;
    } catch (error) {
      console.error("Admin keys fetch error:", error);
      return {};
    }
  }

  /**
   * Get analytics-specific key
   */
  async getAnalyticsKey(session) {
    try {
      // This could be the same as anon key or a separate analytics key
      // For now, use the same anon key
      return await this.keyManager.getAnonKey();
    } catch (error) {
      return null;
    }
  }

  /**
   * Get CMS key for content management
   */
  async getCMSKey(session) {
    try {
      // Same anon key for CMS operations
      return await this.keyManager.getAnonKey();
    } catch (error) {
      return null;
    }
  }

  /**
   * Get user management key
   */
  async getUserMgmtKey(session) {
    try {
      // Same anon key for user management
      return await this.keyManager.getAnonKey();
    } catch (error) {
      return null;
    }
  }

  /**
   * Save admin session to localStorage
   */
  saveAdminSession(session) {
    try {
      const sessionData = {
        ...session,
        cached_at: new Date().toISOString(),
      };

      localStorage.setItem(this.adminSessionKey, JSON.stringify(sessionData));
      console.log("💾 Admin session saved");
    } catch (error) {
      console.error("Session save error:", error);
    }
  }

  /**
   * Cache admin keys
   */
  cacheAdminKeys(keys) {
    try {
      const keysData = {
        ...keys,
        cached_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + this.keysExpiry).toISOString(),
      };

      localStorage.setItem(this.adminKeysKey, JSON.stringify(keysData));
      console.log("💾 Admin keys cached");
    } catch (error) {
      console.error("Keys cache error:", error);
    }
  }

  /**
   * Get current admin session
   */
  getCurrentSession() {
    try {
      const cached = localStorage.getItem(this.adminSessionKey);
      if (!cached) return null;

      const session = JSON.parse(cached);
      const now = new Date();
      const expiresAt = new Date(session.expires_at);

      if (now > expiresAt) {
        this.clearAdminData();
        return null;
      }

      return session;
    } catch (error) {
      console.error("Session retrieval error:", error);
      return null;
    }
  }

  /**
   * Get cached admin keys
   */
  getCachedKeys() {
    try {
      const cached = localStorage.getItem(this.adminKeysKey);
      if (!cached) return null;

      const keys = JSON.parse(cached);
      const now = new Date();
      const expiresAt = new Date(keys.expires_at);

      if (now > expiresAt) {
        localStorage.removeItem(this.adminKeysKey);
        return null;
      }

      return keys;
    } catch (error) {
      console.error("Keys retrieval error:", error);
      return null;
    }
  }

  /**
   * Get specific key by type
   */
  async getKey(keyType = "anon_key") {
    try {
      // Check if admin is logged in
      const session = this.getCurrentSession();
      if (!session) {
        throw new Error("Admin not logged in");
      }

      // Get cached keys
      let keys = this.getCachedKeys();

      // If no cached keys or expired, refresh
      if (!keys) {
        console.log("🔄 Refreshing admin keys...");
        keys = await this.initializeAdminKeys(session);
      }

      // Return requested key
      switch (keyType) {
        case "anon_key":
          return keys.anon_key;
        case "service_role_key":
          return keys.service_role_key;
        case "analytics_key":
          return keys.admin_keys?.analytics_key || keys.anon_key;
        case "cms_key":
          return keys.admin_keys?.cms_key || keys.anon_key;
        case "user_mgmt_key":
          return keys.admin_keys?.user_mgmt_key || keys.anon_key;
        default:
          return keys.anon_key;
      }
    } catch (error) {
      console.error(`Failed to get ${keyType}:`, error);
      throw error;
    }
  }

  /**
   * Setup automatic key refresh
   */
  setupKeyRefresh() {
    // Refresh keys every 4 hours
    const refreshInterval = 4 * 60 * 60 * 1000;

    // Clear any existing interval
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    this.refreshTimer = setInterval(async () => {
      try {
        const session = this.getCurrentSession();
        if (session) {
          console.log("🔄 Auto-refreshing admin keys...");
          await this.initializeAdminKeys(session);
        }
      } catch (error) {
        console.error("Auto-refresh failed:", error);
      }
    }, refreshInterval);
  }

  /**
   * Check if admin is logged in
   */
  isLoggedIn() {
    const session = this.getCurrentSession();
    return session !== null;
  }

  /**
   * Logout admin and clear all data
   */
  logout() {
    this.clearAdminData();

    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }

    console.log("👋 Admin logged out");
  }

  /**
   * Clear all admin data
   */
  clearAdminData() {
    localStorage.removeItem(this.adminSessionKey);
    localStorage.removeItem(this.adminKeysKey);
    console.log("🧹 Admin data cleared");
  }

  /**
   * Get admin info
   */
  getAdminInfo() {
    const session = this.getCurrentSession();
    const keys = this.getCachedKeys();

    return {
      logged_in: session !== null,
      session: session,
      keys_available: keys !== null,
      keys_summary: keys
        ? {
            anon_key: keys.anon_key ? "Available" : "Missing",
            service_role_key: keys.service_role_key ? "Available" : "Missing",
            admin_keys: Object.keys(keys.admin_keys || {}).length,
          }
        : null,
    };
  }
}

// Global instance
window.AdminKeyManager = AdminKeyManager;

// Export for use
if (typeof module !== "undefined" && module.exports) {
  module.exports = AdminKeyManager;
}
