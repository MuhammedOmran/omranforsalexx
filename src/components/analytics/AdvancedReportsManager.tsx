import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, ComposedChart,
  ScatterChart, Scatter, FunnelChart, Funnel, LabelList
} from 'recharts';
import {
  FileText, Download, Calendar as CalendarIcon, Filter, TrendingUp,
  BarChart3, PieChart as PieChartIcon, Users, Package, DollarSign,
  Target, Activity, Zap, Eye, Brain, Settings, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { unifiedReportsManager } from '@/utils/unifiedReportsManager';
import { LocalDataManager } from '@/utils/localData';
import jsPDF from 'jspdf';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

interface ReportFilters {
  startDate: Date;
  endDate: Date;
  reportType: string;
  customerId?: string;
  productCategory?: string;
  supplierId?: string;
}

export function AdvancedReportsManager() {
  const [activeTab, setActiveTab] = useState('comprehensive');
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
    reportType: 'all'
  });
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState({ start: false, end: false });

  const reportTypes = [
    { value: 'comprehensive', label: 'تقرير شامل' },
    { value: 'profit', label: 'تقرير الربحية' },
    { value: 'cashflow', label: 'التدفق النقدي' },
    { value: 'performance', label: 'أداء العملاء والموردين' },
    { value: 'integration', label: 'تقرير الترابط' },
    { value: 'risks', label: 'المخاطر والتنبيهات' }
  ];

  useEffect(() => {
    generateReport();
  }, [filters, activeTab]);

  const generateReport = async () => {
    setIsLoading(true);
    try {
      const startDateStr = filters.startDate.toISOString().split('T')[0];
      const endDateStr = filters.endDate.toISOString().split('T')[0];

      let data;
      switch (activeTab) {
        case 'comprehensive':
          data = unifiedReportsManager.getSystemIntegrationReport(startDateStr, endDateStr);
          break;
        case 'profit':
          data = unifiedReportsManager.getComprehensiveProfitReport(startDateStr, endDateStr);
          break;
        case 'cashflow':
          data = unifiedReportsManager.getUnifiedCashFlowReport(startDateStr, endDateStr);
          break;
        case 'performance':
          data = unifiedReportsManager.getIntegratedPerformanceReport();
          break;
        case 'risks':
          data = unifiedReportsManager.getRisksAndAlertsReport();
          break;
        default:
          data = unifiedReportsManager.getSystemIntegrationReport(startDateStr, endDateStr);
      }

      setReportData(data);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToPDF = () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // إعداد الخط
    pdf.text('تقرير مفصل - نظام إدارة المبيعات', 20, 20);
    pdf.text(`التاريخ: ${format(new Date(), 'yyyy-MM-dd')}`, 20, 30);
    pdf.text(`الفترة: ${format(filters.startDate, 'yyyy-MM-dd')} إلى ${format(filters.endDate, 'yyyy-MM-dd')}`, 20, 40);

    if (reportData) {
      let yPosition = 60;
      
      // إضافة البيانات المختلفة حسب نوع التقرير
      if (activeTab === 'profit' && reportData.revenue) {
        pdf.text('بيانات الإيرادات:', 20, yPosition);
        yPosition += 10;
        pdf.text(`إجمالي المبيعات: ${reportData.revenue.totalSales.toLocaleString()} ج.م`, 20, yPosition);
        yPosition += 10;
        pdf.text(`عدد الفواتير: ${reportData.revenue.salesCount}`, 20, yPosition);
        yPosition += 10;
        pdf.text(`متوسط قيمة الفاتورة: ${reportData.revenue.averageSaleValue.toFixed(0)} ج.م`, 20, yPosition);
        yPosition += 20;

        pdf.text('بيانات الربحية:', 20, yPosition);
        yPosition += 10;
        pdf.text(`الربح الإجمالي: ${reportData.profitability.grossProfit.toLocaleString()} ج.م`, 20, yPosition);
        yPosition += 10;
        pdf.text(`الربح الصافي: ${reportData.profitability.netProfit.toLocaleString()} ج.م`, 20, yPosition);
        yPosition += 10;
        pdf.text(`هامش الربح الإجمالي: ${reportData.profitability.grossMargin.toFixed(1)}%`, 20, yPosition);
        yPosition += 10;
        pdf.text(`هامش الربح الصافي: ${reportData.profitability.netMargin.toFixed(1)}%`, 20, yPosition);
      }
    }

    pdf.save(`تقرير-${activeTab}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const customers = LocalDataManager.getCustomers();
  const suppliers = LocalDataManager.getSuppliers();
  const products = LocalDataManager.getProducts();
  const categories = [...new Set(products.map(p => p.category))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">مدير التقارير المتقدم</h1>
        <div className="flex items-center gap-2">
          <Button onClick={generateReport} disabled={isLoading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          <Button onClick={exportToPDF} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            تصدير PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            فلاتر التقرير
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-6">
            {/* تاريخ البداية */}
            <div className="space-y-2">
              <Label>تاريخ البداية</Label>
              <Popover open={isCalendarOpen.start} onOpenChange={(open) => 
                setIsCalendarOpen(prev => ({ ...prev, start: open }))
              }>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {format(filters.startDate, 'yyyy-MM-dd')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.startDate}
                    onSelect={(date) => {
                      if (date) {
                        setFilters(prev => ({ ...prev, startDate: date }));
                        setIsCalendarOpen(prev => ({ ...prev, start: false }));
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* تاريخ النهاية */}
            <div className="space-y-2">
              <Label>تاريخ النهاية</Label>
              <Popover open={isCalendarOpen.end} onOpenChange={(open) => 
                setIsCalendarOpen(prev => ({ ...prev, end: open }))
              }>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {format(filters.endDate, 'yyyy-MM-dd')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.endDate}
                    onSelect={(date) => {
                      if (date) {
                        setFilters(prev => ({ ...prev, endDate: date }));
                        setIsCalendarOpen(prev => ({ ...prev, end: false }));
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* العميل */}
            <div className="space-y-2">
              <Label>العميل</Label>
              <Select value={filters.customerId || ''} onValueChange={(value) => 
                setFilters(prev => ({ ...prev, customerId: value || undefined }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="جميع العملاء" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع العملاء</SelectItem>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* المورد */}
            <div className="space-y-2">
              <Label>المورد</Label>
              <Select value={filters.supplierId || ''} onValueChange={(value) => 
                setFilters(prev => ({ ...prev, supplierId: value || undefined }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الموردين" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الموردين</SelectItem>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* فئة المنتج */}
            <div className="space-y-2">
              <Label>فئة المنتج</Label>
              <Select value={filters.productCategory || ''} onValueChange={(value) => 
                setFilters(prev => ({ ...prev, productCategory: value || undefined }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الفئات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الفئات</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* إعداد سريع */}
            <div className="space-y-2">
              <Label>فترة سريعة</Label>
              <Select onValueChange={(value) => {
                const today = new Date();
                let startDate = new Date();
                
                switch (value) {
                  case 'today':
                    startDate = new Date(today);
                    break;
                  case 'week':
                    startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                  case 'month':
                    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                    break;
                  case 'quarter':
                    startDate = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
                    break;
                  case 'year':
                    startDate = new Date(today.getFullYear(), 0, 1);
                    break;
                }
                
                setFilters(prev => ({ ...prev, startDate, endDate: today }));
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر فترة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">اليوم</SelectItem>
                  <SelectItem value="week">آخر أسبوع</SelectItem>
                  <SelectItem value="month">هذا الشهر</SelectItem>
                  <SelectItem value="quarter">هذا الربع</SelectItem>
                  <SelectItem value="year">هذا العام</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="comprehensive">شامل</TabsTrigger>
          <TabsTrigger value="profit">الربحية</TabsTrigger>
          <TabsTrigger value="cashflow">التدفق النقدي</TabsTrigger>
          <TabsTrigger value="performance">الأداء</TabsTrigger>
          <TabsTrigger value="integration">الترابط</TabsTrigger>
          <TabsTrigger value="risks">المخاطر</TabsTrigger>
        </TabsList>

        <TabsContent value="comprehensive" className="space-y-6">
          <ComprehensiveReport data={reportData} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="profit" className="space-y-6">
          <ProfitReport data={reportData} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-6">
          <CashFlowReport data={reportData} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <PerformanceReport data={reportData} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="integration" className="space-y-6">
          <IntegrationReport data={reportData} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="risks" className="space-y-6">
          <RisksReport data={reportData} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ComprehensiveReport({ data, isLoading }: { data: any, isLoading: boolean }) {
  if (isLoading) {
    return <div className="text-center py-8">جاري تحليل البيانات...</div>;
  }

  if (!data) {
    return (
      <Alert>
        <AlertDescription>لا تتوفر بيانات كافية لإنشاء التقرير الشامل</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* ملخص المؤشرات */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المبيعات</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.profitability?.revenue?.totalSales?.toLocaleString() || 0} ج.م
            </div>
            <p className="text-xs text-muted-foreground">للفترة المحددة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">صافي الربح</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data.profitability?.profitability?.netProfit?.toLocaleString() || 0} ج.م
            </div>
            <p className="text-xs text-muted-foreground">
              هامش {data.profitability?.profitability?.netMargin?.toFixed(1) || 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">التدفق النقدي</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {data.cashFlow?.transactions?.netFlow?.toLocaleString() || 0} ج.م
            </div>
            <p className="text-xs text-muted-foreground">صافي التدفق</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل الترابط</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {data.integration?.salesInventoryLinkRate?.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">ترابط المبيعات بالمخزون</p>
          </CardContent>
        </Card>
      </div>

      {/* الرسوم البيانية */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>توزيع الإيرادات والتكاليف</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'الإيرادات', value: data.profitability?.revenue?.totalSales || 0 },
                    { name: 'التكاليف', value: data.profitability?.costs?.totalCosts || 0 }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {[0, 1].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${(value || 0).toLocaleString()} ج.م`]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>تحليل الترابط بين الأنظمة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>ترابط المبيعات بالمخزون</span>
                  <span>{data.integration?.salesInventoryLinkRate?.toFixed(1) || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${data.integration?.salesInventoryLinkRate || 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>ترابط المشتريات بالمخزون</span>
                  <span>{data.integration?.purchaseInventoryLinkRate?.toFixed(1) || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${data.integration?.purchaseInventoryLinkRate || 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>ترابط حركات المخزون</span>
                  <span>{data.integration?.movementLinkRate?.toFixed(1) || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full" 
                    style={{ width: `${data.integration?.movementLinkRate || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProfitReport({ data, isLoading }: { data: any, isLoading: boolean }) {
  if (isLoading) {
    return <div className="text-center py-8">جاري حساب الربحية...</div>;
  }

  if (!data || !data.revenue) {
    return (
      <Alert>
        <AlertDescription>لا تتوفر بيانات كافية لتقرير الربحية</AlertDescription>
      </Alert>
    );
  }

  const profitData = [
    { name: 'إجمالي المبيعات', value: data.revenue.totalSales },
    { name: 'إجمالي التكاليف', value: data.costs.totalCosts },
    { name: 'الربح الإجمالي', value: data.profitability.grossProfit },
    { name: 'الربح الصافي', value: data.profitability.netProfit }
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المبيعات</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {data.revenue.totalSales.toLocaleString()} ج.م
            </div>
            <p className="text-xs text-muted-foreground">
              {data.revenue.salesCount} فاتورة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الربح الإجمالي</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data.profitability.grossProfit.toLocaleString()} ج.م
            </div>
            <p className="text-xs text-muted-foreground">
              هامش {data.profitability.grossMargin.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الربح الصافي</CardTitle>
            <Target className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {data.profitability.netProfit.toLocaleString()} ج.م
            </div>
            <p className="text-xs text-muted-foreground">
              هامش {data.profitability.netMargin.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط الفاتورة</CardTitle>
            <BarChart3 className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {data.revenue.averageSaleValue.toFixed(0)} ج.م
            </div>
            <p className="text-xs text-muted-foreground">متوسط قيمة الفاتورة</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>تحليل الربحية</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={profitData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`${(value || 0).toLocaleString()} ج.م`]} />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>نسب الربحية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">هامش الربح الإجمالي</span>
                  <span className="text-sm font-bold text-green-600">
                    {data.profitability.grossMargin.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-green-600 h-3 rounded-full" 
                    style={{ width: `${Math.min(100, data.profitability.grossMargin)}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">هامش الربح الصافي</span>
                  <span className="text-sm font-bold text-purple-600">
                    {data.profitability.netMargin.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-purple-600 h-3 rounded-full" 
                    style={{ width: `${Math.min(100, Math.max(0, data.profitability.netMargin))}%` }}
                  ></div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">تحليل التكاليف</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>تكلفة المشتريات:</span>
                    <span>{data.costs.totalPurchases.toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex justify-between">
                    <span>إجمالي المصروفات:</span>
                    <span>{data.costs.totalExpenses.toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-1">
                    <span>إجمالي التكاليف:</span>
                    <span>{data.costs.totalCosts.toLocaleString()} ج.م</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CashFlowReport({ data, isLoading }: { data: any, isLoading: boolean }) {
  if (isLoading) {
    return <div className="text-center py-8">جاري تحليل التدفق النقدي...</div>;
  }

  if (!data || !data.transactions) {
    return (
      <Alert>
        <AlertDescription>لا تتوفر بيانات كافية لتقرير التدفق النقدي</AlertDescription>
      </Alert>
    );
  }

  const flowData = [
    { name: 'الدخل', value: data.transactions.totalIncome, type: 'income' },
    { name: 'المصروفات', value: data.transactions.totalExpense, type: 'expense' },
    { name: 'صافي التدفق', value: data.transactions.netFlow, type: 'net' }
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الدخل</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data.transactions.totalIncome.toLocaleString()} ج.م
            </div>
            <p className="text-xs text-muted-foreground">إجمالي الإيرادات</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المصروفات</CardTitle>
            <Activity className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {data.transactions.totalExpense.toLocaleString()} ج.م
            </div>
            <p className="text-xs text-muted-foreground">إجمالي المصروفات</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">صافي التدفق</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              data.transactions.netFlow >= 0 ? 'text-blue-600' : 'text-red-600'
            }`}>
              {data.transactions.netFlow.toLocaleString()} ج.م
            </div>
            <p className="text-xs text-muted-foreground">صافي التدفق النقدي</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عدد المعاملات</CardTitle>
            <FileText className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {data.transactions.transactionCount}
            </div>
            <p className="text-xs text-muted-foreground">إجمالي المعاملات</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>تحليل التدفق النقدي</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={flowData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`${(value || 0).toLocaleString()} ج.م`]} />
                <Bar dataKey="value" fill="#8884d8" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>تفاصيل الشيكات والأقساط</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* الشيكات */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  الشيكات
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>إجمالي قيمة الشيكات:</span>
                    <span className="font-medium">{data.checks.totalAmount.toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الشيكات المحصلة:</span>
                    <span className="font-medium text-green-600">{data.checks.cashedAmount.toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الشيكات المعلقة:</span>
                    <span className="font-medium text-orange-600">{data.checks.pendingAmount.toLocaleString()} ج.م</span>
                  </div>
                </div>
              </div>

              {/* الأقساط */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  الأقساط
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>إجمالي قيمة الأقساط:</span>
                    <span className="font-medium">{data.installments.totalAmount.toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الأقساط المدفوعة:</span>
                    <span className="font-medium text-green-600">{data.installments.paidAmount.toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الأقساط المعلقة:</span>
                    <span className="font-medium text-orange-600">{data.installments.pendingAmount.toLocaleString()} ج.م</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PerformanceReport({ data, isLoading }: { data: any, isLoading: boolean }) {
  if (isLoading) {
    return <div className="text-center py-8">جاري تحليل الأداء...</div>;
  }

  if (!data) {
    return (
      <Alert>
        <AlertDescription>لا تتوفر بيانات كافية لتقرير الأداء</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Customer Performance */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              أداء العملاء
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{data.customers.totalCustomers}</div>
                  <p className="text-xs text-muted-foreground">إجمالي العملاء</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">{data.customers.riskCustomers.length}</div>
                  <p className="text-xs text-muted-foreground">عملاء معرضون للخطر</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{data.customers.customersWithPendingChecks}</div>
                  <p className="text-xs text-muted-foreground">عملاء بشيكات معلقة</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">أفضل العملاء</h4>
                {data.customers.topPerformers.slice(0, 5).map((customer: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium">{customer.name}</span>
                    <Badge variant="secondary">{customer.totalSales?.toLocaleString() || 0} ج.م</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              أداء الموردين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{data.suppliers.totalSuppliers}</div>
                <p className="text-xs text-muted-foreground">إجمالي الموردين</p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">أفضل الموردين</h4>
                {data.suppliers.topPerformers.slice(0, 5).map((supplier: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium">{supplier.name}</span>
                    <Badge variant="secondary">{supplier.totalPurchases?.toLocaleString() || 0} ج.م</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function IntegrationReport({ data, isLoading }: { data: any, isLoading: boolean }) {
  if (isLoading) {
    return <div className="text-center py-8">جاري تحليل الترابط...</div>;
  }

  if (!data || !data.integration) {
    return (
      <Alert>
        <AlertDescription>لا تتوفر بيانات كافية لتقرير الترابط</AlertDescription>
      </Alert>
    );
  }

  const integrationData = [
    { name: 'المبيعات ↔ المخزون', rate: data.integration.salesInventoryLinkRate },
    { name: 'المشتريات ↔ المخزون', rate: data.integration.purchaseInventoryLinkRate },
    { name: 'حركات المخزون', rate: data.integration.movementLinkRate }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            معدلات الترابط بين الأنظمة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={integrationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => [`${value}%`, 'معدل الترابط']} />
              <Bar dataKey="rate" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">المبيعات والمخزون</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">إجمالي فواتير المبيعات:</span>
                <span className="font-medium">{data.integration.totalSalesInvoices}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">المربوطة بالمخزون:</span>
                <span className="font-medium text-green-600">{data.integration.salesLinkedToInventory}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">معدل الترابط:</span>
                <Badge variant="secondary">{data.integration.salesInventoryLinkRate.toFixed(1)}%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">المشتريات والمخزون</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">إجمالي فواتير المشتريات:</span>
                <span className="font-medium">{data.integration.totalPurchaseInvoices}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">المربوطة بالمخزون:</span>
                <span className="font-medium text-green-600">{data.integration.purchasesLinkedToInventory}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">معدل الترابط:</span>
                <Badge variant="secondary">{data.integration.purchaseInventoryLinkRate.toFixed(1)}%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">حركات المخزون</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">إجمالي الحركات:</span>
                <span className="font-medium">{data.integration.totalInventoryMovements}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">المربوطة بمعاملات:</span>
                <span className="font-medium text-green-600">{data.integration.linkedMovements}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">معدل الترابط:</span>
                <Badge variant="secondary">{data.integration.movementLinkRate.toFixed(1)}%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RisksReport({ data, isLoading }: { data: any, isLoading: boolean }) {
  if (isLoading) {
    return <div className="text-center py-8">جاري تحليل المخاطر...</div>;
  }

  if (!data) {
    return (
      <Alert>
        <AlertDescription>لا تتوفر بيانات كافية لتقرير المخاطر</AlertDescription>
      </Alert>
    );
  }

  const riskData = [
    { name: 'مخزون منخفض', count: data.inventory.lowStockCount, severity: 'medium' },
    { name: 'مخزون منتهي', count: data.inventory.outOfStockCount, severity: 'high' },
    { name: 'عملاء متأخرون', count: data.customers.overdueCustomersCount, severity: 'high' },
    { name: 'شيكات متأخرة', count: data.checks.overdueChecksCount, severity: 'medium' },
    { name: 'أقساط متأخرة', count: data.installments.overdueInstallmentsCount, severity: 'medium' }
  ];

  return (
    <div className="space-y-6">
      {/* Risk Overview */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مخزون منخفض</CardTitle>
            <Package className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {data.inventory.lowStockCount}
            </div>
            <p className="text-xs text-muted-foreground">منتج</p>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مخزون منتهي</CardTitle>
            <Package className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {data.inventory.outOfStockCount}
            </div>
            <p className="text-xs text-muted-foreground">منتج</p>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عملاء متأخرون</CardTitle>
            <Users className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {data.customers.overdueCustomersCount}
            </div>
            <p className="text-xs text-muted-foreground">عميل</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">شيكات متأخرة</CardTitle>
            <FileText className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {data.checks.overdueChecksCount}
            </div>
            <p className="text-xs text-muted-foreground">شيك</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">أقساط متأخرة</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {data.installments.overdueInstallmentsCount}
            </div>
            <p className="text-xs text-muted-foreground">قسط</p>
          </CardContent>
        </Card>
      </div>

      {/* Risk Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>توزيع المخاطر</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={
                      entry.severity === 'high' ? '#EF4444' :
                      entry.severity === 'medium' ? '#F59E0B' : '#10B981'
                    } />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name, props) => [
                  `${value} حالة`,
                  props.payload.name
                ]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>التأثير المالي للمخاطر</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-red-800">قيمة الديون المتأخرة</span>
                  <span className="text-lg font-bold text-red-600">
                    {data.customers.totalOverdueAmount.toLocaleString()} ج.م
                  </span>
                </div>
              </div>

              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-yellow-800">قيمة الشيكات المتأخرة</span>
                  <span className="text-lg font-bold text-yellow-600">
                    {data.checks.overdueChecksAmount.toLocaleString()} ج.م
                  </span>
                </div>
              </div>

              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-orange-800">قيمة الأقساط المتأخرة</span>
                  <span className="text-lg font-bold text-orange-600">
                    {data.installments.overdueInstallmentsAmount.toLocaleString()} ج.م
                  </span>
                </div>
              </div>

              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-purple-800">قيمة المخزون المنخفض</span>
                  <span className="text-lg font-bold text-purple-600">
                    {data.inventory.lowStockValue.toLocaleString()} ج.م
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}