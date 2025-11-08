# 🔐 Supabase Authentication System

Hệ thống xác thực hoàn chỉnh cho Admin Dashboard sử dụng Supabase Authentication.

## 📋 Tính năng chính

### 🔑 Authentication Methods

- **Email/Password**: Đăng nhập truyền thống
- **Magic Link**: Đăng nhập không mật khẩu qua email
- **Google OAuth**: Đăng nhập bằng Google
- **Admin Override**: Key-based admin access

### 🛡️ Security Features

- **Route Protection**: Bảo vệ các trang admin
- **Role-based Access**: Phân quyền theo vai trò
- **Session Management**: Quản lý phiên đăng nhập
- **Auto Refresh**: Tự động làm mới token

### 👤 User Management

- **User Profiles**: Quản lý thông tin người dùng
- **Role Assignment**: Gán vai trò (Admin, Editor, Viewer)
- **Profile Updates**: Cập nhật thông tin cá nhân
- **Password Reset**: Đặt lại mật khẩu

## 🚀 Setup Instructions

### 1. Supabase Project Setup

```sql
-- Enable RLS (Row Level Security)
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  role TEXT DEFAULT 'viewer',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admin access policy
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Create user sessions table
CREATE TABLE public.user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  session_data JSONB,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Create admin logs table
CREATE TABLE public.admin_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on admin logs
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'viewer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 2. Configuration Setup

Cập nhật file `supabase-config.js`:

```javascript
const SUPABASE_CONFIG = {
  // Thay thế bằng URL Supabase thực tế của bạn
  url: "https://your-project-ref.supabase.co",

  // Các cấu hình khác giữ nguyên
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
};
```

### 3. Environment Variables

Trong Supabase Dashboard, cấu hình:

```bash
# Auth Settings
SITE_URL=https://your-domain.com
ADDITIONAL_REDIRECT_URLS=https://your-domain.com/admin-dashboard.html

# Email Templates (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 4. OAuth Providers (Optional)

#### Google OAuth Setup:

