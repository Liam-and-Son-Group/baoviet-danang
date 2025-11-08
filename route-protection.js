/**
 * Route Protection System
 * Protect admin routes with Supabase Authentication
 */

class RouteProtection {
  constructor() {
    this.authManager = null;
    this.protectedRoutes = ["/admin-dashboard.html", "/admin", "/dashboard"];
    this.publicRoutes = ["/", "/index.html", "/login.html"];

    this.init();
  }

  /**
   * Initialize route protection
   */
  async init() {
    try {
      // Wait for auth manager
      await this.waitForAuthManager();

      // Check current route
      await this.checkCurrentRoute();

      // Setup navigation protection
      this.setupNavigationProtection();

      console.log("🛡️ Route protection initialized");
    } catch (error) {
      console.error("Failed to initialize route protection:", error);
    }
  }

  /**
   * Wait for auth manager to be available
   */
  async waitForAuthManager() {
    let attempts = 0;
    const maxAttempts = 50;

    while (!window.supabaseAuth && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }

    if (window.supabaseAuth) {
      this.authManager = window.supabaseAuth;
    } else {
      throw new Error("Auth manager not available");
    }
  }

  /**
   * Check if current route requires protection
   */
  async checkCurrentRoute() {
    const currentPath = window.location.pathname;
    const isProtectedRoute = this.isProtectedRoute(currentPath);

    if (isProtectedRoute) {
      console.log("🔒 Protected route detected:", currentPath);
      await this.enforceAuthentication();
    } else {
      console.log("🌍 Public route:", currentPath);
    }
  }

  /**
   * Check if route is protected
   */
  isProtectedRoute(path) {
    return this.protectedRoutes.some(
      (route) => path.includes(route) || path.endsWith(route)
    );
  }

  /**
   * Check if route is public
   */
  isPublicRoute(path) {
    return this.publicRoutes.some(
      (route) => path === route || path.endsWith(route)
    );
  }

  /**
   * Enforce authentication for protected routes
   */
  async enforceAuthentication() {
    try {
      // Check if user is authenticated
      const isAuthenticated = this.authManager.isAuthenticated();

      if (!isAuthenticated) {
        console.log("🚫 Access denied - authentication required");
        this.showAuthenticationRequired();
        return false;
      }

      // Check if user has admin role
      const isAdmin = this.authManager.isAdmin();

      if (!isAdmin) {
        console.log("🚫 Access denied - admin role required");
        this.showInsufficientPermissions();
        return false;
      }

      console.log("✅ Authentication verified");
      return true;
    } catch (error) {
      console.error("Authentication check failed:", error);
      this.showAuthenticationError();
      return false;
    }
  }

  /**
   * Show authentication required modal
   */
  showAuthenticationRequired() {
    // Hide main content
    this.hideMainContent();

    // Show auth required message
    const authRequiredHTML = `
      <div id="auth-required-overlay" class="route-protection-overlay">
        <div class="protection-card">
          <div class="protection-icon">🔐</div>
          <h2>Authentication Required</h2>
          <p>You need to sign in to access the Admin Dashboard.</p>
          <div class="protection-actions">
            <button class="btn btn-primary" onclick="routeProtection.showLogin()">
              🔑 Sign In
            </button>
            <button class="btn btn-secondary" onclick="routeProtection.goHome()">
              🏠 Back to Home
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", authRequiredHTML);
  }

  /**
   * Show insufficient permissions modal
   */
  showInsufficientPermissions() {
    this.hideMainContent();

    const insufficientPermHTML = `
      <div id="insufficient-perm-overlay" class="route-protection-overlay">
        <div class="protection-card">
          <div class="protection-icon">⛔</div>
          <h2>Access Denied</h2>
          <p>You don't have administrator privileges to access this page.</p>
          <div class="protection-actions">
            <button class="btn btn-secondary" onclick="routeProtection.signOut()">
              👋 Sign Out
            </button>
            <button class="btn btn-secondary" onclick="routeProtection.goHome()">
              🏠 Back to Home
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", insufficientPermHTML);
  }

