/**
 * مكون إدارة النسخ الاحتياطية
 * Backup Management Component
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Download, 
  Upload, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Settings, 
  Clock, 
  Database, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Calendar,
  HardDrive,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { backupManager, BackupMetadata, BackupOptions, RestoreOptions, ScheduleOptions } from '@/utils/backupManager';

interface BackupManagerProps {
  className?: string;
}

export function BackupManager({ className }: BackupManagerProps) {
  const { toast } = useToast();
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [systemInfo, setSystemInfo] = useState({
    totalBackups: 0,
    totalSize: 0,
    lastBackup: undefined as string | undefined,
    scheduledBackups: false
  });

  // حالات النماذج
  const [newBackupDialog, setNewBackupDialog] = useState(false);
  const [restoreDialog, setRestoreDialog] = useState(false);
  const [scheduleDialog, setScheduleDialog] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupMetadata | null>(null);

  // نماذج البيانات
  const [backupForm, setBackupForm] = useState({
    name: '',
    description: '',
    options: {
      includeSettings: true,
      includeSalesData: true,
      includePurchasesData: true,
      includeInventoryData: true,
      includeCustomersData: true,
      includeEmployeesData: true,
      includeFinancialData: true,
      includeInvestorsData: true,
      compress: true,
      encrypt: false
    } as BackupOptions
  });

  const [restoreOptions, setRestoreOptions] = useState<RestoreOptions>({
    overwriteExisting: false,
    mergeData: true,
    restoreSettings: true,
    createBackupBeforeRestore: true
  });

  const [scheduleOptions, setScheduleOptions] = useState<ScheduleOptions>({
    enabled: false,
    frequency: 'weekly',
    time: '02:00',
    maxBackups: 10,
    autoCleanup: true
  });

  // تحميل البيانات
  useEffect(() => {
    loadBackups();
    loadSystemInfo();
    loadScheduleSettings();
  }, []);

  const loadBackups = async () => {
    setLoading(true);
    try {
      const backupsList = await backupManager.getBackupsList();
      setBackups(backupsList);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل قائمة النسخ الاحتياطية",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSystemInfo = () => {
    const info = backupManager.getBackupSystemInfo();
    setSystemInfo({
      ...info,
      lastBackup: info.lastBackup || undefined
    });
  };

  const loadScheduleSettings = () => {
    // تحميل إعدادات الجدولة المحفوظة
    const savedSchedule = localStorage.getItem('backup_schedule');
    if (savedSchedule) {
      setScheduleOptions(JSON.parse(savedSchedule));
    }
  };

  // إنشاء نسخة احتياطية جديدة
  const handleCreateBackup = async () => {
    if (!backupForm.name.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم للنسخة الاحتياطية",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const result = await backupManager.createBackup(
        backupForm.name,
        backupForm.description,
        backupForm.options
      );

      if (result.success) {
        toast({
          title: "تم بنجاح",
          description: "تم إنشاء النسخة الاحتياطية بنجاح"
        });
        setNewBackupDialog(false);
        setBackupForm({ name: '', description: '', options: backupForm.options });
        await loadBackups();
        loadSystemInfo();
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

  // استعادة نسخة احتياطية
  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;

    setLoading(true);
    try {
      const result = await backupManager.restoreBackup(selectedBackup.id, restoreOptions);

      if (result.success) {
        toast({
          title: "تم بنجاح",
          description: `تم استعادة ${result.restoredItems?.length || 0} عنصر بنجاح`
        });
        setRestoreDialog(false);
        setSelectedBackup(null);
        // إعادة تحميل الصفحة لضمان تطبيق التغييرات
        setTimeout(() => window.location.reload(), 1000);
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
        description: "فشل في استعادة النسخة الاحتياطية",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // حذف نسخة احتياطية
  const handleDeleteBackup = async (backupId: string) => {
    const success = await backupManager.deleteBackup(backupId);
    if (success) {
      toast({
        title: "تم الحذف",
        description: "تم حذف النسخة الاحتياطية بنجاح"
      });
      await loadBackups();
      loadSystemInfo();
    } else {
      toast({
        title: "خطأ",
        description: "فشل في حذف النسخة الاحتياطية",
        variant: "destructive"
      });
    }
  };

  // تصدير نسخة احتياطية
  const handleExportBackup = async (backupId: string, exportType?: 'file' | 'whatsapp' | 'drive') => {
    const result = await backupManager.exportBackup(backupId, exportType);
    if (result.success) {
      let description = "تم تصدير النسخة الاحتياطية بنجاح";
      if (exportType === 'whatsapp') {
        description = "تم تحضير النسخة للمشاركة عبر الواتساب";
      } else if (exportType === 'drive') {
        description = "تم تحضير النسخة للرفع على جوجل درايف";
      }
      
      toast({
        title: "تم التصدير",
        description
      });
    } else {
      toast({
        title: "خطأ",
        description: result.error,
        variant: "destructive"
      });
    }
  };

  // استيراد نسخة احتياطية
  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const result = await backupManager.importBackup(file);
      if (result.success) {
        toast({
          title: "تم الاستيراد",
          description: "تم استيراد النسخة الاحتياطية بنجاح"
        });
        await loadBackups();
        loadSystemInfo();
      } else {
        toast({
          title: "خطأ",
          description: result.error,
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
    
    // إعادة تعيين قيمة input
    event.target.value = '';
  };

  // حفظ إعدادات الجدولة
  const handleSaveSchedule = async () => {
    const success = await backupManager.scheduleAutomaticBackups(scheduleOptions);
    if (success) {
      toast({
        title: "تم الحفظ",
        description: "تم حفظ إعدادات الجدولة بنجاح"
      });
      setScheduleDialog(false);
      loadSystemInfo();
    } else {
      toast({
        title: "خطأ",
        description: "فشل في حفظ إعدادات الجدولة",
        variant: "destructive"
      });
    }
  };

  // تصدير جميع البيانات كنسخة احتياطية
  const handleExportAllData = async () => {
    setLoading(true);
    try {
      const result = await backupManager.createBackup(
        `تصدير-كامل-${new Date().toISOString().split('T')[0]}`,
        'تصدير شامل لجميع البيانات',
        {
          includeSettings: true,
          includeSalesData: true,
          includePurchasesData: true,
          includeInventoryData: true,
          includeCustomersData: true,
          includeEmployeesData: true,
          includeFinancialData: true,
          includeInvestorsData: true,
          compress: true,
          encrypt: false
        }
      );

      if (result.success && result.backupId) {
        // تصدير النسخة التي تم إنشاؤها
        const exportResult = await backupManager.exportBackup(result.backupId);
        if (exportResult.success) {
          toast({
            title: "تم التصدير",
            description: "تم تصدير جميع البيانات كنسخة احتياطية بنجاح"
          });
          await loadBackups();
          loadSystemInfo();
        } else {
          toast({
            title: "خطأ",
            description: exportResult.error,
            variant: "destructive"
          });
        }
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
        description: "فشل في تصدير البيانات",
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
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      calendar: 'gregory'
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* معلومات النظام */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Database className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">إجمالي النسخ</p>
                <p className="text-2xl font-bold">{systemInfo.totalBackups}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <HardDrive className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">الحجم الإجمالي</p>
                <p className="text-2xl font-bold">{formatFileSize(systemInfo.totalSize)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">آخر نسخة</p>
                <p className="text-sm font-medium">
                  {systemInfo.lastBackup ? formatDate(systemInfo.lastBackup) : 'لا توجد'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Zap className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">النسخ التلقائية</p>
                <div className="flex items-center gap-2">
                  {systemInfo.scheduledBackups ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      مفعلة
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      معطلة
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* الأزرار الرئيسية */}
      <div className="flex gap-4 flex-wrap">
        <Dialog open={newBackupDialog} onOpenChange={setNewBackupDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              إنشاء نسخة احتياطية جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>إنشاء نسخة احتياطية جديدة</DialogTitle>
              <DialogDescription>
                قم بإنشاء نسخة احتياطية شاملة لبياناتك
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="backup-name">اسم النسخة الاحتياطية</Label>
                <Input
                  id="backup-name"
                  value={backupForm.name}
                  onChange={(e) => setBackupForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="مثال: نسخة احتياطية شهرية"
                />
              </div>
              
              <div>
                <Label htmlFor="backup-description">الوصف (اختياري)</Label>
                <Textarea
                  id="backup-description"
                  value={backupForm.description}
                  onChange={(e) => setBackupForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="وصف مختصر للنسخة الاحتياطية"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>البيانات المراد نسخها</Label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries({
                    includeSettings: 'الإعدادات',
                    includeSalesData: 'بيانات المبيعات',
                    includePurchasesData: 'بيانات المشتريات',
                    includeInventoryData: 'بيانات المخزون',
                    includeCustomersData: 'بيانات العملاء',
                    includeEmployeesData: 'بيانات الموظفين',
                    includeFinancialData: 'البيانات المالية',
                    includeInvestorsData: 'بيانات المستثمرين'
                  }).map(([key, label]) => (
                    <div key={key} className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id={key}
                        checked={backupForm.options[key as keyof BackupOptions] as boolean}
                        onCheckedChange={(checked) => 
                          setBackupForm(prev => ({
                            ...prev,
                            options: { ...prev.options, [key]: checked }
                          }))
                        }
                      />
                      <Label htmlFor={key} className="text-sm">{label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="compress"
                  checked={backupForm.options.compress}
                  onCheckedChange={(checked) => 
                    setBackupForm(prev => ({
                      ...prev,
                      options: { ...prev.options, compress: checked as boolean }
                    }))
                  }
                />
                <Label htmlFor="compress">ضغط البيانات</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setNewBackupDialog(false)}>
                إلغاء
              </Button>
              <Button onClick={handleCreateBackup} disabled={loading}>
                {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                إنشاء النسخة الاحتياطية
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="relative">
          <input
            type="file"
            accept=".omran,.json"
            onChange={handleImportBackup}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={loading}
          />
          <Button variant="outline" disabled={loading}>
            <Upload className="h-4 w-4 mr-2" />
            استيراد نسخة احتياطية
          </Button>
        </div>

        <Dialog open={scheduleDialog} onOpenChange={setScheduleDialog}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Clock className="h-4 w-4 mr-2" />
              جدولة النسخ التلقائية
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إعدادات النسخ التلقائية</DialogTitle>
              <DialogDescription>
                قم بتكوين النسخ الاحتياطية التلقائية المجدولة
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch
                  id="schedule-enabled"
                  checked={scheduleOptions.enabled}
                  onCheckedChange={(checked) => 
                    setScheduleOptions(prev => ({ ...prev, enabled: checked }))
                  }
                />
                <Label htmlFor="schedule-enabled">تفعيل النسخ التلقائية</Label>
              </div>

              {scheduleOptions.enabled && (
                <>
                  <div>
                    <Label htmlFor="frequency">تكرار النسخ</Label>
                    <Select
                      value={scheduleOptions.frequency}
                      onValueChange={(value: 'daily' | 'weekly' | 'monthly') =>
                        setScheduleOptions(prev => ({ ...prev, frequency: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">يومياً</SelectItem>
                        <SelectItem value="weekly">أسبوعياً</SelectItem>
                        <SelectItem value="monthly">شهرياً</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="time">الوقت</Label>
                    <Input
                      id="time"
                      type="time"
                      value={scheduleOptions.time}
                      onChange={(e) => 
                        setScheduleOptions(prev => ({ ...prev, time: e.target.value }))
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="max-backups">الحد الأقصى للنسخ الاحتياطية</Label>
                    <Input
                      id="max-backups"
                      type="number"
                      min="1"
                      max="50"
                      value={scheduleOptions.maxBackups}
                      onChange={(e) => 
                        setScheduleOptions(prev => ({ ...prev, maxBackups: parseInt(e.target.value) || 10 }))
                      }
                    />
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch
                      id="auto-cleanup"
                      checked={scheduleOptions.autoCleanup}
                      onCheckedChange={(checked) => 
                        setScheduleOptions(prev => ({ ...prev, autoCleanup: checked }))
                      }
                    />
                    <Label htmlFor="auto-cleanup">تنظيف النسخ القديمة تلقائياً</Label>
                  </div>
                </>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setScheduleDialog(false)}>
                إلغاء
              </Button>
              <Button onClick={handleSaveSchedule}>
                <Settings className="h-4 w-4 mr-2" />
                حفظ الإعدادات
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button variant="outline" onClick={loadBackups} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          تحديث القائمة
        </Button>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportAllData} disabled={loading}>
            <Download className="h-4 w-4 mr-2" />
            تصدير نسخة احتياطية
          </Button>
          
          <Button 
            variant="outline" 
            onClick={async () => {
              const result = await backupManager.createBackup(
                `تصدير-واتساب-${new Date().toISOString().split('T')[0]}`,
                'تصدير للمشاركة عبر الواتساب',
                { compress: true }
              );
              if (result.success && result.backupId) {
                handleExportBackup(result.backupId, 'whatsapp');
              }
            }}
            disabled={loading}
            className="text-green-600 hover:text-green-700"
            title="إنشاء وتصدير للواتساب"
          >
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.666"/>
            </svg>
            واتساب
          </Button>
          
          <Button 
            variant="outline" 
            onClick={async () => {
              const result = await backupManager.createBackup(
                `تصدير-درايف-${new Date().toISOString().split('T')[0]}`,
                'تصدير لجوجل درايف',
                { compress: true }
              );
              if (result.success && result.backupId) {
                handleExportBackup(result.backupId, 'drive');
              }
            }}
            disabled={loading}
            className="text-blue-600 hover:text-blue-700"
            title="إنشاء وتصدير لجوجل درايف"
          >
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6.826 10.045L10.04 4L17.178 15.045L13.962 21.045z"/>
              <path d="M2.864 15.045H9.996L7.43 19.5z"/>
              <path d="M14.864 15.045H22L18.784 21.045z"/>
            </svg>
            جوجل درايف
          </Button>
        </div>
      </div>

      {/* قائمة النسخ الاحتياطية */}
      <Card>
        <CardHeader>
          <CardTitle>النسخ الاحتياطية المحفوظة</CardTitle>
          <CardDescription>
            إدارة النسخ الاحتياطية المحفوظة واستعادتها
          </CardDescription>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <div className="text-center py-8">
              <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد نسخ احتياطية محفوظة</p>
              <p className="text-sm text-muted-foreground mt-2">
                قم بإنشاء نسخة احتياطية جديدة للبدء
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الحجم</TableHead>
                    <TableHead>أنواع البيانات</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{backup.name}</div>
                          {backup.description && (
                            <div className="text-sm text-muted-foreground">{backup.description}</div>
                          )}
                          {backup.isAutomatic && (
                            <Badge variant="secondary" className="mt-1">تلقائية</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(backup.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatFileSize(backup.size)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {backup.dataTypes.slice(0, 3).map((type) => (
                            <Badge key={type} variant="outline" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                          {backup.dataTypes.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{backup.dataTypes.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                       <TableCell>
                         <div className="flex gap-1 flex-wrap">
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => {
                               setSelectedBackup(backup);
                               setRestoreDialog(true);
                             }}
                             title="استعادة النسخة الاحتياطية"
                           >
                             <RefreshCw className="h-3 w-3" />
                           </Button>
                           
                           {/* أزرار التصدير */}
                           <div className="flex gap-1">
                             <Button
                               size="sm"
                               variant="outline"
                               onClick={() => handleExportBackup(backup.id)}
                               title="تصدير كملف"
                             >
                               <Download className="h-3 w-3" />
                             </Button>
                             
                             <Button
                               size="sm"
                               variant="outline"
                               onClick={() => handleExportBackup(backup.id, 'whatsapp')}
                               title="مشاركة عبر الواتساب"
                               className="text-green-600 hover:text-green-700"
                             >
                               <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                                 <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.666"/>
                               </svg>
                             </Button>
                             
                             <Button
                               size="sm"
                               variant="outline"
                               onClick={() => handleExportBackup(backup.id, 'drive')}
                               title="رفع على جوجل درايف"
                               className="text-blue-600 hover:text-blue-700"
                             >
                               <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                                 <path d="M6.826 10.045L10.04 4L17.178 15.045L13.962 21.045z"/>
                                 <path d="M2.864 15.045H9.996L7.43 19.5z"/>
                                 <path d="M14.864 15.045H22L18.784 21.045z"/>
                               </svg>
                             </Button>
                           </div>
                           
                           <AlertDialog>
                             <AlertDialogTrigger asChild>
                               <Button size="sm" variant="outline" className="text-destructive" title="حذف النسخة الاحتياطية">
                                 <Trash2 className="h-3 w-3" />
                               </Button>
                             </AlertDialogTrigger>
                             <AlertDialogContent>
                               <AlertDialogHeader>
                                 <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                                 <AlertDialogDescription>
                                   هل أنت متأكد من حذف النسخة الاحتياطية "{backup.name}"؟
                                   لا يمكن التراجع عن هذا الإجراء.
                                 </AlertDialogDescription>
                               </AlertDialogHeader>
                               <AlertDialogFooter>
                                 <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                 <AlertDialogAction
                                   onClick={() => handleDeleteBackup(backup.id)}
                                   className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                 >
                                   حذف
                                 </AlertDialogAction>
                               </AlertDialogFooter>
                             </AlertDialogContent>
                           </AlertDialog>
                         </div>
                       </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* نافذة الاستعادة */}
      <Dialog open={restoreDialog} onOpenChange={setRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>استعادة النسخة الاحتياطية</DialogTitle>
            <DialogDescription>
              {selectedBackup && `استعادة البيانات من "${selectedBackup.name}"`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedBackup && (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">معلومات النسخة الاحتياطية</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>الاسم: {selectedBackup.name}</div>
                  <div>التاريخ: {formatDate(selectedBackup.createdAt)}</div>
                  <div>الحجم: {formatFileSize(selectedBackup.size)}</div>
                  <div>الإصدار: {selectedBackup.version}</div>
                </div>
                <div className="mt-2">
                  <p className="text-sm font-medium">أنواع البيانات:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedBackup.dataTypes.map((type) => (
                      <Badge key={type} variant="outline" className="text-xs">{type}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">خيارات الاستعادة</h4>
                
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="overwrite"
                    checked={restoreOptions.overwriteExisting}
                    onCheckedChange={(checked) => 
                      setRestoreOptions(prev => ({ ...prev, overwriteExisting: checked as boolean }))
                    }
                  />
                  <Label htmlFor="overwrite">استبدال البيانات الموجودة</Label>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="merge"
                    checked={restoreOptions.mergeData}
                    onCheckedChange={(checked) => 
                      setRestoreOptions(prev => ({ ...prev, mergeData: checked as boolean }))
                    }
                  />
                  <Label htmlFor="merge">دمج البيانات مع الموجود</Label>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="restore-settings"
                    checked={restoreOptions.restoreSettings}
                    onCheckedChange={(checked) => 
                      setRestoreOptions(prev => ({ ...prev, restoreSettings: checked as boolean }))
                    }
                  />
                  <Label htmlFor="restore-settings">استعادة الإعدادات</Label>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="backup-before-restore"
                    checked={restoreOptions.createBackupBeforeRestore}
                    onCheckedChange={(checked) => 
                      setRestoreOptions(prev => ({ ...prev, createBackupBeforeRestore: checked as boolean }))
                    }
                  />
                  <Label htmlFor="backup-before-restore">إنشاء نسخة احتياطية قبل الاستعادة</Label>
                </div>
              </div>

              <div className="p-3 border border-orange-200 bg-orange-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                  <div className="text-sm text-orange-800">
                    <strong>تحذير:</strong> ستؤثر عملية الاستعادة على البيانات الحالية. 
                    تأكد من إنشاء نسخة احتياطية قبل المتابعة.
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreDialog(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={handleRestoreBackup} 
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Shield className="h-4 w-4 mr-2" />}
              استعادة البيانات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}