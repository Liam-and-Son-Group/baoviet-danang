-- =====================================================
-- User Analytics Database Schema
-- =====================================================
-- Tạo schema cơ sở dữ liệu cho hệ thống theo dõi hành vi người dùng
-- Bao gồm: events thô, statistics tổng hợp, và RPC functions

-- =====================================================
-- 1. Bảng chính lưu trữ raw events
-- =====================================================
CREATE TABLE IF NOT EXISTS user_analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_id TEXT,
    event_type TEXT NOT NULL, -- 'page_view', 'page_end', 'click', 'scroll', 'heartbeat'
    page TEXT NOT NULL,
    title TEXT,
    category TEXT,
    keywords TEXT[], -- Array of keywords extracted from page
    traffic_source JSONB, -- {source: 'google', medium: 'organic', campaign: '...'}
    
    -- Event specific data
    time_spent INTEGER, -- seconds spent on page
    scroll_depth DECIMAL(5,2), -- percentage scrolled
    clicks INTEGER, -- number of clicks
    element_clicked TEXT, -- CSS selector of clicked element
    
    -- Technical data
    user_agent TEXT,
    ip_address INET,
    referrer TEXT,
    
    -- Timestamps
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON user_analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_page ON user_analytics_events(page);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON user_analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON user_analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_keywords ON user_analytics_events USING GIN(keywords);

-- =====================================================
-- 2. Bảng tổng hợp analytics theo trang
-- =====================================================
CREATE TABLE IF NOT EXISTS page_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_path TEXT NOT NULL UNIQUE,
    page_title TEXT,
    category TEXT DEFAULT 'Khác',
    
    -- View statistics
    total_views INTEGER DEFAULT 0,
    unique_views INTEGER DEFAULT 0,
    
    -- Engagement statistics
    avg_time_spent DECIMAL(10,2) DEFAULT 0, -- seconds
    avg_scroll_depth DECIMAL(5,2) DEFAULT 0, -- percentage
    total_clicks INTEGER DEFAULT 0,
    bounce_rate DECIMAL(5,2) DEFAULT 0, -- percentage
    
    -- Most common keywords (top 10)
    top_keywords TEXT[],
    
    -- Traffic sources
    traffic_sources JSONB DEFAULT '{}', -- {"google": 150, "facebook": 75, "direct": 200}
    
    -- Timestamps
    first_view TIMESTAMPTZ,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. Bảng tổng hợp keywords
-- =====================================================
CREATE TABLE IF NOT EXISTS keyword_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    keyword TEXT NOT NULL UNIQUE,
    frequency INTEGER DEFAULT 0,
    associated_pages TEXT[], -- pages where this keyword appears
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. Bảng traffic sources
-- =====================================================
CREATE TABLE IF NOT EXISTS traffic_source_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source TEXT NOT NULL, -- 'google', 'facebook', 'direct', etc.
    medium TEXT NOT NULL, -- 'organic', 'social', 'referral', 'none'
    visits INTEGER DEFAULT 0,
    pages_per_visit DECIMAL(5,2) DEFAULT 0,
    avg_time_spent DECIMAL(10,2) DEFAULT 0,
    bounce_rate DECIMAL(5,2) DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(source, medium)
);

