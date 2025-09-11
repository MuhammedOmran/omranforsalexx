import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  Upload, 
  Folder, 
  Monitor, 
  Clock, 
  Shield, 
  CheckCircle,
  AlertCircle 
} from 'lucide-react';
import { ElectronBackupManager as BackupManager } from '@/utils/electronBackupManager';
import { toast } from '@/hooks/use-toast';
import { BackupSystem } from '@/components/ui/backup-system';

// مكون النسخ الاحتياطي للويب
function WebBackupSystem() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            النسخ الاحتياطي المتقدم
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              النسخ الاحتياطي المتقدم متاح الآن في إصدار الويب أيضاً
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
      
      <BackupSystem />
    </div>
  );
}

export function ElectronBackupManager() {
  const [isElectron, setIsElectron] = useState(false);
  const [machineId, setMachineId] = useState('');
  const [backupDir, setBackupDir] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  useEffect(() => {
    // جلب معلومات النظام
    const loadInfo = async () => {
      try {
        const info = await BackupManager.getBackupInfo();
        setIsElectron(info.isElectron);
        setMachineId(info.machineId);
        setBackupDir(info.backupDir);
        
        // جلب وقت آخر نسخة احتياطية
        const lastBackupTime = localStorage.getItem('last_auto_backup');
        if (lastBackupTime) {
          setLastBackup(new Date(parseInt(lastBackupTime)).toLocaleDateString('ar-SA', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            calendar: 'gregory' 
          }) + ' ' + new Date(parseInt(lastBackupTime)).toLocaleTimeString('ar-SA', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }));
        }
      } catch (error) {
        console.error('Failed to load backup info:', error);
      }
    };

    loadInfo();
  }, []);

  const handleCreateBackup = async () => {
    setIsLoading(true);
    try {
      const result = await BackupManager.createFullBackup();
      if (result.success) {
        setLastBackup(new Date().toLocaleDateString('ar-SA', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          calendar: 'gregory' 
        }) + ' ' + new Date().toLocaleTimeString('ar-SA', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }));
      }
    } catch (error) {
      console.error('Backup failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      await BackupManager.importBackup(file);
      // إعادة تحميل الصفحة لتطبيق البيانات المستوردة
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setIsLoading(false);
      // مسح اختيار الملف
      event.target.value = '';
    }
  };

  const openBackupFolder = () => {
    if (isElectron && backupDir) {
      // TODO: إضافة IPC لفتح مجلد النسخ الاحتياطية
      toast({
        title: "مجلد النسخ الاحتياطية",
        description: backupDir,
      });
    }
  };

  if (!isElectron) {
    // استخدام نظام النسخ الاحتياطي للويب
    return <WebBackupSystem />;
  }

  return (
    <div className="space-y-6">
      {/* معلومات النظام */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            معلومات النظام
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">بيئة التشغيل:</span>
            <Badge variant="secondary">إصدار سطح المكتب</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">معرف الجهاز:</span>
            <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
              {machineId.slice(0, 8)}...
            </span>
          </div>
          
          {backupDir && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">مجلد النسخ:</span>
              <Button variant="ghost" size="sm" onClick={openBackupFolder}>
                <Folder className="h-4 w-4 mr-2" />
                فتح المجلد
              </Button>
            </div>
          )}
          
          {lastBackup && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">آخر نسخة احتياطية:</span>
              <span className="text-sm flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {lastBackup}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* إدارة النسخ الاحتياطية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            إدارة النسخ الاحتياطية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* إنشاء نسخة احتياطية */}
          <div className="space-y-2">
            <Button 
              onClick={handleCreateBackup}
              disabled={isLoading}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {isLoading ? 'جاري الإنشاء...' : 'إنشاء نسخة احتياطية جديدة'}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              سيتم حفظ النسخة في مجلد المستندات/OmranBackups
            </p>
          </div>

          {/* استيراد نسخة احتياطية */}
          <div className="space-y-2">
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                disabled={isLoading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="backup-file-input"
              />
              <Button 
                variant="outline"
                disabled={isLoading}
                className="w-full"
                asChild
              >
                <label htmlFor="backup-file-input" className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  {isLoading ? 'جاري الاستيراد...' : 'استيراد نسخة احتياطية'}
                </label>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              اختر ملف .json للاستيراد (سيتم استبدال البيانات الحالية)
            </p>
          </div>

          {/* النسخ الاحتياطي التلقائي */}
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              يتم إنشاء نسخة احتياطية تلقائياً كل ساعة وعند إغلاق التطبيق
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}