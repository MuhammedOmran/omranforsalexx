import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PurchasesReportData {
  totalPurchases: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  totalSuppliers: number;
  monthlyData: {
    month: string;
    amount: number;
    invoices: number;
  }[];
  topSuppliers: {
    name: string;
    amount: number;
    invoices: number;
  }[];
  recentPurchases: any[];
}

export function usePurchasesReport(dateFrom?: Date, dateTo?: Date) {
  const [data, setData] = useState<PurchasesReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchPurchasesData = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('purchase_invoices')
        .select(`
          *,
          purchase_invoice_items(*)
        `);

      if (dateFrom) {
        query = query.gte('invoice_date', dateFrom.toISOString().split('T')[0]);
      }
      if (dateTo) {
        query = query.lte('invoice_date', dateTo.toISOString().split('T')[0]);
      }

      const { data: purchases, error } = await query;

      if (error) throw error;

      if (!purchases) {
        setData({
          totalPurchases: 0,
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
          totalSuppliers: 0,
          monthlyData: [],
          topSuppliers: [],
          recentPurchases: []
        });
        return;
      }

      const totalPurchases = purchases.length;
      const totalAmount = purchases.reduce((sum, inv) => sum + inv.total_amount, 0);
      const paidAmount = purchases.reduce((sum, inv) => sum + inv.paid_amount, 0);
      const pendingAmount = totalAmount - paidAmount;
      
      const uniqueSuppliers = new Set(purchases.map(inv => inv.supplier_name));
      const totalSuppliers = uniqueSuppliers.size;

      // البيانات الشهرية
      const monthlyMap: { [key: string]: { amount: number, invoices: number } } = {};
      purchases.forEach(invoice => {
        const month = new Date(invoice.invoice_date).toLocaleDateString('ar', { year: 'numeric', month: 'long' });
        if (!monthlyMap[month]) {
          monthlyMap[month] = { amount: 0, invoices: 0 };
        }
        monthlyMap[month].amount += invoice.total_amount;
        monthlyMap[month].invoices += 1;
      });

      const monthlyData = Object.entries(monthlyMap).map(([month, data]) => ({
        month,
        amount: data.amount,
        invoices: data.invoices
      }));

      // أفضل الموردين
      const supplierMap: { [key: string]: { amount: number, invoices: number } } = {};
      purchases.forEach(invoice => {
        const supplier = invoice.supplier_name;
        if (!supplierMap[supplier]) {
          supplierMap[supplier] = { amount: 0, invoices: 0 };
        }
        supplierMap[supplier].amount += invoice.total_amount;
        supplierMap[supplier].invoices += 1;
      });

      const topSuppliers = Object.entries(supplierMap)
        .map(([name, data]) => ({
          name,
          amount: data.amount,
          invoices: data.invoices
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      setData({
        totalPurchases,
        totalAmount,
        paidAmount,
        pendingAmount,
        totalSuppliers,
        monthlyData,
        topSuppliers,
        recentPurchases: purchases.slice(0, 10)
      });

    } catch (error) {
      console.error('خطأ في تحميل بيانات المشتريات:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحميل بيانات المشتريات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchasesData();
  }, [dateFrom, dateTo]);

  return { data, loading, refetch: fetchPurchasesData };
}