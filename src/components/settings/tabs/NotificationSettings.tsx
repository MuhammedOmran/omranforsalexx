import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Mail, MessageCircle, Volume2, Smartphone, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAppSettings } from "@/hooks/useAppSettings";

interface NotificationSettingsData {
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundNotifications: boolean;
  desktopNotifications: boolean;
  
  // إشعارات المبيعات
  salesAlerts: boolean;
  lowStockAlerts: boolean;
  paymentReminders: boolean;
  
  // إشعارات النظام
  systemUpdates: boolean;
  securityAlerts: boolean;
  backupNotifications: boolean;
  
  // التوقيت
  quietHoursEnabled: boolean;
  quietStartTime: string;
  quietEndTime: string;
  
  // التكرار
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
}

const defaultSettings: NotificationSettingsData = {
  emailNotifications: true,
  pushNotifications: true,
  soundNotifications: false,
  desktopNotifications: true,
  
  salesAlerts: true,
  lowStockAlerts: true,
  paymentReminders: true,
  
  systemUpdates: true,
  securityAlerts: true,
  backupNotifications: false,
  
  quietHoursEnabled: false,
  quietStartTime: '22:00',
  quietEndTime: '08:00',
  
  frequency: 'immediate',
};

export function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettingsData>(defaultSettings);
  const { loading, getCategorySettings, setCategorySettings } = useAppSettings();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await getCategorySettings('notifications');
      if (Object.keys(savedSettings).length > 0) {
        setSettings({ ...defaultSettings, ...savedSettings });
      }
    } catch (error) {
      console.error('خطأ في تحميل إعدادات الإشعارات:', error);
    }
  };

  const saveSettings = async () => {
    try {
      const success = await setCategorySettings('notifications', settings);
      if (success) {
        toast({
          title: "تم حفظ إعدادات الإشعارات",
          description: "تم تطبيق التغييرات بنجاح",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ إعدادات الإشعارات",
        variant: "destructive"
      });
    }
  };

  const updateSetting = (key: keyof NotificationSettingsData, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast({
          title: "تم تفعيل الإشعارات",
          description: "سيتم إرسال الإشعارات إليك الآن",
        });
      } else {
        toast({
          title: "تم رفض الإشعارات",
          description: "لن تصلك إشعارات المتصفح",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* طرق الإشعار */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            طرق الإشعار
          </CardTitle>
          <CardDescription>
            اختر كيف تريد تلقي الإشعارات
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div className="space-y-0.5">
                  <Label>إشعارات البريد الإلكتروني</Label>
                  <p className="text-sm text-muted-foreground">
                    تلقي الإشعارات عبر البريد الإلكتروني
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
                <div className="space-y-0.5">
                  <Label>إشعارات الدفع</Label>
                  <p className="text-sm text-muted-foreground">
                    إشعارات فورية على الجهاز
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-muted-foreground" />
                <div className="space-y-0.5">
                  <Label>إشعارات المتصفح</Label>
                  <p className="text-sm text-muted-foreground">
                    إشعارات على سطح المكتب
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={settings.desktopNotifications}
                  onCheckedChange={(checked) => updateSetting('desktopNotifications', checked)}
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={requestNotificationPermission}
                >
                  تفعيل
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Volume2 className="h-5 w-5 text-muted-foreground" />
                <div className="space-y-0.5">
                  <Label>الإشعارات الصوتية</Label>
                  <p className="text-sm text-muted-foreground">
                    تشغيل صوت مع الإشعارات
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.soundNotifications}
                onCheckedChange={(checked) => updateSetting('soundNotifications', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* أنواع الإشعارات */}
      <Card>
        <CardHeader>
          <CardTitle>أنواع الإشعارات</CardTitle>
          <CardDescription>
            اختر أنواع الإشعارات التي تريد تلقيها
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* إشعارات المبيعات */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">إشعارات المبيعات والمخزون</h4>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>تنبيهات المبيعات</Label>
                <p className="text-sm text-muted-foreground">
                  إشعار عند حدوث مبيعة جديدة
                </p>
              </div>
              <Switch
                checked={settings.salesAlerts}
                onCheckedChange={(checked) => updateSetting('salesAlerts', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>تنبيهات نفاد المخزون</Label>
                <p className="text-sm text-muted-foreground">
                  إشعار عند انخفاض كمية المنتج
                </p>
              </div>
              <Switch
                checked={settings.lowStockAlerts}
                onCheckedChange={(checked) => updateSetting('lowStockAlerts', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>تذكير المدفوعات</Label>
                <p className="text-sm text-muted-foreground">
                  تذكير بالمدفوعات المستحقة
                </p>
              </div>
              <Switch
                checked={settings.paymentReminders}
                onCheckedChange={(checked) => updateSetting('paymentReminders', checked)}
              />
            </div>
          </div>

          {/* إشعارات النظام */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">إشعارات النظام</h4>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>تحديثات النظام</Label>
                <p className="text-sm text-muted-foreground">
                  إشعار عند توفر تحديثات جديدة
                </p>
              </div>
              <Switch
                checked={settings.systemUpdates}
                onCheckedChange={(checked) => updateSetting('systemUpdates', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>تنبيهات الأمان</Label>
                <p className="text-sm text-muted-foreground">
                  إشعار عند وجود مشاكل أمنية
                </p>
              </div>
              <Switch
                checked={settings.securityAlerts}
                onCheckedChange={(checked) => updateSetting('securityAlerts', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>إشعارات النسخ الاحتياطي</Label>
                <p className="text-sm text-muted-foreground">
                  إشعار عند اكتمال النسخ الاحتياطي
                </p>
              </div>
              <Switch
                checked={settings.backupNotifications}
                onCheckedChange={(checked) => updateSetting('backupNotifications', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* إعدادات التوقيت */}
      <Card>
        <CardHeader>
          <CardTitle>إعدادات التوقيت</CardTitle>
          <CardDescription>
            تخصيص أوقات وتكرار الإشعارات
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* تكرار الإشعارات */}
            <div className="space-y-2">
              <Label>تكرار الإشعارات</Label>
              <Select 
                value={settings.frequency} 
                onValueChange={(value) => updateSetting('frequency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">فوري</SelectItem>
                  <SelectItem value="hourly">كل ساعة</SelectItem>
                  <SelectItem value="daily">يومي</SelectItem>
                  <SelectItem value="weekly">أسبوعي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ساعات الهدوء */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>ساعات الهدوء</Label>
                <p className="text-sm text-muted-foreground">
                  تعطيل الإشعارات في أوقات معينة
                </p>
              </div>
              <Switch
                checked={settings.quietHoursEnabled}
                onCheckedChange={(checked) => updateSetting('quietHoursEnabled', checked)}
              />
            </div>

            {settings.quietHoursEnabled && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>بداية الهدوء</Label>
                  <input
                    type="time"
                    value={settings.quietStartTime}
                    onChange={(e) => updateSetting('quietStartTime', e.target.value)}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>نهاية الهدوء</Label>
                  <input
                    type="time"
                    value={settings.quietEndTime}
                    onChange={(e) => updateSetting('quietEndTime', e.target.value)}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
              </div>
            )}
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
          {loading ? 'جاري الحفظ...' : 'حفظ إعدادات الإشعارات'}
        </Button>
      </div>
    </div>
  );
}