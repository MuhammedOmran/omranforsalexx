/**
 * مدير البيانات المحلية لـ Electron
 * يتعامل مع قاعدة البيانات المحلية بدلاً من localStorage فقط
 */

interface ElectronAPI {
  // النسخ الاحتياطي
  getMachineId: () => Promise<string>;
  getDefaultBackupDir: () => Promise<string>;
  saveBackup: (backupId: string, json: string, dir?: string) => Promise<{ success: boolean; path?: string; error?: string }>;
  
  // قاعدة البيانات المحلية
  getCustomers: (accountId: string) => Promise<any[]>;
  createCustomer: (customer: any) => Promise<{ success: boolean; id: string }>;
  updateCustomer: (id: string, customer: any) => Promise<{ success: boolean }>;
  deleteCustomer: (id: string) => Promise<{ success: boolean }>;
  
  getProducts: (accountId: string) => Promise<any[]>;
  createProduct: (product: any) => Promise<{ success: boolean; id: string }>;
  updateProduct: (id: string, product: any) => Promise<{ success: boolean }>;
  
  getSalesInvoices: (accountId: string) => Promise<any[]>;
  createSalesInvoice: (invoice: any) => Promise<{ success: boolean; id: string }>;
  
  getCategories: (accountId: string) => Promise<any[]>;
  
  createDBBackup: (backupPath: string) => Promise<{ success: boolean; path?: string; error?: string }>;
  restoreDBBackup: (backupPath: string) => Promise<{ success: boolean; error?: string }>;
  
  getDashboardStats: (accountId: string) => Promise<any>;
  
  // معلومات النظام
  isElectron: boolean;
  platform: string;
  versions: any;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

/**
 * فئة إدارة البيانات المحلية
 */
export class LocalDataManager {
  private static instance: LocalDataManager;
  private isElectron: boolean;

  constructor() {
    this.isElectron = typeof window !== 'undefined' && !!window.electronAPI;
  }

  static getInstance(): LocalDataManager {
    if (!LocalDataManager.instance) {
      LocalDataManager.instance = new LocalDataManager();
    }
    return LocalDataManager.instance;
  }

  /**
   * فحص إذا كان التطبيق يعمل في بيئة Electron
   */
  isElectronEnvironment(): boolean {
    return this.isElectron;
  }

  // ===== إدارة العملاء =====

  async getCustomers(accountId: string): Promise<any[]> {
    if (this.isElectron && window.electronAPI) {
      try {
        return await window.electronAPI.getCustomers(accountId);
      } catch (error) {
        console.error('خطأ في جلب العملاء من قاعدة البيانات:', error);
        // fallback to localStorage
        return this.getCustomersFromStorage(accountId);
      }
    }
    return this.getCustomersFromStorage(accountId);
  }

  async createCustomer(customer: any): Promise<{ success: boolean; id: string }> {
    if (this.isElectron && window.electronAPI) {
      try {
        const result = await window.electronAPI.createCustomer(customer);
        // أيضاً حفظ في localStorage كنسخة احتياطية
        this.saveCustomerToStorage(customer);
        return result;
      } catch (error) {
        console.error('خطأ في إنشاء العميل:', error);
        // fallback to localStorage
        return this.createCustomerInStorage(customer);
      }
    }
    return this.createCustomerInStorage(customer);
  }

  async updateCustomer(id: string, customer: any): Promise<{ success: boolean }> {
    if (this.isElectron && window.electronAPI) {
      try {
        return await window.electronAPI.updateCustomer(id, customer);
      } catch (error) {
        console.error('خطأ في تحديث العميل:', error);
        return { success: false };
      }
    }
    return this.updateCustomerInStorage(id, customer);
  }

  async deleteCustomer(id: string): Promise<{ success: boolean }> {
    if (this.isElectron && window.electronAPI) {
      try {
        return await window.electronAPI.deleteCustomer(id);
      } catch (error) {
        console.error('خطأ في حذف العميل:', error);
        return { success: false };
      }
    }
    return this.deleteCustomerFromStorage(id);
  }

  // ===== إدارة المنتجات =====

  async getProducts(accountId: string): Promise<any[]> {
    if (this.isElectron && window.electronAPI) {
      try {
        return await window.electronAPI.getProducts(accountId);
      } catch (error) {
        console.error('خطأ في جلب المنتجات من قاعدة البيانات:', error);
        return this.getProductsFromStorage(accountId);
      }
    }
    return this.getProductsFromStorage(accountId);
  }