-- =====================================================
-- 5. Bảng tổng hợp daily statistics
-- =====================================================
CREATE TABLE IF NOT EXISTS analytics_summary (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    total_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    avg_session_duration DECIMAL(10,2) DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    new_visitors INTEGER DEFAULT 0,
    bounce_rate DECIMAL(5,2) DEFAULT 0,
    top_pages JSONB DEFAULT '[]', -- [{"page": "/page1", "views": 100}, ...]
    top_keywords JSONB DEFAULT '[]',
    traffic_breakdown JSONB DEFAULT '{}', -- {"google": 150, "facebook": 75}
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. RPC Functions để cập nhật statistics
-- =====================================================

-- Function: Cập nhật page statistics
CREATE OR REPLACE FUNCTION increment_page_stats(
    page_path TEXT,
    page_title TEXT DEFAULT '',
    category TEXT DEFAULT 'Khác',
    keywords TEXT[] DEFAULT '{}',
    traffic_source JSONB DEFAULT '{}'
) RETURNS VOID AS $$
DECLARE
    source_key TEXT;
BEGIN
    -- Upsert page analytics
    INSERT INTO page_analytics (
        page_path, 
        page_title, 
        category, 
        total_views, 
        unique_views,
        first_view,
        last_updated
    ) VALUES (
        page_path, 
        COALESCE(NULLIF(page_title, ''), page_path), 
        category, 
        1, 
        1,
        NOW(),
        NOW()
    )
    ON CONFLICT (page_path) DO UPDATE SET
        total_views = page_analytics.total_views + 1,
        page_title = COALESCE(NULLIF(EXCLUDED.page_title, ''), page_analytics.page_title),
        category = COALESCE(NULLIF(EXCLUDED.category, ''), page_analytics.category),
        last_updated = NOW();
    
    -- Update keywords if provided
    IF array_length(keywords, 1) > 0 THEN
        -- Update keyword analytics
        INSERT INTO keyword_analytics (keyword, frequency, associated_pages, last_updated)
        SELECT 
            unnest(keywords), 
            1, 
            ARRAY[page_path],
            NOW()
        ON CONFLICT (keyword) DO UPDATE SET
            frequency = keyword_analytics.frequency + 1,
            associated_pages = array_append(
                array_remove(keyword_analytics.associated_pages, page_path), 
                page_path
            ),
            last_updated = NOW();
    END IF;
    
    -- Update traffic source if provided
    IF traffic_source != '{}' THEN
        source_key := traffic_source->>'source' || '_' || traffic_source->>'medium';
        
        INSERT INTO traffic_source_analytics (
            source, 
            medium, 
            visits, 
            last_updated
        ) VALUES (
            traffic_source->>'source',
            traffic_source->>'medium',
            1,
            NOW()
        )
        ON CONFLICT (source, medium) DO UPDATE SET
            visits = traffic_source_analytics.visits + 1,
            last_updated = NOW();
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function: Cập nhật time và engagement stats
CREATE OR REPLACE FUNCTION update_time_stats(
    page_path TEXT,
    time_spent INTEGER DEFAULT 0,
    scroll_depth DECIMAL DEFAULT 0,
    clicks INTEGER DEFAULT 0
) RETURNS VOID AS $$
BEGIN
    UPDATE page_analytics 
    SET 
        avg_time_spent = (
            (avg_time_spent * total_views + time_spent) / 
            GREATEST(total_views, 1)
        ),
        avg_scroll_depth = (
            (avg_scroll_depth * total_views + scroll_depth) / 
            GREATEST(total_views, 1)
        ),
        total_clicks = total_clicks + clicks,
        last_updated = NOW()
    WHERE page_analytics.page_path = update_time_stats.page_path;
END;
$$ LANGUAGE plpgsql;

-- Function: Tổng hợp daily statistics (chạy mỗi ngày)
CREATE OR REPLACE FUNCTION generate_daily_summary(target_date DATE DEFAULT CURRENT_DATE - INTERVAL '1 day') 
RETURNS VOID AS $$
DECLARE
    summary_data RECORD;
BEGIN
    -- Calculate daily summary
    SELECT 
        COUNT(*) FILTER (WHERE event_type = 'page_view') as total_views,
        COUNT(DISTINCT session_id) as unique_visitors,
        COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'page_view') as total_sessions,
        AVG(time_spent) FILTER (WHERE event_type = 'page_end' AND time_spent > 0) as avg_session_duration,
        COUNT(DISTINCT session_id) FILTER (
            WHERE session_id IN (
                SELECT session_id 
                FROM user_analytics_events 
                WHERE DATE(timestamp) = target_date 
                GROUP BY session_id 
                HAVING COUNT(*) FILTER (WHERE event_type = 'page_view') = 1
            )
        ) as bounced_sessions
    INTO summary_data
    FROM user_analytics_events 
    WHERE DATE(timestamp) = target_date;
    
    -- Insert or update daily summary
    INSERT INTO analytics_summary (
        date,
        total_views,
        unique_visitors,
        total_sessions,
        avg_session_duration,
        bounce_rate
    ) VALUES (
        target_date,
        COALESCE(summary_data.total_views, 0),
        COALESCE(summary_data.unique_visitors, 0),
        COALESCE(summary_data.total_sessions, 0),
        COALESCE(summary_data.avg_session_duration, 0),
        CASE 
            WHEN summary_data.total_sessions > 0 
            THEN (summary_data.bounced_sessions::DECIMAL / summary_data.total_sessions * 100)
            ELSE 0 
        END
    )
    ON CONFLICT (date) DO UPDATE SET
        total_views = EXCLUDED.total_views,
        unique_visitors = EXCLUDED.unique_visitors,
        total_sessions = EXCLUDED.total_sessions,
        avg_session_duration = EXCLUDED.avg_session_duration,
        bounce_rate = EXCLUDED.bounce_rate;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. Row Level Security (RLS) - Chỉ admin mới xem được
