import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface InvoiceSettings {
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
  logoUrl: string;
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

const defaultSettings: InvoiceSettings = {
  // إعدادات المظهر المتقدمة
  template: 'elegant',
  primaryColor: '#2563eb',
  secondaryColor: '#64748b',
  accentColor: '#10b981',
  fontSize: 'medium',
  fontFamily: 'cairo',
  showLogo: true,
  logoPosition: 'top-right',
  logoSize: 100,
  logoUrl: '',
  showWatermark: false,
  watermarkText: 'مسودة',
  watermarkOpacity: 0.1,
  borderStyle: 'simple',
  backgroundColor: '#ffffff',
  textColor: '#1f2937',
  headerStyle: 'modern',
  tableStyle: 'default',
  
  // إعدادات المحتوى المتقدمة
  showTaxDetails: true,
  showDiscountDetails: false,
  showPaymentTerms: true,
  showBankDetails: false,
  showQRCode: true,
  qrCodeSize: 120,
  qrCodePosition: 'bottom-right',
  showBarcode: false,
  barcodeType: 'code128',
  showItemImages: false,
  showItemDescription: true,
  showItemSerial: false,
  showCustomerSignature: false,
  showSupplierSignature: false,
  showTimeStamp: true,
  showPageWatermark: false,
  
  // إعدادات الشركة المتقدمة
  companyName: '',
  companyNameEn: '',
  companyAddress: '',
  companyAddressEn: '',
  companyPhone: '',
  companyFax: '',
  companyEmail: '',
  companyWebsite: '',
  taxNumber: '',
  commercialRegister: '',
  industryLicense: '',
  companyLogo: '',
  companyStamp: '',
  
  // إعدادات الطباعة المتقدمة
  paperSize: 'A4',
  customWidth: 210,
  customHeight: 297,
  orientation: 'portrait',
  margins: 'normal',
  marginTop: 20,
  marginBottom: 20,
  marginLeft: 20,
  marginRight: 20,
  showPageNumbers: false,
  pageNumberPosition: 'bottom-right',
  showPrintDate: false,
  printQuality: 'high',
  colorMode: 'color',
  
  // إعدادات التصدير المتقدمة
  pdfQuality: 'high',
  pdfCompression: true,
  includeAttachments: false,
  passwordProtect: false,
  documentPassword: '',
  allowPrint: true,
  allowCopy: true,
  allowEdit: false,
  allowAnnotations: false,
  pdfTitle: 'فاتورة مبيعات',
  pdfAuthor: '',
  pdfSubject: 'فاتورة مبيعات',
  pdfKeywords: 'فاتورة، مبيعات، محاسبة',
  pdfVersion: '1.7',
  
  // إعدادات التكامل
  emailSettings: {
    enabled: false,
    smtpServer: '',
    port: 587,
    username: '',
    password: '',
    encryption: 'tls',
    fromEmail: '',
    fromName: '',
    subject: 'فاتورة جديدة - رقم {invoice_number}',
    body: 'مرفق الفاتورة رقم {invoice_number} بتاريخ {invoice_date}'
  },
  
  whatsappSettings: {
    enabled: false,
    apiKey: '',
    phoneNumber: '',
    message: 'فاتورة جديدة - رقم {invoice_number}'
  },
  
  smsSettings: {
    enabled: false,
    provider: 'local',
    apiKey: '',
    message: 'فاتورة جديدة - رقم {invoice_number}'
  },
  
  // إعدادات اللغة والتوطين
  language: 'ar',
  dateFormat: 'dd/MM/yyyy',
  timeFormat: '24h',
  numberFormat: 'arabic',
  currencySymbol: 'ج.م',
  currencyPosition: 'after',
  decimalPlaces: 2,
  thousandSeparator: ',',
  decimalSeparator: '.',
  
  // إعدادات إضافية
  footerText: 'شكراً لتعاملكم معنا',
  paymentTerms: 'الدفع خلال 30 يوم من تاريخ الفاتورة',
  bankDetails: '',
  additionalNotes: '',
  disclaimerText: '',
  returnPolicy: '',
  warrantyInfo: '',
  supportContact: ''
};

interface InvoiceSettingsContextType {
  settings: InvoiceSettings;
  updateSetting: <K extends keyof InvoiceSettings>(key: K, value: InvoiceSettings[K]) => void;
  updateSettings: (newSettings: Partial<InvoiceSettings>) => void;
  saveSettings: () => void;
  resetSettings: () => void;
  copySettings: () => void;
  importSettings: (file: File) => Promise<void>;
  exportSettings: () => void;
  uploadLogo: (file: File) => Promise<string>;
  isLoading: boolean;
}

const InvoiceSettingsContext = createContext<InvoiceSettingsContextType | undefined>(undefined);

export function InvoiceSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<InvoiceSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // تحميل الإعدادات من التخزين المحلي
  useEffect(() => {
    const savedSettings = localStorage.getItem('invoice_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error('Error loading settings:', error);
        toast({
          title: "خطأ",
          description: "فشل في تحميل الإعدادات المحفوظة",
          variant: "destructive"
        });
      }
    }
  }, [toast]);

  // تحديث إعداد واحد
  const updateSetting = useCallback(<K extends keyof InvoiceSettings>(
    key: K, 
    value: InvoiceSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  // تحديث عدة إعدادات
  const updateSettings = useCallback((newSettings: Partial<InvoiceSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // حفظ الإعدادات
  const saveSettings = useCallback(() => {
    try {
      localStorage.setItem('invoice_settings', JSON.stringify(settings));
      toast({
        title: "تم الحفظ",
        description: "تم حفظ الإعدادات بنجاح",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ الإعدادات",
        variant: "destructive"
      });
    }
  }, [settings, toast]);

  // إعادة تعيين الإعدادات
  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    localStorage.removeItem('invoice_settings');
    toast({
      title: "تم إعادة التعيين",
      description: "تم إعادة تعيين جميع الإعدادات للقيم الافتراضية",
    });
  }, [toast]);

  // نسخ الإعدادات للحافظة
  const copySettings = useCallback(async () => {
    try {
      const settingsJson = JSON.stringify(settings, null, 2);
      await navigator.clipboard.writeText(settingsJson);
      toast({
        title: "تم النسخ",
        description: "تم نسخ الإعدادات إلى الحافظة",
      });
    } catch (error) {
      console.error('Error copying settings:', error);
      toast({
        title: "خطأ",
        description: "فشل في نسخ الإعدادات",
        variant: "destructive"
      });
    }
  }, [settings, toast]);

  // استيراد الإعدادات من ملف
  const importSettings = useCallback(async (file: File) => {
    setIsLoading(true);
    try {
      const text = await file.text();
      const importedSettings = JSON.parse(text);
      setSettings({ ...defaultSettings, ...importedSettings });
      toast({
        title: "تم الاستيراد",
        description: "تم استيراد الإعدادات بنجاح",
      });
    } catch (error) {
      console.error('Error importing settings:', error);
      toast({
        title: "خطأ",
        description: "فشل في استيراد الإعدادات - تأكد من صحة الملف",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // تصدير الإعدادات
  const exportSettings = useCallback(() => {
    try {
      const dataStr = JSON.stringify(settings, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "تم التصدير",
        description: "تم تصدير الإعدادات بنجاح",
      });
    } catch (error) {
      console.error('Error exporting settings:', error);
      toast({
        title: "خطأ",
        description: "فشل في تصدير الإعدادات",
        variant: "destructive"
      });
    }
  }, [settings, toast]);

  // رفع الشعار
  const uploadLogo = useCallback(async (file: File): Promise<string> => {
    setIsLoading(true);
    try {
      // التحقق من نوع الملف
      if (!file.type.startsWith('image/')) {
        throw new Error('يرجى رفع ملف صورة صالح');
      }

      // التحقق من حجم الملف (أقل من 5 ميجا)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('حجم الملف كبير جداً - الحد الأقصى 5 ميجابايت');
      }

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          updateSetting('logoUrl', dataUrl);
          updateSetting('companyLogo', dataUrl);
          resolve(dataUrl);
          toast({
            title: "تم الرفع",
            description: "تم رفع الشعار بنجاح",
          });
        };
        reader.onerror = () => {
          reject(new Error('فشل في قراءة الملف'));
        };
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشل في رفع الشعار",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [updateSetting, toast]);

  const value: InvoiceSettingsContextType = {
    settings,
    updateSetting,
    updateSettings,
    saveSettings,
    resetSettings,
    copySettings,
    importSettings,
    exportSettings,
    uploadLogo,
    isLoading
  };

  return (
    <InvoiceSettingsContext.Provider value={value}>
      {children}
    </InvoiceSettingsContext.Provider>
  );
}

export function useInvoiceSettings() {
  const context = useContext(InvoiceSettingsContext);
  if (context === undefined) {
    throw new Error('useInvoiceSettings must be used within an InvoiceSettingsProvider');
  }
  return context;
}