import { useState, useEffect } from "react";
import { storage } from "@/utils/storage";

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

const defaultCompanyInfo: CompanyInfo = {
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
};

export function useCompanySettings() {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(defaultCompanyInfo);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCompanySettings();
  }, []);

  const loadCompanySettings = () => {
    setIsLoading(true);
    try {
      const saved = storage.getItem('company_settings', null);
      if (saved) {
        setCompanyInfo({ ...defaultCompanyInfo, ...saved });
      }
    } catch (error) {
      console.error('خطأ في تحميل إعدادات الشركة:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCompanySettings = (updates: Partial<CompanyInfo>) => {
    const updatedInfo = { ...companyInfo, ...updates };
    setCompanyInfo(updatedInfo);
    storage.setItem('company_settings', updatedInfo);
    
    // تطبيق إعدادات النظام
    if (updates.language) {
      document.documentElement.lang = updates.language;
      document.documentElement.dir = updates.language === 'ar' ? 'rtl' : 'ltr';
    }
    
    // تحديث العملة في النظام
    if (updates.currency) {
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
      
      const selectedCurrency = currencies.find(c => c.code === updates.currency);
      if (selectedCurrency) {
        storage.setItem('selected_currency', selectedCurrency);
      }
    }
  };

  const formatCurrency = (amount: number): string => {
    const currencies = {
      'SAR': 'ر.س',
      'AED': 'د.إ',
      'EGP': 'ج.م',
      'USD': '$',
      'EUR': '€',
      'KWD': 'د.ك',
      'QAR': 'ر.ق',
      'OMR': 'ر.ع',
      'BHD': 'د.ب',
      'JOD': 'د.أ',
      'LBP': 'ل.ل',
      'IQD': 'د.ع'
    };

    const symbol = currencies[companyInfo.currency as keyof typeof currencies] || 'ر.س';
    
    try {
      const formatted = new Intl.NumberFormat(companyInfo.numberFormat, {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
      
      return `${formatted} ${symbol}`;
    } catch {
      return `${amount.toFixed(2)} ${symbol}`;
    }
  };

  const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    try {
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      };

      if (companyInfo.dateFormat === 'MM/dd/yyyy') {
        return new Intl.DateTimeFormat('en-US', options).format(dateObj);
      } else if (companyInfo.dateFormat === 'yyyy-MM-dd') {
        return dateObj.toISOString().split('T')[0];
      } else {
        // Default dd/MM/yyyy
        return new Intl.DateTimeFormat('en-GB', options).format(dateObj);
      }
    } catch {
      return dateObj.toLocaleDateString();
    }
  };

  const calculateTax = (amount: number): number => {
    if (companyInfo.taxType === 'none' || companyInfo.taxRate === 0) {
      return 0;
    }
    return (amount * companyInfo.taxRate) / 100;
  };

  const getTaxLabel = (): string => {
    switch (companyInfo.taxType) {
      case 'vat':
        return 'ضريبة القيمة المضافة';
      case 'sales':
        return 'ضريبة المبيعات';
      default:
        return 'ضريبة';
    }
  };

  return {
    companyInfo,
    isLoading,
    updateCompanySettings,
    loadCompanySettings,
    formatCurrency,
    formatDate,
    calculateTax,
    getTaxLabel,
  };
}