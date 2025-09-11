import { useState, useCallback, useEffect } from 'react';
import { Download, Upload, RefreshCw, AlertCircle, CheckCircle, Clock, Settings, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { exportUserData, importUserData, DataTypes } from '@/utils/userDataManager';
import { ElectronBackupManager } from '@/utils/electronBackupManager';
import { useAppSettings } from "@/hooks/useAppSettings";

interface BackupSettings {
  autoBackup: boolean;
  backupInterval: 'daily' | 'weekly' | 'monthly';
  maxBackups: number;
  enableCompression: boolean;
  enableEncryption: boolean;
  includeSettings: boolean;
}

interface BackupSystemProps {
  className?: string;
}

export function BackupSystem({ className }: BackupSystemProps) {
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [lastBackup, setLastBackup] = useState<Date | null>(null);
  const [backupProgress, setBackupProgress] = useState(0);
  const [backupSettings, setBackupSettings] = useState<BackupSettings>({
    autoBackup: true,
    backupInterval: 'weekly',
    maxBackups: 10,
    enableCompression: true,
    enableEncryption: false,
    includeSettings: true
  });
  const { toast } = useToast();
  const { loading, getCategorySettings, setCategorySettings } = useAppSettings();

  // إنشاء نسخة احتياطية
  const createBackup = useCallback(async () => {
    setIsCreatingBackup(true);
    setBackupProgress(0);

    try {
      setBackupProgress(20);
      
      // استخدام ElectronBackupManager إذا كان متوفراً
      if (window.electronAPI) {
        const result = await ElectronBackupManager.createFullBackup();
        if (result.success) {
          setLastBackup(new Date());
          localStorage.setItem('last_backup', new Date().toISOString());
        }
        return;
      }

      // النسخ الاحتياطي العادي للمتصفح
      const userData = exportUserData();
      setBackupProgress(60);

      const backupData = {
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        type: 'user_data_backup',
        settings: backupSettings,
        data: userData,
        checksum: await generateChecksum(userData)
      };

      setBackupProgress(80);

      // تحويل البيانات إلى JSON وتنزيلها
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `omran-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setBackupProgress(100);
      setLastBackup(new Date());

      // حفظ آخر موعد نسخ احتياطي
      localStorage.setItem('last_backup', new Date().toISOString());

      toast({
        title: "تم إنشاء النسخة الاحتياطية",
        description: "تم تحميل النسخة الاحتياطية بنجاح",
      });

    } catch (error) {
      console.error('Backup error:', error);
      toast({
        title: "خطأ في إنشاء النسخة الاحتياطية",
        description: "حدث خطأ أثناء إنشاء النسخة الاحتياطية",
        variant: "destructive",
      });
    } finally {
      setIsCreatingBackup(false);
      setTimeout(() => setBackupProgress(0), 2000);
    }
  }, [toast, backupSettings]);

  // استرجاع النسخة الاحتياطية
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsRestoringBackup(true);

    try {
      // استخدام ElectronBackupManager إذا كان متوفراً
      if (window.electronAPI) {
        const result = await ElectronBackupManager.importBackup(file);
        if (result.success) {
          window.location.reload();
        }
        return;
      }

      const text = await file.text();
      const backupData = JSON.parse(text);

      // التحقق من صحة النسخة الاحتياطية
      if (!backupData.data || !backupData.timestamp) {
        throw new Error('صيغة ملف النسخة الاحتياطية غير صحيحة');
      }

      // التحقق من checksum إذا متوفر
      if (backupData.checksum) {
        const calculatedChecksum = await generateChecksum(backupData.data);
        if (calculatedChecksum !== backupData.checksum) {
          throw new Error('الملف تالف أو تم تعديله');
        }
      }

      // تأكيد الاستعادة
      const confirmed = window.confirm(
        `هل أنت متأكد من استعادة النسخة الاحتياطية؟\nتاريخ النسخة: ${new Date(backupData.timestamp).toLocaleDateString('ar-SA', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          calendar: 'gregory' 
        })}\nسيتم استبدال البيانات الحالية.`
      );

      if (!confirmed) {
        setIsRestoringBackup(false);
        return;
      }

      // استعادة البيانات
      importUserData(backupData.data);

      toast({
        title: "تم استعادة النسخة الاحتياطية",
        description: "تم استعادة البيانات بنجاح. يُرجى إعادة تحميل الصفحة",
      });

      // إعادة تحميل الصفحة بعد 3 ثوانٍ
      setTimeout(() => {
        window.location.reload();
      }, 3000);

    } catch (error) {
      console.error('Restore error:', error);
      toast({
        title: "خطأ في استعادة النسخة الاحتياطية",
        description: error instanceof Error ? error.message : "تأكد من صحة ملف النسخة الاحتياطية",
        variant: "destructive",
      });
    } finally {
      setIsRestoringBackup(false);
      // إعادة تعيين input
      event.target.value = '';
    }
  }, [toast]);

  // تحميل الإعدادات والبيانات
  useEffect(() => {
    const lastBackupDate = localStorage.getItem('last_backup');
    if (lastBackupDate) {
      setLastBackup(new Date(lastBackupDate));
    }
    
    loadBackupSettings();
  }, []);

  const loadBackupSettings = async () => {
    try {
      const savedSettings = await getCategorySettings('backup');
      if (Object.keys(savedSettings).length > 0) {
        setBackupSettings({ ...backupSettings, ...savedSettings });
      } else {
        // إذا لم توجد إعدادات في Supabase، تحميل من localStorage للمرة الأولى
        const savedLocalSettings = localStorage.getItem('backup_settings');
        if (savedLocalSettings) {
          const parsedSettings = JSON.parse(savedLocalSettings);
          setBackupSettings(parsedSettings);
          // حفظ في Supabase للمرة الأولى
          await setCategorySettings('backup', parsedSettings);
        }
      }
    } catch (error) {
      console.error('خطأ في تحميل إعدادات النسخ الاحتياطي:', error);
      // fallback إلى localStorage في حالة الخطأ
      const savedLocalSettings = localStorage.getItem('backup_settings');
      if (savedLocalSettings) {
        try {
          setBackupSettings(JSON.parse(savedLocalSettings));
        } catch (parseError) {
          console.error('خطأ في تحميل الإعدادات المحلية:', parseError);
        }
      }
    }
  };

  // حفظ الإعدادات عند التغيير
  useEffect(() => {
    const saveSettings = async () => {
      try {
        await setCategorySettings('backup', backupSettings);
        // حفظ في localStorage كـ backup
        localStorage.setItem('backup_settings', JSON.stringify(backupSettings));
      } catch (error) {
        console.error('خطأ في حفظ إعدادات النسخ الاحتياطي:', error);
        // في حالة الخطأ، احفظ في localStorage فقط
        localStorage.setItem('backup_settings', JSON.stringify(backupSettings));
      }
    };
    
    saveSettings();
  }, [backupSettings, setCategorySettings]);

  // نسخ احتياطية تلقائية
  const scheduleAutoBackup = useCallback(() => {
    const lastBackupDate = localStorage.getItem('last_backup');
    const now = new Date();
    
    if (!lastBackupDate) {
      // لا توجد نسخة احتياطية سابقة
      return;
    }

    const lastBackup = new Date(lastBackupDate);
    const daysSinceLastBackup = Math.floor((now.getTime() - lastBackup.getTime()) / (1000 * 60 * 60 * 24));

    // إنشاء نسخة احتياطية كل 7 أيام
    if (daysSinceLastBackup >= 7) {
      toast({
        title: "تذكير: النسخ الاحتياطي",
        description: "لم يتم إنشاء نسخة احتياطية منذ أكثر من أسبوع",
        action: (
          <Button size="sm" onClick={createBackup}>
            إنشاء نسخة احتياطية
          </Button>
        ),
      });
    }
  }, [createBackup, toast]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          النسخ الاحتياطي
        </CardTitle>
        <CardDescription>
          إنشاء واستعادة النسخ الاحتياطية للبيانات
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* معلومات آخر نسخة احتياطية */}
        {lastBackup && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium">آخر نسخة احتياطية</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDate(lastBackup)}
            </p>
          </div>
        )}

        {/* شريط التقدم */}
        {(isCreatingBackup || isRestoringBackup) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>
                {isCreatingBackup ? 'جاري إنشاء النسخة الاحتياطية...' : 'جاري استعادة النسخة الاحتياطية...'}
              </span>
              <span>{backupProgress}%</span>
            </div>
            <Progress value={backupProgress} className="h-2" />
          </div>
        )}

        {/* إعدادات النسخ الاحتياطي */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="h-5 w-5" />
            إعدادات النسخ الاحتياطي
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* النسخ التلقائي */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-backup">النسخ الاحتياطي التلقائي</Label>
                <Switch
                  id="auto-backup"
                  checked={backupSettings.autoBackup}
                  onCheckedChange={(checked) => 
                    setBackupSettings(prev => ({...prev, autoBackup: checked}))
                  }
                />
              </div>
              
              {backupSettings.autoBackup && (
                <div>
                  <Label>تكرار النسخ</Label>
                  <select 
                    value={backupSettings.backupInterval}
                    onChange={(e) => setBackupSettings(prev => ({
                      ...prev, 
                      backupInterval: e.target.value as 'daily' | 'weekly' | 'monthly'
                    }))}
                    className="w-full p-2 border rounded mt-1"
                  >
                    <option value="daily">يومياً</option>
                    <option value="weekly">أسبوعياً</option>
                    <option value="monthly">شهرياً</option>
                  </select>
                </div>
              )}
            </div>

            {/* خيارات متقدمة */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="compression">ضغط البيانات</Label>
                <Switch
                  id="compression"
                  checked={backupSettings.enableCompression}
                  onCheckedChange={(checked) => 
                    setBackupSettings(prev => ({...prev, enableCompression: checked}))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="encryption">تشفير النسخة الاحتياطية</Label>
                <Switch
                  id="encryption"
                  checked={backupSettings.enableEncryption}
                  onCheckedChange={(checked) => 
                    setBackupSettings(prev => ({...prev, enableEncryption: checked}))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="include-settings">تضمين الإعدادات</Label>
                <Switch
                  id="include-settings"
                  checked={backupSettings.includeSettings}
                  onCheckedChange={(checked) => 
                    setBackupSettings(prev => ({...prev, includeSettings: checked}))
                  }
                />
              </div>
            </div>
          </div>

          <Separator />
        </div>

        {/* الإجراءات */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* إنشاء نسخة احتياطية */}
          <Button
            onClick={createBackup}
            disabled={isCreatingBackup || isRestoringBackup}
            className="h-16 flex-col gap-2"
            variant="outline"
          >
            <Download className="h-5 w-5" />
            <span>إنشاء نسخة احتياطية</span>
          </Button>

          {/* استعادة نسخة احتياطية */}
          <div>
            <input
              type="file"
              accept=".json,.oab"
              onChange={handleFileUpload}
              disabled={isCreatingBackup || isRestoringBackup}
              className="hidden"
              id="backup-upload"
            />
            <Button
              asChild
              disabled={isCreatingBackup || isRestoringBackup}
              className="h-16 flex-col gap-2 w-full"
              variant="outline"
            >
              <label htmlFor="backup-upload" className="cursor-pointer">
                <Upload className="h-5 w-5" />
                <span>استعادة نسخة احتياطية</span>
              </label>
            </Button>
          </div>
        </div>

        {/* تحذيرات وملاحظات */}
        <div className="space-y-3">
          <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                تحذير مهم
              </p>
              <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                استعادة النسخة الاحتياطية ستحل محل البيانات الحالية. تأكد من إنشاء نسخة احتياطية من البيانات الحالية قبل الاستعادة.
              </p>
            </div>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>• يُنصح بإنشاء نسخة احتياطية أسبوعياً على الأقل</p>
            <p>• احتفظ بالنسخ الاحتياطية في مكان آمن خارج الجهاز</p>
            <p>• تأكد من اختبار النسخ الاحتياطية بشكل دوري</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// وظائف مساعدة
async function generateChecksum(data: any): Promise<string> {
  const dataString = JSON.stringify(data);
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(dataString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Hook لاستخدام النسخ الاحتياطي التلقائي
export function useAutoBackup() {
  const { toast } = useToast();

  const checkAutoBackup = useCallback(() => {
    const lastBackupDate = localStorage.getItem('last_backup');
    const settingsStr = localStorage.getItem('backup_settings');
    
    if (!lastBackupDate || !settingsStr) return;

    try {
      const settings = JSON.parse(settingsStr);
      if (!settings.autoBackup) return;

      const lastBackup = new Date(lastBackupDate);
      const now = new Date();
      const daysSinceLastBackup = Math.floor((now.getTime() - lastBackup.getTime()) / (1000 * 60 * 60 * 24));

      let intervalDays = 7; // افتراضي أسبوعي
      switch (settings.backupInterval) {
        case 'daily': intervalDays = 1; break;
        case 'weekly': intervalDays = 7; break;
        case 'monthly': intervalDays = 30; break;
      }

      if (daysSinceLastBackup >= intervalDays) {
        setTimeout(() => {
          toast({
            title: "تذكير: النسخ الاحتياطي",
            description: `لم يتم إنشاء نسخة احتياطية منذ ${daysSinceLastBackup} يوم`,
            duration: 10000,
          });
        }, 5000);
      }
    } catch (error) {
      console.error('خطأ في فحص النسخ الاحتياطي التلقائي:', error);
    }
  }, [toast]);

  return { checkAutoBackup };
}