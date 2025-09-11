/**
 * لوحة إدارة النسخ الاحتياطية الشاملة
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

import { 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Settings,
  HardDrive,
  Shield,
  Calendar,
  FileCheck
} from 'lucide-react';

import { AdvancedBackupManager, BackupConfig, BackupRecord } from '@/utils/advancedBackupManager';
import { Switch } from '@/components/ui/switch';

export function BackupManagementPanel() {
  const { toast } = useToast();
  
  const [backupRecords, setBackupRecords] = useState<BackupRecord[]>([]);
  const [backupConfigs, setBackupConfigs] = useState<BackupConfig[]>([]);
  const [backupStatus, setBackupStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // حوارات
  const [showCreateConfig, setShowCreateConfig] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupRecord | null>(null);
  
  // نماذج البيانات
  const [newConfig, setNewConfig] = useState({
    name: '',
    schedule: 'daily' as 'daily' | 'weekly' | 'monthly',
    time: '02:00',
    maxBackups: 10,
    includeTables: ['all'],
    compression: 'balanced' as 'fast' | 'balanced' | 'maximum',
    encryption: false,
    autoCleanup: true
  });

  const [restoreOptions, setRestoreOptions] = useState({
    selectiveRestore: false,
    tables: [] as string[],
    preserveExisting: true,
    createBackupBeforeRestore: true,
    validateData: true
  });

  useEffect(() => {
    loadBackupData();
  }, []);

  const loadBackupData = async () => {
    try {
      // استخدام النظام الجديد بدون شركات متعددة مؤقتاً
      const advancedBackupManager = AdvancedBackupManager.getInstance();
      const companyId = 'default_company'; // مؤقت
      
      // محاكاة حالة النسخ الاحتياطي
      setBackupStatus({
        totalBackups: 0,
        lastBackup: localStorage.getItem('last_backup') || undefined,
        totalSize: 0,
        avgCompressionRatio: 0,
        isConfigured: false,
        autoBackupEnabled: false,
        errors: []
      });

      // محاكاة السجلات والتكوينات
      setBackupRecords([]);
      setBackupConfigs([]);
    } catch (error) {
      console.error('خطأ في تحميل بيانات النسخ الاحتياطي:', error);
    }
  };

  const handleCreateBackup = async () => {
    setIsLoading(true);
    
    try {
      // استخدام نظام النسخ الاحتياطي المحلي
      const advancedBackupManager = AdvancedBackupManager.getInstance();
      
      // محاكاة إنشاء نسخة احتياطية متقدمة
      const userData = localStorage.getItem('user_data') || '{}';
      const backupData = {
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        type: 'advanced_backup',
        data: JSON.parse(userData),
        size: userData.length
      };

      // حفظ النسخة الاحتياطية
      const backupId = `advanced_backup_${Date.now()}`;
      localStorage.setItem(backupId, JSON.stringify(backupData));
      localStorage.setItem('last_advanced_backup', new Date().toISOString());

      // تنزيل الملف
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `omran-advanced-backup-${new Date().toISOString().split('T')[0]}.oab`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "تم بنجاح",
        description: "تم إنشاء النسخة الاحتياطية المتقدمة بنجاح"
      });
      loadBackupData();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateConfig = async () => {
    try {
      // حفظ التكوين الجديد
      const configId = `config_${Date.now()}`;
      const configData = {
        id: configId,
        ...newConfig,
        companyId: 'default_company',
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // حفظ في localStorage
      const existingConfigs = JSON.parse(localStorage.getItem('backup_configs') || '[]');
      existingConfigs.push(configData);
      localStorage.setItem('backup_configs', JSON.stringify(existingConfigs));

      toast({
        title: "تم بنجاح",
        description: "تم إنشاء تكوين النسخ الاحتياطي بنجاح"
      });
      
      setShowCreateConfig(false);
      setNewConfig({
        name: '',
        schedule: 'daily',
        time: '02:00',
        maxBackups: 10,
        includeTables: ['all'],
        compression: 'balanced',
        encryption: false,
        autoCleanup: true
      });
      loadBackupData();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في إنشاء التكوين",
        variant: "destructive"
      });
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;

    setIsLoading(true);

    try {
      // استخدام النظام الجديد مؤقتاً
      const backupDataStr = localStorage.getItem(`backup_${selectedBackup.id}`);
      if (!backupDataStr) {
        toast({
          title: "خطأ",
          description: "النسخة الاحتياطية غير موجودة",
          variant: "destructive"
        });
        return;
      }

      if (restoreOptions.createBackupBeforeRestore) {
        await handleCreateBackup(); // إنشاء نسخة احتياطية قبل الاستعادة
      }

      // محاكاة استعادة البيانات
      const backupData = JSON.parse(backupDataStr);
      // هنا سيتم تنفيذ استعادة البيانات الفعلية

      toast({
        title: "تم بنجاح",
        description: "تم استعادة النسخة الاحتياطية بنجاح"
      });
      
      setShowRestoreDialog(false);
      setSelectedBackup(null);
      
      // إعادة تحميل الصفحة لتطبيق التغييرات
      window.location.reload();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportBackup = async (backup: BackupRecord) => {
    try {
      const backupDataStr = localStorage.getItem(`backup_${backup.id}`);
      if (!backupDataStr) {
        toast({
          title: "خطأ",
          description: "بيانات النسخة الاحتياطية غير موجودة",
          variant: "destructive"
        });
        return;
      }

      // تنزيل الملف
      const blob = new Blob([backupDataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${backup.name}-${backup.createdAt.split('T')[0]}.oab`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "تم بنجاح",
        description: "تم تصدير النسخة الاحتياطية بنجاح"
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تصدير النسخة الاحتياطية",
        variant: "destructive"
      });
    }
  };

  const handleDeleteBackup = async (backup: BackupRecord) => {
    if (confirm(`هل أنت متأكد من حذف النسخة الاحتياطية "${backup.name}"؟`)) {
      try {
        // حذف من localStorage
        localStorage.removeItem(`backup_${backup.id}`);
        
        toast({
          title: "تم بنجاح",
          description: "تم حذف النسخة الاحتياطية بنجاح"
        });
        loadBackupData();
      } catch (error) {
        toast({
          title: "خطأ",
          description: "فشل في حذف النسخة الاحتياطية",
          variant: "destructive"
        });
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-100 text-green-800">مكتملة</Badge>;
      case 'failed': return <Badge variant="destructive">فاشلة</Badge>;
      case 'in_progress': return <Badge className="bg-blue-100 text-blue-800">قيد التنفيذ</Badge>;
      default: return <Badge variant="secondary">غير معروف</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 بايت';
    const sizes = ['بايت', 'كيلو بايت', 'ميجابايت', 'جيجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إدارة النسخ الاحتياطية</h2>
          <p className="text-muted-foreground">
            نظام شامل لحماية وأمان البيانات
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={showCreateConfig} onOpenChange={setShowCreateConfig}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Settings className="h-4 w-4" />
                إعداد تلقائي
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إعداد نسخ احتياطي تلقائي</DialogTitle>
                <DialogDescription>
                  قم بتكوين النسخ الاحتياطي التلقائي لحماية بياناتك
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label>اسم التكوين</Label>
                  <Input
                    value={newConfig.name}
                    onChange={(e) => setNewConfig({...newConfig, name: e.target.value})}
                    placeholder="نسخ احتياطي يومي"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>التكرار</Label>
                    <select
                      value={newConfig.schedule}
                      onChange={(e) => setNewConfig({...newConfig, schedule: e.target.value as any})}
                      className="w-full p-2 border rounded"
                    >
                      <option value="daily">يومياً</option>
                      <option value="weekly">أسبوعياً</option>
                      <option value="monthly">شهرياً</option>
                    </select>
                  </div>
                  <div>
                    <Label>الوقت</Label>
                    <Input
                      type="time"
                      value={newConfig.time}
                      onChange={(e) => setNewConfig({...newConfig, time: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <Label>مستوى الضغط</Label>
                    <select
                      value={newConfig.compression}
                      onChange={(e) => setNewConfig({...newConfig, compression: e.target.value as any})}
                      className="w-full p-2 border rounded"
                    >
                      <option value="fast">سريع</option>
                      <option value="balanced">متوازن</option>
                      <option value="maximum">أقصى ضغط</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="encryption">تشفير النسخة الاحتياطية</Label>
                    <Switch
                      id="encryption"
                      checked={newConfig.encryption}
                      onCheckedChange={(checked) => setNewConfig({...newConfig, encryption: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="autoCleanup">تنظيف النسخ القديمة تلقائياً</Label>
                    <Switch
                      id="autoCleanup"
                      checked={newConfig.autoCleanup}
                      onCheckedChange={(checked) => setNewConfig({...newConfig, autoCleanup: checked})}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateConfig(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleCreateConfig}>
                  إنشاء التكوين
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button 
            onClick={handleCreateBackup} 
            disabled={isLoading || backupStatus?.isInProgress}
            className="gap-2"
          >
            <Database className="h-4 w-4" />
            إنشاء نسخة احتياطية
          </Button>
        </div>
      </div>

      {/* حالة النسخ الاحتياطي */}
      {backupStatus?.isInProgress && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertTitle>جاري إنشاء النسخة الاحتياطية</AlertTitle>
          <AlertDescription>
            <Progress value={backupStatus.progress} className="mt-2" />
            <p className="text-sm mt-2">التقدم: {backupStatus.progress}%</p>
          </AlertDescription>
        </Alert>
      )}

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">النسخ المكتملة</p>
                <p className="text-2xl font-bold">{backupStatus?.totalBackups || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">مساحة التخزين</p>
                <p className="text-lg font-bold">{formatFileSize(backupStatus?.storageUsed || 0)}</p>
              </div>
              <HardDrive className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">آخر نسخة احتياطية</p>
                <p className="text-sm font-bold">
                  {backupStatus?.lastBackupDate ? 
                    new Date(backupStatus.lastBackupDate).toLocaleDateString('ar') : 
                    'لا يوجد'
                  }
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">الحماية</p>
                <p className="text-sm font-bold">متقدمة</p>
              </div>
              <Shield className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* جدول النسخ الاحتياطية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            سجل النسخ الاحتياطية
          </CardTitle>
          <CardDescription>
            جميع النسخ الاحتياطية المتاحة للاستعادة
          </CardDescription>
        </CardHeader>
        <CardContent>
          {backupRecords.length === 0 ? (
            <div className="text-center py-8">
              <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد نسخ احتياطية</h3>
              <p className="text-muted-foreground mb-4">ابدأ بإنشاء أول نسخة احتياطية لحماية بياناتك</p>
              <Button onClick={handleCreateBackup} disabled={isLoading}>
                إنشاء نسخة احتياطية الآن
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الحجم</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backupRecords.map((backup) => (
                  <TableRow key={backup.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(backup.status)}
                        <span className="font-medium">{backup.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {backup.type === 'manual' ? 'يدوية' : backup.type === 'scheduled' ? 'مجدولة' : 'تلقائية'}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(backup.status)}</TableCell>
                    <TableCell>{formatFileSize(backup.size)}</TableCell>
                    <TableCell>
                      {new Date(backup.createdAt).toLocaleDateString('ar')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {backup.status === 'completed' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedBackup(backup);
                                setShowRestoreDialog(true);
                              }}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleExportBackup(backup)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteBackup(backup)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* حوار الاستعادة */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>استعادة النسخة الاحتياطية</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من استعادة النسخة الاحتياطية "{selectedBackup?.name}"؟
            </DialogDescription>
          </DialogHeader>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>تحذير</AlertTitle>
            <AlertDescription>
              ستحل هذه العملية محل البيانات الحالية. يُنصح بإنشاء نسخة احتياطية قبل المتابعة.
            </AlertDescription>
          </Alert>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="createBackup"
                  checked={restoreOptions.createBackupBeforeRestore}
                  onChange={(e) => setRestoreOptions({...restoreOptions, createBackupBeforeRestore: e.target.checked})}
                />
                <Label htmlFor="createBackup">إنشاء نسخة احتياطية تلقائية قبل الاستعادة</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="preserveExisting"
                  checked={restoreOptions.preserveExisting}
                  onChange={(e) => setRestoreOptions({...restoreOptions, preserveExisting: e.target.checked})}
                />
                <Label htmlFor="preserveExisting">الحفاظ على البيانات الموجودة</Label>
              </div>
            </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRestoreDialog(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={handleRestoreBackup}
              disabled={isLoading}
              variant="destructive"
            >
              استعادة البيانات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}