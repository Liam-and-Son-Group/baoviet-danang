# 🔐 Admin Authentication & Key Management System

Hệ thống quản lý xác thực và key tự động cho Admin Dashboard của Bảo Hiểm Bảo Việt Đà Nẵng.

## 📋 Tổng quan

Hệ thống bao gồm các component chính:

- **AdminKeyManager**: Quản lý authentication và keys
- **AdminLoginSystem**: Giao diện login và integration
- **SupabaseKeyManager**: Quản lý anon keys
- **UserAnalytics**: Theo dõi hành vi người dùng

## 🚀 Cách sử dụng

### 1. Khởi động Admin Dashboard

```bash
# Mở file admin-dashboard.html trong trình duyệt
open admin-dashboard.html
```

### 2. Đăng nhập Admin

Khi mở dashboard, hệ thống sẽ tự động:

1. Kiểm tra session có sẵn
2. Hiển thị login modal nếu chưa đăng nhập
3. Cung cấp 2 phương thức login:
   - **Username/Password**: Thông tin admin
   - **Admin Key**: Direct key authentication
4. **Anon Key**: Tự động lấy từ Edge Function (không cần nhập)

### 3. Sau khi đăng nhập thành công

Hệ thống tự động:

- ✅ **Auto-fetch anon key** từ Edge Function get-anon-key
- ✅ Fetch và cache tất cả keys cần thiết khác
- ✅ Lưu session vào localStorage
- ✅ Initialize tất cả dashboard features
- ✅ Setup analytics với admin key
- ✅ Hiển thị thông báo welcome

## 🔑 Key Management

### Các loại keys được quản lý:

1. **anon_key**: Tự động lấy từ Edge Function (không cần nhập)
2. **service_role_key**: Admin key cho admin operations
3. **admin_keys**: Custom admin keys
4. **analytics_key**: Key cho analytics tracking

### Caching Strategy:

- **localStorage**: Persistent storage với expiry
- **Memory cache**: Fast access trong session
- **Auto-refresh**: Tự động làm mới khi expired

## 📊 Analytics Integration

Sau khi login, analytics được tự động initialize với:

- User behavior tracking
- Page view analytics
- Admin-specific insights
- Real-time data processing

## 🛡️ Security Features

### Domain Whitelisting

```javascript
// Chỉ cho phép domains được whitelist
const allowedDomains = [
  "baoviet-danang.com",
  "localhost",
  "admin.baoviet-danang.com",
];
```

### Session Management

- Auto-expire sessions sau thời gian nhất định
- Secure logout với cleanup
- Validation tự động

### Key Validation

- JWT token validation
- Key expiry checking
- Fallback strategies

## 🔧 API Reference

### AdminKeyManager

```javascript
// Initialize
const adminKeyManager = new AdminKeyManager();

// Login
await adminKeyManager.loginAdmin({
  username: "admin",
  password: "password",
});

// Get keys
const anonKey = await adminKeyManager.getKey("anon_key");
const serviceKey = await adminKeyManager.getKey("service_role_key");

// Check login status
const isLoggedIn = adminKeyManager.isLoggedIn();

// Logout
adminKeyManager.logout();
```

### AdminLoginSystem

```javascript
// Initialize (tự động)
const adminLogin = new AdminLoginSystem();

// Manual operations
adminLogin.switchTab("credentials"); // Switch login tabs
await adminLogin.handleLogin(); // Process login
adminLogin.showLoginModal(); // Show login form
```

### Dashboard Integration

```javascript
// Check admin status
if (window.isAdminLoggedIn()) {
  // Admin operations
}

// Get admin key for operations
const key = await window.getAdminKey("anon_key");

// Access admin manager
const keyManager = window.adminDashboard.keyManager;
```

## 📱 UI Components

### Login Modal Features:

- 👤 Username/Password tab
- 🔑 Admin Key tab
- 📱 Responsive design
- ✨ Loading states
- 🚨 Error handling
- 💡 Help section

### Dashboard Integration:

- 👋 Welcome notification
- 🚪 Logout button
- 🔐 Admin-only sections
- 📊 Analytics dashboard

## 🛠️ Customization

### Thêm Authentication Method:

```javascript
// Trong AdminKeyManager.loginAdmin()
if (credentials.customAuth) {
  return await this.customAuthMethod(credentials);
}
```

### Thêm Key Type mới:

```javascript
// Thêm vào AdminKeyManager.initializeKeys()
if (adminKeys.new_key_type) {
  await this.cacheKey("new_key_type", adminKeys.new_key_type);
}
```

### Custom Login UI:

```javascript
// Override AdminLoginSystem methods
class CustomAdminLogin extends AdminLoginSystem {
  showLoginModal() {
    // Custom modal implementation
  }
}
```

## 🔍 Debugging

### Console Logs:

```javascript
// Enable debug mode
localStorage.setItem("admin_debug", "true");

// Logs sẽ hiển thị:
// 🚀 System initialization
// ✅ Successful operations
// ❌ Errors và failures
// 📊 Analytics events
// 🔑 Key operations
```

### Kiểm tra Keys:

```javascript
// Check cached keys
console.log(localStorage.getItem("admin_keys_cache"));

// Check current session
console.log(window.adminDashboard);

// Test key validity
await window.getAdminKey("anon_key");
```

## 🚨 Troubleshooting

### Common Issues:

1. **Login fails**:

   - Kiểm tra credentials
   - Check network connection
   - Verify Edge Functions running

2. **Keys không load**:

   - Check Edge Function `get-anon-key` đang chạy
   - Clear localStorage
   - Verify anon key fetch từ Edge Function
   - Check database connection

3. **Dashboard không initialize**:
   - Check console for errors
   - Verify all scripts loaded
   - Check admin login status

### Solutions:

```javascript
// Hard reset system
localStorage.clear();
location.reload();

// Manual key supply (development)
await window.adminLogin.adminKeyManager.cacheKey("anon_key", "your-key");

// Check system status
console.log({
  isReady: window.adminDashboard.isReady,
  hasKeyManager: !!window.adminLogin,
  isLoggedIn: window.isAdminLoggedIn(),
});
```

## 📄 Files Structure

```
├── admin-dashboard.html           # Main dashboard
├── admin-key-manager.js          # Core authentication
├── admin-login-system.js         # Login UI & integration
├── supabase-key-manager.js       # Anon key management
├── user-analytics.js             # Analytics tracking
├── supabase/functions/
│   ├── get-anon-key/index.ts     # Key serving Edge Function
│   └── track-user-behavior/index.ts # Analytics Edge Function
└── README-admin-system.md        # This file
```

## 🎯 Next Steps

1. **🔧 Production Setup**: Deploy Edge Functions
2. **👥 User Management**: Multi-admin support
3. **📊 Advanced Analytics**: Custom events
4. **🔒 Enhanced Security**: 2FA, audit logs
5. **📱 Mobile Admin**: Mobile-optimized interface

## 💡 Tips

- **Development**: Use localhost cho testing
- **Production**: Setup proper domain whitelisting
- **Backup**: Regular backup của keys và configs
- **Monitoring**: Setup alerts cho failed logins
- **Updates**: Test thoroughly before deploying

---

**Created by**: AI Assistant  
**Last Updated**: December 2024  
**Version**: 1.0.0
