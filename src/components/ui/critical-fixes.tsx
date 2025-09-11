/**
 * إصلاحات حرجة لمعالجة أخطاء any types والملفات الحرجة
 */

import React, { useState, useEffect } from 'react';
import { logger } from '@/utils/logger';
import { convertToInvoice, convertToCustomer, convertToProduct } from '@/utils/typeGuards';

// Hook آمن لمعالجة localStorage مع type safety
export function useSafeLocalStorage<T>(
  key: string, 
  defaultValue: T,
  validator?: (value: unknown) => value is T
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;
      
      const parsed = JSON.parse(item);
      
      // إذا وُجد validator، استخدمه للتحقق
      if (validator && !validator(parsed)) {
        logger.warn(`Invalid data type for key ${key}, using default`, parsed, 'useSafeLocalStorage');
        return defaultValue;
      }
      
      return parsed;
    } catch (error) {
      logger.error(`Error reading localStorage key ${key}:`, error, 'useSafeLocalStorage');
      return defaultValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      logger.error(`Error setting localStorage key ${key}:`, error, 'useSafeLocalStorage');
    }
  };

  return [storedValue, setValue];
}

// Hook آمن لمعالجة الفواتير
export function useSafeInvoices() {
  return useSafeLocalStorage('sales_invoices', [], (value): value is any[] => {
    if (!Array.isArray(value)) return false;
    // تحويل كل عنصر إلى invoice صحيح
    return value.every(item => convertToInvoice(item) !== null);
  });
}

// Hook آمن لمعالجة العملاء
export function useSafeCustomers() {
  return useSafeLocalStorage('customers', [], (value): value is any[] => {
    if (!Array.isArray(value)) return false;
    return value.every(item => convertToCustomer(item) !== null);
  });
}

// Hook آمن لمعالجة المنتجات
export function useSafeProducts() {
  return useSafeLocalStorage('products', [], (value): value is any[] => {
    if (!Array.isArray(value)) return false;
    return value.every(item => convertToProduct(item) !== null);
  });
}

// مكون آمن لمعالجة البيانات المجهولة
interface SafeDataDisplayProps {
  data: any;
  fallback?: React.ReactNode;
  className?: string;
}

export function SafeDataDisplay({ data, fallback = 'لا توجد بيانات', className }: SafeDataDisplayProps) {
  if (data === null || data === undefined) {
    return <div className={className}>{fallback}</div>;
  }

  if (typeof data === 'string' || typeof data === 'number') {
    return <div className={className}>{String(data)}</div>;
  }

  if (typeof data === 'object') {
    try {
      const displayValue = Array.isArray(data) 
        ? `${data.length} عنصر`
        : Object.keys(data).length > 0 
          ? `كائن (${Object.keys(data).length} خاصية)`
          : 'كائن فارغ';
      
      return <div className={className}>{displayValue}</div>;
    } catch (error) {
      logger.error('Error displaying object data:', error, 'SafeDataDisplay');
      return <div className={className}>{fallback}</div>;
    }
  }

  return <div className={className}>{String(data)}</div>;
}

// Hook لإصلاح البيانات التالفة تلقائياً
export function useDataRepair() {
  useEffect(() => {
    const repairData = async () => {
      try {
        // إصلاح الفواتير
        const invoicesRaw = localStorage.getItem('sales_invoices');
        if (invoicesRaw) {
          try {
            const invoices = JSON.parse(invoicesRaw);
            if (Array.isArray(invoices)) {
              const repairedInvoices = invoices
                .map(convertToInvoice)
                .filter(Boolean);
              
              if (repairedInvoices.length !== invoices.length) {
                localStorage.setItem('sales_invoices', JSON.stringify(repairedInvoices));
                logger.info(`Repaired ${invoices.length - repairedInvoices.length} invoices`, undefined, 'useDataRepair');
              }
            }
          } catch (error) {
            logger.error('Failed to repair invoices:', error, 'useDataRepair');
            localStorage.removeItem('sales_invoices');
          }
        }

        // إصلاح العملاء
        const customersRaw = localStorage.getItem('customers');
        if (customersRaw) {
          try {
            const customers = JSON.parse(customersRaw);
            if (Array.isArray(customers)) {
              const repairedCustomers = customers
                .map(convertToCustomer)
                .filter(Boolean);
              
              if (repairedCustomers.length !== customers.length) {
                localStorage.setItem('customers', JSON.stringify(repairedCustomers));
                logger.info(`Repaired ${customers.length - repairedCustomers.length} customers`, undefined, 'useDataRepair');
              }
            }
          } catch (error) {
            logger.error('Failed to repair customers:', error, 'useDataRepair');
            localStorage.removeItem('customers');
          }
        }

        // إصلاح المنتجات
        const productsRaw = localStorage.getItem('products');
        if (productsRaw) {
          try {
            const products = JSON.parse(productsRaw);
            if (Array.isArray(products)) {
              const repairedProducts = products
                .map(convertToProduct)
                .filter(Boolean);
              
              if (repairedProducts.length !== products.length) {
                localStorage.setItem('products', JSON.stringify(repairedProducts));
                logger.info(`Repaired ${products.length - repairedProducts.length} products`, undefined, 'useDataRepair');
              }
            }
          } catch (error) {
            logger.error('Failed to repair products:', error, 'useDataRepair');
            localStorage.removeItem('products');
          }
        }

      } catch (error) {
        logger.error('Data repair process failed:', error, 'useDataRepair');
      }
    };

    // تشغيل الإصلاح بعد تحميل المكون
    const timer = setTimeout(repairData, 1000);
    return () => clearTimeout(timer);
  }, []);
}

// مكون لتطبيق الإصلاحات الحرجة
export function CriticalFixesProvider({ children }: { children: React.ReactNode }) {
  useDataRepair();
  
  return <>{children}</>;
}