import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/hooks/use-toast';

export interface Supplier {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  company?: string;
  contact_person?: string;
  tax_number?: string;
  payment_terms?: string;
  notes?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupplierStatistics {
  total_invoices: number;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  last_purchase_date?: string;
  average_order_value: number;
}

export interface TopSupplier {
  supplier_id: string;
  supplier_name: string;
  total_purchases: number;
  invoice_count: number;
  last_purchase?: string;
}

export const useSuppliers = () => {
  const { user } = useSupabaseAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // جلب الموردين مع useCallback لمنع re-renders غير ضرورية
  const fetchSuppliers = useCallback(async () => {
    if (!user?.id) {
      setSuppliers([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching suppliers:', error);
        setError('فشل في جلب الموردين');
        toast({
          title: "خطأ",
          description: "فشل في جلب الموردين",
          variant: "destructive"
        });
        return;
      }

      setSuppliers(data || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      setError('حدث خطأ أثناء جلب الموردين');
      toast({
        title: "خطأ", 
        description: "حدث خطأ أثناء جلب الموردين",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // إضافة مورد جديد
  const addSupplier = async (supplierData: Omit<Supplier, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([{ ...supplierData, user_id: user.id }])
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error creating supplier:', error);
        toast({
          title: "خطأ",
          description: "فشل في إضافة المورد",
          variant: "destructive"
        });
        return false;
      }

      if (data) {
        setSuppliers(prev => [...prev, data]);
        toast({
          title: "نجح",
          description: "تم إضافة المورد بنجاح"
        });
      }
      return true;
    } catch (error) {
      console.error('Error creating supplier:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة المورد",
        variant: "destructive"
      });
      return false;
    }
  };

  // تحديث مورد
  const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
    if (!user) return false;

    // تحديث الحالة المحلية فوراً (optimistic update)
    const originalSuppliers = suppliers;
    setSuppliers(prev => prev.map(supplier => 
      supplier.id === id ? { ...supplier, ...updates } : supplier
    ));

    try {
      const { data, error } = await supabase
        .from('suppliers')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error updating supplier:', error);
        toast({
          title: "خطأ",
          description: "فشل في تحديث المورد",
          variant: "destructive"
        });
        // إعادة الحالة الأصلية في حالة الفشل
        setSuppliers(originalSuppliers);
        return false;
      }

      if (data) {
        // تحديث الحالة بالبيانات الصحيحة من الخادم
        setSuppliers(prev => prev.map(supplier => 
          supplier.id === id ? data : supplier
        ));
      }
      toast({
        title: "نجح",
        description: "تم تحديث المورد بنجاح"
      });
      return true;
    } catch (error) {
      console.error('Error updating supplier:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث المورد",
        variant: "destructive"
      });
      // إعادة الحالة الأصلية في حالة الفشل
      setSuppliers(originalSuppliers);
      return false;
    }
  };

  // حذف مورد (إلغاء تفعيل)
  const deleteSupplier = async (id: string) => {
    if (!user) return false;

    // تحديث الحالة المحلية فوراً - إزالة المورد من القائمة
    setSuppliers(prev => prev.filter(supplier => supplier.id !== id));

    try {
      const { error } = await supabase
        .from('suppliers')
        .update({ is_active: false })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting supplier:', error);
        toast({
          title: "خطأ",
          description: "فشل في حذف المورد",
          variant: "destructive"
        });
        // إعادة جلب البيانات في حالة الفشل
        fetchSuppliers();
        return false;
      }

      toast({
        title: "نجح",
        description: "تم حذف المورد بنجاح"
      });
      return true;
    } catch (error) {
      console.error('Error deleting supplier:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف المورد",
        variant: "destructive"
      });
      // إعادة جلب البيانات في حالة الفشل
      fetchSuppliers();
      return false;
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchSuppliers();
    }
  }, [fetchSuppliers]);

  // استعادة مورد محذوف
  const restoreSupplier = async (id: string) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('suppliers')
        .update({ is_active: true })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error restoring supplier:', error);
        toast({
          title: "خطأ",
          description: "فشل في استعادة المورد",
          variant: "destructive"
        });
        return false;
      }

      // إضافة المورد المستعاد للقائمة فوراً
      setSuppliers(prev => [...prev, data]);
      toast({
        title: "نجح",
        description: "تم استعادة المورد بنجاح"
      });
      return true;
    } catch (error) {
      console.error('Error restoring supplier:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء استعادة المورد",
        variant: "destructive"
      });
      return false;
    }
  };

  // جلب الموردين المحذوفين
  const fetchDeletedSuppliers = async () => {
    if (!user) return [];
    
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', false)
        .order('name');

      if (error) {
        console.error('Error fetching deleted suppliers:', error);
        toast({
          title: "خطأ",
          description: "فشل في جلب الموردين المحذوفين",
          variant: "destructive"
        });
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching deleted suppliers:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب الموردين المحذوفين",
        variant: "destructive"
      });
      return [];
    }
  };

  // حذف نهائي للمورد
  const permanentDeleteSupplier = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error permanently deleting supplier:', error);
        toast({
          title: "خطأ",
          description: "فشل في الحذف النهائي للمورد",
          variant: "destructive"
        });
        return false;
      }

      // إزالة من قائمة الموردين العادية إذا كان موجوداً
      setSuppliers(prev => prev.filter(supplier => supplier.id !== id));
      toast({
        title: "نجح",
        description: "تم الحذف النهائي للمورد بنجاح"
      });
      return true;
    } catch (error) {
      console.error('Error permanently deleting supplier:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء الحذف النهائي للمورد",
        variant: "destructive"
      });
      return false;
    }
  };

  // جلب إحصائيات مورد محدد
  const getSupplierStatistics = async (supplierId: string): Promise<SupplierStatistics | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.rpc('get_supplier_statistics', {
        p_supplier_id: supplierId,
        p_user_id: user.id
      });

      if (error) {
        console.error('Error fetching supplier statistics:', error);
        return null;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Error fetching supplier statistics:', error);
      return null;
    }
  };

  // جلب أفضل الموردين - مع useCallback لتحسين الأداء
  const getTopSuppliers = useCallback(async (limit: number = 10): Promise<TopSupplier[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase.rpc('get_top_suppliers', {
        p_user_id: user.id,
        p_limit: limit
      });

      if (error) {
        console.error('Error fetching top suppliers:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching top suppliers:', error);
      return [];
    }
  }, [user]);

  // جلب إحصائيات عامة للموردين - مع useCallback  
  const getSuppliersOverview = useCallback(async () => {
    if (!user) return null;

    try {
      const { data: supplierCounts, error } = await supabase
        .from('suppliers')
        .select('is_active')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching supplier counts:', error);
        return null;
      }

      const activeCount = supplierCounts?.filter(s => s.is_active).length || 0;
      const inactiveCount = supplierCounts?.filter(s => !s.is_active).length || 0;
      
      // جلب أفضل الموردين للحساب
      const topSuppliersForCalc = await getTopSuppliers(5);
      
      const totalPurchases = topSuppliersForCalc.reduce((sum, supplier) => sum + Number(supplier.total_purchases), 0);
      const totalInvoices = topSuppliersForCalc.reduce((sum, supplier) => sum + supplier.invoice_count, 0);

      return {
        activeSuppliers: activeCount,
        inactiveSuppliers: inactiveCount,
        totalSuppliers: activeCount + inactiveCount,
        totalPurchaseValue: totalPurchases,
        totalInvoices,
        topSuppliers: topSuppliersForCalc.slice(0, 3)
      };
    } catch (error) {
      console.error('Error fetching suppliers overview:', error);
      return null;
    }
  }, [user, getTopSuppliers]); // إضافة dependencies

  return {
    suppliers,
    loading,
    error,
    fetchSuppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    restoreSupplier,
    fetchDeletedSuppliers,
    permanentDeleteSupplier,
    getSupplierStatistics,
    getTopSuppliers,
    getSuppliersOverview
  };
};