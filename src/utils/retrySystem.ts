/**
 * نظام Retry ذكي مع Exponential Backoff
 */

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  exponentialBase?: number;
  jitter?: boolean;
  retryCondition?: (error: any, attempt: number) => boolean;
  onRetry?: (error: any, attempt: number, delay: number) => void;
  timeout?: number;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: any;
  attempts: number;
  totalTime: number;
}

class RetrySystem {
  private defaultOptions: Required<RetryOptions> = {
    maxAttempts: 3,
    baseDelay: 1000, // 1 ثانية
    maxDelay: 30000, // 30 ثانية
    exponentialBase: 2,
    jitter: true,
    retryCondition: this.defaultRetryCondition.bind(this),
    onRetry: () => {},
    timeout: 60000 // دقيقة واحدة
  };

  /**
   * تنفيذ عملية مع retry ذكي
   */
  async execute<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<RetryResult<T>> {
    const config = { ...this.defaultOptions, ...options };
    const startTime = Date.now();
    let lastError: any;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        // تطبيق timeout على العملية
        const data = await this.withTimeout(operation(), config.timeout);
        
        return {
          success: true,
          data,
          attempts: attempt,
          totalTime: Date.now() - startTime
        };
      } catch (error) {
        lastError = error;
        
        // التحقق من إمكانية إعادة المحاولة
        if (attempt === config.maxAttempts || !config.retryCondition(error, attempt)) {
          break;
        }

        // حساب التأخير مع Exponential Backoff
        const delay = this.calculateDelay(attempt, config);
        
        // استدعاء callback
        config.onRetry(error, attempt, delay);
        
        // انتظار قبل المحاولة التالية
        await this.sleep(delay);
      }
    }

    return {
      success: false,
      error: lastError,
      attempts: config.maxAttempts,
      totalTime: Date.now() - startTime
    };
  }

  /**
   * شرط افتراضي لإعادة المحاولة
   */
  private defaultRetryCondition(error: any, attempt: number): boolean {
    // عدم إعادة المحاولة للأخطاء التي لا يمكن إصلاحها
    if (this.isNonRetryableError(error)) {
      return false;
    }

    // إعادة المحاولة لأخطاء الشبكة والخادم
    if (this.isNetworkError(error) || this.isServerError(error)) {
      return true;
    }

    // إعادة المحاولة للأخطاء المؤقتة
    if (this.isTemporaryError(error)) {
      return true;
    }

    return false;
  }

  /**
   * حساب التأخير مع Exponential Backoff و Jitter
   */
  private calculateDelay(attempt: number, config: Required<RetryOptions>): number {
    // Exponential Backoff: baseDelay * (exponentialBase ^ (attempt - 1))
    let delay = config.baseDelay * Math.pow(config.exponentialBase, attempt - 1);
    
    // تطبيق الحد الأقصى
    delay = Math.min(delay, config.maxDelay);
    
    // إضافة Jitter لتجنب thundering herd
    if (config.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }
    
    return Math.round(delay);
  }

  /**
   * تطبيق timeout على العملية
   */
  private withTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('العملية تجاوزت الوقت المحدد')), timeout);
      })
    ]);
  }

  /**
   * انتظار لفترة محددة
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * التحقق من كون الخطأ غير قابل لإعادة المحاولة
   */
  private isNonRetryableError(error: any): boolean {
    const nonRetryableStatuses = [400, 401, 403, 404, 422];
    const nonRetryableMessages = [
      'authentication failed',
      'unauthorized',
      'forbidden',
      'not found',
      'validation error',
      'invalid input'
    ];

    // فحص HTTP status codes
    if (error.status && nonRetryableStatuses.includes(error.status)) {
      return true;
    }

    // فحص رسائل الخطأ
    const errorMessage = (error.message || '').toLowerCase();
    return nonRetryableMessages.some(msg => errorMessage.includes(msg));
  }

  /**
   * التحقق من كون الخطأ خطأ شبكة
   */
  private isNetworkError(error: any): boolean {
    const networkMessages = [
      'network error',
      'connection failed',
      'timeout',
      'fetch failed',
      'no internet',
      'connection refused'
    ];

    const errorMessage = (error.message || '').toLowerCase();
    return networkMessages.some(msg => errorMessage.includes(msg)) ||
           error.name === 'NetworkError' ||
           error.code === 'NETWORK_ERROR';
  }

  /**
   * التحقق من كون الخطأ خطأ خادم
   */
  private isServerError(error: any): boolean {
    const serverStatuses = [500, 502, 503, 504];
    return error.status && serverStatuses.includes(error.status);
  }

  /**
   * التحقق من كون الخطأ مؤقت
   */
  private isTemporaryError(error: any): boolean {
    const temporaryMessages = [
      'temporary',
      'rate limit',
      'too many requests',
      'service unavailable',
      'maintenance'
    ];

    const errorMessage = (error.message || '').toLowerCase();
    return temporaryMessages.some(msg => errorMessage.includes(msg)) ||
           error.status === 429 || // Rate limiting
           error.status === 503;   // Service unavailable
  }
}

