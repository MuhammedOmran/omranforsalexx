/**
 * معالج الأخطاء المحسن لتجنب تعطل التطبيق
 */

import { logger } from './logger';

export interface SafeError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
}

export interface ErrorHandlerOptions {
  context?: string;
  userId?: string;
  additionalData?: Record<string, unknown>;
  shouldNotify?: boolean;
  fallbackValue?: unknown;
}

class SafeErrorHandler {
  private static instance: SafeErrorHandler;
  private errorCounts: Map<string, number> = new Map();
  private maxRetries = 3;

  static getInstance(): SafeErrorHandler {
    if (!SafeErrorHandler.instance) {
      SafeErrorHandler.instance = new SafeErrorHandler();
    }
    return SafeErrorHandler.instance;
  }

  /**
   * معالجة آمنة للأخطاء مع تجنب تعطل التطبيق
   */
  handle(error: unknown, options: ErrorHandlerOptions = {}): SafeError {
    const safeError = this.createSafeError(error, options);
    
    // تسجيل الخطأ
    this.logError(safeError, options);
    
    // تتبع تكرار الأخطاء
    this.trackErrorFrequency(safeError.code);
    
    // إشعار المستخدم إذا لزم الأمر
    if (options.shouldNotify && safeError.severity !== 'low') {
      this.notifyUser(safeError);
    }

    return safeError;
  }

  /**
   * تنفيذ عملية مع معالجة آمنة للأخطاء
   */
  async safeExecute<T>(
    operation: () => Promise<T> | T,
    options: ErrorHandlerOptions & { fallbackValue?: T } = {}
  ): Promise<T | null> {
    try {
      const result = await operation();
      return result;
    } catch (error) {
      const safeError = this.handle(error, options);
      
      if (options.fallbackValue !== undefined) {
        return options.fallbackValue;
      }
      
      // إذا كان الخطأ قابل للإصلاح، نحاول مرة أخرى
      if (safeError.recoverable && this.shouldRetry(safeError.code)) {
        logger.info(`إعادة محاولة العملية بعد خطأ: ${safeError.code}`, { context: options.context });
        return this.safeExecute(operation, { ...options, fallbackValue: null });
      }
      
      return null;
    }
  }

  /**
   * إنشاء كائن خطأ آمن
   */
  private createSafeError(error: unknown, options: ErrorHandlerOptions): SafeError {
    let message = 'خطأ غير معروف';
    let code = 'UNKNOWN_ERROR';
    let details: Record<string, unknown> = {};

    if (error instanceof Error) {
      message = error.message;
      code = error.name || 'ERROR';
      details = {
        stack: error.stack,
        ...options.additionalData
      };
    } else if (typeof error === 'string') {
      message = error;
      code = 'STRING_ERROR';
    } else if (typeof error === 'object' && error !== null) {
      const errorObj = error as Record<string, unknown>;
      message = String(errorObj.message || errorObj.error || 'خطأ في الكائن');
      code = String(errorObj.code || errorObj.name || 'OBJECT_ERROR');
      details = { ...errorObj, ...options.additionalData };
    }

    const severity = this.determineSeverity(code, message);
    const recoverable = this.isRecoverable(code, severity);

    return {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      severity,
      recoverable
    };
  }

  /**
   * تحديد شدة الخطأ
   */
  private determineSeverity(code: string, message: string): SafeError['severity'] {
    // أخطاء حرجة
    if (code.includes('SECURITY') || code.includes('AUTH') || 
        message.includes('unauthorized') || message.includes('permission')) {
      return 'critical';
    }

    // أخطاء عالية
    if (code.includes('DATABASE') || code.includes('NETWORK') || 
        code.includes('CONNECTION') || message.includes('failed to connect')) {
      return 'high';
    }

    // أخطاء متوسطة
    if (code.includes('VALIDATION') || code.includes('NOT_FOUND') || 
        message.includes('invalid') || message.includes('not found')) {
      return 'medium';
    }

    // أخطاء منخفضة
    return 'low';
  }

  /**
   * تحديد إذا كان الخطأ قابل للإصلاح
   */
  private isRecoverable(code: string, severity: SafeError['severity']): boolean {
    // الأخطاء الحرجة غير قابلة للإصلاح عادة
    if (severity === 'critical') {
      return false;
    }

    // أخطاء الشبكة والاتصال قابلة للإصلاح
    if (code.includes('NETWORK') || code.includes('CONNECTION') || 
        code.includes('TIMEOUT')) {
      return true;
    }

    // أخطاء التحقق قابلة للإصلاح
    if (code.includes('VALIDATION')) {
      return true;
    }

    return severity === 'low' || severity === 'medium';
  }

