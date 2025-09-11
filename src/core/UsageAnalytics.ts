/**
 * نظام إحصائيات الاستخدام المتقدم
 */

export interface UsageMetric {
  name: string;
  category: 'user_action' | 'system_event' | 'performance' | 'business';
  value: number;
  unit?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface UsageReport {
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalEvents: number;
    uniqueFeatures: number;
    averageSessionTime: number;
    peakHour: string;
  };
  features: {
    name: string;
    usage: number;
    trend: 'up' | 'down' | 'stable';
  }[];
  performance: {
    averageLoadTime: number;
    errorRate: number;
    memoryUsage: number;
  };
  business: {
    totalSales: number;
    totalProducts: number;
    totalTransactions: number;
  };
}

export interface SessionInfo {
  sessionId: string;
  startTime: string;
  endTime?: string;
  actions: number;
  features: string[];
  duration?: number;
}

class UsageAnalyticsSystem {
  private metrics: UsageMetric[] = [];
  private sessions: Map<string, SessionInfo> = new Map();
  private currentSessionId: string;
  private sessionStartTime: string;
  private isTracking: boolean = false;

  constructor() {
    this.currentSessionId = this.generateSessionId();
    this.sessionStartTime = new Date().toISOString();
    this.initializeTracking();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeTracking(): void {
    // تتبع أحداث النظام
    this.setupSystemEventTracking();
    
    // بدء الجلسة
    this.startSession();
    
    // تتبع إغلاق النافذة
    window.addEventListener('beforeunload', () => {
      this.endSession();
    });

    // تتبع visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent('system_event', 'page_hidden');
      } else {
        this.trackEvent('system_event', 'page_visible');
      }
    });
  }

  private setupSystemEventTracking(): void {
    // تتبع الأخطاء
    window.addEventListener('error', (event) => {
      this.trackEvent('system_event', 'error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno
      });
    });

    // تتبع النقرات العامة
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const elementType = target.tagName.toLowerCase();
      
      this.trackEvent('user_action', 'click', {
        elementType,
        className: target.className,
        id: target.id
      });
    });
  }

  // بدء التتبع
  startTracking(): void {
    if (this.isTracking) {
      return;
    }

    this.isTracking = true;
    console.log('Usage analytics started');
    
    // إرسال إحصائيات دورية
    setInterval(() => {
      this.sendPerformanceMetrics();
    }, 60000); // كل دقيقة
  }

  // إيقاف التتبع
  stopTracking(): void {
    this.isTracking = false;
    this.endSession();
    console.log('Usage analytics stopped');
  }

  // تتبع حدث
  trackEvent(category: UsageMetric['category'], name: string, metadata?: Record<string, any>): void {
    if (!this.isTracking) {
      return;
    }

    const metric: UsageMetric = {
      name,
      category,
      value: 1,
      timestamp: new Date().toISOString(),
      metadata
    };

    this.metrics.push(metric);
    
    // تحديث معلومات الجلسة
    const session = this.sessions.get(this.currentSessionId);
    if (session) {
      session.actions++;
      if (!session.features.includes(name)) {
        session.features.push(name);
      }
    }

    // حفظ في التخزين المحلي
    this.saveMetrics();
    
    console.log('Event tracked:', { category, name, metadata });
  }

  // تتبع قيمة مخصصة
  trackMetric(category: UsageMetric['category'], name: string, value: number, unit?: string, metadata?: Record<string, any>): void {
    if (!this.isTracking) {
      return;
    }

    const metric: UsageMetric = {
      name,
      category,
      value,
      unit,
      timestamp: new Date().toISOString(),
      metadata
    };

    this.metrics.push(metric);
    this.saveMetrics();
    
    console.log('Metric tracked:', { category, name, value, unit });
  }

  // تتبع استخدام الميزات
  trackFeatureUsage(featureName: string, action: string, metadata?: Record<string, any>): void {
    this.trackEvent('user_action', `${featureName}_${action}`, {
      feature: featureName,
      action,
      ...metadata
    });
  }

  // تتبع العمليات التجارية
  trackBusinessEvent(eventType: 'sale' | 'purchase' | 'payment' | 'refund', amount?: number, metadata?: Record<string, any>): void {
    this.trackEvent('business', eventType, {
      amount,
      ...metadata
    });

    if (amount) {
      this.trackMetric('business', `${eventType}_amount`, amount, 'currency', metadata);
    }
  }

  // تتبع الأداء
  trackPerformance(metric: 'load_time' | 'api_response' | 'render_time', value: number, metadata?: Record<string, any>): void {
    this.trackMetric('performance', metric, value, 'ms', metadata);
  }

  // إرسال إحصائيات الأداء
  private sendPerformanceMetrics(): void {
    // معلومات الذاكرة
    const memory = (performance as any).memory;
    if (memory) {
      this.trackMetric('performance', 'memory_used', memory.usedJSHeapSize, 'bytes');
      this.trackMetric('performance', 'memory_total', memory.totalJSHeapSize, 'bytes');
    }

    // معلومات الاتصال
    const connection = (navigator as any).connection;
    if (connection) {
      this.trackMetric('performance', 'connection_speed', connection.downlink, 'mbps', {
        effectiveType: connection.effectiveType,
        rtt: connection.rtt
      });
    }

    // إحصائيات الجلسة
    const session = this.sessions.get(this.currentSessionId);
    if (session) {
      const sessionDuration = Date.now() - new Date(session.startTime).getTime();
      this.trackMetric('user_action', 'session_duration', sessionDuration, 'ms');
    }
  }

  // بدء جلسة جديدة
  private startSession(): void {
    const session: SessionInfo = {
      sessionId: this.currentSessionId,
      startTime: this.sessionStartTime,
      actions: 0,
      features: []
    };

    this.sessions.set(this.currentSessionId, session);
    this.trackEvent('system_event', 'session_start');
  }

  // إنهاء الجلسة الحالية
  private endSession(): void {
    const session = this.sessions.get(this.currentSessionId);
    if (session && !session.endTime) {
      const endTime = new Date().toISOString();
      const duration = new Date(endTime).getTime() - new Date(session.startTime).getTime();

      session.endTime = endTime;
      session.duration = duration;

      this.trackEvent('system_event', 'session_end', {
        duration,
        actions: session.actions,
        features: session.features.length
      });

      this.saveSession(session);
    }
  }

  // حفظ الإحصائيات
  private saveMetrics(): void {
    try {
      // الاحتفاظ بآخر 10000 metric
      if (this.metrics.length > 10000) {
        this.metrics = this.metrics.slice(-10000);
      }

      localStorage.setItem('usage_metrics', JSON.stringify(this.metrics));
    } catch (error) {
      console.error('Failed to save metrics:', error);
    }
  }

  // حفظ معلومات الجلسة
  private saveSession(session: SessionInfo): void {
    try {
      const sessions = this.getSavedSessions();
      sessions.push(session);

      // الاحتفاظ بآخر 1000 جلسة
      if (sessions.length > 1000) {
        sessions.splice(0, sessions.length - 1000);
      }

      localStorage.setItem('usage_sessions', JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  // استرداد الجلسات المحفوظة
  private getSavedSessions(): SessionInfo[] {
    try {
      const saved = localStorage.getItem('usage_sessions');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load sessions:', error);
      return [];
    }
  }

  // تحميل الإحصائيات المحفوظة
  loadSavedMetrics(): void {
    try {
      const saved = localStorage.getItem('usage_metrics');
      if (saved) {
        this.metrics = JSON.parse(saved);
        console.log('Loaded saved metrics:', this.metrics.length);
      }
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  }

  // إنشاء تقرير الاستخدام
  generateUsageReport(startDate?: string, endDate?: string): UsageReport {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // آخر 7 أيام
    const end = endDate ? new Date(endDate) : new Date();

    // فلترة الإحصائيات حسب الفترة
    const periodMetrics = this.metrics.filter(metric => {
      const metricDate = new Date(metric.timestamp);
      return metricDate >= start && metricDate <= end;
    });

    // تحليل الميزات
    const featureUsage = new Map<string, number>();
    const hourlyUsage = new Map<number, number>();

    periodMetrics.forEach(metric => {
      // إحصائيات الميزات
      if (metric.category === 'user_action') {
        featureUsage.set(metric.name, (featureUsage.get(metric.name) || 0) + 1);
      }

      // إحصائيات الساعات
      const hour = new Date(metric.timestamp).getHours();
      hourlyUsage.set(hour, (hourlyUsage.get(hour) || 0) + 1);
    });

    // أكثر الساعات استخداماً
    const peakHour = Array.from(hourlyUsage.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 0;

    // الميزات الأكثر استخداماً
    const topFeatures = Array.from(featureUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, usage]) => ({
        name,
        usage,
        trend: 'stable' as const // يمكن تحسين هذا بمقارنة الفترات
      }));

    // إحصائيات الأداء
    const performanceMetrics = periodMetrics.filter(m => m.category === 'performance');
    const loadTimes = performanceMetrics.filter(m => m.name === 'load_time');
    const memoryMetrics = performanceMetrics.filter(m => m.name === 'memory_used');

    // إحصائيات الأعمال
    const businessMetrics = periodMetrics.filter(m => m.category === 'business');
    const sales = businessMetrics.filter(m => m.name === 'sale');
    const purchases = businessMetrics.filter(m => m.name === 'purchase');

    // معلومات الجلسات
    const sessions = this.getSavedSessions().filter(session => {
      const sessionDate = new Date(session.startTime);
      return sessionDate >= start && sessionDate <= end;
    });

    const averageSessionTime = sessions.length > 0 
      ? sessions.reduce((sum, session) => sum + (session.duration || 0), 0) / sessions.length 
      : 0;

    return {
      period: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      summary: {
        totalEvents: periodMetrics.length,
        uniqueFeatures: featureUsage.size,
        averageSessionTime: Math.round(averageSessionTime / 1000), // تحويل إلى ثواني
        peakHour: `${peakHour}:00`
      },
      features: topFeatures,
      performance: {
        averageLoadTime: loadTimes.length > 0 
          ? loadTimes.reduce((sum, m) => sum + m.value, 0) / loadTimes.length 
          : 0,
        errorRate: (periodMetrics.filter(m => m.name === 'error').length / periodMetrics.length) * 100,
        memoryUsage: memoryMetrics.length > 0 
          ? memoryMetrics[memoryMetrics.length - 1].value 
          : 0
      },
      business: {
        totalSales: sales.reduce((sum, m) => sum + (m.metadata?.amount || 0), 0),
        totalProducts: businessMetrics.filter(m => m.name.includes('product')).length,
        totalTransactions: businessMetrics.length
      }
    };
  }

  // إحصائيات الوقت الفعلي
  getRealTimeStats(): any {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const todayMetrics = this.metrics.filter(metric => 
      new Date(metric.timestamp) >= today
    );

    const currentSession = this.sessions.get(this.currentSessionId);

    return {
      today: {
        events: todayMetrics.length,
        features: new Set(todayMetrics.map(m => m.name)).size,
        errors: todayMetrics.filter(m => m.name === 'error').length
      },
      session: {
        id: this.currentSessionId,
        duration: currentSession 
          ? Date.now() - new Date(currentSession.startTime).getTime()
          : 0,
        actions: currentSession?.actions || 0,
        features: currentSession?.features.length || 0
      },
      system: {
        isTracking: this.isTracking,
        totalMetrics: this.metrics.length,
        totalSessions: this.sessions.size
      }
    };
  }

  // تصدير البيانات
  exportData(): any {
    return {
      metrics: this.metrics,
      sessions: Array.from(this.sessions.values()),
      currentSession: this.currentSessionId,
      exportedAt: new Date().toISOString()
    };
  }

  // مسح البيانات القديمة
  clearOldData(daysToKeep: number = 30): void {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    
    // مسح الإحصائيات القديمة
    this.metrics = this.metrics.filter(metric => 
      new Date(metric.timestamp) >= cutoffDate
    );

    // مسح الجلسات القديمة
    const sessions = this.getSavedSessions().filter(session =>
      new Date(session.startTime) >= cutoffDate
    );

    localStorage.setItem('usage_sessions', JSON.stringify(sessions));
    this.saveMetrics();

    console.log(`Cleared data older than ${daysToKeep} days`);
  }
}

// إنشاء instance وحيد
export const usageAnalytics = new UsageAnalyticsSystem();