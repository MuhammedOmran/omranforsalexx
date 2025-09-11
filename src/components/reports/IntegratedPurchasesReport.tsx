import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Download, ShoppingCart, TrendingUp, Users, AlertCircle, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { usePurchasesReport } from "@/hooks/usePurchasesReport";

export function IntegratedPurchasesReport() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });
  
  const { data: purchasesData, loading } = usePurchasesReport(dateRange?.from, dateRange?.to);
  const { toast } = useToast();

  const exportToPDF = () => {
    if (!purchasesData) return;

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
        <title>تقرير المشتريات المتكامل</title>
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
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            position: relative;
            z-index: 2;
          }
          .subtitle { 
            font-size: 22px; 
            margin-bottom: 25px; 
            opacity: 0.95;
            font-weight: 600;
            position: relative;
            z-index: 2;
          }
          .info { 
            font-size: 16px; 
            opacity: 0.9;
            background: rgba(255,255,255,0.15);
            padding: 15px 25px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
            position: relative;
            z-index: 2;
          }
          .info div {
            margin-bottom: 8px;
          }
          .info div:last-child {
            margin-bottom: 0;
          }
          .section { 
            margin: 50px 0; 
            position: relative;
          }
          .section-title { 
            font-size: 28px; 
            font-weight: 700; 
            background: linear-gradient(135deg, #667eea, #764ba2, #f093fb);
            color: white;
            padding: 20px 30px;
            border-radius: 15px;
            margin-bottom: 30px; 
            text-align: center;
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
            position: relative;
            overflow: hidden;
          }
          .section-title::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            transition: left 0.5s;
          }
          .stats-grid { 
            display: grid; 
            grid-template-columns: repeat(2, 1fr); 
            gap: 30px; 
            margin: 40px 0; 
          }
          .stat-card { 
            border-radius: 20px; 
            padding: 35px 25px; 
            text-align: center;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
            min-height: 180px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            position: relative;
            overflow: hidden;
            transform: translateY(0);
            transition: transform 0.3s ease;
          }
          .stat-card::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            transform: rotate(45deg);
          }
          .stat-card.purchases { 
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
          }
          .stat-card.total-amount { 
            background: linear-gradient(135deg, #f093fb, #f5576c);
            color: white;
          }
          .stat-card.paid-amount { 
            background: linear-gradient(135deg, #4facfe, #00f2fe);
            color: white;
          }
          .stat-card.pending-amount { 
            background: linear-gradient(135deg, #fa709a, #fee140);
            color: white;
          }
          .stat-title { 
            font-size: 20px; 
            font-weight: 600; 
            margin-bottom: 20px; 
            opacity: 0.95;
            position: relative;
            z-index: 2;
          }
          .stat-value { 
            font-size: 36px; 
            font-weight: 800; 
            margin-bottom: 15px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
            position: relative;
            z-index: 2;
          }
          .stat-note { 
            font-size: 16px; 
            opacity: 0.85;
            font-weight: 500;
            position: relative;
            z-index: 2;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 30px 0; 
            border-radius: 15px; 
            overflow: hidden; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
            background: white;
          }
          th, td { 
            border: none; 
            padding: 18px 12px; 
            text-align: center; 
            position: relative;
          }
          th { 
            background: linear-gradient(135deg, #667eea, #764ba2); 
            color: white; 
            font-weight: 700; 
            font-size: 16px;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
          }
          tbody tr { 
            background: white;
            transition: all 0.3s ease;
          }
          tbody tr:nth-child(even) { 
            background: linear-gradient(135deg, #f8f9ff, #fff5f8); 
          }
          tbody tr:hover { 
            background: linear-gradient(135deg, #e8edff, #ffe8f0);
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
          }
          tbody td {
            font-weight: 500;
            color: #444;
            border-bottom: 1px solid #eee;
          }
          .footer { 
            margin-top: 60px; 
            text-align: center; 
            font-size: 14px; 
            color: #666;
            padding: 30px;
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            border-radius: 15px;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
          }
          .footer p {
            margin-bottom: 8px;
            font-weight: 500;
          }
          .footer p:last-child {
            margin-bottom: 0;
            opacity: 0.8;
          }
          @media print {
            body { 
              margin: 0; 
              background: white !important;
            }
            .container {
              box-shadow: none;
              margin: 0;
              border-radius: 0;
            }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="container">
        <div class="header">
          <h1 class="title">تقرير المشتريات المتكامل</h1>
          <div class="subtitle">تحليل شامل لعمليات الشراء والموردين</div>
          <div class="info">
            <div>تاريخ التقرير: ${new Date().toLocaleDateString('en-GB')}</div>
            <div>الفترة: ${dateRange?.from ? format(dateRange.from, "dd/MM/yyyy", { locale: ar }) : ''} - ${dateRange?.to ? format(dateRange.to, "dd/MM/yyyy", { locale: ar }) : ''}</div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">الملخص المالي</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-title">إجمالي المشتريات</div>
              <div class="stat-value">${purchasesData.totalPurchases}</div>
              <div class="stat-note">فاتورة شراء</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">إجمالي المبلغ</div>
              <div class="stat-value">${purchasesData.totalAmount.toLocaleString()} ج.م</div>
              <div class="stat-note">إجمالي المشتريات</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">المبلغ المدفوع</div>
              <div class="stat-value">${purchasesData.paidAmount.toLocaleString()} ج.م</div>
              <div class="stat-note">تم الدفع</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">المبلغ المستحق</div>
              <div class="stat-value">${purchasesData.pendingAmount.toLocaleString()} ج.م</div>
              <div class="stat-note">متبقي للدفع</div>
            </div>
          </div>
        </div>

          <div class="section">
            <h2 class="section-title">🏆 أفضل الموردين</h2>
            <table>
              <thead>
                <tr>
                  <th>🏪 اسم المورد</th>
                  <th>💵 إجمالي المشتريات</th>
                  <th>📋 عدد الفواتير</th>
                </tr>
              </thead>
              <tbody>
                ${purchasesData.topSuppliers.slice(0, 10).map((supplier, index) => `
                  <tr>
                    <td><strong>${supplier.name}</strong></td>
                    <td><span style="color: #667eea; font-weight: 600;">${supplier.amount.toLocaleString()} ج.م</span></td>
                    <td><span style="background: linear-gradient(45deg, #667eea, #764ba2); color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 600;">${supplier.invoices}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="footer">
            <p>🚀 تم إنشاء هذا التقرير بواسطة نظام إدارة المبيعات SPADEX</p>
            <p>⏰ تاريخ الإنشاء: ${new Date().toLocaleString('en-GB')}</p>
          </div>
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
    if (!purchasesData || purchasesData.recentPurchases.length === 0) {
      toast({
        title: "تنبيه",
        description: "لا توجد بيانات للتصدير في الفترة المحددة",
        variant: "default"
      });
      return;
    }

    try {
      // إعداد بيانات CSV
      const csvHeaders = [
        'رقم الفاتورة',
        'اسم المورد',
        'هاتف المورد',
        'المبلغ الإجمالي (ج.م)',
        'المبلغ المدفوع (ج.م)',
        'المبلغ المتبقي (ج.م)',
        'الحالة',
        'تاريخ الفاتورة',
        'تاريخ الاستحقاق'
      ];

      const csvData = purchasesData.recentPurchases.map(purchase => [
        purchase.invoice_number || '-',
        purchase.supplier_name || '-',
        purchase.supplier_phone || '-',
        purchase.total_amount.toString(),
        purchase.paid_amount.toString(),
        (purchase.total_amount - purchase.paid_amount).toString(),
        purchase.paid_amount >= purchase.total_amount ? 'مدفوع' : 'جزئي',
        new Date(purchase.invoice_date).toLocaleDateString('en-GB'),
        purchase.due_date ? new Date(purchase.due_date).toLocaleDateString('en-GB') : '-'
      ]);

      // تحويل البيانات إلى CSV
      const csvContent = [
        csvHeaders.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // إضافة BOM للتأكد من دعم UTF-8
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // تحميل الملف
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      const dateRangeText = dateRange?.from && dateRange?.to 
        ? `${format(dateRange.from, 'dd-MM-yyyy')}_${format(dateRange.to, 'dd-MM-yyyy')}`
        : 'غير_محددة';
      
      const fileName = `تقرير_المشتريات_${dateRangeText}.csv`;
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "تم تصدير التقرير",
        description: "تم حفظ تقرير المشتريات كملف CSV بنجاح"
      });

    } catch (error) {
      console.error('خطأ في تصدير CSV:', error);
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير ملف CSV، يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    }
  };

  if (loading || !purchasesData) {
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
          <h1 className="text-3xl font-cairo">تقرير المشتريات المتكامل</h1>
          <p className="text-muted-foreground font-tajawal">تحليل شامل لعمليات الشراء والموردين</p>
        </div>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-[300px] justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      <span className="font-tajawal">{format(dateRange.from, "LLL dd, y", { locale: ar })} -{" "}
                      {format(dateRange.to, "LLL dd, y", { locale: ar })}</span>
                    </>
                  ) : (
                    <span className="font-tajawal">{format(dateRange.from, "LLL dd, y", { locale: ar })}</span>
                  )
                ) : (
                  <span className="font-tajawal">اختر التاريخ</span>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">إجمالي المشتريات</CardTitle>
            <ShoppingCart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-tajawal">{purchasesData.totalPurchases}</div>
            <p className="text-xs text-muted-foreground font-tajawal">فاتورة شراء</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">إجمالي المبلغ</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success font-tajawal">
              {purchasesData.totalAmount.toLocaleString()} ج.م
            </div>
            <p className="text-xs text-muted-foreground font-tajawal">إجمالي المشتريات</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">المبلغ المدفوع</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary font-tajawal">
              {purchasesData.paidAmount.toLocaleString()} ج.م
            </div>
            <p className="text-xs text-muted-foreground font-tajawal">تم الدفع</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">المبلغ المستحق</CardTitle>
            <AlertCircle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning font-tajawal">
              {purchasesData.pendingAmount.toLocaleString()} ج.م
            </div>
            <p className="text-xs text-muted-foreground font-tajawal">متبقي للدفع</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-cairo">المشتريات الشهرية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={purchasesData.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="amount" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-cairo">أفضل الموردين</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {purchasesData.topSuppliers.map((supplier, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <span className="font-medium font-tajawal">{supplier.name}</span>
                  <div className="text-left">
                    <div className="font-bold font-tajawal">{supplier.amount.toLocaleString()} ج.م</div>
                    <div className="text-xs text-muted-foreground font-tajawal">{supplier.invoices} فاتورة</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}