/**
 * Temporary hardcoded anon key fallback
 * Use this if Edge Function is not working
 */

// Add this to any page that needs anon key
window.FALLBACK_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpYXhyc2l5Y3N3cnd1Y3RoaWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDA2NDY3NjQsImV4cCI6MjAxNjIyMjc2NH0.bJhkUrUvKhQmNabgp8rqYYNKqglLpykUJ5wOhJHyqhE";

// Override SupabaseKeyManager to use fallback
if (window.SupabaseKeyManager) {
  const originalGetAnonKey = window.SupabaseKeyManager.prototype.getAnonKey;
  
  window.SupabaseKeyManager.prototype.getAnonKey = async function() {
    try {
      return await originalGetAnonKey.call(this);
    } catch (error) {
      console.warn("🔄 Using fallback anon key due to error:", error.message);
      return window.FALLBACK_ANON_KEY;
    }
  };
}

console.log("🔑 Fallback anon key system activated");