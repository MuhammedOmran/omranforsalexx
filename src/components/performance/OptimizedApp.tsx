import React from 'react';
import { logger } from '@/utils/logger';

/**
 * مكون محسن لتطبيق التحسينات العامة للتطبيق
 */
export function OptimizedApp({ children }: { children: React.ReactNode }) {
  
  React.useEffect(() => {
    try {
      logger.info('OptimizedApp تم تحميله بنجاح', undefined, 'OptimizedApp');
      
      // تحسين بسيط للذاكرة
      const optimizeMemory = () => {
        try {
          // تنظيف cache القديم
          const now = Date.now();
          const CACHE_TTL = 10 * 60 * 1000; // 10 دقائق
          
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('cache_')) {
              try {
                const item = JSON.parse(localStorage.getItem(key) || '{}');
                if (item.timestamp && (now - item.timestamp) > CACHE_TTL) {
                  localStorage.removeItem(key);
                }
              } catch (e) {
                localStorage.removeItem(key);
              }
            }
          });
        } catch (error) {
          logger.warn('خطأ في تحسين الذاكرة', error, 'OptimizedApp');
        }
      };
      
      // تنظيف الذاكرة كل 10 دقائق
      const memoryInterval = setInterval(optimizeMemory, 10 * 60 * 1000);
      
      return () => {
        clearInterval(memoryInterval);
      };
    } catch (error) {
      logger.error('خطأ في OptimizedApp', error, 'OptimizedApp');
    }
  }, []);

  return <>{children}</>;
}