/**
 * Admin API Manager
 * Quản lý API calls với authentication cho Admin vs Guest
 */

class AdminAPIManager {
  constructor() {
    this.adminAuth = null;
    this.supabaseClient = null;
    this.isInitialized = false;
  }

  /**
   * Khởi tạo API Manager
   */
  async initialize(adminAuthInstance) {
    try {
      this.adminAuth = adminAuthInstance;

      // Tái sử dụng Supabase client từ AdminAuthManager
      if (
        this.adminAuth &&
        typeof this.adminAuth.getSupabaseClient === "function"
      ) {
        this.supabaseClient = this.adminAuth.getSupabaseClient();
      }

      if (!this.supabaseClient) {
        throw new Error(
          "Supabase client chưa được khởi tạo từ AdminAuthManager"
        );
      }

      this.isInitialized = true;
      console.log("✅ Admin API Manager initialized");
    } catch (error) {
      console.error("❌ Admin API Manager initialization failed:", error);
      throw error;
    }
  }

  /**
   * Kiểm tra xem có phải admin mode không
   */
  isAdminMode() {
    return this.adminAuth && this.adminAuth.isAuthenticated();
  }

  /**
   * Lấy headers cho API calls
   */
  getApiHeaders() {
    const baseHeaders = {
      "Content-Type": "application/json",
    };

    if (this.isAdminMode()) {
      return {
        ...baseHeaders,
        ...this.adminAuth.getAuthHeaders(),
      };
    }

    throw new Error("Yêu cầu đăng nhập Admin để thực hiện API call");
  }

  /**
   * Generic API call với auto auth
   */
  async apiCall(url, options = {}) {
    try {
      const headers = this.getApiHeaders();

      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(
          `API call failed: ${response.status} ${response.statusText}`
        );
      }

      return response;
    } catch (error) {
      console.error("❌ API call failed:", error);
      throw error;
    }
  }

  /**
   * Supabase table operations với auto auth
   */
  async getTableData(tableName, options = {}) {
    try {
      if (!this.isAdminMode()) {
        throw new Error("Truy vấn bảng yêu cầu đăng nhập Admin");
      }

      let query = this.supabaseClient.from(tableName).select("*");

      // Apply filters
      if (options.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending !== false,
        });
      }

      // Apply limit
      if (options.limit) {
        query = query.limit(options.limit);
      }

      // Execute query với appropriate auth
      const { data, error } = await query;

      if (error) throw error;

      return data;
    } catch (error) {
      console.error(`❌ Get table data failed for ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Insert data - chỉ admin
   */
  async insertTableData(tableName, data) {
    if (!this.isAdminMode()) {
      throw new Error("Insert operation chỉ dành cho Admin");
    }

    try {
      const { data: result, error } = await this.supabaseClient
        .from(tableName)
        .insert(data);

      if (error) throw error;

      console.log("✅ Insert successful:", tableName);
      return result;
    } catch (error) {
      console.error(`❌ Insert failed for ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Update data - chỉ admin
   */
  async updateTableData(tableName, id, data) {
    if (!this.isAdminMode()) {
      throw new Error("Update operation chỉ dành cho Admin");
    }

    try {
      const { data: result, error } = await this.supabaseClient
        .from(tableName)
        .update(data)
        .eq("id", id);

      if (error) throw error;

      console.log("✅ Update successful:", tableName, id);
      return result;
    } catch (error) {
      console.error(`❌ Update failed for ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Delete data - chỉ admin
   */
  async deleteTableData(tableName, id) {
    if (!this.isAdminMode()) {
      throw new Error("Delete operation chỉ dành cho Admin");
    }

    try {
      const { error } = await this.supabaseClient
        .from(tableName)
        .delete()
        .eq("id", id);

      if (error) throw error;

      console.log("✅ Delete successful:", tableName, id);
      return true;
    } catch (error) {
      console.error(`❌ Delete failed for ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Execute custom SQL - chỉ admin
   */
  async executeRPC(functionName, params = {}) {
    if (!this.isAdminMode()) {
      throw new Error("RPC execution chỉ dành cho Admin");
    }

    try {
      const { data, error } = await this.supabaseClient.rpc(
        functionName,
        params
      );

      if (error) throw error;

      console.log("✅ RPC executed:", functionName);
      return data;
    } catch (error) {
      console.error(`❌ RPC failed for ${functionName}:`, error);
      throw error;
    }
  }

  /**
   * Get analytics data với phân quyền
   */
  async getAnalyticsData() {
    try {
      if (!this.isAdminMode()) {
        throw new Error("Analytics data chỉ dành cho Admin");
      }

      return await this.getTableData("analytics", {
        orderBy: { column: "created_at", ascending: false },
        limit: 1000,
      });
    } catch (error) {
      console.error("❌ Get analytics failed:", error);
      return [];
    }
  }

  /**
   * Get user data - chỉ admin
   */
  async getUserData() {
    if (!this.isAdminMode()) {
      console.warn("⚠️ User data chỉ dành cho Admin");
      return [];
    }

    try {
      return await this.getTableData("users", {
        orderBy: { column: "last_sign_in_at", ascending: false },
      });
    } catch (error) {
      console.error("❌ Get user data failed:", error);
      return [];
    }
  }

  /**
   * Log admin action
   */
  async logAdminAction(action, details = {}) {
    if (!this.isAdminMode()) return;

    try {
      const user = this.adminAuth.getCurrentUser();
      await this.insertTableData("admin_logs", {
        admin_email: user.email,
        action: action,
        details: details,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Log admin action failed:", error);
    }
  }

  /**
   * Get dashboard stats
   */
  async getDashboardStats() {
    try {
      if (!this.isAdminMode()) {
        throw new Error("Dashboard stats chỉ dành cho Admin");
      }

      const [analytics, users] = await Promise.all([
        this.getAnalyticsData(),
        this.getUserData(),
      ]);

      return {
        totalVisits: analytics.length,
        totalUsers: users.length,
        mode: "admin",
        lastUpdate: new Date().toISOString(),
      };
    } catch (error) {
      console.error("❌ Get dashboard stats failed:", error);
      throw error;
    }
  }
}

// Export
window.AdminAPIManager = AdminAPIManager;
