import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Upload, Building2, Phone, Mail, MapPin, DollarSign, Receipt, Globe, Save, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { storage } from "@/utils/storage";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useCompanyLogoSupabase } from "@/hooks/useCompanyLogoSupabase";

interface CompanyInfo {
  name: string;
  logo: string;
  description: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  mobile: string;
  email: string;
  website: string;
  taxNumber: string;
  licenseNumber: string;
  currency: string;
  taxRate: number;
  taxType: 'vat' | 'sales' | 'none';
  language: string;
  timezone: string;
  dateFormat: string;
  numberFormat: string;
}

const currencies = [
  { code: 'SAR', name: 'ريال سعودي', symbol: 'ر.س' },
  { code: 'AED', name: 'درهم إماراتي', symbol: 'د.إ' },
  { code: 'EGP', name: 'جنيه مصري', symbol: 'ج.م' },
  { code: 'USD', name: 'دولار أمريكي', symbol: '$' },
  { code: 'EUR', name: 'يورو', symbol: '€' },
  { code: 'KWD', name: 'دينار كويتي', symbol: 'د.ك' },
  { code: 'QAR', name: 'ريال قطري', symbol: 'ر.ق' },
  { code: 'OMR', name: 'ريال عماني', symbol: 'ر.ع' },
  { code: 'BHD', name: 'دينار بحريني', symbol: 'د.ب' },
  { code: 'JOD', name: 'دينار أردني', symbol: 'د.أ' },
  { code: 'LBP', name: 'ليرة لبنانية', symbol: 'ل.ل' },
  { code: 'IQD', name: 'دينار عراقي', symbol: 'د.ع' }
];

const countries = [
  'السعودية', 'الإمارات', 'مصر', 'الكويت', 'قطر', 'عمان', 
  'البحرين', 'الأردن', 'لبنان', 'العراق', 'المغرب', 'تونس',
  'الجزائر', 'سوريا', 'فلسطين', 'ليبيا', 'السودان', 'اليمن'
];

