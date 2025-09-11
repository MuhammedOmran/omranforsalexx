/**
 * إعدادات تحسين الأداء العامة للتطبيق
 */

// إعدادات التحميل المحسنة
export const LOADING_CONFIG = {
  // الحد الأدنى لوقت التحميل (تقليل للحصول على استجابة أسرع)
  MIN_LOADING_TIME: 10,
  
  // الحد الأقصى لوقت التحميل قبل إظهار رسالة خطأ
  MAX_LOADING_TIME: 3000,
  
  // وقت تأخير skeleton loaders (تقليل للاستجابة السريعة)
  SKELETON_DELAY: 25,
  
  // وقت إنتظار قبل إظهار مؤشر التحميل (فوري تقريباً)
  LOADING_INDICATOR_DELAY: 50
};

// إعدادات التحميل المسبق
export const PRELOADING_CONFIG = {
  // الصفحات التي يجب تحميلها مسبقاً
  CRITICAL_ROUTES: [
    '/sales/invoices',
    '/sales/customers', 
    '/inventory/products',
    '/sales/dashboard'
  ],
  
  // عدد الصفحات التي يتم تحميلها في دفعة واحدة
  BATCH_SIZE: 3,
  
  // وقت التأخير قبل بدء التحميل المسبق
  PRELOAD_DELAY: 1000
};

// إعدادات ذاكرة التخزين المؤقت
export const CACHE_CONFIG = {
  // مدة الاحتفاظ بالبيانات في الذاكرة (بالميلي ثانية)
  DEFAULT_TTL: 5 * 60 * 1000, // 5 دقائق
  
  // الحد الأقصى لحجم الذاكرة المؤقتة
  MAX_CACHE_SIZE: 50,
  
  // المفاتيح التي لا تنتهي صلاحيتها
  PERSISTENT_KEYS: [
    'user_preferences',
    'app_settings',
    'cached_products'
  ]
};

// إعدادات تحسين الشبكة
export const NETWORK_CONFIG = {
  // مهلة انتظار الطلبات (بالميلي ثانية)
  REQUEST_TIMEOUT: 10000,
  
  // عدد محاولات إعادة الطلب
  RETRY_ATTEMPTS: 3,
  
  // وقت التأخير بين المحاولات
  RETRY_DELAY: 1000,
  
  // حجم البيانات المحلية القصوى
  MAX_LOCAL_STORAGE: 10 * 1024 * 1024 // 10MB
};

// كشف الأجهزة البطيئة
export function detectSlowDevice(): boolean {
  // فحص ذاكرة الجهاز
  const memory = (navigator as any).deviceMemory;
  if (memory && memory < 4) return true;
  
  // فحص عدد المعالجات
  const cores = navigator.hardwareConcurrency;
  if (cores && cores < 4) return true;
  
  // فحص User Agent للأجهزة القديمة
  const userAgent = navigator.userAgent.toLowerCase();
  const oldDevicePatterns = [
    'android 4', 'android 5', 'android 6',
    'iphone os 12', 'iphone os 13',
    'chrome/6', 'chrome/7', 'chrome/8'
  ];
  
  return oldDevicePatterns.some(pattern => userAgent.includes(pattern));
}

// تطبيق إعدادات الأداء حسب الجهاز
export function getOptimizedConfig() {
  const isSlowDevice = detectSlowDevice();
  
  return {
    loadingTime: isSlowDevice ? LOADING_CONFIG.MIN_LOADING_TIME / 2 : LOADING_CONFIG.MIN_LOADING_TIME,
    enableAnimations: !isSlowDevice,
    preloadRoutes: !isSlowDevice,
    cacheSize: isSlowDevice ? CACHE_CONFIG.MAX_CACHE_SIZE / 2 : CACHE_CONFIG.MAX_CACHE_SIZE,
    optimizeImages: isSlowDevice,
    enableVirtualization: isSlowDevice
  };
}

// مراقب الأداء البسيط
export class SimplePerformanceMonitor {
  private metrics: { [key: string]: number } = {};
  private timers: { [key: string]: number } = {};
  
  startTimer(label: string) {
    this.timers[label] = performance.now();
  }
  
  endTimer(label: string) {
    if (this.timers[label]) {
      this.metrics[label] = performance.now() - this.timers[label];
      delete this.timers[label];
    }
  }
  
  getMetric(label: string): number {
    return this.metrics[label] || 0;
  }
  
  getAllMetrics() {
    return { ...this.metrics };
  }
  
  logSlowOperations(threshold: number = 1000) {
    Object.entries(this.metrics).forEach(([label, time]) => {
      if (time > threshold) {
        console.warn(`⚠️ عملية بطيئة: ${label} - ${time.toFixed(2)}ms`);
      }
    });
  }
}

// مثيل مراقب الأداء العام
export const performanceMonitor = new SimplePerformanceMonitor();