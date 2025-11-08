/**
 * Supabase Authentication System
 * Complete authentication solution for Admin Dashboard
 */

class SupabaseAuthManager {
  constructor() {
    this.supabase = null;
    this.currentUser = null;
    this.authStateListeners = [];
    this.isInitialized = false;

    // Configuration
    this.config = {
      sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
      rememberMe: true,
      redirectTo: window.location.origin + "/admin-dashboard.html",
    };

    this.init();
  }

  /**
   * Initialize Supabase Authentication
   */
  async init() {
    try {
      console.log("🔐 Initializing Supabase Authentication...");

      // Get Supabase keys
      await this.initializeSupabaseClient();

      // Setup auth state listener
      this.setupAuthStateListener();

      // Check existing session
      await this.checkExistingSession();

      this.isInitialized = true;
      console.log("✅ Supabase Authentication initialized");
    } catch (error) {
      console.error("❌ Failed to initialize Supabase Auth:", error);
      throw error;
    }
  }

  /**
   * Initialize Supabase client with authentication
   */
  async initializeSupabaseClient() {
    try {
      // Get anon key from key manager
      let anonKey = null;

      if (window.SupabaseKeyManager) {
        const keyManager = new window.SupabaseKeyManager();
        anonKey = await keyManager.getAnonKey();
      }

      if (!anonKey) {
        throw new Error("Could not obtain Supabase anon key");
      }

      // Get configuration
      const config = window.SUPABASE_CONFIG || {};
      const supabaseUrl = config.url;

      if (!supabaseUrl || supabaseUrl.includes("your-project-ref")) {
        throw new Error(
          "Please configure your Supabase URL in supabase-config.js"
        );
      }

      // Initialize Supabase client
      this.supabase = supabase.createClient(supabaseUrl, anonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: this.config.rememberMe,
          detectSessionInUrl: true,
        },
      });

