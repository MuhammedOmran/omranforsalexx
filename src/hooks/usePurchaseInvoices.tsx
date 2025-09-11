import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PurchaseInvoiceItem {
  id?: string;
  product_id?: string;
  product_name: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  notes?: string;
}

export interface PurchaseInvoice {
  id: string;
  user_id: string;
  supplier_id?: string;
  supplier_name: string;
  invoice_number: string;
  invoice_date: string;
  due_date?: string;
  subtotal: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount: number;
  paid_amount: number;
  status: string;
  payment_method: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface PurchaseStatistics {
  total_invoices: number;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
}

export const usePurchaseInvoices = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [deletedInvoices, setDeletedInvoices] = useState<PurchaseInvoice[]>([]);
  const [statistics, setStatistics] = useState<PurchaseStatistics | null>(null);
  const [loading, setLoading] = useState(false);

  // جلب فواتير الشراء (غير المحذوفة)
  const fetchInvoices = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('purchase_invoices')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('فشل في جلب فواتير الشراء');
        console.error(error);
        return;
      }

      setInvoices(data || []);
    } catch (error) {
      toast.error('حدث خطأ أثناء جلب فواتير الشراء');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // جلب الفواتير المحذوفة
  const fetchDeletedInvoices = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('purchase_invoices')
        .select('*')
        .eq('user_id', user.id)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (error) {
        toast.error('فشل في جلب الفواتير المحذوفة');
        console.error(error);
        return;
      }

      setDeletedInvoices(data || []);
    } catch (error) {
      toast.error('حدث خطأ أثناء جلب الفواتير المحذوفة');
      console.error(error);
    }
  };

  // جلب إحصائيات المشتريات
  const fetchStatistics = async (periodDays = 30) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .rpc('get_purchase_statistics', {
          p_user_id: user.id,
          p_period_days: periodDays
        });

      if (error) {
        console.error(error);
        return;
      }

      if (data && data.length > 0) {
        setStatistics(data[0]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // إضافة معاملة مصروف للصندوق مرتبطة بفاتورة الشراء (تم إلغاؤها لصالح triggers)
  const addCashTransaction = async (invoice: PurchaseInvoice, paidAmount: number) => {
    // تم حذف هذا المنطق لأن قاعدة البيانات تتولى إضافة المعاملات تلقائياً عبر triggers
    // لتجنب تضارب القيود الفريدة
    return;
  };

  // تحديث معاملة الصندوق عند تحديث حالة الدفع (تم إلغاؤها لصالح triggers)
  const updateCashTransaction = async (invoiceId: string, newPaidAmount: number, oldPaidAmount: number) => {
    // تم حذف هذا المنطق لأن قاعدة البيانات تتولى تحديث المعاملات تلقائياً عبر triggers
    // لتجنب تضارب القيود الفريدة
    return;
  };

  // إضافة فاتورة شراء جديدة
  const addInvoice = async (
    invoiceData: Omit<PurchaseInvoice, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'status'>,
    items: PurchaseInvoiceItem[]
  ) => {
    if (!user) return false;

    try {
      // تحديد الحالة بناءً على المبلغ المدفوع
      const status = invoiceData.paid_amount >= invoiceData.total_amount ? 'paid' : 'pending';
      
      // إضافة الفاتورة مع الحالة المحددة
      const { data: invoice, error: invoiceError } = await supabase
        .from('purchase_invoices')
        .insert([{ 
          ...invoiceData, 
          user_id: user.id,
          status: status
        }])
        .select()
        .single();

      if (invoiceError) {
        toast.error('فشل في إضافة فاتورة الشراء');
        console.error(invoiceError);
        return false;
      }

      // إضافة عناصر الفاتورة
      if (items.length > 0) {
        const itemsToInsert = items.map(item => {
          const qty = Math.max(1, Math.floor(Number(item.quantity) || 0));
          const unitCost = Number(item.unit_cost) || 0;
          const totalCost = Number(item.total_cost) || (qty * unitCost);
          const productName = (item.product_name || '').trim();
          return {
            invoice_id: invoice.id,
            product_id: item.product_id || null,
            product_name: productName || 'منتج بدون اسم',
            quantity: qty,
            unit_cost: unitCost,
            total_cost: totalCost,
            notes: item.notes || null,
          };
        });

        const { error: itemsError } = await supabase
          .from('purchase_invoice_items')
          .insert(itemsToInsert);

        if (itemsError) {
          toast.error('فشل في إضافة عناصر الفاتورة');
          console.error(itemsError);
          return false;
        }
      }

      // المعاملة المالية تتم إضافتها تلقائياً عبر database triggers

      setInvoices(prev => [invoice, ...prev]);
      toast.success('تم إضافة فاتورة الشراء وربطها بالصندوق بنجاح');
      return true;
    } catch (error) {
      toast.error('حدث خطأ أثناء إضافة فاتورة الشراء');
      console.error(error);
      return false;
    }
  };

  // تحديث حالة الدفع للفاتورة
  const updatePaymentStatus = async (invoiceId: string, paidAmount: number) => {
    if (!user) return false;

    try {
      const invoice = invoices.find(inv => inv.id === invoiceId);
      if (!invoice) return false;

      const oldPaidAmount = invoice.paid_amount;
      const status = paidAmount >= invoice.total_amount ? 'paid' : 
                   paidAmount > 0 ? 'partial' : 'pending';

      const { data, error } = await supabase
        .from('purchase_invoices')
        .update({ 
          paid_amount: paidAmount,
          status: status
        })
        .eq('id', invoiceId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        toast.error('فشل في تحديث حالة الدفع');
        console.error(error);
        return false;
      }

      // تحديث المعاملة المالية يتم تلقائياً عبر database triggers

      setInvoices(prev => prev.map(inv => 
        inv.id === invoiceId ? data : inv
      ));
      toast.success('تم تحديث حالة الدفع والصندوق بنجاح');
      return true;
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث حالة الدفع');
      console.error(error);
      return false;
    }
  };

  // حذف فاتورة شراء (حذف منطقي)
  const deleteInvoice = async (invoiceId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('purchase_invoices')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', invoiceId)
        .eq('user_id', user.id);

      if (error) {
        toast.error('فشل في حذف الفاتورة');
        console.error(error);
        return false;
      }

      setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
      toast.success('تم حذف الفاتورة بنجاح');
      return true;
    } catch (error) {
      toast.error('حدث خطأ أثناء حذف الفاتورة');
      console.error(error);
      return false;
    }
  };

  // استعادة فاتورة محذوفة
  const restoreInvoice = async (invoiceId: string) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('purchase_invoices')
        .update({ deleted_at: null })
        .eq('id', invoiceId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        toast.error('فشل في استعادة الفاتورة');
        console.error(error);
        return false;
      }

      setDeletedInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
      setInvoices(prev => [data, ...prev]);
      toast.success('تم استعادة الفاتورة بنجاح');
      return true;
    } catch (error) {
      toast.error('حدث خطأ أثناء استعادة الفاتورة');
      console.error(error);
      return false;
    }
  };

  // حذف فاتورة نهائياً
  const permanentDeleteInvoice = async (invoiceId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('purchase_invoices')
        .delete()
        .eq('id', invoiceId)
        .eq('user_id', user.id);

      if (error) {
        toast.error('فشل في حذف الفاتورة نهائياً');
        console.error(error);
        return false;
      }

      setDeletedInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
      toast.success('تم حذف الفاتورة نهائياً');
      return true;
    } catch (error) {
      toast.error('حدث خطأ أثناء حذف الفاتورة نهائياً');
      console.error(error);
      return false;
    }
  };

  // حذف جميع الفواتير المحذوفة نهائياً
  const permanentDeleteAllInvoices = async () => {
    if (!user) return false;

    try {
      // حذف جميع الفواتير المحذوفة نهائياً
      const { error } = await supabase
        .from('purchase_invoices')
        .delete()
        .eq('user_id', user.id)
        .not('deleted_at', 'is', null);

      if (error) {
        toast.error('فشل في حذف جميع الفواتير نهائياً');
        console.error(error);
        return false;
      }

      setDeletedInvoices([]);
      toast.success('تم حذف جميع الفواتير المحذوفة نهائياً');
      return true;
    } catch (error) {
      toast.error('حدث خطأ أثناء حذف جميع الفواتير نهائياً');
      console.error(error);
      return false;
    }
  };

  // جلب عناصر فاتورة محددة
  const getInvoiceItems = async (invoiceId: string): Promise<PurchaseInvoiceItem[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('purchase_invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId);

      if (error) {
        console.error(error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  // فلترة الفواتير حسب الحالة
  const getInvoicesByStatus = (status: PurchaseInvoice['status']) => {
    return invoices.filter(invoice => invoice.status === status);
  };

  // فلترة الفواتير حسب المورد
  const getInvoicesBySupplier = (supplierId: string) => {
    return invoices.filter(invoice => invoice.supplier_id === supplierId);
  };

  useEffect(() => {
    fetchInvoices();
    fetchStatistics();
  }, [user]);

  // تحديث فاتورة شراء
  const updateInvoice = async (
    invoiceId: string,
    invoiceData: Partial<Omit<PurchaseInvoice, 'id' | 'user_id' | 'created_at' | 'updated_at'>>,
    items: PurchaseInvoiceItem[]
  ) => {
    if (!user) return false;

    try {
      // تحديث الفاتورة
      const { data: invoice, error: invoiceError } = await supabase
        .from('purchase_invoices')
        .update(invoiceData)
        .eq('id', invoiceId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (invoiceError) {
        toast.error('فشل في تحديث فاتورة الشراء');
        console.error(invoiceError);
        return false;
      }

      // حذف العناصر القديمة وإضافة الجديدة
      const { error: deleteError } = await supabase
        .from('purchase_invoice_items')
        .delete()
        .eq('invoice_id', invoiceId);

      if (deleteError) {
        toast.error('فشل في تحديث عناصر الفاتورة');
        console.error(deleteError);
        return false;
      }

      // إضافة العناصر الجديدة
      if (items.length > 0) {
        const itemsToInsert = items.map(item => ({
          invoice_id: invoiceId,
          product_id: item.product_id || null,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
          total_cost: item.total_cost,
          notes: item.notes || null
        }));

        const { error: itemsError } = await supabase
          .from('purchase_invoice_items')
          .insert(itemsToInsert);

        if (itemsError) {
          toast.error('فشل في إضافة عناصر الفاتورة');
          console.error(itemsError);
          return false;
        }
      }

      setInvoices(prev => prev.map(inv => 
        inv.id === invoiceId ? invoice : inv
      ));
      toast.success('تم تحديث فاتورة الشراء بنجاح');
      return true;
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث فاتورة الشراء');
      console.error(error);
      return false;
    }
  };

  // مزامنة فواتير الشراء الموجودة مع الصندوق
  const syncExistingInvoicesWithCash = async () => {
    if (!user) return false;

    try {
      // جلب فواتير الشراء المدفوعة التي لا توجد لها معاملات في الصندوق
      const { data: paidInvoices, error: invoicesError } = await supabase
        .from('purchase_invoices')
        .select('*')
        .eq('user_id', user.id)
        .gt('paid_amount', 0)
        .is('deleted_at', null);

      if (invoicesError) throw invoicesError;

      if (!paidInvoices || paidInvoices.length === 0) {
        toast.success('لا توجد فواتير شراء تحتاج للمزامنة');
        return true;
      }

      let syncedCount = 0;

      for (const invoice of paidInvoices) {
        // التحقق من وجود معاملة مرتبطة بهذه الفاتورة
        const { data: existingTransaction } = await supabase
          .from('cash_transactions')
          .select('id')
          .eq('reference_id', invoice.id)
          .eq('reference_type', 'purchase_invoice')
          .single();

        if (!existingTransaction) {
          // إضافة معاملة للصندوق
          await addCashTransaction(invoice, invoice.paid_amount);
          syncedCount++;
        }
      }

      if (syncedCount > 0) {
        toast.success(`تم ربط ${syncedCount} فاتورة شراء مع الصندوق بنجاح`);
      } else {
        toast.success('جميع فواتير الشراء مرتبطة بالصندوق بالفعل');
      }

      return true;
    } catch (error) {
      toast.error('حدث خطأ أثناء مزامنة فواتير الشراء مع الصندوق');
      console.error(error);
      return false;
    }
  };

  return {
    invoices,
    deletedInvoices,
    statistics,
    loading,
    fetchInvoices,
    fetchDeletedInvoices,
    fetchStatistics,
    addInvoice,
    updateInvoice,
    updatePaymentStatus,
    deleteInvoice,
    restoreInvoice,
    permanentDeleteInvoice,
    permanentDeleteAllInvoices,
    getInvoiceItems,
    getInvoicesByStatus,
    getInvoicesBySupplier,
    syncExistingInvoicesWithCash
  };
};