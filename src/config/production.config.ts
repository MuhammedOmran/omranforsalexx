/**
 * إعدادات الإنتاج النهائية
 * Production Configuration
 */

export interface ProductionConfig {
  app: {
    name: string
    version: string
    environment: 'production'
    debugMode: boolean
    analyticsEnabled: boolean
    errorReportingEnabled: boolean
  }
  
  api: {
    baseUrl: string
    timeout: number
    retryAttempts: number
    retryDelay: number
  }

  security: {
    enableCSP: boolean
    enableHSTS: boolean
    sessionTimeout: number
    maxLoginAttempts: number
    lockoutDuration: number
    encryptLocalData: boolean
    auditLogging: boolean
  }

  performance: {
    enableLazyLoading: boolean
    enableCodeSplitting: boolean
    enableCompression: boolean
    cacheStrategy: 'aggressive' | 'moderate' | 'conservative'
    preloadCriticalResources: boolean
    optimizeImages: boolean
    enableServiceWorker: boolean
  }

  monitoring: {
    enablePerformanceMonitoring: boolean
    enableErrorTracking: boolean
    enableUserAnalytics: boolean
    reportingInterval: number
    maxLogRetention: number
  }

  features: {
    offlineMode: boolean
    backupAndRestore: boolean
    multiUserSupport: boolean
    advancedReporting: boolean
    mobileApp: boolean
    printOptimization: boolean
  }
}

export const productionConfig: ProductionConfig = {
  app: {
    name: 'نظام عمران للمبيعات',
    version: '2.0.0',
    environment: 'production',
    debugMode: false,
    analyticsEnabled: true,
    errorReportingEnabled: true
  },

  api: {
    baseUrl: process.env.VITE_API_URL || 'https://api.omran-sales.com',
    timeout: 30000, // 30 ثانية
    retryAttempts: 3,
    retryDelay: 1000 // ثانية واحدة
  },

  security: {
    enableCSP: true,
    enableHSTS: true,
    sessionTimeout: 30 * 60 * 1000, // 30 دقيقة
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 دقيقة
    encryptLocalData: true,
    auditLogging: true
  },

  performance: {
    enableLazyLoading: true,
    enableCodeSplitting: true,
    enableCompression: true,
    cacheStrategy: 'aggressive',
    preloadCriticalResources: true,
    optimizeImages: true,
    enableServiceWorker: true
  },

  monitoring: {
    enablePerformanceMonitoring: true,
    enableErrorTracking: true,
    enableUserAnalytics: true,
    reportingInterval: 5 * 60 * 1000, // 5 دقائق
    maxLogRetention: 30 // 30 يوم
  },

  features: {
    offlineMode: true,
    backupAndRestore: true,
    multiUserSupport: true,
    advancedReporting: true,
    mobileApp: true,
    printOptimization: true
  }
}

// إعدادات الأمان المتقدمة
export const securityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://api.omran-sales.com wss:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '),
  
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
}

// إعدادات التخزين المؤقت
export const cacheConfig = {
  // ملفات ثابتة - تخزين مؤقت لمدة سنة
  staticAssets: {
    maxAge: 31536000, // سنة واحدة
    patterns: [
      /\.(js|css|woff2?|ttf|eot)$/,
      /\.(png|jpg|jpeg|gif|svg|ico|webp)$/
    ]
  },

  // HTML - بدون تخزين مؤقت
  html: {
    maxAge: 0,
    patterns: [/\.html?$/]
  },

  // API - تخزين مؤقت قصير
  api: {
    maxAge: 300, // 5 دقائق
    patterns: [/^\/api\//]
  }
}

// إعدادات ضغط الملفات
export const compressionConfig = {
  gzip: {
    enabled: true,
    level: 6, // توازن بين السرعة والحجم
    threshold: 1024 // ضغط الملفات أكبر من 1KB
  },
  
  brotli: {
    enabled: true,
    quality: 4, // توازن بين السرعة والحجم
    threshold: 1024
  }
}

// إعدادات تحسين الصور
export const imageOptimization = {
  webp: {
    enabled: true,
    quality: 85
  },
  
  jpeg: {
    quality: 85,
    progressive: true
  },
  
  png: {
    compressionLevel: 8
  },
  
  svg: {
    removeComments: true,
    removeMetadata: true,
    optimizePaths: true
  }
}

// إعدادات مراقبة الأداء
export const performanceThresholds = {
  // Core Web Vitals
  lcp: 2500, // Largest Contentful Paint - 2.5 ثانية
  fid: 100,  // First Input Delay - 100 مللي ثانية
  cls: 0.1,  // Cumulative Layout Shift - 0.1

  // معايير إضافية
  fcp: 1800, // First Contentful Paint - 1.8 ثانية
  ttfb: 600, // Time to First Byte - 600 مللي ثانية
  tti: 3800, // Time to Interactive - 3.8 ثانية
  
  // معايير التطبيق
  pageLoadTime: 3000,    // 3 ثواني
  apiResponseTime: 1000, // ثانية واحدة
  searchResponseTime: 500, // نصف ثانية
  renderTime: 16 // 16 مللي ثانية (60 FPS)
}

// إعدادات النسخ الاحتياطي
export const backupConfig = {
  enabled: true,
  
  schedule: {
    automatic: true,
    interval: 24 * 60 * 60 * 1000, // يومياً
    maxBackups: 30 // الاحتفاظ بـ 30 نسخة
  },
  
  storage: {
    local: true,
    cloud: true,
    compression: true,
    encryption: true
  },
  
  validation: {
    checksumVerification: true,
    integrityCheck: true,
    restoreTest: true
  }
}

// إعدادات الشبكة
export const networkConfig = {
  offline: {
    enabled: true,
    cacheStrategy: 'cache-first',
    updateStrategy: 'background-sync'
  },
  
  retry: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    exponentialBackoff: true
  },
  
  timeout: {
    connection: 10000,
    request: 30000,
    upload: 120000
  }
}

// إعدادات التسجيل والمراقبة
export const loggingConfig = {
  level: 'info', // error, warn, info, debug
  
  targets: {
    console: false, // إيقاف في الإنتاج
    localStorage: true,
    remoteEndpoint: true
  },
  
  rotation: {
    enabled: true,
    maxSize: 5 * 1024 * 1024, // 5 MB
    maxFiles: 10
  },
  
  sanitization: {
    removePasswords: true,
    removePII: true, // معلومات شخصية
    removeTokens: true
  }
}

export default productionConfig