export function CompanySettingsManager() {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: "شركة عمران",
    logo: "",
    description: "",
    address: "",
    city: "",
    country: "السعودية",
    phone: "",
    mobile: "",
    email: "",
    website: "",
    taxNumber: "",
    licenseNumber: "",
    currency: "SAR",
    taxRate: 15,
    taxType: "vat",
    language: "ar",
    timezone: "Asia/Riyadh",
    dateFormat: "dd/MM/yyyy",
    numberFormat: "ar-SA"
  });

  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { loading, getCategorySettings, setCategorySettings } = useAppSettings();
  const { currentLogo, uploadCompanyLogo, setLogoFromUrl } = useCompanyLogoSupabase();

  useEffect(() => {
    loadCompanySettings();
    // تحديث معلومات الشركة عند تغيير الشعار الحالي
    if (currentLogo && !companyInfo.logo) {
      setCompanyInfo(prev => ({ ...prev, logo: currentLogo }));
    }
  }, [currentLogo]);

  const loadCompanySettings = async () => {
    try {
      const savedSettings = await getCategorySettings('company');
      if (Object.keys(savedSettings).length > 0) {
        setCompanyInfo({ ...companyInfo, ...savedSettings });
      } else {
        // إذا لم توجد إعدادات في Supabase، تحميل من localStorage للمرة الأولى
        const saved = storage.getItem('company_settings', null);
        if (saved) {
          const mergedInfo = { ...companyInfo, ...saved };
          setCompanyInfo(mergedInfo);
          // حفظ في Supabase للمرة الأولى
          await setCategorySettings('company', mergedInfo);
        }
      }
    } catch (error) {
      console.error('خطأ في تحميل إعدادات الشركة:', error);
      // fallback إلى localStorage في حالة الخطأ
      const saved = storage.getItem('company_settings', null);
      if (saved) {
        setCompanyInfo({ ...companyInfo, ...saved });
      }
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // حفظ في Supabase
      const success = await setCategorySettings('company', companyInfo);
      if (!success) {
        throw new Error('فشل في حفظ الإعدادات في Supabase');
      }
      
      // حفظ في localStorage كـ backup
      storage.setItem('company_settings', companyInfo);
      
      // تطبيق إعدادات النظام
      document.documentElement.lang = companyInfo.language;
      document.documentElement.dir = companyInfo.language === 'ar' ? 'rtl' : 'ltr';
      
      // تحديث العملة في النظام
      storage.setItem('selected_currency', {
        code: companyInfo.currency,
        name: currencies.find(c => c.code === companyInfo.currency)?.name || 'ريال سعودي',
        symbol: currencies.find(c => c.code === companyInfo.currency)?.symbol || 'ر.س'
      });

      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ إعدادات الشركة في Supabase بنجاح",
      });
    } catch (error) {
      console.error('خطأ في حفظ إعدادات الشركة:', error);
      // في حالة الخطأ، احفظ في localStorage فقط
      storage.setItem('company_settings', companyInfo);
      toast({
        title: "تم الحفظ محلياً",
        description: "تم حفظ الإعدادات محلياً، ولكن فشل في المزامنة مع السحابة",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "حجم الملف كبير",
          description: "يرجى اختيار ملف أصغر من 5MB",
          variant: "destructive",
        });
        return;
      }

      try {
        // رفع إلى Supabase
        const result = await uploadCompanyLogo(file, companyInfo.name);
        if (result) {
          setCompanyInfo(prev => ({ ...prev, logo: result.logo_url }));
        }
      } catch (error) {
        // fallback إلى base64 إذا فشل Supabase
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setCompanyInfo(prev => ({ ...prev, logo: result }));
          setLogoFromUrl(result, companyInfo.name);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const resetSettings = () => {
    setCompanyInfo({
      name: "شركة عمران",
      logo: "",
      description: "",
      address: "",
      city: "",
      country: "السعودية",
      phone: "",
      mobile: "",
      email: "",
      website: "",
      taxNumber: "",
      licenseNumber: "",
      currency: "SAR",
      taxRate: 15,
      taxType: "vat",
      language: "ar",
      timezone: "Asia/Riyadh",
      dateFormat: "dd/MM/yyyy",
      numberFormat: "ar-SA"
    });
    
    toast({
      title: "تم إعادة التعيين",
      description: "تم إعادة تعيين جميع الإعدادات للقيم الافتراضية",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إعدادات الشركة</h2>
          <p className="text-muted-foreground">قم بتخصيص معلومات شركتك وإعداداتها</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={resetSettings} 
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
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isLoading ? "جاري الحفظ..." : "حفظ الإعدادات"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">المعلومات الأساسية</TabsTrigger>
          <TabsTrigger value="contact">معلومات الاتصال</TabsTrigger>
          <TabsTrigger value="financial">الإعدادات المالية</TabsTrigger>
          <TabsTrigger value="regional">الإعدادات الإقليمية</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                المعلومات الأساسية
              </CardTitle>
              <CardDescription>
                أدخل المعلومات الأساسية لشركتك
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* شعار الشركة */}
              <div className="space-y-2">
                <Label>شعار الشركة</Label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 border-2 border-dashed border-muted rounded-lg flex items-center justify-center overflow-hidden">
                    {(companyInfo.logo || currentLogo) ? (
                      <img 
                        src={companyInfo.logo || currentLogo} 
                        alt="شعار الشركة" 
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <Button 
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="gap-2 mb-2"
                    >
                      <Upload className="h-4 w-4" />
                      اختيار شعار
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      PNG, JPG أو SVG - حد أقصى 5MB
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">اسم الشركة *</Label>
                  <Input
                    id="company-name"
                    value={companyInfo.name}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="أدخل اسم الشركة"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="license-number">رقم الترخيص</Label>
                  <Input
                    id="license-number"
                    value={companyInfo.licenseNumber}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, licenseNumber: e.target.value }))}
                    placeholder="أدخل رقم ترخيص الشركة"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">وصف الشركة</Label>
                <Textarea
                  id="description"
                  value={companyInfo.description}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="وصف موجز عن نشاط الشركة"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                معلومات الاتصال والعنوان
              </CardTitle>
              <CardDescription>
                أدخل معلومات الاتصال والعنوان الخاصة بالشركة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    الهاتف الثابت
                  </Label>
                  <Input
                    id="phone"
                    value={companyInfo.phone}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+966 11 234 5678"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    الجوال
                  </Label>
                  <Input
                    id="mobile"
                    value={companyInfo.mobile}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, mobile: e.target.value }))}
                    placeholder="+966 55 123 4567"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    البريد الإلكتروني
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={companyInfo.email}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="info@company.com"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    الموقع الإلكتروني
                  </Label>
                  <Input
                    id="website"
                    value={companyInfo.website}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="www.company.com"
                    dir="ltr"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  العنوان الكامل
                </Label>
                
                <div className="space-y-2">
                  <Textarea
                    value={companyInfo.address}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="الشارع، الحي، المنطقة..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">المدينة</Label>
                    <Input
                      id="city"
                      value={companyInfo.city}
                      onChange={(e) => setCompanyInfo(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="الرياض"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">الدولة</Label>
                    <Select 
                      value={companyInfo.country} 
                      onValueChange={(value) => setCompanyInfo(prev => ({ ...prev, country: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الدولة" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                الإعدادات المالية
              </CardTitle>
              <CardDescription>
                إعدادات العملة والضرائب والمعاملات المالية
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">العملة الرسمية *</Label>
                  <Select 
                    value={companyInfo.currency} 
                    onValueChange={(value) => setCompanyInfo(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر العملة" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">{currency.symbol}</span>
                            <span>{currency.name}</span>
                            <span className="text-muted-foreground">({currency.code})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tax-number" className="flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    الرقم الضريبي
                  </Label>
                  <Input
                    id="tax-number"
                    value={companyInfo.taxNumber}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, taxNumber: e.target.value }))}
                    placeholder="300000000000003"
                    dir="ltr"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label>إعدادات الضريبة</Label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tax-type">نوع الضريبة</Label>
                    <Select 
                      value={companyInfo.taxType} 
                      onValueChange={(value: 'vat' | 'sales' | 'none') => 
                        setCompanyInfo(prev => ({ ...prev, taxType: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع الضريبة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vat">ضريبة القيمة المضافة (VAT)</SelectItem>
                        <SelectItem value="sales">ضريبة المبيعات</SelectItem>
                        <SelectItem value="none">بدون ضريبة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tax-rate">معدل الضريبة (%)</Label>
                    <Input
                      id="tax-rate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={companyInfo.taxRate}
                      onChange={(e) => setCompanyInfo(prev => ({ 
                        ...prev, 
                        taxRate: parseFloat(e.target.value) || 0 
                      }))}
                      placeholder="15"
                      disabled={companyInfo.taxType === 'none'}
                    />
                  </div>
                </div>

                {companyInfo.taxType === 'vat' && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>ملاحظة:</strong> ضريبة القيمة المضافة في السعودية 15%، في الإمارات 5%
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regional" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                الإعدادات الإقليمية
              </CardTitle>
              <CardDescription>
                إعدادات اللغة والتاريخ والأرقام والمنطقة الزمنية
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">اللغة</Label>
                  <Select 
                    value={companyInfo.language} 
                    onValueChange={(value) => setCompanyInfo(prev => ({ ...prev, language: value }))}
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

                <div className="space-y-2">
                  <Label htmlFor="timezone">المنطقة الزمنية</Label>
                  <Select 
                    value={companyInfo.timezone} 
                    onValueChange={(value) => setCompanyInfo(prev => ({ ...prev, timezone: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Riyadh">الرياض (GMT+3)</SelectItem>
                      <SelectItem value="Asia/Dubai">دبي (GMT+4)</SelectItem>
                      <SelectItem value="Africa/Cairo">القاهرة (GMT+2)</SelectItem>
                      <SelectItem value="Asia/Kuwait">الكويت (GMT+3)</SelectItem>
                      <SelectItem value="Asia/Qatar">الدوحة (GMT+3)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date-format">تنسيق التاريخ</Label>
                  <Select 
                    value={companyInfo.dateFormat} 
                    onValueChange={(value) => setCompanyInfo(prev => ({ ...prev, dateFormat: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dd/MM/yyyy">يوم/شهر/سنة (31/12/2024)</SelectItem>
                      <SelectItem value="MM/dd/yyyy">شهر/يوم/سنة (12/31/2024)</SelectItem>
                      <SelectItem value="yyyy-MM-dd">سنة-شهر-يوم (2024-12-31)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="number-format">تنسيق الأرقام</Label>
                  <Select 
                    value={companyInfo.numberFormat} 
                    onValueChange={(value) => setCompanyInfo(prev => ({ ...prev, numberFormat: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar-SA">عربي سعودي (1,234.56)</SelectItem>
                      <SelectItem value="ar-AE">عربي إماراتي (1,234.56)</SelectItem>
                      <SelectItem value="en-US">إنجليزي أمريكي (1,234.56)</SelectItem>
                      <SelectItem value="en-GB">إنجليزي بريطاني (1,234.56)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}