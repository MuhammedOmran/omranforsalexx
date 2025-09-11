import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Palette, Moon, Sun, Languages, Save, Monitor, Type, Zap, Eye, RefreshCw, Contrast } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppearanceSettings } from "@/hooks/useAppearanceSettings";
import { Separator } from "@/components/ui/separator";
import { ThemePreview } from "@/components/ui/theme-preview";

export function AppearanceSettings() {
  const { 
    settings, 
    isLoading, 
    updateSettings, 
    resetToDefaults, 
    applyTheme,
    getColorPalettes,
    getFontOptions 
  } = useAppearanceSettings();
  const { toast } = useToast();

  const [customColor, setCustomColor] = useState(settings.primaryColor);
  const colorPalettes = getColorPalettes();
  const fontOptions = getFontOptions();

  const handleSave = async () => {
    try {
      toast({
        title: "تم حفظ إعدادات المظهر",
        description: "تم تطبيق التغييرات بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ إعدادات المظهر",
        variant: "destructive"
      });
    }
  };

  const handleReset = () => {
    resetToDefaults();
    setCustomColor('#3b82f6');
    toast({
      title: "تم إعادة تعيين الإعدادات",
      description: "تم إعادة جميع إعدادات المظهر للقيم الافتراضية",
    });
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    updateSettings({ theme });
    applyTheme(theme);
  };

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إعدادات المظهر والثيم</h2>
          <p className="text-muted-foreground">تخصيص مظهر التطبيق وتجربة المستخدم</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleReset} 
            variant="outline" 
            size="sm"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            إعادة تعيين
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading}
            size="sm"
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            حفظ التغييرات
          </Button>
        </div>
      </div>

      {/* Theme Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            نمط المظهر
          </CardTitle>
          <CardDescription>
            اختر المظهر المفضل لديك
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => handleThemeChange('light')}
              className={`p-6 border rounded-xl flex flex-col items-center gap-3 transition-all ${
                settings.theme === 'light' 
                  ? 'border-primary bg-primary/10 shadow-lg' 
                  : 'border-border hover:bg-muted/50 hover:shadow-md'
              }`}
            >
              <Sun className="h-8 w-8 text-orange-500" />
              <div className="text-center">
                <p className="font-semibold">فاتح</p>
                <p className="text-xs text-muted-foreground">مظهر نهاري مشرق</p>
              </div>
            </button>
            
            <button
              onClick={() => handleThemeChange('dark')}
              className={`p-6 border rounded-xl flex flex-col items-center gap-3 transition-all ${
                settings.theme === 'dark' 
                  ? 'border-primary bg-primary/10 shadow-lg' 
                  : 'border-border hover:bg-muted/50 hover:shadow-md'
              }`}
            >
              <Moon className="h-8 w-8 text-blue-500" />
              <div className="text-center">
                <p className="font-semibold">داكن</p>
                <p className="text-xs text-muted-foreground">مظهر ليلي هادئ</p>
              </div>
            </button>
            
            <button
              onClick={() => handleThemeChange('system')}
              className={`p-6 border rounded-xl flex flex-col items-center gap-3 transition-all ${
                settings.theme === 'system' 
                  ? 'border-primary bg-primary/10 shadow-lg' 
                  : 'border-border hover:bg-muted/50 hover:shadow-md'
              }`}
            >
              <Monitor className="h-8 w-8 text-purple-500" />
              <div className="text-center">
                <p className="font-semibold">النظام</p>
                <p className="text-xs text-muted-foreground">حسب إعدادات الجهاز</p>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Color Customization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            الألوان والطيف
          </CardTitle>
          <CardDescription>
            اختر ألوان مخصصة للواجهة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Color Palettes */}
          <div className="space-y-3">
            <Label>مجموعات الألوان المحفوظة</Label>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {Object.entries(colorPalettes).map(([key, palette]) => (
                <button
                  key={key}
                  onClick={() => updateSettings({ 
                    primaryColor: palette.primary, 
                    accentColor: palette.accent 
                  })}
                  className={`relative p-3 rounded-lg border-2 transition-all ${
                    settings.primaryColor === palette.primary 
                      ? 'border-primary shadow-md' 
                      : 'border-border hover:border-muted-foreground'
                  }`}
                  title={palette.name}
                >
                  <div 
                    className="w-8 h-8 rounded-full mx-auto"
                    style={{ backgroundColor: palette.primary }}
                  ></div>
                  <p className="text-xs text-center mt-1 font-medium">{palette.name}</p>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Custom Color Picker */}
          <div className="space-y-4">
            <Label>لون مخصص</Label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={customColor}
                onChange={(e) => {
                  setCustomColor(e.target.value);
                  updateSettings({ primaryColor: e.target.value });
                }}
                className="w-16 h-10 rounded-lg border cursor-pointer"
              />
              <div className="flex-1">
                <Label className="text-sm">اللون الأساسي</Label>
                <p className="text-xs text-muted-foreground">{customColor}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
                  setCustomColor(randomColor);
                  updateSettings({ primaryColor: randomColor });
                }}
              >
                عشوائي
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Typography and Layout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            الخطوط والتخطيط
          </CardTitle>
          <CardDescription>
            تخصيص الخطوط وتخطيط المحتوى
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Font Family */}
            <div className="space-y-2">
              <Label>عائلة الخط</Label>
              <Select 
                value={settings.fontFamily} 
                onValueChange={(value) => updateSettings({ fontFamily: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(fontOptions).map(([key, font]) => (
                    <SelectItem key={key} value={key}>
                      <span className={font.class}>{font.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Font Size */}
            <div className="space-y-2">
              <Label>حجم الخط</Label>
              <Select 
                value={settings.fontSize} 
                onValueChange={(value) => updateSettings({ fontSize: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">صغير (14px)</SelectItem>
                  <SelectItem value="medium">متوسط (16px)</SelectItem>
                  <SelectItem value="large">كبير (18px)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Density */}
            <div className="space-y-2">
              <Label>كثافة المحتوى</Label>
              <Select 
                value={settings.density} 
                onValueChange={(value) => updateSettings({ density: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">مضغوط - مساحة أقل</SelectItem>
                  <SelectItem value="comfortable">مريح - متوازن</SelectItem>
                  <SelectItem value="spacious">واسع - مساحة أكبر</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Border Radius */}
            <div className="space-y-2">
              <Label>استدارة الحواف</Label>
              <Select 
                value={settings.borderRadius} 
                onValueChange={(value) => updateSettings({ borderRadius: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">حواف حادة</SelectItem>
                  <SelectItem value="small">استدارة خفيفة</SelectItem>
                  <SelectItem value="medium">استدارة متوسطة</SelectItem>
                  <SelectItem value="large">استدارة كبيرة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language and Direction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            اللغة والاتجاه
          </CardTitle>
          <CardDescription>
            إعدادات لغة التطبيق واتجاه النص
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>لغة التطبيق</Label>
              <Select 
                value={settings.language} 
                onValueChange={(value) => updateSettings({ language: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ar">العربية</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label>الكتابة من اليمين إلى اليسار</Label>
                <p className="text-sm text-muted-foreground">
                  تفعيل اتجاه النص العربي
                </p>
              </div>
              <Switch
                checked={settings.rtlDirection}
                onCheckedChange={(checked) => updateSettings({ rtlDirection: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accessibility and Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            إمكانية الوصول والأداء
          </CardTitle>
          <CardDescription>
            إعدادات لتحسين إمكانية الوصول والأداء
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    الحركات والانتقالات
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    تفعيل الحركات البصرية
                  </p>
                </div>
                <Switch
                  checked={settings.animations}
                  onCheckedChange={(checked) => updateSettings({ animations: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>الوضع المضغوط</Label>
                  <p className="text-sm text-muted-foreground">
                    عرض المزيد من المحتوى
                  </p>
                </div>
                <Switch
                  checked={settings.compactMode}
                  onCheckedChange={(checked) => updateSettings({ compactMode: checked })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Contrast className="h-4 w-4" />
                    التباين العالي
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    لتحسين الرؤية
                  </p>
                </div>
                <Switch
                  checked={settings.highContrast}
                  onCheckedChange={(checked) => updateSettings({ highContrast: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>تقليل الحركة</Label>
                  <p className="text-sm text-muted-foreground">
                    للمستخدمين الحساسين للحركة
                  </p>
                </div>
                <Switch
                  checked={settings.reducedMotion}
                  onCheckedChange={(checked) => updateSettings({ reducedMotion: checked })}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Section */}
      <Card>
        <CardHeader>
          <CardTitle>معاينة المظهر</CardTitle>
          <CardDescription>
            مثال حي على كيفية ظهور الواجهة بالإعدادات الحالية
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemePreview 
            primaryColor={settings.primaryColor}
            accentColor={settings.accentColor}
            fontFamily={settings.fontFamily}
            borderRadius={settings.borderRadius}
            density={settings.density}
            fontSize={settings.fontSize}
          />
        </CardContent>
      </Card>
    </div>
  );
}