  async createProduct(product: any): Promise<{ success: boolean; id: string }> {
    if (this.isElectron && window.electronAPI) {
      try {
        return await window.electronAPI.createProduct(product);
      } catch (error) {
        console.error('خطأ في إنشاء المنتج:', error);
        return this.createProductInStorage(product);
      }
    }
    return this.createProductInStorage(product);
  }

  async updateProduct(id: string, product: any): Promise<{ success: boolean }> {
    if (this.isElectron && window.electronAPI) {
      try {
        return await window.electronAPI.updateProduct(id, product);
      } catch (error) {
        console.error('خطأ في تحديث المنتج:', error);
        return { success: false };
      }
    }
    return this.updateProductInStorage(id, product);
  }

  // ===== إدارة فواتير المبيعات =====

  async getSalesInvoices(accountId: string): Promise<any[]> {
    if (this.isElectron && window.electronAPI) {
      try {
        return await window.electronAPI.getSalesInvoices(accountId);
      } catch (error) {
        console.error('خطأ في جلب فواتير المبيعات:', error);
        return this.getSalesInvoicesFromStorage(accountId);
      }
    }
    return this.getSalesInvoicesFromStorage(accountId);
  }

  async createSalesInvoice(invoice: any): Promise<{ success: boolean; id: string }> {
    if (this.isElectron && window.electronAPI) {
      try {
        return await window.electronAPI.createSalesInvoice(invoice);
      } catch (error) {
        console.error('خطأ في إنشاء فاتورة المبيعات:', error);
        return this.createSalesInvoiceInStorage(invoice);
      }
    }
    return this.createSalesInvoiceInStorage(invoice);
  }

  // ===== إدارة الفئات =====

  async getCategories(accountId: string): Promise<any[]> {
    if (this.isElectron && window.electronAPI) {
      try {
        return await window.electronAPI.getCategories(accountId);
      } catch (error) {
        console.error('خطأ في جلب الفئات:', error);
        return this.getCategoriesFromStorage(accountId);
      }
    }
    return this.getCategoriesFromStorage(accountId);
  }

  // ===== الإحصائيات =====

  async getDashboardStats(accountId: string): Promise<any> {
    if (this.isElectron && window.electronAPI) {
      try {
        return await window.electronAPI.getDashboardStats(accountId);
      } catch (error) {
        console.error('خطأ في جلب الإحصائيات:', error);
        return this.getDashboardStatsFromStorage(accountId);
      }
    }
    return this.getDashboardStatsFromStorage(accountId);
  }

  // ===== النسخ الاحتياطي =====

  async createBackup(): Promise<{ success: boolean; path?: string; error?: string }> {
    if (this.isElectron && window.electronAPI) {
      try {
        const backupDir = await window.electronAPI.getDefaultBackupDir();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = `${backupDir}/omran-backup-${timestamp}.json`;
        
        return await window.electronAPI.createDBBackup(backupPath);
      } catch (error) {
        console.error('خطأ في إنشاء النسخة الاحتياطية:', error);
        return { success: false, error: error.message };
      }
    }
    
    // fallback: export localStorage data
    return this.createLocalStorageBackup();
  }

  async restoreBackup(filePath: string): Promise<{ success: boolean; error?: string }> {
    if (this.isElectron && window.electronAPI) {
      try {
        return await window.electronAPI.restoreDBBackup(filePath);
      } catch (error) {
        console.error('خطأ في استيراد النسخة الاحتياطية:', error);
        return { success: false, error: error.message };
      }
    }
    
    return { success: false, error: 'غير متاح في المتصفح' };
  }

  // ===== دوال localStorage (للحالات الاحتياطية) =====

  private getCustomersFromStorage(accountId: string): any[] {
    const customers = localStorage.getItem(`customers_${accountId}`);
    return customers ? JSON.parse(customers) : [];
  }

  private saveCustomerToStorage(customer: any): void {
    const customers = this.getCustomersFromStorage(customer.account_id || 'default');
    customers.push(customer);
    localStorage.setItem(`customers_${customer.account_id || 'default'}`, JSON.stringify(customers));
  }