  /**
   * Show authentication error
   */
  showAuthenticationError() {
    this.hideMainContent();

    const authErrorHTML = `
      <div id="auth-error-overlay" class="route-protection-overlay">
        <div class="protection-card">
          <div class="protection-icon">⚠️</div>
          <h2>Authentication Error</h2>
          <p>There was a problem verifying your authentication. Please try again.</p>
          <div class="protection-actions">
            <button class="btn btn-primary" onclick="location.reload()">
              🔄 Retry
            </button>
            <button class="btn btn-secondary" onclick="routeProtection.goHome()">
              🏠 Back to Home
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", authErrorHTML);
  }

  /**
   * Hide main content
   */
  hideMainContent() {
    const mainElements = [
      ".dashboard-container",
      "main",
      ".admin-content",
      "#app",
    ];

    mainElements.forEach((selector) => {
      const element = document.querySelector(selector);
      if (element) {
        element.style.display = "none";
      }
    });
  }

  /**
   * Show main content
   */
  showMainContent() {
    const mainElements = [
      ".dashboard-container",
      "main",
      ".admin-content",
      "#app",
    ];

    mainElements.forEach((selector) => {
      const element = document.querySelector(selector);
      if (element) {
        element.style.display = "";
      }
    });

    // Remove protection overlays
    this.removeProtectionOverlays();
  }

  /**
   * Remove protection overlays
   */
  removeProtectionOverlays() {
    const overlays = [
      "#auth-required-overlay",
      "#insufficient-perm-overlay",
      "#auth-error-overlay",
    ];

    overlays.forEach((selector) => {
      const overlay = document.querySelector(selector);
      if (overlay) {
        overlay.remove();
      }
    });
  }

  /**
   * Setup navigation protection
   */
  setupNavigationProtection() {
    // Listen for auth state changes
    this.authManager.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        this.onUserSignIn(session);
      } else if (event === "SIGNED_OUT") {
        this.onUserSignOut();
      }
    });

    // Intercept navigation attempts
    window.addEventListener("beforeunload", (event) => {
      // Could add unsaved changes warning here
    });
  }

  /**
   * Handle user sign in
   */
  onUserSignIn(session) {
    console.log("✅ User signed in, checking route access...");

    const currentPath = window.location.pathname;
    if (this.isProtectedRoute(currentPath)) {
      // Re-check authentication for current route
      this.enforceAuthentication().then((hasAccess) => {
        if (hasAccess) {
          this.showMainContent();
        }
      });
    }
  }

  /**
   * Handle user sign out
   */
  onUserSignOut() {
    console.log("👋 User signed out");

    const currentPath = window.location.pathname;
    if (this.isProtectedRoute(currentPath)) {
      // Redirect to home or show auth required
      this.showAuthenticationRequired();
    }
  }

  /**
   * Show login modal
   */
  showLogin() {
    if (window.authUI) {
      window.authUI.showAuthModal("signin");
    } else {
      console.error("Auth UI not available");
    }
  }

  /**
   * Sign out user
   */
  async signOut() {
    try {
      await this.authManager.signOut();
      this.goHome();
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  }

  /**
   * Navigate to home page
   */
  goHome() {
    window.location.href = "/";
  }

  /**
   * Check if user can access route
   */
  async canAccessRoute(path) {
    if (this.isPublicRoute(path)) {
      return true;
    }

    if (this.isProtectedRoute(path)) {
      const isAuthenticated = this.authManager.isAuthenticated();
      const isAdmin = this.authManager.isAdmin();

      return isAuthenticated && isAdmin;
    }

    return true; // Default allow for unspecified routes
  }

  /**
   * Navigate to route with protection check
   */
  async navigateTo(path) {
    const canAccess = await this.canAccessRoute(path);

    if (canAccess) {
      window.location.href = path;
    } else {
      console.log("🚫 Navigation blocked - insufficient permissions");
      this.showAuthenticationRequired();
    }
  }

  /**
   * Add protected route
   */
  addProtectedRoute(route) {
    if (!this.protectedRoutes.includes(route)) {
      this.protectedRoutes.push(route);
      console.log("🔒 Added protected route:", route);
    }
  }

  /**
   * Remove protected route
   */
  removeProtectedRoute(route) {
    const index = this.protectedRoutes.indexOf(route);
    if (index > -1) {
      this.protectedRoutes.splice(index, 1);
      console.log("🔓 Removed protected route:", route);
    }
  }

  /**
   * Get protection styles
   */
  createProtectionStyles() {
    const styles = document.createElement("style");
    styles.id = "route-protection-styles";
    styles.textContent = `
      .route-protection-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        animation: fadeIn 0.5s ease-out;
      }

      .protection-card {
        background: white;
        padding: 3rem 2rem;
        border-radius: 16px;
        text-align: center;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
        animation: slideUp 0.5s ease-out;
      }

      .protection-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
      }

      .protection-card h2 {
        color: #1a202c;
        margin-bottom: 1rem;
        font-size: 1.8rem;
      }

      .protection-card p {
        color: #64748b;
        margin-bottom: 2rem;
        line-height: 1.6;
      }

      .protection-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
      }

      .protection-actions .btn {
        padding: 0.875rem 1.5rem;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
      }

      .btn-primary {
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: white;
      }

      .btn-primary:hover {
        background: linear-gradient(135deg, #2563eb, #1e40af);
        transform: translateY(-1px);
      }

      .btn-secondary {
        background: #f8fafc;
        color: #374151;
        border: 2px solid #e2e8f0;
      }

      .btn-secondary:hover {
        background: #f1f5f9;
        border-color: #d1d5db;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes slideUp {
        from {
          transform: translateY(30px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      @media (max-width: 640px) {
        .protection-card {
          padding: 2rem 1.5rem;
        }

        .protection-actions {
          flex-direction: column;
        }

        .protection-actions .btn {
          width: 100%;
          justify-content: center;
        }
      }
    `;

    document.head.appendChild(styles);
  }
}

// Initialize route protection
let routeProtection = null;

document.addEventListener("DOMContentLoaded", async function () {
  try {
    routeProtection = new RouteProtection();
    routeProtection.createProtectionStyles();

    // Make globally available
    window.routeProtection = routeProtection;
    window.RouteProtection = RouteProtection;
  } catch (error) {
    console.error("Failed to initialize route protection:", error);
  }
});

// Export for modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = RouteProtection;
}
