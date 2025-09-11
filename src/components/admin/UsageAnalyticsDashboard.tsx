import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { usageAnalytics } from "@/core/UsageAnalytics";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  Activity, 
  Download,
  RefreshCw,
  Calendar,
  Zap,
  Eye,
  MousePointer
} from "lucide-react";

export function UsageAnalyticsDashboard() {
  const [realTimeStats, setRealTimeStats] = useState<any>({});
  const [usageReport, setUsageReport] = useState<any>({});
  const [selectedPeriod, setSelectedPeriod] = useState("7");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAnalyticsData();
    const interval = setInterval(loadAnalyticsData, 5000); // تحديث كل 5 ثوان
    return () => clearInterval(interval);
  }, [selectedPeriod]);

  const loadAnalyticsData = () => {
    try {
      const realTime = usageAnalytics.getRealTimeStats();
      setRealTimeStats(realTime);

      // إنشاء تقرير للفترة المحددة
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - parseInt(selectedPeriod) * 24 * 60 * 60 * 1000).toISOString();
      const report = usageAnalytics.generateUsageReport(startDate, endDate);
      setUsageReport(report);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    }
  };

  const handleExportReport = () => {
    setIsLoading(true);
    try {
      const data = usageAnalytics.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `usage-analytics-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "تم التصدير",
        description: "تم تصدير بيانات الاستخدام بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تصدير البيانات",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearOldData = () => {
    if (!confirm("هل أنت متأكد من حذف البيانات القديمة؟ هذا الإجراء لا يمكن التراجع عنه.")) {
      return;
    }

    try {
      usageAnalytics.clearOldData(30); // الاحتفاظ بآخر 30 يوم
      loadAnalyticsData();
      toast({
        title: "تم الحذف",
        description: "تم حذف البيانات القديمة بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في حذف البيانات",
        variant: "destructive",
      });
    }
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}س ${minutes % 60}د`;
    } else if (minutes > 0) {
      return `${minutes}د ${seconds % 60}ث`;
    } else {
      return `${seconds}ث`;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            إحصائيات الاستخدام المتقدمة
          </h2>
          <p className="text-muted-foreground">
            تحليل شامل لاستخدام التطبيق وسلوك المستخدمين
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">يوم واحد</SelectItem>
              <SelectItem value="7">7 أيام</SelectItem>
              <SelectItem value="30">30 يوم</SelectItem>
              <SelectItem value="90">90 يوم</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportReport} disabled={isLoading}>
            <Download className="w-4 h-4 mr-2" />
            تصدير
          </Button>
          <Button variant="outline" onClick={loadAnalyticsData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        </div>
      </div>

      {/* إحصائيات الوقت الفعلي */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            إحصائيات الوقت الفعلي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {realTimeStats.today?.events || 0}
              </div>
              <p className="text-sm text-muted-foreground">أحداث اليوم</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {realTimeStats.today?.features || 0}
              </div>
              <p className="text-sm text-muted-foreground">ميزات مستخدمة</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {formatDuration(realTimeStats.session?.duration || 0)}
              </div>
              <p className="text-sm text-muted-foreground">مدة الجلسة الحالية</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {realTimeStats.session?.actions || 0}
              </div>
              <p className="text-sm text-muted-foreground">إجراءات الجلسة</p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between text-sm">
              <span>معرف الجلسة:</span>
              <span className="font-mono text-xs">{realTimeStats.session?.id}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span>حالة التتبع:</span>
              <Badge variant={realTimeStats.system?.isTracking ? 'default' : 'secondary'}>
                {realTimeStats.system?.isTracking ? 'نشط' : 'متوقف'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* التبويبات */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="features">الميزات</TabsTrigger>
          <TabsTrigger value="performance">الأداء</TabsTrigger>
          <TabsTrigger value="business">الأعمال</TabsTrigger>
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  ملخص الفترة ({selectedPeriod} أيام)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>إجمالي الأحداث</span>
                  <span className="font-bold">{usageReport.summary?.totalEvents || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>الميزات الفريدة</span>
                  <span className="font-bold">{usageReport.summary?.uniqueFeatures || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>متوسط مدة الجلسة</span>
                  <span className="font-bold">{usageReport.summary?.averageSessionTime || 0}ث</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>ساعة الذروة</span>
                  <span className="font-bold">{usageReport.summary?.peakHour || 'غير محدد'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  أداء النظام
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>متوسط التحميل</span>
                  <span className="font-bold">{Math.round(usageReport.performance?.averageLoadTime || 0)}ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>معدل الأخطاء</span>
                  <span className="font-bold">{usageReport.performance?.errorRate?.toFixed(2) || 0}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>استخدام الذاكرة</span>
                  <span className="font-bold">{Math.round((usageReport.performance?.memoryUsage || 0) / 1024 / 1024)}MB</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MousePointer className="w-5 h-5" />
                أكثر الميزات استخداماً
              </CardTitle>
              <CardDescription>
                ترتيب الميزات حسب مرات الاستخدام في الفترة المحددة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {usageReport.features?.length > 0 ? (
                  usageReport.features.map((feature: any, index: number) => (
                    <div key={feature.name} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-medium text-muted-foreground">
                          #{index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{feature.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {feature.usage} مرة استخدام
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(feature.trend)}
                        <Badge variant="secondary">{feature.usage}</Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    لا توجد بيانات استخدام متاحة
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">أداء التحميل</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">
                  {Math.round(usageReport.performance?.averageLoadTime || 0)}ms
                </div>
                <Progress 
                  value={Math.min((usageReport.performance?.averageLoadTime || 0) / 3000 * 100, 100)} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  الهدف: أقل من 3 ثوان
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">معدل الأخطاء</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">
                  {usageReport.performance?.errorRate?.toFixed(2) || 0}%
                </div>
                <Progress 
                  value={Math.min((usageReport.performance?.errorRate || 0) * 10, 100)} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  الهدف: أقل من 1%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">استخدام الذاكرة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">
                  {Math.round((usageReport.performance?.memoryUsage || 0) / 1024 / 1024)}MB
                </div>
                <Progress 
                  value={Math.min(((usageReport.performance?.memoryUsage || 0) / 1024 / 1024) / 100 * 100, 100)} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  الهدف: أقل من 100MB
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                إحصائيات الأعمال
              </CardTitle>
              <CardDescription>
                مقاييس أداء الأعمال والمبيعات
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {usageReport.business?.totalSales || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">إجمالي المبيعات</p>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {usageReport.business?.totalProducts || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">المنتجات المتفاعل معها</p>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {usageReport.business?.totalTransactions || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">إجمالي المعاملات</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                إعدادات التتبع
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">حالة التتبع</div>
                    <div className="text-sm text-muted-foreground">
                      التتبع حالياً: {realTimeStats.system?.isTracking ? 'نشط' : 'متوقف'}
                    </div>
                  </div>
                  <Badge variant={realTimeStats.system?.isTracking ? 'default' : 'secondary'}>
                    {realTimeStats.system?.isTracking ? 'نشط' : 'متوقف'}
                  </Badge>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">تنظيف البيانات القديمة</div>
                      <div className="text-sm text-muted-foreground">
                        حذف البيانات الأقدم من 30 يوم
                      </div>
                    </div>
                    <Button variant="outline" onClick={handleClearOldData}>
                      تنظيف
                    </Button>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>إجمالي المقاييس:</span>
                      <span>{realTimeStats.system?.totalMetrics || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>إجمالي الجلسات:</span>
                      <span>{realTimeStats.system?.totalSessions || 0}</span>
                    </div>
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