1. Vào [Google Console](https://console.developers.google.com/)
2. Tạo OAuth 2.0 credentials
3. Thêm redirect URI: `https://your-project-ref.supabase.co/auth/v1/callback`
4. Cập nhật trong Supabase Dashboard > Auth > Providers

## 🎯 Usage Guide

### Basic Authentication

```javascript
// Sign in with email/password
const result = await supabaseAuth.signInWithPassword(email, password);

// Sign up new user
const result = await supabaseAuth.signUp(email, password, {
  fullName: "John Doe",
  role: "admin",
});

// Sign out
await supabaseAuth.signOut();
```

### Show Authentication Modal

```javascript
// Show sign in modal
authUI.showAuthModal("signin");

// Show sign up modal
authUI.showAuthModal("signup");

// Show password reset modal
authUI.showAuthModal("reset");
```

### Check Authentication Status

```javascript
// Check if user is authenticated
const isAuthenticated = supabaseAuth.isAuthenticated();

// Get current user
const user = supabaseAuth.getCurrentUser();

// Check user role
const isAdmin = supabaseAuth.isAdmin();

// Check specific permission
const hasPermission = SupabaseUtils.hasPermission(user, "dashboard.edit");
```

### Route Protection

```javascript
// Add protected route
routeProtection.addProtectedRoute("/admin/users");

// Check if user can access route
const canAccess = await routeProtection.canAccessRoute("/admin");

// Navigate with protection
await routeProtection.navigateTo("/admin/settings");
```

## 🎨 UI Components

### Authentication Modal Features:

- **Multi-tab Interface**: Sign In, Sign Up, Reset Password
- **Social Login**: Google OAuth integration
- **Magic Link**: Passwordless authentication
- **Form Validation**: Real-time validation
- **Error Handling**: User-friendly error messages
- **Loading States**: Progress indicators

### User Profile Sidebar:

- **Avatar Display**: User initials or photo
- **User Information**: Name, email, role
- **Quick Actions**: Profile settings, logout
- **Role Badge**: Visual role indicator

### Route Protection:

- **Access Control**: Automatic route protection
- **Permission Checks**: Role-based access
- **Redirect Handling**: Smooth navigation
- **Error Pages**: User-friendly access denied

## 🔧 Customization

### Adding Custom Roles

```javascript
// In supabase-config.js
const ADMIN_ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  EDITOR: "editor",
  MODERATOR: "moderator", // New role
  VIEWER: "viewer",
};

const ROLE_PERMISSIONS = {
  [ADMIN_ROLES.MODERATOR]: ["dashboard.view", "content.moderate", "users.view"],
};
```

### Custom Authentication Provider

```javascript
// In supabase-auth-manager.js
async signInWithCustomProvider(provider) {
  const { data, error } = await this.supabase.auth.signInWithOAuth({
    provider: provider,
    options: {
      redirectTo: this.config.redirectTo
    }
  });

  return { success: !error, error: error?.message };
}
```

### Custom UI Themes

```css
/* Override authentication modal styles */
.auth-modal-content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.auth-btn.primary {
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
}
```

## 📊 Analytics Integration

```javascript
// Track authentication events
document.addEventListener("supabase-auth-signin", function (event) {
  // Send to analytics
  if (window.userAnalytics) {
    window.userAnalytics.track("user_signin", {
      method: "email",
      user_id: event.detail.user.id,
    });
  }
});
```

## 🛠️ Development

### Testing Authentication

```javascript
// Test authentication flow
async function testAuth() {
  try {
    // Test sign up
    const signUpResult = await supabaseAuth.signUp(
      "test@example.com",
      "TestPassword123",
      { fullName: "Test User", role: "admin" }
    );

    console.log("Sign up:", signUpResult);

    // Test sign in
    const signInResult = await supabaseAuth.signInWithPassword(
      "test@example.com",
      "TestPassword123"
    );

    console.log("Sign in:", signInResult);
  } catch (error) {
    console.error("Auth test failed:", error);
  }
}
```

### Debug Mode

```javascript
// Enable debug logging
localStorage.setItem("supabase_debug", "true");

// Check authentication state
console.log("Auth State:", {
  isAuthenticated: supabaseAuth.isAuthenticated(),
  currentUser: supabaseAuth.getCurrentUser(),
  userRole: supabaseAuth.getUserRole(),
});
```

## 🚨 Troubleshooting

### Common Issues:

1. **Configuration Error**:

   ```
   Error: Please configure your Supabase URL
   ```

   **Solution**: Update `supabase-config.js` with correct URL

2. **Authentication Failed**:

   ```
   Error: Invalid login credentials
   ```

   **Solution**: Check email/password, verify user exists

3. **Route Protection Not Working**:

   ```
   Access denied despite being logged in
   ```

   **Solution**: Check user role and permissions

4. **OAuth Redirect Error**:
   ```
   OAuth callback URL mismatch
   ```
   **Solution**: Verify redirect URLs in provider settings

### Debug Commands:

```javascript
// Check Supabase connection
await supabaseAuth.supabase.auth.getSession();

// Test database connection
await supabaseAuth.supabase.from("profiles").select("*").limit(1);

// Verify role permissions
SupabaseUtils.hasPermission(user, "dashboard.view");
```

## 🔐 Security Best Practices

1. **Environment Security**:

   - Never expose service role key in client
   - Use environment variables for sensitive data
   - Enable RLS on all tables

2. **Authentication Security**:

   - Enforce strong passwords
   - Enable email confirmation
   - Use HTTPS only

3. **Authorization Security**:
   - Implement proper RLS policies
   - Validate permissions server-side
   - Log all admin actions

## 📚 API Reference

### SupabaseAuthManager Methods:

- `signInWithPassword(email, password)` - Email/password authentication
- `signUp(email, password, userData)` - Create new account
- `signInWithMagicLink(email)` - Send magic link
- `signInWithGoogle()` - Google OAuth
- `signOut()` - Sign out user
- `resetPassword(email)` - Send password reset
- `updatePassword(newPassword)` - Update password
- `updateProfile(updates)` - Update user profile
- `getCurrentUser()` - Get current user
- `isAuthenticated()` - Check authentication
- `isAdmin()` - Check admin role

### AuthenticationUI Methods:

- `showAuthModal(mode)` - Show authentication modal
- `hideAuthModal()` - Hide authentication modal
- `switchAuthMode(mode)` - Switch modal tab
- `showWelcomeMessage(user)` - Show welcome notification

### RouteProtection Methods:

- `enforceAuthentication()` - Check route access
- `addProtectedRoute(route)` - Add protected route
- `canAccessRoute(path)` - Check route permission
- `navigateTo(path)` - Protected navigation

---

**Hệ thống Authentication với Supabase hoàn chỉnh và sẵn sàng sản xuất!** 🎉
