import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { 
  Key, 
  Copy, 
  Download, 
  Mail, 
  Package,
  Calendar,
  Users,
  CheckCircle,
  Plus,
  FileText
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { storage } from '@/utils/enhancedStorage';
import { GeneratedLicense, convertToGeneratedLicense } from '@/types/enhanced';
import { logger } from '@/utils/logger';

export function LicenseKeyGenerator() {
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [licenseType, setLicenseType] = useState('');
  
  const [validityMonths, setValidityMonths] = useState('12');
  const [generatedLicenses, setGeneratedLicenses] = useState<GeneratedLicense[]>([]);
  const [currentLicense, setCurrentLicense] = useState<GeneratedLicense | null>(null);
  const [emailTemplate, setEmailTemplate] = useState(`السلام عليكم ورحمة الله وبركاته

نشكركم لاختياركم نظام عمران لإدارة الأعمال.

تفاصيل الترخيص:
- نوع الترخيص: {LICENSE_TYPE}
- النوع: {LICENSE_TYPE}
- صالح حتى: {EXPIRY_DATE}

مفتاح الترخيص:
{LICENSE_KEY}

خطوات التفعيل:
1. افتح النظام
2. اذهب إلى الإعدادات > تفعيل الترخيص
3. أدخل المفتاح أعلاه
4. أدخل بيانات شركتكم

للدعم الفني: xoxobnj@gmail.com

مع أطيب التحيات
فريق عمران`);

  // تحميل التراخيص المحفوظة عند بدء تشغيل المكون
  useEffect(() => {
    const savedLicenses = storage.getItem<GeneratedLicense[]>('generated_licenses', []);
    const validLicenses = Array.isArray(savedLicenses) 
      ? savedLicenses.map(convertToGeneratedLicense).filter(Boolean) as GeneratedLicense[]
      : [];
    setGeneratedLicenses(validLicenses);
    
    if (validLicenses.length !== (savedLicenses?.length || 0)) {
      logger.warn('Some invalid licenses were filtered out', undefined, 'LicenseKeyGenerator');
      storage.setItem('generated_licenses', validLicenses);
    }
  }, []);

  // تحديث قالب الإيميل عند تغيير آخر ترخيص مُنشأ
  useEffect(() => {
    if (currentLicense) {
      const updatedTemplate = emailTemplate
        .replace(/\{LICENSE_TYPE\}/g, getLicenseTypeLabel(currentLicense.features[0] || ''))
        .replace(/\{LICENSE_TYPE\}/g, getLicenseTypeLabel(currentLicense.features[0] || ''))
        .replace(/\{EXPIRY_DATE\}/g, new Date(currentLicense.validUntil).toLocaleDateString('en-GB'))
        .replace(/\{LICENSE_KEY\}/g, currentLicense.licenseKey);
      
      if (updatedTemplate !== emailTemplate) {
        setEmailTemplate(updatedTemplate);
      }
    }
  }, [currentLicense]);

  const generateLicenseKey = () => {
    if (!clientName || !clientEmail || !licenseType) {
      toast({
        title: "بيانات مفقودة",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    const timestamp = Date.now();
    
    const prefixMap = {
      'trial': 'TRIAL',
      'basic': 'BASIC', 
      'professional': 'PRO',
      'enterprise': 'ENTERPRISE',
      'investors': 'INVESTORS'
    };
    
    const prefix = prefixMap[licenseType as keyof typeof prefixMap] || licenseType.toUpperCase();
    const hash = btoa(clientEmail + timestamp).slice(0, 8).toUpperCase();
    const key = `OMRAN-${prefix}-${new Date().getFullYear()}-${hash}`;

    const expiryDate = new Date();
    const months = parseFloat(validityMonths);
    if (months < 1) {
      const days = Math.round(months * 30);
      expiryDate.setDate(expiryDate.getDate() + days);
    } else {
      expiryDate.setMonth(expiryDate.getMonth() + Math.round(months));
    }

    const newLicense: GeneratedLicense = {
      id: Date.now().toString(),
      licenseKey: key,
      customerName: clientName,
      customerEmail: clientEmail,
      features: [licenseType],
      validUntil: expiryDate.toISOString(),
      createdAt: new Date().toISOString(),
      status: 'active',
      maxUsers: 1,
      maxDevices: 1
    };

    setGeneratedLicenses([...generatedLicenses, newLicense]);
    setCurrentLicense(newLicense);
    
    // حفظ باستخدام النظام المحسن
    const existingLicenses = storage.getItem<GeneratedLicense[]>('generated_licenses', []) || [];
    const validLicenses = Array.isArray(existingLicenses) 
      ? existingLicenses.map(convertToGeneratedLicense).filter(Boolean) as GeneratedLicense[]
      : [];
    
    const updatedLicenses = [...validLicenses, newLicense];
    storage.setItem('generated_licenses', updatedLicenses);

    toast({
      title: "تم إنشاء الترخيص!",
      description: `تم إنشاء مفتاح الترخيص: ${key}`,
    });

    // إعادة تعيين النموذج
    setClientName('');
    setClientEmail('');
    setLicenseType('');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "تم النسخ",
      description: "تم نسخ المفتاح إلى الحافظة",
    });
  };

  const generateEmailContent = (license: GeneratedLicense) => {
    const baseTemplate = `السلام عليكم ورحمة الله وبركاته

نشكركم لاختياركم نظام عمران لإدارة الأعمال.

تفاصيل الترخيص:
- نوع الترخيص: {LICENSE_TYPE}
- النوع: {LICENSE_TYPE}
- صالح حتى: {EXPIRY_DATE}

مفتاح الترخيص:
{LICENSE_KEY}

خطوات التفعيل:
1. افتح النظام
2. اذهب إلى الإعدادات > تفعيل الترخيص
3. أدخل المفتاح أعلاه
4. أدخل بيانات شركتكم

للدعم الفني: xoxobnj@gmail.com

مع أطيب التحيات
فريق عمران`;

    return baseTemplate
      .replace('{LICENSE_TYPE}', getLicenseTypeLabel(license.features[0] || ''))
      .replace('{LICENSE_TYPE}', getLicenseTypeLabel(license.features[0] || ''))
      .replace('{EXPIRY_DATE}', new Date(license.validUntil).toLocaleDateString('en-GB'))
      .replace('{LICENSE_KEY}', license.licenseKey);
  };

  const sendEmail = (license: GeneratedLicense) => {
    try {
      const subject = encodeURIComponent(`ترخيص نظام عمران - ${license.customerName}`);
      const body = encodeURIComponent(generateEmailContent(license));
      const mailtoLink = `mailto:${license.customerEmail}?subject=${subject}&body=${body}`;
      
      const link = document.createElement('a');
      link.href = mailtoLink;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "تم فتح البريد الإلكتروني",
        description: "تم فتح تطبيق البريد الإلكتروني لإرسال الترخيص",
      });
    } catch (error) {
      toast({
        title: "خطأ في الإرسال",
        description: "فشل في فتح تطبيق البريد الإلكتروني",
        variant: "destructive"
      });
    }
  };

  const downloadLicenseFile = (license: GeneratedLicense) => {
    const content = {
      client: {
        name: license.customerName,
        email: license.customerEmail
      },
      license: {
        key: license.licenseKey,
        type: license.features[0],
        maxUsers: license.maxUsers,
        expiryDate: license.validUntil,
        generatedAt: license.createdAt
      },
      instructions: {
        ar: "تعليمات التفعيل: افتح النظام -> الإعدادات -> تفعيل الترخيص -> أدخل المفتاح",
        en: "Activation Instructions: Open System -> Settings -> License Activation -> Enter Key"
      }
    };

    const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `license-${license.customerName.replace(/\s+/g, '-')}-${license.licenseKey}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "تم التحميل",
      description: "تم تحميل ملف الترخيص بنجاح",
    });
  };

  const exportToPDF = (license: GeneratedLicense) => {
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({
          title: "خطأ في فتح النافذة",
          description: "يرجى السماح بفتح النوافذ المنبثقة لتصدير التقرير",
          variant: "destructive"
        });
        return;
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <title>ترخيص نظام عمران - ${license.customerName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
            body { 
              font-family: 'Cairo', Arial, sans-serif; 
              direction: rtl; 
              margin: 20px;
              color: #333;
              line-height: 1.6;
            }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; }
            .title { font-size: 28px; font-weight: bold; margin-bottom: 10px; color: #1f2937; }
            .license-key { 
              background: #1f2937; 
              color: white; 
              padding: 20px; 
              border-radius: 8px; 
              font-family: 'Courier New', monospace; 
              font-size: 16px; 
              text-align: center; 
              letter-spacing: 2px;
              word-break: break-all;
              margin: 20px 0;
            }
            .section { margin: 30px 0; background: #f8fafc; padding: 25px; border-radius: 8px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
            .info-item { display: flex; justify-content: space-between; padding: 12px 15px; background: white; border-radius: 6px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">ترخيص نظام عمران</h1>
          </div>
          
          <div class="section">
            <h2>معلومات العميل</h2>
            <div class="info-grid">
              <div class="info-item">
                <span>اسم العميل:</span>
                <span>${license.customerName}</span>
              </div>
              <div class="info-item">
                <span>البريد الإلكتروني:</span>
                <span>${license.customerEmail}</span>
              </div>
            </div>
          </div>
          
          <div class="section">
            <h2>تفاصيل الترخيص</h2>
            <div class="info-grid">
              <div class="info-item">
                <span>نوع الترخيص:</span>
                <span>${getLicenseTypeLabel(license.features[0] || '')}</span>
              </div>
              <div class="info-item">
                <span>نوع الترخيص:</span>
                <span>${getLicenseTypeLabel(license.features[0] || '')}</span>
              </div>
              <div class="info-item">
                <span>تاريخ الإنشاء:</span>
                <span>${new Date(license.createdAt).toLocaleDateString('en-GB')}</span>
              </div>
              <div class="info-item">
                <span>تاريخ الانتهاء:</span>
                <span>${new Date(license.validUntil).toLocaleDateString('en-GB')}</span>
              </div>
            </div>
          </div>
          
          <div class="section">
            <h2>مفتاح الترخيص</h2>
            <div class="license-key">${license.licenseKey}</div>
          </div>
          
          <script>
            window.onload = function() {
              setTimeout(() => {
                window.print();
                setTimeout(() => window.close(), 1000);
              }, 500);
            }
          </script>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      toast({
        title: "تم إنشاء PDF",
        description: "تم فتح نافذة الطباعة لحفظ الترخيص كملف PDF",
      });
    } catch (error) {
      logger.error('Error generating PDF:', error, 'LicenseKeyGenerator');
      toast({
        title: "خطأ في التصدير",
        description: "فشل في تصدير الترخيص كملف PDF",
        variant: "destructive"
      });
    }
  };

  const getLicenseTypeLabel = (type: string) => {
    const labels = {
      'trial': 'تجريبي',
      'basic': 'أساسي',
      'professional': 'احترافي', 
      'enterprise': 'المؤسسات',
      'investors': 'المستثمرين'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getLicenseTypeBadge = (type: string) => {
    const variants = {
      'trial': 'secondary' as const,
      'basic': 'default' as const,
      'professional': 'default' as const,
      'enterprise': 'default' as const,
      'investors': 'default' as const
    };
    return <Badge variant={variants[type as keyof typeof variants] || 'default'}>
      {getLicenseTypeLabel(type)}
    </Badge>;
  };

  return (
    <div className="space-y-6">
      {/* مولد مفاتيح الترخيص */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            مولد مفاتيح التراخيص
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client-name">اسم العميل / الشركة</Label>
              <Input
                id="client-name"
                placeholder="أدخل اسم العميل"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-email">البريد الإلكتروني</Label>
              <Input
                id="client-email"
                type="email"
                placeholder="أدخل البريد الإلكتروني"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="license-type">نوع الترخيص</Label>
              <Select value={licenseType} onValueChange={setLicenseType}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الترخيص" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">تجريبي - مستخدم واحد</SelectItem>
                  <SelectItem value="basic">أساسي - 3 مستخدمين</SelectItem>
                  <SelectItem value="professional">احترافي - 10 مستخدمين</SelectItem>
                  <SelectItem value="enterprise">المؤسسات - 50 مستخدم</SelectItem>
                  <SelectItem value="investors">المستثمرين - 1000 مستخدم</SelectItem>
                </SelectContent>
              </Select>
            </div>


            <div className="space-y-2">
              <Label htmlFor="validity">فترة الصلاحية (بالأشهر)</Label>
              <Select value={validityMonths} onValueChange={setValidityMonths}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.17">تجريبي (5 أيام)</SelectItem>
                  <SelectItem value="3">3 أشهر</SelectItem>
                  <SelectItem value="6">6 أشهر</SelectItem>
                  <SelectItem value="12">سنة واحدة</SelectItem>
                  <SelectItem value="24">سنتان</SelectItem>
                  <SelectItem value="36">3 سنوات</SelectItem>
                  <SelectItem value="60">5 سنوات</SelectItem>
                  <SelectItem value="900">75 سنة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={generateLicenseKey} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            إنشاء مفتاح ترخيص
          </Button>
        </CardContent>
      </Card>

      {/* قالب الإيميل */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            قالب رسالة الإرسال
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="email-template">محتوى الرسالة</Label>
            <Textarea
              id="email-template"
              rows={12}
              value={emailTemplate}
              onChange={(e) => setEmailTemplate(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
          <Alert className="mt-4">
            <AlertDescription className="text-sm">
              <strong>المتغيرات المتاحة:</strong><br />
              • <code>{'{LICENSE_TYPE}'}</code> - نوع الترخيص<br />
              • <code>{'{LICENSE_TYPE}'}</code> - نوع الترخيص<br />
              • <code>{'{EXPIRY_DATE}'}</code> - تاريخ الانتهاء<br />
              • <code>{'{LICENSE_KEY}'}</code> - مفتاح الترخيص
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* التراخيص المُنشأة */}
      {generatedLicenses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              التراخيص المُنشأة ({generatedLicenses.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {generatedLicenses.map((license, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium">{license.customerName}</h4>
                      {getLicenseTypeBadge(license.features[0] || '')}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {new Date(license.validUntil).toLocaleDateString('en-GB')}
                    </div>
                  </div>

                  <div className="bg-muted p-3 rounded font-mono text-sm break-all">
                    {license.licenseKey}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {license.maxUsers} مستخدم
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(license.licenseKey)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadLicenseFile(license)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => exportToPDF(license)}
                      >
                        <FileText className="h-4 w-4" />
                        PDF
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={() => sendEmail(license)}
                      >
                        <Mail className="h-4 w-4" />
                        إرسال
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}