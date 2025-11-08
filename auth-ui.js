/**
 * Authentication UI Components
 * Complete login/signup interface for Supabase Authentication
 */

class AuthenticationUI {
  constructor() {
    this.authManager = null;
    this.currentModal = null;
    this.isProcessing = false;

    this.init();
  }

  /**
   * Initialize authentication UI
   */
  async init() {
    // Wait for auth manager to be ready
    await this.waitForAuthManager();

    // Setup UI components
    this.createAuthStyles();
    this.setupEventListeners();

    console.log("🎨 Authentication UI initialized");
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
      throw new Error("Supabase Auth Manager not available");
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for auth state changes
    this.authManager.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        this.hideAuthModal();
        this.showWelcomeMessage(session.user);
      } else if (event === "SIGNED_OUT") {
        this.showAuthModal();
      }
    });

    // Setup keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.currentModal) {
        this.hideAuthModal();
      }
    });
  }

  /**
   * Show authentication modal
   */
  showAuthModal(mode = "signin") {
    // Remove existing modal
    this.hideAuthModal();

    const modalHTML = `
      <div id="supabase-auth-modal" class="auth-modal">
        <div class="auth-modal-backdrop" onclick="authUI.hideAuthModal()"></div>
        <div class="auth-modal-content">
          <div class="auth-modal-header">
            <h2 class="auth-modal-title">🔐 Admin Authentication</h2>
            <p class="auth-modal-subtitle">Secure access to Admin Dashboard</p>
            <button class="auth-modal-close" onclick="authUI.hideAuthModal()">×</button>
          </div>

          <div class="auth-tabs">
            <button class="auth-tab ${
              mode === "signin" ? "active" : ""
            }" onclick="authUI.switchAuthMode('signin')">
              🔑 Sign In
            </button>
            <button class="auth-tab ${
              mode === "signup" ? "active" : ""
            }" onclick="authUI.switchAuthMode('signup')">
              📝 Sign Up
            </button>
            <button class="auth-tab ${
              mode === "reset" ? "active" : ""
            }" onclick="authUI.switchAuthMode('reset')">
              🔄 Reset
            </button>
          </div>

          <div class="auth-content">
            <!-- Sign In Form -->
            <div id="signin-form" class="auth-form ${
              mode === "signin" ? "active" : ""
            }">
              <form onsubmit="authUI.handleSignIn(event)">
                <div class="auth-field">
                  <label for="signin-email">Email:</label>
                  <input type="email" id="signin-email" required placeholder="your-email@domain.com">
                </div>
                <div class="auth-field">
                  <label for="signin-password">Password:</label>
                  <input type="password" id="signin-password" required placeholder="Enter your password">
                </div>
                <div class="auth-field checkbox-field">
                  <label>
                    <input type="checkbox" id="remember-me" checked>
                    <span class="checkmark"></span>
                    Remember me
                  </label>
                </div>
                <button type="submit" class="auth-btn primary">
                  🚀 Sign In
                </button>
              </form>

              <div class="auth-divider">
                <span>or</span>
              </div>

              <button class="auth-btn secondary" onclick="authUI.signInWithGoogle()">
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              <button class="auth-btn secondary" onclick="authUI.switchAuthMode('magic-link')">
                ✨ Send Magic Link
              </button>
            </div>

            <!-- Sign Up Form -->
            <div id="signup-form" class="auth-form ${
              mode === "signup" ? "active" : ""
            }">
              <form onsubmit="authUI.handleSignUp(event)">
                <div class="auth-field">
                  <label for="signup-name">Full Name:</label>
                  <input type="text" id="signup-name" required placeholder="Your full name">
                </div>
                <div class="auth-field">
                  <label for="signup-email">Email:</label>
                  <input type="email" id="signup-email" required placeholder="your-email@domain.com">
                </div>
                <div class="auth-field">
                  <label for="signup-password">Password:</label>
                  <input type="password" id="signup-password" required placeholder="Create a strong password" minlength="8">
                </div>
                <div class="auth-field">
                  <label for="signup-confirm">Confirm Password:</label>
                  <input type="password" id="signup-confirm" required placeholder="Confirm your password">
                </div>
                <div class="auth-field">
                  <label for="signup-role">Role:</label>
                  <select id="signup-role" required>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                    <option value="editor">Editor</option>
                  </select>
                </div>
                <button type="submit" class="auth-btn primary">
                  📝 Create Account
                </button>
              </form>
            </div>

            <!-- Password Reset Form -->
            <div id="reset-form" class="auth-form ${
              mode === "reset" ? "active" : ""
            }">
              <form onsubmit="authUI.handlePasswordReset(event)">
                <div class="auth-field">
                  <label for="reset-email">Email:</label>
                  <input type="email" id="reset-email" required placeholder="Enter your email address">
                </div>
                <p class="auth-help-text">
                  We'll send you a link to reset your password.
                </p>
                <button type="submit" class="auth-btn primary">
                  📧 Send Reset Link
                </button>
              </form>
            </div>

            <!-- Magic Link Form -->
            <div id="magic-link-form" class="auth-form ${
              mode === "magic-link" ? "active" : ""
            }">
              <form onsubmit="authUI.handleMagicLink(event)">
                <div class="auth-field">
                  <label for="magic-email">Email:</label>
                  <input type="email" id="magic-email" required placeholder="Enter your email address">
                </div>
                <p class="auth-help-text">
                  We'll send you a secure login link via email.
                </p>
                <button type="submit" class="auth-btn primary">
                  ✨ Send Magic Link
                </button>
              </form>
            </div>
          </div>

          <div id="auth-status" class="auth-status"></div>

          <div class="auth-footer">
            <p class="auth-footer-text">
              🔒 Secured with Supabase Authentication<br>
              <small>Your data is encrypted and protected</small>
            </p>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);
    this.currentModal = document.getElementById("supabase-auth-modal");

    // Focus first input
    setTimeout(() => {
      const firstInput = this.currentModal.querySelector("input");
      if (firstInput) firstInput.focus();
    }, 100);
  }

  /**
   * Hide authentication modal
   */
  hideAuthModal() {
    if (this.currentModal) {
      this.currentModal.remove();
      this.currentModal = null;
    }
  }

  /**
   * Switch authentication mode
   */
  switchAuthMode(mode) {
    // Update tabs
    document.querySelectorAll(".auth-tab").forEach((tab) => {
      tab.classList.remove("active");
    });
    event.target.classList.add("active");

    // Update forms
    document.querySelectorAll(".auth-form").forEach((form) => {
      form.classList.remove("active");
    });

    const targetForm = document.getElementById(`${mode}-form`);
    if (targetForm) {
      targetForm.classList.add("active");
    }

    // Clear status
    this.clearAuthStatus();

    // Focus first input
    setTimeout(() => {
      const firstInput = targetForm?.querySelector("input");
      if (firstInput) firstInput.focus();
    }, 100);
  }

  /**
   * Handle sign in form submission
   */
  async handleSignIn(event) {
    event.preventDefault();

    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const email = document.getElementById("signin-email").value;
      const password = document.getElementById("signin-password").value;

      this.showAuthStatus("🔄 Signing in...", "info");
      this.setButtonState(event.target, true, "🔄 Signing in...");

      const result = await this.authManager.signInWithPassword(email, password);

      if (result.success) {
        this.showAuthStatus("✅ Sign in successful!", "success");
        setTimeout(() => this.hideAuthModal(), 1500);
      } else {
        this.showAuthStatus(`❌ ${result.error}`, "error");
      }
    } catch (error) {
      this.showAuthStatus(`❌ Sign in failed: ${error.message}`, "error");
    } finally {
      this.isProcessing = false;
      this.setButtonState(event.target, false, "🚀 Sign In");
    }
  }

  /**
   * Handle sign up form submission
   */
  async handleSignUp(event) {
    event.preventDefault();

    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const name = document.getElementById("signup-name").value;
      const email = document.getElementById("signup-email").value;
      const password = document.getElementById("signup-password").value;
      const confirmPassword = document.getElementById("signup-confirm").value;
      const role = document.getElementById("signup-role").value;

      // Validate passwords match
      if (password !== confirmPassword) {
        this.showAuthStatus("❌ Passwords do not match", "error");
        return;
      }

      this.showAuthStatus("📝 Creating account...", "info");
      this.setButtonState(event.target, true, "📝 Creating...");

      const result = await this.authManager.signUp(email, password, {
        fullName: name,
        role: role,
      });

      if (result.success) {
        if (result.needsConfirmation) {
          this.showAuthStatus(
            "✅ Account created! Check your email to confirm.",
            "success"
          );
        } else {
          this.showAuthStatus("✅ Account created and signed in!", "success");
          setTimeout(() => this.hideAuthModal(), 1500);
        }
      } else {
        this.showAuthStatus(`❌ ${result.error}`, "error");
      }
    } catch (error) {
      this.showAuthStatus(`❌ Sign up failed: ${error.message}`, "error");
    } finally {
      this.isProcessing = false;
      this.setButtonState(event.target, false, "📝 Create Account");
    }
  }

  /**
   * Handle password reset
   */
  async handlePasswordReset(event) {
    event.preventDefault();

    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const email = document.getElementById("reset-email").value;

      this.showAuthStatus("📧 Sending reset link...", "info");
      this.setButtonState(event.target, true, "📧 Sending...");

      const result = await this.authManager.resetPassword(email);

      if (result.success) {
        this.showAuthStatus("✅ Reset link sent! Check your email.", "success");
      } else {
        this.showAuthStatus(`❌ ${result.error}`, "error");
      }
    } catch (error) {
      this.showAuthStatus(`❌ Reset failed: ${error.message}`, "error");
    } finally {
      this.isProcessing = false;
      this.setButtonState(event.target, false, "📧 Send Reset Link");
    }
  }

  /**
   * Handle magic link
   */
  async handleMagicLink(event) {
    event.preventDefault();

    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const email = document.getElementById("magic-email").value;

      this.showAuthStatus("✨ Sending magic link...", "info");
      this.setButtonState(event.target, true, "✨ Sending...");

      const result = await this.authManager.signInWithMagicLink(email);

      if (result.success) {
        this.showAuthStatus("✅ Magic link sent! Check your email.", "success");
      } else {
        this.showAuthStatus(`❌ ${result.error}`, "error");
      }
    } catch (error) {
      this.showAuthStatus(`❌ Magic link failed: ${error.message}`, "error");
    } finally {
      this.isProcessing = false;
      this.setButtonState(event.target, false, "✨ Send Magic Link");
    }
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      this.showAuthStatus("🔄 Redirecting to Google...", "info");

      const result = await this.authManager.signInWithGoogle();

      if (!result.success) {
        this.showAuthStatus(`❌ ${result.error}`, "error");
      }
    } catch (error) {
      this.showAuthStatus(
        `❌ Google sign in failed: ${error.message}`,
        "error"
      );
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Show authentication status message
   */
  showAuthStatus(message, type = "info") {
    const statusDiv = document.getElementById("auth-status");
    if (statusDiv) {
      statusDiv.textContent = message;
      statusDiv.className = `auth-status ${type}`;
      statusDiv.style.display = "block";
    }
  }

  /**
   * Clear authentication status
   */
  clearAuthStatus() {
    const statusDiv = document.getElementById("auth-status");
    if (statusDiv) {
      statusDiv.style.display = "none";
    }
  }

  /**
   * Set button state
   */
  setButtonState(button, disabled, text) {
    const submitBtn = button.querySelector('button[type="submit"]') || button;
    submitBtn.disabled = disabled;
    if (text) submitBtn.textContent = text;
  }

  /**
   * Show welcome message after login
   */
  showWelcomeMessage(user) {
    const welcomeHTML = `
      <div id="auth-welcome" class="auth-welcome-notification">
        <div class="welcome-icon">🎉</div>
        <div class="welcome-content">
          <h4>Welcome back!</h4>
          <p>${user.user_metadata?.full_name || user.email}</p>
          <small>Authentication successful</small>
        </div>
        <button onclick="document.getElementById('auth-welcome').remove()" class="welcome-close">×</button>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", welcomeHTML);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      const welcomeEl = document.getElementById("auth-welcome");
      if (welcomeEl) welcomeEl.remove();
    }, 4000);
  }

  /**
   * Create authentication styles
   */
  createAuthStyles() {
    const styles = document.createElement("style");
    styles.id = "supabase-auth-styles";
    styles.textContent = `
      /* Authentication Modal Styles */
      .auth-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease-out;
      }

      .auth-modal-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(4px);
      }

      .auth-modal-content {
        position: relative;
        background: white;
        border-radius: 16px;
        padding: 0;
        width: 90%;
        max-width: 480px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
        animation: slideUp 0.3s ease-out;
      }

      .auth-modal-header {
        padding: 2rem 2rem 1rem 2rem;
        text-align: center;
        position: relative;
        border-bottom: 1px solid #e2e8f0;
      }

      .auth-modal-title {
        margin: 0 0 0.5rem 0;
        color: #1a202c;
        font-size: 1.8rem;
        font-weight: 700;
      }

      .auth-modal-subtitle {
        margin: 0;
        color: #64748b;
        font-size: 1rem;
      }

      .auth-modal-close {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: none;
        border: none;
        font-size: 2rem;
        color: #64748b;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 50%;
        transition: all 0.2s ease;
      }

      .auth-modal-close:hover {
        background: #f1f5f9;
        color: #1a202c;
      }

      .auth-tabs {
        display: flex;
        border-bottom: 1px solid #e2e8f0;
      }

      .auth-tab {
        flex: 1;
        padding: 1rem;
        border: none;
        background: none;
        font-size: 0.9rem;
        font-weight: 600;
        color: #64748b;
        cursor: pointer;
        border-bottom: 2px solid transparent;
        transition: all 0.2s ease;
      }

      .auth-tab.active {
        color: #3b82f6;
        border-bottom-color: #3b82f6;
        background: #f8fafc;
      }

      .auth-tab:hover {
        color: #3b82f6;
        background: #f8fafc;
      }

      .auth-content {
        padding: 2rem;
      }

      .auth-form {
        display: none;
      }

      .auth-form.active {
        display: block;
      }

      .auth-field {
        margin-bottom: 1.5rem;
      }

      .auth-field label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 600;
        color: #374151;
      }

      .auth-field input,
      .auth-field select {
        width: 100%;
        padding: 0.875rem;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        font-size: 1rem;
        transition: border-color 0.2s ease;
        box-sizing: border-box;
      }

      .auth-field input:focus,
      .auth-field select:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      .checkbox-field {
        display: flex;
        align-items: center;
        margin-bottom: 2rem;
      }

      .checkbox-field label {
        display: flex;
        align-items: center;
        cursor: pointer;
        margin-bottom: 0;
      }

      .checkbox-field input[type="checkbox"] {
        width: auto;
        margin-right: 0.5rem;
      }

      .auth-btn {
        width: 100%;
        padding: 1rem;
        border: none;
        border-radius: 8px;
        font-size: 1.1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
      }

      .auth-btn.primary {
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: white;
      }

      .auth-btn.primary:hover:not(:disabled) {
        background: linear-gradient(135deg, #2563eb, #1e40af);
        transform: translateY(-1px);
      }

      .auth-btn.secondary {
        background: white;
        color: #374151;
        border: 2px solid #e2e8f0;
      }

      .auth-btn.secondary:hover:not(:disabled) {
        background: #f8fafc;
        border-color: #d1d5db;
      }

      .auth-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none !important;
      }

      .auth-divider {
        display: flex;
        align-items: center;
        margin: 1.5rem 0;
        color: #64748b;
      }

      .auth-divider::before,
      .auth-divider::after {
        content: '';
        flex: 1;
        height: 1px;
        background: #e2e8f0;
      }

      .auth-divider span {
        padding: 0 1rem;
        font-size: 0.9rem;
      }

      .auth-status {
        margin: 1rem 0;
        padding: 1rem;
        border-radius: 8px;
        font-size: 0.9rem;
        display: none;
      }

      .auth-status.success {
        background: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
      }

      .auth-status.error {
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
      }

      .auth-status.info {
        background: #d1ecf1;
        color: #0c5460;
        border: 1px solid #bee5eb;
      }

      .auth-footer {
        padding: 1.5rem 2rem;
        text-align: center;
        border-top: 1px solid #e2e8f0;
        background: #f8fafc;
      }

      .auth-footer-text {
        margin: 0;
        color: #64748b;
        font-size: 0.9rem;
      }

      .auth-footer-text small {
        display: block;
        margin-top: 0.25rem;
        font-size: 0.8rem;
        opacity: 0.8;
      }

      .auth-help-text {
        color: #64748b;
        font-size: 0.9rem;
        margin-bottom: 1.5rem;
        line-height: 1.5;
      }

      /* Welcome Notification */
      .auth-welcome-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
        display: flex;
        align-items: center;
        gap: 1rem;
        z-index: 10000;
        max-width: 350px;
        animation: slideInRight 0.5s ease-out;
      }

      .welcome-icon {
        font-size: 2rem;
      }

      .welcome-content h4 {
        margin: 0 0 0.25rem 0;
        font-size: 1.1rem;
        font-weight: 600;
      }

      .welcome-content p {
        margin: 0;
        font-size: 0.9rem;
        opacity: 0.9;
      }

      .welcome-content small {
        font-size: 0.8rem;
        opacity: 0.8;
      }

      .welcome-close {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0.25rem 0.5rem;
        border-radius: 50%;
        margin-left: auto;
      }

      .welcome-close:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      /* Authentication-based visibility */
      .auth-required {
        display: none;
      }

      .auth-hidden {
        display: block;
      }

      /* Animations */
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes slideUp {
        from {
          transform: translateY(50px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      /* Mobile Responsive */
      @media (max-width: 768px) {
        .auth-modal-content {
          width: 95%;
          margin: 1rem;
        }

        .auth-modal-header,
        .auth-content,
        .auth-footer {
          padding-left: 1.5rem;
          padding-right: 1.5rem;
        }

        .auth-welcome-notification {
          right: 10px;
          left: 10px;
          max-width: none;
        }
      }
    `;

    document.head.appendChild(styles);
  }
}

// Initialize authentication UI
let authUI = null;

document.addEventListener("DOMContentLoaded", async function () {
  try {
    authUI = new AuthenticationUI();

    // Make globally available
    window.authUI = authUI;
    window.AuthenticationUI = AuthenticationUI;
  } catch (error) {
    console.error("Failed to initialize Authentication UI:", error);
  }
});

// Export for modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = AuthenticationUI;
}
