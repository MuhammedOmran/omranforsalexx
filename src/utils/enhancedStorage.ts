/**
 * نظام التخزين الآمن والمحسن لاستبدال localStorage المباشر
 */

import { logger } from './logger';

// أنواع البيانات المدعومة
export type StorageValue = string | number | boolean | object | null;

// إعدادات التخزين
interface StorageOptions {
  encrypt?: boolean;
  compress?: boolean;
  ttl?: number; // Time to live in milliseconds
  validate?: (value: unknown) => boolean;
}

// نتيجة عملية التخزين
interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class EnhancedStorage {
  private static instance: EnhancedStorage;
  private cache = new Map<string, { value: any; expiry?: number; options?: StorageOptions }>();

  static getInstance(): EnhancedStorage {
    if (!EnhancedStorage.instance) {
      EnhancedStorage.instance = new EnhancedStorage();
    }
    return EnhancedStorage.instance;
  }

  /**
   * حفظ البيانات بشكل آمن
   */
  setItem<T extends StorageValue>(
    key: string,
    value: T,
    options: StorageOptions = {}
  ): StorageResult<T> {
    try {
      // التحقق من صحة البيانات
      if (options.validate && !options.validate(value)) {
        const error = `Validation failed for key: ${key}`;
        logger.warn(error, value, 'EnhancedStorage');
        return { success: false, error };
      }

      // تحضير البيانات للحفظ
      const dataToStore = {
        value,
        timestamp: Date.now(),
        options,
        ...(options.ttl && { expiry: Date.now() + options.ttl })
      };

      // حفظ في الذاكرة المؤقتة
      this.cache.set(key, dataToStore);

      // حفظ في localStorage
      let serializedData = JSON.stringify(dataToStore);

      // ضغط البيانات إذا كان مطلوباً
      if (options.compress && serializedData.length > 1000) {
        // يمكن إضافة ضغط متقدم هنا لاحقاً
        logger.debug(`Large data saved for key: ${key} (${serializedData.length} chars)`, undefined, 'EnhancedStorage');
      }

      localStorage.setItem(key, serializedData);

      logger.debug(`Data saved successfully for key: ${key}`, undefined, 'EnhancedStorage');
      return { success: true, data: value };

    } catch (error) {
      const errorMsg = `Failed to save data for key: ${key}`;
      logger.error(errorMsg, error, 'EnhancedStorage');
      return { success: false, error: errorMsg };
    }
  }

  /**
   * استرجاع البيانات بشكل آمن
   */
  getItem<T extends StorageValue>(
    key: string,
    defaultValue: T | null = null
  ): StorageResult<T> {
    try {
      // البحث في الذاكرة المؤقتة أولاً
      const cached = this.cache.get(key);
      if (cached) {
        // التحقق من انتهاء الصلاحية
        if (cached.expiry && Date.now() > cached.expiry) {
          this.removeItem(key);
          return { success: true, data: defaultValue };
        }
        return { success: true, data: cached.value };
      }

      // البحث في localStorage
      const storedData = localStorage.getItem(key);
      if (!storedData) {
        return { success: true, data: defaultValue };
      }

      // تحليل البيانات
      const parsedData = JSON.parse(storedData);

      // التحقق من انتهاء الصلاحية
      if (parsedData.expiry && Date.now() > parsedData.expiry) {
        this.removeItem(key);
        return { success: true, data: defaultValue };
      }

      // التحقق من صحة البيانات
      if (parsedData.options?.validate && !parsedData.options.validate(parsedData.value)) {
        logger.warn(`Invalid data found for key: ${key}`, parsedData.value, 'EnhancedStorage');
        this.removeItem(key);
        return { success: true, data: defaultValue };
      }

      // حفظ في الذاكرة المؤقتة
      this.cache.set(key, parsedData);

      return { success: true, data: parsedData.value };

    } catch (error) {
      const errorMsg = `Failed to retrieve data for key: ${key}`;
      logger.error(errorMsg, error, 'EnhancedStorage');
      
      // محاولة إزالة البيانات التالفة
      try {
        localStorage.removeItem(key);
      } catch {}

      return { success: false, error: errorMsg, data: defaultValue };
    }
  }

  /**
   * إزالة البيانات
   */
  removeItem(key: string): StorageResult<null> {
    try {
      this.cache.delete(key);
      localStorage.removeItem(key);
      logger.debug(`Data removed for key: ${key}`, undefined, 'EnhancedStorage');
      return { success: true };
    } catch (error) {
      const errorMsg = `Failed to remove data for key: ${key}`;
      logger.error(errorMsg, error, 'EnhancedStorage');
      return { success: false, error: errorMsg };
    }
  }

  /**
   * مسح جميع البيانات
   */
  clear(): StorageResult<null> {
    try {
      this.cache.clear();
      localStorage.clear();
      logger.info('All storage data cleared', undefined, 'EnhancedStorage');
      return { success: true };
    } catch (error) {
      const errorMsg = 'Failed to clear storage';
      logger.error(errorMsg, error, 'EnhancedStorage');
      return { success: false, error: errorMsg };
    }
  }

  /**
   * الحصول على جميع المفاتيح
   */
  getAllKeys(): string[] {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) keys.push(key);
      }
      return keys;
    } catch (error) {
      logger.error('Failed to get all keys', error, 'EnhancedStorage');
      return [];
    }
  }

  /**
   * تنظيف البيانات المنتهية الصلاحية
   */
  cleanup(): void {
    try {
      const now = Date.now();
      const keysToRemove: string[] = [];

      // تنظيف الذاكرة المؤقتة
      for (const [key, data] of this.cache.entries()) {
        if (data.expiry && now > data.expiry) {
          keysToRemove.push(key);
        }
      }

      // تنظيف localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.expiry && now > data.expiry) {
            keysToRemove.push(key);
          }
        } catch {
          // البيانات تالفة، أضفها للإزالة
          keysToRemove.push(key);
        }
      }

      // إزالة البيانات المنتهية الصلاحية
      keysToRemove.forEach(key => this.removeItem(key));

      if (keysToRemove.length > 0) {
        logger.info(`Cleaned up ${keysToRemove.length} expired/corrupted items`, undefined, 'EnhancedStorage');
      }

    } catch (error) {
      logger.error('Cleanup failed', error, 'EnhancedStorage');
    }
  }

  /**
   * الحصول على إحصائيات التخزين
   */
  getStats(): {
    totalKeys: number;
    cacheSize: number;
    storageUsed: number;
    estimatedQuota: number;
  } {
    try {
      let storageUsed = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          storageUsed += key.length + (value?.length || 0);
        }
      }

      return {
        totalKeys: localStorage.length,
        cacheSize: this.cache.size,
        storageUsed,
        estimatedQuota: 5 * 1024 * 1024 // 5MB estimate
      };
    } catch (error) {
      logger.error('Failed to get storage stats', error, 'EnhancedStorage');
      return { totalKeys: 0, cacheSize: 0, storageUsed: 0, estimatedQuota: 0 };
    }
  }
}

