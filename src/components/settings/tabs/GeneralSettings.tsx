import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Save, RotateCcw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useAutoBackupSettings } from "@/hooks/useAutoBackupSettings";

interface GeneralSettingsData {
  autoSave: boolean;
  autoBackup: boolean;
  sessionTimeout: string;
  defaultCurrency: string;
  dateFormat: string;
  numberFormat: string;
  showTooltips: boolean;
  confirmDeletions: boolean;
  enableSounds: boolean;
}

const defaultSettings: GeneralSettingsData = {
  autoSave: true,
  autoBackup: false,
  sessionTimeout: '30',
  defaultCurrency: 'SAR',
  dateFormat: 'dd/MM/yyyy',
  numberFormat: 'arabic',
  showTooltips: true,
  confirmDeletions: true,
  enableSounds: false,
};

export function GeneralSettings() {
  const [settings, setSettings] = useState<GeneralSettingsData>(defaultSettings);
  const { loading, getCategorySettings, setCategorySettings } = useAppSettings();
  const { 
    settings: autoBackupSettings, 
    loading: autoBackupLoading, 
    saveSettings: saveAutoBackupSettings 
  } = useAutoBackupSettings();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await getCategorySettings('general');
      if (Object.keys(savedSettings).length > 0) {
        setSettings({ ...defaultSettings, ...savedSettings });
      }
    } catch (error) {
      console.error('خطأ في تحميل الإعدادات العامة:', error);
    }
  };

  const saveSettings = async () => {
    try {
      const success = await setCategorySettings('general', settings);
      if (success) {
        toast({
          title: "تم حفظ الإعدادات",
          description: "تم حفظ الإعدادات العامة بنجاح",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ الإعدادات",
        variant: "destructive"
      });
    }
  };

  const resetSettings = async () => {
    setSettings(defaultSettings);
    const success = await setCategorySettings('general', defaultSettings);
    if (success) {
      toast({
        title: "تم إعادة تعيين الإعدادات",
        description: "تم إعادة تعيين جميع الإعدادات إلى القيم الافتراضية",
      });
    }
  };

  const updateSetting = (key: keyof GeneralSettingsData, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* الإعدادات الأساسية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            الإعدادات الأساسية
          </CardTitle>
          <CardDescription>
            إعدادات عامة تؤثر على سلوك التطبيق
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* الحفظ التلقائي */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>الحفظ التلقائي</Label>
                <p className="text-sm text-muted-foreground">
                  حفظ البيانات تلقائياً عند التعديل
                </p>
              </div>
              <Switch
                checked={settings.autoSave}
                onCheckedChange={(checked) => updateSetting('autoSave', checked)}
              />
            </div>

            {/* النسخ الاحتياطي التلقائي */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>النسخ الاحتياطي التلقائي</Label>
                <p className="text-sm text-muted-foreground">
                  إنشاء نسخة احتياطية يومياً في الساعة {autoBackupSettings.backup_time?.slice(0, 5) || '02:00'}
                  {autoBackupSettings.enabled && autoBackupSettings.next_backup_date && (
                    <span className="block text-xs text-green-600 mt-1">
                      النسخة التالية: {new Date(autoBackupSettings.next_backup_date).toLocaleString('ar-SA')}
                    </span>
                  )}
                </p>
              </div>
              <Switch
                checked={autoBackupSettings.enabled}
                onCheckedChange={async (checked) => {
                  await saveAutoBackupSettings({ enabled: checked });
                  // تحديث الإعداد المحلي أيضاً للتوافق مع النظام القديم
                  updateSetting('autoBackup', checked);
                }}
                disabled={autoBackupLoading}
              />
            </div>

            {/* إظهار التلميحات */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>إظهار التلميحات</Label>
                <p className="text-sm text-muted-foreground">
                  عرض نصائح مساعدة عند التنقل
                </p>
              </div>
              <Switch
                checked={settings.showTooltips}
                onCheckedChange={(checked) => updateSetting('showTooltips', checked)}
              />
            </div>

            {/* تأكيد الحذف */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>تأكيد عمليات الحذف</Label>
                <p className="text-sm text-muted-foreground">
                  طلب تأكيد قبل حذف العناصر
                </p>
              </div>
              <Switch
                checked={settings.confirmDeletions}
                onCheckedChange={(checked) => updateSetting('confirmDeletions', checked)}
              />
            </div>

            {/* تفعيل الأصوات */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>تفعيل الأصوات</Label>
                <p className="text-sm text-muted-foreground">
                  تشغيل أصوات التنبيهات والإشعارات
                </p>
              </div>
              <Switch
                checked={settings.enableSounds}
                onCheckedChange={(checked) => updateSetting('enableSounds', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* إعدادات التنسيق */}
      <Card>
        <CardHeader>
          <CardTitle>إعدادات التنسيق</CardTitle>
          <CardDescription>
            تخصيص تنسيق عرض البيانات
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* العملة الافتراضية */}
            <div className="space-y-2">
              <Label>العملة الافتراضية</Label>
              <Select 
                value={settings.defaultCurrency} 
                onValueChange={(value) => updateSetting('defaultCurrency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SAR">ريال سعودي (SAR)</SelectItem>
                  <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                  <SelectItem value="EUR">يورو (EUR)</SelectItem>
                  <SelectItem value="AED">درهم إماراتي (AED)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* تنسيق التاريخ */}
            <div className="space-y-2">
              <Label>تنسيق التاريخ</Label>
              <Select 
                value={settings.dateFormat} 
                onValueChange={(value) => updateSetting('dateFormat', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dd/MM/yyyy">يوم/شهر/سنة</SelectItem>
                  <SelectItem value="MM/dd/yyyy">شهر/يوم/سنة</SelectItem>
                  <SelectItem value="yyyy-MM-dd">سنة-شهر-يوم</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* تنسيق الأرقام */}
            <div className="space-y-2">
              <Label>تنسيق الأرقام</Label>
              <Select 
                value={settings.numberFormat} 
                onValueChange={(value) => updateSetting('numberFormat', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="arabic">أرقام عربية</SelectItem>
                  <SelectItem value="english">أرقام إنجليزية</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* مهلة انتهاء الجلسة */}
            <div className="space-y-2">
              <Label>مهلة انتهاء الجلسة (دقيقة)</Label>
              <Input
                type="number"
                min="5"
                max="480"
                value={settings.sessionTimeout}
                onChange={(e) => updateSetting('sessionTimeout', e.target.value)}
                placeholder="30"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* أزرار التحكم */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={resetSettings}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          إعادة تعيين
        </Button>
        
        <Button
          onClick={saveSettings}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {loading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </Button>
      </div>
    </div>
  );
}