// إنشاء مثيل واحد للنظام
export const retrySystem = new RetrySystem();

/**
 * Decorator لتطبيق retry على الدوال
 */
export function withRetry(options: RetryOptions = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await retrySystem.execute(
        () => originalMethod.apply(this, args),
        options
      );

      if (!result.success) {
        throw result.error;
      }

      return result.data;
    };

    return descriptor;
  };
}

/**
 * مساعدات للعمليات الشائعة
 */
export class RetryHelpers {
  /**
   * Retry للطلبات HTTP
   */
  static async fetchWithRetry(
    url: string,
    options: RequestInit = {},
    retryOptions: RetryOptions = {}
  ): Promise<Response> {
    const result = await retrySystem.execute(
      () => fetch(url, options),
      {
        maxAttempts: 3,
        baseDelay: 1000,
        retryCondition: (error, attempt) => {
          // إعادة المحاولة لأخطاء الشبكة والخادم فقط
          return error.name === 'TypeError' || // Network error
                 (error.status >= 500 && error.status <= 599); // Server errors
        },
        ...retryOptions
      }
    );

    if (!result.success) {
      throw result.error;
    }

    return result.data!;
  }

  /**
   * Retry لعمليات قاعدة البيانات
   */
  static async databaseOperationWithRetry<T>(
    operation: () => Promise<T>,
    retryOptions: RetryOptions = {}
  ): Promise<T> {
    const result = await retrySystem.execute(operation, {
      maxAttempts: 5,
      baseDelay: 500,
      maxDelay: 5000,
      retryCondition: (error) => {
        // إعادة المحاولة لأخطاء الاتصال وقفل قاعدة البيانات
        const errorMessage = (error.message || '').toLowerCase();
        return errorMessage.includes('connection') ||
               errorMessage.includes('lock') ||
               errorMessage.includes('timeout') ||
               errorMessage.includes('busy');
      },
      ...retryOptions
    });

    if (!result.success) {
      throw result.error;
    }

    return result.data!;
  }

  /**
   * Retry للعمليات المالية الحساسة
   */
  static async criticalOperationWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    const result = await retrySystem.execute(operation, {
      maxAttempts: 5,
      baseDelay: 2000,
      maxDelay: 10000,
      jitter: true,
      onRetry: (error, attempt, delay) => {
        console.warn(`إعادة محاولة للعملية المهمة "${operationName}" - المحاولة ${attempt}, التأخير: ${delay}ms`, error);
      }
    });

    if (!result.success) {
      console.error(`فشلت العملية المهمة "${operationName}" نهائياً بعد ${result.attempts} محاولات`, result.error);
      throw result.error;
    }

    if (result.attempts > 1) {
      console.info(`نجحت العملية المهمة "${operationName}" في المحاولة ${result.attempts}`);
    }

    return result.data!;
  }
}