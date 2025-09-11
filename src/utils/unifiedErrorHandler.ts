/**
 * نظام معالجة الأخطاء الموحد والشامل
 * يحل محل errorHandler.ts و errorMonitoring.ts و errorMonitor.ts
 */

import { logger } from './logger';
import { storage } from './storage';
import type { AppError, UnknownObject } from '@/types/common';

// أنواع الأخطاء المختلفة
export enum ErrorType {
  NETWORK = 'network',
  VALIDATION = 'validation',
  PERMISSION = 'permission',
  STORAGE = 'storage',
  RENDER = 'render',
  AUTHENTICATION = 'authentication',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system',
  UNKNOWN = 'unknown'
}

export enum ErrorSeverity {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4
}

export interface ErrorInfo extends AppError {
  type: ErrorType;
  severity: ErrorSeverity;
  stack?: string;
  context?: UnknownObject;
  retryCount?: number;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
}

export interface ErrorReport {
  totalErrors: number;
  errorsByType: Record<ErrorType, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  recentErrors: ErrorInfo[];
  criticalErrors: ErrorInfo[];
  recommendations: string[];
  systemHealth: 'healthy' | 'warning' | 'critical';
}

// استراتيجيات الاستجابة للأخطاء
export interface ErrorResponse {
  shouldRetry: boolean;
  retryDelay?: number;
  maxRetries?: number;
  fallbackAction?: () => void;
  userMessage?: string;
  reportToUser?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

class UnifiedErrorHandler {
  private static instance: UnifiedErrorHandler;
  private errors: ErrorInfo[] = [];
  private readonly maxErrors = 1000;
  private readonly maxCriticalErrors = 100;
  private isInitialized = false;

  static getInstance(): UnifiedErrorHandler {
    if (!UnifiedErrorHandler.instance) {
      UnifiedErrorHandler.instance = new UnifiedErrorHandler();
    }
    return UnifiedErrorHandler.instance;
  }

  constructor() {
    if (!this.isInitialized) {
      this.initialize();
    }
  }

  private initialize(): void {
    this.setupGlobalErrorHandlers();
    this.loadStoredErrors();
    this.scheduleCleanup();
    this.isInitialized = true;
    logger.info('نظام معالجة الأخطاء الموحد تم تهيئته', undefined, 'ErrorHandler');
  }

  private setupGlobalErrorHandlers(): void {
    // معالجة أخطاء JavaScript العامة
    window.addEventListener('error', (event) => {
      this.handleError({
        type: ErrorType.SYSTEM,
        severity: ErrorSeverity.HIGH,
        code: 'JAVASCRIPT_ERROR',
        message: event.message || 'خطأ في JavaScript',
        timestamp: new Date().toISOString(),
        stack: event.error?.stack,
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          type: 'global_error'
        },
        url: window.location.href,
        userAgent: navigator.userAgent
      });
    });

