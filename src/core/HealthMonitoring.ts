/**
 * نظام المراقبة الصحية والفحوصات الدورية
 */

export interface HealthCheck {
  name: string;
  description: string;
  category: 'database' | 'api' | 'system' | 'integration' | 'performance';
  enabled: boolean;
  interval: number; // milliseconds
  timeout: number; // milliseconds
  retryCount: number;
  lastRun?: string;
  lastResult?: HealthCheckResult;
}

export interface HealthCheckResult {
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  message: string;
  responseTime: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'down';
  score: number; // 0-100
  checks: Record<string, HealthCheckResult>;
  summary: {
    total: number;
    healthy: number;
    warning: number;
    critical: number;
  };
  lastUpdated: string;
}

class HealthMonitoringSystem {
  private checks: Map<string, HealthCheck> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private results: Map<string, HealthCheckResult[]> = new Map();
  private isRunning: boolean = false;

  constructor() {
    this.initializeDefaultChecks();
  }

  private initializeDefaultChecks(): void {
    // فحص قاعدة البيانات المحلية
    this.registerHealthCheck({
      name: 'local-storage',
      description: 'فحص توفر التخزين المحلي',
      category: 'database',
      enabled: true,
      interval: 30000, // 30 ثانية
      timeout: 5000,
      retryCount: 3
    });

    // فحص أداء النظام
    this.registerHealthCheck({
      name: 'system-performance',
      description: 'فحص أداء النظام والذاكرة',
      category: 'performance',
      enabled: true,
      interval: 60000, // دقيقة
      timeout: 10000,
      retryCount: 2
    });

    // فحص الـ plugins
    this.registerHealthCheck({
      name: 'plugins-status',
      description: 'فحص حالة الوحدات المحملة',
      category: 'system',
      enabled: true,
      interval: 120000, // دقيقتان
      timeout: 5000,
      retryCount: 1
    });

    // فحص التكاملات
    this.registerHealthCheck({
      name: 'integrations-health',
      description: 'فحص صحة التكاملات الخارجية',
      category: 'integration',
      enabled: true,
      interval: 300000, // 5 دقائق
      timeout: 15000,
      retryCount: 3
    });

    // فحص APIs الداخلية
    this.registerHealthCheck({
      name: 'internal-apis',
      description: 'فحص APIs الداخلية',
      category: 'api',
      enabled: true,
      interval: 45000, // 45 ثانية
      timeout: 8000,
      retryCount: 2
    });
  }

  // تسجيل فحص صحي جديد
  registerHealthCheck(check: HealthCheck): void {
    this.checks.set(check.name, check);
    console.log(`Health check '${check.name}' registered`);
  }

  // إلغاء تسجيل فحص صحي
  unregisterHealthCheck(name: string): boolean {
    if (!this.checks.has(name)) {
      return false;
    }

    this.stopHealthCheck(name);
    this.checks.delete(name);
    this.results.delete(name);
    
    console.log(`Health check '${name}' unregistered`);
    return true;
  }

  // بدء المراقبة
  startMonitoring(): void {
    if (this.isRunning) {
      console.warn('Health monitoring is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting health monitoring system...');

    // بدء جميع الفحوصات المفعلة
    for (const [name, check] of this.checks) {
      if (check.enabled) {
        this.startHealthCheck(name);
      }
    }

    console.log('Health monitoring system started successfully');
  }

  // إيقاف المراقبة
  stopMonitoring(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    console.log('Stopping health monitoring system...');

    // إيقاف جميع الفحوصات
    for (const name of this.checks.keys()) {
      this.stopHealthCheck(name);
    }

    console.log('Health monitoring system stopped');
  }

  // بدء فحص صحي محدد
  private startHealthCheck(name: string): void {
    const check = this.checks.get(name);
    if (!check || !check.enabled) {
      return;
    }

    // إيقاف الفحص السابق إذا كان موجوداً
    this.stopHealthCheck(name);

    // تشغيل الفحص فوراً
    this.executeHealthCheck(name);

    // جدولة الفحص الدوري
    const interval = setInterval(() => {
      this.executeHealthCheck(name);
    }, check.interval);

    this.intervals.set(name, interval);
    console.log(`Health check '${name}' started with interval ${check.interval}ms`);
  }

  // إيقاف فحص صحي محدد
  private stopHealthCheck(name: string): void {
    const interval = this.intervals.get(name);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(name);
      console.log(`Health check '${name}' stopped`);
    }
  }

