/**
 * نظام تسجيل محسن وموحد للتطبيق
 * يحل محل جميع استخدامات console.log
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: any;
  userId?: string;
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private logLevel: LogLevel = LogLevel.INFO;

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  constructor() {
    // تحديد مستوى السجلات حسب البيئة
    this.logLevel = process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG;
  }

  private createLogEntry(level: LogLevel, message: string, data?: any, context?: string): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      data,
      userId: this.getCurrentUserId()
    };
  }

  private getCurrentUserId(): string | undefined {
    try {
      const user = JSON.parse(localStorage.getItem('current_user') || '{}');
      return user.id;
    } catch {
      return undefined;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);
    
    // الاحتفاظ بأحدث السجلات فقط
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // حفظ السجلات المهمة فقط في التخزين المحلي
    if (entry.level <= LogLevel.WARN) {
      this.persistCriticalLog(entry);
    }
  }

  private persistCriticalLog(entry: LogEntry): void {
    try {
      const criticalLogs = JSON.parse(localStorage.getItem('critical_logs') || '[]');
      criticalLogs.push(entry);
      
      // الاحتفاظ بآخر 50 سجل مهم فقط
      const recentLogs = criticalLogs.slice(-50);
      localStorage.setItem('critical_logs', JSON.stringify(recentLogs));
    } catch (e) {
      // تجاهل أخطاء التخزين
    }
  }

  error(message: string, data?: any, context?: string): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, data, context);
    this.addLog(entry);
    
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(`🔴 [ERROR] ${context ? `[${context}]` : ''} ${message}`, data || '');
    }
  }

  warn(message: string, data?: any, context?: string): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, data, context);
    this.addLog(entry);
    
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(`🟡 [WARN] ${context ? `[${context}]` : ''} ${message}`, data || '');
    }
  }

  info(message: string, data?: any, context?: string): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, data, context);
    this.addLog(entry);
    
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(`🔵 [INFO] ${context ? `[${context}]` : ''} ${message}`, data || '');
    }
  }

  debug(message: string, data?: any, context?: string): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, data, context);
    this.addLog(entry);
    
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(`🔍 [DEBUG] ${context ? `[${context}]` : ''} ${message}`, data || '');
    }
  }

  // الحصول على السجلات المحفوظة
  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter(log => log.level === level);
    }
    return this.logs;
  }

  // تنظيف السجلات
  clearLogs(): void {
    this.logs = [];
    localStorage.removeItem('critical_logs');
  }

  // تصدير السجلات للتشخيص
  exportLogs(): string {
    return JSON.stringify({
      logs: this.logs,
      exportDate: new Date().toISOString(),
      logLevel: this.logLevel
    }, null, 2);
  }

  // تعيين مستوى السجلات
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }
}

// إنشاء مثيل واحد للتطبيق
export const logger = Logger.getInstance();

// دوال مساعدة سريعة
export const logError = (message: string, data?: any, context?: string) => logger.error(message, data, context);
export const logWarn = (message: string, data?: any, context?: string) => logger.warn(message, data, context);
export const logInfo = (message: string, data?: any, context?: string) => logger.info(message, data, context);
export const logDebug = (message: string, data?: any, context?: string) => logger.debug(message, data, context);

// إعداد production - إزالة جميع console methods في الإنتاج
if (process.env.NODE_ENV === 'production') {
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
  // الاحتفاظ بـ console.warn و console.error للمشاكل الحرجة فقط
}