    // معالجة Promise rejections غير المعالجة
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        type: ErrorType.SYSTEM,
        severity: ErrorSeverity.CRITICAL,
        code: 'UNHANDLED_PROMISE',
        message: `Promise مرفوض غير معالج: ${event.reason}`,
        timestamp: new Date().toISOString(),
        stack: event.reason?.stack,
        context: {
          reason: event.reason,
          type: 'unhandled_promise_rejection'
        },
        url: window.location.href,
        userAgent: navigator.userAgent
      });
    });

    // معالجة أخطاء تحميل الموارد
    window.addEventListener('error', (event) => {
      if (event.target && event.target !== window) {
        const target = event.target as HTMLElement;
        this.handleError({
          type: ErrorType.NETWORK,
          severity: ErrorSeverity.MEDIUM,
          code: 'RESOURCE_LOAD_ERROR',
          message: `فشل في تحميل المورد: ${(target as any).src || target.tagName}`,
          timestamp: new Date().toISOString(),
          context: {
            tagName: target.tagName,
            src: (target as any).src,
            type: 'resource_error'
          },
          url: window.location.href
        });
      }
    }, true);
  }

  // معالج الأخطاء الرئيسي
  handleError(errorInput: Partial<ErrorInfo> | Error | string): ErrorInfo {
    const errorInfo = this.normalizeError(errorInput);
    
    // إضافة معلومات إضافية
    errorInfo.sessionId = this.getSessionId();
    errorInfo.userId = this.getCurrentUserId();
    
    // تحديد استراتيجية الاستجابة
    const response = this.determineErrorResponse(errorInfo);
    
    // تسجيل الخطأ
    this.logError(errorInfo, response);
    
    // حفظ الخطأ
    this.storeError(errorInfo);
    
    // تنفيذ الاستجابة
    this.executeErrorResponse(errorInfo, response);
    
    return errorInfo;
  }

  private normalizeError(input: Partial<ErrorInfo> | Error | string): ErrorInfo {
    if (typeof input === 'string') {
      return {
        type: ErrorType.UNKNOWN,
        severity: ErrorSeverity.MEDIUM,
        code: 'GENERIC_ERROR',
        message: input,
        timestamp: new Date().toISOString()
      };
    }

    if (input instanceof Error) {
      return {
        type: this.determineErrorType(input),
        severity: this.determineErrorSeverity(input),
        code: input.name || 'ERROR',
        message: input.message,
        timestamp: new Date().toISOString(),
        stack: input.stack
      };
    }

    // إذا كان من نوع ErrorInfo جزئي
    return {
      type: ErrorType.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      code: 'GENERIC_ERROR',
      message: 'خطأ غير معروف',
      timestamp: new Date().toISOString(),
      ...input
    };
  }

  private determineErrorType(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    if (name.includes('network') || message.includes('fetch') || message.includes('network')) {
      return ErrorType.NETWORK;
    }
    if (name.includes('validation') || message.includes('validation')) {
      return ErrorType.VALIDATION;
    }
    if (name.includes('permission') || message.includes('permission') || message.includes('unauthorized')) {
      return ErrorType.PERMISSION;
    }
    if (name.includes('storage') || message.includes('quota') || message.includes('storage')) {
      return ErrorType.STORAGE;
    }
    if (message.includes('render') || message.includes('component')) {
      return ErrorType.RENDER;
    }
    if (message.includes('auth') || message.includes('login') || message.includes('token')) {
      return ErrorType.AUTHENTICATION;
    }

    return ErrorType.UNKNOWN;
  }

  private determineErrorSeverity(error: Error): ErrorSeverity {
    const message = error.message.toLowerCase();
    
    if (message.includes('critical') || message.includes('fatal') || message.includes('security')) {
      return ErrorSeverity.CRITICAL;
    }
    if (message.includes('important') || message.includes('serious')) {
      return ErrorSeverity.HIGH;
    }
    if (message.includes('warning') || message.includes('deprecated')) {
      return ErrorSeverity.MEDIUM;
    }
    
    return ErrorSeverity.LOW;
  }

  private determineErrorResponse(error: ErrorInfo): ErrorResponse {
    switch (error.type) {
      case ErrorType.NETWORK:
        return {
          shouldRetry: true,
          retryDelay: 1000,
          maxRetries: 3,
          userMessage: 'مشكلة في الاتصال. جاري إعادة المحاولة...',
          reportToUser: error.severity >= ErrorSeverity.HIGH,
          logLevel: 'warn'
        };

      case ErrorType.VALIDATION:
        return {
          shouldRetry: false,
          userMessage: 'يرجى التحقق من البيانات المدخلة',
          reportToUser: true,
          logLevel: 'info'
        };

      case ErrorType.PERMISSION:
        return {
          shouldRetry: false,
          userMessage: 'ليس لديك صلاحية لتنفيذ هذا الإجراء',
          reportToUser: true,
          logLevel: 'warn'
        };

      case ErrorType.AUTHENTICATION:
        return {
          shouldRetry: false,
          userMessage: 'يرجى تسجيل الدخول مرة أخرى',
          reportToUser: true,
          fallbackAction: () => this.redirectToLogin(),
          logLevel: 'warn'
        };

      case ErrorType.STORAGE:
        return {
          shouldRetry: true,
          retryDelay: 500,
          maxRetries: 2,
          userMessage: 'مشكلة في التخزين المحلي',
          reportToUser: error.severity >= ErrorSeverity.HIGH,
          fallbackAction: () => this.cleanupStorage(),
          logLevel: 'error'
        };

      default:
        return {
          shouldRetry: error.severity <= ErrorSeverity.MEDIUM,
          retryDelay: 1000,
          maxRetries: 1,
          userMessage: error.severity >= ErrorSeverity.HIGH ? 'حدث خطأ غير متوقع' : undefined,
          reportToUser: error.severity >= ErrorSeverity.HIGH,
          logLevel: 'error'
        };
    }
  }

  private logError(error: ErrorInfo, response: ErrorResponse): void {
    const logLevel = response.logLevel || 'error';
    const context = `ErrorHandler-${error.type}`;
    
    switch (logLevel) {
      case 'debug':
        logger.debug(error.message, { error, response }, context);
        break;
      case 'info':
        logger.info(error.message, { error, response }, context);
        break;
      case 'warn':
        logger.warn(error.message, { error, response }, context);
        break;
      case 'error':
        logger.error(error.message, { error, response }, context);
        break;
    }
  }

  private storeError(error: ErrorInfo): void {
    this.errors.push(error);
    
    // الاحتفاظ بالحد الأقصى للأخطاء
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }
    
    // حفظ الأخطاء المهمة في التخزين المحلي
    if (error.severity >= ErrorSeverity.HIGH) {
      this.persistCriticalError(error);
    }
    
    // حفظ دوري لجميع الأخطاء
    this.saveErrorsToStorage();
  }

  private persistCriticalError(error: ErrorInfo): void {
    try {
      const criticalErrors = storage.getItem<ErrorInfo[]>('critical_errors', []);
      criticalErrors.push(error);
      
      // الاحتفاظ بأحدث الأخطاء المهمة
      const recentCriticalErrors = criticalErrors.slice(-this.maxCriticalErrors);
      storage.setItem('critical_errors', recentCriticalErrors);
    } catch (e) {
      logger.warn('فشل في حفظ الخطأ المهم', e, 'ErrorHandler');
    }
  }

  private executeErrorResponse(error: ErrorInfo, response: ErrorResponse): void {
    // تنفيذ الإجراء الاحتياطي
    if (response.fallbackAction) {
      try {
        response.fallbackAction();
      } catch (e) {
        logger.error('فشل في تنفيذ الإجراء الاحتياطي', e, 'ErrorHandler');
      }
    }
    
    // إظهار رسالة للمستخدم
    if (response.reportToUser && response.userMessage) {
      this.showUserNotification(error, response.userMessage);
    }
    
    // جدولة إعادة المحاولة
    if (response.shouldRetry && error.retryCount !== undefined && error.retryCount < (response.maxRetries || 1)) {
      this.scheduleRetry(error, response);
    }
  }

  private showUserNotification(error: ErrorInfo, message: string): void {
    // استخدام نظام التنبيهات الخاص بالتطبيق
    if (typeof window !== 'undefined' && 'toast' in window) {
      (window as any).toast({
        title: 'تنبيه',
        description: message,
        variant: error.severity >= ErrorSeverity.HIGH ? 'destructive' : 'default'
      });
    }
  }

  private scheduleRetry(error: ErrorInfo, response: ErrorResponse): void {
    setTimeout(() => {
      logger.info(`إعادة محاولة للخطأ: ${error.code}`, { attempt: (error.retryCount || 0) + 1 }, 'ErrorHandler');
      // منطق إعادة المحاولة يمكن تنفيذه هنا حسب الحاجة
    }, response.retryDelay || 1000);
  }

  private getSessionId(): string {
    return storage.getItem('session_id', '') || 'unknown';
  }

  private getCurrentUserId(): string | undefined {
    try {
      const user = storage.getItem('current_user', null);
      return user?.id;
    } catch {
      return undefined;
    }
  }

  private redirectToLogin(): void {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  private cleanupStorage(): void {
    try {
      // تنظيف التخزين المحلي من البيانات التالفة
      const keysToCheck = ['temp_', 'cache_', 'old_'];
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && keysToCheck.some(prefix => key.startsWith(prefix))) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      logger.info(`تم تنظيف ${keysToRemove.length} عنصر من التخزين المحلي`, undefined, 'ErrorHandler');
    } catch (e) {
      logger.error('فشل في تنظيف التخزين المحلي', e, 'ErrorHandler');
    }
  }

  private saveErrorsToStorage(): void {
    try {
      const recentErrors = this.errors.slice(-100); // آخر 100 خطأ فقط
      storage.setItem('recent_errors', recentErrors);
    } catch (e) {
      logger.warn('فشل في حفظ الأخطاء في التخزين المحلي', e, 'ErrorHandler');
    }
  }

  private loadStoredErrors(): void {
    try {
      const storedErrors = storage.getItem<ErrorInfo[]>('recent_errors', []);
      const criticalErrors = storage.getItem<ErrorInfo[]>('critical_errors', []);
      
      this.errors = [...storedErrors, ...criticalErrors];
      logger.info(`تم تحميل ${this.errors.length} خطأ من التخزين المحلي`, undefined, 'ErrorHandler');
    } catch (e) {
      logger.warn('فشل في تحميل الأخطاء المحفوظة', e, 'ErrorHandler');
    }
  }

  private scheduleCleanup(): void {
    // تنظيف الأخطاء القديمة كل ساعة
    setInterval(() => {
      this.cleanupOldErrors();
    }, 60 * 60 * 1000);
  }

  private cleanupOldErrors(): void {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const beforeCount = this.errors.length;
    
    this.errors = this.errors.filter(error => error.timestamp > weekAgo);
    
    const cleanedCount = beforeCount - this.errors.length;
    if (cleanedCount > 0) {
      logger.info(`تم تنظيف ${cleanedCount} خطأ قديم`, undefined, 'ErrorHandler');
      this.saveErrorsToStorage();
    }
  }

  // Public API للحصول على التقارير والإحصائيات
  getErrorReport(): ErrorReport {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    
    const recentErrors = this.errors.filter(error => error.timestamp > last24Hours);
    const criticalErrors = recentErrors.filter(error => error.severity === ErrorSeverity.CRITICAL);
    
    const errorsByType = this.groupBy(recentErrors, 'type');
    const errorsBySeverity = this.groupBy(recentErrors, 'severity');
    
    return {
      totalErrors: recentErrors.length,
      errorsByType: errorsByType as Record<ErrorType, number>,
      errorsBySeverity: errorsBySeverity as Record<ErrorSeverity, number>,
      recentErrors: recentErrors.slice(-10),
      criticalErrors,
      recommendations: this.generateRecommendations(recentErrors),
      systemHealth: this.assessSystemHealth(recentErrors, criticalErrors)
    };
  }

  private groupBy<T extends Record<string, any>>(array: T[], key: keyof T): Record<string, number> {
    return array.reduce((acc, item) => {
      const value = String(item[key]);
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private generateRecommendations(errors: ErrorInfo[]): string[] {
    const recommendations: string[] = [];
    const errorsByType = this.groupBy(errors, 'type');
    
    if (errorsByType[ErrorType.NETWORK] > 5) {
      recommendations.push('تحسين معالجة أخطاء الشبكة وإضافة آلية إعادة المحاولة');
    }
    
    if (errorsByType[ErrorType.STORAGE] > 3) {
      recommendations.push('تنظيف التخزين المحلي وتحسين إدارة البيانات');
    }
    
    if (errorsByType[ErrorType.RENDER] > 3) {
      recommendations.push('مراجعة مكونات React وتحسين الأداء');
    }
    
    if (errors.filter(e => e.severity === ErrorSeverity.CRITICAL).length > 0) {
      recommendations.push('مراجعة فورية للأخطاء الحرجة المسجلة');
    }
    
    if (errors.length > 50) {
      recommendations.push('تحسين جودة الكود وإضافة المزيد من التحقق من الأخطاء');
    }
    
    return recommendations;
  }

  private assessSystemHealth(recentErrors: ErrorInfo[], criticalErrors: ErrorInfo[]): 'healthy' | 'warning' | 'critical' {
    if (criticalErrors.length > 0) {
      return 'critical';
    }
    
    if (recentErrors.length > 20 || recentErrors.filter(e => e.severity >= ErrorSeverity.HIGH).length > 5) {
      return 'warning';
    }
    
    return 'healthy';
  }

  // تصدير البيانات للتشخيص
  exportErrorData(): string {
    return JSON.stringify({
      errors: this.errors,
      report: this.getErrorReport(),
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }, null, 2);
  }

  // تنظيف جميع الأخطاء
  clearAllErrors(): void {
    this.errors = [];
    storage.removeItem('recent_errors');
    storage.removeItem('critical_errors');
    logger.info('تم مسح جميع الأخطاء', undefined, 'ErrorHandler');
  }
}

// إنشاء مثيل واحد للتطبيق
export const errorHandler = UnifiedErrorHandler.getInstance();

// دوال مساعدة سريعة
export const handleError = (error: Partial<ErrorInfo> | Error | string) => errorHandler.handleError(error);
export const getErrorReport = () => errorHandler.getErrorReport();
export const exportErrorData = () => errorHandler.exportErrorData();
export const clearAllErrors = () => errorHandler.clearAllErrors();

// دوال مخصصة لأنواع الأخطاء المختلفة
export const handleNetworkError = (error: Error | string, context?: UnknownObject) =>
  errorHandler.handleError({
    type: ErrorType.NETWORK,
    severity: ErrorSeverity.HIGH,
    message: error instanceof Error ? error.message : error,
    code: 'NETWORK_ERROR',
    timestamp: new Date().toISOString(),
    context
  });

export const handleValidationError = (message: string, context?: UnknownObject) =>
  errorHandler.handleError({
    type: ErrorType.VALIDATION,
    severity: ErrorSeverity.MEDIUM,
    message,
    code: 'VALIDATION_ERROR',
    timestamp: new Date().toISOString(),
    context
  });

export const handlePermissionError = (message: string, context?: UnknownObject) =>
  errorHandler.handleError({
    type: ErrorType.PERMISSION,
    severity: ErrorSeverity.HIGH,
    message,
    code: 'PERMISSION_ERROR',
    timestamp: new Date().toISOString(),
    context
  });

export const handleStorageError = (error: Error | string, context?: UnknownObject) =>
  errorHandler.handleError({
    type: ErrorType.STORAGE,
    severity: ErrorSeverity.HIGH,
    message: error instanceof Error ? error.message : error,
    code: 'STORAGE_ERROR',
    timestamp: new Date().toISOString(),
    context
  });

export const handleRenderError = (error: Error | string, context?: UnknownObject) =>
  errorHandler.handleError({
    type: ErrorType.RENDER,
    severity: ErrorSeverity.HIGH,
    message: error instanceof Error ? error.message : error,
    code: 'RENDER_ERROR',
    timestamp: new Date().toISOString(),
    context
  });