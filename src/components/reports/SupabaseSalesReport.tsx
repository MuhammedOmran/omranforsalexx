import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Download, FileText, TrendingUp, DollarSign, ShoppingCart, FileSpreadsheet } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import { useToast } from "@/hooks/use-toast";

interface SalesReportData {
  id: string;
  invoice_number?: string;
  customer_name: string;
  customer_phone?: string;
  total_amount: number;
  status: 'paid' | 'unpaid';
  created_at: string;
  items_count: number;
  payment_method?: string;
}

interface SalesStats {
  totalSales: number;
  totalInvoices: number;
  paidInvoices: number;
  unpaidInvoices: number;
  averageOrderValue: number;
  totalProfit: number;
}

export function SupabaseSalesReport() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });
  const [salesData, setSalesData] = useState<SalesReportData[]>([]);
  const [salesStats, setSalesStats] = useState<SalesStats>({
    totalSales: 0,
    totalInvoices: 0,
    paidInvoices: 0,
    unpaidInvoices: 0,
    averageOrderValue: 0,
    totalProfit: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      loadSalesReport();
    }
  }, [dateRange]);

  const loadSalesReport = async () => {
    if (!dateRange?.from || !dateRange?.to) return;

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "خطأ",
          description: "يجب تسجيل الدخول لعرض التقارير",
          variant: "destructive"
        });
        return;
      }

      const fromDate = new Date(dateRange.from);
      fromDate.setHours(0, 0, 0, 0);
      
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);

      // جلب بيانات الفواتير مع العملاء وعدد العناصر
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select(`
          id,
          total_amount,
          status,
          created_at,
          customer_id,
          customers (
            name,
            phone
          ),
          invoice_items (
            id,
            quantity,
            unit_price,
            total_price
          )
        `)
        .eq('user_id', user.id)
        .gte('created_at', fromDate.toISOString())
        .lte('created_at', toDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // تنسيق البيانات
      const formattedData: SalesReportData[] = (invoices || []).map((invoice, index) => ({
        id: invoice.id,
        invoice_number: `INV-${String(index + 1).padStart(4, '0')}`,
        customer_name: invoice.customers?.name || 'عميل غير محدد',
        customer_phone: invoice.customers?.phone,
        total_amount: invoice.total_amount || 0,
        status: invoice.status as 'paid' | 'unpaid',
        created_at: invoice.created_at,
        items_count: invoice.invoice_items?.length || 0,
        payment_method: invoice.status === 'paid' ? 'مدفوع' : 'معلق'
      }));

      setSalesData(formattedData);

      // حساب الإحصائيات
      const paidInvoices = formattedData.filter(inv => inv.status === 'paid');
      const unpaidInvoices = formattedData.filter(inv => inv.status === 'unpaid');
      
      const totalSales = paidInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
      const totalInvoicesCount = formattedData.length;
      const averageOrderValue = totalInvoicesCount > 0 ? totalSales / totalInvoicesCount : 0;

      // حساب الربح التقديري (30% هامش ربح)
      const estimatedProfit = totalSales * 0.3;

      setSalesStats({
        totalSales,
        totalInvoices: totalInvoicesCount,
        paidInvoices: paidInvoices.length,
        unpaidInvoices: unpaidInvoices.length,
        averageOrderValue,
        totalProfit: estimatedProfit
      });

    } catch (error) {
      logger.error('خطأ في تحميل تقرير المبيعات', error, 'SupabaseSalesReport');
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحميل تقرير المبيعات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    if (salesData.length === 0) {
      toast({
        title: "تنبيه",
        description: "لا توجد بيانات للتصدير في الفترة المحددة. سيتم إنشاء تقرير فارغ.",
        variant: "default"
      });
    }

    try {
      // استخدام Enhanced PDF Exporter للحصول على جودة أفضل
      const { EnhancedArabicPDFExporter } = await import('@/utils/enhancedArabicPdfExporter');
      const pdfExporter = new EnhancedArabicPDFExporter();
      
      // إعداد بيانات التقرير
      const dateRangeText = dateRange?.from && dateRange?.to 
        ? `${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}`
        : 'الفترة غير محددة';

      // إضافة المحتوى العربي
      await pdfExporter.addArabicContent({
        title: 'تقرير المبيعات الشامل',
        subtitle: `فترة التقرير: ${dateRangeText}`,
        sections: [
          {
            title: 'ملخص الإحصائيات',
            data: [
              { label: 'إجمالي المبيعات', value: `${salesStats.totalSales.toLocaleString()} ج.م` },
              { label: 'عدد الفواتير الإجمالي', value: `${salesStats.totalInvoices} فاتورة` },
              { label: 'الفواتير المدفوعة', value: `${salesStats.paidInvoices} فاتورة` },
              { label: 'الفواتير المعلقة', value: `${salesStats.unpaidInvoices} فاتورة` },
              { label: 'متوسط قيمة الفاتورة', value: `${salesStats.averageOrderValue.toLocaleString()} ج.م` },
              { label: 'الربح التقديري (30%)', value: `${salesStats.totalProfit.toLocaleString()} ج.م` },
              { label: 'معدل الدفع', value: `${salesStats.totalInvoices > 0 ? ((salesStats.paidInvoices / salesStats.totalInvoices) * 100).toFixed(1) : 0}%` }
            ]
          }
        ],
        tables: salesData.length > 0 ? [
          {
            title: 'تفاصيل الفواتير',
            headers: ['رقم الفاتورة', 'العميل', 'رقم الهاتف', 'المبلغ (ج.م)', 'عدد العناصر', 'الحالة', 'التاريخ'],
            rows: salesData.map(invoice => [
              invoice.invoice_number || '-',
              invoice.customer_name,
              invoice.customer_phone || '-',
              invoice.total_amount.toLocaleString(),
              invoice.items_count.toString(),
              invoice.status === 'paid' ? 'مدفوع' : 'معلق',
              new Date(invoice.created_at).toLocaleDateString('en-GB')
            ])
          }
        ] : []
      });

      // إضافة معلومات التقرير
      pdfExporter.addReportInfo(
        new Date().toLocaleDateString('en-GB'),
        dateRangeText
      );

      // حفظ الملف
      const fileName = `تقرير_المبيعات_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.pdf`;
      pdfExporter.save(fileName);

      toast({
        title: "تم تصدير التقرير",
        description: "تم حفظ تقرير المبيعات كملف PDF بنجاح"
      });

    } catch (error) {
      logger.error('خطأ في تصدير تقرير المبيعات', error, 'SupabaseSalesReport');
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير التقرير، يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    }
  };

  const exportToCSV = async () => {
    if (salesData.length === 0) {
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
        'العميل', 
        'رقم الهاتف',
        'المبلغ (ج.م)',
        'عدد العناصر',
        'الحالة',
        'التاريخ'
      ];

      const csvData = salesData.map(invoice => [
        invoice.invoice_number || '-',
        invoice.customer_name,
        invoice.customer_phone || '-',
        invoice.total_amount.toString(),
        invoice.items_count.toString(),
        invoice.status === 'paid' ? 'مدفوع' : 'معلق',
        new Date(invoice.created_at).toLocaleDateString('ar-SA')
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
      
      const fileName = `تقرير_المبيعات_${dateRangeText}.csv`;
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "تم تصدير التقرير",
        description: "تم حفظ تقرير المبيعات كملف CSV بنجاح"
      });

    } catch (error) {
      logger.error('خطأ في تصدير CSV', error, 'SupabaseSalesReport');
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير ملف CSV، يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('ar-SA')} ج.م`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      numberingSystem: 'latn'
    });
  };

  const getStatusBadge = (status: 'paid' | 'unpaid') => {
    const variants = {
      paid: 'bg-success/10 text-success border-success/20',
      unpaid: 'bg-destructive/10 text-destructive border-destructive/20'
    };
    
    const labels = {
      paid: 'مدفوع',
      unpaid: 'معلق'
    };

    return (
      <Badge className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-cairo text-foreground">تقرير المبيعات</h1>
          <p className="text-muted-foreground font-tajwal-body">تقرير شامل لجميع مبيعاتك مع البيانات المحدثة من قاعدة البيانات</p>
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
              <Label className="font-tajwal-body">فترة التقرير</Label>
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
            <Button onClick={loadSalesReport} disabled={loading} className="font-cairo">
              {loading ? "جاري التحميل..." : "تحديث التقرير"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajwal-body">إجمالي المبيعات</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-tajwal-body">{formatCurrency(salesStats.totalSales)}</div>
            <p className="text-xs text-muted-foreground font-tajwal-body">
              الفواتير المدفوعة فقط
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajwal-body">عدد الفواتير</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-tajwal-body">{salesStats.totalInvoices}</div>
            <p className="text-xs text-muted-foreground font-tajwal-body">
              {salesStats.paidInvoices} مدفوع • {salesStats.unpaidInvoices} معلق
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajwal-body">متوسط الفاتورة</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-tajwal-body">{formatCurrency(salesStats.averageOrderValue)}</div>
            <p className="text-xs text-muted-foreground font-tajwal-body">
              لكل فاتورة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajwal-body">الربح التقديري</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-tajwal-body">{formatCurrency(salesStats.totalProfit)}</div>
            <p className="text-xs text-muted-foreground font-tajwal-body">
              30% هامش ربح
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle className="font-cairo">تفاصيل المبيعات</CardTitle>
          <CardDescription className="font-tajwal-body">
            {salesData.length > 0 
              ? `عرض ${salesData.length} فاتورة في الفترة المحددة`
              : 'لا توجد فواتير في الفترة المحددة'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : salesData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الفاتورة</TableHead>
                  <TableHead>العميل</TableHead>
                  <TableHead>رقم الهاتف</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>عدد العناصر</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesData.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoice_number}
                    </TableCell>
                    <TableCell>{invoice.customer_name}</TableCell>
                    <TableCell>{invoice.customer_phone || '-'}</TableCell>
                    <TableCell className="font-bold">
                      {formatCurrency(invoice.total_amount)}
                    </TableCell>
                    <TableCell>{invoice.items_count}</TableCell>
                    <TableCell>
                      {getStatusBadge(invoice.status)}
                    </TableCell>
                    <TableCell>{formatDate(invoice.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-tajwal-body">لا توجد مبيعات في الفترة المحددة</p>
              <p className="text-sm mt-1 font-tajwal-body">جرب تغيير الفترة الزمنية أو إضافة فواتير جديدة</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}