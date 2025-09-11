/**
 * مدير العلامة التجارية للشركة - إدارة الشعارات والتذييلات
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  Image as ImageIcon, 
  Type, 
  Eye, 
  Save, 
  RefreshCw,
  Download,
  Settings,
  Palette,
  FileText,
  Edit3,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CompanyBranding {
  logo: {
    type: 'image' | 'text';
    imageUrl?: string;
    text?: string;
    position: 'top-center' | 'top-left' | 'top-right' | 'header-left' | 'header-right';
    size: 'small' | 'medium' | 'large';
    backgroundColor?: string;
    textColor?: string;
    borderRadius?: number;
  };
  footer: {
    enabled: boolean;
    primaryText: string;
    secondaryText: string;
    contactInfo: boolean;
    socialMedia: boolean;
    customMessage: string;
    position: 'left' | 'center' | 'right';
    backgroundColor?: string;
    textColor?: string;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    primary: string;
    secondary: string;
    sizes: {
      header: number;
      body: number;
      footer: number;
    };
  };
}

const defaultBranding: CompanyBranding = {
  logo: {
    type: 'text',
    text: 'شركة عُمران للتجارة',
    position: 'top-center',
    size: 'medium',
    backgroundColor: '#2563eb',
    textColor: '#ffffff',
    borderRadius: 8
  },
  footer: {
    enabled: true,
    primaryText: 'شكراً لثقتكم بنا',
    secondaryText: 'نتطلع لخدمتكم مرة أخرى',
    contactInfo: true,
    socialMedia: false,
    customMessage: '',
    position: 'center',
    backgroundColor: '#f8fafc',
    textColor: '#64748b'
  },
  colors: {
    primary: '#2563eb',
    secondary: '#64748b',
    accent: '#059669',
    background: '#f8fafc',
    text: '#1e293b'
  },
  fonts: {
    primary: 'Arial',
    secondary: 'Tahoma',
    sizes: {
      header: 18,
      body: 14,
      footer: 12
    }
  }
};

const logoTemplates = [
  {
    id: 'modern',
    name: 'عصري',
    style: {
      backgroundColor: '#2563eb',
      textColor: '#ffffff',
      borderRadius: 12,
      padding: '15px 25px',
      fontSize: '20px',
      fontWeight: 'bold'
    }
  },
  {
    id: 'classic',
    name: 'كلاسيكي',
    style: {
      backgroundColor: '#ffffff',
      textColor: '#1e293b',
      borderRadius: 0,
      padding: '10px 20px',
      fontSize: '18px',
      fontWeight: '600',
      border: '2px solid #1e293b'
    }
  },
  {
    id: 'gradient',
    name: 'متدرج',
    style: {
      background: 'linear-gradient(135deg, #2563eb, #059669)',
      textColor: '#ffffff',
      borderRadius: 20,
      padding: '12px 30px',
      fontSize: '19px',
      fontWeight: 'bold'
    }
  },
  {
    id: 'minimal',
    name: 'بسيط',
    style: {
      backgroundColor: 'transparent',
      textColor: '#2563eb',
      borderRadius: 0,
      padding: '8px 15px',
      fontSize: '16px',
      fontWeight: '500',
      borderBottom: '3px solid #2563eb'
    }
  }
];

const footerTemplates = [
  {
    id: 'standard',
    name: 'قياسي',
    primary: 'شكراً لثقتكم بنا',
    secondary: 'نتطلع لخدمتكم مرة أخرى'
  },
  {
    id: 'professional',
    name: 'احترافي',
    primary: 'نقدر تعاملكم معنا',
    secondary: 'خدمة عملاء متميزة على مدار الساعة'
  },
  {
    id: 'friendly',
    name: 'ودود',
    primary: 'شكراً لاختياركم لنا',
    secondary: 'سعداء بخدمتكم دائماً'
  },
  {
    id: 'business',
    name: 'تجاري',
    primary: 'شركتكم الموثوقة للحلول التجارية',
    secondary: 'جودة عالية • أسعار منافسة • خدمة سريعة'
  }
];

export function CompanyBrandingManager() {
  const [branding, setBranding] = useState<CompanyBranding>(defaultBranding);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('logo');
  const [previewMode, setPreviewMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // تحميل البيانات المحفوظة
  useEffect(() => {
    const loadBranding = () => {
      try {
        const savedBranding = localStorage.getItem('company_branding');
        if (savedBranding) {
          setBranding({ ...defaultBranding, ...JSON.parse(savedBranding) });
        }
      } catch (error) {
        console.error('Error loading branding:', error);
      }
    };

    loadBranding();
  }, []);

  // حفظ التغييرات
  const saveBranding = () => {
    try {
      localStorage.setItem('company_branding', JSON.stringify(branding));
      
      // تحديث إعدادات الشركة العامة
      const companySettings = JSON.parse(localStorage.getItem('company_settings') || '{}');
      companySettings.logo = branding.logo.type === 'image' ? branding.logo.imageUrl : branding.logo.text;
      companySettings.branding = branding;
      localStorage.setItem('company_settings', JSON.stringify(companySettings));
      
      // إطلاق حدث التحديث
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'company_settings',
        newValue: JSON.stringify(companySettings)
      }));

      toast({
        title: "تم الحفظ",
        description: "تم حفظ إعدادات العلامة التجارية بنجاح",
      });
      
      setIsOpen(false);
    } catch (error) {
      console.error('Error saving branding:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ الإعدادات",
        variant: "destructive",
      });
    }
  };

  // تحديث جزء من البيانات
  const updateBranding = (section: keyof CompanyBranding, updates: any) => {
    setBranding(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...updates
      }
    }));
  };

  // رفع ملف الشعار
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "خطأ",
          description: "حجم الملف كبير جداً. يرجى اختيار ملف أصغر من 5MB",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        updateBranding('logo', {
          type: 'image',
          imageUrl: imageUrl
        });
        
        toast({
          title: "تم التحديث",
          description: "تم رفع الشعار بنجاح",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // تطبيق قالب شعار
  const applyLogoTemplate = (template: typeof logoTemplates[0]) => {
    updateBranding('logo', {
      ...branding.logo,
      backgroundColor: template.style.backgroundColor || branding.logo.backgroundColor,
      textColor: template.style.textColor || branding.logo.textColor,
      borderRadius: template.style.borderRadius !== undefined ? template.style.borderRadius : branding.logo.borderRadius
    });
  };

  // تطبيق قالب تذييل
  const applyFooterTemplate = (template: typeof footerTemplates[0]) => {
    updateBranding('footer', {
      ...branding.footer,
      primaryText: template.primary,
      secondaryText: template.secondary
    });
  };

  // إنشاء معاينة الشعار
  const renderLogoPreview = () => {
    if (branding.logo.type === 'image' && branding.logo.imageUrl) {
      return (
        <div className="flex justify-center">
          <img 
            src={branding.logo.imageUrl} 
            alt="شعار الشركة" 
            className={`
              ${branding.logo.size === 'small' ? 'h-12' : branding.logo.size === 'large' ? 'h-20' : 'h-16'}
              object-contain
            `}
            style={{
              borderRadius: `${branding.logo.borderRadius}px`
            }}
          />
        </div>
      );
    }

    return (
      <div className="flex justify-center">
        <div 
          className={`
            inline-block px-4 py-2 font-bold text-center
            ${branding.logo.size === 'small' ? 'text-sm' : branding.logo.size === 'large' ? 'text-xl' : 'text-lg'}
          `}
          style={{
            backgroundColor: branding.logo.backgroundColor,
            color: branding.logo.textColor,
            borderRadius: `${branding.logo.borderRadius}px`
          }}
        >
          {branding.logo.text || 'شركة عُمران'}
        </div>
      </div>
    );
  };

  // إنشاء معاينة التذييل
  const renderFooterPreview = () => {
    return (
      <div 
        className={`p-4 rounded-md text-${branding.footer.position}`}
        style={{
          backgroundColor: branding.footer.backgroundColor,
          color: branding.footer.textColor
        }}
      >
        <div className="font-bold text-lg mb-2">{branding.footer.primaryText}</div>
        <div className="text-sm">{branding.footer.secondaryText}</div>
        {branding.footer.customMessage && (
          <div className="text-xs mt-2 opacity-80">{branding.footer.customMessage}</div>
        )}
      </div>
    );
  };

  // تصدير الإعدادات
  const exportBranding = () => {
    const dataStr = JSON.stringify(branding, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'company-branding.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              العلامة التجارية للشركة
            </div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings className="h-4 w-4" />
                  إدارة العلامة التجارية
                </Button>
              </DialogTrigger>
              
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>إدارة العلامة التجارية للشركة</DialogTitle>
                </DialogHeader>
                
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="logo">الشعار</TabsTrigger>
                    <TabsTrigger value="footer">التذييل</TabsTrigger>
                    <TabsTrigger value="colors">الألوان</TabsTrigger>
                    <TabsTrigger value="preview">المعاينة</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="logo" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-4">
                        <h4 className="font-medium flex items-center gap-2">
                          <ImageIcon className="h-4 w-4" />
                          إعدادات الشعار
                        </h4>
                        
                        <div className="space-y-3">
                          <div>
                            <Label>نوع الشعار</Label>
                            <Select
                              value={branding.logo.type}
                              onValueChange={(value: 'image' | 'text') => 
                                updateBranding('logo', { type: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">نص</SelectItem>
                                <SelectItem value="image">صورة</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {branding.logo.type === 'text' ? (
                            <div>
                              <Label>نص الشعار</Label>
                              <Input
                                value={branding.logo.text || ''}
                                onChange={(e) => 
                                  updateBranding('logo', { text: e.target.value })
                                }
                                placeholder="اسم الشركة..."
                              />
                            </div>
                          ) : (
                            <div>
                              <Label>رفع صورة الشعار</Label>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => fileInputRef.current?.click()}
                                  className="gap-2"
                                >
                                  <Upload className="h-4 w-4" />
                                  رفع صورة
                                </Button>
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept="image/*"
                                  onChange={handleLogoUpload}
                                  className="hidden"
                                />
                              </div>
                            </div>
                          )}
                          
                          <div>
                            <Label>موضع الشعار</Label>
                            <Select
                              value={branding.logo.position}
                              onValueChange={(value) => 
                                updateBranding('logo', { position: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="top-center">أعلى - وسط</SelectItem>
                                <SelectItem value="top-left">أعلى - يسار</SelectItem>
                                <SelectItem value="top-right">أعلى - يمين</SelectItem>
                                <SelectItem value="header-left">رأس الصفحة - يسار</SelectItem>
                                <SelectItem value="header-right">رأس الصفحة - يمين</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label>حجم الشعار</Label>
                            <Select
                              value={branding.logo.size}
                              onValueChange={(value) => 
                                updateBranding('logo', { size: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="small">صغير</SelectItem>
                                <SelectItem value="medium">متوسط</SelectItem>
                                <SelectItem value="large">كبير</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        {branding.logo.type === 'text' && (
                          <div className="space-y-3">
                            <Separator />
                            <h5 className="font-medium">تخصيص النص</h5>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label>لون الخلفية</Label>
                                <Input
                                  type="color"
                                  value={branding.logo.backgroundColor}
                                  onChange={(e) => 
                                    updateBranding('logo', { backgroundColor: e.target.value })
                                  }
                                />
                              </div>
                              
                              <div>
                                <Label>لون النص</Label>
                                <Input
                                  type="color"
                                  value={branding.logo.textColor}
                                  onChange={(e) => 
                                    updateBranding('logo', { textColor: e.target.value })
                                  }
                                />
                              </div>
                            </div>
                            
                            <div>
                              <Label>استدارة الحواف</Label>
                              <Input
                                type="number"
                                min="0"
                                max="50"
                                value={branding.logo.borderRadius}
                                onChange={(e) => 
                                  updateBranding('logo', { borderRadius: parseInt(e.target.value) })
                                }
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-3">معاينة الشعار</h4>
                          <div className="p-6 border rounded-lg bg-white">
                            {renderLogoPreview()}
                          </div>
                        </div>
                        
                        {branding.logo.type === 'text' && (
                          <div>
                            <h5 className="font-medium mb-3">قوالب سريعة</h5>
                            <div className="grid grid-cols-2 gap-2">
                              {logoTemplates.map((template) => (
                                <Button
                                  key={template.id}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => applyLogoTemplate(template)}
                                  className="text-xs"
                                >
                                  {template.name}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="footer" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-4">
                        <h4 className="font-medium flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          إعدادات التذييل
                        </h4>
                        
                        <div className="flex items-center justify-between p-3 border rounded">
                          <Label>تفعيل التذييل</Label>
                          <Switch
                            checked={branding.footer.enabled}
                            onCheckedChange={(checked) => 
                              updateBranding('footer', { enabled: checked })
                            }
                          />
                        </div>
                        
                        {branding.footer.enabled && (
                          <div className="space-y-3">
                            <div>
                              <Label>النص الأساسي</Label>
                              <Input
                                value={branding.footer.primaryText}
                                onChange={(e) => 
                                  updateBranding('footer', { primaryText: e.target.value })
                                }
                                placeholder="شكراً لثقتكم بنا"
                              />
                            </div>
                            
                            <div>
                              <Label>النص الثانوي</Label>
                              <Input
                                value={branding.footer.secondaryText}
                                onChange={(e) => 
                                  updateBranding('footer', { secondaryText: e.target.value })
                                }
                                placeholder="نتطلع لخدمتكم مرة أخرى"
                              />
                            </div>
                            
                            <div>
                              <Label>رسالة مخصصة</Label>
                              <Textarea
                                value={branding.footer.customMessage}
                                onChange={(e) => 
                                  updateBranding('footer', { customMessage: e.target.value })
                                }
                                placeholder="رسالة إضافية اختيارية..."
                                rows={2}
                              />
                            </div>
                            
                            <div>
                              <Label>موضع النص</Label>
                              <Select
                                value={branding.footer.position}
                                onValueChange={(value) => 
                                  updateBranding('footer', { position: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="left">يسار</SelectItem>
                                  <SelectItem value="center">وسط</SelectItem>
                                  <SelectItem value="right">يمين</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label>لون الخلفية</Label>
                                <Input
                                  type="color"
                                  value={branding.footer.backgroundColor}
                                  onChange={(e) => 
                                    updateBranding('footer', { backgroundColor: e.target.value })
                                  }
                                />
                              </div>
                              
                              <div>
                                <Label>لون النص</Label>
                                <Input
                                  type="color"
                                  value={branding.footer.textColor}
                                  onChange={(e) => 
                                    updateBranding('footer', { textColor: e.target.value })
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div>
                          <h5 className="font-medium mb-3">قوالب سريعة</h5>
                          <div className="grid grid-cols-2 gap-2">
                            {footerTemplates.map((template) => (
                              <Button
                                key={template.id}
                                variant="outline"
                                size="sm"
                                onClick={() => applyFooterTemplate(template)}
                                className="text-xs"
                              >
                                {template.name}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-3">معاينة التذييل</h4>
                          <div className="border rounded-lg overflow-hidden">
                            {branding.footer.enabled ? renderFooterPreview() : (
                              <div className="p-4 text-center text-muted-foreground">
                                التذييل غير مفعل
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="colors" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-4">
                        <h4 className="font-medium flex items-center gap-2">
                          <Palette className="h-4 w-4" />
                          لوحة الألوان
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>اللون الأساسي</Label>
                            <Input
                              type="color"
                              value={branding.colors.primary}
                              onChange={(e) => 
                                updateBranding('colors', { primary: e.target.value })
                              }
                            />
                          </div>
                          
                          <div>
                            <Label>اللون الثانوي</Label>
                            <Input
                              type="color"
                              value={branding.colors.secondary}
                              onChange={(e) => 
                                updateBranding('colors', { secondary: e.target.value })
                              }
                            />
                          </div>
                          
                          <div>
                            <Label>لون التمييز</Label>
                            <Input
                              type="color"
                              value={branding.colors.accent}
                              onChange={(e) => 
                                updateBranding('colors', { accent: e.target.value })
                              }
                            />
                          </div>
                          
                          <div>
                            <Label>لون الخلفية</Label>
                            <Input
                              type="color"
                              value={branding.colors.background}
                              onChange={(e) => 
                                updateBranding('colors', { background: e.target.value })
                              }
                            />
                          </div>
                          
                          <div className="col-span-2">
                            <Label>لون النص</Label>
                            <Input
                              type="color"
                              value={branding.colors.text}
                              onChange={(e) => 
                                updateBranding('colors', { text: e.target.value })
                              }
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="font-medium">معاينة الألوان</h4>
                        <div className="space-y-3">
                          <div 
                            className="p-3 rounded text-white text-center font-medium"
                            style={{ backgroundColor: branding.colors.primary }}
                          >
                            اللون الأساسي
                          </div>
                          <div 
                            className="p-3 rounded text-white text-center"
                            style={{ backgroundColor: branding.colors.secondary }}
                          >
                            اللون الثانوي
                          </div>
                          <div 
                            className="p-3 rounded text-white text-center"
                            style={{ backgroundColor: branding.colors.accent }}
                          >
                            لون التمييز
                          </div>
                          <div 
                            className="p-3 rounded border text-center"
                            style={{ 
                              backgroundColor: branding.colors.background,
                              color: branding.colors.text
                            }}
                          >
                            الخلفية والنص
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="preview" className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-4">معاينة شاملة للعلامة التجارية</h4>
                      
                      <div className="border rounded-lg p-6 bg-white space-y-6">
                        {/* معاينة الشعار */}
                        <div className={`text-${branding.logo.position.includes('center') ? 'center' : branding.logo.position.includes('left') ? 'left' : 'right'}`}>
                          {renderLogoPreview()}
                        </div>
                        
                        <Separator />
                        
                        {/* محتوى تجريبي */}
                        <div 
                          className="p-4 rounded"
                          style={{ backgroundColor: branding.colors.background }}
                        >
                          <h3 
                            className="text-xl font-bold mb-2"
                            style={{ color: branding.colors.primary }}
                          >
                            فاتورة مبيعات رقم 12345
                          </h3>
                          <p style={{ color: branding.colors.text }}>
                            هذا مثال على كيفية ظهور المستندات مع العلامة التجارية الجديدة
                          </p>
                        </div>
                        
                        <Separator />
                        
                        {/* معاينة التذييل */}
                        {branding.footer.enabled && renderFooterPreview()}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                
                <Separator />
                
                <div className="flex justify-between gap-3">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={exportBranding}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      تصدير
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setBranding(defaultBranding)}
                      className="gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      إعادة تعيين
                    </Button>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                      إلغاء
                    </Button>
                    <Button onClick={saveBranding} className="gap-2">
                      <Save className="h-4 w-4" />
                      حفظ التغييرات
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">الشعار الحالي</h4>
              <div className="p-4 border rounded-lg bg-white">
                {renderLogoPreview()}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">التذييل الحالي</h4>
              <div className="border rounded-lg overflow-hidden">
                {branding.footer.enabled ? (
                  renderFooterPreview()
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    التذييل غير مفعل
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}