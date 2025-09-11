import { logger } from '@/utils/logger';
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { healthMonitoring, SystemHealth, HealthCheck } from "@/core/HealthMonitoring";
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Activity, 
  RefreshCw,
  Settings,
  Play,
  Pause,
  Clock
} from "lucide-react";

export function EnhancedHealthDashboard() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadHealthData();
    const interval = setInterval(loadHealthData, 10000); // تحديث كل 10 ثوان
    return () => clearInterval(interval);
  }, []);

  const loadHealthData = () => {
    try {
      const health = healthMonitoring.getSystemHealth();
      const checks = healthMonitoring.getAllChecks();
      
      setSystemHealth(health);
      setHealthChecks(checks);
      
      // تحديد حالة المراقبة
      setIsMonitoring(checks.some(check => check.enabled));
    } catch (error) {
      logger.error('Failed to load health data:', error);
    }
  };

  const handleStartMonitoring = () => {
    try {
      healthMonitoring.startMonitoring();
      setIsMonitoring(true);
      toast({
        title: "تم البدء",
        description: "تم بدء مراقبة صحة النظام",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في بدء المراقبة",
        variant: "destructive",
      });
    }
  };

  const handleStopMonitoring = () => {
    try {
      healthMonitoring.stopMonitoring();
      setIsMonitoring(false);
      toast({
        title: "تم الإيقاف",
        description: "تم إيقاف مراقبة صحة النظام",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في إيقاف المراقبة",
        variant: "destructive",
      });
    }
  };

  const handleRunCheck = async (checkName: string) => {
    setIsLoading(true);
    try {
      await healthMonitoring.runManualCheck(checkName);
      loadHealthData();
      toast({
        title: "تم الفحص",
        description: `تم تشغيل فحص ${checkName} بنجاح`,
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: `فشل في تشغيل فحص ${checkName}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleCheck = (checkName: string, enabled: boolean) => {
    try {
      healthMonitoring.updateCheckConfig(checkName, { enabled });
      loadHealthData();
      toast({
        title: enabled ? "تم التفعيل" : "تم الإيقاف",
        description: `تم ${enabled ? 'تفعيل' : 'إيقاف'} فحص ${checkName}`,
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحديث إعدادات الفحص",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'critical':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800">سليم</Badge>;
      case 'warning':
        return <Badge variant="destructive" className="bg-yellow-100 text-yellow-800">تحذير</Badge>;
      case 'critical':
        return <Badge variant="destructive">حرج</Badge>;
      default:
        return <Badge variant="secondary">غير معروف</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'database':
        return '💾';
      case 'api':
        return '🔗';
      case 'system':
        return '⚙️';
      case 'integration':
        return '🔄';
      case 'performance':
        return '📊';
      default:
        return '❓';
    }
  };

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6" />
            فحوصات صحة النظام
          </h2>
          <p className="text-muted-foreground">
            مراقبة مستمرة لصحة جميع مكونات النظام
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant={isMonitoring ? "destructive" : "default"}
            onClick={isMonitoring ? handleStopMonitoring : handleStartMonitoring}
            disabled={isLoading}
          >
            {isMonitoring ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                إيقاف المراقبة
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                بدء المراقبة
              </>
            )}
          </Button>
          <Button variant="outline" onClick={loadHealthData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        </div>
      </div>

      {/* ملخص الصحة العامة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            ملخص الصحة العامة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className={`text-3xl font-bold ${
                systemHealth.overall === 'healthy' ? 'text-green-600' :
                systemHealth.overall === 'degraded' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {systemHealth.score || 0}%
              </div>
              <p className="text-sm text-muted-foreground">نقاط الصحة</p>
              {getStatusBadge(systemHealth.overall || 'unknown')}
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {systemHealth.summary?.healthy || 0}
              </div>
              <p className="text-sm text-muted-foreground">فحوصات سليمة</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {systemHealth.summary?.warning || 0}
              </div>
              <p className="text-sm text-muted-foreground">تحذيرات</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {systemHealth.summary?.critical || 0}
              </div>
              <p className="text-sm text-muted-foreground">مشاكل حرجة</p>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span>الصحة العامة</span>
              <span>{systemHealth.score || 0}%</span>
            </div>
            <Progress value={systemHealth.score || 0} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* التبويبات */}
      <Tabs defaultValue="checks" className="w-full">
        <TabsList>
          <TabsTrigger value="checks">الفحوصات</TabsTrigger>
          <TabsTrigger value="history">التاريخ</TabsTrigger>
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
        </TabsList>

        <TabsContent value="checks" className="space-y-4">
          <div className="grid gap-4">
            {healthChecks.map((check) => (
              <Card key={check.name}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">
                        {getCategoryIcon(check.category)}
                      </div>
                      <div>
                        <h3 className="font-semibold">{check.description}</h3>
                        <p className="text-sm text-muted-foreground">
                          الفئة: {check.category} • الفترة: {Math.round(check.interval / 1000)}ث
                        </p>
                        {check.lastRun && (
                          <p className="text-xs text-muted-foreground">
                            آخر تشغيل: {new Date(check.lastRun).toLocaleString('ar-SA')}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {check.lastResult && getStatusIcon(check.lastResult.status)}
                        {check.lastResult && getStatusBadge(check.lastResult.status)}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={check.enabled}
                          onCheckedChange={(enabled) => handleToggleCheck(check.name, enabled)}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRunCheck(check.name)}
                          disabled={isLoading}
                        >
                          <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                          تشغيل
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {check.lastResult && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm">{check.lastResult.message}</p>
                      {check.lastResult.responseTime && (
                        <p className="text-xs text-muted-foreground mt-1">
                          وقت الاستجابة: {check.lastResult.responseTime}ms
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                تاريخ الفحوصات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                ستتوفر هذه الميزة قريباً
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                إعدادات الفحوصات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>المراقبة التلقائية</Label>
                    <p className="text-sm text-muted-foreground">
                      تشغيل جميع الفحوصات تلقائياً
                    </p>
                  </div>
                  <Switch
                    checked={isMonitoring}
                    onCheckedChange={isMonitoring ? handleStopMonitoring : handleStartMonitoring}
                  />
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">إعدادات متقدمة</h4>
                  <p className="text-sm text-muted-foreground">
                    يمكن تخصيص فترات الفحص وإعدادات التنبيهات لكل فحص على حدة
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}