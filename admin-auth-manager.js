/**
 * Admin Authentication Manager
 * Quản lý authentication cho Admin Dashboard
 * Khác với guest - Admin sử dụng token authentication thay vì anon key
 */

class AdminAuthManager {
  constructor() {
    this.supabase = null;
    this.currentUser = null;
    this.accessToken = null;
    this.isInitialized = false;
    this.loginModal = null;
    this.keyManager = null;
  }

  /**
   * Khởi tạo Admin Authentication
   */
  async initialize() {
    try {
      // Khởi tạo Supabase client
      if (
        typeof window !== "undefined" &&
        window.supabase &&
        window.SUPABASE_CONFIG
      ) {
        // Tự động lấy anon key nếu chưa có
        if (!window.SUPABASE_CONFIG.anonKey) {
          if (window.SupabaseKeyManager) {
            this.keyManager = new window.SupabaseKeyManager({
              baseUrl: window.SUPABASE_CONFIG.url,
            });
            const anonKey = await this.keyManager.getAnonKey();
            window.SUPABASE_CONFIG.anonKey = anonKey;
          } else {
            throw new Error("Supabase anon key chưa được cấu hình");
          }
        }

        this.supabase = window.supabase.createClient(
          window.SUPABASE_CONFIG.url,
          window.SUPABASE_CONFIG.anonKey
        );
      } else {
        throw new Error("Supabase client hoặc config chưa được load");
      }

      // Tạo login modal
      this.createLoginModal();

      // Kiểm tra session hiện tại
      await this.checkCurrentSession();

      this.isInitialized = true;
      console.log("✅ Admin Auth Manager initialized");
    } catch (error) {
      console.error("❌ Admin Auth initialization failed:", error);
      // Even if initialization fails, create modal so user can try to login
      if (!this.loginModal) {
        this.createLoginModal();
      }
      // Don't throw - allow modal to show for user to attempt login
      console.warn("⚠️ Continuing with limited functionality - login modal available");
    }
  }

  /**
   * Kiểm tra session hiện tại
   */
  async checkCurrentSession() {
    try {
      const {
        data: { session },
        error,
      } = await this.supabase.auth.getSession();

      if (error) throw error;

      if (session) {
        this.currentUser = session.user;
        this.accessToken = session.access_token;
        console.log("✅ Tìm thấy session:", this.currentUser.email);
        return true;
      } else {
        console.log("ℹ️ Không có session nào");
        return false;
      }
    } catch (error) {
      console.error("❌ Lỗi kiểm tra session:", error);
      return false;
    }
  }

  /**
   * Tạo modal đăng nhập
   */
  createLoginModal() {
    // Tạo modal HTML
    const modalHTML = `
      <div id="adminLoginModal" class="admin-modal-overlay" style="display: none;">
        <div class="admin-modal">
          <div class="admin-modal-header">
            <h2>🔐 Admin Login</h2>
            <p>Đăng nhập để truy cập Dashboard</p>
          </div>
          
          <div class="admin-modal-body">
            <div id="loginMessage" class="admin-message" style="display: none;"></div>
            
            <form id="adminLoginForm">
              <div class="admin-form-group">
                <label for="adminEmail">Email</label>
                <input type="email" id="adminEmail" placeholder="admin@baoviet-dn.com" required>
              </div>
              
              <div class="admin-form-group">
                <label for="adminPassword">Mật khẩu</label>
                <input type="password" id="adminPassword" placeholder="Nhập mật khẩu" required>
              </div>
              
              <button type="submit" id="adminLoginBtn" class="admin-btn-primary">
                Đăng nhập
              </button>
            </form>
          </div>
        </div>
      </div>
    `;

    // Thêm styles
    const styles = `
      <style id="adminAuthStyles">
        .admin-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }

        .admin-modal {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          width: 100%;
          max-width: 400px;
          margin: 1rem;
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .admin-modal-header {
          padding: 1.5rem 1.5rem 1rem;
          text-align: center;
          border-bottom: 1px solid #e2e8f0;
        }

        .admin-modal-header h2 {
          color: #1a202c;
          margin-bottom: 0.5rem;
          font-size: 1.5rem;
        }

        .admin-modal-header p {
          color: #718096;
          font-size: 0.9rem;
        }

        .admin-modal-body {
          padding: 1.5rem;
        }

        .admin-form-group {
          margin-bottom: 1rem;
        }

        .admin-form-group label {
          display: block;
          margin-bottom: 0.5rem;
          color: #374151;
          font-weight: 500;
          font-size: 0.9rem;
        }

        .admin-form-group input {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .admin-form-group input:focus {
          outline: none;
          border-color: #0060ae;
          box-shadow: 0 0 0 3px rgba(0, 96, 174, 0.1);
        }

        .admin-btn-primary {
          width: 100%;
          background: linear-gradient(135deg, #0060ae 0%, #0087d2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0.75rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 0.5rem;
        }

        .admin-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 96, 174, 0.3);
        }

        .admin-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .admin-btn-primary.loading {
          position: relative;
          color: transparent;
        }

        .admin-btn-primary.loading::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(0deg);
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }

        .admin-message {
          padding: 0.75rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }

        .admin-message.success {
          background: #f0fff4;
          color: #22543d;
          border: 1px solid #c6f6d5;
        }

        .admin-message.error {
          background: #fff5f5;
          color: #742a2a;
          border: 1px solid #fed7d7;
        }

        .admin-message.info {
          background: #ebf8ff;
          color: #2c5282;
          border: 1px solid #bee3f8;
        }
      </style>
    `;

    // Thêm vào DOM
    document.head.insertAdjacentHTML("beforeend", styles);
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    // Lưu reference
    this.loginModal = document.getElementById("adminLoginModal");

    // Bind events
    this.bindModalEvents();
  }

