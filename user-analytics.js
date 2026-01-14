/**
 * User Behavior Analytics Tracker
 * Theo dõi hành vi người dùng: pageviews, time spent, keywords, traffic sources
 */

/**
 * Sanitize string to prevent XSS in analytics data
 */
function sanitizeAnalyticsString(str, maxLength = 500) {
  if (typeof str !== "string") return "";
  // Use textContent approach to strip HTML
  const div = document.createElement("div");
  div.textContent = str;
  const sanitized = div.textContent || div.innerText || "";
  return sanitized.substring(0, maxLength);
}

class UserAnalytics {
  constructor(options = {}) {
    this.baseUrl =
      options.baseUrl || "https://fiaxrsiycswrwucthian.supabase.co";
    this.functionName = options.functionName || "track-user-behavior";
    this.sessionId = this.generateSessionId();
    this.userId = this.getUserId();
    this.startTime = Date.now();
    this.lastActivity = Date.now();
    this.pageViews = [];
    this.currentPage = null;
    this.isActive = true;
    this.heartbeatInterval = null;
    this.trackingEnabled = true;

    // Configuration
    this.config = {
      heartbeatInterval: 30000, // 30 seconds
      idleTimeout: 5 * 60 * 1000, // 5 minutes
      batchSize: 10, // Send data in batches
      maxRetries: 3,
      maxBufferSize: 100, // Maximum events in buffer to prevent memory leak
      ...options,
    };

    // Initialize tracking
    this.init();
  }

  /**
   * Initialize tracking system
   */
  init() {
    try {
      this.setupPageTracking();
      this.setupTimeTracking();
      this.setupScrollTracking();
      this.setupClickTracking();
      this.setupSearchTracking();
      this.setupTrafficSourceTracking();
      this.startHeartbeat();

      console.log("🔍 User Analytics initialized");
    } catch (error) {
      console.error("Analytics initialization error:", error);
    }
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return (
      "session_" +
      Date.now() +
      "_" +
      Math.random().toString(36).substring(2, 11)
    );
  }

  /**
   * Get or create user ID
   */
  getUserId() {
    let userId = localStorage.getItem("analytics_user_id");
    if (!userId) {
      userId =
        "user_" +
        Date.now() +
        "_" +
        Math.random().toString(36).substring(2, 11);
      localStorage.setItem("analytics_user_id", userId);
    }
    return userId;
  }

