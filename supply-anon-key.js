/**
 * Anon Key Supply Utility
 * Script tiện ích để supply và test anon key
 */

// =====================================================
// Instructions:
// 1. Get anon key from Supabase Dashboard
// 2. Paste it into SUPPLY_ANON_KEY below
// 3. Run this script in browser console or include in HTML
// =====================================================

const SUPPLY_ANON_KEY = "PASTE_YOUR_ANON_KEY_HERE";

// Initialize key manager
const keyManager = new (window.SupabaseKeyManager || SupabaseKeyManager)();

// Supply key utility
async function supplyAndTestKey(anonKey = SUPPLY_ANON_KEY) {
  console.log("🔑 Starting anon key supply process...");

  try {
    // Step 1: Validate key format
    console.log("1️⃣ Validating key format...");
    if (!anonKey || anonKey === "PASTE_YOUR_ANON_KEY_HERE") {
      throw new Error("Please update SUPPLY_ANON_KEY with your real anon key");
    }

    // Step 2: Supply the key
    console.log("2️⃣ Supplying key to cache...");
    const supplyResult = keyManager.supplyAnonKey(anonKey);
    console.log("✅ Supply result:", supplyResult);

    // Step 3: Test the key
    console.log("3️⃣ Testing key validity...");
    const validationResult = await keyManager.validateAnonKey(anonKey);
    console.log("🧪 Validation result:", validationResult);

    if (!validationResult.valid) {
      console.error("❌ Key validation failed:", validationResult.error);
      return {
        success: false,
        error: "Key validation failed",
        details: validationResult,
      };
    }

    // Step 4: Test retrieval
    console.log("4️⃣ Testing key retrieval...");
    const retrievedKey = await keyManager.getAnonKey();
    const keyMatches = retrievedKey === anonKey;
    console.log("🔄 Key retrieval:", keyMatches ? "SUCCESS" : "MISMATCH");

    // Step 5: Show cache info
    console.log("5️⃣ Cache information:");
    const cacheInfo = keyManager.getCacheInfo();
    console.log("📦 Cache info:", cacheInfo);

    // Final result
    const result = {
      success: true,
      message: "Anon key supplied and validated successfully",
      key: anonKey.substring(0, 50) + "...",
      validation: validationResult,
      cache_info: cacheInfo,
      supplied_at: new Date().toISOString(),
    };

    console.log("🎉 SUCCESS:", result);
    return result;
  } catch (error) {
    console.error("❌ FAILED:", error);
    return {
      success: false,
      error: error.message,
      failed_at: new Date().toISOString(),
    };
  }
}

// Quick supply functions for different scenarios
window.SupplyKeyUtils = {
  // Supply key and save for 1 hour (short term)
  supplyShortTerm: (key) => {
    const manager = new (window.SupabaseKeyManager || SupabaseKeyManager)({
      cacheExpiry: 60 * 60 * 1000, // 1 hour
    });
    return manager.supplyAnonKey(key);
  },

  // Supply key and save for 24 hours (long term)
  supplyLongTerm: (key) => {
    const manager = new (window.SupabaseKeyManager || SupabaseKeyManager)();
    return manager.setLongLivedKey(key, 24);
  },

  // Supply key permanently (until manually cleared)
  supplyPermanent: (key) => {
    const manager = new (window.SupabaseKeyManager || SupabaseKeyManager)({
      cacheExpiry: 365 * 24 * 60 * 60 * 1000, // 1 year
    });
    return manager.supplyAnonKey(key);
  },

  // Quick test current key
  testCurrentKey: async () => {
    const manager = new (window.SupabaseKeyManager || SupabaseKeyManager)();
    return await manager.validateAnonKey();
  },

  // Show all available keys
  showAllKeys: () => {
    const manager = new (window.SupabaseKeyManager || SupabaseKeyManager)();
    return manager.getAllKeys();
  },

  // Clear all keys
  clearAll: () => {
    const manager = new (window.SupabaseKeyManager || SupabaseKeyManager)();
    manager.clearCache();
    console.log("🧹 All keys cleared");
  },
};

// Auto-run if key is provided
if (SUPPLY_ANON_KEY !== "PASTE_YOUR_ANON_KEY_HERE") {
  console.log("🚀 Auto-running key supply...");
  supplyAndTestKey().then((result) => {
    if (result.success) {
      console.log("✅ Anon key is ready to use!");

      // Show usage examples
      console.log("\n📖 Usage examples:");
      console.log("🔑 Get key: await keyManager.getAnonKey()");
      console.log("🧪 Test key: await SupplyKeyUtils.testCurrentKey()");
      console.log("📦 Cache info: keyManager.getCacheInfo()");
      console.log("🧹 Clear cache: SupplyKeyUtils.clearAll()");
    }
  });
} else {
  console.log("ℹ️ Please update SUPPLY_ANON_KEY to use this utility");
  console.log("📖 Available utilities:", Object.keys(window.SupplyKeyUtils));
}

// Make the supply function globally available
window.supplyAndTestKey = supplyAndTestKey;

console.log("🔧 Anon Key Supply Utility loaded");
