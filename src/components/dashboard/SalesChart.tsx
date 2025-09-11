import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { reportDataGenerator } from "@/utils/reportDataGenerator";
import { storage } from "@/utils/storage";

export function SalesChart() {
  const [salesData, setSalesData] = useState([
    { name: "السبت", sales: 0, invoices: 0 },
    { name: "الأحد", sales: 0, invoices: 0 },
    { name: "الاثنين", sales: 0, invoices: 0 },
    { name: "الثلاثاء", sales: 0, invoices: 0 },
    { name: "الأربعاء", sales: 0, invoices: 0 },
    { name: "الخميس", sales: 0, invoices: 0 },
    { name: "الجمعة", sales: 0, invoices: 0 },
  ]);

  useEffect(() => {
    loadSalesData();
  }, []);

  const loadSalesData = () => {
    try {
      const salesReportData = reportDataGenerator.getSalesReportData();
      const salesInvoices = storage.getItem('sales_invoices', []);
      
      // تحديد آخر 7 أيام
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date;
      });

      const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

      const weekData = last7Days.map(date => {
        const dayName = dayNames[date.getDay()];
        const dateString = date.toISOString().split('T')[0];
        
        // حساب مبيعات اليوم
        const dayInvoices = salesInvoices.filter(invoice => {
          const invoiceDate = new Date(invoice.date).toISOString().split('T')[0];
          return invoiceDate === dateString;
        });

        const daySales = dayInvoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
        const dayInvoicesCount = dayInvoices.length;

        return {
          name: dayName,
          sales: daySales,
          invoices: dayInvoicesCount
        };
      });

      setSalesData(weekData);
    } catch (error) {
      console.error('خطأ في تحميل بيانات المبيعات:', error);
    }
  };

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          مبيعات الأسبوع
        </CardTitle>
        <CardDescription>
          إجمالي المبيعات وعدد الفواتير خلال الأسبوع الحالي
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Amount Chart */}
          <div>
            <h4 className="text-sm font-medium mb-4 text-muted-foreground">قيمة المبيعات (ج.م)</h4>
            <ResponsiveContainer width="100%" height={200}>
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
                  formatter={(value: number) => [`${(value || 0).toLocaleString()} ج.م`, "المبيعات"]}
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
            <ResponsiveContainer width="100%" height={200}>
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
                  formatter={(value: number) => [`${value} فاتورة`, "عدد الفواتير"]}
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
      </CardContent>
    </Card>
  );
}