  /**
   * Setup page view tracking
   */
  setupPageTracking() {
    // Track initial page load
    this.trackPageView();

    // Track page changes (for SPAs)
    let lastUrl = location.href;
    new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        this.trackPageView();
      }
    }).observe(document, { subtree: true, childList: true });

    // Track page visibility changes
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.handlePageHide();
      } else {
        this.handlePageShow();
      }
    });

    // Track page unload
    window.addEventListener("beforeunload", () => {
      this.handlePageUnload();
    });
  }

  /**
   * Track page view
   */
  trackPageView() {
    const pageData = this.getPageData();

    // End previous page tracking
    if (this.currentPage) {
      this.endPageTracking();
    }

    // Start new page tracking
    this.currentPage = {
      ...pageData,
      startTime: Date.now(),
      timeSpent: 0,
      scrollDepth: 0,
      clicks: 0,
      interactions: [],
    };

    // Send page view event
    this.sendEvent("page_view", pageData);

    console.log("📄 Page view tracked:", pageData.page);
  }

  /**
   * Get page data
   */
  getPageData() {
    const url = new URL(window.location.href);

    return {
      page: sanitizeAnalyticsString(window.location.pathname, 200),
      title: sanitizeAnalyticsString(document.title, 200),
      url: sanitizeAnalyticsString(window.location.href, 500),
      referrer: sanitizeAnalyticsString(document.referrer, 500),
      timestamp: new Date().toISOString(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      screen: {
        width: screen.width,
        height: screen.height,
      },
      device: this.getDeviceInfo(),
      keywords: this.extractKeywords(),
      category: sanitizeAnalyticsString(this.getPageCategory(), 100),
      traffic_source: this.getTrafficSource(),
    };
  }

  /**
   * Extract keywords from page content and meta tags
   */
  extractKeywords() {
    const keywords = new Set();

    // From meta keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.content
        .split(",")
        .forEach((k) => keywords.add(k.trim().toLowerCase()));
    }

    // From title
    const title = document.title.toLowerCase();
    const titleWords = title.split(/\s+/).filter((word) => word.length > 3);
    titleWords.forEach((word) => keywords.add(word));

    // From URL
    const urlKeywords = window.location.pathname
      .split("/")
      .filter((segment) => segment.length > 3)
      .map((segment) => segment.replace(/[-_]/g, " ").toLowerCase());
    urlKeywords.forEach((keyword) => keywords.add(keyword));

    // From headings
    const headings = document.querySelectorAll("h1, h2, h3");
    headings.forEach((heading) => {
      const words = heading.textContent
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 3 && !this.isStopWord(word));
      words.forEach((word) => keywords.add(word));
    });

    return Array.from(keywords).slice(0, 20); // Limit to 20 keywords
  }

  /**
   * Check if word is a stop word
   */
  isStopWord(word) {
    const stopWords = [
      "của",
      "và",
      "cho",
      "với",
      "tại",
      "trong",
      "trên",
      "từ",
      "về",
      "được",
      "có",
      "là",
      "một",
      "các",
      "này",
      "đó",
      "để",
      "như",
      "sẽ",
      "đã",
      "bảo",
      "hiểm",
      "the",
      "and",
      "for",
      "with",
      "this",
      "that",
    ];
    return stopWords.includes(word.toLowerCase());
  }

  /**
   * Get page category based on URL or content
   */
  getPageCategory() {
    const path = window.location.pathname.toLowerCase();

    if (
      path.includes("bao-hiem-xe") ||
      path.includes("baohiemoto") ||
      path.includes("baohiemxemay")
    ) {
      return "Bảo hiểm xe";
    } else if (
      path.includes("bao-hiem-suc-khoe") ||
      path.includes("baohiemsuckhoe") ||
      path.includes("intercare")
    ) {
      return "Bảo hiểm sức khỏe";
    } else if (path.includes("chay-no") || path.includes("baohiemchayno")) {
      return "Bảo hiểm cháy nổ";
    } else if (path.includes("travel") || path.includes("du-lich")) {
      return "Bảo hiểm du lịch";
    } else if (path.includes("an-gia") || path.includes("an-tam")) {
      return "Bảo hiểm nhân thọ";
    } else if (path.includes("dang-ky") || path.includes("tu-van")) {
      return "Đăng ký tư vấn";
    } else if (path.includes("tin-tuc") || path.includes("blog")) {
      return "Tin tức";
    } else if (path === "/" || path === "/index.html") {
      return "Trang chủ";
    }

    return "Khác";
  }

  /**
   * Get traffic source information
   */
  getTrafficSource() {
    const referrer = document.referrer;
    const utmSource = new URLSearchParams(window.location.search).get(
      "utm_source"
    );
    const utmMedium = new URLSearchParams(window.location.search).get(
      "utm_medium"
    );
    const utmCampaign = new URLSearchParams(window.location.search).get(
      "utm_campaign"
    );

    let source = "direct";
    let medium = "none";
    let campaign = "none";

    if (utmSource) {
      source = utmSource;
      medium = utmMedium || "unknown";
      campaign = utmCampaign || "unknown";
    } else if (referrer) {
      const referrerDomain = new URL(referrer).hostname.toLowerCase();

      if (referrerDomain.includes("google")) {
        source = "google";
        medium = "organic";
      } else if (referrerDomain.includes("facebook")) {
        source = "facebook";
        medium = "social";
      } else if (referrerDomain.includes("zalo")) {
        source = "zalo";
        medium = "social";
      } else if (referrerDomain.includes("youtube")) {
        source = "youtube";
        medium = "video";
      } else {
        source = referrerDomain;
        medium = "referral";
      }
    }

    return { source, medium, campaign, referrer };
  }

  /**
   * Get device information
   */
  getDeviceInfo() {
    const ua = navigator.userAgent;
    let deviceType = "desktop";
    let os = "unknown";
    let browser = "unknown";

    // Device type
    if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(ua)) {
      deviceType = /iPad|Tablet/i.test(ua) ? "tablet" : "mobile";
    }

    // Operating System
    if (/Windows/i.test(ua)) os = "Windows";
    else if (/Mac/i.test(ua)) os = "macOS";
    else if (/Android/i.test(ua)) os = "Android";
    else if (/iOS|iPhone|iPad|iPod/i.test(ua)) os = "iOS";
    else if (/Linux/i.test(ua)) os = "Linux";

    // Browser
    if (/Chrome/i.test(ua) && !/Edge/i.test(ua)) browser = "Chrome";
    else if (/Firefox/i.test(ua)) browser = "Firefox";
    else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
    else if (/Edge/i.test(ua)) browser = "Edge";

    return { type: deviceType, os, browser };
  }

  /**
   * Setup time tracking
   */
  setupTimeTracking() {
    // Track user activity
    [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ].forEach((event) => {
      document.addEventListener(
        event,
        () => {
          this.lastActivity = Date.now();
          this.isActive = true;
        },
        { passive: true }
      );
    });

    // Check for inactivity
    setInterval(() => {
      const inactiveTime = Date.now() - this.lastActivity;
      if (inactiveTime > this.config.idleTimeout) {
        this.isActive = false;
      }
    }, 30000);
  }

  /**
   * Setup scroll tracking
   */
  setupScrollTracking() {
    let maxScroll = 0;

    window.addEventListener(
      "scroll",
      () => {
        const scrollPercent = Math.round(
          (window.pageYOffset /
            (document.documentElement.scrollHeight - window.innerHeight)) *
            100
        );

        if (scrollPercent > maxScroll) {
          maxScroll = scrollPercent;
          if (this.currentPage) {
            this.currentPage.scrollDepth = maxScroll;
          }
        }

        // Track scroll milestones
        if (
          [25, 50, 75, 90].includes(scrollPercent) &&
          scrollPercent > (this.lastScrollMilestone || 0)
        ) {
          this.sendEvent("scroll_milestone", {
            page: sanitizeAnalyticsString(window.location.pathname, 200),
            scroll_percent: scrollPercent,
          });
          this.lastScrollMilestone = scrollPercent;
        }
      },
      { passive: true }
    );
  }

  /**
   * Setup click tracking
   */
  setupClickTracking() {
    document.addEventListener(
      "click",
      (event) => {
        const element = event.target;
        const clickData = {
          page: sanitizeAnalyticsString(window.location.pathname, 200),
          element_type: sanitizeAnalyticsString(
            element.tagName.toLowerCase(),
            50
          ),
          element_id: element.id
            ? sanitizeAnalyticsString(element.id, 100)
            : null,
          element_class: element.className
            ? sanitizeAnalyticsString(String(element.className), 200)
            : null,
          element_text: element.textContent
            ? sanitizeAnalyticsString(element.textContent, 100)
            : null,
          position: {
            x: event.clientX,
            y: event.clientY,
          },
        };

        // Track specific important clicks
        if (element.matches("a, button, .btn, [onclick]")) {
          this.sendEvent("important_click", clickData);
        }

        if (this.currentPage) {
          this.currentPage.clicks++;
          this.currentPage.interactions.push({
            type: "click",
            timestamp: Date.now(),
            ...clickData,
          });
        }
      },
      { passive: true }
    );
  }

  /**
   * Setup search tracking (if there's a search feature)
   */
  setupSearchTracking() {
    // Track search form submissions
    document.addEventListener("submit", (event) => {
      const form = event.target;
      const searchInput = form.querySelector(
        'input[type="search"], input[name*="search"], input[name*="q"]'
      );

      if (searchInput) {
        const searchTerm = sanitizeAnalyticsString(
          searchInput.value.trim(),
          200
        );
        if (searchTerm) {
          this.sendEvent("search", {
            page: sanitizeAnalyticsString(window.location.pathname, 200),
            search_term: searchTerm,
            search_type: "form_submission",
          });
        }
      }
    });

    // Track URL parameters for search terms
    const urlParams = new URLSearchParams(window.location.search);
    const searchParams = ["q", "search", "keyword", "term"];

    searchParams.forEach((param) => {
      const value = urlParams.get(param);
      if (value) {
        this.sendEvent("search", {
          page: sanitizeAnalyticsString(window.location.pathname, 200),
          search_term: sanitizeAnalyticsString(value, 200),
          search_type: "url_parameter",
        });
      }
    });
  }

  /**
   * Setup traffic source tracking
   */
  setupTrafficSourceTracking() {
    // Track first visit vs returning visitor
    const isReturning = localStorage.getItem("analytics_first_visit");
    if (!isReturning) {
      localStorage.setItem("analytics_first_visit", Date.now().toString());
      this.sendEvent("first_visit", this.getPageData());
    } else {
      this.sendEvent("returning_visit", {
        ...this.getPageData(),
        first_visit: new Date(parseInt(isReturning)).toISOString(),
      });
    }
  }

  /**
   * Start heartbeat to track active time
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.isActive && this.currentPage) {
        this.currentPage.timeSpent = Date.now() - this.currentPage.startTime;

        // Send heartbeat
        this.sendEvent("heartbeat", {
          page: sanitizeAnalyticsString(window.location.pathname, 200),
          time_spent: this.currentPage.timeSpent,
          scroll_depth: this.currentPage.scrollDepth,
          clicks: this.currentPage.clicks,
        });
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Handle page hide
   */
  handlePageHide() {
    this.isActive = false;
    if (this.currentPage) {
      this.endPageTracking();
    }
  }

  /**
   * Handle page show
   */
  handlePageShow() {
    this.isActive = true;
    this.lastActivity = Date.now();
  }

  /**
   * Handle page unload
   */
  handlePageUnload() {
    if (this.currentPage) {
      this.endPageTracking();
    }
    this.sendBufferedEvents();
  }

  /**
   * End current page tracking
   */
  endPageTracking() {
    if (!this.currentPage) return;

    const timeSpent = Date.now() - this.currentPage.startTime;
    this.currentPage.timeSpent = timeSpent;

    // Send page end event
    this.sendEvent("page_end", {
      page: this.currentPage.page,
      time_spent: timeSpent,
      scroll_depth: this.currentPage.scrollDepth,
      clicks: this.currentPage.clicks,
      interactions_count: this.currentPage.interactions.length,
    });

    this.pageViews.push(this.currentPage);
    this.currentPage = null;
  }

  /**
   * Send event to analytics backend
   */
  async sendEvent(eventType, eventData) {
    if (!this.trackingEnabled) return;

    const event = {
      event_type: eventType,
      session_id: this.sessionId,
      user_id: this.userId,
      timestamp: new Date().toISOString(),
      page_data: eventData,
      user_agent: navigator.userAgent,
      ip_address: null, // Will be filled by server
      ...eventData,
    };

    try {
      // Buffer events for batch sending
      this.bufferEvent(event);
    } catch (error) {
      console.error("Analytics event error:", error);
    }
  }

  /**
   * Buffer events for batch processing
   */
  bufferEvent(event) {
    if (!this.eventBuffer) {
      this.eventBuffer = [];
    }

    // Prevent memory leak: limit buffer size
    const MAX_BUFFER_SIZE = this.config.maxBufferSize || 100;
    if (this.eventBuffer.length >= MAX_BUFFER_SIZE) {
      // Drop oldest events to prevent unbounded growth
      const dropped = this.eventBuffer.shift();
      console.warn(
        "⚠️ Event buffer full, dropping oldest event:",
        dropped?.event_type
      );
    }

    this.eventBuffer.push(event);

    // Send batch when buffer is full
    if (this.eventBuffer.length >= this.config.batchSize) {
      this.sendBufferedEvents();
    }

    // Also send batch periodically
    // Clear existing timeout to prevent race condition
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
    this.batchTimeout = setTimeout(() => {
      this.sendBufferedEvents();
      this.batchTimeout = null;
    }, 10000); // Send every 10 seconds
  }

  /**
   * Send buffered events to server
   */
  async sendBufferedEvents() {
    if (!this.eventBuffer || this.eventBuffer.length === 0) return;

    const events = [...this.eventBuffer];
    this.eventBuffer = [];

    try {
      // Get anon key for authentication
      const anonKey = await this.getAnonKey();
      if (!anonKey) {
        console.warn("No anon key available for analytics");
        return;
      }

      const response = await fetch(
        `${this.baseUrl}/functions/v1/${this.functionName}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${anonKey}`,
            apikey: anonKey,
          },
          body: JSON.stringify({
            events: events,
            batch_size: events.length,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Analytics API error: ${response.status} - ${errorText}`
        );
      }

      const result = await response.json();
      console.log(`📊 Sent ${events.length} analytics events:`, result);
    } catch (error) {
      console.error("Failed to send analytics events:", error);

      // Retry logic - add events back to buffer
      if (!this.retryCount) this.retryCount = 0;
      if (this.retryCount < this.config.maxRetries) {
        this.eventBuffer = [...events, ...this.eventBuffer];
        this.retryCount++;

        setTimeout(() => {
          this.sendBufferedEvents();
        }, 5000 * this.retryCount); // Exponential backoff
      } else {
        console.warn("Max retries reached, dropping analytics events");
        this.retryCount = 0;
      }
    }
  }

  /**
   * Get anon key using the key manager
   */
  async getAnonKey() {
    try {
      // Try to use the global key manager if available
      if (typeof window !== "undefined" && window.SupabaseKeyManager) {
        const keyManager = new window.SupabaseKeyManager();
        return await keyManager.getAnonKey();
      }

      // Fallback: direct fetch
      const response = await fetch(`${this.baseUrl}/functions/v1/get-anon-key`);
      if (response.ok) {
        const data = await response.json();
        return data.anon_key;
      }
    } catch (error) {
      console.error("Failed to get anon key for analytics:", error);
    }
    return null;
  }

  /**
   * Get analytics summary
   */
  getAnalyticsSummary() {
    return {
      session_id: this.sessionId,
      user_id: this.userId,
      session_duration: Date.now() - this.startTime,
      pages_viewed: this.pageViews.length + (this.currentPage ? 1 : 0),
      current_page: this.currentPage?.page || null,
      total_interactions: this.pageViews.reduce(
        (sum, page) => sum + page.interactions.length,
        0
      ),
      is_active: this.isActive,
    };
  }

  /**
   * Disable tracking
   */
  disable() {
    this.trackingEnabled = false;
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    console.log("🔍 User Analytics disabled");
  }

  /**
   * Enable tracking
   */
  enable() {
    this.trackingEnabled = true;
    this.startHeartbeat();
    console.log("🔍 User Analytics enabled");
  }
}

// Auto-initialize if in browser
if (typeof window !== "undefined") {
  window.UserAnalytics = UserAnalytics;

  // Auto-start tracking
  document.addEventListener("DOMContentLoaded", () => {
    if (!window.analyticsTracker) {
      window.analyticsTracker = new UserAnalytics({
        heartbeatInterval: 30000, // 30 seconds
        batchSize: 5, // Smaller batches for faster sending
      });
    }
  });
}

// Export for use
if (typeof module !== "undefined" && module.exports) {
  module.exports = UserAnalytics;
}
