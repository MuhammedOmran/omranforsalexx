/**
 * واجهة إدارة المراقبة والصيانة الشاملة
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Activity,
  Shield,
  Database,
  Download,
  Upload,
  Settings,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Clock,
  HardDrive,
  Zap,
  RefreshCw,
  Play,
  Pause,
  BarChart3
} from 'lucide-react';

export function MonitoringMaintenanceDashboard() {
  const { toast } = useToast();
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [usageStats, setUsageStats] = useState<any>(null);
  const [backupStats, setBackupStats] = useState<any>(null);
  const [isMaintenanceRunning, setIsMaintenanceRunning] = useState(false);
  const [config, setConfig] = useState<any>({});

  // تحميل البيانات
  const loadData = async () => {
    try {
      const { monitoringPluginManager } = await import('@/plugins/MonitoringPlugin');
      
      // تحميل تقرير النظام الشامل
      const systemReport = await monitoringPluginManager.getSystemReport();
      
      if (systemReport.health) {
        setSystemHealth(systemReport.health);
      }
      
      if (systemReport.usage) {
        setUsageStats(systemReport.usage);
      }
      
      if (systemReport.backups) {
        setBackupStats(systemReport.backups);
      }

      // تحميل الإعدادات
      const pluginConfig = monitoringPluginManager.getConfig();
      setConfig(pluginConfig);
      
    } catch (error) {
      console.error('Failed to load monitoring data:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات المراقبة",
        variant: "destructive",
      });
    }
  };

  // تشغيل الصيانة
  const runMaintenance = async () => {
    setIsMaintenanceRunning(true);
    try {
      const { monitoringPluginManager } = await import('@/plugins/MonitoringPlugin');
      const result = await monitoringPluginManager.performMaintenance();
      
      if (result.success) {
        toast({
          title: "تمت الصيانة بنجاح",
          description: `تم تنفيذ ${result.tasks.length} مهمة صيانة`,
        });
      } else {
        throw new Error(result.error);
      }
      
      // إعادة تحميل البيانات
      await loadData();
    } catch (error) {
      toast({
        title: "فشل في الصيانة",
        description: error instanceof Error ? error.message : 'خطأ غير معروف',
        variant: "destructive",
      });
    } finally {
      setIsMaintenanceRunning(false);
    }
  };

  // إنشاء نسخة احتياطية يدوية
  const createBackup = async () => {
    try {
      const { backupRestoreSystem } = await import('@/core/BackupRestoreSystem');
      const backup = await backupRestoreSystem.createBackup('manual', `نسخة يدوية - ${new Date().toLocaleString('ar')}`);
      
      if (backup) {
        toast({
          title: "تم إنشاء النسخة الاحتياطية",
          description: `تم إنشاء النسخة ${backup.metadata.name} بنجاح`,
        });
        await loadData();
      }
    } catch (error) {
      toast({
        title: "فشل في إنشاء النسخة الاحتياطية",
        description: "حدث خطأ أثناء إنشاء النسخة الاحتياطية",
        variant: "destructive",
      });
    }
  };

  // تحديث الإعدادات
  const updateConfig = async (newConfig: any) => {
    try {
      const { monitoringPluginManager } = await import('@/plugins/MonitoringPlugin');
      monitoringPluginManager.updateConfig(newConfig);
      setConfig({ ...config, ...newConfig });
      
      toast({
        title: "تم التحديث",
        description: "تم تحديث إعدادات المراقبة",
      });
    } catch (error) {
      toast({
        title: "فشل في التحديث",
        description: "حدث خطأ أثناء تحديث الإعدادات",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadData();
    
    // تحديث البيانات كل 30 ثانية
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getHealthBadgeVariant = (status: string) => {
    switch (status) {
      case 'healthy': return 'default';
      case 'degraded': return 'secondary';
      case 'down': return 'destructive';
      default: return 'outline';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'down': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">المراقبة والصيانة</h1>
          <p className="text-muted-foreground">
            مراقبة صحة النظام وإدارة النسخ الاحتياطية والصيانة
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={loadData}
          >
            <RefreshCw className="ml-2 h-4 w-4" />
            تحديث
          </Button>
          
          <Button
            onClick={runMaintenance}
            disabled={isMaintenanceRunning}
          >
            {isMaintenanceRunning ? (
              <RefreshCw className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <Settings className="ml-2 h-4 w-4" />
            )}
            {isMaintenanceRunning ? 'جاري التنفيذ...' : 'تشغيل الصيانة'}
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-2">
              {systemHealth ? getHealthIcon(systemHealth.overall) : <Activity className="h-4 w-4" />}
              <div>
                <p className="text-2xl font-bold">
                  {systemHealth ? systemHealth.score : '--'}%
                </p>
                <p className="text-xs text-muted-foreground">صحة النظام</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">
                  {usageStats?.realTime?.today?.events || 0}
                </p>
                <p className="text-xs text-muted-foreground">أحداث اليوم</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  {backupStats?.stats?.total || 0}
                </p>
                <p className="text-xs text-muted-foreground">النسخ الاحتياطية</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">
                  {usageStats?.realTime?.session?.duration 
                    ? Math.round(usageStats.realTime.session.duration / 60000) 
                    : 0}
                </p>
                <p className="text-xs text-muted-foreground">دقائق الجلسة</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="health" className="space-y-4">
        <TabsList>
          <TabsTrigger value="health">صحة النظام</TabsTrigger>
          <TabsTrigger value="usage">إحصائيات الاستخدام</TabsTrigger>
          <TabsTrigger value="backups">النسخ الاحتياطية</TabsTrigger>
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="space-y-4">
          {systemHealth ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Shield className="ml-2 h-5 w-5" />
                      حالة النظام العامة
                    </CardTitle>
                    <Badge variant={getHealthBadgeVariant(systemHealth.overall)}>
                      {systemHealth.overall === 'healthy' ? 'سليم' : 
                       systemHealth.overall === 'degraded' ? 'متدهور' : 'متوقف'}
                    </Badge>
                  </div>
                  <CardDescription>
                    النتيجة الإجمالية: {systemHealth.score}%
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Progress value={systemHealth.score} className="w-full" />
                    
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-600">{systemHealth.summary.healthy}</div>
                        <div className="text-sm text-muted-foreground">سليم</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-yellow-600">{systemHealth.summary.warning}</div>
                        <div className="text-sm text-muted-foreground">تحذير</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-600">{systemHealth.summary.critical}</div>
                        <div className="text-sm text-muted-foreground">خطير</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4">
                {Object.entries(systemHealth.checks).map(([name, check]: [string, any]) => (
                  <Card key={name}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-2">
                        {getHealthIcon(check.status)}
                        <div>
                          <div className="font-medium">{name}</div>
                          <div className="text-sm text-muted-foreground">{check.message}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={getHealthBadgeVariant(check.status)}>
                          {check.status === 'healthy' ? 'سليم' : 
                           check.status === 'warning' ? 'تحذير' : 'خطير'}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {check.responseTime}ms
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                لا توجد بيانات صحة النظام متاحة حالياً.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          {usageStats ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="ml-2 h-5 w-5" />
                      إحصائيات اليوم
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>إجمالي الأحداث:</span>
                      <span className="font-bold">{usageStats.realTime.today.events}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>الميزات المستخدمة:</span>
                      <span className="font-bold">{usageStats.realTime.today.features}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>الأخطاء:</span>
                      <span className="font-bold text-red-600">{usageStats.realTime.today.errors}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Activity className="ml-2 h-5 w-5" />
                      الجلسة الحالية
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>المدة:</span>
                      <span className="font-bold">
                        {Math.round((usageStats.realTime.session.duration || 0) / 60000)} دقيقة
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>الإجراءات:</span>
                      <span className="font-bold">{usageStats.realTime.session.actions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>الميزات:</span>
                      <span className="font-bold">{usageStats.realTime.session.features}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {usageStats.weekly && (
                <Card>
                  <CardHeader>
                    <CardTitle>تقرير الأسبوع الماضي</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{usageStats.weekly.summary.totalEvents}</div>
                        <div className="text-sm text-muted-foreground">إجمالي الأحداث</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{usageStats.weekly.summary.uniqueFeatures}</div>
                        <div className="text-sm text-muted-foreground">ميزات مختلفة</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{usageStats.weekly.summary.averageSessionTime}س</div>
                        <div className="text-sm text-muted-foreground">متوسط الجلسة</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{usageStats.weekly.summary.peakHour}</div>
                        <div className="text-sm text-muted-foreground">ساعة الذروة</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                لا توجد إحصائيات استخدام متاحة حالياً.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="backups" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">إدارة النسخ الاحتياطية</h3>
            <Button onClick={createBackup}>
              <Download className="ml-2 h-4 w-4" />
              إنشاء نسخة احتياطية
            </Button>
          </div>

          {backupStats ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <HardDrive className="ml-2 h-5 w-5" />
                    إحصائيات النسخ الاحتياطية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{backupStats.stats.total}</div>
                      <div className="text-sm text-muted-foreground">إجمالي النسخ</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {Math.round(backupStats.stats.totalSize / 1024 / 1024)}MB
                      </div>
                      <div className="text-sm text-muted-foreground">الحجم الإجمالي</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {Math.round(backupStats.stats.averageSize / 1024 / 1024)}MB
                      </div>
                      <div className="text-sm text-muted-foreground">متوسط الحجم</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {backupStats.stats.latest 
                          ? new Date(backupStats.stats.latest).toLocaleDateString('ar')
                          : 'لا يوجد'
                        }
                      </div>
                      <div className="text-sm text-muted-foreground">آخر نسخة</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <h4 className="font-medium">أحدث النسخ الاحتياطية</h4>
                {backupStats.list && backupStats.list.length > 0 ? (
                  backupStats.list.map((backup: any) => (
                    <Card key={backup.id}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div>
                          <div className="font-medium">{backup.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(backup.createdAt).toLocaleString('ar')}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{backup.type}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {Math.round(backup.size / 1024 / 1024)}MB
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Alert>
                    <AlertDescription>
                      لا توجد نسخ احتياطية متاحة.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                لا توجد بيانات النسخ الاحتياطية متاحة حالياً.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات المراقبة والصيانة</CardTitle>
              <CardDescription>
                تخصيص إعدادات أنظمة المراقبة والصيانة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">الفحوصات الصحية</div>
                  <div className="text-sm text-muted-foreground">
                    تشغيل فحوصات دورية لصحة النظام
                  </div>
                </div>
                <Switch
                  checked={config.healthChecksEnabled}
                  onCheckedChange={(checked) => 
                    updateConfig({ healthChecksEnabled: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">تتبع الاستخدام</div>
                  <div className="text-sm text-muted-foreground">
                    جمع إحصائيات الاستخدام والأداء
                  </div>
                </div>
                <Switch
                  checked={config.usageTrackingEnabled}
                  onCheckedChange={(checked) => 
                    updateConfig({ usageTrackingEnabled: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">النسخ الاحتياطي التلقائي</div>
                  <div className="text-sm text-muted-foreground">
                    إنشاء نسخ احتياطية تلقائياً حسب الجدولة
                  </div>
                </div>
                <Switch
                  checked={config.autoBackupEnabled}
                  onCheckedChange={(checked) => 
                    updateConfig({ autoBackupEnabled: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">التنبيهات</div>
                  <div className="text-sm text-muted-foreground">
                    إرسال تنبيهات عند حدوث مشاكل
                  </div>
                </div>
                <Switch
                  checked={config.alertsEnabled}
                  onCheckedChange={(checked) => 
                    updateConfig({ alertsEnabled: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">التقارير</div>
                  <div className="text-sm text-muted-foreground">
                    إنشاء تقارير دورية للنظام
                  </div>
                </div>
                <Switch
                  checked={config.reportingEnabled}
                  onCheckedChange={(checked) => 
                    updateConfig({ reportingEnabled: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}