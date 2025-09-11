/**
 * نظام التكامل مع Electron - دعم قاعدة البيانات المحلية
 */

// تحقق من بيئة Electron
export const isElectronApp = (): boolean => {
  return typeof window !== 'undefined' && !!window.electronAPI;
};

// أنواع البيانات
export interface Customer {
  id: string;
  account_id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  credit_limit?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  account_id: string;
  name: string;
  description?: string;
  category_id?: string;
  barcode?: string;
  sku?: string;
  cost_price: number;
  selling_price: number;
  min_stock: number;
  current_stock: number;
  unit?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SalesInvoice {
  id: string;
  account_id: string;
  invoice_number: string;
  customer_id?: string;
  invoice_date: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  notes?: string;
  items?: SalesInvoiceItem[];
  created_at?: string;
  updated_at?: string;
}

export interface SalesInvoiceItem {
  id?: string;
  invoice_id?: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
}

// العمليات على العملاء
export class ElectronCustomerService {
  static async getCustomers(accountId: string): Promise<Customer[]> {
    if (isElectronApp() && window.electronAPI) {
      try {
        return await window.electronAPI.getCustomers(accountId);
      } catch (error) {
        console.error('خطأ في جلب العملاء:', error);
        throw error;
      }
    }
    throw new Error('Electron API not available');
  }

  static async createCustomer(customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; id: string }> {
    if (isElectronApp() && window.electronAPI) {
      try {
        return await window.electronAPI.createCustomer(customer);
      } catch (error) {
        console.error('خطأ في إنشاء العميل:', error);
        throw error;
      }
    }
    throw new Error('Electron API not available');
  }

  static async updateCustomer(id: string, customer: Partial<Customer>): Promise<{ success: boolean }> {
    if (isElectronApp() && window.electronAPI) {
      try {
        return await window.electronAPI.updateCustomer(id, customer);
      } catch (error) {
        console.error('خطأ في تحديث العميل:', error);
        throw error;
      }
    }
    throw new Error('Electron API not available');
  }

  static async deleteCustomer(id: string): Promise<{ success: boolean }> {
    if (isElectronApp() && window.electronAPI) {
      try {
        return await window.electronAPI.deleteCustomer(id);
      } catch (error) {
        console.error('خطأ في حذف العميل:', error);
        throw error;
      }
    }
    throw new Error('Electron API not available');
  }
}

// العمليات على المنتجات
export class ElectronProductService {
  static async getProducts(accountId: string): Promise<Product[]> {
    if (isElectronApp() && window.electronAPI) {
      try {
        return await window.electronAPI.getProducts(accountId);
      } catch (error) {
        console.error('خطأ في جلب المنتجات:', error);
        throw error;
      }
    }
    throw new Error('Electron API not available');
  }

  static async createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; id: string }> {
    if (isElectronApp() && window.electronAPI) {
      try {
        return await window.electronAPI.createProduct(product);
      } catch (error) {
        console.error('خطأ في إنشاء المنتج:', error);
        throw error;
      }
    }
    throw new Error('Electron API not available');
  }

  static async updateProduct(id: string, product: Partial<Product>): Promise<{ success: boolean }> {
    if (isElectronApp() && window.electronAPI) {
      try {
        return await window.electronAPI.updateProduct(id, product);
      } catch (error) {
        console.error('خطأ في تحديث المنتج:', error);
        throw error;
      }
    }
    throw new Error('Electron API not available');
  }
}

// العمليات على فواتير المبيعات
export class ElectronSalesService {
  static async getSalesInvoices(accountId: string): Promise<SalesInvoice[]> {
    if (isElectronApp() && window.electronAPI) {
      try {
        return await window.electronAPI.getSalesInvoices(accountId);
      } catch (error) {
        console.error('خطأ في جلب فواتير المبيعات:', error);
        throw error;
      }
    }
    throw new Error('Electron API not available');
  }

  static async createSalesInvoice(invoice: Omit<SalesInvoice, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; id: string }> {
    if (isElectronApp() && window.electronAPI) {
      try {
        return await window.electronAPI.createSalesInvoice(invoice);
      } catch (error) {
        console.error('خطأ في إنشاء فاتورة المبيعات:', error);
        throw error;
      }
    }
    throw new Error('Electron API not available');
  }
}

// الإحصائيات
export class ElectronStatsService {
  static async getDashboardStats(accountId: string): Promise<any> {
    if (isElectronApp() && window.electronAPI) {
      try {
        return await window.electronAPI.getDashboardStats(accountId);
      } catch (error) {
        console.error('خطأ في جلب الإحصائيات:', error);
        throw error;
      }
    }
    throw new Error('Electron API not available');
  }
}

// النسخ الاحتياطي لقاعدة البيانات
export class ElectronBackupService {
  static async createDatabaseBackup(backupPath?: string): Promise<{ success: boolean; path?: string; error?: string }> {
    if (isElectronApp() && window.electronAPI) {
      try {
        return await window.electronAPI.createDBBackup(backupPath || '');
      } catch (error) {
        console.error('خطأ في إنشاء النسخة الاحتياطية:', error);
        return { success: false, error: error.message };
      }
    }
    throw new Error('Electron API not available');
  }

  static async restoreDatabaseBackup(backupPath: string): Promise<{ success: boolean; error?: string }> {
    if (isElectronApp() && window.electronAPI) {
      try {
        return await window.electronAPI.restoreDBBackup(backupPath);
      } catch (error) {
        console.error('خطأ في استيراد النسخة الاحتياطية:', error);
        return { success: false, error: error.message };
      }
    }
    throw new Error('Electron API not available');
  }
}

// دالة شاملة للحصول على معلومات البيئة
export const getElectronEnvironmentInfo = async () => {
  if (!isElectronApp()) {
    return {
      isElectron: false,
      platform: 'web',
      version: null,
      databaseType: 'localStorage'
    };
  }

  return {
    isElectron: true,
    platform: window.electronAPI?.platform || 'unknown',
    version: window.electronAPI?.versions || null,
    databaseType: 'sqlite'
  };
};