  // تنفيذ فحص صحي
  private async executeHealthCheck(name: string): Promise<HealthCheckResult> {
    const check = this.checks.get(name);
    if (!check) {
      throw new Error(`Health check '${name}' not found`);
    }

    const startTime = Date.now();
    let result: HealthCheckResult;

    try {
      // تنفيذ الفحص حسب النوع
      const checkResult = await this.performCheck(name, check);
      
      result = {
        ...checkResult,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      result = {
        status: 'critical',
        message: `فشل الفحص: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }

    // حفظ النتيجة
    this.saveCheckResult(name, result);
    
    // تحديث الفحص
    check.lastRun = result.timestamp;
    check.lastResult = result;

    // تسجيل النتيجة
    if (result.status === 'critical') {
      console.error(`Health check '${name}' failed:`, result.message);
    } else if (result.status === 'warning') {
      console.warn(`Health check '${name}' warning:`, result.message);
    } else {
      console.log(`Health check '${name}' passed:`, result.message);
    }

    return result;
  }

  // تنفيذ الفحص الفعلي
  private async performCheck(name: string, check: HealthCheck): Promise<Omit<HealthCheckResult, 'responseTime' | 'timestamp'>> {
    switch (name) {
      case 'local-storage':
        return this.checkLocalStorage();
      
      case 'system-performance':
        return this.checkSystemPerformance();
      
      case 'plugins-status':
        return this.checkPluginsStatus();
      
      case 'integrations-health':
        return this.checkIntegrationsHealth();
      
      case 'internal-apis':
        return this.checkInternalAPIs();
      
      default:
        throw new Error(`Unknown health check: ${name}`);
    }
  }

  // فحص التخزين المحلي
  private async checkLocalStorage(): Promise<Omit<HealthCheckResult, 'responseTime' | 'timestamp'>> {
    try {
      const testKey = 'health-check-test';
      const testValue = Date.now().toString();
      
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      if (retrieved === testValue) {
        return {
          status: 'healthy',
          message: 'التخزين المحلي يعمل بشكل طبيعي'
        };
      } else {
        return {
          status: 'critical',
          message: 'فشل في قراءة/كتابة التخزين المحلي'
        };
      }
    } catch (error) {
      return {
        status: 'critical',
        message: `خطأ في التخزين المحلي: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
      };
    }
  }

  // فحص أداء النظام
  private async checkSystemPerformance(): Promise<Omit<HealthCheckResult, 'responseTime' | 'timestamp'>> {
    try {
      const memory = (performance as any).memory;
      const memoryUsage = memory ? (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100 : 0;
      
      if (memoryUsage > 90) {
        return {
          status: 'critical',
          message: `استخدام الذاكرة مرتفع جداً: ${memoryUsage.toFixed(2)}%`,
          metadata: { memoryUsage }
        };
      } else if (memoryUsage > 75) {
        return {
          status: 'warning',
          message: `استخدام الذاكرة مرتفع: ${memoryUsage.toFixed(2)}%`,
          metadata: { memoryUsage }
        };
      } else {
        return {
          status: 'healthy',
          message: `أداء النظام جيد - استخدام الذاكرة: ${memoryUsage.toFixed(2)}%`,
          metadata: { memoryUsage }
        };
      }
    } catch (error) {
      return {
        status: 'warning',
        message: 'لا يمكن قراءة معلومات الأداء'
      };
    }
  }

  // فحص حالة الـ plugins
  private async checkPluginsStatus(): Promise<Omit<HealthCheckResult, 'responseTime' | 'timestamp'>> {
    try {
      const { pluginSystem } = await import('@/core/PluginSystem');
      const plugins = pluginSystem.getAllPlugins();
      
      if (plugins.length === 0) {
        return {
          status: 'warning',
          message: 'لا توجد وحدات محملة'
        };
      }

      return {
        status: 'healthy',
        message: `تم تحميل ${plugins.length} وحدة بنجاح`,
        metadata: { pluginCount: plugins.length }
      };
    } catch (error) {
      return {
        status: 'critical',
        message: `خطأ في فحص الوحدات: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
      };
    }
  }

  // فحص صحة التكاملات
  private async checkIntegrationsHealth(): Promise<Omit<HealthCheckResult, 'responseTime' | 'timestamp'>> {
    try {
      // فحص تكامل قاعدة البيانات
      const dbCheck = localStorage.getItem('products') !== null;
      const salesCheck = localStorage.getItem('salesInvoices') !== null;
      const cashFlowCheck = localStorage.getItem('cashFlowTransactions') !== null;

      const healthyIntegrations = [dbCheck, salesCheck, cashFlowCheck].filter(Boolean).length;
      const totalIntegrations = 3;

      if (healthyIntegrations === totalIntegrations) {
        return {
          status: 'healthy',
          message: 'جميع التكاملات تعمل بشكل طبيعي',
          metadata: { healthy: healthyIntegrations, total: totalIntegrations }
        };
      } else if (healthyIntegrations > 0) {
        return {
          status: 'warning',
          message: `${healthyIntegrations}/${totalIntegrations} تكاملات تعمل`,
          metadata: { healthy: healthyIntegrations, total: totalIntegrations }
        };
      } else {
        return {
          status: 'critical',
          message: 'فشل جميع التكاملات',
          metadata: { healthy: 0, total: totalIntegrations }
        };
      }
    } catch (error) {
      return {
        status: 'critical',
        message: `خطأ في فحص التكاملات: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
      };
    }
  }

  // فحص APIs الداخلية
  private async checkInternalAPIs(): Promise<Omit<HealthCheckResult, 'responseTime' | 'timestamp'>> {
    try {
      // فحص APIs المحلية
      const { businessIntegration } = await import('@/utils/businessIntegration');
      const { inventoryManager } = await import('@/utils/inventoryUtils');
      const { cashFlowManager } = await import('@/utils/cashFlowManager');

      // تجربة عمليات بسيطة
      const analytics = businessIntegration.getBusinessAnalytics();
      const products = inventoryManager.getProducts();
      const transactions = cashFlowManager.getTransactions();

      if (analytics && Array.isArray(products) && Array.isArray(transactions)) {
        return {
          status: 'healthy',
          message: 'جميع APIs الداخلية تعمل بشكل طبيعي',
          metadata: {
            analyticsAvailable: !!analytics,
            productsCount: products.length,
            transactionsCount: transactions.length
          }
        };
      } else {
        return {
          status: 'warning',
          message: 'بعض APIs الداخلية لا تعمل بشكل صحيح'
        };
      }
    } catch (error) {
      return {
        status: 'critical',
        message: `خطأ في APIs الداخلية: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
      };
    }
  }

  // حفظ نتيجة الفحص
  private saveCheckResult(name: string, result: HealthCheckResult): void {
    if (!this.results.has(name)) {
      this.results.set(name, []);
    }

    const results = this.results.get(name)!;
    results.push(result);

    // الاحتفاظ بآخر 100 نتيجة فقط
    if (results.length > 100) {
      results.splice(0, results.length - 100);
    }
  }

  // الحصول على صحة النظام العامة
  getSystemHealth(): SystemHealth {
    const checks: Record<string, HealthCheckResult> = {};
    let healthy = 0;
    let warning = 0;
    let critical = 0;

    for (const [name, check] of this.checks) {
      if (check.lastResult) {
        checks[name] = check.lastResult;
        
        switch (check.lastResult.status) {
          case 'healthy':
            healthy++;
            break;
          case 'warning':
            warning++;
            break;
          case 'critical':
            critical++;
            break;
        }
      }
    }

    const total = this.checks.size;
    const score = total > 0 ? Math.round((healthy / total) * 100) : 100;
    
    let overall: 'healthy' | 'degraded' | 'down';
    if (critical > 0) {
      overall = critical >= total / 2 ? 'down' : 'degraded';
    } else if (warning > 0) {
      overall = 'degraded';
    } else {
      overall = 'healthy';
    }

    return {
      overall,
      score,
      checks,
      summary: { total, healthy, warning, critical },
      lastUpdated: new Date().toISOString()
    };
  }

  // الحصول على تاريخ فحص معين
  getCheckHistory(name: string): HealthCheckResult[] {
    return this.results.get(name) || [];
  }

  // الحصول على جميع الفحوصات
  getAllChecks(): HealthCheck[] {
    return Array.from(this.checks.values());
  }

  // تحديث إعدادات فحص
  updateCheckConfig(name: string, config: Partial<HealthCheck>): boolean {
    const check = this.checks.get(name);
    if (!check) {
      return false;
    }

    const wasEnabled = check.enabled;
    Object.assign(check, config);

    // إعادة تشغيل الفحص إذا تغيرت الإعدادات
    if (this.isRunning && check.enabled) {
      this.startHealthCheck(name);
    } else if (!check.enabled && wasEnabled) {
      this.stopHealthCheck(name);
    }

    return true;
  }

  // تشغيل فحص يدوي
  async runManualCheck(name: string): Promise<HealthCheckResult> {
    const check = this.checks.get(name);
    if (!check) {
      throw new Error(`Health check '${name}' not found`);
    }

    return this.executeHealthCheck(name);
  }

  // تصدير تقرير صحة النظام
  exportHealthReport(): any {
    const systemHealth = this.getSystemHealth();
    const allChecks = this.getAllChecks();
    
    return {
      systemHealth,
      checks: allChecks.map(check => ({
        ...check,
        history: this.getCheckHistory(check.name)
      })),
      exportedAt: new Date().toISOString()
    };
  }
}

// إنشاء instance وحيد
export const healthMonitoring = new HealthMonitoringSystem();