/**
 * مكون عرض حالة النسخ الاحتياطية في لوحة التحكم
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Database, 
  Download, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  HardDrive,
  Calendar,
  Settings
} from 'lucide-react';
import { backupManager } from '@/utils/backupManager';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export function BackupStatus() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [systemInfo, setSystemInfo] = useState({
    totalBackups: 0,
    lastBackup: null,
    backupHealth: 'جيد',
    nextScheduled: null,
    totalSize: 0,
    scheduledBackups: false
  });
  const [recentBackups, setRecentBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSystemInfo();
    loadRecentBackups();
  }, []);

  const loadSystemInfo = () => {
    const info = backupManager.getBackupSystemInfo();
    setSystemInfo({
      totalBackups: info.totalBackups || 0,
      lastBackup: info.lastBackup || null,
      backupHealth: 'جيد',
      nextScheduled: null,
      totalSize: info.totalSize || 0,
      scheduledBackups: info.scheduledBackups || false
    });
  };

  const loadRecentBackups = async () => {
    const backups = await backupManager.getBackupsList();
    setRecentBackups(backups.slice(0, 3)); // أحدث 3 نسخ
  };

  const handleQuickBackup = async (exportType?: 'file' | 'whatsapp' | 'drive') => {
    setLoading(true);
    try {
      const result = await backupManager.createBackup(
        `نسخة سريعة - ${new Date().toLocaleDateString('ar-SA', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          calendar: 'gregory',
          numberingSystem: 'latn' 
        })}`,
        'نسخة احتياطية سريعة من لوحة التحكم',
        { compress: true }
      );

      if (result.success && result.backupId) {
        if (exportType) {
          // تصدير النسخة حسب النوع المطلوب
          const exportResult = await backupManager.exportBackup(result.backupId, exportType);
          if (exportResult.success) {
            let description = "تم إنشاء وتصدير النسخة الاحتياطية السريعة";
            if (exportType === 'whatsapp') {
              description = "تم تحضير النسخة للمشاركة عبر الواتساب";
            } else if (exportType === 'drive') {
              description = "تم تحضير النسخة للرفع على جوجل درايف";
            }
            
            toast({
              title: "تم بنجاح",
              description
            });
          } else {
            toast({
              title: "خطأ",
              description: exportResult.error,
              variant: "destructive"
            });
          }
        } else {
          toast({
            title: "تم بنجاح",
            description: "تم إنشاء النسخة الاحتياطية السريعة"
          });
        }
        loadSystemInfo();
        loadRecentBackups();
      } else {
        toast({
          title: "خطأ",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في إنشاء النسخة الاحتياطية",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 بايت';
    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    const dateStr = date.toLocaleDateString('en-GB', options);
    const timeStr = date.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // تحويل الأشهر إلى العربية يدوياً
    const monthsMap: { [key: string]: string } = {
      'January': 'يناير',
      'February': 'فبراير',
      'March': 'مارس',
      'April': 'أبريل',
      'May': 'مايو',
      'June': 'يونيو',
      'July': 'يوليو',
      'August': 'أغسطس',
      'September': 'سبتمبر',
      'October': 'أكتوبر',
      'November': 'نوفمبر',
      'December': 'ديسمبر'
    };
    
    let arabicDate = dateStr;
    Object.entries(monthsMap).forEach(([eng, ar]) => {
      arabicDate = arabicDate.replace(eng, ar);
    });
    
    return `${arabicDate} في ${timeStr}`;
  };

  const getLastBackupStatus = () => {
    if (!systemInfo.lastBackup) {
      return {
        status: 'warning',
        message: 'لم يتم إنشاء نسخة احتياطية بعد',
        color: 'text-orange-600'
      };
    }

    const lastBackupDate = new Date(systemInfo.lastBackup);
    const now = new Date();
    const diffInHours = (now.getTime() - lastBackupDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return {
        status: 'success',
        message: 'محدثة',
        color: 'text-green-600'
      };
    } else if (diffInHours < 168) { // 7 days
      return {
        status: 'warning',
        message: 'تحتاج تحديث',
        color: 'text-orange-600'
      };
    } else {
      return {
        status: 'error',
        message: 'قديمة جداً',
        color: 'text-red-600'
      };
    }
  };

  const lastBackupStatus = getLastBackupStatus();
  const storageUsage = systemInfo.totalSize > 0 ? Math.min((systemInfo.totalSize / (50 * 1024 * 1024)) * 100, 100) : 0;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">النسخ الاحتياطية</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/settings')}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          حالة حماية البيانات
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-lg font-bold text-primary">{systemInfo.totalBackups}</div>
            <div className="text-xs text-muted-foreground">إجمالي النسخ</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-lg font-bold text-primary">{formatFileSize(systemInfo.totalSize)}</div>
            <div className="text-xs text-muted-foreground">الحجم الإجمالي</div>
          </div>
        </div>

        {/* حالة آخر نسخة */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">آخر نسخة احتياطية</div>
              <div className="text-xs text-muted-foreground">
                {systemInfo.lastBackup ? formatDate(systemInfo.lastBackup) : 'لا توجد'}
              </div>
            </div>
          </div>
          <Badge 
            variant={lastBackupStatus.status === 'success' ? 'default' : 'secondary'}
            className={lastBackupStatus.color}
          >
            {lastBackupStatus.status === 'success' && <CheckCircle className="h-3 w-3 mr-1" />}
            {lastBackupStatus.status !== 'success' && <AlertCircle className="h-3 w-3 mr-1" />}
            {lastBackupStatus.message}
          </Badge>
        </div>

        {/* حالة النسخ التلقائية */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm font-medium">النسخ التلقائية</div>
          </div>
          <Badge variant={systemInfo.scheduledBackups ? 'default' : 'secondary'}>
            {systemInfo.scheduledBackups ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                مفعلة
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3 mr-1" />
                معطلة
              </>
            )}
          </Badge>
        </div>

        {/* استخدام التخزين */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              <HardDrive className="h-4 w-4" />
              استخدام التخزين
            </span>
            <span className="text-muted-foreground">{storageUsage.toFixed(1)}%</span>
          </div>
          <Progress value={storageUsage} className="h-2" />
        </div>

        {/* النسخ الأخيرة */}
        {recentBackups.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">النسخ الأخيرة</div>
            <div className="space-y-1">
              {recentBackups.map((backup) => (
                <div key={backup.id} className="flex items-center justify-between text-xs p-2 bg-muted/30 rounded">
                  <div className="truncate flex-1">
                    <div className="font-medium truncate">{backup.name}</div>
                    <div className="text-muted-foreground">{formatDate(backup.createdAt)}</div>
                  </div>
                  <div className="text-muted-foreground ml-2">
                    {formatFileSize(backup.size)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* أزرار العمليات */}
        <div className="space-y-2 pt-2">
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={() => handleQuickBackup()}
              disabled={loading}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-1" />
              نسخة سريعة
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/settings?tab=backup')}
              title="إدارة النسخ الاحتياطية"
            >
              <Database className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex gap-1">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleQuickBackup('whatsapp')}
              disabled={loading}
              className="flex-1 text-green-600 hover:text-green-700"
              title="إنشاء وتصدير للواتساب"
            >
              <svg className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.666"/>
              </svg>
              واتساب
            </Button>
            
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleQuickBackup('drive')}
              disabled={loading}
              className="flex-1 text-blue-600 hover:text-blue-700"
              title="إنشاء وتصدير لجوجل درايف"
            >
              <svg className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.826 10.045L10.04 4L17.178 15.045L13.962 21.045z"/>
                <path d="M2.864 15.045H9.996L7.43 19.5z"/>
                <path d="M14.864 15.045H22L18.784 21.045z"/>
              </svg>
              درايف
            </Button>
          </div>
        </div>

        {/* تحذير إذا لم توجد نسخ */}
        {systemInfo.totalBackups === 0 && (
          <div className="text-center p-4 border border-orange-200 bg-orange-50 rounded-lg">
            <AlertCircle className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <div className="text-sm text-orange-800 font-medium">
              لا توجد نسخ احتياطية
            </div>
            <div className="text-xs text-orange-700 mt-1">
              ننصح بإنشاء نسخة احتياطية لحماية بياناتك
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}