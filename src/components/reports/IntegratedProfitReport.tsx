import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Download, TrendingUp, DollarSign, Target, BarChart3, FileSpreadsheet } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from "recharts";
import { useProfitReport } from "@/hooks/useProfitReport";

export function IntegratedProfitReport() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });
  
  const { data: profitData, loading } = useProfitReport(dateRange?.from, dateRange?.to);

  const exportToPDF = () => {
    if (!profitData) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('يرجى السماح بفتح النوافذ المنبثقة لتصدير التقرير');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>تقرير الأرباح المتكامل</title>
        <style>
          body { 
            font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            direction: rtl; 
            margin: 0; 
            padding: 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
          }
          .container {
            background: white;
            border-radius: 15px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            margin: 0 auto;
            max-width: 1000px;
          }
          .header { 
            text-align: center; 
            margin-bottom: 40px; 
            border-bottom: 3px solid #10b981; 
            padding-bottom: 30px; 
            position: relative;
          }
          .header::before {
            content: '';
            position: absolute;
            bottom: -3px;
            left: 50%;
            transform: translateX(-50%);
            width: 100px;
            height: 3px;
            background: linear-gradient(90deg, #10b981, #059669);
            border-radius: 2px;
          }
          .title { 
            font-size: 36px; 
            font-weight: bold; 
            color: #10b981;
            margin-bottom: 10px;
            text-shadow: 0 2px 4px rgba(16, 185, 129, 0.1);
          }
          .subtitle {
            font-size: 18px;
            color: #6b7280;
            font-weight: 500;
          }
          .stats-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); 
            gap: 25px; 
            margin: 40px 0; 
          }
          .stat-card { 
            background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
            border: 2px solid #d1fae5; 
            border-radius: 15px; 
            padding: 25px; 
            text-align: center;
            transition: transform 0.3s ease;
            position: relative;
            overflow: hidden;
          }
          .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #10b981, #059669);
          }
          .stat-title {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 10px;
            font-weight: 600;
          }
          .stat-value {
            font-size: 28px;
            font-weight: bold;
            color: #10b981;
            margin-bottom: 5px;
          }
          .stat-note {
            font-size: 12px;
            color: #9ca3af;
            font-style: italic;
          }
          .footer {
            text-align: center;
            margin-top: 50px;
            padding-top: 30px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="title">تقرير الأرباح المتكامل</h1>
            <p class="subtitle">تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}</p>
          </div>
          <div class="stats-grid">
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-title">إجمالي الإيرادات</div>
              <div class="stat-value">${profitData.totalRevenue.toLocaleString()} ج.م</div>
              <div class="stat-note">من ${profitData.salesCount} مبيعة</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">إجمالي التكاليف</div>
              <div class="stat-value">${profitData.totalCosts.toLocaleString()} ج.م</div>
              <div class="stat-note">تكلفة البضائع والمشتريات والمخزون الحالي</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">صافي الربح</div>
              <div class="stat-value" style="color: ${profitData.netProfit >= 0 ? '#059669' : '#dc2626'}">${profitData.netProfit.toLocaleString()} ج.م</div>
              <div class="stat-note">${profitData.netProfit >= 0 ? 'ربح' : 'خسارة'}</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">هامش الربح</div>
              <div class="stat-value" style="color: ${profitData.profitMargin >= 0 ? '#059669' : '#dc2626'}">${profitData.profitMargin.toFixed(1)}%</div>
              <div class="stat-note">متوسط الطلب: ${profitData.averageOrderValue.toLocaleString()} ج.م</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">أفضل المنتجات ربحية</h2>
          <table>
            <thead>
              <tr>
                <th>اسم المنتج</th>
                <th>الربح</th>
                <th>الإيراد</th>
                <th>الكمية</th>
              </tr>
            </thead>
            <tbody>
              ${profitData.topProducts.slice(0, 10).map(product => `
                <tr>
                  <td>${product.name}</td>
                  <td>${product.profit.toLocaleString()} ج.م</td>
                  <td>${product.revenue.toLocaleString()} ج.م</td>
                  <td>${product.quantity}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p>تم إنشاء هذا التقرير بواسطة نظام إدارة المبيعات</p>
          <p>تاريخ الإنشاء: ${new Date().toLocaleString('en-GB')}</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const exportToCSV = () => {
    if (!profitData) return;
    
    // استخدام ArabicExcelExporter للحصول على تصدير أفضل للعربية
    const csvData = [
      ['تقرير الأرباح المتكامل'],
      ['تاريخ التقرير', new Date().toLocaleDateString('ar-EG')],
      ['الفترة', `${dateRange?.from ? format(dateRange.from, "dd/MM/yyyy", { locale: ar }) : ''} - ${dateRange?.to ? format(dateRange.to, "dd/MM/yyyy", { locale: ar }) : ''}`],
      [''],
      ['البيان', 'القيمة'],
      ['إجمالي الإيرادات', `${profitData.totalRevenue.toLocaleString()} ج.م`],
      ['إجمالي التكاليف', `${profitData.totalCosts.toLocaleString()} ج.م`],
      ['صافي الربح', `${profitData.netProfit.toLocaleString()} ج.م`],
      ['هامش الربح', `${profitData.profitMargin.toFixed(1)}%`],
      ['عدد المبيعات', profitData.salesCount.toString()],
      ['متوسط قيمة الطلب', `${profitData.averageOrderValue.toLocaleString()} ج.م`],
      [''],
      ['أفضل المنتجات ربحية'],
      ['اسم المنتج', 'الربح', 'الإيراد', 'الكمية'],
      ...profitData.topProducts.slice(0, 10).map(product => [
        product.name,
        `${product.profit.toLocaleString()} ج.م`,
        `${product.revenue.toLocaleString()} ج.م`,
        product.quantity.toString()
      ])
    ];

    // إضافة BOM للـ UTF-8 لضمان عرض العربية بشكل صحيح
    const BOM = '\uFEFF';
    const csvContent = BOM + csvData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { 
      type: 'text/csv;charset=utf-8;' 
    });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `تقرير_الأرباح_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  if (loading || !profitData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-cairo text-foreground">تقرير الأرباح المتكامل</h1>
          <p className="text-muted-foreground font-tajwal-body">تحليل شامل للأرباح والإيرادات والتكاليف</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={exportToPDF} 
            className="font-cairo bg-primary hover:bg-primary-hover text-primary-foreground"
          >
            <Download className="h-4 w-4 mr-2" />
            تصدير كـ PDF
          </Button>
          <Button 
            onClick={exportToCSV} 
            variant="outline"
            className="font-cairo border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            تصدير CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-cairo">
            <CalendarIcon className="h-5 w-5" />
            تصفية التقرير
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium font-tajwal-body">فترة التقرير</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[300px] justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd MMM yyyy", { locale: ar })} -{" "}
                          {format(dateRange.to, "dd MMM yyyy", { locale: ar })}
                        </>
                      ) : (
                        format(dateRange.from, "dd MMM yyyy", { locale: ar })
                      )
                    ) : (
                      <span>اختر الفترة الزمنية</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    locale={ar}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajwal-body">إجمالي الإيرادات</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-tajwal-body">
              {profitData.totalRevenue.toLocaleString()} ج.م
            </div>
            <p className="text-xs text-muted-foreground font-tajwal-body">من {profitData.salesCount} مبيعة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajwal-body">إجمالي التكاليف</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-tajwal-body">
              {profitData.totalCosts.toLocaleString()} ج.م
            </div>
            <p className="text-xs text-muted-foreground font-tajwal-body">تكلفة البضائع والمشتريات والمخزون الحالي</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajwal-body">صافي الربح</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold font-tajwal-body ${profitData.netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
              {profitData.netProfit.toLocaleString()} ج.م
            </div>
            <p className="text-xs text-muted-foreground font-tajwal-body">
              {profitData.netProfit >= 0 ? 'ربح' : 'خسارة'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajwal-body">هامش الربح</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold font-tajwal-body ${profitData.profitMargin >= 0 ? 'text-success' : 'text-destructive'}`}>
              {profitData.profitMargin.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground font-tajwal-body">
              متوسط الطلب: {profitData.averageOrderValue.toLocaleString()} ج.م
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-cairo">الأرباح الشهرية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={profitData.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="profit" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-cairo">اتجاه الأرباح اليومية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={profitData.dailyProfit}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="profit" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle className="font-cairo">أفضل المنتجات ربحية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {profitData.topProducts.slice(0, 10).map((product, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded">
                <span className="font-medium font-tajawal">{product.name}</span>
                <div className="text-left">
                  <div className="font-bold text-success font-tajawal">{product.profit.toLocaleString()} ج.م</div>
                  <div className="text-xs text-muted-foreground font-tajawal">
                    إيراد: {product.revenue.toLocaleString()} | كمية: {product.quantity}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}