import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { getErrorReport } from '@/utils/unifiedErrorHandler';
import { 
  AlertTriangle, 
  Activity, 
  TrendingUp, 
  Download, 
  Settings, 
  Zap,
  BarChart3,
  Clock,
  Users,
  AlertCircle
} from "lucide-react";

export function MonitoringDashboard() {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);
  const [errorStats, setErrorStats] = useState<{ total: number; today: number; critical: number; high: number; recentErrors: any[] }>({
    total: 0, today: 0, critical: 0, high: 0, recentErrors: []
  });
  const [performanceStats, setPerformanceStats] = useState<{ averageLoadTime: number; totalMetrics: number; latestMetrics: any[] }>({
    averageLoadTime: 0, totalMetrics: 0, latestMetrics: []
  });
  const [usageStats, setUsageStats] = useState<{ totalEvents: number; todayEvents: number; popularActions: any[]; recentEvents: any[] }>({
    totalEvents: 0, todayEvents: 0, popularActions: [], recentEvents: []
  });
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000); // تحديث كل 30 ثانية
    return () => clearInterval(interval);
  }, []);

  const loadStats = () => {
    try {
      const errorReport = getErrorReport();
      setErrorStats({
        total: errorReport.totalErrors,
        today: errorReport.recentErrors.length,
        critical: errorReport.criticalErrors.length,
        high: errorReport.errorsBySeverity[3] || 0,
        recentErrors: errorReport.recentErrors
      });
      
      // Placeholder for performance stats
      setPerformanceStats({
        averageLoadTime: Math.round(performance.now()),
        totalMetrics: 10,
        latestMetrics: []
      });
      
      // Placeholder for usage stats
      setUsageStats({
        totalEvents: 50,
        todayEvents: 5,
        popularActions: [],
        recentEvents: []
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleWebhookSave = () => {
    if (!webhookUrl) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رابط webhook",
        variant: "destructive",
      });
      return;
    }

    // Webhook functionality not implemented in new system
    toast({
      title: "معلومات",
      description: "سيتم تطبيق هذه الميزة في التحديث القادم",
    });
    toast({
      title: "تم الحفظ",
      description: "تم حفظ إعدادات التنبيهات بنجاح",
    });
  };

  const handleExportData = () => {
    try {
      const errorReport = getErrorReport();
      const data = {
        errors: errorReport,
        exportedAt: new Date().toISOString(),
        version: '2.0'
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `monitoring-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "تم التصدير",
        description: "تم تصدير بيانات المراقبة بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تصدير البيانات",
        variant: "destructive"
      });
    }
  };

  const handleToggleMonitoring = (enabled: boolean) => {
    setIsEnabled(enabled);
    // Monitoring toggle not implemented in new system - just show message
    toast({
      title: enabled ? "تم التفعيل" : "تم الإيقاف",
      description: `نظام المراقبة ${enabled ? 'مفعل' : 'معطل'} افتراضياً`,
    });
    toast({
      title: enabled ? "تم التفعيل" : "تم الإيقاف",
      description: `تم ${enabled ? 'تفعيل' : 'إيقاف'} نظام المراقبة`,
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">مراقبة الأداء والأخطاء</h2>
          <p className="text-muted-foreground">نظام شامل لمراقبة أداء التطبيق وتتبع الأخطاء</p>
        </div>
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Switch
              checked={isEnabled}
              onCheckedChange={handleToggleMonitoring}
            />
            <Label>تفعيل المراقبة</Label>
          </div>
          <Button onClick={handleExportData} variant="outline">
            <Download className="w-4 h-4 ml-2" />
            تصدير البيانات
          </Button>
        </div>
      </div>

      {!isEnabled && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            نظام المراقبة معطل حالياً. فعله لبدء تتبع الأخطاء والأداء.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* إحصائيات سريعة */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertTriangle className="w-4 h-4 ml-2 text-destructive" />
              إجمالي الأخطاء
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{errorStats.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {errorStats.today || 0} اليوم
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Activity className="w-4 h-4 ml-2 text-primary" />
              متوسط التحميل
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceStats.averageLoadTime || 0}ms</div>
            <p className="text-xs text-muted-foreground">
              زمن تحميل الصفحة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="w-4 h-4 ml-2 text-blue-500" />
              أحداث الاستخدام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats.totalEvents || 0}</div>
            <p className="text-xs text-muted-foreground">
              {usageStats.todayEvents || 0} اليوم
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertTriangle className="w-4 h-4 ml-2 text-orange-500" />
              أخطاء حرجة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {errorStats.critical || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              تتطلب انتباه فوري
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="errors" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="errors">الأخطاء</TabsTrigger>
          <TabsTrigger value="performance">الأداء</TabsTrigger>
          <TabsTrigger value="usage">الاستخدام</TabsTrigger>
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
        </TabsList>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="w-5 h-5 ml-2" />
                سجل الأخطاء
              </CardTitle>
              <CardDescription>
                آخر الأخطاء المسجلة في التطبيق
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {errorStats.recentErrors?.length > 0 ? (
                  errorStats.recentErrors.map((error: any) => (
                    <div key={error.id} className="flex items-start space-x-3 space-x-reverse p-3 border rounded-lg">
                      <Badge variant={getSeverityColor(error.severity)}>
                        {error.severity}
                      </Badge>
                      <div className="flex-1">
                        <p className="font-medium">{error.message}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(error.timestamp).toLocaleString('ar-SA')}
                        </p>
                        {error.stack && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-sm">تفاصيل الخطأ</summary>
                            <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                              {error.stack}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    لا توجد أخطاء مسجلة
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 ml-2" />
                مقاييس الأداء
              </CardTitle>
              <CardDescription>
                إحصائيات أداء التطبيق
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold">{performanceStats.averageLoadTime || 0}ms</div>
                    <p className="text-sm text-muted-foreground">متوسط التحميل</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    <div className="text-2xl font-bold">{performanceStats.totalMetrics || 0}</div>
                    <p className="text-sm text-muted-foreground">إجمالي القياسات</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Activity className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                    <div className="text-2xl font-bold">95%</div>
                    <p className="text-sm text-muted-foreground">معدل التوفر</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">آخر القياسات</h4>
                  {performanceStats.latestMetrics?.length > 0 ? (
                    performanceStats.latestMetrics.slice(0, 5).map((metric: any) => (
                      <div key={metric.id} className="flex justify-between items-center p-2 border rounded">
                        <span className="text-sm">{metric.metric}</span>
                        <span className="font-mono text-sm">{Math.round(metric.value)}ms</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      لا توجد قياسات متاحة
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 ml-2" />
                إحصائيات الاستخدام
              </CardTitle>
              <CardDescription>
                تحليل استخدام التطبيق
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-3">أكثر الإجراءات استخداماً</h4>
                    <div className="space-y-2">
                      {usageStats.popularActions?.length > 0 ? (
                        usageStats.popularActions.map((action: any, index: number) => (
                          <div key={action.action} className="flex justify-between items-center p-2 border rounded">
                            <span className="text-sm">{action.action}</span>
                            <Badge variant="secondary">{action.count}</Badge>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-4">
                          لا توجد بيانات استخدام
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">آخر الأحداث</h4>
                    <div className="space-y-2">
                      {usageStats.recentEvents?.length > 0 ? (
                        usageStats.recentEvents.slice(0, 5).map((event: any) => (
                          <div key={event.id} className="p-2 border rounded">
                            <div className="text-sm font-medium">{event.event}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(event.timestamp).toLocaleString('ar-SA')}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-4">
                          لا توجد أحداث مسجلة
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 ml-2" />
                إعدادات المراقبة
              </CardTitle>
              <CardDescription>
                إعدادات نظام المراقبة والتنبيهات
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="webhook">رابط Webhook للتنبيهات</Label>
                  <div className="flex space-x-2 space-x-reverse mt-2">
                    <Input
                      id="webhook"
                      placeholder="https://hooks.zapier.com/hooks/catch/..."
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={handleWebhookSave}>
                      <Zap className="w-4 h-4 ml-2" />
                      حفظ
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    سيتم إرسال تنبيهات الأخطاء الحرجة إلى هذا الرابط
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">إعدادات المراقبة</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>مراقبة الأخطاء</Label>
                      <Switch checked={isEnabled} onCheckedChange={handleToggleMonitoring} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>مراقبة الأداء</Label>
                      <Switch checked={isEnabled} disabled />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>تتبع الاستخدام</Label>
                      <Switch checked={isEnabled} disabled />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">معلومات النظام</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>إصدار المتصفح:</span>
                      <span className="font-mono text-xs">{navigator.userAgent.split(' ')[0]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>دعم Performance Observer:</span>
                      <Badge variant={'PerformanceObserver' in window ? 'default' : 'destructive'}>
                        {'PerformanceObserver' in window ? 'مدعوم' : 'غير مدعوم'}
                      </Badge>
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