-- =====================================================

-- Enable RLS trên tất cả bảng
ALTER TABLE user_analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_source_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_summary ENABLE ROW LEVEL SECURITY;

-- Policy: Chỉ service role mới được truy cập (thông qua Edge Functions)
CREATE POLICY "Analytics data access" ON user_analytics_events 
    FOR ALL USING (auth.role() = 'service_role');
    
CREATE POLICY "Page analytics access" ON page_analytics 
    FOR ALL USING (auth.role() = 'service_role');
    
CREATE POLICY "Keyword analytics access" ON keyword_analytics 
    FOR ALL USING (auth.role() = 'service_role');
    
CREATE POLICY "Traffic analytics access" ON traffic_source_analytics 
    FOR ALL USING (auth.role() = 'service_role');
    
CREATE POLICY "Summary analytics access" ON analytics_summary 
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 8. Automatic cleanup job (xóa dữ liệu cũ sau 90 ngày)
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_old_analytics() RETURNS VOID AS $$
BEGIN
    -- Xóa events cũ hơn 90 ngày
    DELETE FROM user_analytics_events 
    WHERE timestamp < NOW() - INTERVAL '90 days';
    
    -- Xóa daily summaries cũ hơn 1 năm
    DELETE FROM analytics_summary 
    WHERE date < CURRENT_DATE - INTERVAL '365 days';
    
    -- Log cleanup
    RAISE NOTICE 'Analytics cleanup completed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. Helpful Views cho reporting
-- =====================================================

-- View: Top pages trong 7 ngày gần nhất
CREATE OR REPLACE VIEW top_pages_7d AS
SELECT 
    p.page_path,
    p.page_title,
    p.category,
    COUNT(e.id) as views_7d,
    COUNT(DISTINCT e.session_id) as unique_visitors_7d,
    AVG(e.time_spent) FILTER (WHERE e.time_spent > 0) as avg_time_7d,
    AVG(e.scroll_depth) FILTER (WHERE e.scroll_depth > 0) as avg_scroll_7d
FROM page_analytics p
LEFT JOIN user_analytics_events e ON p.page_path = e.page
    AND e.timestamp >= NOW() - INTERVAL '7 days'
    AND e.event_type = 'page_view'
GROUP BY p.page_path, p.page_title, p.category
ORDER BY views_7d DESC NULLS LAST;

-- View: Traffic sources breakdown
CREATE OR REPLACE VIEW traffic_sources_summary AS
SELECT 
    source,
    medium,
    visits as total_visits,
    ROUND(pages_per_visit, 2) as avg_pages_per_visit,
    ROUND(avg_time_spent, 0) as avg_time_seconds,
    ROUND(bounce_rate, 1) as bounce_rate_percent,
    last_updated
FROM traffic_source_analytics
ORDER BY visits DESC;

-- =====================================================
-- Hoàn thành! 
-- =====================================================
-- Schema đã được tạo với đầy đủ tính năng:
-- ✅ Raw events storage
-- ✅ Aggregated statistics 
-- ✅ RPC functions for updates
-- ✅ Row Level Security
-- ✅ Automatic cleanup
-- ✅ Helpful views
-- ✅ Performance indexes
-- 
-- Để sử dụng, chạy file này trong Supabase SQL Editor
-- sau đó deploy Edge Function track-user-behavior
-- =====================================================