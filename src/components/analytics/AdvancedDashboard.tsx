import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart, ReferenceLine, Scatter, ScatterChart
} from 'recharts';
import {
  TrendingUp, TrendingDown, AlertTriangle, Eye, Brain, Target,
  BarChart3, PieChart as PieChartIcon, Activity, Zap, Users, Package,
  DollarSign, Calendar, Lightbulb, Star, ArrowUp, ArrowDown
} from 'lucide-react';
import { advancedAnalytics, PredictiveAnalytics, AdvancedMetrics } from '@/utils/advancedAnalytics';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function AdvancedDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [predictiveData, setPredictiveData] = useState<PredictiveAnalytics | null>(null);
  const [metricsData, setMetricsData] = useState<AdvancedMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true);
      try {
        const predictions = advancedAnalytics.generatePredictiveAnalytics();
        const metrics = advancedAnalytics.generateAdvancedMetrics();
        
        setPredictiveData(predictions);
        setMetricsData(metrics);
      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحليل البيانات...</p>
        </div>
      </div>
    );
  }

  if (!predictiveData || !metricsData) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          لا تتوفر بيانات كافية لإجراء التحليلات المتقدمة. يرجى إضافة المزيد من البيانات أولاً.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">لوحة التحليلات المتقدمة</h1>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <Eye className="h-3 w-3 mr-1" />
            رؤى ذكية
          </Badge>
          <Badge variant="outline" className="text-xs">
            <Brain className="h-3 w-3 mr-1" />
            تنبؤات AI
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="predictive">التنبؤات</TabsTrigger>
          <TabsTrigger value="insights">الرؤى</TabsTrigger>
          <TabsTrigger value="performance">الأداء</TabsTrigger>
          <TabsTrigger value="recommendations">التوصيات</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <OverviewTab metricsData={metricsData} predictiveData={predictiveData} />
        </TabsContent>

        <TabsContent value="predictive" className="space-y-6">
          <PredictiveTab predictiveData={predictiveData} />
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <InsightsTab metricsData={metricsData} predictiveData={predictiveData} />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <PerformanceTab metricsData={metricsData} />
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <RecommendationsTab predictiveData={predictiveData} metricsData={metricsData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OverviewTab({ metricsData, predictiveData }: { metricsData: AdvancedMetrics, predictiveData: PredictiveAnalytics }) {
  return (
    <>
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">نمو المبيعات</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metricsData.kpis.salesGrowthRate > 0 ? '+' : ''}{metricsData.kpis.salesGrowthRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">مقارنة بالشهر السابق</p>
            <Progress value={Math.abs(metricsData.kpis.salesGrowthRate)} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">احتفاظ بالعملاء</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {metricsData.kpis.customerRetentionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">معدل الاحتفاظ الشهري</p>
            <Progress value={metricsData.kpis.customerRetentionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">دوران المخزون</CardTitle>
            <Package className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {metricsData.kpis.inventoryTurnover.toFixed(1)}x
            </div>
            <p className="text-xs text-muted-foreground">مرات في السنة</p>
            <Progress value={Math.min(100, metricsData.kpis.inventoryTurnover * 10)} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الكفاءة التشغيلية</CardTitle>
            <Zap className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {metricsData.kpis.operationalEfficiency.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">كفاءة العمليات</p>
            <Progress value={metricsData.kpis.operationalEfficiency} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تقييم الأداء</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {metricsData.benchmarks.performanceRating === 'excellent' ? 'ممتاز' :
               metricsData.benchmarks.performanceRating === 'good' ? 'جيد' :
               metricsData.benchmarks.performanceRating === 'average' ? 'متوسط' : 'ضعيف'}
            </div>
            <p className="text-xs text-muted-foreground">مقارنة بالمعايير</p>
            <div className="flex items-center mt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < (metricsData.benchmarks.performanceRating === 'excellent' ? 5 :
                         metricsData.benchmarks.performanceRating === 'good' ? 4 :
                         metricsData.benchmarks.performanceRating === 'average' ? 3 : 2)
                      ? 'text-yellow-400 fill-current' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Insights */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-500" />
              رؤى سريعة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">توقع نمو المبيعات</p>
                <p className="text-xs text-muted-foreground">
                  المبيعات المتوقعة للشهر القادم: {predictiveData.salesForecast.nextMonthPrediction.toLocaleString()} ج.م
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">تنبيهات المخزون</p>
                <p className="text-xs text-muted-foreground">
                  {predictiveData.inventoryPrediction.lowStockAlerts.length} منتج يحتاج إعادة طلب
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <Users className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">تحليل العملاء</p>
                <p className="text-xs text-muted-foreground">
                  {predictiveData.customerInsights.churnRisk.length} عميل معرض لخطر المغادرة
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>اتجاه المبيعات مع التنبؤ</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={[...metricsData.trends.salesTrend, {
                period: 'متوقع',
                value: predictiveData.salesForecast.nextMonthPrediction,
                change: 0,
                changePercent: 0,
                predicted: true
              }]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    `${(value || 0).toLocaleString()} ج.م`, 
                    name === 'value' ? 'المبيعات' : 'متوقع'
                  ]} 
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ fill: '#8884d8' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke="#ff7300" 
                  strokeDasharray="5 5"
                  dot={{ fill: '#ff7300' }}
                />
                <ReferenceLine x="متوقع" stroke="red" strokeDasharray="3 3" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function PredictiveTab({ predictiveData }: { predictiveData: PredictiveAnalytics }) {
  return (
    <>
      {/* Sales Forecast */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              توقعات المبيعات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {predictiveData.salesForecast.nextMonthPrediction.toLocaleString()} ج.م
                </div>
                <p className="text-sm text-muted-foreground">توقع المبيعات للشهر القادم</p>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm">مستوى الثقة:</span>
                <div className="flex items-center gap-2">
                  <Progress value={predictiveData.salesForecast.confidence} className="w-20" />
                  <span className="text-sm font-medium">{predictiveData.salesForecast.confidence.toFixed(0)}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm">الاتجاه:</span>
                <Badge variant={
                  predictiveData.salesForecast.trend === 'increasing' ? 'default' :
                  predictiveData.salesForecast.trend === 'decreasing' ? 'destructive' : 'secondary'
                }>
                  {predictiveData.salesForecast.trend === 'increasing' && (
                    <>
                      <ArrowUp className="h-3 w-3 mr-1" />
                      متزايد
                    </>
                  )}
                  {predictiveData.salesForecast.trend === 'decreasing' && (
                    <>
                      <ArrowDown className="h-3 w-3 mr-1" />
                      متناقص
                    </>
                  )}
                  {predictiveData.salesForecast.trend === 'stable' && 'مستقر'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>النمط الموسمي</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={predictiveData.salesForecast.seasonalPattern}>
                <PolarGrid />
                <PolarAngleAxis dataKey="month" />
                <PolarRadiusAxis />
                <Radar 
                  name="المتوسط" 
                  dataKey="average" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.3} 
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Predictions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>تنبيهات المخزون المنخفض</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {predictiveData.inventoryPrediction.lowStockAlerts.slice(0, 5).map((alert, index) => (
                <div key={alert.productId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{alert.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      المخزون الحالي: {alert.currentStock} | متبقي: {alert.daysUntilEmpty} يوم
                    </p>
                  </div>
                  <Badge variant={alert.daysUntilEmpty < 7 ? 'destructive' : 'secondary'}>
                    اطلب {alert.suggestedReorder}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>المنتجات سريعة الحركة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {predictiveData.inventoryPrediction.fastMovingItems.slice(0, 5).map((item, index) => (
                <div key={item.productId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      سرعة الحركة: {item.velocity.toFixed(2)}/يوم
                    </p>
                  </div>
                  <Badge variant="default">
                    {item.turnoverRate.toFixed(1)}x/سنة
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Projections */}
      <Card>
        <CardHeader>
          <CardTitle>التوقعات المالية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <DollarSign className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">
                {predictiveData.financialProjections.profitProjection.toLocaleString()} ج.م
              </div>
              <p className="text-sm text-muted-foreground">توقع الربح الشهري</p>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">
                {predictiveData.financialProjections.breakEvenAnalysis.breakEvenPoint.toLocaleString()} ج.م
              </div>
              <p className="text-sm text-muted-foreground">نقطة التعادل</p>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Activity className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">
                {predictiveData.financialProjections.breakEvenAnalysis.marginOfSafety.toFixed(1)}%
              </div>
              <p className="text-sm text-muted-foreground">هامش الأمان</p>
            </div>
          </div>
          
          <div className="mt-6">
            <h4 className="font-medium mb-4">توقع التدفق النقدي</h4>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={predictiveData.financialProjections.cashFlowForecast}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip formatter={(value) => [`${(value || 0).toLocaleString()} ج.م`, 'التدفق المتوقع']} />
                <Area 
                  type="monotone" 
                  dataKey="projected" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.3} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function InsightsTab({ metricsData, predictiveData }: { metricsData: AdvancedMetrics, predictiveData: PredictiveAnalytics }) {
  return (
    <>
      {/* Customer Insights */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>تقسيم العملاء</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={predictiveData.customerInsights.segmentation}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {predictiveData.customerInsights.segmentation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name, props) => [
                  `${value} عميل`,
                  props.payload.segment
                ]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {predictiveData.customerInsights.segmentation.map((segment, index) => (
                <div key={segment.segment} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span>{segment.segment}</span>
                  </div>
                  <span className="font-medium">{segment.count} عميل</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>العملاء المعرضون لخطر المغادرة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {predictiveData.customerInsights.churnRisk.slice(0, 5).map((customer) => (
                <div key={customer.customerId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{customer.customerName}</p>
                    <p className="text-xs text-muted-foreground">
                      آخر شراء: {customer.lastPurchase}
                    </p>
                  </div>
                  <Badge variant={customer.riskScore > 75 ? 'destructive' : 'secondary'}>
                    {customer.riskScore}% خطر
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trends Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>تحليل الاتجاهات</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sales">
            <TabsList>
              <TabsTrigger value="sales">المبيعات</TabsTrigger>
              <TabsTrigger value="profit">الربح</TabsTrigger>
              <TabsTrigger value="customers">العملاء</TabsTrigger>
            </TabsList>
            
            <TabsContent value="sales">
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={metricsData.trends.salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="value" fill="#8884d8" name="المبيعات" />
                  <Line yAxisId="right" type="monotone" dataKey="changePercent" stroke="#ff7300" name="نسبة التغيير %" />
                </ComposedChart>
              </ResponsiveContainer>
            </TabsContent>
            
            <TabsContent value="profit">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={metricsData.trends.profitTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${(value || 0).toLocaleString()} ج.م`, 'الربح']} />
                  <Area type="monotone" dataKey="value" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </TabsContent>
            
            <TabsContent value="customers">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metricsData.trends.customerTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="newCustomers" fill="#8884d8" name="عملاء جدد" />
                  <Bar dataKey="returningCustomers" fill="#82ca9d" name="عملاء عائدون" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}

function PerformanceTab({ metricsData }: { metricsData: AdvancedMetrics }) {
  const performanceData = [
    { name: 'نمو المبيعات', value: metricsData.kpis.salesGrowthRate, max: 50 },
    { name: 'احتفاظ بالعملاء', value: metricsData.kpis.customerRetentionRate, max: 100 },
    { name: 'دوران المخزون', value: metricsData.kpis.inventoryTurnover * 10, max: 50 },
    { name: 'هامش الربح', value: metricsData.kpis.grossMarginTrend, max: 50 },
    { name: 'الكفاءة التشغيلية', value: metricsData.kpis.operationalEfficiency, max: 100 }
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>مؤشرات الأداء الرئيسية</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={performanceData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" />
              <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} />
              <Radar
                name="الأداء الحالي"
                dataKey="value"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.4}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>التقييم مقابل المعايير</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">متوسط الصناعة</span>
                <span className="font-medium">{metricsData.benchmarks.industryAverage}%</span>
              </div>
              <Progress value={metricsData.benchmarks.industryAverage} className="h-2" />
              
              <div className="flex justify-between items-center">
                <span className="text-sm">أداءك</span>
                <span className="font-medium">{metricsData.kpis.operationalEfficiency.toFixed(0)}%</span>
              </div>
              <Progress value={metricsData.kpis.operationalEfficiency} className="h-2" />
              
              <Badge variant={
                metricsData.benchmarks.performanceRating === 'excellent' ? 'default' :
                metricsData.benchmarks.performanceRating === 'good' ? 'secondary' :
                metricsData.benchmarks.performanceRating === 'average' ? 'outline' : 'destructive'
              }>
                تقييم: {
                  metricsData.benchmarks.performanceRating === 'excellent' ? 'ممتاز' :
                  metricsData.benchmarks.performanceRating === 'good' ? 'جيد' :
                  metricsData.benchmarks.performanceRating === 'average' ? 'متوسط' : 'ضعيف'
                }
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>مناطق التحسين</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metricsData.benchmarks.improvementAreas.length > 0 ? (
                metricsData.benchmarks.improvementAreas.map((area, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">{area}</span>
                  </div>
                ))
              ) : (
                <div className="text-center p-4 text-green-600">
                  <Star className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">أداء ممتاز! لا توجد مناطق تحتاج تحسين فوري</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function RecommendationsTab({ predictiveData, metricsData }: { predictiveData: PredictiveAnalytics, metricsData: AdvancedMetrics }) {
  const recommendations = [
    {
      category: 'المبيعات',
      icon: TrendingUp,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      items: [
        `التركيز على المنتجات سريعة الحركة لزيادة المبيعات`,
        `استهداف العملاء عالي القيمة لزيادة متوسط الطلب`,
        `تطوير استراتيجية للاحتفاظ بالعملاء المعرضين لخطر المغادرة`
      ]
    },
    {
      category: 'المخزون',
      icon: Package,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      items: [
        `إعادة طلب ${predictiveData.inventoryPrediction.lowStockAlerts.length} منتج بشكل فوري`,
        `مراجعة الحد الأدنى للمخزون للمنتجات سريعة الحركة`,
        `تحسين دورة المخزون لتقليل التكاليف`
      ]
    },
    {
      category: 'العملاء',
      icon: Users,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      items: [
        `إنشاء برنامج ولاء للعملاء عالي القيمة`,
        `حملة استرداد للعملاء المعرضين لخطر المغادرة`,
        `تحسين تجربة العملاء لزيادة معدل الاحتفاظ`
      ]
    },
    {
      category: 'المالية',
      icon: DollarSign,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      items: [
        `تحسين هامش الربح من خلال التفاوض مع الموردين`,
        `مراجعة استراتيجية التسعير للمنتجات منخفضة الربحية`,
        `تحسين إدارة التدفق النقدي`
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <Alert className="border-blue-200 bg-blue-50">
        <Lightbulb className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-blue-700">
          هذه التوصيات مبنية على تحليل ذكي لبياناتك وتهدف إلى تحسين أداء عملك.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        {recommendations.map((rec) => {
          const IconComponent = rec.icon;
          return (
            <Card key={rec.category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconComponent className={`h-5 w-5 ${rec.color}`} />
                  توصيات {rec.category}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {rec.items.map((item, index) => (
                    <div key={index} className={`p-3 rounded-lg ${rec.bgColor}`}>
                      <div className="flex items-start gap-2">
                        <div className={`w-2 h-2 rounded-full mt-2 ${rec.color.replace('text-', 'bg-')}`} />
                        <p className="text-sm">{item}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Action Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            خطة العمل المقترحة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 border-l-4 border-red-500 bg-red-50">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="font-medium text-red-700">عاجل (خلال أسبوع)</p>
                <p className="text-sm text-red-600">إعادة طلب المنتجات منخفضة المخزون</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 border-l-4 border-yellow-500 bg-yellow-50">
              <Calendar className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="font-medium text-yellow-700">قصير المدى (خلال شهر)</p>
                <p className="text-sm text-yellow-600">تطوير استراتيجية الاحتفاظ بالعملاء</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 border-l-4 border-blue-500 bg-blue-50">
              <Target className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium text-blue-700">متوسط المدى (خلال 3 أشهر)</p>
                <p className="text-sm text-blue-600">تحسين هوامش الربح وتطوير المنتجات</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}