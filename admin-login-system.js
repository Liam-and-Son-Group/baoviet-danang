/**
 * Admin Login Integration
 * Tích hợp login và key management với admin dashboard
 */

class AdminLoginSystem {
  constructor() {
    this.adminKeyManager = new AdminKeyManager();
    this.loginModalId = "admin-login-modal";
    this.init();
  }

  /**
   * Initialize login system
   */
  init() {
    // Check if already logged in
    if (this.adminKeyManager.isLoggedIn()) {
      console.log("✅ Admin already logged in");
      this.onLoginSuccess();
    } else {
      console.log("🔐 Admin not logged in, showing login form");
      this.showLoginModal();
    }

    // Setup logout handler
    this.setupLogoutHandler();
  }

  /**
   * Create and show login modal
   */
  showLoginModal() {
    // Remove existing modal if any
    const existingModal = document.getElementById(this.loginModalId);
    if (existingModal) {
      existingModal.remove();
    }

    // Create modal HTML
    const modalHTML = `
      <div id="${this.loginModalId}" class="admin-login-modal">
        <div class="login-modal-backdrop"></div>
        <div class="login-modal-content">
          <div class="login-header">
            <h2>🔐 Admin Login</h2>
            <p>Đăng nhập để truy cập Admin Dashboard</p>
          </div>

          <div class="login-tabs">
            <button class="login-tab active" onclick="adminLogin.switchTab('credentials')">
              👤 Username/Password
            </button>
            <button class="login-tab" onclick="adminLogin.switchTab('adminkey')">
              🔑 Admin Key
            </button>
          </div>

          <form id="admin-login-form" class="login-form">
            <!-- Credentials Tab -->
            <div id="credentials-tab" class="login-tab-content active">
              <div class="login-field">
                <label for="username">Username:</label>
                <input type="text" id="username" name="username" required placeholder="Enter username">
              </div>
              <div class="login-field">
                <label for="password">Password:</label>
                <input type="password" id="password" name="password" required placeholder="Enter password">
              </div>
            </div>

            <!-- Admin Key Tab -->
            <div id="adminkey-tab" class="login-tab-content">
              <div class="login-field">
                <label for="adminKey">Admin Key:</label>
                <textarea id="adminKey" name="adminKey" placeholder="Paste admin key here..." rows="4"></textarea>
              </div>
            </div>

            <div class="login-actions">
              <button type="submit" class="btn btn-primary login-btn">
                🚀 Login & Initialize Keys
              </button>
            </div>

            <div id="login-status" class="login-status"></div>
          </form>

          <div class="login-help">
            <h4>💡 Help:</h4>
            <ul>
              <li><strong>Username/Password:</strong> Use your admin credentials</li>
              <li><strong>Admin Key:</strong> Use the admin key from Supabase or system admin</li>
              <li><strong>🎉 No Manual Setup:</strong> Anon key tự động lấy từ Edge Function</li>
              <li>All keys will be automatically fetched and cached after login</li>
            </ul>
          </div>
        </div>
      </div>
    `;

    // Add modal to page
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    // Add styles
    this.addLoginStyles();

    // Setup form handler
    this.setupLoginForm();

    // Prevent closing modal by clicking outside
    document
      .getElementById(this.loginModalId)
      .addEventListener("click", (e) => {
        if (e.target.classList.contains("login-modal-backdrop")) {
          // Don't allow closing without login
          this.showLoginStatus("⚠️ Please login to continue", "warning");
        }
      });
  }

