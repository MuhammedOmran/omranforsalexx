import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plug, Key, Globe, Database, Smartphone, Save, Plus, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAppSettings } from "@/hooks/useAppSettings";

interface APIKey {
  id: string;
  name: string;
  key: string;
  service: string;
  enabled: boolean;
  created: string;
}

interface IntegrationSettingsData {
  apiKeys: APIKey[];
  enableWebhooks: boolean;
  webhookUrl: string;
  enableExport: boolean;
  enableImport: boolean;
  syncInterval: number;
  enableCloudSync: boolean;
  enableMobileSync: boolean;
}

const defaultSettings: IntegrationSettingsData = {
  apiKeys: [],
  enableWebhooks: false,
  webhookUrl: '',
  enableExport: true,
  enableImport: true,
  syncInterval: 60,
  enableCloudSync: false,
  enableMobileSync: false,
};

export function IntegrationSettings() {
  const [settings, setSettings] = useState<IntegrationSettingsData>(defaultSettings);
  const [newApiKey, setNewApiKey] = useState({ name: '', key: '', service: '' });
  const { loading, getCategorySettings, setCategorySettings } = useAppSettings();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await getCategorySettings('integrations');
      if (Object.keys(savedSettings).length > 0) {
        setSettings({ ...defaultSettings, ...savedSettings });
      }
    } catch (error) {
      console.error('خطأ في تحميل إعدادات التكاملات:', error);
    }
  };

  const saveSettings = async () => {
    try {
      const success = await setCategorySettings('integrations', settings);
      if (success) {
        toast({
          title: "تم حفظ إعدادات التكاملات",
          description: "تم تطبيق التغييرات بنجاح",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ إعدادات التكاملات",
        variant: "destructive"
      });
    }
  };

  const updateSetting = (key: keyof IntegrationSettingsData, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const addApiKey = () => {
    if (!newApiKey.name || !newApiKey.key || !newApiKey.service) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى ملء جميع الحقول",
        variant: "destructive"
      });
      return;
    }

    const apiKey: APIKey = {
      id: Date.now().toString(),
      name: newApiKey.name,
      key: newApiKey.key,
      service: newApiKey.service,
      enabled: true,
      created: new Date().toISOString(),
    };

    setSettings(prev => ({
      ...prev,
      apiKeys: [...prev.apiKeys, apiKey]
    }));

    setNewApiKey({ name: '', key: '', service: '' });
    
    toast({
      title: "تم إضافة مفتاح API",
      description: `تم إضافة مفتاح ${newApiKey.name} بنجاح`,
    });
  };

  const removeApiKey = (id: string) => {
    setSettings(prev => ({
      ...prev,
      apiKeys: prev.apiKeys.filter(key => key.id !== id)
    }));
    
    toast({
      title: "تم حذف مفتاح API",
      description: "تم حذف المفتاح بنجاح",
    });
  };

  const toggleApiKey = (id: string) => {
    setSettings(prev => ({
      ...prev,
      apiKeys: prev.apiKeys.map(key => 
        key.id === id ? { ...key, enabled: !key.enabled } : key
      )
    }));
  };

  const availableServices = [
    'Google Drive',
    'Dropbox',
    'OneDrive',
    'WhatsApp Business',
    'Telegram',
    'SMS Gateway',
    'Email Service',
    'Payment Gateway',
    'Accounting Software',
    'CRM System'
  ];

  return (
    <div className="space-y-6">
      {/* مفاتيح API */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            مفاتيح API
          </CardTitle>
          <CardDescription>
            إدارة مفاتيح الخدمات الخارجية
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* إضافة مفتاح جديد */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <Input
              placeholder="اسم المفتاح"
              value={newApiKey.name}
              onChange={(e) => setNewApiKey(prev => ({ ...prev, name: e.target.value }))}
            />
            <select
              className="p-2 border rounded-md"
              value={newApiKey.service}
              onChange={(e) => setNewApiKey(prev => ({ ...prev, service: e.target.value }))}
            >
              <option value="">اختر الخدمة</option>
              {availableServices.map(service => (
                <option key={service} value={service}>{service}</option>
              ))}
            </select>
            <Input
              placeholder="مفتاح API"
              type="password"
              value={newApiKey.key}
              onChange={(e) => setNewApiKey(prev => ({ ...prev, key: e.target.value }))}
            />
            <Button onClick={addApiKey} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              إضافة
            </Button>
          </div>

          {/* قائمة المفاتيح */}
          <div className="space-y-2">
            {settings.apiKeys.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                لا توجد مفاتيح API مضافة
              </p>
            ) : (
              settings.apiKeys.map((apiKey) => (
                <div key={apiKey.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={apiKey.enabled}
                      onCheckedChange={() => toggleApiKey(apiKey.id)}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{apiKey.name}</span>
                        <Badge variant="secondary">{apiKey.service}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        تم الإنشاء: {new Date(apiKey.created).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeApiKey(apiKey.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* إعدادات Webhooks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Webhooks
          </CardTitle>
          <CardDescription>
            إرسال البيانات تلقائياً للأنظمة الخارجية
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>تفعيل Webhooks</Label>
              <p className="text-sm text-muted-foreground">
                إرسال تحديثات البيانات للأنظمة الخارجية
              </p>
            </div>
            <Switch
              checked={settings.enableWebhooks}
              onCheckedChange={(checked) => updateSetting('enableWebhooks', checked)}
            />
          </div>

          {settings.enableWebhooks && (
            <div className="space-y-2">
              <Label>رابط Webhook</Label>
              <Input
                type="url"
                placeholder="https://example.com/webhook"
                value={settings.webhookUrl}
                onChange={(e) => updateSetting('webhookUrl', e.target.value)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* إعدادات المزامنة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            المزامنة والنسخ
          </CardTitle>
          <CardDescription>
            إعدادات مزامنة البيانات مع الأنظمة الأخرى
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>تفعيل التصدير</Label>
                <p className="text-sm text-muted-foreground">
                  السماح بتصدير البيانات
                </p>
              </div>
              <Switch
                checked={settings.enableExport}
                onCheckedChange={(checked) => updateSetting('enableExport', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>تفعيل الاستيراد</Label>
                <p className="text-sm text-muted-foreground">
                  السماح باستيراد البيانات
                </p>
              </div>
              <Switch
                checked={settings.enableImport}
                onCheckedChange={(checked) => updateSetting('enableImport', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>المزامنة السحابية</Label>
                <p className="text-sm text-muted-foreground">
                  مزامنة البيانات مع التخزين السحابي
                </p>
              </div>
              <Switch
                checked={settings.enableCloudSync}
                onCheckedChange={(checked) => updateSetting('enableCloudSync', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>مزامنة الجوال</Label>
                <p className="text-sm text-muted-foreground">
                  مزامنة البيانات مع التطبيق المحمول
                </p>
              </div>
              <Switch
                checked={settings.enableMobileSync}
                onCheckedChange={(checked) => updateSetting('enableMobileSync', checked)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>فترة المزامنة (دقيقة)</Label>
            <Input
              type="number"
              min="1"
              max="1440"
              value={settings.syncInterval}
              onChange={(e) => updateSetting('syncInterval', parseInt(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      {/* التكاملات المحمولة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            التكاملات المحمولة
          </CardTitle>
          <CardDescription>
            إعدادات التطبيق المحمول والإشعارات
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Smartphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>التكاملات المحمولة قيد التطوير</p>
            <p className="text-sm">سيتم إضافة دعم التطبيق المحمول قريباً</p>
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
          {loading ? 'جاري الحفظ...' : 'حفظ إعدادات التكاملات'}
        </Button>
      </div>
    </div>
  );
}