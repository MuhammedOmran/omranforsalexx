import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Lock, Key, Eye, AlertTriangle, Save, Smartphone } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAppSettings } from "@/hooks/useAppSettings";

import { useSecurityAudit } from '@/hooks/useSecurityAudit';

interface SecuritySettingsData {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  passwordRequirement: 'weak' | 'medium' | 'strong';
  loginAttempts: number;
  auditLogging: boolean;
  encryptData: boolean;
  secureMode: boolean;
  autoLockEnabled: boolean;
  autoLockTime: number;
  biometricEnabled: boolean;
  securityQuestions: boolean;
}

const defaultSettings: SecuritySettingsData = {
  twoFactorEnabled: false,
  sessionTimeout: 30,
  passwordRequirement: 'medium',
  loginAttempts: 3,
  auditLogging: true,
  encryptData: true,
  secureMode: false,
  autoLockEnabled: false,
  autoLockTime: 5,
  biometricEnabled: false,
  securityQuestions: false,
};

export function SecuritySettings() {
  const [settings, setSettings] = useState<SecuritySettingsData>(defaultSettings);
  const [showAuditDashboard, setShowAuditDashboard] = useState(false);
  const { logSensitiveAccess } = useSecurityAudit();
  const { loading, getCategorySettings, setCategorySettings } = useAppSettings();

  useEffect(() => {
    loadSettings();
    logSensitiveAccess('security_settings', 'view');
  }, [logSensitiveAccess]);

  const loadSettings = async () => {
    try {
      const savedSettings = await getCategorySettings('security');
      if (Object.keys(savedSettings).length > 0) {
        setSettings({ ...defaultSettings, ...savedSettings });
      }
    } catch (error) {
      console.error('خطأ في تحميل إعدادات الأمان:', error);
    }
  };

  const saveSettings = async () => {
    try {
      const oldSettings = { ...settings };
      const success = await setCategorySettings('security', settings);
      
      if (success) {
        logSensitiveAccess('security_settings', 'modify', oldSettings, settings);
        
        toast({
          title: "تم حفظ إعدادات الأمان",
          description: "تم تطبيق التغييرات الأمنية بنجاح",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ إعدادات الأمان",
        variant: "destructive"
      });
    }
  };

  const updateSetting = (key: keyof SecuritySettingsData, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const enableTwoFactor = () => {
    // محاكاة تفعيل المصادقة الثنائية
    updateSetting('twoFactorEnabled', true);
    toast({
      title: "تم تفعيل المصادقة الثنائية",
      description: "سيتم طلب رمز التحقق عند تسجيل الدخول",
    });
  };

  return (
    <div className="space-y-6">
      {/* إعدادات المصادقة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            إعدادات المصادقة
          </CardTitle>
          <CardDescription>
            تأمين حسابك بطبقات حماية إضافية
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* المصادقة الثنائية */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label>المصادقة الثنائية (2FA)</Label>
                <p className="text-sm text-muted-foreground">
                  طبقة حماية إضافية لحسابك
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={settings.twoFactorEnabled}
                onCheckedChange={(checked) => checked ? enableTwoFactor() : updateSetting('twoFactorEnabled', false)}
              />
              {settings.twoFactorEnabled && (
                <Button variant="outline" size="sm">
                  إعادة تكوين
                </Button>
              )}
            </div>
          </div>

          {/* متطلبات كلمة المرور */}
          <div className="space-y-3">
            <Label>قوة كلمة المرور المطلوبة</Label>
            <Select 
              value={settings.passwordRequirement} 
              onValueChange={(value) => updateSetting('passwordRequirement', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weak">ضعيفة (6 أحرف)</SelectItem>
                <SelectItem value="medium">متوسطة (8 أحرف + أرقام)</SelectItem>
                <SelectItem value="strong">قوية (12 حرف + رموز)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* محاولات تسجيل الدخول */}
          <div className="space-y-2">
            <Label>عدد محاولات تسجيل الدخول المسموحة</Label>
            <Input
              type="number"
              min="1"
              max="10"
              value={settings.loginAttempts}
              onChange={(e) => updateSetting('loginAttempts', parseInt(e.target.value))}
            />
          </div>

          {/* مهلة انتهاء الجلسة */}
          <div className="space-y-2">
            <Label>مهلة انتهاء الجلسة (دقيقة)</Label>
            <Input
              type="number"
              min="5"
              max="480"
              value={settings.sessionTimeout}
              onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      {/* إعدادات حماية البيانات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            حماية البيانات
          </CardTitle>
          <CardDescription>
            إعدادات تشفير وحماية المعلومات
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>تشفير البيانات</Label>
                <p className="text-sm text-muted-foreground">
                  تشفير البيانات المحفوظة محلياً
                </p>
              </div>
              <Switch
                checked={settings.encryptData}
                onCheckedChange={(checked) => updateSetting('encryptData', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>الوضع الآمن</Label>
                <p className="text-sm text-muted-foreground">
                  تفعيل إجراءات أمان إضافية
                </p>
              </div>
              <Switch
                checked={settings.secureMode}
                onCheckedChange={(checked) => updateSetting('secureMode', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>تسجيل العمليات الأمنية</Label>
                <p className="text-sm text-muted-foreground">
                  تسجيل جميع الأنشطة الحساسة
                </p>
              </div>
              <Switch
                checked={settings.auditLogging}
                onCheckedChange={(checked) => updateSetting('auditLogging', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* القفل التلقائي */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            القفل التلقائي
          </CardTitle>
          <CardDescription>
            حماية التطبيق عند عدم الاستخدام
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>تفعيل القفل التلقائي</Label>
              <p className="text-sm text-muted-foreground">
                قفل التطبيق بعد فترة عدم نشاط
              </p>
            </div>
            <Switch
              checked={settings.autoLockEnabled}
              onCheckedChange={(checked) => updateSetting('autoLockEnabled', checked)}
            />
          </div>

          {settings.autoLockEnabled && (
            <div className="space-y-2">
              <Label>مدة عدم النشاط (دقيقة)</Label>
              <Input
                type="number"
                min="1"
                max="60"
                value={settings.autoLockTime}
                onChange={(e) => updateSetting('autoLockTime', parseInt(e.target.value))}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* لوحة مراقبة الأمان */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            مراقبة الأمان
          </CardTitle>
          <CardDescription>
            عرض أحداث الأمان وسجل التدقيق
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center py-8 text-muted-foreground">
              تم إزالة لوحة مراقبة الأمان
            </div>
          </div>
        </CardContent>
      </Card>

      {/* أزرار التحكم */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={async () => {
            setSettings(defaultSettings);
            await setCategorySettings('security', defaultSettings);
            toast({
              title: "تم إعادة تعيين إعدادات الأمان",
              description: "تم إعادة تعيين جميع الإعدادات الأمنية",
            });
          }}
          className="flex items-center gap-2"
        >
          <AlertTriangle className="h-4 w-4" />
          إعادة تعيين
        </Button>
        
        <Button
          onClick={saveSettings}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {loading ? 'جاري الحفظ...' : 'حفظ إعدادات الأمان'}
        </Button>
      </div>
    </div>
  );
}