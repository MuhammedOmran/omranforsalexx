import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Cog, 
  Code, 
  Database, 
  AlertTriangle, 
  Settings, 
  FileText, 
  Save,
  Download,
  Upload,
  RotateCcw,
  Users,
  Building2 
} from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { toast } from "@/hooks/use-toast";
import { useAppSettings } from "@/hooks/useAppSettings";

interface AdvancedSettingsData {
  debugMode: boolean;
  verboseLogging: boolean;
  enableExperimentalFeatures: boolean;
  customCSS: string;
  customJS: string;
  databaseUrl: string;
  apiTimeout: number;
  retryAttempts: number;
  enableDevTools: boolean;
  enableConsoleLogging: boolean;
  enableErrorReporting: boolean;
  maxLogSize: number;
  enableAnalytics: boolean;
  customHeaders: string;
}

const defaultSettings: AdvancedSettingsData = {
  debugMode: false,
  verboseLogging: false,
  enableExperimentalFeatures: false,
  customCSS: '',
  customJS: '',
  databaseUrl: '',
  apiTimeout: 30000,
  retryAttempts: 3,
  enableDevTools: false,
  enableConsoleLogging: true,
  enableErrorReporting: true,
  maxLogSize: 1000,
  enableAnalytics: false,
  customHeaders: '{}',
};

