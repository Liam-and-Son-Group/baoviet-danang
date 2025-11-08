/**
 * Supabase Configuration
 * Configuration settings for Supabase Authentication and Services
 */

// Supabase Configuration
const SUPABASE_CONFIG = {
  // Replace with your actual Supabase URL
  // IMPORTANT: Update this with your real Supabase project URL
  url: "https://fiaxrsiycswrwucthian.supabase.co", // ← CHANGE THIS!

  // This will be automatically fetched from edge function
  anonKey: null,

  // Service role key (admin operations only)
  serviceRoleKey: null,

  // Auth configuration
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },

  // Database configuration
  db: {
    schema: "public",
  },

  // RLS (Row Level Security) policies
  rls: {
    enabled: true,
    adminBypass: false,
  },
};

// Admin roles configuration
const ADMIN_ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  EDITOR: "editor",
  VIEWER: "viewer",
};

// Role permissions
const ROLE_PERMISSIONS = {
  [ADMIN_ROLES.SUPER_ADMIN]: [
    "dashboard.view",
    "dashboard.edit",
    "users.manage",
    "analytics.view",
    "settings.manage",
    "system.admin",
  ],
  [ADMIN_ROLES.ADMIN]: [
    "dashboard.view",
    "dashboard.edit",
    "users.view",
    "analytics.view",
    "settings.view",
  ],
  [ADMIN_ROLES.EDITOR]: ["dashboard.view", "dashboard.edit", "analytics.view"],
  [ADMIN_ROLES.VIEWER]: ["dashboard.view", "analytics.view"],
};

// Database tables configuration
const DATABASE_TABLES = {
  PROFILES: "profiles",
  USER_SESSIONS: "user_sessions",
  ANALYTICS: "analytics_events",
  ADMIN_LOGS: "admin_logs",
};

// Authentication providers
const AUTH_PROVIDERS = {
  EMAIL: "email",
  GOOGLE: "google",
  GITHUB: "github",
  MAGIC_LINK: "magic_link",
};

// Error messages
const AUTH_ERRORS = {
  INVALID_CREDENTIALS: "Invalid email or password",
  EMAIL_NOT_CONFIRMED: "Please confirm your email address",
  USER_NOT_FOUND: "User not found",
  WEAK_PASSWORD: "Password should be at least 8 characters",
  EMAIL_ALREADY_EXISTS: "An account with this email already exists",
  INSUFFICIENT_PERMISSIONS:
    "You do not have permission to access this resource",
  SESSION_EXPIRED: "Your session has expired. Please sign in again",
  NETWORK_ERROR: "Network error. Please check your connection",
};

// Success messages
const AUTH_SUCCESS = {
  SIGN_IN: "Successfully signed in!",
  SIGN_UP: "Account created successfully!",
  SIGN_OUT: "Successfully signed out",
  PASSWORD_RESET: "Password reset email sent",
  PROFILE_UPDATED: "Profile updated successfully",
  EMAIL_CONFIRMED: "Email confirmed successfully",
};

// Configuration validator
class SupabaseConfigValidator {
  static validate() {
    const errors = [];

    if (
      !SUPABASE_CONFIG.url ||
      SUPABASE_CONFIG.url.includes("your-project-ref")
    ) {
      errors.push(
        "Please update SUPABASE_CONFIG.url with your actual Supabase URL"
      );
    }

    if (errors.length > 0) {
      console.warn("⚠️ Supabase Configuration Issues:", errors);
      return false;
    }

    console.log("✅ Supabase configuration is valid");
    return true;
  }

  static getConfig() {
    if (this.validate()) {
      return SUPABASE_CONFIG;
    }
    throw new Error("Invalid Supabase configuration");
  }
}

// Utility functions
const SupabaseUtils = {
  /**
   * Check if user has specific permission
   */
  hasPermission(user, permission) {
    const userRole = user?.user_metadata?.role || ADMIN_ROLES.VIEWER;
    const permissions = ROLE_PERMISSIONS[userRole] || [];
    return permissions.includes(permission);
  },

  /**
   * Get user role display name
   */
  getRoleDisplayName(role) {
    const displayNames = {
      [ADMIN_ROLES.SUPER_ADMIN]: "Super Administrator",
      [ADMIN_ROLES.ADMIN]: "Administrator",
      [ADMIN_ROLES.EDITOR]: "Editor",
      [ADMIN_ROLES.VIEWER]: "Viewer",
    };
    return displayNames[role] || "Unknown Role";
  },

  /**
   * Get user initials
   */
  getUserInitials(user) {
    const name = user?.user_metadata?.full_name || user?.email || "User";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  },

  /**
   * Format user display name
   */
  getDisplayName(user) {
    return (
      user?.user_metadata?.full_name ||
      user?.email?.split("@")[0] ||
      "Unknown User"
    );
  },

  /**
   * Check if email is valid
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Check if password is strong
   */
  isStrongPassword(password) {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password)
    );
  },

  /**
   * Generate secure random string
   */
  generateSecureRandom(length = 32) {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
};

// Export configuration
if (typeof window !== "undefined") {
  window.SUPABASE_CONFIG = SUPABASE_CONFIG;
  window.ADMIN_ROLES = ADMIN_ROLES;
  window.ROLE_PERMISSIONS = ROLE_PERMISSIONS;
  window.DATABASE_TABLES = DATABASE_TABLES;
  window.AUTH_PROVIDERS = AUTH_PROVIDERS;
  window.AUTH_ERRORS = AUTH_ERRORS;
  window.AUTH_SUCCESS = AUTH_SUCCESS;
  window.SupabaseConfigValidator = SupabaseConfigValidator;
  window.SupabaseUtils = SupabaseUtils;
}

// Export for modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    SUPABASE_CONFIG,
    ADMIN_ROLES,
    ROLE_PERMISSIONS,
    DATABASE_TABLES,
    AUTH_PROVIDERS,
    AUTH_ERRORS,
    AUTH_SUCCESS,
    SupabaseConfigValidator,
    SupabaseUtils,
  };
}
