import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCustomers } from '@/contexts/CustomerContext';

interface CustomersStats {
  totalOrders: number;
  totalSales: number;
}

export function useCustomersStats() {
  const { customers } = useCustomers();
  const [stats, setStats] = useState<CustomersStats>({
    totalOrders: 0,
    totalSales: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (customers.length === 0) {
        setStats({ totalOrders: 0, totalSales: 0 });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // جلب إجمالي الفواتير المدفوعة لجميع العملاء
        const customerIds = customers.map(c => c.id);
        
        const { data: invoices, error } = await supabase
          .from('invoices')
          .select('total_amount, status')
          .in('customer_id', customerIds)
          .is('deleted_at', null);

        if (error) throw error;

        const paidInvoices = invoices?.filter(invoice => invoice.status === 'paid') || [];
        const totalOrders = invoices?.length || 0;
        const totalSales = paidInvoices.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0);

        setStats({
          totalOrders,
          totalSales,
        });
      } catch (error) {
        console.error('Error fetching customers stats:', error);
        setStats({ totalOrders: 0, totalSales: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [customers]);

  return { stats, loading };
}