import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { 
  Palette, 
  FileText, 
  Building2, 
  Printer, 
  Download, 
  Globe, 
  Upload, 
  QrCode, 
  Shield, 
  CalendarIcon,
  Mail,
  Smartphone,
  CreditCard,
  Type,
  Layout,
  Monitor,
  Image as ImageIcon,
  Eye,
  Lock,
  Bell,
  Settings
} from "lucide-react";

interface InvoiceSettings {
  // إعدادات المظهر المتقدمة
  template: 'elegant' | 'modern' | 'classic' | 'minimal' | 'creative' | 'corporate';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontSize: 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large';
  fontFamily: 'cairo' | 'tajawal' | 'amiri' | 'noto-arabic' | 'rubik';
  showLogo: boolean;
  logoPosition: 'top-left' | 'top-center' | 'top-right';
  logoSize: number;
  showWatermark: boolean;
  watermarkText: string;
  watermarkOpacity: number;
  borderStyle: 'none' | 'simple' | 'elegant' | 'double' | 'rounded';
  backgroundColor: string;
  textColor: string;
  headerStyle: 'modern' | 'classic' | 'gradient' | 'minimal';
  tableStyle: 'default' | 'striped' | 'bordered' | 'minimal' | 'elegant';
  
  // إعدادات المحتوى المتقدمة
  showTaxDetails: boolean;
  showDiscountDetails: boolean;
  showPaymentTerms: boolean;
  showBankDetails: boolean;
  showQRCode: boolean;
  qrCodeSize: number;
  qrCodePosition: 'bottom-left' | 'bottom-right' | 'top-right' | 'footer';
  showBarcode: boolean;
  barcodeType: 'code128' | 'code39' | 'ean13' | 'qr';
  showItemImages: boolean;
  showItemDescription: boolean;
  showItemSerial: boolean;
  showCustomerSignature: boolean;
  showSupplierSignature: boolean;
  showTimeStamp: boolean;
  showPageWatermark: boolean;
  
  // إعدادات الشركة المتقدمة
  companyName: string;
  companyNameEn: string;
  companyAddress: string;
  companyAddressEn: string;
  companyPhone: string;
  companyFax: string;
  companyEmail: string;
  companyWebsite: string;
  taxNumber: string;
  commercialRegister: string;
  industryLicense: string;
  companyLogo: string;
  companyStamp: string;
  
  // إعدادات الطباعة المتقدمة
  paperSize: 'A4' | 'A5' | 'Letter' | 'Legal' | 'Custom';
  customWidth: number;
  customHeight: number;
  orientation: 'portrait' | 'landscape';
  margins: 'narrow' | 'normal' | 'wide' | 'custom';
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  showPageNumbers: boolean;
  pageNumberPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'bottom-center';
  showPrintDate: boolean;
  printQuality: 'draft' | 'normal' | 'high' | 'best';
  colorMode: 'color' | 'grayscale' | 'black-white';
  
  // إعدادات التصدير المتقدمة
  pdfQuality: 'low' | 'standard' | 'high' | 'best' | 'print';
  pdfCompression: boolean;
  includeAttachments: boolean;
  passwordProtect: boolean;
  documentPassword: string;
  allowPrint: boolean;
  allowCopy: boolean;
  allowEdit: boolean;
  allowAnnotations: boolean;
  pdfTitle: string;
  pdfAuthor: string;
  pdfSubject: string;
  pdfKeywords: string;
  pdfVersion: '1.4' | '1.5' | '1.6' | '1.7' | '2.0';
  
  // إعدادات التكامل
  emailSettings: {
    enabled: boolean;
    smtpServer: string;
    port: number;
    username: string;
    password: string;
    encryption: 'none' | 'ssl' | 'tls';
    fromEmail: string;
    fromName: string;
    subject: string;
    body: string;
  };
  
  whatsappSettings: {
    enabled: boolean;
    apiKey: string;
    phoneNumber: string;
    message: string;
  };
  