  /**
   * Add login modal styles
   */
  addLoginStyles() {
    const styles = `
      <style id="admin-login-styles">
        .admin-login-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .login-modal-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
        }

        .login-modal-content {
          position: relative;
          background: white;
          border-radius: 15px;
          padding: 2rem;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .login-header h2 {
          margin: 0 0 0.5rem 0;
          color: #1f2937;
          font-size: 1.8rem;
        }

        .login-header p {
          margin: 0;
          color: #64748b;
          font-size: 1rem;
        }

        .login-tabs {
          display: flex;
          margin-bottom: 1.5rem;
          border-bottom: 2px solid #e2e8f0;
        }

        .login-tab {
          flex: 1;
          padding: 0.75rem 1rem;
          border: none;
          background: none;
          font-size: 0.9rem;
          font-weight: 500;
          color: #64748b;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s ease;
        }

        .login-tab.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
        }

        .login-tab:hover {
          color: #3b82f6;
        }

        .login-tab-content {
          display: none;
        }

        .login-tab-content.active {
          display: block;
        }

        .login-field {
          margin-bottom: 1.5rem;
        }

        .login-field label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #374151;
        }

        .login-field input,
        .login-field textarea {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s ease;
          box-sizing: border-box;
        }

        .login-field input:focus,
        .login-field textarea:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .login-actions {
          margin: 2rem 0 1rem 0;
        }

        .login-btn {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .login-btn:hover {
          background: linear-gradient(135deg, #2563eb, #1e40af);
          transform: translateY(-1px);
        }

        .login-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .login-status {
          margin-top: 1rem;
          padding: 0.75rem;
          border-radius: 6px;
          font-size: 0.9rem;
          display: none;
        }

        .login-status.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
          display: block;
        }

        .login-status.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
          display: block;
        }

        .login-status.warning {
          background: #fff3cd;
          color: #856404;
          border: 1px solid #ffeaa7;
          display: block;
        }

        .login-status.info {
          background: #d1ecf1;
          color: #0c5460;
          border: 1px solid #bee5eb;
          display: block;
        }

        .login-help {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e2e8f0;
        }

        .login-help h4 {
          margin: 0 0 1rem 0;
          color: #374151;
          font-size: 1rem;
        }

        .login-help ul {
          margin: 0;
          padding-left: 1.5rem;
          color: #64748b;
          font-size: 0.9rem;
          line-height: 1.6;
        }

        .login-help li {
          margin-bottom: 0.5rem;
        }
      </style>
    `;

    document.head.insertAdjacentHTML("beforeend", styles);
  }

