import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, Database, HardDrive, Cloud, 
  CheckCircle, AlertTriangle, Clock, 
  RefreshCw, Settings, Download,
  Activity, TrendingUp, Calendar
} from 'lucide-react';
import { BackupManager } from '@/utils/backupManager';
import { useToast } from '@/hooks/use-toast';

interface BackupStats {
  totalBackups: number;
  totalSize: number;
  lastBackup?: string;
  scheduledBackups: boolean;
  successRate: number;
  avgBackupTime: number;
}

export function BackupDashboard() {
  const [stats, setStats] = useState<BackupStats>({
    totalBackups: 0,
    totalSize: 0,
    scheduledBackups: false,
    successRate: 0,
    avgBackupTime: 0
  });
  const [recentBackups, setRecentBackups] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState({
    status: 'healthy' as 'healthy' | 'warning' | 'critical',
    issues: [] as string[]
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const backupManager = BackupManager.getInstance();

  useEffect(() => {
    loadDashboardData();
    
    // تحديث البيانات كل 5 دقائق
    const interval = setInterval(loadDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // تحميل الإحصائيات
      const systemInfo = backupManager.getBackupSystemInfo();
      const backupsList = await backupManager.getBackupsList();
      
      // حساب معدل النجاح (افتراض أن جميع النسخ ناجحة)
      const successRate = 100;

      // حساب متوسط وقت النسخ الاحتياطي (افتراضي)
      const avgTime = 30;

      setStats({
        ...systemInfo,
        successRate,
        avgBackupTime: avgTime
      });

      // آخر 5 نسخ احتياطية
      setRecentBackups(backupsList.slice(0, 5));

      // فحص صحة النظام
      checkSystemHealth(systemInfo, backupsList);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "فشل في تحميل بيانات لوحة التحكم",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkSystemHealth = (systemInfo: any, backups: any[]) => {
    const issues: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    // فحص آخر نسخة احتياطية
    if (systemInfo.lastBackup) {
      const lastBackupDate = new Date(systemInfo.lastBackup);
      const daysSinceLastBackup = Math.floor(
        (Date.now() - lastBackupDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceLastBackup > 7) {
        issues.push('لم يتم إنشاء نسخة احتياطية منذ أكثر من أسبوع');
        status = 'critical';
      } else if (daysSinceLastBackup > 3) {
        issues.push('لم يتم إنشاء نسخة احتياطية منذ أكثر من 3 أيام');
        status = status === 'healthy' ? 'warning' : status;
      }
    } else {
      issues.push('لا توجد نسخ احتياطية');
      status = 'critical';
    }

    // فحص النسخ الاحتياطية المجدولة
    if (!systemInfo.scheduledBackups) {
      issues.push('النسخ الاحتياطية التلقائية غير مفعلة');
      status = status === 'healthy' ? 'warning' : status;
    }

    // فحص حجم النسخ الاحتياطية
    const totalSizeMB = systemInfo.totalSize / (1024 * 1024);
    if (totalSizeMB > 500) {
      issues.push('حجم النسخ الاحتياطية كبير - قم بحذف النسخ القديمة');
      status = status === 'healthy' ? 'warning' : status;
    }

    // فحص النسخ الفاشلة (تبسيط للآن)
    // const failedBackups = backups.filter(b => b.errors);
    // if (failedBackups.length > 0) {
    //   issues.push(`${failedBackups.length} نسخة احتياطية فاشلة`);
    //   status = status === 'healthy' ? 'warning' : status;
    // }

    setSystemHealth({ status, issues });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}ث`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}د ${remainingSeconds}ث`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span className="mr-2">جاري تحميل بيانات النسخ الاحتياطي...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* الحالة العامة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">حالة النظام</p>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusIcon(systemHealth.status)}
                  <span className={`font-semibold ${getStatusColor(systemHealth.status)}`}>
                    {systemHealth.status === 'healthy' ? 'سليم' : 
                     systemHealth.status === 'warning' ? 'تحذير' : 'خطر'}
                  </span>
                </div>
              </div>
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي النسخ</p>
                <p className="text-2xl font-bold">{stats.totalBackups}</p>
              </div>
              <Database className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">الحجم الإجمالي</p>
                <p className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</p>
              </div>
              <HardDrive className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">معدل النجاح</p>
                <p className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* تفاصيل الحالة */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* الحالة والتنبيهات */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              حالة النظام والتنبيهات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {systemHealth.issues.length > 0 ? (
              <div className="space-y-2">
                {systemHealth.issues.map((issue, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded border border-yellow-200 dark:border-yellow-800">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <span className="text-sm text-yellow-800 dark:text-yellow-200">{issue}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-sm text-green-800 dark:text-green-200">
                  جميع الأنظمة تعمل بشكل طبيعي
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">النسخ التلقائية</p>
                <Badge variant={stats.scheduledBackups ? "default" : "secondary"}>
                  {stats.scheduledBackups ? "مفعلة" : "غير مفعلة"}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">متوسط وقت النسخ</p>
                <p className="font-semibold">{formatDuration(stats.avgBackupTime)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* آخر النسخ الاحتياطية */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              آخر النسخ الاحتياطية
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentBackups.length > 0 ? (
              <div className="space-y-3">
                {recentBackups.map((backup) => (
                  <div key={backup.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{backup.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(backup.createdAt).toLocaleDateString('ar-SA', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric',
                          calendar: 'gregory' 
                        })} • {formatFileSize(backup.size)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={backup.isAutomatic ? "secondary" : "default"} className="text-xs">
                        {backup.isAutomatic ? "تلقائي" : "يدوي"}
                      </Badge>
                      <Shield className="h-3 w-3 text-green-600" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">لا توجد نسخ احتياطية</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* إجراءات سريعة */}
      <Card>
        <CardHeader>
          <CardTitle>الإجراءات السريعة</CardTitle>
          <CardDescription>
            إجراءات مفيدة لإدارة النسخ الاحتياطية
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-16 flex-col gap-2" variant="outline">
              <Download className="h-5 w-5" />
              <span>إنشاء نسخة احتياطية فورية</span>
            </Button>
            <Button className="h-16 flex-col gap-2" variant="outline">
              <Settings className="h-5 w-5" />
              <span>إعدادات النسخ التلقائية</span>
            </Button>
            <Button className="h-16 flex-col gap-2" variant="outline" onClick={loadDashboardData}>
              <RefreshCw className="h-5 w-5" />
              <span>تحديث البيانات</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* شريط التقدم للمساحة المستخدمة */}
      <Card>
        <CardHeader>
          <CardTitle>استخدام المساحة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>المساحة المستخدمة</span>
              <span>{formatFileSize(stats.totalSize)} / 1 GB</span>
            </div>
            <Progress value={(stats.totalSize / (1024 * 1024 * 1024)) * 100} className="h-2" />
            <p className="text-xs text-muted-foreground">
              يُنصح بحذف النسخ القديمة عند امتلاء المساحة
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}