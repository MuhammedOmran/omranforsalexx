import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  BarChart3,
  PieChart,
  FileText,
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  ArrowUp,
  ArrowDown,
  Filter,
  Eye,
  Printer
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfDay, endOfDay } from 'date-fns';
import { reportsPluginManager } from '@/plugins/ReportsPlugin';
import ArabicExcelExporter from '@/utils/arabicExcelExporter';
import jsPDF from 'jspdf';

interface CashReportsProps {
  transactions: Array<{
    id: string;
    type: 'income' | 'expense';
    amount: number;
    description: string;
    category: string;
    date: Date;
    paymentMethod?: string;
  }>;
  currentBalance: number;
}

interface ReportPeriod {
  label: string;
  value: string;
  startDate: Date;
  endDate: Date;
}

export default function CashReports({ transactions, currentBalance }: CashReportsProps) {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState<string>('monthly');
  const [reportData, setReportData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeChart, setActiveChart] = useState<string>('overview');

  // فترات التقارير
  const reportPeriods: ReportPeriod[] = [
    {
      label: 'يومي',
      value: 'daily',
      startDate: startOfDay(new Date()),
      endDate: endOfDay(new Date())
    },
    {
      label: 'أسبوعي',
      value: 'weekly',
      startDate: subDays(new Date(), 7),
      endDate: new Date()
    },
    {
      label: 'شهري',
      value: 'monthly',
      startDate: startOfMonth(new Date()),
      endDate: endOfMonth(new Date())
    },
    {
      label: 'سنوي',
      value: 'yearly',
      startDate: startOfYear(new Date()),
      endDate: endOfYear(new Date())
    }
  ];

  // ألوان المخططات
  const chartColors = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8884d8', '#82ca9d', '#ffc658'];

  useEffect(() => {
    generateReportData();
  }, [selectedPeriod, transactions]);

  const generateReportData = () => {
    const period = reportPeriods.find(p => p.value === selectedPeriod);
    if (!period) return;

    const filteredTransactions = transactions.filter(t => 
      t.date >= period.startDate && t.date <= period.endDate
    );

    // إجمالي الإيرادات والمصروفات
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // التصنيف حسب الفئات
    const incomeByCategory = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const expensesByCategory = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    // البيانات اليومية للمخططات
    const dailyData = generateDailyData(filteredTransactions, period);

    // توقعات الشهر القادم (بسيطة)
    const projectedIncome = totalIncome * 1.1;
    const projectedExpenses = totalExpenses * 1.05;

    setReportData({
      period: period.label,
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      transactionCount: filteredTransactions.length,
      incomeByCategory,
      expensesByCategory,
      dailyData,
      projectedIncome,
      projectedExpenses,
      currentBalance,
      avgDailyIncome: totalIncome / Math.max(1, getDaysBetweenDates(period.startDate, period.endDate)),
      avgDailyExpenses: totalExpenses / Math.max(1, getDaysBetweenDates(period.startDate, period.endDate))
    });
  };

  const generateDailyData = (transactions: any[], period: ReportPeriod) => {
    const days = getDaysBetweenDates(period.startDate, period.endDate);
    const dailyData = [];
    
    for (let i = 0; i <= days; i++) {
      const currentDate = new Date(period.startDate);
      currentDate.setDate(currentDate.getDate() + i);
      
      const dayTransactions = transactions.filter(t => 
        format(t.date, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd')
      );
      
      const income = dayTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expenses = dayTransactions
        .filter(t => t.type === 'expense')  
        .reduce((sum, t) => sum + t.amount, 0);
      
      dailyData.push({
        date: format(currentDate, 'dd/MM'),
        income,
        expenses,
        net: income - expenses
      });
    }
    
    return dailyData;
  };

  const getDaysBetweenDates = (start: Date, end: Date) => {
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  // تحويل بيانات الفئات للمخططات الدائرية
  const getIncomePieData = () => {
    if (!reportData?.incomeByCategory) return [];
    return Object.entries(reportData.incomeByCategory).map(([category, amount]) => ({
      name: getCategoryDisplayName(category),
      value: amount as number,
      category
    }));
  };

  const getExpensesPieData = () => {
    if (!reportData?.expensesByCategory) return [];
    return Object.entries(reportData.expensesByCategory).map(([category, amount]) => ({
      name: getCategoryDisplayName(category),
      value: amount as number,
      category
    }));
  };

  const getCategoryDisplayName = (category: string) => {
    const displayNames: { [key: string]: string } = {
      'sales': 'مبيعات',
      'services': 'خدمات',
      'deposit': 'إيداع',
      'other_income': 'دخل آخر',
      'operational': 'مصاريف تشغيلية',
      'expenses': 'مصروف',
      'withdrawal': 'سحب',
      'rent': 'إيجار',
      'utilities': 'فواتير',
      'supplies': 'مواد',
      'other_expense': 'مصروف آخر'
    };
    return displayNames[category] || category;
  };

  // تصدير Excel
  const exportToExcel = async () => {
    if (!reportData) return;
    
    setIsGenerating(true);
    try {
      const exporter = new ArabicExcelExporter();
      const fileName = `تقرير_الصندوق_${selectedPeriod}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      
      exporter.addWorksheet('التقرير المالي');
      
      let currentRow = exporter.addTitle('التقرير المالي', 'تقرير الصندوق المفصل', 0);
      
      currentRow = exporter.addReportInfo('التقرير المالي', 
        format(new Date(), 'dd/MM/yyyy'),
        reportData.period,
        currentRow
      );
      
      // الملخص المالي
      currentRow = exporter.addSection('التقرير المالي', 'الملخص المالي', currentRow);
      currentRow = exporter.addKeyValueData('التقرير المالي', {
        'إجمالي الإيرادات': `${reportData.totalIncome.toLocaleString()} ج.م`,
        'إجمالي المصروفات': `${reportData.totalExpenses.toLocaleString()} ج.م`,
        'صافي الربح': `${reportData.netProfit.toLocaleString()} ج.م`,
        'الرصيد الحالي': `${reportData.currentBalance.toLocaleString()} ج.م`,
        'عدد المعاملات': reportData.transactionCount.toString(),
        'متوسط الإيرادات اليومية': `${reportData.avgDailyIncome.toLocaleString()} ج.م`,
        'متوسط المصروفات اليومية': `${reportData.avgDailyExpenses.toLocaleString()} ج.م`
      }, currentRow);
      
      // تفصيل الإيرادات حسب الفئة
      if (Object.keys(reportData.incomeByCategory).length > 0) {
        currentRow = exporter.addSection('التقرير المالي', 'تفصيل الإيرادات حسب الفئة', currentRow);
        const incomeHeaders = ['الفئة', 'المبلغ (ج.م)', 'النسبة (%)'];
        const incomeRows = Object.entries(reportData.incomeByCategory).map(([category, amount]) => [
          getCategoryDisplayName(category),
          (amount as number).toLocaleString(),
          `${((amount as number / reportData.totalIncome) * 100).toFixed(1)}%`
        ]);
        currentRow = exporter.addTable('التقرير المالي', incomeHeaders, incomeRows, currentRow);
      }
      
      // تفصيل المصروفات حسب الفئة
      if (Object.keys(reportData.expensesByCategory).length > 0) {
        currentRow = exporter.addSection('التقرير المالي', 'تفصيل المصروفات حسب الفئة', currentRow);
        const expenseHeaders = ['الفئة', 'المبلغ (ج.م)', 'النسبة (%)'];
        const expenseRows = Object.entries(reportData.expensesByCategory).map(([category, amount]) => [
          getCategoryDisplayName(category),
          (amount as number).toLocaleString(),
          `${((amount as number / reportData.totalExpenses) * 100).toFixed(1)}%`
        ]);
        currentRow = exporter.addTable('التقرير المالي', expenseHeaders, expenseRows, currentRow);
      }
      
      // البيانات اليومية
      if (reportData.dailyData.length > 0) {
        currentRow = exporter.addSection('التقرير المالي', 'البيانات اليومية', currentRow);
        const dailyHeaders = ['التاريخ', 'الإيرادات (ج.م)', 'المصروفات (ج.م)', 'صافي التدفق (ج.م)'];
        const dailyRows = reportData.dailyData.map((day: any) => [
          day.date,
          day.income.toLocaleString(),
          day.expenses.toLocaleString(),
          day.net.toLocaleString()
        ]);
        currentRow = exporter.addTable('التقرير المالي', dailyHeaders, dailyRows, currentRow);
      }
      
      // التوصيات
      const recommendations = generateRecommendations();
      if (recommendations.length > 0) {
        exporter.addRecommendations('التقرير المالي', recommendations, currentRow);
      }
      
      exporter.save(fileName);
      
      toast({
        title: "تم التصدير بنجاح",
        description: `تم حفظ التقرير في ملف: ${fileName}`,
      });
    } catch (error) {
      console.error('خطأ في التصدير:', error);
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير التقرير",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // تصدير PDF
  const exportToPDF = async () => {
    if (!reportData) return;
    
    setIsGenerating(true);
    try {
      // إنشاء مستند PDF مع دعم العربية بطريقة محدودة
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // إعداد الخط (نستخدم خط افتراضي للنص الإنجليزي والأرقام)
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      
      // العنوان
      pdf.text('Cash Register Financial Report', 20, 20);
      pdf.setFontSize(12);
      pdf.text(`Period: ${reportData.period}`, 20, 30);
      pdf.text(`Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, 40);
      
      // الملخص المالي
      let yPosition = 60;
      pdf.setFontSize(14);
      pdf.text('Financial Summary', 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(10);
      pdf.text(`Total Income: ${reportData.totalIncome.toLocaleString()} EGP`, 20, yPosition);
      yPosition += 7;
      pdf.text(`Total Expenses: ${reportData.totalExpenses.toLocaleString()} EGP`, 20, yPosition);
      yPosition += 7;
      pdf.text(`Net Profit: ${reportData.netProfit.toLocaleString()} EGP`, 20, yPosition);
      yPosition += 7;
      pdf.text(`Current Balance: ${reportData.currentBalance.toLocaleString()} EGP`, 20, yPosition);
      yPosition += 7;
      pdf.text(`Transaction Count: ${reportData.transactionCount}`, 20, yPosition);
      yPosition += 15;
      
      // تفاصيل الإيرادات
      if (Object.keys(reportData.incomeByCategory).length > 0) {
        pdf.setFontSize(12);
        pdf.text('Income by Category', 20, yPosition);
        yPosition += 10;
        
        Object.entries(reportData.incomeByCategory).forEach(([category, amount]) => {
          const percentage = ((amount as number / reportData.totalIncome) * 100).toFixed(1);
          pdf.setFontSize(9);
          pdf.text(`${getCategoryDisplayName(category)}: ${(amount as number).toLocaleString()} EGP (${percentage}%)`, 25, yPosition);
          yPosition += 6;
          
          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }
        });
        yPosition += 10;
      }
      
      const fileName = `cash_report_${selectedPeriod}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      pdf.save(fileName);
      
      toast({
        title: "تم التصدير بنجاح", 
        description: `تم حفظ التقرير في ملف: ${fileName}`,
      });
    } catch (error) {
      console.error('خطأ في تصدير PDF:', error);
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير ملف PDF",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // إنشاء التوصيات
  const generateRecommendations = () => {
    if (!reportData) return [];
    
    const recommendations = [];
    
    if (reportData.netProfit < 0) {
      recommendations.push('المصروفات تتجاوز الإيرادات - يُنصح بمراجعة المصروفات والتحكم فيها');
    }
    
    if (reportData.avgDailyExpenses > reportData.avgDailyIncome * 0.8) {
      recommendations.push('نسبة المصروفات عالية - يُنصح بتحسين الكفاءة التشغيلية');
    }
    
    if (reportData.currentBalance < reportData.avgDailyExpenses * 7) {
      recommendations.push('الرصيد منخفض - يُنصح بزيادة السيولة النقدية');
    }
    
    if (reportData.transactionCount < 10) {
      recommendations.push('عدد المعاملات قليل - يُنصح بزيادة النشاط التجاري');
    }
    
    return recommendations;
  };

  if (!reportData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">جاري تحضير التقرير...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* رأس التقرير */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-2xl font-bold">التقارير المالية</h2>
          <p className="text-muted-foreground">تقارير مفصلة لحركة الصندوق مع إمكانية التصدير</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {reportPeriods.map(period => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            onClick={exportToExcel}
            disabled={isGenerating}
            variant="outline"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          
          <Button 
            onClick={exportToPDF}
            disabled={isGenerating}
            variant="outline"
            size="sm"
          >
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* بطاقات الملخص */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
                <p className="text-2xl font-bold text-green-600">
                  {reportData.totalIncome.toLocaleString()} ج.م
                </p>
              </div>
              <ArrowUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المصروفات</p>
                <p className="text-2xl font-bold text-red-600">
                  {reportData.totalExpenses.toLocaleString()} ج.م
                </p>
              </div>
              <ArrowDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">صافي الربح</p>
                <p className={`text-2xl font-bold ${reportData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {reportData.netProfit.toLocaleString()} ج.م
                </p>
              </div>
              <TrendingUp className={`h-8 w-8 ${reportData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">عدد المعاملات</p>
                <p className="text-2xl font-bold">
                  {reportData.transactionCount}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* المخططات */}
      <Tabs value={activeChart} onValueChange={setActiveChart}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="income">الإيرادات</TabsTrigger>
          <TabsTrigger value="expenses">المصروفات</TabsTrigger>
          <TabsTrigger value="trends">الاتجاهات</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>التدفق النقدي اليومي</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={reportData.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      `${value.toLocaleString()} ج.م`,
                      name === 'income' ? 'الإيرادات' : 
                      name === 'expenses' ? 'المصروفات' : 'صافي التدفق'
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="income" 
                    stackId="1" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expenses" 
                    stackId="2" 
                    stroke="#ef4444" 
                    fill="#ef4444" 
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="income" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>توزيع الإيرادات حسب الفئة</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPieChart>
                    <Pie
                      data={getIncomePieData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {getIncomePieData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [`${value.toLocaleString()} ج.م`, 'المبلغ']} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>تفاصيل الإيرادات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(reportData.incomeByCategory).map(([category, amount], index) => (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: chartColors[index % chartColors.length] }}
                        />
                        <span className="text-sm">{getCategoryDisplayName(category)}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{(amount as number).toLocaleString()} ج.م</div>
                        <div className="text-xs text-muted-foreground">
                          {((amount as number / reportData.totalIncome) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>توزيع المصروفات حسب الفئة</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPieChart>
                    <Pie
                      data={getExpensesPieData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {getExpensesPieData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [`${value.toLocaleString()} ج.م`, 'المبلغ']} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>تفاصيل المصروفات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(reportData.expensesByCategory).map(([category, amount], index) => (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: chartColors[index % chartColors.length] }}
                        />
                        <span className="text-sm">{getCategoryDisplayName(category)}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{(amount as number).toLocaleString()} ج.م</div>
                        <div className="text-xs text-muted-foreground">
                          {((amount as number / reportData.totalExpenses) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>مقارنة الإيرادات والمصروفات</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      `${value.toLocaleString()} ج.م`,
                      name === 'income' ? 'الإيرادات' : 'المصروفات'
                    ]}
                  />
                  <Bar dataKey="income" fill="hsl(var(--primary))" name="الإيرادات" />
                  <Bar dataKey="expenses" fill="#ef4444" name="المصروفات" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* التوصيات */}
      {generateRecommendations().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>التوصيات والملاحظات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {generateRecommendations().map((recommendation, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                  <Badge variant="secondary" className="text-xs mt-0.5">{index + 1}</Badge>
                  <p className="text-sm flex-1">{recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}