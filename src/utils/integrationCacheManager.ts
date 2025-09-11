/**
 * نظام إدارة التخزين المؤقت المحسن لنظام التكامل
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
  size: number;
}

interface CacheConfig {
  maxSize: number; // بالميجابايت
  defaultTTL: number; // بالثواني
  maxEntries: number;
}

export class IntegrationCacheManager {
  private cache = new Map<string, CacheEntry>();
  private sizeTracker = 0;
  private config: CacheConfig = {
    maxSize: 50, // 50 MB
    defaultTTL: 300, // 5 دقائق
    maxEntries: 1000
  };

  // تعيين البيانات في الكاش
  set(key: string, data: any, ttl?: number): void {
    const now = Date.now();
    const expirationTime = ttl || this.config.defaultTTL;
    const entry: CacheEntry = {
      data: this.deepClone(data),
      timestamp: now,
      expiresAt: now + (expirationTime * 1000),
      size: this.estimateSize(data)
    };

    // تنظيف الكاش إذا تجاوز الحد الأقصى
    this.cleanup();

    // حذف المفتاح القديم إذا كان موجوداً
    if (this.cache.has(key)) {
      this.sizeTracker -= this.cache.get(key)!.size;
    }

    this.cache.set(key, entry);
    this.sizeTracker += entry.size;

    // تسجيل إحصائيات الكاش
    this.logCacheStats();
  }

  // استرجاع البيانات من الكاش
  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // التحقق من انتهاء الصلاحية
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return null;
    }

    return this.deepClone(entry.data);
  }

  // التحقق من وجود المفتاح
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return false;
    }
    
    return true;
  }

  // حذف مفتاح معين
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.sizeTracker -= entry.size;
      return this.cache.delete(key);
    }
    return false;
  }

  // مسح الكاش بالكامل
  clear(): void {
    this.cache.clear();
    this.sizeTracker = 0;
  }

  // تنظيف البيانات المنتهية الصلاحية والزائدة
  private cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());

    // حذف البيانات المنتهية الصلاحية
    entries.forEach(([key, entry]) => {
      if (now > entry.expiresAt) {
        this.delete(key);
      }
    });

    // حذف أقدم البيانات إذا تجاوز الحد الأقصى
    if (this.cache.size > this.config.maxEntries) {
      const sortedEntries = entries
        .filter(([key]) => this.cache.has(key))
        .sort((a, b) => a[1].timestamp - b[1].timestamp);

      const toDelete = sortedEntries.slice(0, this.cache.size - this.config.maxEntries);
      toDelete.forEach(([key]) => this.delete(key));
    }

    // حذف البيانات إذا تجاوز الحد الأقصى للحجم
    if (this.sizeTracker > this.config.maxSize * 1024 * 1024) {
      this.cleanupBySize();
    }
  }

  // تنظيف حسب الحجم
  private cleanupBySize(): void {
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);

    const targetSize = this.config.maxSize * 0.7 * 1024 * 1024; // 70% من الحد الأقصى

    while (this.sizeTracker > targetSize && entries.length > 0) {
      const [key] = entries.shift()!;
      this.delete(key);
    }
  }

  // تقدير حجم البيانات
  private estimateSize(data: any): number {
    return JSON.stringify(data).length * 2; // تقدير تقريبي
  }

  // نسخ عميق للبيانات
  private deepClone(obj: any): any {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    if (typeof obj === 'object') {
      const copy: any = {};
      Object.keys(obj).forEach(key => {
        copy[key] = this.deepClone(obj[key]);
      });
      return copy;
    }
  }

  // إحصائيات الكاش
  getStats() {
    const now = Date.now();
    let expiredCount = 0;
    
    this.cache.forEach(entry => {
      if (now > entry.expiresAt) expiredCount++;
    });

    return {
      totalEntries: this.cache.size,
      expiredEntries: expiredCount,
      totalSizeMB: (this.sizeTracker / (1024 * 1024)).toFixed(2),
      maxSizeMB: this.config.maxSize,
      utilizationPercent: ((this.sizeTracker / (this.config.maxSize * 1024 * 1024)) * 100).toFixed(1)
    };
  }

  // تسجيل إحصائيات الكاش
  private logCacheStats(): void {
    if (this.cache.size % 50 === 0) { // كل 50 عنصر
      const stats = this.getStats();
      console.log('📊 إحصائيات الكاش:', stats);
    }
  }

  // تحديث إعدادات الكاش
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.cleanup(); // تنظيف فوري بعد التحديث
  }

  // الحصول على مفاتيح الكاش المطابقة لنمط معين
  getKeysByPattern(pattern: string): string[] {
    const regex = new RegExp(pattern);
    return Array.from(this.cache.keys()).filter(key => regex.test(key));
  }

  // حذف مفاتيح متعددة بنمط معين
  deleteByPattern(pattern: string): number {
    const keys = this.getKeysByPattern(pattern);
    keys.forEach(key => this.delete(key));
    return keys.length;
  }

  // تحديث جزئي للبيانات
  update(key: string, updater: (data: any) => any): boolean {
    const data = this.get(key);
    if (data === null) return false;
    
    const updatedData = updater(data);
    this.set(key, updatedData);
    return true;
  }
}

// إنشاء مثيل واحد للكاش
export const integrationCache = new IntegrationCacheManager();

// مساعدات للاستخدام السهل
export const cacheKeys = {
  // مفاتيح تقارير التكامل
  integrationReport: 'integration_report',
  systemEvaluation: 'system_evaluation',
  smartLinkingResult: 'smart_linking_result',
  
  // مفاتيح البيانات
  customers: 'customers_data',
  suppliers: 'suppliers_data',
  products: 'products_data',
  sales: 'sales_data',
  purchases: 'purchases_data',
  
  // مفاتيح التحليلات
  performanceMetrics: 'performance_metrics',
  integrationMetrics: 'integration_metrics',
  
  // مولد المفاتيح الديناميكية
  customerIntegration: (customerId: string) => `customer_integration_${customerId}`,
  supplierIntegration: (supplierId: string) => `supplier_integration_${supplierId}`,
  entityIntegration: (entityType: string, entityId: string) => `entity_integration_${entityType}_${entityId}`
};