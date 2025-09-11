import React, { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Settings, 
  Mail, 
  MessageSquare, 
  Bell, 
  Clock,
  Shield,
  Volume2
} from 'lucide-react';

interface NotificationSettings {
  id?: string;
  user_id: string;
  email_enabled: boolean;
  email_address?: string;
  sms_enabled: boolean;
  phone_number?: string;
  push_enabled: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  timezone: string;
  notification_preferences: Record<string, any>;
  channel_preferences: Record<string, any>;
}

export function NotificationSettings() {
  const { user } = useSupabaseAuth();
  const [settings, setSettings] = useState<NotificationSettings>({
    user_id: '',
    email_enabled: true,
    sms_enabled: false,
    push_enabled: true,
    timezone: 'Africa/Cairo',
    notification_preferences: {},
    channel_preferences: {}
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({
          ...data,
          notification_preferences: typeof data.notification_preferences === 'object' 
            ? data.notification_preferences as Record<string, any>
            : {},
          channel_preferences: typeof data.channel_preferences === 'object'
            ? data.channel_preferences as Record<string, any>
            : {}
        });
      } else {
        // إنشاء إعدادات افتراضية
        setSettings(prev => ({ ...prev, user_id: user?.id || '' }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('خطأ في تحميل الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('notification_settings')
        .upsert(settings, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        });

      if (error) throw error;

      toast.success('تم حفظ الإعدادات بنجاح');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('خطأ في حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (updates: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const updatePreference = (category: string, enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      notification_preferences: {
        ...prev.notification_preferences,
        [category]: enabled
      }
    }));
  };

  const updateChannelPreference = (category: string, channel: string, enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      channel_preferences: {
        ...prev.channel_preferences,
        [`${category}_${channel}`]: enabled
      }
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">جاري تحميل الإعدادات...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">إعدادات الإشعارات</h1>
      </div>

      <Tabs defaultValue="channels" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="channels">القنوات</TabsTrigger>
          <TabsTrigger value="categories">الفئات</TabsTrigger>
          <TabsTrigger value="schedule">التوقيت</TabsTrigger>
          <TabsTrigger value="advanced">متقدم</TabsTrigger>
        </TabsList>

        <TabsContent value="channels">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                قنوات الإشعارات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* إشعارات التطبيق */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-blue-500" />
                    <div>
                      <Label className="text-base font-medium">إشعارات التطبيق</Label>
                      <p className="text-sm text-muted-foreground">إشعارات داخل التطبيق</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.push_enabled}
                    onCheckedChange={(checked) => updateSettings({ push_enabled: checked })}
                  />
                </div>
              </div>

              {/* البريد الإلكتروني */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-green-500" />
                    <div>
                      <Label className="text-base font-medium">البريد الإلكتروني</Label>
                      <p className="text-sm text-muted-foreground">تلقي الإشعارات عبر البريد الإلكتروني</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.email_enabled}
                    onCheckedChange={(checked) => updateSettings({ email_enabled: checked })}
                  />
                </div>
                
                {settings.email_enabled && (
                  <div className="pr-8">
                    <Label htmlFor="email">عنوان البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.email_address || ''}
                      onChange={(e) => updateSettings({ email_address: e.target.value })}
                      placeholder="example@email.com"
                    />
                  </div>
                )}
              </div>

              {/* الرسائل النصية */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-orange-500" />
                    <div>
                      <Label className="text-base font-medium">الرسائل النصية</Label>
                      <p className="text-sm text-muted-foreground">تلقي الإشعارات عبر الرسائل النصية</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.sms_enabled}
                    onCheckedChange={(checked) => updateSettings({ sms_enabled: checked })}
                  />
                </div>
                
                {settings.sms_enabled && (
                  <div className="pr-8">
                    <Label htmlFor="phone">رقم الهاتف</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={settings.phone_number || ''}
                      onChange={(e) => updateSettings({ phone_number: e.target.value })}
                      placeholder="+20xxxxxxxxxx"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>تفضيلات الفئات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { key: 'financial', label: 'الإشعارات المالية', description: 'فواتير، رصيد، مدفوعات' },
                  { key: 'inventory', label: 'إشعارات المخزون', description: 'مخزون منخفض، نفاد الكمية' },
                  { key: 'customer', label: 'إشعارات العملاء', description: 'عملاء جدد، متأخرين في السداد' },
                  { key: 'reports', label: 'التقارير', description: 'تقارير شهرية، إحصائيات' },
                  { key: 'security', label: 'الأمان', description: 'تنبيهات أمنية، محاولات دخول' },
                  { key: 'system', label: 'النظام', description: 'تحديثات، صيانة' }
                ].map((category) => (
                  <div key={category.key} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-medium">{category.label}</Label>
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      </div>
                      <Switch
                        checked={settings.notification_preferences[category.key] !== false}
                        onCheckedChange={(checked) => updatePreference(category.key, checked)}
                      />
                    </div>
                    
                    {settings.notification_preferences[category.key] !== false && (
                      <div className="pr-6 space-y-2">
                        <Label className="text-sm text-muted-foreground">القنوات المفعلة:</Label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={settings.channel_preferences[`${category.key}_push`] !== false}
                              onChange={(e) => updateChannelPreference(category.key, 'push', e.target.checked)}
                            />
                            <span className="text-sm">التطبيق</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={settings.channel_preferences[`${category.key}_email`] !== false}
                              onChange={(e) => updateChannelPreference(category.key, 'email', e.target.checked)}
                            />
                            <span className="text-sm">البريد</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={settings.channel_preferences[`${category.key}_sms`] !== false}
                              onChange={(e) => updateChannelPreference(category.key, 'sms', e.target.checked)}
                            />
                            <span className="text-sm">رسائل نصية</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                إعدادات التوقيت
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>المنطقة الزمنية</Label>
                <Select 
                  value={settings.timezone} 
                  onValueChange={(value) => updateSettings({ timezone: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Africa/Cairo">القاهرة (GMT+2)</SelectItem>
                    <SelectItem value="Asia/Riyadh">الرياض (GMT+3)</SelectItem>
                    <SelectItem value="Asia/Dubai">دبي (GMT+4)</SelectItem>
                    <SelectItem value="Europe/London">لندن (GMT)</SelectItem>
                    <SelectItem value="America/New_York">نيويورك (GMT-5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>ساعات الصمت</Label>
                <p className="text-sm text-muted-foreground">
                  لن تصلك إشعارات خلال هذه الفترة (باستثناء الحرجة)
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quiet-start">من الساعة</Label>
                    <Input
                      id="quiet-start"
                      type="time"
                      value={settings.quiet_hours_start || ''}
                      onChange={(e) => updateSettings({ quiet_hours_start: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="quiet-end">إلى الساعة</Label>
                    <Input
                      id="quiet-end"
                      type="time"
                      value={settings.quiet_hours_end || ''}
                      onChange={(e) => updateSettings({ quiet_hours_end: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                الإعدادات المتقدمة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <h3 className="font-medium text-orange-800 mb-2">إشعارات الطوارئ</h3>
                  <p className="text-sm text-orange-700 mb-3">
                    الإشعارات الحرجة ستصلك دائماً بغض النظر عن إعدادات الصمت
                  </p>
                  <Switch
                    checked={true}
                    disabled
                  />
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-800 mb-2">إشعارات التطبيق المحمول</h3>
                  <p className="text-sm text-blue-700 mb-3">
                    تفعيل الإشعارات عند استخدام التطبيق على الهاتف المحمول
                  </p>
                  <Switch
                    checked={settings.notification_preferences.mobile_push !== false}
                    onCheckedChange={(checked) => updatePreference('mobile_push', checked)}
                  />
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-medium text-green-800 mb-2">التحديثات التلقائية</h3>
                  <p className="text-sm text-green-700 mb-3">
                    تلقي إشعارات حول تحديثات النظام والميزات الجديدة
                  </p>
                  <Switch
                    checked={settings.notification_preferences.system_updates !== false}
                    onCheckedChange={(checked) => updatePreference('system_updates', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button 
          onClick={saveSettings} 
          disabled={saving}
          className="min-w-32"
        >
          {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </Button>
      </div>
    </div>
  );
}