  /**
   * Bind events cho modal
   */
  bindModalEvents() {
    const form = document.getElementById("adminLoginForm");
    const modal = this.loginModal;

    // Submit form
    form.addEventListener("submit", (e) => this.handleLogin(e));

    // ESC key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.style.display !== "none") {
        this.hideLoginModal();
      }
    });
  }

  /**
   * Hiển thị modal đăng nhập
   */
  showLoginModal() {
    // Ensure modal exists
    if (!this.loginModal) {
      console.warn("⚠️ Login modal not created, creating now...");
      this.createLoginModal();
    }
    
    if (this.loginModal) {
      this.loginModal.style.display = "flex";
      const emailInput = document.getElementById("adminEmail");
      if (emailInput) {
        emailInput.focus();
      }
      console.log("🔐 Login modal displayed");
    } else {
      console.error("❌ Failed to create login modal");
    }
  }

  /**
   * Ẩn modal đăng nhập
   */
  hideLoginModal() {
    if (this.loginModal) {
      this.loginModal.style.display = "none";
      this.clearLoginForm();
    }
  }

  /**
   * Xóa form đăng nhập
   */
  clearLoginForm() {
    document.getElementById("adminEmail").value = "";
    document.getElementById("adminPassword").value = "";
    this.hideMessage();
  }

  /**
   * Xử lý đăng nhập
   */
  async handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value;
    const button = document.getElementById("adminLoginBtn");

    // Validation
    if (!email || !password) {
      this.showMessage("Vui lòng nhập đầy đủ thông tin!", "error");
      return;
    }

    // Set loading
    this.setButtonLoading(button, true);

    try {
      // Đăng nhập với Supabase
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;

      // Lưu thông tin user và token
      this.currentUser = data.user;
      this.accessToken = data.session.access_token;

      this.showMessage("Đăng nhập thành công!", "success");

      // Đóng modal sau 1s
      setTimeout(() => {
        this.hideLoginModal();
        this.onLoginSuccess();
      }, 1000);
    } catch (error) {
      console.error("❌ Login error:", error);
      this.showMessage("Lỗi đăng nhập: " + error.message, "error");
    } finally {
      this.setButtonLoading(button, false);
    }
  }

  /**
   * Callback khi đăng nhập thành công
   */
  onLoginSuccess() {
    console.log("✅ Admin đăng nhập thành công:", this.currentUser.email);

    // Trigger event cho dashboard
    window.dispatchEvent(
      new CustomEvent("adminLoginSuccess", {
        detail: {
          user: this.currentUser,
          token: this.accessToken,
        },
      })
    );

    // Refresh dashboard nếu cần
    if (typeof window.refreshDashboard === "function") {
      window.refreshDashboard();
    }
  }

  /**
   * Đăng xuất
   */
  async logout() {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;

      this.currentUser = null;
      this.accessToken = null;

      console.log("✅ Đăng xuất thành công");

      // Trigger event
      window.dispatchEvent(new CustomEvent("adminLogout"));

      // Redirect hoặc refresh
      if (typeof window.handleLogout === "function") {
        window.handleLogout();
      }
    } catch (error) {
      console.error("❌ Logout error:", error);
    }
  }

  /**
   * Kiểm tra xem có đăng nhập không
   */
  isAuthenticated() {
    return !!(this.currentUser && this.accessToken);
  }

  /**
   * Lấy access token cho API calls
   */
  getAccessToken() {
    return this.accessToken;
  }

  /**
   * Trả về Supabase client đang sử dụng
   */
  getSupabaseClient() {
    return this.supabase;
  }

  /**
   * Lấy thông tin user hiện tại
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Tạo headers cho API calls với token
   */
  getAuthHeaders() {
    if (!this.accessToken) {
      throw new Error("Chưa đăng nhập hoặc token không hợp lệ");
    }

    return {
      Authorization: `Bearer ${this.accessToken}`,
      apikey: window.SUPABASE_CONFIG.anonKey,
      "Content-Type": "application/json",
    };
  }

  /**
   * Helper functions
   */
  showMessage(message, type) {
    const messageEl = document.getElementById("loginMessage");
    if (messageEl) {
      messageEl.className = `admin-message ${type}`;
      messageEl.textContent = message;
      messageEl.style.display = "block";
    }
  }

  hideMessage() {
    const messageEl = document.getElementById("loginMessage");
    if (messageEl) {
      messageEl.style.display = "none";
    }
  }

  setButtonLoading(button, loading) {
    if (loading) {
      button.disabled = true;
      button.classList.add("loading");
    } else {
      button.disabled = false;
      button.classList.remove("loading");
    }
  }
}

// Export để sử dụng
window.AdminAuthManager = AdminAuthManager;
