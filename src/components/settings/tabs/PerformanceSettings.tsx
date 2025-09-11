import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Zap, Activity, HardDrive, Cpu, MemoryStick, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAppSettings } from "@/hooks/useAppSettings";

interface PerformanceSettingsData {
  enableCaching: boolean;
  cacheSize: 'small' | 'medium' | 'large';
  enableLazyLoading: boolean;
  enableVirtualization: boolean;
  enablePreloading: boolean;
  maxConcurrentRequests: number;
  enableCompression: boolean;
  enableOptimizedImages: boolean;
  enableServiceWorker: boolean;
  memoryLimit: number;
}

interface SystemStats {
  memoryUsage: number;
  storageUsage: number;
  cacheSize: number;
  performanceScore: number;
}

const defaultSettings: PerformanceSettingsData = {
  enableCaching: true,
  cacheSize: 'medium',
  enableLazyLoading: true,
  enableVirtualization: false,
  enablePreloading: true,
  maxConcurrentRequests: 5,
  enableCompression: true,
  enableOptimizedImages: true,
  enableServiceWorker: true,
  memoryLimit: 256,
};

export function PerformanceSettings() {
  const [settings, setSettings] = useState<PerformanceSettingsData>(defaultSettings);
  const [systemStats, setSystemStats] = useState<SystemStats>({
    memoryUsage: 0,
    storageUsage: 0,
    cacheSize: 0,
    performanceScore: 0,
  });
  const { loading, getCategorySettings, setCategorySettings } = useAppSettings();

  useEffect(() => {
    loadSettings();
    calculateSystemStats();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await getCategorySettings('performance');
      if (Object.keys(savedSettings).length > 0) {
        setSettings({ ...defaultSettings, ...savedSettings });
      }
    } catch (error) {
      console.error('خطأ في تحميل إعدادات الأداء:', error);
    }
  };

  const calculateSystemStats = () => {
    // حساب استخدام الذاكرة والتخزين
    let totalSize = 0;
    let cacheSize = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        const size = value ? value.length : 0;
        totalSize += size;
        
        if (key.includes('cache_')) {
          cacheSize += size;
        }
      }
    }

    // محاكاة إحصائيات الأداء
    const memoryInfo = (performance as any).memory;
    const memoryUsage = memoryInfo ? 
      Math.round((memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100) : 
      Math.round(Math.random() * 40 + 20);

    const storageUsage = Math.round((totalSize / (5 * 1024 * 1024)) * 100); // افتراض حد أقصى 5MB
    const performanceScore = Math.max(0, 100 - (memoryUsage * 0.5) - (storageUsage * 0.3));

    setSystemStats({
      memoryUsage,
      storageUsage,
      cacheSize: Math.round(cacheSize / 1024), // بالكيلوبايت
      performanceScore: Math.round(performanceScore),
    });
  };

  const saveSettings = async () => {
    try {
      const success = await setCategorySettings('performance', settings);
      if (success) {
        toast({
          title: "تم حفظ إعدادات الأداء",
          description: "تم تطبيق التحسينات بنجاح",
        });
        
        // إعادة حساب الإحصائيات
        setTimeout(calculateSystemStats, 1000);
      }
    } catch (error) {
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ إعدادات الأداء",
        variant: "destructive"
      });
    }
  };

  const updateSetting = (key: keyof PerformanceSettingsData, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const clearCache = () => {
    // مسح بيانات الكاش
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('cache_')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    toast({
      title: "تم مسح الكاش",
      description: `تم مسح ${keysToRemove.length} عنصر من الكاش`,
    });
    
    calculateSystemStats();
  };

  const optimizePerformance = async () => {
    try {
      // تفعيل جميع تحسينات الأداء
      const optimizedSettings = {
        ...settings,
        enableCaching: true,
        enableLazyLoading: true,
        enableVirtualization: true,
        enablePreloading: true,
        enableCompression: true,
        enableOptimizedImages: true,
        enableServiceWorker: true,
        cacheSize: 'large' as const,
        maxConcurrentRequests: 3,
      };
      
      setSettings(optimizedSettings);
      await setCategorySettings('performance', optimizedSettings);
      
      // تنظيف البيانات القديمة
      clearCache();
      
      toast({
        title: "تم تحسين الأداء",
        description: "تم تطبيق جميع التحسينات المقترحة",
      });
      
      setTimeout(calculateSystemStats, 1000);
    } catch (error) {
      toast({
        title: "خطأ في التحسين",
        description: "حدث خطأ أثناء تحسين الأداء",
        variant: "destructive"
      });
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* مؤشرات الأداء */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            مؤشرات الأداء
          </CardTitle>
          <CardDescription>
            مراقبة استخدام الموارد وأداء التطبيق
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* استخدام الذاكرة */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MemoryStick className="h-4 w-4 text-muted-foreground" />
                  <Label>استخدام الذاكرة</Label>
                </div>
                <span className="text-sm">{systemStats.memoryUsage}%</span>
              </div>
              <Progress value={systemStats.memoryUsage} className="h-2" />
            </div>

            {/* استخدام التخزين */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <Label>استخدام التخزين</Label>
                </div>
                <span className="text-sm">{systemStats.storageUsage}%</span>
              </div>
              <Progress value={systemStats.storageUsage} className="h-2" />
            </div>

            {/* حجم الكاش */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>حجم الكاش</Label>
                <span className="text-sm">{systemStats.cacheSize} KB</span>
              </div>
            </div>

            {/* نقاط الأداء */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                  <Label>نقاط الأداء</Label>
                </div>
                <span className={`text-sm font-bold ${getPerformanceColor(systemStats.performanceScore)}`}>
                  {systemStats.performanceScore}/100
                </span>
              </div>
              <Progress value={systemStats.performanceScore} className="h-2" />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={calculateSystemStats} variant="outline" size="sm">
              تحديث الإحصائيات
            </Button>
            <Button onClick={clearCache} variant="outline" size="sm">
              مسح الكاش
            </Button>
            <Button onClick={optimizePerformance} variant="default" size="sm">
              تحسين تلقائي
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* إعدادات الكاش */}
      <Card>
        <CardHeader>
          <CardTitle>إعدادات الكاش والذاكرة</CardTitle>
          <CardDescription>
            تحسين استخدام الذاكرة والتخزين المؤقت
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>تفعيل الكاش</Label>
                <p className="text-sm text-muted-foreground">
                  حفظ البيانات المؤقتة لتسريع التطبيق
                </p>
              </div>
              <Switch
                checked={settings.enableCaching}
                onCheckedChange={(checked) => updateSetting('enableCaching', checked)}
              />
            </div>

            {settings.enableCaching && (
              <div className="space-y-2">
                <Label>حجم الكاش</Label>
                <Select 
                  value={settings.cacheSize} 
                  onValueChange={(value) => updateSetting('cacheSize', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">صغير (10MB)</SelectItem>
                    <SelectItem value="medium">متوسط (50MB)</SelectItem>
                    <SelectItem value="large">كبير (100MB)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* إعدادات التحميل */}
      <Card>
        <CardHeader>
          <CardTitle>إعدادات التحميل والعرض</CardTitle>
          <CardDescription>
            تحسين طريقة تحميل وعرض المحتوى
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>التحميل الكسول</Label>
                <p className="text-sm text-muted-foreground">
                  تحميل المحتوى عند الحاجة فقط
                </p>
              </div>
              <Switch
                checked={settings.enableLazyLoading}
                onCheckedChange={(checked) => updateSetting('enableLazyLoading', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>العرض الافتراضي</Label>
                <p className="text-sm text-muted-foreground">
                  عرض العناصر الظاهرة فقط في القوائم الطويلة
                </p>
              </div>
              <Switch
                checked={settings.enableVirtualization}
                onCheckedChange={(checked) => updateSetting('enableVirtualization', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>التحميل المسبق</Label>
                <p className="text-sm text-muted-foreground">
                  تحميل الصفحات التالية مسبقاً
                </p>
              </div>
              <Switch
                checked={settings.enablePreloading}
                onCheckedChange={(checked) => updateSetting('enablePreloading', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>ضغط البيانات</Label>
                <p className="text-sm text-muted-foreground">
                  ضغط البيانات المرسلة والمستقبلة
                </p>
              </div>
              <Switch
                checked={settings.enableCompression}
                onCheckedChange={(checked) => updateSetting('enableCompression', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>تحسين الصور</Label>
                <p className="text-sm text-muted-foreground">
                  ضغط وتحسين جودة الصور تلقائياً
                </p>
              </div>
              <Switch
                checked={settings.enableOptimizedImages}
                onCheckedChange={(checked) => updateSetting('enableOptimizedImages', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Service Worker</Label>
                <p className="text-sm text-muted-foreground">
                  تفعيل العمل في الخلفية والكاش المتقدم
                </p>
              </div>
              <Switch
                checked={settings.enableServiceWorker}
                onCheckedChange={(checked) => updateSetting('enableServiceWorker', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* زر الحفظ */}
      <div className="flex justify-end">
        <Button
          onClick={saveSettings}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {loading ? 'جاري الحفظ...' : 'حفظ إعدادات الأداء'}
        </Button>
      </div>
    </div>
  );
}