export function AdvancedSettings() {
  const [settings, setSettings] = useState<AdvancedSettingsData>(defaultSettings);
  const [showDangerZone, setShowDangerZone] = useState(false);
  const navigate = useNavigate();
  const { loading, getCategorySettings, setCategorySettings, getAllSettings, exportAllSettings, importSettings } = useAppSettings();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await getCategorySettings('advanced');
      if (Object.keys(savedSettings).length > 0) {
        setSettings({ ...defaultSettings, ...savedSettings });
      }
    } catch (error) {
      console.error('خطأ في تحميل الإعدادات المتقدمة:', error);
    }
  };

  const saveSettings = async () => {
    try {
      const success = await setCategorySettings('advanced', settings);
      
      if (success) {
        // تطبيق CSS المخصص
        if (settings.customCSS) {
          let styleElement = document.getElementById('custom-styles');
          if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'custom-styles';
            document.head.appendChild(styleElement);
          }
          styleElement.textContent = settings.customCSS;
        }

        // تطبيق وضع التطوير
        if (settings.debugMode) {
          console.log('وضع التطوير مفعل');
          (window as any).debugMode = true;
        } else {
          (window as any).debugMode = false;
        }

        toast({
          title: "تم حفظ الإعدادات المتقدمة",
          description: "تم تطبيق التغييرات بنجاح",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ الإعدادات المتقدمة",
        variant: "destructive"
      });
    }
  };

  const updateSetting = (key: keyof AdvancedSettingsData, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const exportSettings = async () => {
    try {
      const settingsJson = await exportAllSettings();
      if (!settingsJson) {
        toast({
          title: "لا توجد إعدادات للتصدير",
          description: "لم يتم العثور على إعدادات لتصديرها",
          variant: "destructive"
        });
        return;
      }

      const blob = new Blob([settingsJson], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `settings-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "تم تصدير الإعدادات",
        description: "تم تنزيل ملف النسخة الاحتياطية للإعدادات",
      });
    } catch (error) {
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير الإعدادات",
        variant: "destructive"
      });
    }
  };

  const importSettingsFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const settingsJson = e.target?.result as string;
        const success = await importSettings(settingsJson);
        
        if (success) {
          // إعادة تحميل الإعدادات المحلية
          await loadSettings();
          
          toast({
            title: "تم استيراد الإعدادات",
            description: "تم استيراد جميع الإعدادات بنجاح",
          });
          
          // إعادة تحميل الصفحة لتطبيق التغييرات
          setTimeout(() => window.location.reload(), 1000);
        }
      } catch (error) {
        toast({
          title: "خطأ في الاستيراد",
          description: "ملف الإعدادات غير صالح",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  const resetAllSettings = async () => {
    if (confirm('هل أنت متأكد من إعادة تعيين جميع الإعدادات؟ سيتم فقدان جميع التخصيصات.')) {
      try {
        // إعادة تعيين جميع فئات الإعدادات في Supabase
        const categories = [
          'general', 'appearance', 'notifications', 'security', 
          'integrations', 'performance', 'advanced'
        ];
        
        for (const category of categories) {
          await setCategorySettings(category, {});
        }
        
        setSettings(defaultSettings);
        
        toast({
          title: "تم إعادة تعيين الإعدادات",
          description: "تم إعادة تعيين جميع الإعدادات إلى القيم الافتراضية",
        });
        
        setTimeout(() => window.location.reload(), 1000);
      } catch (error) {
        toast({
          title: "خطأ في إعادة التعيين",
          description: "حدث خطأ أثناء إعادة تعيين الإعدادات",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* إعداد النظام متعدد المستخدمين */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            النظام متعدد المستخدمين
          </CardTitle>
          <CardDescription>
            إعداد وإدارة النظام متعدد المستخدمين والشركات
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-800 dark:text-blue-200">
                  إعداد نظام شامل متعدد المستخدمين
                </h3>
                <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">
                  قم بإنشاء نظام إدارة شركات منفصلة مع مستخدمين متعددين، صلاحيات متدرجة، ونسخ احتياطية مستقلة لكل شركة.
                </p>
                <ul className="text-blue-700 dark:text-blue-300 text-sm mt-2 space-y-1">
                  <li>• شركات منفصلة مع بيانات مستقلة</li>
                  <li>• نظام صلاحيات متدرج (مالك/مدير/موظف/عارض)</li>
                  <li>• نسخ احتياطية تلقائية مشفرة</li>
                  <li>• تتبع جلسات المستخدمين والأنشطة</li>
                  <li>• حماية متقدمة للبيانات</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center">
            <Button 
              onClick={() => navigate('/multi-user-setup')}
              size="lg"
              className="flex items-center gap-2"
            >
              <Users className="h-5 w-5" />
              إعداد النظام متعدد المستخدمين
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* إعدادات التطوير */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            إعدادات التطوير
          </CardTitle>
          <CardDescription>
            إعدادات متقدمة للمطورين والمستخدمين المتقدمين
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>وضع التطوير</Label>
                <p className="text-sm text-muted-foreground">
                  تفعيل رسائل التشخيص والأدوات المتقدمة
                </p>
              </div>
              <Switch
                checked={settings.debugMode}
                onCheckedChange={(checked) => updateSetting('debugMode', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>التسجيل المفصل</Label>
                <p className="text-sm text-muted-foreground">
                  تسجيل تفصيلي لجميع العمليات
                </p>
              </div>
              <Switch
                checked={settings.verboseLogging}
                onCheckedChange={(checked) => updateSetting('verboseLogging', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>الميزات التجريبية</Label>
                <p className="text-sm text-muted-foreground">
                  تفعيل الميزات قيد التطوير (غير مستقرة)
                </p>
              </div>
              <Switch
                checked={settings.enableExperimentalFeatures}
                onCheckedChange={(checked) => updateSetting('enableExperimentalFeatures', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>أدوات المطور</Label>
                <p className="text-sm text-muted-foreground">
                  تفعيل أدوات التطوير في المتصفح
                </p>
              </div>
              <Switch
                checked={settings.enableDevTools}
                onCheckedChange={(checked) => updateSetting('enableDevTools', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* إعدادات الشبكة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            إعدادات الشبكة والAPI
          </CardTitle>
          <CardDescription>
            تخصيص اتصالات الشبكة والAPI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>مهلة انتظار API (ميلي ثانية)</Label>
              <Input
                type="number"
                min="1000"
                max="60000"
                value={settings.apiTimeout}
                onChange={(e) => updateSetting('apiTimeout', parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label>عدد محاولات الإعادة</Label>
              <Input
                type="number"
                min="0"
                max="10"
                value={settings.retryAttempts}
                onChange={(e) => updateSetting('retryAttempts', parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>عناوين HTTP مخصصة (JSON)</Label>
            <Textarea
              placeholder='{"Authorization": "Bearer token", "Custom-Header": "value"}'
              value={settings.customHeaders}
              onChange={(e) => updateSetting('customHeaders', e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* إعدادات CSS/JS مخصص */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            تخصيص المظهر والسلوك
          </CardTitle>
          <CardDescription>
            إضافة CSS و JavaScript مخصص
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>CSS مخصص</Label>
            <Textarea
              placeholder="/* أدخل CSS مخصص هنا */"
              value={settings.customCSS}
              onChange={(e) => updateSetting('customCSS', e.target.value)}
              rows={5}
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label>JavaScript مخصص</Label>
            <Textarea
              placeholder="// أدخل JavaScript مخصص هنا"
              value={settings.customJS}
              onChange={(e) => updateSetting('customJS', e.target.value)}
              rows={5}
              className="font-mono text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* إدارة الإعدادات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            إدارة الإعدادات
          </CardTitle>
          <CardDescription>
            تصدير واستيراد وإعادة تعيين الإعدادات
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button onClick={exportSettings} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              تصدير الإعدادات
            </Button>
            
            <div>
              <input
                type="file"
                accept=".json"
                onChange={importSettingsFromFile}
                className="hidden"
                id="import-settings"
              />
              <Button asChild variant="outline" className="w-full flex items-center gap-2">
                <label htmlFor="import-settings" className="cursor-pointer">
                  <Upload className="h-4 w-4" />
                  استيراد الإعدادات
                </label>
              </Button>
            </div>
            
            <Button
              onClick={() => setShowDangerZone(!showDangerZone)}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              منطقة الخطر
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* منطقة الخطر */}
      {showDangerZone && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-4">
              <p className="font-semibold">منطقة الخطر - استخدم بحذر!</p>
              <p>العمليات التالية لا يمكن التراجع عنها.</p>
              
              <Button
                onClick={resetAllSettings}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                إعادة تعيين جميع الإعدادات
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* زر الحفظ */}
      <div className="flex justify-end">
        <Button
          onClick={saveSettings}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {loading ? 'جاري الحفظ...' : 'حفظ الإعدادات المتقدمة'}
        </Button>
      </div>
    </div>
  );
}