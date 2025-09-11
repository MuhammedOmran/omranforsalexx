import { TrendingUp, TrendingDown, DollarSign, Package, Users, ShoppingCart, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import { formatNumberEnglish, formatCurrencyEnglish } from '@/utils/numberLocalization';

interface KPICardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

function KPICard({ title, value, change, changeType, icon: Icon, description }: KPICardProps) {
  return (
    <Card className="hover:shadow-custom-md transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="flex items-center text-xs mt-1">
          <span
            className={cn(
              "flex items-center gap-1 font-medium",
              changeType === "positive" && "text-success",
              changeType === "negative" && "text-destructive",
              changeType === "neutral" && "text-muted-foreground"
            )}
          >
            {changeType === "positive" && <TrendingUp className="h-3 w-3" />}
            {changeType === "negative" && <TrendingDown className="h-3 w-3" />}
            {change}
          </span>
          {description && (
            <span className="text-muted-foreground mr-2">من {description}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function SupabaseKPICards() {
  const [kpiData, setKpiData] = useState<Array<{
    title: string;
    value: string;
    change: string;
    changeType: "positive" | "negative" | "neutral";
    icon: React.ComponentType<{ className?: string }>;
    description: string;
  }>>([
    {
      title: "إجمالي المبيعات اليوم",
      value: "جاري التحميل...",
      change: "0%",
      changeType: "neutral" as const,
      icon: DollarSign,
      description: "الأمس",
    },
    {
      title: "عدد الفواتير",
      value: "جاري التحميل...",
      change: "0%",
      changeType: "neutral" as const,
      icon: ShoppingCart,
      description: "اليوم",
    },
    {
      title: "قيمة المخزون",
      value: "جاري التحميل...",
      change: "0%",
      changeType: "neutral" as const,
      icon: Package,
      description: "إجمالي",
    },
    {
      title: "العملاء الجدد",
      value: "جاري التحميل...",
      change: "0%",
      changeType: "neutral" as const,
      icon: Users,
      description: "الشهر الحالي",
    },
    {
      title: "المنتجات منخفضة المخزون",
      value: "جاري التحميل...",
      change: "تحديد الحالة",
      changeType: "neutral" as const,
      icon: AlertTriangle,
      description: "تحتاج متابعة",
    },
    {
      title: "الأرباح الشهرية",
      value: "جاري التحميل...",
      change: "0%",
      changeType: "neutral" as const,
      icon: TrendingUp,
      description: "الشهر الحالي",
    },
  ]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRealData();
    // تحديث البيانات كل دقيقة
    const interval = setInterval(loadRealData, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadRealData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        logger.warn('User not authenticated', {}, 'SupabaseKPICards');
        return;
      }

      // التاريخ الحالي واليوم السابق
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      
      // الشهر الحالي والسابق
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastMonthStart = new Date(monthStart);
      lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

      // 1. إجمالي المبيعات اليوم
      const { data: todayInvoices, error: todayError } = await supabase
        .from('invoices')
        .select('total_amount')
        .eq('user_id', user.id)
        .gte('created_at', todayStart.toISOString())
        .eq('status', 'paid');

      if (todayError) throw todayError;

      const todaySales = todayInvoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;

      // مبيعات الأمس للمقارنة
      const { data: yesterdayInvoices } = await supabase
        .from('invoices')
        .select('total_amount')
        .eq('user_id', user.id)
        .gte('created_at', yesterdayStart.toISOString())
        .lt('created_at', todayStart.toISOString())
        .eq('status', 'paid');

      const yesterdaySales = yesterdayInvoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
      const salesChange = yesterdaySales > 0 ? ((todaySales - yesterdaySales) / yesterdaySales * 100).toFixed(1) : "0";

      // 2. عدد الفواتير اليوم وإجمالي
      const { data: allInvoices, error: allInvoicesError } = await supabase
        .from('invoices')
        .select('id, created_at')
        .eq('user_id', user.id);

      if (allInvoicesError) throw allInvoicesError;

      const totalInvoices = allInvoices?.length || 0;
      const todayInvoicesCount = allInvoices?.filter(inv => 
        new Date(inv.created_at) >= todayStart
      ).length || 0;

      // 3. قيمة المخزون الإجمالية
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('price, stock')
        .eq('user_id', user.id);

      if (productsError && productsError.code !== 'PGRST116') {
        console.warn('خطأ في جلب المنتجات:', productsError);
      }

      const inventoryValue = products?.reduce((sum, product) => 
        sum + (product.price * product.stock), 0) || 0;

      // المنتجات منخفضة المخزون (أقل من 10)
      const lowStockCount = products?.filter(p => p.stock < 10).length || 0;

      // 4. العملاء الجدد هذا الشهر
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('id, created_at')
        .eq('user_id', user.id);

      if (customersError && customersError.code !== 'PGRST116') {
        console.warn('خطأ في جلب العملاء:', customersError);
      }

      const newCustomersThisMonth = customers?.filter(customer => 
        new Date(customer.created_at) >= monthStart
      ).length || 0;

      const newCustomersLastMonth = customers?.filter(customer => {
        const createdAt = new Date(customer.created_at);
        return createdAt >= lastMonthStart && createdAt < monthStart;
      }).length || 0;

      const customersChange = newCustomersLastMonth > 0 ? 
        ((newCustomersThisMonth - newCustomersLastMonth) / newCustomersLastMonth * 100).toFixed(1) : "0";

      // 5. حساب الأرباح الشهرية من Supabase
      const { data: monthlyInvoicesWithItems } = await supabase
        .from('invoices')
        .select(`
          id,
          total_amount,
          created_at,
          invoice_items!inner(
            product_id,
            quantity,
            unit_price,
            total_price
          )
        `)
        .eq('user_id', user.id)
        .gte('created_at', monthStart.toISOString())
        .eq('status', 'paid');

      // حساب الإيرادات الشهرية
      const monthlyRevenue = monthlyInvoicesWithItems?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
      
      // حساب التكلفة الفعلية من جدول المنتجات في Supabase
      let totalCost = 0;
      if (monthlyInvoicesWithItems && monthlyInvoicesWithItems.length > 0) {
        // جمع جميع product_ids من الفواتير المدفوعة
        const productIds = Array.from(new Set(
          monthlyInvoicesWithItems.flatMap(inv => 
            inv.invoice_items?.map(item => item.product_id).filter(Boolean) || []
          )
        ));

        if (productIds.length > 0) {
          // جلب أسعار التكلفة من جدول المنتجات
          const { data: productCosts } = await supabase
            .from('products')
            .select('id, cost')
            .in('id', productIds)
            .eq('user_id', user.id);

          if (productCosts) {
            // حساب التكلفة الإجمالية
            totalCost = monthlyInvoicesWithItems.reduce((sum, inv) => {
              const invoiceCost = inv.invoice_items?.reduce((itemSum, item) => {
                if (item.product_id) {
                  const product = productCosts.find(p => p.id === item.product_id);
                  const cost = product?.cost || 0;
                  return itemSum + (cost * item.quantity);
                }
                return itemSum;
              }, 0) || 0;
              return sum + invoiceCost;
            }, 0);
          }
        }
      }
      
      // إذا لم نتمكن من حساب التكلفة الفعلية، استخدم تقدير 60%
      if (totalCost === 0 && monthlyRevenue > 0) {
        totalCost = monthlyRevenue * 0.6;
      }
      
      const monthlyProfit = monthlyRevenue - totalCost;

      const salesChangeType: "positive" | "negative" | "neutral" = 
        parseFloat(salesChange) > 0 ? "positive" : 
        parseFloat(salesChange) < 0 ? "negative" : "neutral";
      
      const customersChangeType: "positive" | "negative" | "neutral" = 
        parseFloat(customersChange) > 0 ? "positive" : 
        parseFloat(customersChange) < 0 ? "negative" : "neutral";
      
      const stockChangeType: "positive" | "negative" | "neutral" = 
        lowStockCount > 0 ? "negative" : "positive";
      
      const profitChangeType: "positive" | "negative" | "neutral" = 
        monthlyProfit > 0 ? "positive" : "neutral";

      const updatedKpiData = [
        {
          title: "إجمالي المبيعات اليوم",
          value: formatCurrencyEnglish(todaySales, "ج.م"),
          change: `${formatNumberEnglish(parseFloat(salesChange))}%`,
          changeType: salesChangeType,
          icon: DollarSign,
          description: todaySales > 0 ? "من الأمس" : "لا توجد مبيعات اليوم",
        },
        {
          title: "عدد الفواتير",
          value: formatNumberEnglish(totalInvoices),
          change: `${formatNumberEnglish(todayInvoicesCount)} فاتورة اليوم`,
          changeType: "neutral" as const,
          icon: ShoppingCart,
          description: todayInvoicesCount > 0 ? "إجمالي" : "لا توجد فواتير اليوم",
        },
        {
          title: "قيمة المخزون",
          value: formatCurrencyEnglish(inventoryValue, "ج.م"),
          change: `${formatNumberEnglish(products?.length || 0)} منتج`,
          changeType: "neutral" as const,
          icon: Package,
          description: "إجمالي المخزون",
        },
        {
          title: "العملاء الجدد",
          value: formatNumberEnglish(newCustomersThisMonth),
          change: `${formatNumberEnglish(parseFloat(customersChange))}%`,
          changeType: customersChangeType,
          icon: Users,
          description: `${formatNumberEnglish(customers?.length || 0)} إجمالي العملاء`,
        },
        {
          title: "المنتجات منخفضة المخزون",
          value: formatNumberEnglish(lowStockCount),
          change: lowStockCount > 0 ? "تحتاج متابعة" : "الوضع جيد",
          changeType: stockChangeType,
          icon: AlertTriangle,
          description: "أقل من 10 قطع",
        },
        {
          title: "الأرباح الشهرية",
          value: formatCurrencyEnglish(monthlyProfit, "ج.م"),
          change: `${formatCurrencyEnglish(monthlyRevenue, "ج.م")} إيرادات`,
          changeType: profitChangeType,
          icon: TrendingUp,
          description: "صافي الربح",
        },
      ];

      setKpiData(updatedKpiData);
    } catch (error) {
      logger.error('خطأ في تحميل بيانات KPI من Supabase', error, 'SupabaseKPICards');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {kpiData.map((kpi, index) => (
        <KPICard key={index} {...kpi} />
      ))}
    </div>
  );
}