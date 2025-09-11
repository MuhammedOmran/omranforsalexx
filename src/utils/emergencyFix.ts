/**
 * إصلاحات طوارئ شاملة للمشروع
 */

import { storageCleanup } from './storageCleanup';
import { logger } from './logger';

/**
 * تشغيل إصلاحات المرحلة الأولى
 */
export async function runPhaseOneRepairs(): Promise<void> {
  logger.info('🚀 بدء المرحلة الأولى - الإصلاحات الفورية');
  
  try {
    // 1. تنظيف التخزين المحلي
    logger.info('💾 تنظيف localStorage...');
    const storageResult = storageCleanup.safeCleanup();
    logger.info(`تم تنظيف ${storageResult.cleaned} عنصر من التخزين`);
    
    // 2. إعداد معالج الأخطاء
    logger.info('🛡️ تفعيل معالج الأخطاء الآمن...');
    setupErrorHandling();
    
    logger.info('✅ تم إكمال المرحلة الأولى بنجاح');
    
  } catch (error) {
    logger.error('❌ خطأ في المرحلة الأولى:', error, 'emergencyFix');
    throw error;
  }
}

/**
 * إعداد معالجة الأخطاء الشاملة
 */
function setupErrorHandling(): void {
  // معالج الأخطاء العامة
  window.addEventListener('error', (event) => {
    logger.error('Global error caught:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    }, 'globalErrorHandler');
  });

  // معالج أخطاء Promise
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection:', event.reason, 'promiseErrorHandler');
    event.preventDefault(); // منع ظهور الخطأ في console
  });

  // معالج أخطاء React
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    if (message.includes('React') || message.includes('Warning')) {
      logger.warn('React warning/error:', message, 'reactErrorHandler');
    } else {
      logger.error('Console error:', message, 'consoleErrorHandler');
    }
    // في بيئة التطوير فقط، اعرض في console الأصلي
    if (process.env.NODE_ENV === 'development') {
      originalConsoleError.apply(console, args);
    }
  };

  logger.info('Error handling setup completed');
}

/**
 * تشغيل المرحلة الثانية - التحسينات متوسطة المدى
 */
export async function runPhaseTwoImprovements(): Promise<void> {
  logger.info('🔧 بدء المرحلة الثانية - التحسينات متوسطة المدى');
  
  try {
    // سيتم تنفيذها في مرحلة لاحقة حسب طلب المستخدم
    logger.info('المرحلة الثانية جاهزة للتنفيذ');
    
  } catch (error) {
    logger.error('❌ خطأ في المرحلة الثانية:', error, 'emergencyFix');
    throw error;
  }
}

// تشغيل المرحلة الأولى تلقائياً
if (typeof window !== 'undefined') {
  // تأخير التشغيل للسماح للتطبيق بالتحميل
  setTimeout(() => {
    runPhaseOneRepairs().catch(error => {
      logger.error('Failed to run emergency repairs:', error, 'emergencyFix');
    });
  }, 2000);
}