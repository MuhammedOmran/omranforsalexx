import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SalesInvoice {
  id: string;
  invoice_number: string;
  customer_id: string | null;
  total_amount: number;
  status: string;
  notes?: string;
  invoice_date?: string;
  created_at: string;
  updated_at: string;
  customer?: {
    name: string;
    phone?: string;
  };
  items?: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

export const useSalesInvoices = () => {
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('المستخدم غير مصادق عليه');
      }

      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customers(name, phone),
          invoice_items(product_name, quantity, unit_price, total_price)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedInvoices = data?.map(invoice => ({
        ...invoice,
        customer: invoice.customers ? {
          name: invoice.customers.name,
          phone: invoice.customers.phone
        } : undefined,
        items: invoice.invoice_items || []
      })) || [];

      setInvoices(formattedInvoices);
    } catch (error) {
      console.error('خطأ في جلب الفواتير:', error);
      toast.error('حدث خطأ في جلب الفواتير');
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteInvoice = useCallback(async (invoiceId: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', invoiceId);

      if (error) throw error;

      toast.success('تم حذف الفاتورة بنجاح');
      await fetchInvoices(); // إعادة تحميل القائمة
    } catch (error) {
      console.error('خطأ في حذف الفاتورة:', error);
      toast.error('حدث خطأ في حذف الفاتورة');
    }
  }, [fetchInvoices]);

  const updateInvoiceStatus = useCallback(async (invoiceId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId);

      if (error) throw error;

      toast.success('تم تحديث حالة الفاتورة بنجاح');
      await fetchInvoices(); // إعادة تحميل القائمة
    } catch (error) {
      console.error('خطأ في تحديث حالة الفاتورة:', error);
      toast.error('حدث خطأ في تحديث حالة الفاتورة');
    }
  }, [fetchInvoices]);

  return {
    invoices,
    loading,
    fetchInvoices,
    deleteInvoice,
    updateInvoiceStatus
  };
};