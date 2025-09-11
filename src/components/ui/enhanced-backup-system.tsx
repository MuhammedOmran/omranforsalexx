import { useState, useCallback, useRef } from 'react';
import { 
  Download, Upload, RefreshCw, AlertCircle, CheckCircle, 
  Lock, Unlock, Zap, HardDrive, Cloud, Share2, FileText,
  Shield, Database, Settings, Eye, EyeOff, Wifi, WifiOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { BackupManager } from '@/utils/backupManager';
import { AdvancedEncryption, AdvancedCompression, DataIntegrity } from '@/utils/advancedBackupManager';

interface EnhancedBackupSystemProps {
  className?: string;
}

export function EnhancedBackupSystem({ className }: EnhancedBackupSystemProps) {
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [backupList, setBackupList] = useState<any[]>([]);
  const [selectedBackup, setSelectedBackup] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // إعدادات النسخ الاحتياطي
  const [backupSettings, setBackupSettings] = useState({
    name: '',
    description: '',
    includeSettings: true,
    includeSalesData: true,
    includePurchasesData: true,
    includeInventoryData: true,
    includeCustomersData: true,
    includeEmployeesData: true,
    includeFinancialData: true,
    includeInvestorsData: true,
    includeUserActivity: false,
    includeAuditTrail: false,
    includeBinaryData: false,
    compress: true,
    compressionLevel: 'balanced' as 'fast' | 'balanced' | 'maximum',
    encrypt: false,
    encryptionKey: '',
    generateSecureKey: false
  });

  // إعدادات التصدير
  const [exportSettings, setExportSettings] = useState({
    format: 'json' as 'json' | 'encrypted' | 'compressed',
    includeMetadata: true,
    splitLargeFiles: false,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    exportType: 'file' as 'file' | 'whatsapp' | 'drive' | 'dropbox' | 'onedrive' | 'email'
  });

  const backupManager = BackupManager.getInstance();

  // تحميل قائمة النسخ الاحتياطية
  const loadBackupList = useCallback(async () => {
    try {
      const list = await backupManager.getBackupsList();
      setBackupList(list);
    } catch (error) {
      console.error('Failed to load backup list:', error);
    }
  }, [backupManager]);

  // تحميل قائمة النسخ عند بداية المكون
  useState(() => {
    loadBackupList();
  });

  // إنشاء نسخة احتياطية محسنة
  const createEnhancedBackup = useCallback(async () => {
    if (!backupSettings.name.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم للنسخة الاحتياطية",
        variant: "destructive",
      });
      return;
    }

    if (backupSettings.encrypt && !backupSettings.encryptionKey && !backupSettings.generateSecureKey) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال كلمة مرور للتشفير أو تفعيل توليد كلمة مرور آمنة",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingBackup(true);
    setBackupProgress(0);

    try {
      // توليد كلمة مرور آمنة إذا كان مطلوباً
      let encryptionKey = backupSettings.encryptionKey;
      if (backupSettings.encrypt && backupSettings.generateSecureKey) {
        encryptionKey = AdvancedEncryption.generateSecurePassword(32);
        toast({
          title: "كلمة المرور المولدة",
          description: `كلمة المرور: ${encryptionKey}`,
          duration: 10000,
        });
      }

      setBackupProgress(20);

      // إنشاء النسخة الاحتياطية
      const result = await backupManager.createBackup(
        backupSettings.name,
        backupSettings.description,
        {
          ...backupSettings,
          encryptionKey
        }
      );

      setBackupProgress(80);

      if (result.success) {
        setBackupProgress(100);
        toast({
          title: "نجح إنشاء النسخة الاحتياطية",
          description: `تم إنشاء النسخة "${backupSettings.name}" بنجاح`,
        });

        // إعادة تعيين النموذج
        setBackupSettings(prev => ({
          ...prev,
          name: '',
          description: '',
          encryptionKey: ''
        }));

        // تحديث القائمة
        await loadBackupList();
      } else {
        throw new Error(result.error || 'فشل غير معروف');
      }

    } catch (error) {
      console.error('Backup creation failed:', error);
      toast({
        title: "خطأ في إنشاء النسخة الاحتياطية",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setIsCreatingBackup(false);
      setTimeout(() => setBackupProgress(0), 2000);
    }
  }, [backupSettings, backupManager, loadBackupList, toast]);

  // استعادة نسخة احتياطية
  const restoreBackup = useCallback(async () => {
    if (!selectedBackup) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار نسخة احتياطية للاستعادة",
        variant: "destructive",
      });
      return;
    }

    const confirmed = window.confirm(
      'هل أنت متأكد من استعادة هذه النسخة الاحتياطية؟\nسيتم استبدال البيانات الحالية.'
    );

    if (!confirmed) return;

    setIsRestoringBackup(true);

    try {
      const result = await backupManager.restoreBackup(selectedBackup, {
        overwriteExisting: true,
        mergeData: false,
        restoreSettings: true,
        createBackupBeforeRestore: true
      });

      if (result.success) {
        toast({
          title: "تم استعادة النسخة الاحتياطية",
          description: "تم استعادة البيانات بنجاح",
        });

        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(result.error || 'فشل في الاستعادة');
      }

    } catch (error) {
      console.error('Restore failed:', error);
      toast({
        title: "خطأ في استعادة النسخة الاحتياطية",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setIsRestoringBackup(false);
    }
  }, [selectedBackup, backupManager, toast]);

  // تصدير نسخة احتياطية
  const exportBackup = useCallback(async (backupId: string) => {
    try {
      const result = await backupManager.exportBackup(
        backupId,
        exportSettings.exportType,
        {
          format: exportSettings.format,
          includeMetadata: exportSettings.includeMetadata,
          splitLargeFiles: exportSettings.splitLargeFiles,
          maxFileSize: exportSettings.maxFileSize
        }
      );

      if (result.success) {
        toast({
          title: "تم تصدير النسخة الاحتياطية",
          description: `تم تصدير النسخة بصيغة ${exportSettings.format} بنجاح`,
        });
      } else {
        throw new Error(result.error || 'فشل التصدير');
      }

    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "خطأ في التصدير",
        description: error.message || "حدث خطأ في تصدير النسخة الاحتياطية",
        variant: "destructive",
      });
    }
  }, [exportSettings, backupManager, toast]);

  // استيراد نسخة احتياطية
  const importBackup = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await backupManager.importBackup(file);
      
      if (result.success) {
        toast({
          title: "تم استيراد النسخة الاحتياطية",
          description: "تم استيراد النسخة الاحتياطية بنجاح",
        });
        
        await loadBackupList();
      } else {
        throw new Error(result.error || 'فشل الاستيراد');
      }

    } catch (error) {
      console.error('Import failed:', error);
      toast({
        title: "خطأ في الاستيراد",
        description: error.message || "حدث خطأ في استيراد النسخة الاحتياطية",
        variant: "destructive",
      });
    } finally {
      // إعادة تعيين input
      event.target.value = '';
    }
  }, [backupManager, loadBackupList, toast]);

  // حذف نسخة احتياطية
  const deleteBackup = useCallback(async (backupId: string) => {
    const confirmed = window.confirm('هل أنت متأكد من حذف هذه النسخة الاحتياطية؟');
    if (!confirmed) return;

    try {
      const success = await backupManager.deleteBackup(backupId);
      if (success) {
        toast({
          title: "تم حذف النسخة الاحتياطية",
          description: "تم حذف النسخة الاحتياطية بنجاح",
        });
        await loadBackupList();
      }
    } catch (error) {
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء حذف النسخة الاحتياطية",
        variant: "destructive",
      });
    }
  }, [backupManager, loadBackupList, toast]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          نظام النسخ الاحتياطي المتقدم
        </CardTitle>
        <CardDescription>
          إنشاء واستعادة وإدارة النسخ الاحتياطية مع تشفير وضغط متقدم
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="create">إنشاء</TabsTrigger>
            <TabsTrigger value="restore">استعادة</TabsTrigger>
            <TabsTrigger value="manage">إدارة</TabsTrigger>
            <TabsTrigger value="export">تصدير</TabsTrigger>
          </TabsList>

          {/* تبويب إنشاء النسخة الاحتياطية */}
          <TabsContent value="create" className="space-y-6">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* المعلومات الأساسية */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">المعلومات الأساسية</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="backup-name">اسم النسخة الاحتياطية</Label>
                  <Input
                    id="backup-name"
                    placeholder="مثل: نسخة احتياطية يومية"
                    value={backupSettings.name}
                    onChange={(e) => setBackupSettings(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backup-description">الوصف (اختياري)</Label>
                  <Input
                    id="backup-description"
                    placeholder="وصف قصير للنسخة الاحتياطية"
                    value={backupSettings.description}
                    onChange={(e) => setBackupSettings(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                {/* خيارات الضغط */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="compress"
                      checked={backupSettings.compress}
                      onCheckedChange={(checked) => setBackupSettings(prev => ({ ...prev, compress: checked }))}
                    />
                    <Label htmlFor="compress" className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      ضغط البيانات
                    </Label>
                  </div>

                  {backupSettings.compress && (
                    <div className="mr-6 space-y-2">
                      <Label>مستوى الضغط</Label>
                      <Select
                        value={backupSettings.compressionLevel}
                        onValueChange={(value: 'fast' | 'balanced' | 'maximum') => 
                          setBackupSettings(prev => ({ ...prev, compressionLevel: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fast">سريع (ضغط أقل)</SelectItem>
                          <SelectItem value="balanced">متوازن (موصى به)</SelectItem>
                          <SelectItem value="maximum">أقصى ضغط (أبطأ)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* خيارات التشفير */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="encrypt"
                      checked={backupSettings.encrypt}
                      onCheckedChange={(checked) => setBackupSettings(prev => ({ ...prev, encrypt: checked }))}
                    />
                    <Label htmlFor="encrypt" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      تشفير النسخة الاحتياطية
                    </Label>
                  </div>

                  {backupSettings.encrypt && (
                    <div className="mr-6 space-y-3">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="generate-key"
                          checked={backupSettings.generateSecureKey}
                          onCheckedChange={(checked) => setBackupSettings(prev => ({ ...prev, generateSecureKey: checked }))}
                        />
                        <Label htmlFor="generate-key">توليد كلمة مرور آمنة تلقائياً</Label>
                      </div>

                      {!backupSettings.generateSecureKey && (
                        <div className="space-y-2">
                          <Label>كلمة المرور للتشفير</Label>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="أدخل كلمة مرور قوية"
                              value={backupSettings.encryptionKey}
                              onChange={(e) => setBackupSettings(prev => ({ ...prev, encryptionKey: e.target.value }))}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* البيانات المضمنة */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">البيانات المضمنة</h3>
                
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { key: 'includeSettings', label: 'الإعدادات العامة', icon: Settings },
                    { key: 'includeSalesData', label: 'بيانات المبيعات', icon: Database },
                    { key: 'includePurchasesData', label: 'بيانات المشتريات', icon: Database },
                    { key: 'includeInventoryData', label: 'بيانات المخزون', icon: Database },
                    { key: 'includeCustomersData', label: 'بيانات العملاء', icon: Database },
                    { key: 'includeEmployeesData', label: 'بيانات الموظفين', icon: Database },
                    { key: 'includeFinancialData', label: 'البيانات المالية', icon: Database },
                    { key: 'includeInvestorsData', label: 'بيانات المستثمرين', icon: Database },
                    { key: 'includeUserActivity', label: 'نشاط المستخدمين', icon: Database },
                    { key: 'includeAuditTrail', label: 'سجل التدقيق', icon: Database },
                    { key: 'includeBinaryData', label: 'الملفات والصور', icon: Database }
                  ].map(({ key, label, icon: Icon }) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Switch
                        id={key}
                        checked={backupSettings[key]}
                        onCheckedChange={(checked) => 
                          setBackupSettings(prev => ({ ...prev, [key]: checked }))
                        }
                      />
                      <Label htmlFor={key} className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Separator />

            <Button
              onClick={createEnhancedBackup}
              disabled={isCreatingBackup || !backupSettings.name.trim()}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              إنشاء النسخة الاحتياطية المتقدمة
            </Button>
          </TabsContent>

          {/* تبويب استعادة النسخة الاحتياطية */}
          <TabsContent value="restore" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">استعادة من النسخ المحفوظة</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="restore-backup">اختر النسخة للاستعادة</Label>
                  <Select value={selectedBackup} onValueChange={setSelectedBackup}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نسخة احتياطية" />
                    </SelectTrigger>
                    <SelectContent>
                      {backupList.map((backup) => (
                        <SelectItem key={backup.id} value={backup.id}>
                          {backup.name} - {new Date(backup.createdAt).toLocaleDateString('ar-SA')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={restoreBackup}
                  disabled={isRestoringBackup || !selectedBackup}
                  className="w-full"
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  استعادة النسخة الاحتياطية
                </Button>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">استيراد من ملف</h3>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".omran,.json,.backup"
                  onChange={importBackup}
                  className="hidden"
                />
                
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isRestoringBackup}
                  className="w-full"
                  variant="outline"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  استيراد نسخة احتياطية من ملف
                </Button>

                <div className="text-sm text-muted-foreground">
                  <p>الصيغ المدعومة:</p>
                  <ul className="list-disc list-inside">
                    <li>.omran (صيغة عمران الأصلية)</li>
                    <li>.json (صيغة JSON)</li>
                    <li>.backup (نسخة احتياطية عامة)</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* تبويب إدارة النسخ الاحتياطية */}
          <TabsContent value="manage" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">النسخ الاحتياطية المحفوظة</h3>
              <Button onClick={loadBackupList} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                تحديث
              </Button>
            </div>

            <div className="space-y-4">
              {backupList.length > 0 ? (
                backupList.map((backup) => (
                  <Card key={backup.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{backup.name}</h4>
                            {backup.isAutomatic ? (
                              <Badge variant="secondary">تلقائي</Badge>
                            ) : (
                              <Badge variant="default">يدوي</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(backup.createdAt).toLocaleString('ar-SA')} • {formatFileSize(backup.size)}
                          </p>
                          {backup.description && (
                            <p className="text-sm text-muted-foreground">{backup.description}</p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>الإصدار: {backup.version}</span>
                            <span>•</span>
                            <span>البيانات: {backup.dataTypes.join(', ')}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedBackup(backup.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => exportBackup(backup.id)}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteBackup(backup.id)}
                          >
                            <AlertCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد نسخ احتياطية محفوظة</p>
                  <p className="text-sm">قم بإنشاء نسخة احتياطية أولاً</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* تبويب خيارات التصدير */}
          <TabsContent value="export" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">إعدادات التصدير</h3>
                
                <div className="space-y-2">
                  <Label>صيغة التصدير</Label>
                  <Select
                    value={exportSettings.format}
                    onValueChange={(value: 'json' | 'encrypted' | 'compressed') => 
                      setExportSettings(prev => ({ ...prev, format: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON عادي</SelectItem>
                      <SelectItem value="compressed">مضغوط</SelectItem>
                      <SelectItem value="encrypted">مشفر ومضغوط</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>وجهة التصدير</Label>
                  <Select
                    value={exportSettings.exportType}
                    onValueChange={(value: 'file' | 'whatsapp' | 'drive' | 'dropbox' | 'onedrive' | 'email') => 
                      setExportSettings(prev => ({ ...prev, exportType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="file">تحميل ملف</SelectItem>
                      <SelectItem value="whatsapp">مشاركة WhatsApp</SelectItem>
                      <SelectItem value="drive">Google Drive</SelectItem>
                      <SelectItem value="dropbox">Dropbox</SelectItem>
                      <SelectItem value="onedrive">OneDrive</SelectItem>
                      <SelectItem value="email">إرسال بالإيميل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="include-metadata"
                    checked={exportSettings.includeMetadata}
                    onCheckedChange={(checked) => setExportSettings(prev => ({ ...prev, includeMetadata: checked }))}
                  />
                  <Label htmlFor="include-metadata">تضمين البيانات الوصفية</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="split-files"
                    checked={exportSettings.splitLargeFiles}
                    onCheckedChange={(checked) => setExportSettings(prev => ({ ...prev, splitLargeFiles: checked }))}
                  />
                  <Label htmlFor="split-files">تقسيم الملفات الكبيرة</Label>
                </div>

                {exportSettings.splitLargeFiles && (
                  <div className="mr-6 space-y-2">
                    <Label>الحد الأقصى لحجم الملف (MB)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={exportSettings.maxFileSize / (1024 * 1024)}
                      onChange={(e) => setExportSettings(prev => ({ 
                        ...prev, 
                        maxFileSize: parseInt(e.target.value) * 1024 * 1024 
                      }))}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">خيارات التصدير السريع</h3>
                
                <div className="grid grid-cols-1 gap-3">
                  <Button variant="outline" className="justify-start">
                    <HardDrive className="h-4 w-4 mr-2" />
                    تصدير للحاسوب المحلي
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Cloud className="h-4 w-4 mr-2" />
                    رفع للتخزين السحابي
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Share2 className="h-4 w-4 mr-2" />
                    مشاركة عبر التطبيقات
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Wifi className="h-4 w-4 mr-2" />
                    إرسال عبر الشبكة
                  </Button>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium">ملاحظات مهمة:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• النسخ المشفرة تحتاج كلمة مرور للفتح</li>
                    <li>• الملفات المضغوطة توفر مساحة أكبر</li>
                    <li>• التقسيم مفيد للملفات الكبيرة</li>
                    <li>• احتفظ بنسخة محلية دائماً</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* تحذيرات أمنية */}
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                نصائح أمنية مهمة
              </p>
              <ul className="text-yellow-700 dark:text-yellow-300 mt-1 space-y-1">
                <li>• احتفظ بكلمات مرور التشفير في مكان آمن</li>
                <li>• قم بإنشاء نسخ احتياطية دورية (أسبوعياً على الأقل)</li>
                <li>• احفظ النسخ في أماكن متعددة (محلي + سحابي)</li>
                <li>• اختبر استعادة النسخ الاحتياطية بشكل دوري</li>
                <li>• لا تشارك النسخ المشفرة مع أشخاص غير موثوقين</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}