/**
 * أداة تنظيف localStorage من البيانات التالفة
 */

interface CleanupResult {
  cleaned: number;
  errors: string[];
  totalKeys: number;
}

class StorageCleanup {
  private corruptedKeys: Set<string> = new Set();

  /**
   * تنظيف شامل للـ localStorage
   */
  public performCleanup(): CleanupResult {
    const result: CleanupResult = {
      cleaned: 0,
      errors: [],
      totalKeys: 0
    };

    try {
      result.totalKeys = localStorage.length;
      const keysToRemove: string[] = [];

      // فحص كل مفتاح في localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        try {
          const value = localStorage.getItem(key);
          if (!value) {
            keysToRemove.push(key);
            continue;
          }

          // محاولة parse القيمة
          this.validateStorageValue(key, value);
        } catch (error) {
          console.warn(`Corrupted localStorage key found: ${key}`, error);
          keysToRemove.push(key);
          this.corruptedKeys.add(key);
        }
      }

      // إزالة المفاتيح التالفة
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
          result.cleaned++;
        } catch (error) {
          result.errors.push(`Failed to remove key: ${key}`);
        }
      });

      console.log(`Storage cleanup completed: ${result.cleaned} items cleaned`);
      
    } catch (error) {
      result.errors.push(`Cleanup failed: ${error.message}`);
    }

    return result;
  }

  /**
   * التحقق من صحة قيمة التخزين
   */
  private validateStorageValue(key: string, value: string): boolean {
    // تجاهل القيم التي تحتوي على نص بسيط (strings)
    if (this.isSimpleString(value)) {
      return true;
    }

    // محاولة parse كـ JSON
    try {
      JSON.parse(value);
      return true;
    } catch (error) {
      throw new Error(`Invalid JSON in key ${key}: ${error.message}`);
    }
  }

  /**
   * التحقق من كون القيمة نص بسيط
   */
  private isSimpleString(value: string): boolean {
    // إذا لم تبدأ بـ { أو [ فهي نص بسيط
    const trimmed = value.trim();
    return !trimmed.startsWith('{') && !trimmed.startsWith('[');
  }

  /**
   * إصلاح المفاتيح المعروفة
   */
  public fixKnownIssues(): CleanupResult {
    const result: CleanupResult = {
      cleaned: 0,
      errors: [],
      totalKeys: localStorage.length
    };

    const knownStringKeys = [
      'acc:default:theme',
      'device_id', 
      'active_account_id',
      'admin_authenticated',
      'remember_login',
      'selected_theme'
    ];

    knownStringKeys.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        if (value && this.isSimpleString(value)) {
          // القيمة صحيحة كنص بسيط، لا حاجة لتغييرها
          return;
        }
        
        if (value) {
          try {
            // محاولة parse ثم إعادة حفظ
            const parsed = JSON.parse(value);
            if (typeof parsed === 'string') {
              localStorage.setItem(key, parsed);
              result.cleaned++;
            }
          } catch (error) {
            // إذا فشل parsing، احتفظ بالقيمة كما هي
            console.warn(`Could not fix key ${key}:`, error);
          }
        }
      } catch (error) {
        result.errors.push(`Failed to fix key ${key}: ${error.message}`);
      }
    });

    return result;
  }

  /**
   * تنظيف البيانات القديمة
   */
  public cleanOldData(maxAge: number = 7 * 24 * 60 * 60 * 1000): CleanupResult {
    const result: CleanupResult = {
      cleaned: 0,
      errors: [],
      totalKeys: localStorage.length
    };

    const now = Date.now();
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      try {
        const value = localStorage.getItem(key);
        if (!value) continue;

        // محاولة استخراج timestamp
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === 'object' && parsed.timestamp) {
          const age = now - parsed.timestamp;
          if (age > maxAge) {
            keysToRemove.push(key);
          }
        }
      } catch (error) {
        // تجاهل الأخطاء للبيانات التي ليست JSON
        continue;
      }
    }

    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
        result.cleaned++;
      } catch (error) {
        result.errors.push(`Failed to remove old key: ${key}`);
      }
    });

    return result;
  }

  /**
   * الحصول على تقرير حالة التخزين
   */
  public getStorageReport(): {
    totalKeys: number;
    corruptedKeys: string[];
    storageUsage: { used: number; available: number; percentage: number };
  } {
    const totalKeys = localStorage.length;
    const corruptedKeys = Array.from(this.corruptedKeys);
    
    // حساب استخدام التخزين
    let used = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        used += key.length + (value?.length || 0);
      }
    }

    const available = 5 * 1024 * 1024; // تقدير 5MB
    const percentage = (used / available) * 100;

    return {
      totalKeys,
      corruptedKeys,
      storageUsage: {
        used,
        available,
        percentage
      }
    };
  }

  /**
   * تشغيل تنظيف كامل وآمن
   */
  public safeCleanup(): CleanupResult {
    console.log('Starting safe storage cleanup...');
    
    // 1. إصلاح المشاكل المعروفة أولاً
    const fixResult = this.fixKnownIssues();
    
    // 2. تنظيف البيانات القديمة
    const oldDataResult = this.cleanOldData();
    
    // 3. تنظيف البيانات التالفة
    const cleanupResult = this.performCleanup();

    // دمج النتائج
    return {
      cleaned: fixResult.cleaned + oldDataResult.cleaned + cleanupResult.cleaned,
      errors: [...fixResult.errors, ...oldDataResult.errors, ...cleanupResult.errors],
      totalKeys: cleanupResult.totalKeys
    };
  }
}

// إنشاء مثيل واحد
export const storageCleanup = new StorageCleanup();

// تشغيل تنظيف آمن عند تحميل النمط
if (typeof window !== 'undefined') {
  // تشغيل التنظيف بعد تحميل الصفحة
  setTimeout(() => {
    const result = storageCleanup.safeCleanup();
    if (result.cleaned > 0) {
      console.log(`Storage cleanup completed: ${result.cleaned} items fixed/removed`);
    }
    if (result.errors.length > 0) {
      console.warn('Storage cleanup errors:', result.errors);
    }
  }, 1000);
  
  // تشغيل تنظيف دوري كل ساعة
  setInterval(() => {
    storageCleanup.cleanOldData();
  }, 60 * 60 * 1000);
}