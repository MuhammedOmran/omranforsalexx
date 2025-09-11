import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProfitReportData {
  totalRevenue: number;
  totalCosts: number;
  netProfit: number;
  profitMargin: number;
  salesCount: number;
  averageOrderValue: number;
  monthlyData: {
    month: string;
    revenue: number;
    costs: number;
    profit: number;
  }[];
  topProducts: {
    name: string;
    revenue: number;
    profit: number;
    quantity: number;
  }[];
  dailyProfit: {
    date: string;
    profit: number;
    revenue: number;
  }[];
}

export function useProfitReport(dateFrom?: Date, dateTo?: Date) {
  const [data, setData] = useState<ProfitReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchProfitData = async () => {
    try {
      setLoading(true);
      
      // جلب فواتير البيع مع عناصرها
      let salesQuery = supabase
        .from('invoices')
        .select(`
          *,
          invoice_items(*, products(cost))
        `)
        .eq('status', 'paid');

      if (dateFrom) {
        salesQuery = salesQuery.gte('invoice_date', dateFrom.toISOString().split('T')[0]);
      }
      if (dateTo) {
        salesQuery = salesQuery.lte('invoice_date', dateTo.toISOString().split('T')[0]);
      }

      const { data: sales, error: salesError } = await salesQuery;
      if (salesError) throw salesError;

      // جلب فواتير الشراء
      let purchasesQuery = supabase
        .from('purchase_invoices')
        .select('*');

      if (dateFrom) {
        purchasesQuery = purchasesQuery.gte('invoice_date', dateFrom.toISOString().split('T')[0]);
      }
      if (dateTo) {
        purchasesQuery = purchasesQuery.lte('invoice_date', dateTo.toISOString().split('T')[0]);
      }

      const { data: purchases, error: purchasesError } = await purchasesQuery;
      if (purchasesError) throw purchasesError;

      // حساب التكاليف الشاملة باستخدام دالة Supabase
      const { data: totalCostsData, error: costsError } = await supabase
        .rpc('calculate_total_business_costs', {
          p_user_id: undefined, // سيتم استخدام auth.uid() تلقائياً
          p_date_from: dateFrom ? dateFrom.toISOString().split('T')[0] : null,
          p_date_to: dateTo ? dateTo.toISOString().split('T')[0] : null
        });

      if (costsError) {
        console.error('خطأ في حساب التكاليف:', costsError);
        // fallback إلى الطريقة العادية في حالة الخطأ
      }

      if (!sales || !purchases) {
        setData({
          totalRevenue: 0,
          totalCosts: 0,
          netProfit: 0,
          profitMargin: 0,
          salesCount: 0,
          averageOrderValue: 0,
          monthlyData: [],
          topProducts: [],
          dailyProfit: []
        });
        return;
      }

      // حساب الإيرادات
      const totalRevenue = sales.reduce((sum, invoice) => sum + invoice.total_amount, 0);
      
      // حساب التكاليف من المبيعات
      let totalCostOfGoodsSold = 0;
      const productProfits: { [key: string]: { name: string, revenue: number, cost: number, quantity: number } } = {};

      sales.forEach(invoice => {
        invoice.invoice_items?.forEach((item: any) => {
          const productCost = item.products?.cost || 0;
          const itemCost = productCost * item.quantity;
          totalCostOfGoodsSold += itemCost;

          if (!productProfits[item.product_name]) {
            productProfits[item.product_name] = {
              name: item.product_name,
              revenue: 0,
              cost: 0,
              quantity: 0
            };
          }
          productProfits[item.product_name].revenue += item.total_price;
          productProfits[item.product_name].cost += itemCost;
          productProfits[item.product_name].quantity += item.quantity;
        });
      });

      // إضافة تكاليف المشتريات
      const totalPurchaseCosts = purchases.reduce((sum, purchase) => sum + purchase.total_amount, 0);
      
      // استخدام التكاليف المحسوبة من دالة Supabase أو الحساب اليدوي
      let totalCosts = totalCostOfGoodsSold + totalPurchaseCosts;
      let currentInventoryValue = 0;
      
      if (totalCostsData && totalCostsData.length > 0) {
        const costsResult = totalCostsData[0];
        totalCosts = costsResult.total_costs || totalCosts;
        currentInventoryValue = costsResult.inventory_costs || 0;
        console.log('Using Supabase calculated costs:', {
          totalCosts: costsResult.total_costs,
          inventoryCosts: costsResult.inventory_costs,
          purchaseCosts: costsResult.purchase_costs,
          operatingCosts: costsResult.operating_costs
        });
      } else {
        console.log('Fallback to manual calculation');
        // جلب المنتجات للحساب اليدوي في حالة عدم نجاح دالة Supabase
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('id, name, stock, cost, is_active')
          .eq('is_active', true);
          
        if (!productsError && products) {
          currentInventoryValue = products.reduce((sum, product) => {
            const stock = product.stock || 0;
            const cost = product.cost || 0;
            console.log(`Product: ${product.name}, Stock: ${stock}, Cost: ${cost}, Value: ${stock * cost}`);
            return sum + (stock * cost);
          }, 0);
          totalCosts += currentInventoryValue;
        }
      }

      const netProfit = totalRevenue - totalCosts;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
      const salesCount = sales.length;
      const averageOrderValue = salesCount > 0 ? totalRevenue / salesCount : 0;

      // البيانات الشهرية
      const monthlyMap: { [key: string]: { revenue: number, costs: number } } = {};
      
      sales.forEach(invoice => {
        const month = new Date(invoice.invoice_date).toLocaleDateString('ar', { year: 'numeric', month: 'long' });
        if (!monthlyMap[month]) {
          monthlyMap[month] = { revenue: 0, costs: 0 };
        }
        monthlyMap[month].revenue += invoice.total_amount;
        
        // حساب التكلفة لهذه الفاتورة
        let invoiceCost = 0;
        invoice.invoice_items?.forEach((item: any) => {
          const productCost = item.products?.cost || 0;
          invoiceCost += productCost * item.quantity;
        });
        monthlyMap[month].costs += invoiceCost;
      });

      const monthlyData = Object.entries(monthlyMap).map(([month, data]) => ({
        month,
        revenue: data.revenue,
        costs: data.costs,
        profit: data.revenue - data.costs
      }));

      // أفضل المنتجات ربحية
      const topProducts = Object.values(productProfits)
        .map(product => ({
          name: product.name,
          revenue: product.revenue,
          profit: product.revenue - product.cost,
          quantity: product.quantity
        }))
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 10);

      // الأرباح اليومية
      const dailyMap: { [key: string]: { revenue: number, costs: number } } = {};
      
      sales.forEach(invoice => {
        const date = invoice.invoice_date;
        if (!dailyMap[date]) {
          dailyMap[date] = { revenue: 0, costs: 0 };
        }
        dailyMap[date].revenue += invoice.total_amount;
        
        let invoiceCost = 0;
        invoice.invoice_items?.forEach((item: any) => {
          const productCost = item.products?.cost || 0;
          invoiceCost += productCost * item.quantity;
        });
        dailyMap[date].costs += invoiceCost;
      });

      const dailyProfit = Object.entries(dailyMap)
        .map(([date, data]) => ({
          date,
          profit: data.revenue - data.costs,
          revenue: data.revenue
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-30); // آخر 30 يوم

      setData({
        totalRevenue,
        totalCosts,
        netProfit,
        profitMargin,
        salesCount,
        averageOrderValue,
        monthlyData,
        topProducts,
        dailyProfit
      });

    } catch (error) {
      console.error('خطأ في تحميل بيانات الأرباح:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحميل بيانات الأرباح",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfitData();
  }, [dateFrom, dateTo]);

  return { data, loading, refetch: fetchProfitData };
}