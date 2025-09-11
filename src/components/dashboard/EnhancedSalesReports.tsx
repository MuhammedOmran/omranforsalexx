import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package, 
  FileText,
  ExternalLink
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

interface SalesMetrics {
  todaysSales: number;
  yesterdaysSales: number;
  weeklySales: number;
  monthlySales: number;
  totalInvoices: number;
  paidInvoices: number;
  unpaidInvoices: number;
  topCustomers: Array<{
    name: string;
    total: number;
    invoiceCount: number;
  }>;
  salesTrend: 'up' | 'down' | 'stable';
  growthPercentage: number;
}

export function EnhancedSalesReports() {
  const [metrics, setMetrics] = useState<SalesMetrics>({
    todaysSales: 0,
    yesterdaysSales: 0,
    weeklySales: 0,
    monthlySales: 0,
    totalInvoices: 0,
    paidInvoices: 0,
    unpaidInvoices: 0,
    topCustomers: [],
    salesTrend: 'stable',
    growthPercentage: 0
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadSalesMetrics();
    // تحديث البيانات كل 5 دقائق
    const interval = setInterval(loadSalesMetrics, 300000);
    return () => clearInterval(interval);
  }, []);

  const loadSalesMetrics = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        logger.warn('المستخدم غير مصادق عليه', {}, 'EnhancedSalesReports');
        return;
      }

      // تحديد الفترات الزمنية
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - 7);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // جلب جميع الفواتير مع بيانات العملاء
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select(`
          id,
          total_amount,
          status,
          created_at,
          customers (
            name,
            phone
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const allInvoices = invoices || [];
      const paidInvoices = allInvoices.filter(inv => inv.status === 'paid');

      // حساب المبيعات حسب الفترات
      const todaysSales = paidInvoices
        .filter(inv => new Date(inv.created_at) >= todayStart)
        .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

      const yesterdaysSales = paidInvoices
        .filter(inv => {
          const date = new Date(inv.created_at);
          return date >= yesterdayStart && date < todayStart;
        })
        .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

      const weeklySales = paidInvoices
        .filter(inv => new Date(inv.created_at) >= weekStart)
        .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

      const monthlySales = paidInvoices
        .filter(inv => new Date(inv.created_at) >= monthStart)
        .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

      // حساب أفضل العملاء
      const customerSales = new Map<string, { total: number; count: number }>();
      paidInvoices.forEach(invoice => {
        const customerName = invoice.customers?.name || 'عميل غير محدد';
        const current = customerSales.get(customerName) || { total: 0, count: 0 };
        customerSales.set(customerName, {
          total: current.total + (invoice.total_amount || 0),
          count: current.count + 1
        });
      });

      const topCustomers = Array.from(customerSales.entries())
        .map(([name, data]) => ({
          name,
          total: data.total,
          invoiceCount: data.count
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      // حساب اتجاه المبيعات
      const growthPercentage = yesterdaysSales > 0 
        ? ((todaysSales - yesterdaysSales) / yesterdaysSales) * 100 
        : 0;

      const salesTrend: 'up' | 'down' | 'stable' = 
        growthPercentage > 5 ? 'up' : 
        growthPercentage < -5 ? 'down' : 'stable';

      setMetrics({
        todaysSales,
        yesterdaysSales,
        weeklySales,
        monthlySales,
        totalInvoices: allInvoices.length,
        paidInvoices: paidInvoices.length,
        unpaidInvoices: allInvoices.length - paidInvoices.length,
        topCustomers,
        salesTrend,
        growthPercentage: Math.abs(growthPercentage)
      });

    } catch (error) {
      logger.error('خطأ في تحميل مقاييس المبيعات', error, 'EnhancedSalesReports');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('en-US')} ج.م`;
  };

  const getSalesTrendIcon = () => {
    switch (metrics.salesTrend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-success" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      default:
        return <TrendingUp className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSalesTrendColor = () => {
    switch (metrics.salesTrend) {
      case 'up':
        return 'text-success';
      case 'down':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>تقرير المبيعات المحسن</CardTitle>
          <CardDescription>جاري تحميل البيانات...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* ملخص سريع */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                تقرير المبيعات المحسن
              </CardTitle>
              <CardDescription>ملخص شامل لأداء المبيعات مع البيانات المباشرة</CardDescription>
            </div>
            <Button 
              variant="outline"
              onClick={() => navigate('/reports/sales')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              التقرير الكامل
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* مبيعات اليوم */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="h-5 w-5 text-primary" />
                {getSalesTrendIcon()}
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{formatCurrency(metrics.todaysSales)}</p>
                <p className="text-sm text-muted-foreground">مبيعات اليوم</p>
                <div className={`flex items-center gap-1 text-xs ${getSalesTrendColor()}`}>
                  <span>{metrics.growthPercentage.toFixed(1)}%</span>
                  <span>من الأمس</span>
                </div>
              </div>
            </div>

            {/* مبيعات الأسبوع */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <ShoppingCart className="h-5 w-5 text-success" />
                <Badge variant="secondary">{metrics.paidInvoices}</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{formatCurrency(metrics.weeklySales)}</p>
                <p className="text-sm text-muted-foreground">مبيعات الأسبوع</p>
                <p className="text-xs text-muted-foreground">
                  {metrics.paidInvoices} فاتورة مدفوعة
                </p>
              </div>
            </div>

            {/* مبيعات الشهر */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Package className="h-5 w-5 text-warning" />
                <Badge variant="outline">{metrics.totalInvoices}</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{formatCurrency(metrics.monthlySales)}</p>
                <p className="text-sm text-muted-foreground">مبيعات الشهر</p>
                <p className="text-xs text-muted-foreground">
                  {metrics.totalInvoices} إجمالي الفواتير
                </p>
              </div>
            </div>

            {/* الفواتير المعلقة */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-5 w-5 text-info" />
                {metrics.unpaidInvoices > 0 && (
                  <Badge variant="destructive">{metrics.unpaidInvoices}</Badge>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{metrics.topCustomers.length}</p>
                <p className="text-sm text-muted-foreground">أفضل العملاء</p>
                <p className="text-xs text-muted-foreground">
                  {metrics.unpaidInvoices} فاتورة معلقة
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* أفضل العملاء */}
      {metrics.topCustomers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              أفضل العملاء
            </CardTitle>
            <CardDescription>العملاء الأكثر شراءً في الفترة الحالية</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.topCustomers.map((customer, index) => (
                <div key={customer.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full text-primary font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {customer.invoiceCount} فاتورة
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(customer.total)}</p>
                    <p className="text-xs text-muted-foreground">
                      متوسط: {formatCurrency(customer.total / customer.invoiceCount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* روابط سريعة */}
      <Card>
        <CardHeader>
          <CardTitle>إجراءات سريعة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate('/sales/invoices/new')}
              className="flex items-center gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              فاتورة جديدة
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/sales/customers')}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              إدارة العملاء
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/reports/sales')}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              التقرير الكامل
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}