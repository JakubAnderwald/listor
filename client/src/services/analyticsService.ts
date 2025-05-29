// Performance monitoring and analytics service
class AnalyticsService {
  private isInitialized = false;

  initialize() {
    if (this.isInitialized) return;
    
    // Track page views and user interactions
    this.trackPageLoad();
    this.setupPerformanceMonitoring();
    this.setupErrorTracking();
    
    this.isInitialized = true;
  }

  private trackPageLoad() {
    // Track initial page load performance
    window.addEventListener('load', () => {
      if (window.performance && window.performance.timing) {
        const timing = window.performance.timing;
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        this.trackEvent('page_load', { load_time: loadTime });
      }
    });
  }

  private setupPerformanceMonitoring() {
    // Monitor Core Web Vitals
    if ('PerformanceObserver' in window) {
      try {
        // Largest Contentful Paint (LCP)
        const lcpObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.trackEvent('lcp', { value: entry.startTime });
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.trackEvent('fid', { value: entry.processingStart - entry.startTime });
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift (CLS)
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          if (clsValue > 0) {
            this.trackEvent('cls', { value: clsValue });
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        console.warn('Performance monitoring not fully supported:', error);
      }
    }
  }

  private setupErrorTracking() {
    window.addEventListener('error', (event) => {
      this.trackError(event.error, 'javascript_error');
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(event.reason, 'unhandled_promise_rejection');
    });
  }

  trackEvent(eventName: string, properties: Record<string, any> = {}) {
    const event = {
      name: eventName,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...properties
    };

    // Store locally for potential batch sending
    this.storeEvent(event);
    
    console.log('Analytics Event:', event);
  }

  trackError(error: Error, type: string) {
    const errorEvent = {
      name: 'error',
      type,
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      url: window.location.href
    };

    this.storeEvent(errorEvent);
    console.error('Error tracked:', errorEvent);
  }

  trackUserAction(action: string, details: Record<string, any> = {}) {
    this.trackEvent('user_action', { action, ...details });
  }

  private storeEvent(event: any) {
    try {
      const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
      events.push(event);
      
      // Keep only last 100 events
      if (events.length > 100) {
        events.splice(0, events.length - 100);
      }
      
      localStorage.setItem('analytics_events', JSON.stringify(events));
    } catch (error) {
      console.warn('Failed to store analytics event:', error);
    }
  }

  getStoredEvents() {
    try {
      return JSON.parse(localStorage.getItem('analytics_events') || '[]');
    } catch {
      return [];
    }
  }

  clearStoredEvents() {
    localStorage.removeItem('analytics_events');
  }
}

export const analytics = new AnalyticsService();