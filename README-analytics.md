# User Analytics System Documentation

## Tổng quan

Hệ thống User Analytics là một giải pháp toàn diện để theo dõi hành vi người dùng trên website Bảo Việt Đà Nẵng. Hệ thống bao gồm:

- **Client-side tracking**: JavaScript tracker tự động thu thập dữ liệu
- **Server-side processing**: Supabase Edge Function xử lý và lưu trữ dữ liệu
- **Database schema**: PostgreSQL schema tối ưu với aggregation
- **Security**: Tích hợp với anon key management system

## Kiến trúc hệ thống

```
User Browser → user-analytics.js → Edge Function → PostgreSQL
              ↑                                    ↓
         anon key ←← Key Manager         Analytics Dashboard
```

## Cài đặt

### 1. Deploy Database Schema

```sql
-- Chạy file này trong Supabase SQL Editor
\i supabase/migrations/setup-analytics-schema.sql
```

### 2. Deploy Edge Function

```bash
# Deploy Edge Function
supabase functions deploy track-user-behavior

# Set environment variables
supabase secrets set SUPABASE_URL=your_url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Thêm JavaScript Tracker

```html
<!-- Thêm vào tất cả các trang cần tracking -->
<script src="user-analytics.js"></script>
<script>
  // Analytics sẽ tự động khởi động
  console.log("Analytics loaded");
