import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PRELOADING_CONFIG, performanceMonitor } from '@/utils/performanceConfig';

/**
 * هوك لتحسين التنقل وتسريع تحميل الصفحات
 */
export function useFastNavigation() {
  const navigate = useNavigate();

  // تحميل مسبق للصفحات المهمة
  const preloadCriticalPages = useCallback(() => {
    PRELOADING_CONFIG.CRITICAL_ROUTES.forEach((route, index) => {
      setTimeout(() => {
        // تحميل مسبق باستخدام link prefetch
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        document.head.appendChild(link);
      }, index * 100); // تحميل متدرج
    });
  }, []);

  // تنقل محسن مع قياس الأداء
  const fastNavigate = useCallback((to: string, options?: any) => {
    performanceMonitor.startTimer(`navigation-${to}`);
    
    // تحديد نوع التنقل
    const navigationType = options?.replace ? 'replace' : 'push';
    
    try {
      if (navigationType === 'replace') {
        navigate(to, { ...options, replace: true });
      } else {
        navigate(to, options);
      }
    } catch (error) {
      console.error('خطأ في التنقل:', error);
    } finally {
      // انتهاء قياس وقت التنقل
      setTimeout(() => {
        performanceMonitor.endTimer(`navigation-${to}`);
      }, 100);
    }
  }, [navigate]);

  // تحميل مسبق عند hover على الروابط
  const handleLinkHover = useCallback((href: string) => {
    if (!href.startsWith('/')) return;
    
    // إنشاء رابط prefetch
    if (!document.querySelector(`link[href="${href}"]`)) {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      document.head.appendChild(link);
    }
  }, []);

  // مراقبة الروابط وإضافة أحداث hover
  useEffect(() => {
    const links = document.querySelectorAll('a[href^="/"]');
    
    const handleMouseEnter = (event: Event) => {
      const target = event.target as HTMLAnchorElement;
      if (target.href) {
        handleLinkHover(target.pathname);
      }
    };

    links.forEach(link => {
      link.addEventListener('mouseenter', handleMouseEnter);
    });

    return () => {
      links.forEach(link => {
        link.removeEventListener('mouseenter', handleMouseEnter);
      });
    };
  }, [handleLinkHover]);

  // تحميل مسبق عند بدء التطبيق
  useEffect(() => {
    const timer = setTimeout(preloadCriticalPages, PRELOADING_CONFIG.PRELOAD_DELAY);
    return () => clearTimeout(timer);
  }, [preloadCriticalPages]);

  return {
    fastNavigate,
    preloadCriticalPages,
    handleLinkHover
  };
}

/**
 * هوك لتحسين أداء الصفحة الحالية
 */
export function usePagePerformance(pageName: string) {
  useEffect(() => {
    // بداية قياس تحميل الصفحة
    performanceMonitor.startTimer(`page-${pageName}`);
    
    // تنظيف غير المستخدم من DOM
    const cleanupDOM = () => {
      // إزالة skeleton loaders غير المرئية
      const skeletons = document.querySelectorAll('.animate-pulse:not(:visible)');
      skeletons.forEach(skeleton => skeleton.remove());
      
      // إزالة scripts غير المستخدمة
      const unusedScripts = document.querySelectorAll('script[data-cleanup="true"]');
      unusedScripts.forEach(script => script.remove());
    };

    // تنظيف بعد تحميل الصفحة
    const timer = setTimeout(cleanupDOM, 1000);

    return () => {
      clearTimeout(timer);
      performanceMonitor.endTimer(`page-${pageName}`);
      
      // تسجيل الأداء للمراجعة
      const loadTime = performanceMonitor.getMetric(`page-${pageName}`);
      if (loadTime > 2000) {
        console.warn(`⚠️ صفحة بطيئة: ${pageName} - ${loadTime.toFixed(2)}ms`);
      }
    };
  }, [pageName]);

  // تحسين الذاكرة
  const optimizeMemory = useCallback(() => {
    // تشغيل garbage collection إذا كان متاحاً
    if (window.gc) {
      window.gc();
    }
    
    // تنظيف event listeners
    window.dispatchEvent(new CustomEvent('cleanup-listeners'));
    
    // تنظيف التخزين المؤقت القديم
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('temp_') || key.startsWith('cache_')) {
          const item = localStorage.getItem(key);
          if (item) {
            const data = JSON.parse(item);
            if (data.timestamp && Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
              localStorage.removeItem(key);
            }
          }
        }
      });
    } catch (error) {
      console.warn('فشل في تنظيف التخزين المؤقت:', error);
    }
  }, []);

  return {
    optimizeMemory
  };
}