  /**
   * Setup login form submission
   */
  setupLoginForm() {
    const form = document.getElementById("admin-login-form");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.handleLogin();
    });
  }

  /**
   * Handle login form submission
   */
  async handleLogin() {
    try {
      this.showLoginStatus("🔄 Logging in...", "info");
      this.setLoginButtonState(true, "🔄 Logging in...");

      // Get form data
      const formData = new FormData(
        document.getElementById("admin-login-form")
      );
      const credentials = {};

      // Check which tab is active
      const activeTab = document.querySelector(".login-tab-content.active").id;

      if (activeTab === "credentials-tab") {
        credentials.username = formData.get("username");
        credentials.password = formData.get("password");
      } else {
        credentials.adminKey = formData.get("adminKey");
      }

      // Attempt login
      const result = await this.adminKeyManager.loginAdmin(credentials);

      if (result.success) {
        this.showLoginStatus(
          "✅ Login successful! Initializing dashboard...",
          "success"
        );

        // Wait a bit for user to see success message
        setTimeout(() => {
          this.onLoginSuccess();
          this.hideLoginModal();
        }, 2000);
      } else {
        this.showLoginStatus(`❌ Login failed: ${result.error}`, "error");
        this.setLoginButtonState(false);
      }
    } catch (error) {
      console.error("Login error:", error);
      this.showLoginStatus(`❌ Login error: ${error.message}`, "error");
      this.setLoginButtonState(false);
    }
  }

  /**
   * Switch between login tabs
   */
  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll(".login-tab").forEach((tab) => {
      tab.classList.remove("active");
    });
    event.target.classList.add("active");

    // Update tab content
    document.querySelectorAll(".login-tab-content").forEach((content) => {
      content.classList.remove("active");
    });
    document.getElementById(`${tabName}-tab`).classList.add("active");
  }

  /**
   * Show login status message
   */
  showLoginStatus(message, type = "info") {
    const statusDiv = document.getElementById("login-status");
    statusDiv.textContent = message;
    statusDiv.className = `login-status ${type}`;
  }

  /**
   * Set login button state
   */
  setLoginButtonState(disabled = false, text = "🚀 Login & Initialize Keys") {
    const button = document.querySelector(".login-btn");
    button.disabled = disabled;
    button.textContent = text;
  }

  /**
   * Hide login modal
   */
  hideLoginModal() {
    const modal = document.getElementById(this.loginModalId);
    const styles = document.getElementById("admin-login-styles");

    if (modal) modal.remove();
    if (styles) styles.remove();
  }

  /**
   * Setup logout handler
   */
  setupLogoutHandler() {
    // Create logout button if not exists
    this.createLogoutButton();

    // Listen for logout events
    document.addEventListener("admin-logout", () => {
      this.adminKeyManager.logout();
      location.reload(); // Reload page after logout
    });
  }

  /**
   * Create logout button in header
   */
  createLogoutButton() {
    // Try to find existing header or navigation
    const header =
      document.querySelector("header") ||
      document.querySelector(".header") ||
      document.querySelector("nav") ||
      document.querySelector(".nav");

    if (header) {
      const logoutBtn = document.createElement("button");
      logoutBtn.innerHTML = "👋 Logout";
      logoutBtn.className = "btn btn-outline admin-logout-btn";
      logoutBtn.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid #ddd;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        cursor: pointer;
      `;

      logoutBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to logout?")) {
          document.dispatchEvent(new CustomEvent("admin-logout"));
        }
      });

      document.body.appendChild(logoutBtn);
    }
  }

  /**
   * Handle successful login
   */
  onLoginSuccess() {
    console.log("✅ Login successful, initializing dashboard...");

    // Enable all dashboard features
    this.enableDashboardFeatures();

    // Show admin info
    this.showAdminInfo();

    // Initialize analytics if available
    this.initializeAnalytics();

    // Dispatch login success event
    document.dispatchEvent(
      new CustomEvent("admin-login-success", {
        detail: this.adminKeyManager.getAdminInfo(),
      })
    );
  }

  /**
   * Enable dashboard features after login
   */
  enableDashboardFeatures() {
    // Remove any disabled states from dashboard elements
    document.querySelectorAll(".admin-feature[disabled]").forEach((element) => {
      element.removeAttribute("disabled");
    });

    // Show admin-only sections
    document.querySelectorAll(".admin-only").forEach((element) => {
      element.style.display = "block";
    });

    console.log("✅ Dashboard features enabled");
  }

  /**
   * Show admin info in console
   */
  showAdminInfo() {
    const adminInfo = this.adminKeyManager.getAdminInfo();
    console.log("👤 Admin Info:", adminInfo);

    // Show notification to user
    if (typeof showNotification === "function") {
      showNotification("✅ Admin dashboard ready!", "success");
    }
  }

  /**
   * Initialize analytics with admin keys
   */
  async initializeAnalytics() {
    try {
      const analyticsKey = await this.adminKeyManager.getKey("analytics_key");

      if (analyticsKey && window.userAnalytics) {
        // Update analytics with admin key
        window.userAnalytics.updateAuthKey(analyticsKey);
        console.log("📊 Analytics initialized with admin key");
      }
    } catch (error) {
      console.warn("⚠️ Could not initialize analytics:", error);
    }
  }

  /**
   * Get admin key for use in dashboard
   */
  async getAdminKey(keyType = "anon_key") {
    return await this.adminKeyManager.getKey(keyType);
  }
}

// Initialize admin login system
let adminLogin;
document.addEventListener("DOMContentLoaded", function () {
  adminLogin = new AdminLoginSystem();

  // Make it globally available
  window.adminLogin = adminLogin;
  window.AdminLoginSystem = AdminLoginSystem;
});

// Export for modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = AdminLoginSystem;
}
