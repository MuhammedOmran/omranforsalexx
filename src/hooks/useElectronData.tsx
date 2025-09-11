import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import {
  ElectronCustomerService,
  ElectronProductService,
  ElectronSalesService,
  ElectronStatsService,
  isElectronApp,
  Customer,
  Product,
  SalesInvoice
} from '@/utils/electronIntegration';

// Hook for customer data management
export function useElectronCustomers(accountId: string) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCustomers = useCallback(async () => {
    if (!isElectronApp() || !accountId) return;

    setLoading(true);
    setError(null);
    
    try {
      const data = await ElectronCustomerService.getCustomers(accountId);
      setCustomers(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ في جلب العملاء';
      setError(errorMessage);
      toast({
        title: "خطأ في جلب البيانات",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  const createCustomer = useCallback(async (customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => {
    if (!isElectronApp()) return false;

    try {
      const result = await ElectronCustomerService.createCustomer(customer);
      if (result.success) {
        await loadCustomers(); // إعادة تحميل البيانات
        toast({
          title: "تم إضافة العميل",
          description: "تم إنشاء العميل بنجاح"
        });
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ في إنشاء العميل';
      toast({
        title: "خطأ في الإضافة",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    }
  }, [loadCustomers]);

  const updateCustomer = useCallback(async (id: string, customer: Partial<Customer>) => {
    if (!isElectronApp()) return false;

    try {
      const result = await ElectronCustomerService.updateCustomer(id, customer);
      if (result.success) {
        await loadCustomers(); // إعادة تحميل البيانات
        toast({
          title: "تم تحديث العميل",
          description: "تم تحديث بيانات العميل بنجاح"
        });
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ في تحديث العميل';
      toast({
        title: "خطأ في التحديث",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    }
  }, [loadCustomers]);

  const deleteCustomer = useCallback(async (id: string) => {
    if (!isElectronApp()) return false;

    try {
      const result = await ElectronCustomerService.deleteCustomer(id);
      if (result.success) {
        await loadCustomers(); // إعادة تحميل البيانات
        toast({
          title: "تم حذف العميل",
          description: "تم حذف العميل بنجاح"
        });
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ في حذف العميل';
      toast({
        title: "خطأ في الحذف",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    }
  }, [loadCustomers]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  return {
    customers,
    loading,
    error,
    loadCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer
  };
}

// Hook for product data management
export function useElectronProducts(accountId: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    if (!isElectronApp() || !accountId) return;

    setLoading(true);
    setError(null);
    
    try {
      const data = await ElectronProductService.getProducts(accountId);
      setProducts(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ في جلب المنتجات';
      setError(errorMessage);
      toast({
        title: "خطأ في جلب البيانات",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  const createProduct = useCallback(async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    if (!isElectronApp()) return false;

    try {
      const result = await ElectronProductService.createProduct(product);
      if (result.success) {
        await loadProducts(); // إعادة تحميل البيانات
        toast({
          title: "تم إضافة المنتج",
          description: "تم إنشاء المنتج بنجاح"
        });
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ في إنشاء المنتج';
      toast({
        title: "خطأ في الإضافة",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    }
  }, [loadProducts]);

  const updateProduct = useCallback(async (id: string, product: Partial<Product>) => {
    if (!isElectronApp()) return false;

    try {
      const result = await ElectronProductService.updateProduct(id, product);
      if (result.success) {
        await loadProducts(); // إعادة تحميل البيانات
        toast({
          title: "تم تحديث المنتج",
          description: "تم تحديث بيانات المنتج بنجاح"
        });
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ في تحديث المنتج';
      toast({
        title: "خطأ في التحديث",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    }
  }, [loadProducts]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return {
    products,
    loading,
    error,
    loadProducts,
    createProduct,
    updateProduct
  };
}

// Hook for sales invoice data management
export function useElectronSales(accountId: string) {
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInvoices = useCallback(async () => {
    if (!isElectronApp() || !accountId) return;

    setLoading(true);
    setError(null);
    
    try {
      const data = await ElectronSalesService.getSalesInvoices(accountId);
      setInvoices(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ في جلب الفواتير';
      setError(errorMessage);
      toast({
        title: "خطأ في جلب البيانات",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  const createInvoice = useCallback(async (invoice: Omit<SalesInvoice, 'id' | 'created_at' | 'updated_at'>) => {
    if (!isElectronApp()) return false;

    try {
      const result = await ElectronSalesService.createSalesInvoice(invoice);
      if (result.success) {
        await loadInvoices(); // إعادة تحميل البيانات
        toast({
          title: "تم إنشاء الفاتورة",
          description: "تم إنشاء فاتورة المبيعات بنجاح"
        });
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ في إنشاء الفاتورة';
      toast({
        title: "خطأ في الإنشاء",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    }
  }, [loadInvoices]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  return {
    invoices,
    loading,
    error,
    loadInvoices,
    createInvoice
  };
}

// Hook for dashboard statistics
export function useElectronStats(accountId: string) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!isElectronApp() || !accountId) return;

    setLoading(true);
    setError(null);
    
    try {
      const data = await ElectronStatsService.getDashboardStats(accountId);
      setStats(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ في جلب الإحصائيات';
      setError(errorMessage);
      toast({
        title: "خطأ في جلب البيانات",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    loadStats
  };
}