  private createCustomerInStorage(customer: any): { success: boolean; id: string } {
    const id = customer.id || `cust_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const customerWithId = { ...customer, id, created_at: new Date().toISOString() };
    this.saveCustomerToStorage(customerWithId);
    return { success: true, id };
  }

  private updateCustomerInStorage(id: string, customerData: any): { success: boolean } {
    const accountId = customerData.account_id || 'default';
    const customers = this.getCustomersFromStorage(accountId);
    const index = customers.findIndex(c => c.id === id);
    
    if (index !== -1) {
      customers[index] = { ...customers[index], ...customerData, updated_at: new Date().toISOString() };
      localStorage.setItem(`customers_${accountId}`, JSON.stringify(customers));
      return { success: true };
    }
    
    return { success: false };
  }

  private deleteCustomerFromStorage(id: string): { success: boolean } {
    // البحث في جميع الحسابات
    const allKeys = Object.keys(localStorage).filter(key => key.startsWith('customers_'));
    
    for (const key of allKeys) {
      const customers = JSON.parse(localStorage.getItem(key) || '[]');
      const filteredCustomers = customers.filter(c => c.id !== id);
      
      if (filteredCustomers.length !== customers.length) {
        localStorage.setItem(key, JSON.stringify(filteredCustomers));
        return { success: true };
      }
    }
    
    return { success: false };
  }

  private getProductsFromStorage(accountId: string): any[] {
    const products = localStorage.getItem(`products_${accountId}`);
    return products ? JSON.parse(products) : [];
  }

  private createProductInStorage(product: any): { success: boolean; id: string } {
    const id = product.id || `prod_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const productWithId = { ...product, id, created_at: new Date().toISOString() };
    
    const accountId = product.account_id || 'default';
    const products = this.getProductsFromStorage(accountId);
    products.push(productWithId);
    localStorage.setItem(`products_${accountId}`, JSON.stringify(products));
    
    return { success: true, id };
  }

  private updateProductInStorage(id: string, productData: any): { success: boolean } {
    const accountId = productData.account_id || 'default';
    const products = this.getProductsFromStorage(accountId);
    const index = products.findIndex(p => p.id === id);
    
    if (index !== -1) {
      products[index] = { ...products[index], ...productData, updated_at: new Date().toISOString() };
      localStorage.setItem(`products_${accountId}`, JSON.stringify(products));
      return { success: true };
    }
    
    return { success: false };
  }

  private getSalesInvoicesFromStorage(accountId: string): any[] {
    const invoices = localStorage.getItem(`sales_invoices_${accountId}`);
    return invoices ? JSON.parse(invoices) : [];
  }

  private createSalesInvoiceInStorage(invoice: any): { success: boolean; id: string } {
    const id = invoice.id || `inv_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const invoiceWithId = { ...invoice, id, created_at: new Date().toISOString() };
    
    const accountId = invoice.account_id || 'default';
    const invoices = this.getSalesInvoicesFromStorage(accountId);
    invoices.push(invoiceWithId);
    localStorage.setItem(`sales_invoices_${accountId}`, JSON.stringify(invoices));
    
    return { success: true, id };
  }

  private getCategoriesFromStorage(accountId: string): any[] {
    const categories = localStorage.getItem(`categories_${accountId}`);
    const defaultCategories = [
      { id: 'cat_1', name: 'منتجات غذائية', account_id: accountId },
      { id: 'cat_2', name: 'إلكترونيات', account_id: accountId },
      { id: 'cat_3', name: 'ملابس', account_id: accountId },
      { id: 'cat_4', name: 'منتجات منزلية', account_id: accountId }
    ];
    
    return categories ? JSON.parse(categories) : defaultCategories;
  }

  private getDashboardStatsFromStorage(accountId: string): any {
    const customers = this.getCustomersFromStorage(accountId);
    const products = this.getProductsFromStorage(accountId);
    const invoices = this.getSalesInvoicesFromStorage(accountId);
    
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const monthSales = invoices
      .filter(inv => inv.invoice_date?.slice(0, 7) === currentMonth)
      .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

    return {
      totalCustomers: customers.length,
      totalProducts: products.length,
      monthSales,
      lowStockProducts: products.filter(p => p.current_stock <= p.min_stock)
    };
  }

  private createLocalStorageBackup(): { success: boolean; path?: string; error?: string } {
    try {
      const allData = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          allData[key] = localStorage.getItem(key);
        }
      }
      
      const backupData = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        type: 'localStorage',
        data: allData
      };
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `omran-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// إنشاء مثيل واحد
export const localDataManager = LocalDataManager.getInstance();