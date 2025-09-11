// نظام إدارة البيانات المنفصلة لكل مستخدم
export class UserDataManager {
  private static getCurrentUserId(): string | null {
    const currentUser = localStorage.getItem('current_user');
    if (!currentUser) return null;
    
    try {
      const user = JSON.parse(currentUser);
      return user.id;
    } catch {
      return null;
    }
  }

  private static getUserDataKey(dataType: string): string {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('لا يوجد مستخدم مسجل دخول');
    return `user_${userId}_${dataType}`;
  }

  // حفظ البيانات للمستخدم الحالي
  static setUserData<T>(dataType: string, data: T): void {
    try {
      const key = this.getUserDataKey(dataType);
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('خطأ في حفظ البيانات:', error);
      throw error;
    }
  }

  // جلب البيانات للمستخدم الحالي
  static getUserData<T>(dataType: string, defaultValue: T = [] as any): T {
    try {
      const key = this.getUserDataKey(dataType);
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      console.error('خطأ في جلب البيانات:', error);
      return defaultValue;
    }
  }

  // حذف نوع معين من البيانات للمستخدم الحالي
  static removeUserData(dataType: string): void {
    try {
      const key = this.getUserDataKey(dataType);
      localStorage.removeItem(key);
    } catch (error) {
      console.error('خطأ في حذف البيانات:', error);
    }
  }

  // مسح جميع بيانات المستخدم الحالي
  static clearAllUserData(): void {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) return;

      const keys = Object.keys(localStorage);
      const userKeys = keys.filter(key => key.startsWith(`user_${userId}_`));
      
      userKeys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('خطأ في مسح البيانات:', error);
    }
  }

  // تصدير بيانات المستخدم الحالي
  static exportUserData(): Record<string, any> {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) throw new Error('لا يوجد مستخدم مسجل دخول');

      const keys = Object.keys(localStorage);
      const userKeys = keys.filter(key => key.startsWith(`user_${userId}_`));
      
      const exportData: Record<string, any> = {};
      userKeys.forEach(key => {
        const dataType = key.replace(`user_${userId}_`, '');
        const data = localStorage.getItem(key);
        if (data) {
          exportData[dataType] = JSON.parse(data);
        }
      });

      return exportData;
    } catch (error) {
      console.error('خطأ في تصدير البيانات:', error);
      return {};
    }
  }

  // استيراد بيانات للمستخدم الحالي
  static importUserData(data: Record<string, any>): void {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) throw new Error('لا يوجد مستخدم مسجل دخول');

      Object.entries(data).forEach(([dataType, value]) => {
        this.setUserData(dataType, value);
      });
    } catch (error) {
      console.error('خطأ في استيراد البيانات:', error);
      throw error;
    }
  }

  // أنواع البيانات المدعومة
  static readonly DataTypes = {
    CUSTOMERS: 'customers',
    SALES_INVOICES: 'sales_invoices',
    PURCHASE_INVOICES: 'purchase_invoices',
    PRODUCTS: 'products',
    SUPPLIERS: 'suppliers',
    EMPLOYEES: 'employees',
    EXPENSES: 'expenses',
    CASH_REGISTER: 'cash_register',
    INSTALLMENTS: 'installments',
    CHECKS: 'checks',
    RETURNS: 'returns',
    SETTINGS: 'settings'
  } as const;

  // التحقق من وجود بيانات للمستخدم
  static hasUserData(dataType: string): boolean {
    try {
      const key = this.getUserDataKey(dataType);
      return localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  }

  // إحصائيات البيانات للمستخدم
  static getUserDataStats(): Record<string, number> {
    try {
      const stats: Record<string, number> = {};
      
      Object.values(this.DataTypes).forEach(dataType => {
        const data = this.getUserData(dataType, []);
        stats[dataType] = Array.isArray(data) ? data.length : 0;
      });

      return stats;
    } catch (error) {
      console.error('خطأ في جلب إحصائيات البيانات:', error);
      return {};
    }
  }
}

// مساعدات سريعة للاستخدام المباشر
export const saveUserData = UserDataManager.setUserData;
export const getUserData = UserDataManager.getUserData;
export const removeUserData = UserDataManager.removeUserData;
export const clearAllUserData = UserDataManager.clearAllUserData;
export const exportUserData = UserDataManager.exportUserData;
export const importUserData = UserDataManager.importUserData;
export const DataTypes = UserDataManager.DataTypes;