  smsSettings: {
    enabled: boolean;
    provider: 'twilio' | 'nexmo' | 'local';
    apiKey: string;
    message: string;
  };
  
  // إعدادات اللغة والتوطين
  language: 'ar' | 'en' | 'both';
  dateFormat: 'dd/MM/yyyy' | 'MM/dd/yyyy' | 'yyyy-MM-dd' | 'dd-MM-yyyy';
  timeFormat: '12h' | '24h';
  numberFormat: 'arabic' | 'english' | 'mixed';
  currencySymbol: string;
  currencyPosition: 'before' | 'after';
  decimalPlaces: number;
  thousandSeparator: ',' | '.' | ' ' | '';
  decimalSeparator: '.' | ',';
  
  // إعدادات إضافية
  footerText: string;
  paymentTerms: string;
  bankDetails: string;
  additionalNotes: string;
  disclaimerText: string;
  returnPolicy: string;
  warrantyInfo: string;
  supportContact: string;
}

interface AdvancedSettingsContentProps {
  settings: InvoiceSettings;
  onSettingChange: (key: keyof InvoiceSettings, value: any) => void;
  activeTab: string;
}

export function InvoiceAdvancedSettingsContent({ 
  settings, 
  onSettingChange, 
  activeTab 
}: AdvancedSettingsContentProps) {

  const renderAppearanceTab = () => (
    <div className="space-y-6">
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
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>قالب التصميم</Label>
              <Select 
                value={settings.template} 
                onValueChange={(value) => onSettingChange('template', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="elegant">🎨 أنيق ومميز</SelectItem>
                  <SelectItem value="modern">🚀 عصري ونظيف</SelectItem>
                  <SelectItem value="classic">📜 كلاسيكي وتقليدي</SelectItem>
                  <SelectItem value="minimal">✨ بسيط ومختصر</SelectItem>
                  <SelectItem value="creative">🎭 إبداعي وملفت</SelectItem>
                  <SelectItem value="corporate">🏢 شركات ورسمي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>عائلة الخط</Label>
              <Select 
                value={settings.fontFamily} 
                onValueChange={(value) => onSettingChange('fontFamily', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cairo">Cairo - القاهرة</SelectItem>
                  <SelectItem value="tajawal">Tajawal - تجوال</SelectItem>
                  <SelectItem value="amiri">Amiri - أميري</SelectItem>
                  <SelectItem value="noto-arabic">Noto Arabic</SelectItem>
                  <SelectItem value="roboto">Roboto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>حجم الخط</Label>
              <Select 
                value={settings.fontSize} 
                onValueChange={(value) => onSettingChange('fontSize', value)}
              >
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label>نمط الحدود</Label>
              <Select 
                value={settings.borderStyle} 
                onValueChange={(value) => onSettingChange('borderStyle', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون حدود</SelectItem>
                  <SelectItem value="simple">بسيط</SelectItem>
                  <SelectItem value="elegant">أنيق</SelectItem>
                  <SelectItem value="double">مزدوج</SelectItem>
                  <SelectItem value="rounded">دائري</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Type className="h-5 w-5" />
              الألوان والخلفيات
            </h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>اللون الأساسي</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => onSettingChange('primaryColor', e.target.value)}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={settings.primaryColor}
                    onChange={(e) => onSettingChange('primaryColor', e.target.value)}
                    placeholder="#000000"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>اللون الثانوي</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={settings.secondaryColor}
                    onChange={(e) => onSettingChange('secondaryColor', e.target.value)}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={settings.secondaryColor}
                    onChange={(e) => onSettingChange('secondaryColor', e.target.value)}
                    placeholder="#666666"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>لون التمييز</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={settings.accentColor}
                    onChange={(e) => onSettingChange('accentColor', e.target.value)}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={settings.accentColor}
                    onChange={(e) => onSettingChange('accentColor', e.target.value)}
                    placeholder="#0066cc"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              الشعار والعلامة المائية
            </h3>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>عرض الشعار</Label>
                  <Switch
                    checked={settings.showLogo}
                    onCheckedChange={(checked) => onSettingChange('showLogo', checked)}
                  />
                </div>

                {settings.showLogo && (
                  <>
                    <div className="space-y-2">
                      <Label>موضع الشعار</Label>
                      <Select 
                        value={settings.logoPosition} 
                        onValueChange={(value) => onSettingChange('logoPosition', value)}
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

                    <div className="space-y-2">
                      <Label>حجم الشعار: {settings.logoSize}%</Label>
                      <Slider
                        value={[settings.logoSize]}
                        onValueChange={(value) => onSettingChange('logoSize', value[0])}
                        max={200}
                        min={50}
                        step={10}
                        className="w-full"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>العلامة المائية</Label>
                  <Switch
                    checked={settings.showWatermark}
                    onCheckedChange={(checked) => onSettingChange('showWatermark', checked)}
                  />
                </div>

                {settings.showWatermark && (
                  <>
                    <div className="space-y-2">
                      <Label>نص العلامة المائية</Label>
                      <Input
                        value={settings.watermarkText}
                        onChange={(e) => onSettingChange('watermarkText', e.target.value)}
                        placeholder="نص العلامة المائية"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>شفافية العلامة المائية: {settings.watermarkOpacity}%</Label>
                      <Slider
                        value={[settings.watermarkOpacity]}
                        onValueChange={(value) => onSettingChange('watermarkOpacity', value[0])}
                        max={100}
                        min={10}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderContentTab = () => (
    <div className="space-y-6">
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
          <div className="grid grid-cols-3 gap-4">
            {[
              { key: 'showTaxDetails', label: 'تفاصيل الضريبة', icon: CreditCard },
              { key: 'showDiscountDetails', label: 'تفاصيل الخصم', icon: Badge },
              { key: 'showPaymentTerms', label: 'شروط الدفع', icon: FileText },
              { key: 'showBankDetails', label: 'بيانات البنك', icon: Building2 },
              { key: 'showItemImages', label: 'صور المنتجات', icon: ImageIcon },
              { key: 'showItemDescription', label: 'وصف المنتجات', icon: FileText },
              { key: 'showItemSerial', label: 'الرقم التسلسلي', icon: QrCode },
              { key: 'showCustomerSignature', label: 'توقيع العميل', icon: FileText },
              { key: 'showTimeStamp', label: 'الطابع الزمني', icon: CalendarIcon }
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm">{item.label}</Label>
                </div>
                <Switch
                  checked={settings[item.key as keyof InvoiceSettings] as boolean}
                  onCheckedChange={(checked) => onSettingChange(item.key as keyof InvoiceSettings, checked)}
                />
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              رمز QR والباركود
            </h3>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>عرض رمز QR</Label>
                  <Switch
                    checked={settings.showQRCode}
                    onCheckedChange={(checked) => onSettingChange('showQRCode', checked)}
                  />
                </div>

                {settings.showQRCode && (
                  <>
                    <div className="space-y-2">
                      <Label>موضع رمز QR</Label>
                      <Select 
                        value={settings.qrCodePosition} 
                        onValueChange={(value) => onSettingChange('qrCodePosition', value)}
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

                    <div className="space-y-2">
                      <Label>حجم رمز QR: {settings.qrCodeSize}px</Label>
                      <Slider
                        value={[settings.qrCodeSize]}
                        onValueChange={(value) => onSettingChange('qrCodeSize', value[0])}
                        max={200}
                        min={80}
                        step={10}
                        className="w-full"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>عرض الباركود</Label>
                  <Switch
                    checked={settings.showBarcode}
                    onCheckedChange={(checked) => onSettingChange('showBarcode', checked)}
                  />
                </div>

                {settings.showBarcode && (
                  <div className="space-y-2">
                    <Label>نوع الباركود</Label>
                    <Select 
                      value={settings.barcodeType} 
                      onValueChange={(value) => onSettingChange('barcodeType', value)}
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
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderIntegrationTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            إعدادات البريد الإلكتروني
          </CardTitle>
          <CardDescription>
            تكوين إرسال الفواتير عبر البريد الإلكتروني تلقائياً
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label>تفعيل البريد الإلكتروني</Label>
            <Switch
              checked={settings.emailSettings.enabled}
              onCheckedChange={(checked) => 
                onSettingChange('emailSettings', { ...settings.emailSettings, enabled: checked })
              }
            />
          </div>

          {settings.emailSettings.enabled && (
            <div className="grid grid-cols-2 gap-4 space-y-4">
              <div className="space-y-2">
                <Label>خادم SMTP</Label>
                <Input
                  value={settings.emailSettings.smtpServer}
                  onChange={(e) => 
                    onSettingChange('emailSettings', { 
                      ...settings.emailSettings, 
                      smtpServer: e.target.value 
                    })
                  }
                  placeholder="smtp.gmail.com"
                />
              </div>

              <div className="space-y-2">
                <Label>المنفذ</Label>
                <Input
                  type="number"
                  value={settings.emailSettings.port}
                  onChange={(e) => 
                    onSettingChange('emailSettings', { 
                      ...settings.emailSettings, 
                      port: parseInt(e.target.value) 
                    })
                  }
                  placeholder="587"
                />
              </div>

              <div className="space-y-2">
                <Label>اسم المستخدم</Label>
                <Input
                  value={settings.emailSettings.username}
                  onChange={(e) => 
                    onSettingChange('emailSettings', { 
                      ...settings.emailSettings, 
                      username: e.target.value 
                    })
                  }
                  placeholder="your-email@domain.com"
                />
              </div>

              <div className="space-y-2">
                <Label>كلمة المرور</Label>
                <Input
                  type="password"
                  value={settings.emailSettings.password}
                  onChange={(e) => 
                    onSettingChange('emailSettings', { 
                      ...settings.emailSettings, 
                      password: e.target.value 
                    })
                  }
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label>موضوع الرسالة</Label>
                <Input
                  value={settings.emailSettings.subject}
                  onChange={(e) => 
                    onSettingChange('emailSettings', { 
                      ...settings.emailSettings, 
                      subject: e.target.value 
                    })
                  }
                  placeholder="فاتورة جديدة - رقم {invoice_number}"
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label>نص الرسالة</Label>
                <Textarea
                  value={settings.emailSettings.body}
                  onChange={(e) => 
                    onSettingChange('emailSettings', { 
                      ...settings.emailSettings, 
                      body: e.target.value 
                    })
                  }
                  placeholder="عزيزي العميل، نرسل لك فاتورة رقم {invoice_number}..."
                  rows={4}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            إعدادات WhatsApp
          </CardTitle>
          <CardDescription>
            إرسال الفواتير عبر WhatsApp Business API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label>تفعيل WhatsApp</Label>
            <Switch
              checked={settings.whatsappSettings.enabled}
              onCheckedChange={(checked) => 
                onSettingChange('whatsappSettings', { ...settings.whatsappSettings, enabled: checked })
              }
            />
          </div>

          {settings.whatsappSettings.enabled && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>مفتاح API</Label>
                <Input
                  value={settings.whatsappSettings.apiKey}
                  onChange={(e) => 
                    onSettingChange('whatsappSettings', { 
                      ...settings.whatsappSettings, 
                      apiKey: e.target.value 
                    })
                  }
                  placeholder="Your WhatsApp Business API Key"
                />
              </div>

              <div className="space-y-2">
                <Label>رقم الهاتف</Label>
                <Input
                  value={settings.whatsappSettings.phoneNumber}
                  onChange={(e) => 
                    onSettingChange('whatsappSettings', { 
                      ...settings.whatsappSettings, 
                      phoneNumber: e.target.value 
                    })
                  }
                  placeholder="+966501234567"
                />
              </div>

              <div className="space-y-2">
                <Label>رسالة WhatsApp</Label>
                <Textarea
                  value={settings.whatsappSettings.message}
                  onChange={(e) => 
                    onSettingChange('whatsappSettings', { 
                      ...settings.whatsappSettings, 
                      message: e.target.value 
                    })
                  }
                  placeholder="مرحباً، نرسل لك فاتورة رقم {invoice_number}..."
                  rows={3}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
   );

  const renderCompanyTab = () => (
    <div className="space-y-6">
      {/* معلومات الشركة الأساسية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            معلومات الشركة الأساسية
          </CardTitle>
          <CardDescription>
            البيانات الأساسية للشركة التي ستظهر على الفاتورة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="companyName">اسم الشركة (عربي) <span className="text-red-500">*</span></Label>
              <Input
                id="companyName"
                value={settings.companyName}
                onChange={(e) => onSettingChange('companyName', e.target.value)}
                placeholder="شركة الأعمال المتميزة"
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyNameEn">اسم الشركة (إنجليزي)</Label>
              <Input
                id="companyNameEn"
                value={settings.companyNameEn}
                onChange={(e) => onSettingChange('companyNameEn', e.target.value)}
                placeholder="Excellence Business Company"
                className="text-left"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="companyAddress">عنوان الشركة (عربي)</Label>
              <Textarea
                id="companyAddress"
                value={settings.companyAddress}
                onChange={(e) => onSettingChange('companyAddress', e.target.value)}
                placeholder="شارع الملك فهد، الرياض، المملكة العربية السعودية"
                rows={3}
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyAddressEn">عنوان الشركة (إنجليزي)</Label>
              <Textarea
                id="companyAddressEn"
                value={settings.companyAddressEn}
                onChange={(e) => onSettingChange('companyAddressEn', e.target.value)}
                placeholder="King Fahd Road, Riyadh, Saudi Arabia"
                rows={3}
                className="text-left"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* معلومات الاتصال */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            معلومات الاتصال
          </CardTitle>
          <CardDescription>
            طرق التواصل مع الشركة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="companyPhone">رقم الهاتف الأساسي</Label>
              <Input
                id="companyPhone"
                value={settings.companyPhone}
                onChange={(e) => onSettingChange('companyPhone', e.target.value)}
                placeholder="+966 11 123 4567"
                type="tel"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyFax">رقم الفاكس</Label>
              <Input
                id="companyFax"
                value={settings.companyFax}
                onChange={(e) => onSettingChange('companyFax', e.target.value)}
                placeholder="+966 11 123 4568"
                type="tel"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="companyEmail">البريد الإلكتروني</Label>
              <Input
                id="companyEmail"
                value={settings.companyEmail}
                onChange={(e) => onSettingChange('companyEmail', e.target.value)}
                placeholder="info@company.com"
                type="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyWebsite">الموقع الإلكتروني</Label>
              <Input
                id="companyWebsite"
                value={settings.companyWebsite}
                onChange={(e) => onSettingChange('companyWebsite', e.target.value)}
                placeholder="www.company.com"
                type="url"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* التراخيص والأرقام القانونية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            التراخيص والأرقام القانونية
          </CardTitle>
          <CardDescription>
            المعلومات القانونية والتراخيص المطلوبة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="taxNumber">الرقم الضريبي</Label>
              <Input
                id="taxNumber"
                value={settings.taxNumber}
                onChange={(e) => onSettingChange('taxNumber', e.target.value)}
                placeholder="310123456789003"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="commercialRegister">السجل التجاري</Label>
              <Input
                id="commercialRegister"
                value={settings.commercialRegister}
                onChange={(e) => onSettingChange('commercialRegister', e.target.value)}
                placeholder="1010123456"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="industryLicense">رخصة النشاط التجاري</Label>
            <Input
              id="industryLicense"
              value={settings.industryLicense}
              onChange={(e) => onSettingChange('industryLicense', e.target.value)}
              placeholder="رخصة رقم 12345678"
            />
          </div>
        </CardContent>
      </Card>

      {/* الشعار والختم */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            الشعار والختم الرسمي
          </CardTitle>
          <CardDescription>
            رفع شعار الشركة والختم الرسمي
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <Label>شعار الشركة</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                {settings.companyLogo ? (
                  <div className="space-y-4">
                    <img 
                      src={settings.companyLogo} 
                      alt="شعار الشركة" 
                      className="mx-auto max-h-20 object-contain"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSettingChange('companyLogo', '')}
                      className="text-red-600"
                    >
                      إزالة الشعار
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">اسحب الصورة هنا أو انقر للتحديد</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG بحد أقصى 2MB</p>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="logo-upload"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            onSettingChange('companyLogo', e.target?.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('logo-upload')?.click()}
                    >
                      اختيار ملف
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <Label>الختم الرسمي</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                {settings.companyStamp ? (
                  <div className="space-y-4">
                    <img 
                      src={settings.companyStamp} 
                      alt="الختم الرسمي" 
                      className="mx-auto max-h-20 object-contain"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSettingChange('companyStamp', '')}
                      className="text-red-600"
                    >
                      إزالة الختم
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">اسحب الصورة هنا أو انقر للتحديد</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG بحد أقصى 2MB</p>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="stamp-upload"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            onSettingChange('companyStamp', e.target?.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('stamp-upload')?.click()}
                    >
                      اختيار ملف
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Eye className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">نصائح لرفع الشعار والختم:</h4>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• استخدم خلفية شفافة (PNG) للحصول على أفضل النتائج</li>
                  <li>• تأكد من وضوح الشعار والختم بدقة عالية</li>
                  <li>• يُفضل أن يكون الشعار بنسبة عرض إلى ارتفاع مناسبة</li>
                  <li>• حجم الملف يجب ألا يتجاوز 2 ميجابايت</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* معاينة البيانات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-primary" />
            معاينة البيانات على الفاتورة
          </CardTitle>
          <CardDescription>
            كيف ستظهر بيانات الشركة على الفاتورة المطبوعة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-6 bg-white space-y-3">
            {settings.companyLogo && (
              <div className="text-center mb-4">
                <img src={settings.companyLogo} alt="شعار الشركة" className="h-16 mx-auto" />
              </div>
            )}
            <div className="text-center">
              <h3 className="font-bold text-lg text-primary">{settings.companyName || "اسم الشركة"}</h3>
              {settings.companyNameEn && (
                <p className="text-sm text-muted-foreground">{settings.companyNameEn}</p>
              )}
            </div>
            <div className="text-center text-sm space-y-1">
              {settings.companyAddress && (
                <p className="text-muted-foreground">{settings.companyAddress}</p>
              )}
              <div className="flex justify-center gap-4 flex-wrap">
                {settings.companyPhone && (
                  <span>هاتف: {settings.companyPhone}</span>
                )}
                {settings.companyEmail && (
                  <span>البريد: {settings.companyEmail}</span>
                )}
              </div>
              <div className="flex justify-center gap-4 flex-wrap">
                {settings.taxNumber && (
                  <span>الرقم الضريبي: {settings.taxNumber}</span>
                )}
                {settings.commercialRegister && (
                  <span>س.ت: {settings.commercialRegister}</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Return the appropriate tab content based on activeTab
  switch (activeTab) {
    case 'appearance':
      return renderAppearanceTab();
    case 'content':
      return renderContentTab();
    case 'company':
      return renderCompanyTab();
    case 'integration':
      return renderIntegrationTab();
    default:
      return renderAppearanceTab();
  }
}