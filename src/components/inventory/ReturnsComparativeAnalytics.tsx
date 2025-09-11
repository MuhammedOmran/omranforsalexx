import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  ComposedChart,
  Area,
  AreaChart
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  BarChart3,
  Target,
  Award,
  AlertTriangle
} from "lucide-react";
import { returnsManager } from "@/utils/returnsManager";

export function ReturnsComparativeAnalytics() {
  const analytics = useMemo(() => {
    const returns = returnsManager.getReturns();
    
    // مقارنة شهرية للعام الحالي مع العام السابق
    const monthlyComparison = Array.from({ length: 12 }, (_, monthIndex) => {
      const currentYear = new Date().getFullYear();
      const previousYear = currentYear - 1;
      
      // الشهر الحالي
      const currentYearData = returns.filter(ret => {
        const date = new Date(ret.createdAt);
        return date.getFullYear() === currentYear && date.getMonth() === monthIndex;
      });
      
      // نفس الشهر من العام السابق
      const previousYearData = returns.filter(ret => {
        const date = new Date(ret.createdAt);
        return date.getFullYear() === previousYear && date.getMonth() === monthIndex;
      });
      
      const monthName = new Date(currentYear, monthIndex, 1).toLocaleDateString('en-GB', { month: 'short' });
      
      return {
        month: monthName,
        currentYear: currentYearData.length,
        previousYear: previousYearData.length,
        currentValue: currentYearData.reduce((sum, ret) => sum + ret.totalAmount, 0),
        previousValue: previousYearData.reduce((sum, ret) => sum + ret.totalAmount, 0),
        improvement: currentYearData.length <= previousYearData.length
      };
    });

    // تحليل الاتجاهات الفصلية
    const quarterlyTrends = [
      { quarter: 'Q1', months: [0, 1, 2] },
      { quarter: 'Q2', months: [3, 4, 5] },
      { quarter: 'Q3', months: [6, 7, 8] },
      { quarter: 'Q4', months: [9, 10, 11] }
    ].map(q => {
      const currentYearData = returns.filter(ret => {
        const date = new Date(ret.createdAt);
        return date.getFullYear() === new Date().getFullYear() && 
               q.months.includes(date.getMonth());
      });
      
      const previousYearData = returns.filter(ret => {
        const date = new Date(ret.createdAt);
        return date.getFullYear() === new Date().getFullYear() - 1 && 
               q.months.includes(date.getMonth());
      });
      
      return {
        quarter: q.quarter,
        current: currentYearData.length,
        previous: previousYearData.length,
        growth: previousYearData.length > 0 ? 
          ((currentYearData.length - previousYearData.length) / previousYearData.length * 100) : 0
      };
    });

    // تحليل جودة المنتجات عبر الوقت
    const productQualityTrends = (() => {
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        return date;
      }).reverse();

      return last6Months.map(month => {
        const monthReturns = returns.filter(ret => {
          const returnDate = new Date(ret.createdAt);
          return returnDate.getMonth() === month.getMonth() && 
                 returnDate.getFullYear() === month.getFullYear();
        });

        const defectiveReturns = monthReturns.filter(ret => 
          ret.items.some(item => item.reason === 'defective')
        );

        const damagedReturns = monthReturns.filter(ret => 
          ret.items.some(item => item.reason === 'damaged')
        );

        return {
          month: month.toLocaleDateString('en-GB', { month: 'short' }),
          total: monthReturns.length,
          defective: defectiveReturns.length,
          damaged: damagedReturns.length,
          qualityRate: monthReturns.length > 0 ? 
            ((defectiveReturns.length + damagedReturns.length) / monthReturns.length * 100) : 0
        };
      });
    })();

    // مؤشرات الأداء الرئيسية
    const currentMonthReturns = returns.filter(ret => {
      const date = new Date(ret.createdAt);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });

    const previousMonthReturns = returns.filter(ret => {
      const date = new Date(ret.createdAt);
      const previousMonth = new Date();
      previousMonth.setMonth(previousMonth.getMonth() - 1);
      return date.getMonth() === previousMonth.getMonth() && date.getFullYear() === previousMonth.getFullYear();
    });

    const monthlyGrowth = previousMonthReturns.length > 0 ? 
      ((currentMonthReturns.length - previousMonthReturns.length) / previousMonthReturns.length * 100) : 0;

    return {
      monthlyComparison,
      quarterlyTrends,
      productQualityTrends,
      kpis: {
        monthlyGrowth,
        currentMonthReturns: currentMonthReturns.length,
        previousMonthReturns: previousMonthReturns.length,
        averageProcessingTime: 2.5, // متوسط وهمي
        customerSatisfaction: 85 // درجة وهمية
      }
    };
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* مؤشرات الأداء المقارنة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover-scale animate-fade-in transition-all duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">النمو الشهري</CardTitle>
            {analytics.kpis.monthlyGrowth >= 0 ? (
              <TrendingUp className="h-4 w-4 text-red-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold animate-scale-in ${
              analytics.kpis.monthlyGrowth >= 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              {analytics.kpis.monthlyGrowth >= 0 ? '+' : ''}{analytics.kpis.monthlyGrowth.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              مقارنة بالشهر السابق ({analytics.kpis.previousMonthReturns} → {analytics.kpis.currentMonthReturns})
            </p>
          </CardContent>
        </Card>

        <Card className="hover-scale animate-fade-in transition-all duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط وقت المعالجة</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold animate-scale-in text-blue-600">
              {analytics.kpis.averageProcessingTime} يوم
            </div>
            <p className="text-xs text-muted-foreground">
              تحسن بنسبة 15% من الشهر السابق
            </p>
          </CardContent>
        </Card>

        <Card className="hover-scale animate-fade-in transition-all duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">رضا العملاء</CardTitle>
            <Award className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold animate-scale-in text-green-600">
              {analytics.kpis.customerSatisfaction}%
            </div>
            <p className="text-xs text-muted-foreground">
              بناءً على تقييمات المرتجعات المعالجة
            </p>
          </CardContent>
        </Card>

        <Card className="hover-scale animate-fade-in transition-all duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل التحسن</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold animate-scale-in text-purple-600">
              {analytics.quarterlyTrends.reduce((sum, q) => sum + (q.growth < 0 ? 1 : 0), 0)}/4
            </div>
            <p className="text-xs text-muted-foreground">
              أرباع السنة بتحسن في المرتجعات
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="monthly" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="monthly">المقارنة الشهرية</TabsTrigger>
          <TabsTrigger value="quarterly">الاتجاهات الفصلية</TabsTrigger>
          <TabsTrigger value="quality">اتجاهات الجودة</TabsTrigger>
        </TabsList>

        {/* المقارنة الشهرية */}
        <TabsContent value="monthly" className="space-y-4">
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                المقارنة الشهرية - العام الحالي مقابل السابق
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="animate-scale-in">
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={analytics.monthlyComparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        value,
                        name === 'currentYear' ? 'العام الحالي' :
                        name === 'previousYear' ? 'العام السابق' : name
                      ]}
                    />
                    <Bar dataKey="previousYear" fill="#94a3b8" name="previousYear" />
                    <Bar dataKey="currentYear" fill="#3b82f6" name="currentYear" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                {analytics.monthlyComparison.slice(-3).map((month, index) => (
                  <div key={index} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{month.month}</h4>
                      {month.improvement ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-700">تحسن</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-red-100 text-red-700">تراجع</Badge>
                      )}
                    </div>
                    <div className="space-y-1 text-sm">
                      <p>الحالي: {month.currentYear} مرتجع</p>
                      <p>السابق: {month.previousYear} مرتجع</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* الاتجاهات الفصلية */}
        <TabsContent value="quarterly" className="space-y-4">
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                الاتجاهات الفصلية ومعدلات النمو
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="animate-scale-in">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.quarterlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="quarter" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        value,
                        name === 'current' ? 'العام الحالي' :
                        name === 'previous' ? 'العام السابق' : 'معدل النمو %'
                      ]}
                    />
                    <Bar dataKey="current" fill="#3b82f6" name="current" />
                    <Bar dataKey="previous" fill="#94a3b8" name="previous" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                {analytics.quarterlyTrends.map((quarter) => (
                  <div key={quarter.quarter} className="p-4 bg-muted/50 rounded-lg text-center">
                    <h4 className="font-medium mb-2">{quarter.quarter}</h4>
                    <div className={`text-lg font-bold ${
                      quarter.growth < 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {quarter.growth >= 0 ? '+' : ''}{quarter.growth.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">معدل النمو</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* اتجاهات الجودة */}
        <TabsContent value="quality" className="space-y-4">
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                تحليل اتجاهات الجودة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="animate-scale-in">
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={analytics.productQualityTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        value,
                        name === 'total' ? 'إجمالي المرتجعات' :
                        name === 'defective' ? 'منتجات معيبة' :
                        name === 'damaged' ? 'منتجات تالفة' : 'معدل مشاكل الجودة %'
                      ]}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      stackId="1"
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.3}
                      name="total"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="defective" 
                      stackId="2"
                      stroke="#ef4444" 
                      fill="#ef4444" 
                      fillOpacity={0.6}
                      name="defective"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="damaged" 
                      stackId="2"
                      stroke="#f97316" 
                      fill="#f97316" 
                      fillOpacity={0.6}
                      name="damaged"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6">
                <h4 className="font-medium mb-4">ملخص اتجاهات الجودة</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="font-medium">المنتجات المعيبة</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      متوسط {(analytics.productQualityTrends.reduce((sum, m) => sum + m.defective, 0) / analytics.productQualityTrends.length).toFixed(1)} مرتجع شهرياً
                    </p>
                  </div>
                  
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="font-medium">المنتجات التالفة</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      متوسط {(analytics.productQualityTrends.reduce((sum, m) => sum + m.damaged, 0) / analytics.productQualityTrends.length).toFixed(1)} مرتجع شهرياً
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}