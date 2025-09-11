/**
 * نسخة محسنة من إدارة البيانات المحلية
 * تدعم تطبيق Electron الأوف لاين بالكامل
 */

import { localDataManager } from './localDataManager';
import { useLocalAccounts } from '@/contexts/LocalAccountsContext';

// تحديث دوال البيانات المحلية للعمل مع Electron
export const saveData = async (key: string, data: any): Promise<boolean> => {
  try {
    // في بيئة Electron، نحفظ في قاعدة البيانات المحلية
    if (localDataManager.isElectronEnvironment()) {
      // هنا يمكن إضافة منطق حفظ مخصص لقاعدة البيانات
      console.log(`حفظ البيانات في Electron: ${key}`, data);
    }
    
    // حفظ احتياطي في localStorage
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now(),
      version: '1.0'
    }));
    
    return true;
  } catch (error) {
    console.error(`خطأ في حفظ البيانات (${key}):`, error);
    return false;
  }
};

export const loadData = <T>(key: string, defaultValue: T | null = null): T | null => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;

    const parsed = JSON.parse(item);
    
    // التعامل مع الصيغة القديمة (البيانات مباشرة)
    if (!parsed.timestamp) {
      return parsed as T;
    }
    
    // التعامل مع الصيغة الجديدة (مع metadata)
    return parsed.data as T;
  } catch (error) {
    console.error(`خطأ في قراءة البيانات (${key}):`, error);
    return defaultValue;
  }
};

// دوال إدارة العملاء محسنة لـ Electron
export const getCustomers = async (accountId?: string): Promise<any[]> => {
  const currentAccountId = accountId || 'default';
  return await localDataManager.getCustomers(currentAccountId);
};

export const saveCustomer = async (customer: any): Promise<{ success: boolean; id: string }> => {
  const customerData = {
    ...customer,
    account_id: customer.account_id || 'default',
    created_at: customer.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  return await localDataManager.createCustomer(customerData);
};

export const updateCustomer = async (id: string, customer: any): Promise<{ success: boolean }> => {
  return await localDataManager.updateCustomer(id, {
    ...customer,
    updated_at: new Date().toISOString()
  });
};

export const deleteCustomer = async (id: string): Promise<{ success: boolean }> => {
  return await localDataManager.deleteCustomer(id);
};

// دوال إدارة المنتجات محسنة لـ Electron
export const getProducts = async (accountId?: string): Promise<any[]> => {
  const currentAccountId = accountId || 'default';
  return await localDataManager.getProducts(currentAccountId);
};

export const saveProduct = async (product: any): Promise<{ success: boolean; id: string }> => {
  const productData = {
    ...product,
    account_id: product.account_id || 'default',
    created_at: product.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_active: product.is_active !== undefined ? product.is_active : true
  };
  
  return await localDataManager.createProduct(productData);
};

export const updateProduct = async (id: string, product: any): Promise<{ success: boolean }> => {
  return await localDataManager.updateProduct(id, {
    ...product,
    updated_at: new Date().toISOString()
  });
};

// دوال إدارة فواتير المبيعات محسنة لـ Electron
export const getSalesInvoices = async (accountId?: string): Promise<any[]> => {
  const currentAccountId = accountId || 'default';
  return await localDataManager.getSalesInvoices(currentAccountId);
};

export const saveSalesInvoice = async (invoice: any): Promise<{ success: boolean; id: string }> => {
  const invoiceData = {
    ...invoice,
    account_id: invoice.account_id || 'default',
    invoice_date: invoice.invoice_date || new Date().toISOString(),
    created_at: invoice.created_at || new Date().toISOString(),
    status: invoice.status || 'pending'
  };
  
  return await localDataManager.createSalesInvoice(invoiceData);
};

// دوال إدارة الفئات
export const getCategories = async (accountId?: string): Promise<any[]> => {
  const currentAccountId = accountId || 'default';
  return await localDataManager.getCategories(currentAccountId);
};

// دوال الإحصائيات
export const getDashboardStats = async (accountId?: string): Promise<any> => {
  const currentAccountId = accountId || 'default';
  return await localDataManager.getDashboardStats(currentAccountId);
};

// دوال النسخ الاحتياطي محسنة
export const createBackup = async (): Promise<{ success: boolean; path?: string; error?: string }> => {
  return await localDataManager.createBackup();
};

export const restoreBackup = async (filePath: string): Promise<{ success: boolean; error?: string }> => {
  return await localDataManager.restoreBackup(filePath);
};

// فحص بيئة التشغيل
export const isElectronApp = (): boolean => {
  return localDataManager.isElectronEnvironment();
};

// دوال إضافية للتوافق مع الكود الموجود
export const getUserData = (key: string): any => {
  return loadData(key);
};

export const saveUserData = (key: string, data: any): boolean => {
  try {
    saveData(key, data);
    return true;
  } catch {
    return false;
  }
};

export const exportUserData = (): any => {
  const allData: any = {};
  
  // جمع البيانات من localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      try {
        allData[key] = JSON.parse(localStorage.getItem(key) || '');
      } catch {
        allData[key] = localStorage.getItem(key);
      }
    }
  }
  
  return allData;
};

export const importUserData = (data: any): boolean => {
  try {
    for (const [key, value] of Object.entries(data)) {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    }
    return true;
  } catch (error) {
    console.error('خطأ في استيراد البيانات:', error);
    return false;
  }
};

// تحديث دالة generateInvoiceNumber لتعمل مع قاعدة البيانات المحلية
export const generateInvoiceNumber = async (accountId?: string): Promise<string> => {
  try {
    const currentAccountId = accountId || 'default';
    const invoices = await getSalesInvoices(currentAccountId);
    
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    // العثور على آخر رقم فاتورة لهذا اليوم
    const todayPrefix = `INV-${year}${month}${day}`;
    const todayInvoices = invoices.filter(inv => 
      inv.invoice_number?.startsWith(todayPrefix)
    );
    
    const nextNumber = todayInvoices.length + 1;
    return `${todayPrefix}-${String(nextNumber).padStart(3, '0')}`;
  } catch (error) {
    console.error('خطأ في توليد رقم الفاتورة:', error);
    const timestamp = Date.now();
    return `INV-${timestamp}`;
  }
};

// hook مخصص لاستخدام البيانات المحلية
export const useLocalData = () => {
  return {
    isElectron: isElectronApp(),
    getCustomers,
    saveCustomer,
    updateCustomer,
    deleteCustomer,
    getProducts,
    saveProduct,
    updateProduct,
    getSalesInvoices,
    saveSalesInvoice,
    getCategories,
    getDashboardStats,
    createBackup,
    restoreBackup,
    generateInvoiceNumber
  };
};