  /**
   * تسجيل الخطأ
   */
  private logError(safeError: SafeError, options: ErrorHandlerOptions): void {
    const context = options.context || 'SafeErrorHandler';
    
    switch (safeError.severity) {
      case 'critical':
        logger.error(safeError.message, safeError.details, context);
        break;
      case 'high':
        logger.error(safeError.message, safeError.details, context);
        break;
      case 'medium':
        logger.warn(safeError.message, safeError.details, context);
        break;
      case 'low':
        logger.info(safeError.message, safeError.details, context);
        break;
    }
  }

  /**
   * تتبع تكرار الأخطاء
   */
  private trackErrorFrequency(code: string): void {
    const count = this.errorCounts.get(code) || 0;
    this.errorCounts.set(code, count + 1);
    
    // إذا تكرر الخطأ كثيراً، نسجل تحذير
    if (count > 5) {
      logger.warn(`الخطأ ${code} يتكرر بكثرة (${count} مرة)`, { 
        errorCode: code, 
        frequency: count 
      }, 'SafeErrorHandler');
    }
  }

  /**
   * تحديد إذا كان يجب إعادة المحاولة
   */
  private shouldRetry(code: string): boolean {
    const count = this.errorCounts.get(code) || 0;
    return count < this.maxRetries;
  }

  /**
   * إشعار المستخدم بالخطأ
   */
  private notifyUser(safeError: SafeError): void {
    // في بيئة المتصفح، يمكن استخدام toast أو notification
    if (typeof window !== 'undefined') {
      const message = this.getUserFriendlyMessage(safeError);
      
      // محاولة استخدام toast إذا كان متاحاً
      try {
        const event = new CustomEvent('app-error', {
          detail: {
            message,
            severity: safeError.severity,
            code: safeError.code
          }
        });
        window.dispatchEvent(event);
      } catch {
        // fallback إلى console إذا فشل التنبيه
        console.warn('تحذير:', message);
      }
    }
  }

  /**
   * تحويل رسالة الخطأ لرسالة مفهومة للمستخدم
   */
  private getUserFriendlyMessage(safeError: SafeError): string {
    const { code, severity } = safeError;

    if (code.includes('NETWORK') || code.includes('CONNECTION')) {
      return 'مشكلة في الاتصال بالإنترنت. يرجى المحاولة مرة أخرى.';
    }

    if (code.includes('AUTH') || code.includes('PERMISSION')) {
      return 'غير مصرح لك بهذا الإجراء. يرجى تسجيل الدخول مرة أخرى.';
    }

    if (code.includes('VALIDATION')) {
      return 'البيانات المدخلة غير صحيحة. يرجى مراجعة المعلومات والمحاولة مرة أخرى.';
    }

    if (code.includes('NOT_FOUND')) {
      return 'العنصر المطلوب غير موجود.';
    }

    switch (severity) {
      case 'critical':
        return 'حدث خطأ حرج. يرجى إعادة تشغيل التطبيق.';
      case 'high':
        return 'حدث خطأ مهم. يرجى المحاولة مرة أخرى أو الاتصال بالدعم الفني.';
      case 'medium':
        return 'حدث خطأ. يرجى المحاولة مرة أخرى.';
      case 'low':
        return 'حدث خطأ بسيط. العملية قد تكون اكتملت جزئياً.';
      default:
        return 'حدث خطأ غير متوقع.';
    }
  }

  /**
   * مسح إحصائيات الأخطاء
   */
  clearErrorStats(): void {
    this.errorCounts.clear();
  }

  /**
   * الحصول على إحصائيات الأخطاء
   */
  getErrorStats(): Record<string, number> {
    return Object.fromEntries(this.errorCounts);
  }
}

// إنشاء مثيل واحد
export const safeErrorHandler = SafeErrorHandler.getInstance();

// دوال مساعدة سريعة
export const handleError = (error: unknown, options?: ErrorHandlerOptions) => 
  safeErrorHandler.handle(error, options);

export const safeExecute = <T>(
  operation: () => Promise<T> | T,
  options?: ErrorHandlerOptions & { fallbackValue?: T }
) => safeErrorHandler.safeExecute(operation, options);

// إعداد معالج الأخطاء العام للتطبيق
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    handleError(event.error, {
      context: 'GlobalErrorHandler',
      additionalData: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    handleError(event.reason, {
      context: 'UnhandledPromiseRejection',
      shouldNotify: true
    });
  });
}