      console.log("✅ Supabase client initialized");
    } catch (error) {
      console.error("❌ Failed to initialize Supabase client:", error);
      throw error;
    }
  }

  /**
   * Setup authentication state listener
   */
  setupAuthStateListener() {
    if (!this.supabase) return;

    this.supabase.auth.onAuthStateChange((event, session) => {
      console.log("🔐 Auth state changed:", event, session);

      this.currentUser = session?.user || null;

      // Notify listeners
      this.authStateListeners.forEach((listener) => {
        try {
          listener(event, session);
        } catch (error) {
          console.error("Auth state listener error:", error);
        }
      });

      // Handle different auth events
      switch (event) {
        case "SIGNED_IN":
          this.onSignIn(session);
          break;
        case "SIGNED_OUT":
          this.onSignOut();
          break;
        case "TOKEN_REFRESHED":
          this.onTokenRefresh(session);
          break;
        case "USER_UPDATED":
          this.onUserUpdate(session);
          break;
      }
    });
  }

  /**
   * Check for existing authentication session
   */
  async checkExistingSession() {
    try {
      const {
        data: { session },
        error,
      } = await this.supabase.auth.getSession();

      if (error) {
        console.warn("Session check error:", error);
        return false;
      }

      if (session) {
        console.log("✅ Existing session found:", session.user.email);
        this.currentUser = session.user;
        return true;
      }

      console.log("ℹ️ No existing session");
      return false;
    } catch (error) {
      console.error("Failed to check existing session:", error);
      return false;
    }
  }

  /**
   * Sign in with email and password
   */
  async signInWithPassword(email, password) {
    try {
      console.log("🔐 Signing in with email:", email);

      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        console.error("Sign in error:", error);
        return { success: false, error: error.message };
      }

      console.log("✅ Sign in successful:", data.user.email);
      return {
        success: true,
        user: data.user,
        session: data.session,
      };
    } catch (error) {
      console.error("Sign in failed:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sign up new user
   */
  async signUp(email, password, userData = {}) {
    try {
      console.log("📝 Creating new account:", email);

      const { data, error } = await this.supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: userData.fullName || "",
            role: userData.role || "admin",
            ...userData,
          },
        },
      });

      if (error) {
        console.error("Sign up error:", error);
        return { success: false, error: error.message };
      }

      console.log("✅ Sign up successful - check email for confirmation");
      return {
        success: true,
        user: data.user,
        needsConfirmation: !data.session,
      };
    } catch (error) {
      console.error("Sign up failed:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sign in with magic link
   */
  async signInWithMagicLink(email) {
    try {
      console.log("🔗 Sending magic link to:", email);

      const { data, error } = await this.supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: this.config.redirectTo,
        },
      });

      if (error) {
        console.error("Magic link error:", error);
        return { success: false, error: error.message };
      }

      console.log("✅ Magic link sent successfully");
      return { success: true, message: "Check your email for the login link" };
    } catch (error) {
      console.error("Magic link failed:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle() {
    try {
      console.log("🔐 Signing in with Google...");

      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: this.config.redirectTo,
        },
      });

      if (error) {
        console.error("Google sign in error:", error);
        return { success: false, error: error.message };
      }

      console.log("✅ Google sign in initiated");
      return { success: true, message: "Redirecting to Google..." };
    } catch (error) {
      console.error("Google sign in failed:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sign out current user
   */
  async signOut() {
    try {
      console.log("👋 Signing out...");

      const { error } = await this.supabase.auth.signOut();

      if (error) {
        console.error("Sign out error:", error);
        return { success: false, error: error.message };
      }

      console.log("✅ Sign out successful");
      return { success: true };
    } catch (error) {
      console.error("Sign out failed:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email) {
    try {
      console.log("🔄 Sending password reset to:", email);

      const { data, error } = await this.supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: this.config.redirectTo + "?reset=true",
        }
      );

      if (error) {
        console.error("Password reset error:", error);
        return { success: false, error: error.message };
      }

      console.log("✅ Password reset email sent");
      return { success: true, message: "Password reset email sent" };
    } catch (error) {
      console.error("Password reset failed:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update user password
   */
  async updatePassword(newPassword) {
    try {
      console.log("🔄 Updating password...");

      const { data, error } = await this.supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error("Password update error:", error);
        return { success: false, error: error.message };
      }

      console.log("✅ Password updated successfully");
      return { success: true, user: data.user };
    } catch (error) {
      console.error("Password update failed:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates) {
    try {
      console.log("👤 Updating user profile...");

      const { data, error } = await this.supabase.auth.updateUser({
        data: updates,
      });

      if (error) {
        console.error("Profile update error:", error);
        return { success: false, error: error.message };
      }

      console.log("✅ Profile updated successfully");
      return { success: true, user: data.user };
    } catch (error) {
      console.error("Profile update failed:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.currentUser;
  }

  /**
   * Get user role
   */
  getUserRole() {
    return this.currentUser?.user_metadata?.role || "user";
  }

  /**
   * Check if user has specific role
   */
  hasRole(role) {
    return this.getUserRole() === role;
  }

  /**
   * Check if user is admin
   */
  isAdmin() {
    return this.hasRole("admin") || this.hasRole("super_admin");
  }

  /**
   * Add authentication state listener
   */
  onAuthStateChange(callback) {
    this.authStateListeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  /**
   * Handle successful sign in
   */
  onSignIn(session) {
    console.log("✅ User signed in:", session.user.email);

    // Store user info
    this.currentUser = session.user;

    // Dispatch custom event
    document.dispatchEvent(
      new CustomEvent("supabase-auth-signin", {
        detail: { user: session.user, session },
      })
    );

    // Update UI
    this.updateAuthUI(true);
  }

  /**
   * Handle sign out
   */
  onSignOut() {
    console.log("👋 User signed out");

    // Clear user info
    this.currentUser = null;

    // Dispatch custom event
    document.dispatchEvent(new CustomEvent("supabase-auth-signout"));

    // Update UI
    this.updateAuthUI(false);
  }

  /**
   * Handle token refresh
   */
  onTokenRefresh(session) {
    console.log("🔄 Token refreshed for:", session.user.email);
    this.currentUser = session.user;
  }

  /**
   * Handle user update
   */
  onUserUpdate(session) {
    console.log("👤 User updated:", session.user.email);
    this.currentUser = session.user;
  }

  /**
   * Update authentication UI
   */
  updateAuthUI(isAuthenticated) {
    // Show/hide authenticated sections
    document.querySelectorAll(".auth-required").forEach((element) => {
      element.style.display = isAuthenticated ? "block" : "none";
    });

    document.querySelectorAll(".auth-hidden").forEach((element) => {
      element.style.display = isAuthenticated ? "none" : "block";
    });

    // Update user info displays
    if (isAuthenticated && this.currentUser) {
      document.querySelectorAll(".user-email").forEach((element) => {
        element.textContent = this.currentUser.email;
      });

      document.querySelectorAll(".user-name").forEach((element) => {
        element.textContent =
          this.currentUser.user_metadata?.full_name ||
          this.currentUser.email.split("@")[0];
      });
    }
  }

  /**
   * Get authentication headers for API calls
   */
  async getAuthHeaders() {
    try {
      const {
        data: { session },
      } = await this.supabase.auth.getSession();

      if (session) {
        return {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        };
      }

      return { "Content-Type": "application/json" };
    } catch (error) {
      console.error("Failed to get auth headers:", error);
      return { "Content-Type": "application/json" };
    }
  }

  /**
   * Make authenticated API call
   */
  async authenticatedFetch(url, options = {}) {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      return response;
    } catch (error) {
      console.error("Authenticated fetch failed:", error);
      throw error;
    }
  }
}

// Initialize global auth manager
let supabaseAuth = null;

document.addEventListener("DOMContentLoaded", async function () {
  try {
    supabaseAuth = new SupabaseAuthManager();

    // Make globally available
    window.supabaseAuth = supabaseAuth;
    window.SupabaseAuthManager = SupabaseAuthManager;

    console.log("🎯 Supabase Authentication ready");
  } catch (error) {
    console.error("Failed to initialize Supabase Auth:", error);
  }
});

// Export for modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = SupabaseAuthManager;
}