</script>
```

## Dữ liệu được thu thập

### 📄 Page Views

- URL và title của trang
- Thời gian truy cập
- Referrer và traffic source
- Keywords được trích xuất từ content

### ⏱️ Time Tracking

- Thời gian ở lại trên trang
- Session duration
- Active time (khi user tương tác)

### 📊 Scroll Behavior

- Scroll depth (% trang được xem)
- Scroll milestones (25%, 50%, 75%, 100%)
- Reading progress

### 🖱️ Click Tracking

- Clicks trên links quan trọng
- Button interactions
- Call-to-action performance

### 🔍 Search Behavior

- Search queries từ search box
- Keywords trong URL parameters
- Search result interactions

### 📈 Traffic Sources

- Direct traffic
- Search engines (Google, Bing)
- Social media referrals
- Campaign parameters (utm\_\*)

## API Endpoints

### POST /functions/v1/track-user-behavior

Gửi batch events từ client

```javascript
{
  "events": [
    {
      "event_type": "page_view",
      "session_id": "uuid",
      "page": "/bao-hiem-xe",
      "title": "Bảo hiểm xe - Bảo Việt",
      "keywords": ["bảo hiểm", "xe", "ô tô"],
      "traffic_source": {
        "source": "google",
        "medium": "organic"
      },
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ],
  "batch_size": 1
}
```

### GET /functions/v1/track-user-behavior

Lấy analytics data cho dashboard

#### Parameters:

- `type`: 'summary' | 'pages' | 'keywords' | 'traffic_sources' | 'page_details'
- `days`: số ngày muốn lấy data (default: 7)
- `page`: đường dẫn trang (chỉ cho type='page_details')

#### Examples:

```javascript
// Lấy tổng quan 7 ngày
GET /functions/v1/track-user-behavior?type=summary&days=7

// Top pages trong 30 ngày
GET /functions/v1/track-user-behavior?type=pages&days=30

// Chi tiết 1 trang
GET /functions/v1/track-user-behavior?type=page_details&page=/bao-hiem-xe&days=7
```

## Database Schema

### Bảng chính

#### `user_analytics_events`

Raw events được lưu trữ trong 90 ngày

#### `page_analytics`

Statistics tổng hợp theo trang

#### `keyword_analytics`

Frequency của keywords

#### `traffic_source_analytics`

Breakdown theo traffic source

#### `analytics_summary`

Daily aggregated data

### Views có sẵn

#### `top_pages_7d`

Top pages trong 7 ngày gần nhất

#### `traffic_sources_summary`

Tổng hợp traffic sources

## Sử dụng trong Admin Dashboard

### 1. Include Analytics API

```html
<script src="user-analytics.js"></script>
<script>
  // Analytics tự động khởi động cho tracking
  // Không cần config gì thêm
</script>
```

### 2. Lấy data cho Dashboard

```javascript
async function loadAnalyticsData() {
  try {
    const anonKey = await SupabaseKeyManager.getAnonKey();

    // Lấy tổng quan
    const summaryResponse = await fetch(
      "https://fiaxrsiycswrwucthian.supabase.co/functions/v1/track-user-behavior?type=summary&days=30",
      {
        headers: {
          Authorization: `Bearer ${anonKey}`,
          apikey: anonKey,
        },
      }
    );

    const summary = await summaryResponse.json();
    console.log("Analytics summary:", summary);

    // Lấy top pages
    const pagesResponse = await fetch(
      "https://fiaxrsiycswrwucthian.supabase.co/functions/v1/track-user-behavior?type=pages&days=30",
      {
        headers: {
          Authorization: `Bearer ${anonKey}`,
          apikey: anonKey,
        },
      }
    );

    const pages = await pagesResponse.json();
    console.log("Top pages:", pages);
  } catch (error) {
    console.error("Analytics error:", error);
  }
}
```

### 3. Hiển thị Charts

```javascript
// Sử dụng Chart.js để vẽ biểu đồ
function renderAnalyticsCharts(data) {
  // Page views chart
  const ctx = document.getElementById("pageViewsChart").getContext("2d");
  new Chart(ctx, {
    type: "line",
    data: {
      labels: data.summary.map((d) => d.date),
      datasets: [
        {
          label: "Page Views",
          data: data.summary.map((d) => d.total_views),
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
        },
      ],
    },
  });

  // Top pages chart
  const pagesCtx = document.getElementById("topPagesChart").getContext("2d");
  new Chart(pagesCtx, {
    type: "bar",
    data: {
      labels: data.pages.slice(0, 10).map((p) => p.page_title || p.page_path),
      datasets: [
        {
          label: "Views",
          data: data.pages.slice(0, 10).map((p) => p.total_views),
          backgroundColor: "#3b82f6",
        },
      ],
    },
  });
}
```

## Configuration Options

### Client-side Options

```javascript
// Tùy chỉnh analytics behavior
window.UserAnalyticsConfig = {
  baseUrl: "https://fiaxrsiycswrwucthian.supabase.co",
  functionName: "track-user-behavior",
  heartbeatInterval: 30000, // 30 giây
  idleTimeout: 300000, // 5 phút
  batchSize: 10, // Gửi 10 events/lần
  maxRetries: 3, // Retry tối đa 3 lần
  trackingEnabled: true, // Bật/tắt tracking
};

// Analytics sẽ tự động sử dụng config này
```

### Server-side Configuration

```sql
-- Tùy chỉnh thời gian lưu trữ data
-- Mặc định: 90 ngày cho raw events, 1 năm cho summary

-- Chạy cleanup manual
SELECT cleanup_old_analytics();

-- Tạo daily summary manual
SELECT generate_daily_summary('2024-01-15');
```

## Monitoring & Maintenance

### 1. Kiểm tra Analytics Health

```javascript
// Kiểm tra xem analytics có hoạt động không
console.log("Analytics status:", window.userAnalytics?.getAnalyticsSummary());

// Kiểm tra events trong buffer
console.log("Buffered events:", window.userAnalytics?.eventBuffer?.length || 0);
```

### 2. Debug Mode

```javascript
// Bật debug mode để xem chi tiết events
window.localStorage.setItem("analytics-debug", "true");

// Tắt debug mode
window.localStorage.removeItem("analytics-debug");
```

### 3. Database Maintenance

```sql
-- Kiểm tra size của bảng
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE tablename LIKE '%analytics%';

-- Kiểm tra index performance
SELECT
  indexname,
  tablename,
  indexdef
FROM pg_indexes
WHERE tablename LIKE '%analytics%';
```

## Troubleshooting

### Vấn đề thường gặp

1. **Analytics không gửi data**

   - Kiểm tra console có lỗi không
   - Verify anon key có hoạt động
   - Kiểm tra network tab trong DevTools

2. **Edge Function báo lỗi 401**

   - Anon key không hợp lệ hoặc expired
   - RLS policy chặn request
   - Domain không trong whitelist

3. **Data không cập nhật realtime**
   - Database aggregation chạy batch
   - Có thể delay vài phút
   - Kiểm tra RPC functions

### Debug Commands

```javascript
// Kiểm tra analytics status
window.userAnalytics.getAnalyticsSummary();

// Force gửi events
window.userAnalytics.sendBufferedEvents();

// Reset session
window.userAnalytics.sessionId = window.userAnalytics.generateSessionId();

// Kiểm tra anon key
window.SupabaseKeyManager.getAnonKey();
```

## Performance Considerations

### Client-side Performance

- Events được buffer và gửi batch
- Không block UI thread
- Automatic cleanup sau idle
- Minimal DOM observers

### Server-side Performance

- Database indexes tối ưu
- Batch processing
- Automatic data cleanup
- Aggregated statistics tables

### Storage Optimization

- Raw events: 90 ngày
- Daily summaries: 1 năm
- Automatic cleanup job
- Compressed JSON fields

## Security Features

- ✅ Row Level Security enabled
- ✅ Domain whitelist cho anon key
- ✅ Service role chỉ cho Edge Functions
- ✅ No PII collection
- ✅ IP anonymization
- ✅ Automatic key rotation support

## Tích hợp với Admin Dashboard

Analytics system đã được tích hợp vào admin dashboard tại section "Theo dõi hành vi người dùng". Dữ liệu sẽ được hiển thị với:

- 📊 Realtime visitor count
- 📈 Page views trend
- 🔝 Top performing pages
- 🔍 Popular keywords
- 📱 Traffic sources breakdown
- ⏱️ Average time on page

---

**Lưu ý**: Hệ thống hoàn toàn tuân thủ privacy laws và không thu thập thông tin cá nhân nhận dạng được.
