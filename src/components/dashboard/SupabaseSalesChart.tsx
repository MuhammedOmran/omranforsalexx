import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import { formatNumberEnglish, formatCurrencyEnglish } from '@/utils/numberLocalization';

interface SalesDataPoint {
  name: string;
  sales: number;
  invoices: number;
  date: string;
}

export function SupabaseSalesChart() {
  const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSalesData();
    // تحديث البيانات كل 5 دقائق
    const interval = setInterval(loadSalesData, 300000);
    return () => clearInterval(interval);
  }, []);

  const loadSalesData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        logger.warn('User not authenticated', {}, 'SupabaseSalesChart');
        return;
      }

      // تحديد آخر 7 أيام
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date;
      });

      const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

      // جلب بيانات الفواتير لآخر 7 أيام
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('total_amount, created_at, status')
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgo.toISOString());

      if (error) throw error;

      const weekData: SalesDataPoint[] = last7Days.map(date => {
        const dayName = dayNames[date.getDay()];
        const dateString = date.toISOString().split('T')[0];
        
        // تصفية الفواتير لليوم المحدد
        const dayInvoices = (invoices || []).filter(invoice => {
          const invoiceDate = new Date(invoice.created_at).toISOString().split('T')[0];
          return invoiceDate === dateString;
        });

        // حساب مبيعات اليوم (الفواتير المدفوعة فقط)
        const paidInvoices = dayInvoices.filter(inv => inv.status === 'paid');
        const daySales = paidInvoices.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0);
        const dayInvoicesCount = dayInvoices.length;

        return {
          name: dayName,
          sales: Math.round(daySales),
          invoices: dayInvoicesCount,
          date: dateString
        };
      });

      setSalesData(weekData);
    } catch (error) {
      logger.error('خطأ في تحميل بيانات المبيعات من Supabase', error, 'SupabaseSalesChart');
    } finally {
      setLoading(false);
    }
  };

  // حساب إجماليات الأسبوع
  const weeklyTotal = salesData.reduce((sum, day) => sum + day.sales, 0);
  const weeklyInvoices = salesData.reduce((sum, day) => sum + day.invoices, 0);
  const averageDaily = weeklyTotal / 7;

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          مبيعات الأسبوع (بيانات مباشرة)
        </CardTitle>
        <CardDescription className="flex items-center justify-between">
          <span>إجمالي المبيعات وعدد الفواتير خلال آخر 7 أيام</span>
          <span className="text-xs">
            الإجمالي: {formatCurrencyEnglish(weeklyTotal, "ج.م")} | 
            المتوسط اليومي: {formatCurrencyEnglish(Math.round(averageDaily), "ج.م")} |
            عدد الفواتير: {formatNumberEnglish(weeklyInvoices)}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Amount Chart */}
            <div>
              <h4 className="text-sm font-medium mb-4 text-muted-foreground">قيمة المبيعات (ج.م)</h4>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => value > 1000 ? `${(value / 1000).toFixed(1)}k` : value.toString()}
                  />
                  <Tooltip 
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)"
                    }}
                    formatter={(value: number, name, props) => [
                      `${formatCurrencyEnglish(value || 0, "ج.م")} - المبيعات (${props.payload?.date})`, 
                      "المبيعات"
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Invoices Count Chart */}
            <div>
              <h4 className="text-sm font-medium mb-4 text-muted-foreground">عدد الفواتير</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip 
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)"
                    }}
                    formatter={(value: number, name, props) => [
                      `${formatNumberEnglish(value)} فاتورة - عدد الفواتير (${props.payload?.date})`, 
                      "عدد الفواتير"
                    ]}
                  />
                  <Bar 
                    dataKey="invoices" 
                    fill="hsl(var(--success))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* إحصائيات سريعة */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-lg font-bold text-foreground">{formatCurrencyEnglish(weeklyTotal, "ج.م")}</div>
            <div className="text-xs text-muted-foreground">إجمالي الأسبوع (ج.م)</div>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-lg font-bold text-foreground">{formatNumberEnglish(weeklyInvoices)}</div>
            <div className="text-xs text-muted-foreground">إجمالي الفواتير</div>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-lg font-bold text-foreground">{formatCurrencyEnglish(Math.round(averageDaily), "ج.م")}</div>
            <div className="text-xs text-muted-foreground">متوسط يومي (ج.م)</div>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-lg font-bold text-foreground">{salesData.length > 0 ? formatCurrencyEnglish(Math.max(...salesData.map(d => d.sales)), "ج.م") : formatCurrencyEnglish(0, "ج.م")}</div>
            <div className="text-xs text-muted-foreground">أعلى يوم (ج.م)</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}