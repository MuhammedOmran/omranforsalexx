import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { TrendingUp, TrendingDown, AlertTriangle, Package2, Calendar, Download, FileText, CheckSquare, RefreshCcw, Filter, BarChart3, Wrench, Bell } from "lucide-react";
import { returnsManager } from "@/utils/returnsManager";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArabicPDFExporter } from "@/utils/arabicPdfExporter";
import { ArabicExcelExporter } from "@/utils/arabicExcelExporter";

// استيراد المكونات المدمجة
import { ReturnsAdvancedFilters, FilterState } from "./ReturnsAdvancedFilters";
import { ReturnsComparativeAnalytics } from "./ReturnsComparativeAnalytics";
import { ReturnsInventoryTracker } from "./ReturnsInventoryTracker";
import { ReturnsPrintManager } from "./ReturnsPrintManager";
import { ReturnsSmartAlerts } from "./ReturnsSmartAlerts";
import { ReturnsSmartNotifications } from "./ReturnsSmartNotifications";

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#e74c3c', '#9b59b6'];

export function ReturnsAnalytics() {
  const [selectedReturns, setSelectedReturns] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [selectedReturnForPrint, setSelectedReturnForPrint] = useState<any>(null);
  
  // حالة المرشحات للبحث المتقدم
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    status: 'all',
    reason: 'all',
    dateFrom: undefined,
    dateTo: undefined,
    customerName: '',
    productName: '',
    amountRange: { min: 0, max: 0 }
  });
  const [filteredReturns, setFilteredReturns] = useState<any[]>([]);

  const analytics = useMemo(() => {
    const returns = returnsManager.getReturns();
    const stats = returnsManager.getReturnStatistics();
    const reasonsAnalysis = returnsManager.getReturnReasonsAnalysis();
    
    // تحليل اتجاهات شهرية
    const monthlyTrends = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthlyData = returnsManager.getMonthlyReturnsReport(date.getFullYear(), date.getMonth() + 1);
      return {
        month: date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
        returns: monthlyData.totalReturns,
        value: monthlyData.totalValue,
        processed: monthlyData.processedReturns
      };
    }).reverse();

    // تحليل أسباب الإرجاع
    const reasonsData = reasonsAnalysis.map((reason, index) => ({
      name: reason.reason === 'defective' ? 'منتج معيب' :
            reason.reason === 'wrong_item' ? 'منتج خطأ' :
            reason.reason === 'damaged' ? 'منتج تالف' :
            reason.reason === 'customer_change' ? 'تغيير رأي' :
            reason.reason === 'other' ? 'أخرى' : reason.reason,
      value: reason.count,
      percentage: reason.percentage,
      amount: reason.value,
      color: COLORS[index % COLORS.length]
    }));

    // تحليل أداء المنتجات
    const productReturns: { [key: string]: { count: number; value: number } } = {};
    returns.forEach(ret => {
      ret.items.forEach(item => {
        if (!productReturns[item.productName]) {
          productReturns[item.productName] = { count: 0, value: 0 };
        }
        productReturns[item.productName].count += item.quantity;
        productReturns[item.productName].value += item.total;
      });
    });

    const topReturnedProducts = Object.entries(productReturns)
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 5)
      .map(([name, data]) => ({ name, ...data }));

    return {
      stats,
      monthlyTrends,
      reasonsData,
      topReturnedProducts
    };
  }, []);

  const returnRate = analytics.stats.totalReturns > 0 ? 
    (analytics.stats.processedCount / analytics.stats.totalReturns * 100).toFixed(1) : '0';

  // وظائف المرشحات
  const applyFilters = () => {
    const returns = returnsManager.getReturns();
    let filtered = returns;

    // تطبيق البحث النصي
    if (filters.searchTerm) {
      filtered = filtered.filter(ret => 
        ret.returnNumber.includes(filters.searchTerm) ||
        ret.customerName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        ret.items.some(item => item.productName.toLowerCase().includes(filters.searchTerm.toLowerCase()))
      );
    }

    // تطبيق مرشح الحالة
    if (filters.status !== 'all') {
      filtered = filtered.filter(ret => ret.status === filters.status);
    }

    // تطبيق مرشح السبب
    if (filters.reason !== 'all') {
      filtered = filtered.filter(ret => 
        ret.items.some(item => item.reason === filters.reason)
      );
    }

    // تطبيق مرشح التاريخ
    if (filters.dateFrom) {
      filtered = filtered.filter(ret => new Date(ret.date) >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      filtered = filtered.filter(ret => new Date(ret.date) <= filters.dateTo!);
    }

    // تطبيق مرشح اسم العميل
    if (filters.customerName) {
      filtered = filtered.filter(ret => 
        ret.customerName.toLowerCase().includes(filters.customerName.toLowerCase())
      );
    }

    // تطبيق مرشح اسم المنتج
    if (filters.productName) {
      filtered = filtered.filter(ret => 
        ret.items.some(item => 
          item.productName.toLowerCase().includes(filters.productName.toLowerCase())
        )
      );
    }

    // تطبيق مرشح المبلغ
    if (filters.amountRange.min > 0 || filters.amountRange.max > 0) {
      filtered = filtered.filter(ret => {
        const amount = ret.totalAmount;
        const minCheck = filters.amountRange.min === 0 || amount >= filters.amountRange.min;
        const maxCheck = filters.amountRange.max === 0 || amount <= filters.amountRange.max;
        return minCheck && maxCheck;
      });
    }

    setFilteredReturns(filtered);
    toast.success(`تم العثور على ${filtered.length} نتيجة`);
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      status: 'all',
      reason: 'all',
      dateFrom: undefined,
      dateTo: undefined,
      customerName: '',
      productName: '',
      amountRange: { min: 0, max: 0 }
    });
    setFilteredReturns([]);
    toast.success("تم مسح جميع المرشحات");
  };

  // وظائف العمليات المجمعة
  const handleBatchProcess = async () => {
    if (selectedReturns.length === 0) {
      toast.error("يرجى تحديد المرتجعات المراد معالجتها");
      return;
    }

    setIsProcessing(true);
    try {
      // محاكاة معالجة المرتجعات
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSelectedReturns([]);
      toast.success(`تم معالجة ${selectedReturns.length} مرتجع بنجاح`);
    } catch (error) {
      toast.error("حدث خطأ أثناء المعالجة");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefreshData = () => {
    toast.success("تم تحديث البيانات");
  };

  // وظائف تصدير التقارير
  const handleExportPDF = async () => {
    try {
      // تنزيل تقرير PDF
      const reportContent = `
تقرير تحليل المرتجعات
التاريخ: ${new Date().toLocaleDateString('en-GB')}

معدل الإرجاع: ${returnRate}%
متوسط قيمة المرتجع: ${analytics.stats.averageReturnValue.toLocaleString()} ر.س
المرتجعات المعلقة: ${analytics.stats.pendingCount}
معدل المعالجة: ${analytics.stats.totalReturns > 0 ? ((analytics.stats.processedCount / analytics.stats.totalReturns) * 100).toFixed(1) : '0'}%

أسباب الإرجاع:
${analytics.reasonsData.map(reason => `${reason.name}: ${reason.value} (${reason.percentage.toFixed(1)}%)`).join('\n')}
      `;
      
      const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'تقرير-تحليل-المرتجعات.txt';
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success("تم تصدير التقرير بنجاح");
    } catch (error) {
      toast.error("فشل في تصدير التقرير");
    }
  };

  const handleExportExcel = async () => {
    try {
      // تنزيل تقرير CSV
      const csvContent = [
        ['نوع البيانات', 'القيمة'],
        ['معدل الإرجاع', `${returnRate}%`],
        ['متوسط قيمة المرتجع', `${analytics.stats.averageReturnValue.toLocaleString()} ر.س`],
        ['المرتجعات المعلقة', analytics.stats.pendingCount.toString()],
        ['معدل المعالجة', `${analytics.stats.totalReturns > 0 ? ((analytics.stats.processedCount / analytics.stats.totalReturns) * 100).toFixed(1) : '0'}%`],
        [],
        ['أسباب الإرجاع', ''],
        ...analytics.reasonsData.map(reason => [reason.name, reason.value.toString()])
      ].map(row => row.join(',')).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'تقرير-تحليل-المرتجعات.csv';
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success("تم تصدير التقرير بصيغة CSV");
    } catch (error) {
      toast.error("فشل في تصدير التقرير");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* شريط الأدوات والعمليات */}
      <Card className="animate-scale-in">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package2 className="h-5 w-5 text-primary" />
                نظام إدارة المرتجعات المتقدم
              </CardTitle>
              <CardDescription>
                نظام شامل لإدارة وتحليل ومراقبة عمليات الإرجاع بكفاءة عالية
              </CardDescription>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {/* تحديث البيانات */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshData}
                className="hover-scale"
              >
                <RefreshCcw className="h-4 w-4 mr-2" />
                تحديث
              </Button>
              
              {/* العمليات المجمعة */}
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBatchProcess}
                disabled={isProcessing || selectedReturns.length === 0}
                className="hover-scale"
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                {isProcessing ? "جاري المعالجة..." : `معالجة (${selectedReturns.length})`}
              </Button>
              
              {/* تصدير التقارير */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" size="sm" className="hover-scale">
                    <Download className="h-4 w-4 mr-2" />
                    تصدير التقرير
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="animate-scale-in">
                  <DropdownMenuItem onClick={handleExportPDF}>
                    <FileText className="h-4 w-4 mr-2" />
                    تصدير PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportExcel}>
                    <FileText className="h-4 w-4 mr-2" />
                    تصدير CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* نظام التبويبات المتقدم */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 h-auto p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <BarChart3 className="h-4 w-4 mr-2" />
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="comparative" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <TrendingUp className="h-4 w-4 mr-2" />
            تحليل مقارن
          </TabsTrigger>
          <TabsTrigger value="inventory" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Package2 className="h-4 w-4 mr-2" />
            تتبع المخزون
          </TabsTrigger>
          <TabsTrigger value="search" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Filter className="h-4 w-4 mr-2" />
            البحث المتقدم
          </TabsTrigger>
          <TabsTrigger value="alerts" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <AlertTriangle className="h-4 w-4 mr-2" />
            التنبيهات
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Bell className="h-4 w-4 mr-2" />
            الإشعارات
          </TabsTrigger>
        </TabsList>

        {/* التبويب الأول: نظرة عامة */}
        <TabsContent value="overview" className="space-y-6">
          {/* مؤشرات الأداء الرئيسية */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="hover-scale animate-fade-in transition-all duration-300 hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">معدل الإرجاع</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold animate-scale-in">{returnRate}%</div>
                <p className="text-xs text-muted-foreground">من إجمالي المبيعات</p>
              </CardContent>
            </Card>

            <Card className="hover-scale animate-fade-in transition-all duration-300 hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">متوسط قيمة المرتجع</CardTitle>
                <Package2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold animate-scale-in">
                  {analytics.stats.averageReturnValue.toLocaleString()} ر.س
                </div>
              </CardContent>
            </Card>

            <Card className="hover-scale animate-fade-in transition-all duration-300 hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">المرتجعات المعلقة</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-500 animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600 animate-scale-in">
                  {analytics.stats.pendingCount}
                </div>
                <p className="text-xs text-muted-foreground">تحتاج للمراجعة</p>
              </CardContent>
            </Card>

            <Card className="hover-scale animate-fade-in transition-all duration-300 hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">معدل المعالجة</CardTitle>
                <TrendingDown className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 animate-scale-in">
                  {analytics.stats.totalReturns > 0 ? 
                    ((analytics.stats.processedCount / analytics.stats.totalReturns) * 100).toFixed(1) : '0'}%
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* اتجاهات شهرية */}
            <Card className="hover-scale animate-fade-in transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary animate-pulse" />
                  الاتجاهات الشهرية
                </CardTitle>
                <CardDescription>تطور المرتجعات خلال الأشهر الماضية</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="animate-scale-in">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: any, name: string) => [
                          value,
                          name === 'returns' ? 'عدد المرتجعات' :
                          name === 'processed' ? 'تمت المعالجة' : 'القيمة'
                        ]}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="returns" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        name="returns"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="processed" 
                        stroke="#82ca9d" 
                        strokeWidth={2}
                        name="processed"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* توزيع أسباب الإرجاع */}
            <Card className="hover-scale animate-fade-in transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  أسباب الإرجاع
                </CardTitle>
                <CardDescription>توزيع المرتجعات حسب السبب</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-4">
                  <div className="animate-scale-in">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={analytics.reasonsData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {analytics.reasonsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => [value, 'عدد المرتجعات']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="space-y-2 animate-fade-in">
                    {analytics.reasonsData.map((reason, index) => (
                      <div key={index} className="flex items-center justify-between hover-scale transition-all duration-200 p-2 rounded-md hover:bg-muted/50">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full animate-scale-in" 
                            style={{ backgroundColor: reason.color }}
                          />
                          <span className="text-sm">{reason.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="animate-scale-in">{reason.value}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {reason.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* المنتجات الأكثر إرجاعاً */}
          <Card className="hover-scale animate-fade-in transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package2 className="h-5 w-5 text-destructive animate-pulse" />
                المنتجات الأكثر إرجاعاً
              </CardTitle>
              <CardDescription>المنتجات التي تحتاج لمراجعة الجودة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="animate-scale-in">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.topReturnedProducts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        value,
                        name === 'count' ? 'عدد المرتجعات' : 'القيمة'
                      ]}
                    />
                    <Bar dataKey="count" fill="#e74c3c" name="count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* التبويب الثاني: التحليل المقارن */}
        <TabsContent value="comparative" className="space-y-6">
          <ReturnsComparativeAnalytics />
        </TabsContent>

        {/* التبويب الثالث: تتبع المخزون */}
        <TabsContent value="inventory" className="space-y-6">
          <ReturnsInventoryTracker />
        </TabsContent>

        {/* التبويب الرابع: البحث المتقدم */}
        <TabsContent value="search" className="space-y-6">
          <ReturnsAdvancedFilters
            filters={filters}
            onFiltersChange={setFilters}
            onApplyFilters={applyFilters}
            onClearFilters={clearFilters}
            totalResults={filteredReturns.length}
            isLoading={isProcessing}
          />
          
          {/* عرض النتائج المفلترة */}
          {filteredReturns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>نتائج البحث ({filteredReturns.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {filteredReturns.map((returnItem) => (
                    <div key={returnItem.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{returnItem.returnNumber}</h4>
                          <p className="text-sm text-muted-foreground">
                            العميل: {returnItem.customerName} | 
                            المبلغ: {returnItem.totalAmount.toLocaleString()} ر.س |
                            التاريخ: {new Date(returnItem.date).toLocaleDateString('en-GB')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={
                            returnItem.status === 'processed' ? 'default' :
                            returnItem.status === 'pending' ? 'secondary' :
                            returnItem.status === 'rejected' ? 'destructive' : 'outline'
                          }>
                            {returnItem.status === 'processed' ? 'تمت المعالجة' :
                             returnItem.status === 'pending' ? 'معلق' :
                             returnItem.status === 'rejected' ? 'مرفوض' : returnItem.status}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedReturnForPrint(returnItem);
                              setShowPrintDialog(true);
                            }}
                          >
                            طباعة
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* التبويب الخامس: التنبيهات الذكية */}
        <TabsContent value="alerts" className="space-y-6">
          <ReturnsSmartAlerts />
        </TabsContent>

        {/* التبويب السادس: الإشعارات الذكية */}
        <TabsContent value="notifications" className="space-y-6">
          <ReturnsSmartNotifications />
        </TabsContent>
      </Tabs>

      {/* مدير الطباعة */}
      {selectedReturnForPrint && (
        <ReturnsPrintManager
          returnData={selectedReturnForPrint}
          isOpen={showPrintDialog}
          onClose={() => {
            setShowPrintDialog(false);
            setSelectedReturnForPrint(null);
          }}
        />
      )}
    </div>
  );
}