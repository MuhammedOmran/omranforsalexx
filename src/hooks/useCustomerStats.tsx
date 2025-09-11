import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CustomerStats {
  totalOrders: number;
  totalSpent: number;
  pendingAmount: number;
  lastOrderDate?: string;
}

export function useCustomerStats(customerId: string) {
  const [stats, setStats] = useState<CustomerStats>({
    totalOrders: 0,
    totalSpent: 0,
    pendingAmount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customerId) return;

    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // جلب إحصائيات الفواتير للعميل
        const { data: invoices, error } = await supabase
          .from('invoices')
          .select('total_amount, status, created_at')
          .eq('customer_id', customerId)
          .is('deleted_at', null);

        if (error) throw error;

        const totalOrders = invoices?.length || 0;
        const totalSpent = invoices
          ?.filter(invoice => invoice.status === 'paid')
          .reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0) || 0;
        
        const pendingAmount = invoices
          ?.filter(invoice => invoice.status === 'pending')
          .reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0) || 0;

        const lastOrderDate = invoices && invoices.length > 0 
          ? invoices.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
          : undefined;

        setStats({
          totalOrders,
          totalSpent,
          pendingAmount,
          lastOrderDate,
        });
      } catch (error) {
        console.error('Error fetching customer stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [customerId]);

  return { stats, loading };
}