import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useOfflineCapabilities } from '@/hooks/useOfflineCapabilities';
import { 
  Wifi, 
  WifiOff, 
  Download, 
  Upload, 
  HardDrive, 
  Smartphone,
  CheckCircle,
  XCircle,
  RefreshCw,
  Database,
  FileText,
  AlertCircle
} from 'lucide-react';

export function OfflineManager() {
  const {
    capabilities,
    syncPendingData,
    clearSyncQueue,
    checkStorageHealth,
    exportOfflineData,
    importOfflineData,
    isSyncInProgress
  } = useOfflineCapabilities();
  
  const [fileInput, setFileInput] = useState<HTMLInputElement | null>(null);

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importOfflineData(file);
      event.target.value = ''; // إعادة تعيين input
    }
  };

  const handleFileInputClick = () => {
    fileInput?.click();
  };

  const getStorageStatusColor = () => {
    if (capabilities.storage.percentage > 90) return 'text-red-500';
    if (capabilities.storage.percentage > 70) return 'text-yellow-500';
    return 'text-green-500';
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">إدارة الوضع الأوف لاين</h1>
        <p className="text-muted-foreground">
          مراقبة وإدارة قدرات التطبيق في العمل بدون إنترنت
        </p>
      </div>

      {/* حالة الاتصال والتطبيق */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {capabilities.isOnline ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-500" />
              )}
              حالة الاتصال
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>الاتصال بالإنترنت</span>
              <Badge variant={capabilities.isOnline ? "default" : "destructive"}>
                {capabilities.isOnline ? "متصل" : "منقطع"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>العمليات المؤجلة</span>
              <Badge variant={capabilities.pendingSync > 0 ? "secondary" : "outline"}>
                {capabilities.pendingSync}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span>يمكن المزامنة</span>
              {capabilities.canSync ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              حالة التطبيق
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>تطبيق مثبت (PWA)</span>
              <Badge variant={capabilities.isInstalled ? "default" : "outline"}>
                {capabilities.isInstalled ? "مثبت" : "غير مثبت"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>يعمل أوف لاين</span>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>

            <div className="flex items-center justify-between">
              <span>النسخ الاحتياطي التلقائي</span>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* معلومات التخزين */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            استخدام التخزين المحلي
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>المساحة المستخدمة</span>
              <span className={getStorageStatusColor()}>
                {capabilities.storage.percentage.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={capabilities.storage.percentage} 
              className="h-2"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatBytes(capabilities.storage.used)} مستخدم</span>
              <span>{formatBytes(capabilities.storage.available)} متاح</span>
            </div>
          </div>

          {capabilities.storage.percentage > 80 && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg text-yellow-800 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>تحذير: مساحة التخزين تقترب من الامتلاء</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* عمليات الإدارة */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              مزامنة البيانات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              مزامنة البيانات المحلية مع الخادم عند توفر الاتصال
            </p>
            
            <div className="flex gap-2">
              <Button 
                onClick={syncPendingData}
                disabled={!capabilities.canSync || isSyncInProgress}
                className="flex-1"
              >
                {isSyncInProgress ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                مزامنة الآن
              </Button>
              
              <Button 
                variant="outline"
                onClick={clearSyncQueue}
                disabled={capabilities.pendingSync === 0}
              >
                مسح القائمة
              </Button>
            </div>

            {capabilities.pendingSync > 0 && (
              <p className="text-xs text-muted-foreground">
                {capabilities.pendingSync} عملية في انتظار المزامنة
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              النسخ الاحتياطي
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              إنشاء واستيراد النسخ الاحتياطية للبيانات
            </p>
            
            <div className="space-y-2">
              <Button 
                onClick={exportOfflineData}
                variant="outline"
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                تصدير البيانات
              </Button>
              
              <Button 
                onClick={handleFileInputClick}
                variant="outline"
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                استيراد البيانات
              </Button>

              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                ref={setFileInput}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* فحص النظام */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            فحص صحة النظام
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">فحص نظام التخزين</p>
              <p className="text-sm text-muted-foreground">
                التحقق من سلامة وأداء نظام التخزين المحلي
              </p>
            </div>
            <Button onClick={checkStorageHealth} variant="outline">
              <CheckCircle className="h-4 w-4 mr-2" />
              فحص الآن
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* معلومات إضافية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            معلومات الوضع الأوف لاين
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>جميع المعاملات تحفظ محلياً</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>إمكانية إنشاء فواتير وإدارة المخزون</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>النسخ الاحتياطي التلقائي كل 15 دقيقة</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>مزامنة تلقائية عند عودة الاتصال</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>يعمل على جميع الأجهزة والمتصفحات</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}