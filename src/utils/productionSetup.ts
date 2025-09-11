/**
 * إعداد الإنتاج النهائي
 */

import { productionConfig, securityHeaders, performanceThresholds } from '@/config/production.config'
import { logger } from './logger'

export class ProductionSetup {
  static async initialize() {
    try {
      logger.info('بدء إعداد الإنتاج', undefined, 'ProductionSetup')
      
      await this.setupSecurity()
      await this.optimizePerformance()
      await this.configureMonitoring()
      await this.setupErrorHandling()
      
      logger.info('تم إعداد الإنتاج بنجاح', undefined, 'ProductionSetup')
    } catch (error) {
      logger.error('خطأ في إعداد الإنتاج', error, 'ProductionSetup')
      throw error
    }
  }

  private static async setupSecurity() {
    // إعداد CSP Headers
    if (productionConfig.security.enableCSP) {
      const meta = document.createElement('meta')
      meta.httpEquiv = 'Content-Security-Policy'
      meta.content = securityHeaders['Content-Security-Policy']
      document.head.appendChild(meta)
    }

    // تشفير البيانات المحلية
    if (productionConfig.security.encryptLocalData) {
      const CryptoJS = await import('crypto-js')
      ;(window as any).encryptData = (data: string) => 
        CryptoJS.AES.encrypt(data, 'omran-key').toString()
      ;(window as any).decryptData = (data: string) => 
        CryptoJS.AES.decrypt(data, 'omran-key').toString(CryptoJS.enc.Utf8)
    }
  }

  private static async optimizePerformance() {
    // تحسين الصور
    if (productionConfig.performance.optimizeImages) {
      this.setupImageOptimization()
    }

    // تفعيل Service Worker
    if (productionConfig.performance.enableServiceWorker && 'serviceWorker' in navigator) {
      await navigator.serviceWorker.register('/sw.js')
    }
  }

  private static setupImageOptimization() {
    const images = document.querySelectorAll('img')
    images.forEach(img => {
      if (!img.loading) {
        img.loading = 'lazy'
      }
    })
  }

  private static async configureMonitoring() {
    // مراقبة الأداء
    if (productionConfig.monitoring.enablePerformanceMonitoring) {
      this.startPerformanceMonitoring()
    }
  }

  private static startPerformanceMonitoring() {
    // مراقبة Core Web Vitals
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          if (entry.startTime > performanceThresholds.lcp) {
            logger.warn('LCP بطيء', { time: entry.startTime }, 'Performance')
          }
        }
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] })
  }

  private static async setupErrorHandling() {
    // معالجة الأخطاء العامة
    window.addEventListener('error', (event) => {
      logger.error('خطأ JavaScript', event.error, 'GlobalError')
    })

    // معالجة أخطاء Promise
    window.addEventListener('unhandledrejection', (event) => {
      logger.error('Promise مرفوض', event.reason, 'UnhandledPromise')
    })
  }
}