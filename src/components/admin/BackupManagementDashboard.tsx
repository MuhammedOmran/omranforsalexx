import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { backupRestoreSystem } from "@/core/BackupRestoreSystem";
import { logger } from "@/utils/logger";
import { safeErrorHandler } from "@/utils/safeErrorHandler";
import { 
  BackupMetadata, 
  BackupStats, 
  BackupConfig,
  RestoreResult 
} from "@/types/admin";
import { 
  Database, 
  Download, 
  Upload, 
  Play, 
  Pause, 
  Trash2, 
  Settings, 
  Calendar,
  Clock,
  FileText,
  Save,
  RefreshCw,
  AlertTriangle
} from "lucide-react";

export function BackupManagementDashboard() {
  const [backupList, setBackupList] = useState<BackupMetadata[]>([]);
  const [backupStats, setBackupStats] = useState<BackupStats>({
    total: 0,
    manual: 0,
    scheduled: 0,
    auto: 0,
    totalSize: 0
  });
  const [config, setConfig] = useState<BackupConfig>({
    includeData: true,
    includeSettings: true,
    includeIntegrations: true,
    includePlugins: true,
    includeAnalytics: false,
    compression: 'basic',
    encryption: false,
    scheduleEnabled: false,
    scheduleInterval: 24
  });
  const [isLoading, setIsLoading] = useState(false);
  const [backupName, setBackupName] = useState("");
  const [backupDescription, setBackupDescription] = useState("");
  const [selectedBackup, setSelectedBackup] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    loadBackupData();
  }, []);

  const loadBackupData = async () => {
    await safeErrorHandler.safeExecute(
      async () => {
        const stats = backupRestoreSystem.getBackupStats();
        const list = backupRestoreSystem.getBackupList();
        const currentConfig = backupRestoreSystem.getConfig();
        
        setBackupStats({
          total: stats?.total || 0,
          manual: stats?.manual || 0,
          scheduled: stats?.scheduled || 0,
          auto: stats?.auto || 0,
          totalSize: stats?.totalSize || 0,
          lastBackup: stats?.lastBackup
        });
        
        setBackupList((list || []).map(backup => ({
          ...backup,
          id: String(backup.id)
        })));
        
        setConfig({
          includeData: currentConfig?.includeData ?? true,
          includeSettings: currentConfig?.includeSettings ?? true,
          includeIntegrations: currentConfig?.includeIntegrations ?? true,
          includePlugins: currentConfig?.includePlugins ?? true,
          includeAnalytics: currentConfig?.includeAnalytics ?? false,
          compression: currentConfig?.compression || 'basic',
          encryption: currentConfig?.encryption ?? false,
          scheduleEnabled: currentConfig?.scheduleEnabled ?? false,
          scheduleInterval: currentConfig?.scheduleInterval || 24
        });
      },
      {
        context: 'BackupManagementDashboard.loadBackupData',
        shouldNotify: true,
        fallbackValue: null
      }
    );
  };

  const handleCreateBackup = async () => {
    if (!backupName.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم للنسخة الاحتياطية",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const backup = await backupRestoreSystem.createBackup('manual', backupName, backupDescription);
      if (backup) {
        setBackupName("");
        setBackupDescription("");
        loadBackupData();
        toast({
          title: "تم الإنشاء",
          description: `تم إنشاء النسخة الاحتياطية "${backupName}" بنجاح`,
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في إنشاء النسخة الاحتياطية",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackup) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار نسخة احتياطية للاستعادة",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    const result = await safeErrorHandler.safeExecute(
      async (): Promise<RestoreResult> => {
        const restoreResult = await backupRestoreSystem.restoreBackup(selectedBackup, {
          overwrite: true
        });
        return restoreResult as RestoreResult;
      },
      {
        context: 'BackupManagementDashboard.handleRestoreBackup',
        shouldNotify: true,
        fallbackValue: { success: false, message: 'فشل في استعادة النسخة الاحتياطية' }
      }
    );

    if (result?.success) {
      toast({
        title: "تم الاستعادة",
        description: result.message,
      });
      // إعادة تحميل الصفحة لتطبيق البيانات المستعادة
      window.location.reload();
    } else {
      toast({
        title: "فشل الاستعادة",
        description: result?.message || 'حدث خطأ غير متوقع',
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه النسخة الاحتياطية؟")) {
      return;
    }

    try {
      await backupRestoreSystem.deleteBackup(backupId);
      loadBackupData();
      toast({
        title: "تم الحذف",
        description: "تم حذف النسخة الاحتياطية بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في حذف النسخة الاحتياطية",
        variant: "destructive",
      });
    }
  };

  const handleUpdateConfig = async (key: keyof BackupConfig, value: BackupConfig[keyof BackupConfig]) => {
    await safeErrorHandler.safeExecute(
      async () => {
        const newConfig = { ...config, [key]: value };
        setConfig(newConfig);
        backupRestoreSystem.updateConfig(newConfig);
        
        toast({
          title: "تم التحديث",
          description: "تم تحديث إعدادات النسخ الاحتياطي",
        });
      },
      {
        context: 'BackupManagementDashboard.handleUpdateConfig',
        shouldNotify: true
      }
    );
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getBackupTypeIcon = (type: string) => {
    switch (type) {
      case 'manual':
        return <Save className="w-4 h-4" />;
      case 'scheduled':
        return <Clock className="w-4 h-4" />;
      case 'auto':
        return <RefreshCw className="w-4 h-4" />;
      default:
        return <Database className="w-4 h-4" />;
    }
  };

  const getBackupTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
      manual: 'default',
      scheduled: 'secondary',
      auto: 'outline'
    };
    
    const labels = {
      manual: 'يدوي',
      scheduled: 'مجدول',
      auto: 'تلقائي'
    };

    return (
      <Badge variant={variants[type] || 'default'}>
        {labels[type as keyof typeof labels] || type}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Database className="w-6 h-6" />
            إدارة النسخ الاحتياطية
          </h2>
          <p className="text-muted-foreground">
            إنشاء واستعادة وإدارة النسخ الاحتياطية للتطبيق
          </p>
        </div>
        <Button variant="outline" onClick={loadBackupData} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          تحديث
        </Button>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Database className="w-8 h-8 text-primary" />
              <div>
                <div className="text-2xl font-bold">{backupStats.total || 0}</div>
                <p className="text-sm text-muted-foreground">إجمالي النسخ</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Save className="w-8 h-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{backupStats.manual || 0}</div>
                <p className="text-sm text-muted-foreground">نسخ يدوية</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Clock className="w-8 h-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{backupStats.scheduled || 0}</div>
                <p className="text-sm text-muted-foreground">نسخ مجدولة</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <RefreshCw className="w-8 h-8 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{backupStats.auto || 0}</div>
                <p className="text-sm text-muted-foreground">نسخ تلقائية</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* التبويبات */}
      <Tabs defaultValue="create" className="w-full">
        <TabsList>
          <TabsTrigger value="create">إنشاء نسخة</TabsTrigger>
          <TabsTrigger value="restore">استعادة نسخة</TabsTrigger>
          <TabsTrigger value="manage">إدارة النسخ</TabsTrigger>
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Save className="w-5 h-5" />
                إنشاء نسخة احتياطية جديدة
              </CardTitle>
              <CardDescription>
                إنشاء نسخة احتياطية من جميع بيانات التطبيق
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="backup-name">اسم النسخة الاحتياطية</Label>
                  <Input
                    id="backup-name"
                    placeholder="نسخة احتياطية - يوم الأحد"
                    value={backupName}
                    onChange={(e) => setBackupName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>نوع النسخة</Label>
                  <Select value="manual" disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="نوع النسخة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">يدوي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="backup-description">الوصف (اختياري)</Label>
                <Textarea
                  id="backup-description"
                  placeholder="وصف النسخة الاحتياطية..."
                  value={backupDescription}
                  onChange={(e) => setBackupDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="pt-4">
                <Button
                  onClick={handleCreateBackup}
                  disabled={isLoading || !backupName.trim()}
                  className="w-full md:w-auto"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  إنشاء النسخة الاحتياطية
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="restore" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                استعادة نسخة احتياطية
              </CardTitle>
              <CardDescription>
                استعادة البيانات من نسخة احتياطية سابقة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="restore-backup">اختر النسخة للاستعادة</Label>
                  <Select value={selectedBackup} onValueChange={setSelectedBackup}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نسخة احتياطية" />
                    </SelectTrigger>
                    <SelectContent>
                      {backupList.map((backup) => (
                        <SelectItem key={backup.id} value={String(backup.id)}>
                          {backup.name} - {new Date(backup.createdAt).toLocaleDateString('ar-SA')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              </div>

              {selectedBackup && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <span className="font-medium text-yellow-800">تحذير</span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    ستقوم هذه العملية بالكتابة فوق البيانات الحالية. تأكد من إنشاء نسخة احتياطية قبل المتابعة.
                  </p>
                </div>
              )}

              <div className="pt-4">
                <Button
                  onClick={handleRestoreBackup}
                  disabled={isLoading || !selectedBackup}
                  variant="destructive"
                  className="w-full md:w-auto"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  استعادة النسخة الاحتياطية
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                قائمة النسخ الاحتياطية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {backupList.length > 0 ? (
                  backupList.map((backup) => (
                    <div key={backup.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        {getBackupTypeIcon(backup.type)}
                        <div>
                          <h4 className="font-medium">{backup.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(backup.createdAt).toLocaleString('ar-SA', { numberingSystem: 'latn' })} • {formatBytes(backup.size)}
                          </p>
                          {backup.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {backup.description}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getBackupTypeBadge(backup.type)}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedBackup(String(backup.id))}
                        >
                          <Upload className="w-3 h-3 mr-1" />
                          استعادة
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteBackup(String(backup.id))}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    لا توجد نسخ احتياطية متاحة
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                إعدادات النسخ الاحتياطي
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>النسخ الاحتياطي المجدول</Label>
                    <p className="text-sm text-muted-foreground">
                      إنشاء نسخ احتياطية تلقائية بفترات منتظمة
                    </p>
                  </div>
                  <Switch
                    checked={config.scheduleEnabled}
                    onCheckedChange={(checked) => handleUpdateConfig('scheduleEnabled', checked)}
                  />
                </div>

                {config.scheduleEnabled && (
                  <div className="space-y-2">
                    <Label>فترة النسخ (بالدقائق)</Label>
                    <Input
                      type="number"
                      value={config.scheduleInterval}
                      onChange={(e) => handleUpdateConfig('scheduleInterval', parseInt(e.target.value))}
                      min="15"
                      max="1440"
                    />
                  </div>
                )}

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-4">محتويات النسخة الاحتياطية</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>البيانات الأساسية</Label>
                      <Switch
                        checked={config.includeData}
                        onCheckedChange={(checked) => handleUpdateConfig('includeData', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>الإعدادات</Label>
                      <Switch
                        checked={config.includeSettings}
                        onCheckedChange={(checked) => handleUpdateConfig('includeSettings', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>التكاملات</Label>
                      <Switch
                        checked={config.includeIntegrations}
                        onCheckedChange={(checked) => handleUpdateConfig('includeIntegrations', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>الوحدات الإضافية</Label>
                      <Switch
                        checked={config.includePlugins}
                        onCheckedChange={(checked) => handleUpdateConfig('includePlugins', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>إحصائيات الاستخدام</Label>
                      <Switch
                        checked={config.includeAnalytics}
                        onCheckedChange={(checked) => handleUpdateConfig('includeAnalytics', checked)}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-4">خيارات متقدمة</h4>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>مستوى الضغط</Label>
                      <Select
                        value={config.compression}
                        onValueChange={(value: 'none' | 'basic' | 'high') => handleUpdateConfig('compression', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">بدون ضغط</SelectItem>
                          <SelectItem value="basic">ضغط أساسي</SelectItem>
                          <SelectItem value="high">ضغط عالي</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>التشفير</Label>
                        <p className="text-sm text-muted-foreground">
                          تشفير النسخ الاحتياطية لحماية البيانات
                        </p>
                      </div>
                      <Switch
                        checked={config.encryption}
                        onCheckedChange={(checked) => handleUpdateConfig('encryption', checked)}
                        disabled
                      />
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