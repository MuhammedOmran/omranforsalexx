import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { 
  Palette, 
  Upload, 
  Save, 
  RotateCcw, 
  Copy, 
  Download,
  FileText,
  QrCode,
  Image as ImageIcon,
  Type,
  Layout,
  Monitor
} from "lucide-react";
import { useInvoiceSettings } from '@/contexts/InvoiceSettingsContext';
import { ThemePreview } from '@/components/ui/theme-preview';

export function InvoiceSettingsManager() {
  const { 
    settings, 
    updateSetting, 
    saveSettings, 
    resetSettings, 
    copySettings, 
    exportSettings, 
    importSettings,
    uploadLogo,
    isLoading 
  } = useInvoiceSettings();
  
  const [activeTab, setActiveTab] = useState('appearance');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await uploadLogo(file);
      } catch (error) {
        console.error('Logo upload failed:', error);
      }
    }
  };

  const handleImportSettings = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await importSettings(file);
      } catch (error) {
        console.error('Settings import failed:', error);
      }
    }
  };

  const renderDesignSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          التصميم والألوان
        </CardTitle>
        <CardDescription>
          تخصيص شامل لمظهر الفاتورة والتصميم
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* قالب التصميم */}
        <div>
          <Label className="text-sm font-medium mb-3 block">قالب التصميم</Label>
          <Select
            value={settings.template}
            onValueChange={(value) => updateSetting('template', value as any)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="اختر قالب التصميم" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="elegant">أنيق وممتاز</SelectItem>
              <SelectItem value="modern">حديث</SelectItem>
              <SelectItem value="classic">كلاسيكي</SelectItem>
              <SelectItem value="minimal">بسيط</SelectItem>
              <SelectItem value="creative">إبداعي</SelectItem>
              <SelectItem value="corporate">مؤسسي</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* عائلة الخط */}
        <div>
          <Label className="text-sm font-medium mb-3 block">عائلة الخط</Label>
          <Select
            value={settings.fontFamily}
            onValueChange={(value) => updateSetting('fontFamily', value as any)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cairo">Cairo - القاهرة</SelectItem>
              <SelectItem value="tajawal">Tajawal - تجوال</SelectItem>
              <SelectItem value="amiri">Amiri - أميري</SelectItem>
              <SelectItem value="noto-arabic">Noto Sans Arabic</SelectItem>
              <SelectItem value="rubik">Rubik - روبيك</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* حجم الخط */}
        <div>
          <Label className="text-sm font-medium mb-3 block">حجم الخط</Label>
          <Select
            value={settings.fontSize}
            onValueChange={(value) => updateSetting('fontSize', value as any)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="extra-small">صغير جداً</SelectItem>
              <SelectItem value="small">صغير</SelectItem>
              <SelectItem value="medium">متوسط</SelectItem>
              <SelectItem value="large">كبير</SelectItem>
              <SelectItem value="extra-large">كبير جداً</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* نمط الحدود */}
        <div>
          <Label className="text-sm font-medium mb-3 block">نمط الحدود</Label>
          <Select
            value={settings.borderStyle}
            onValueChange={(value) => updateSetting('borderStyle', value as any)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">بدون حدود</SelectItem>
              <SelectItem value="simple">بسيط</SelectItem>
              <SelectItem value="elegant">أنيق</SelectItem>
              <SelectItem value="double">مزدوج</SelectItem>
              <SelectItem value="rounded">مستدير</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* الألوان والخلفيات */}
        <div>
          <h4 className="font-semibold mb-4">الألوان والخلفيات</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* اللون الأساسي */}
            <div>
              <Label className="text-sm font-medium mb-2 block">اللون الأساسي</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) => updateSetting('primaryColor', e.target.value)}
                  className="w-12 h-10 rounded border"
                />
                <Input
                  type="text"
                  value={settings.primaryColor}
                  onChange={(e) => updateSetting('primaryColor', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            {/* اللون الثانوي */}
            <div>
              <Label className="text-sm font-medium mb-2 block">اللون الثانوي</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={settings.secondaryColor}
                  onChange={(e) => updateSetting('secondaryColor', e.target.value)}
                  className="w-12 h-10 rounded border"
                />
                <Input
                  type="text"
                  value={settings.secondaryColor}
                  onChange={(e) => updateSetting('secondaryColor', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            {/* لون التمييز */}
            <div>
              <Label className="text-sm font-medium mb-2 block">لون التمييز</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={settings.accentColor}
                  onChange={(e) => updateSetting('accentColor', e.target.value)}
                  className="w-12 h-10 rounded border"
                />
                <Input
                  type="text"
                  value={settings.accentColor}
                  onChange={(e) => updateSetting('accentColor', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* الشعار والعلامة المائية */}
        <div>
          <h4 className="font-semibold mb-4">الشعار والعلامة المائية</h4>
          
          {/* رفع الشعار */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>عرض الشعار</Label>
              <Switch
                checked={settings.showLogo}
                onCheckedChange={(checked) => updateSetting('showLogo', checked)}
              />
            </div>

            {settings.showLogo && (
              <>
                <div>
                  <Label className="text-sm font-medium mb-2 block">رفع شعار الشركة</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      <Upload className="h-4 w-4 ml-2" />
                      {isLoading ? 'جاري الرفع...' : 'اختر ملف الشعار'}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </div>
                  {settings.logoUrl && (
                    <div className="mt-2 p-2 border rounded">
                      <img
                        src={settings.logoUrl}
                        alt="شعار الشركة"
                        className="h-16 w-auto"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">موضع الشعار</Label>
                  <Select
                    value={settings.logoPosition}
                    onValueChange={(value) => updateSetting('logoPosition', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top-left">أعلى اليسار</SelectItem>
                      <SelectItem value="top-center">أعلى الوسط</SelectItem>
                      <SelectItem value="top-right">أعلى اليمين</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    حجم الشعار: {settings.logoSize}px
                  </Label>
                  <Slider
                    value={[settings.logoSize]}
                    onValueChange={(value) => updateSetting('logoSize', value[0])}
                    min={50}
                    max={300}
                    step={10}
                    className="w-full"
                  />
                </div>
              </>
            )}
          </div>

          {/* العلامة المائية */}
          <div className="space-y-4 mt-6">
            <div className="flex items-center justify-between">
              <Label>العلامة المائية</Label>
              <Switch
                checked={settings.showWatermark}
                onCheckedChange={(checked) => updateSetting('showWatermark', checked)}
              />
            </div>

            {settings.showWatermark && (
              <>
                <div>
                  <Label className="text-sm font-medium mb-2 block">نص العلامة المائية</Label>
                  <Input
                    value={settings.watermarkText}
                    onChange={(e) => updateSetting('watermarkText', e.target.value)}
                    placeholder="مسودة"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    شفافية العلامة المائية: {Math.round(settings.watermarkOpacity * 100)}%
                  </Label>
                  <Slider
                    value={[settings.watermarkOpacity]}
                    onValueChange={(value) => updateSetting('watermarkOpacity', value[0])}
                    min={0.05}
                    max={0.5}
                    step={0.05}
                    className="w-full"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderContentSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          عناصر المحتوى المتقدمة
        </CardTitle>
        <CardDescription>
          تحديد العناصر والبيانات المعروضة في الفاتورة
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: 'showTaxDetails', label: 'تفاصيل الضريبة' },
            { key: 'showDiscountDetails', label: 'تفاصيل الخصم' },
            { key: 'showPaymentTerms', label: 'شروط الدفع' },
            { key: 'showBankDetails', label: 'بيانات البنك' },
            { key: 'showItemImages', label: 'صور المنتجات' },
            { key: 'showItemDescription', label: 'وصف المنتجات' },
            { key: 'showItemSerial', label: 'الرقم التسلسلي' },
            { key: 'showCustomerSignature', label: 'توقيع العميل' },
            { key: 'showTimeStamp', label: 'الطابع الزمني' }
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-3 border rounded-lg">
              <Label className="font-medium">{item.label}</Label>
              <Switch
                checked={settings[item.key as keyof typeof settings] as boolean}
                onCheckedChange={(checked) => updateSetting(item.key as keyof typeof settings, checked)}
              />
            </div>
          ))}
        </div>

        <Separator />

        {/* رمز QR والباركود */}
        <div>
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            رمز QR والباركود
          </h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>عرض رمز QR</Label>
              <Switch
                checked={settings.showQRCode}
                onCheckedChange={(checked) => updateSetting('showQRCode', checked)}
              />
            </div>

            {settings.showQRCode && (
              <>
                <div>
                  <Label className="text-sm font-medium mb-2 block">موضع رمز QR</Label>
                  <Select
                    value={settings.qrCodePosition}
                    onValueChange={(value) => updateSetting('qrCodePosition', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bottom-left">أسفل اليسار</SelectItem>
                      <SelectItem value="bottom-right">أسفل اليمين</SelectItem>
                      <SelectItem value="top-right">أعلى اليمين</SelectItem>
                      <SelectItem value="footer">التذييل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    حجم رمز QR: {settings.qrCodeSize}px
                  </Label>
                  <Slider
                    value={[settings.qrCodeSize]}
                    onValueChange={(value) => updateSetting('qrCodeSize', value[0])}
                    min={80}
                    max={200}
                    step={10}
                    className="w-full"
                  />
                </div>
              </>
            )}

            <div className="flex items-center justify-between">
              <Label>عرض الباركود</Label>
              <Switch
                checked={settings.showBarcode}
                onCheckedChange={(checked) => updateSetting('showBarcode', checked)}
              />
            </div>

            {settings.showBarcode && (
              <div>
                <Label className="text-sm font-medium mb-2 block">نوع الباركود</Label>
                <Select
                  value={settings.barcodeType}
                  onValueChange={(value) => updateSetting('barcodeType', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="code128">Code 128</SelectItem>
                    <SelectItem value="code39">Code 39</SelectItem>
                    <SelectItem value="ean13">EAN-13</SelectItem>
                    <SelectItem value="qr">QR Code</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderActionsSection = () => (
    <Card>
      <CardHeader>
        <CardTitle>إجراءات الإعدادات</CardTitle>
        <CardDescription>
          حفظ وإدارة إعدادات الفاتورة
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={saveSettings}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            حفظ الإعدادات
          </Button>

          <Button 
            variant="outline"
            onClick={resetSettings}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            إعادة تعيين
          </Button>

          <Button 
            variant="outline"
            onClick={copySettings}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            نسخ الإعدادات
          </Button>

          <Button 
            variant="outline"
            onClick={exportSettings}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            تصدير الإعدادات
          </Button>

          <Button 
            variant="outline"
            onClick={() => importFileRef.current?.click()}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            استيراد الإعدادات
          </Button>
          
          <input
            ref={importFileRef}
            type="file"
            accept=".json"
            onChange={handleImportSettings}
            className="hidden"
          />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">الإعدادات المتقدمة للفاتورة</h1>
          <p className="text-muted-foreground mt-2">
            تخصيص شامل لمظهر ومحتوى الفاتورة والتحكم في جميع العناصر
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-6">
          {renderDesignSection()}
          {renderContentSection()}
          {renderActionsSection()}
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-primary" />
                معاينة المظهر
              </CardTitle>
              <CardDescription>
                معاينة مباشرة للتغييرات التي تجريها
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ThemePreview
                primaryColor={settings.primaryColor}
                accentColor={settings.accentColor}
                fontFamily={settings.fontFamily}
                borderRadius={settings.borderStyle === 'rounded' ? 'large' : 'medium'}
                fontSize={settings.fontSize}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}