// إنشاء مثيل واحد
export const enhancedStorage = EnhancedStorage.getInstance();

// تنظيف دوري كل 30 دقيقة
if (typeof window !== 'undefined') {
  setInterval(() => {
    enhancedStorage.cleanup();
  }, 30 * 60 * 1000);
}

// دوال مساعدة للتوافق مع localStorage العادي
export const storage = {
  setItem: <T extends StorageValue>(key: string, value: T, options?: StorageOptions) => {
    const result = enhancedStorage.setItem(key, value, options);
    if (!result.success) {
      logger.warn(`Storage setItem failed for key: ${key}`, result.error, 'storage');
    }
    return result;
  },

  getItem: <T extends StorageValue>(key: string, defaultValue: T | null = null) => {
    const result = enhancedStorage.getItem(key, defaultValue);
    if (!result.success) {
      logger.warn(`Storage getItem failed for key: ${key}`, result.error, 'storage');
    }
    return result.data;
  },

  removeItem: (key: string) => {
    const result = enhancedStorage.removeItem(key);
    if (!result.success) {
      logger.warn(`Storage removeItem failed for key: ${key}`, result.error, 'storage');
    }
    return result.success;
  },

  clear: () => {
    const result = enhancedStorage.clear();
    if (!result.success) {
      logger.warn('Storage clear failed', result.error, 'storage');
    }
    return result.success;
  },

  getAllKeys: () => enhancedStorage.getAllKeys(),
  cleanup: () => enhancedStorage.cleanup(),
  getStats: () => enhancedStorage.getStats()
};