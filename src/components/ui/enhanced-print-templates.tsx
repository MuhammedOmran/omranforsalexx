/**
 * نظام قوالب الطباعة المحسّن مع دعم الشعارات المخصصة
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Printer, 
  Settings, 
  Eye, 
  Download, 
  Upload, 
  Image as ImageIcon,
  Type,
  Palette,
  Layout,
  FileText,
  Save,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface EnhancedPrintTemplate {
  id: string;
  name: string;
  description: string;
  type: 'invoice' | 'receipt' | 'report' | 'thermal';
  category: 'sales' | 'purchase' | 'returns' | 'reports';
  settings: {
    // إعدادات المحتوى
    showLogo: boolean;
    showCompanyInfo: boolean;
    showCustomerInfo: boolean;
    showItemDetails: boolean;
    showPrices: boolean;
    showTotals: boolean;
    showNotes: boolean;
    showFooter: boolean;
    showBarcode: boolean;
    showQRCode: boolean;
    
    // إعدادات التصميم
    fontSize: number;
    fontFamily: string;
    primaryColor: string;
    secondaryColor: string;
    headerBackgroundColor: string;
    borderColor: string;
    
    // إعدادات الصفحة
    paperSize: string;
    orientation: 'portrait' | 'landscape';
    margins: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
    
    // إعدادات الشعار
    logoPosition: 'top-center' | 'top-left' | 'top-right' | 'header-left' | 'header-right';
    logoSize: 'small' | 'medium' | 'large';
    customLogo?: string;
    
    // إعدادات التذييل المخصص
    customFooter: string;
    footerPosition: 'left' | 'center' | 'right';
    showCompanySlogan: boolean;
    
    // إعدادات إضافية
    watermark: boolean;
    watermarkText: string;
    showPageNumbers: boolean;
    duplicateCount: number;
  };
}

const defaultEnhancedTemplates: EnhancedPrintTemplate[] = [
  {
    id: 'professional-invoice',
    name: 'فاتورة احترافية',
    description: 'قالب فاتورة احترافي مع شعار الشركة وتصميم أنيق',
    type: 'invoice',
    category: 'sales',
    settings: {
      showLogo: true,
      showCompanyInfo: true,
      showCustomerInfo: true,
      showItemDetails: true,
      showPrices: true,
      showTotals: true,
      showNotes: true,
      showFooter: true,
      showBarcode: false,
      showQRCode: true,
      fontSize: 14,
      fontFamily: 'Arial',
      primaryColor: '#2563eb',
      secondaryColor: '#64748b',
      headerBackgroundColor: '#f8fafc',
      borderColor: '#e2e8f0',
      paperSize: 'A4',
      orientation: 'portrait',
      margins: { top: 25, bottom: 25, left: 20, right: 20 },
      logoPosition: 'top-center',
      logoSize: 'medium',
      customFooter: 'شكراً لثقتكم بنا - نتطلع لخدمتكم مرة أخرى',
      footerPosition: 'center',
      showCompanySlogan: true,
      watermark: true,
      watermarkText: 'عُمران',
      showPageNumbers: false,
      duplicateCount: 1
    }
  },
  {
    id: 'thermal-receipt',
    name: 'إيصال طابعة حرارية',
    description: 'قالب مصمم خصيصاً للطابعات الحرارية',
    type: 'thermal',
    category: 'sales',
    settings: {
      showLogo: true,
      showCompanyInfo: true,
      showCustomerInfo: false,
      showItemDetails: true,
      showPrices: true,
      showTotals: true,
      showNotes: false,
      showFooter: true,
      showBarcode: true,
      showQRCode: false,
      fontSize: 11,
      fontFamily: 'Arial',
      primaryColor: '#000000',
      secondaryColor: '#666666',
      headerBackgroundColor: '#ffffff',
      borderColor: '#000000',
      paperSize: '58mm',
      orientation: 'portrait',
      margins: { top: 5, bottom: 5, left: 5, right: 5 },
      logoPosition: 'top-center',
      logoSize: 'small',
      customFooter: 'شكراً لكم',
      footerPosition: 'center',
      showCompanySlogan: false,
      watermark: false,
      watermarkText: '',
      showPageNumbers: false,
      duplicateCount: 1
    }
  },
  {
    id: 'returns-receipt',
    name: 'قسيمة إرجاع',
    description: 'قالب خاص بقسائم الإرجاع مع التوقيعات',
    type: 'receipt',
    category: 'returns',
    settings: {
      showLogo: true,
      showCompanyInfo: true,
      showCustomerInfo: true,
      showItemDetails: true,
      showPrices: true,
      showTotals: true,
      showNotes: true,
      showFooter: true,
      showBarcode: false,
      showQRCode: false,
      fontSize: 13,
      fontFamily: 'Arial',
      primaryColor: '#dc2626',
      secondaryColor: '#64748b',
      headerBackgroundColor: '#fef2f2',
      borderColor: '#dc2626',
      paperSize: 'A4',
      orientation: 'portrait',
      margins: { top: 20, bottom: 20, left: 20, right: 20 },
      logoPosition: 'top-center',
      logoSize: 'medium',
      customFooter: 'يرجى الاحتفاظ بهذه القسيمة لأي مراجعة مستقبلية',
      footerPosition: 'center',
      showCompanySlogan: true,
      watermark: false,
      watermarkText: '',
      showPageNumbers: false,
      duplicateCount: 2
    }
  },
  {
    id: 'detailed-report',
    name: 'تقرير مفصل',
    description: 'قالب للتقارير التفصيلية مع رسوم بيانية',
    type: 'report',
    category: 'reports',
    settings: {
      showLogo: true,
      showCompanyInfo: true,
      showCustomerInfo: false,
      showItemDetails: true,
      showPrices: true,
      showTotals: true,
      showNotes: true,
      showFooter: true,
      showBarcode: false,
      showQRCode: false,
      fontSize: 12,
      fontFamily: 'Arial',
      primaryColor: '#059669',
      secondaryColor: '#64748b',
      headerBackgroundColor: '#f0fdf4',
      borderColor: '#059669',
      paperSize: 'A4',
      orientation: 'portrait',
      margins: { top: 30, bottom: 30, left: 25, right: 25 },
      logoPosition: 'header-left',
      logoSize: 'medium',
      customFooter: 'تقرير مُنتج بواسطة نظام إدارة المبيعات',
      footerPosition: 'center',
      showCompanySlogan: true,
      watermark: true,
      watermarkText: 'سري',
      showPageNumbers: true,
      duplicateCount: 1
    }
  }
];

interface EnhancedPrintTemplatesProps {
  data: any;
  type: 'invoice' | 'receipt' | 'report';
  category?: 'sales' | 'purchase' | 'returns' | 'reports';
  onPrint?: (templateId: string) => void;
}

export function EnhancedPrintTemplates({ 
  data, 
  type, 
  category = 'sales',
  onPrint 
}: EnhancedPrintTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('professional-invoice');
  const [customTemplate, setCustomTemplate] = useState<EnhancedPrintTemplate | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const { toast } = useToast();

  // تحميل بيانات الشركة
  useEffect(() => {
    const loadCompanyInfo = () => {
      try {
        const savedSettings = localStorage.getItem('company_settings');
        if (savedSettings) {
          setCompanyInfo(JSON.parse(savedSettings));
        }
      } catch (error) {
        console.error('Error loading company info:', error);
      }
    };

    loadCompanyInfo();
    window.addEventListener('storage', loadCompanyInfo);
    return () => window.removeEventListener('storage', loadCompanyInfo);
  }, []);

  // تصفية القوالب حسب النوع والفئة
  const availableTemplates = defaultEnhancedTemplates.filter(
    template => template.type === type || template.category === category
  );

  const currentTemplate = customTemplate || 
    availableTemplates.find(t => t.id === selectedTemplate) || 
    availableTemplates[0];

  // تحديث الإعدادات المخصصة
  const updateTemplateSetting = (key: string, value: any) => {
    const baseTemplate = availableTemplates.find(t => t.id === selectedTemplate);
    if (baseTemplate) {
      setCustomTemplate({
        ...baseTemplate,
        settings: {
          ...baseTemplate.settings,
          ...customTemplate?.settings,
          [key]: value
        }
      });
    }
  };

  // إنشاء HTML للطباعة
  const generateEnhancedHTML = (template: EnhancedPrintTemplate): string => {
    const { settings } = template;
    
    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${template.name} - ${data.id || data.returnNumber || 'مستند'}</title>
        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          
          body {
            font-family: '${settings.fontFamily}', 'Arial', 'Tahoma', sans-serif;
            font-size: ${settings.fontSize}px;
            line-height: 1.6;
            color: #333;
            direction: rtl;
            background: white;
            margin: ${settings.margins.top}mm ${settings.margins.right}mm ${settings.margins.bottom}mm ${settings.margins.left}mm;
          }
          
          .document-container {
            max-width: 100%;
            margin: 0 auto;
            background: white;
            position: relative;
          }
          
          ${settings.watermark ? `
            .watermark {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 120px;
              color: rgba(${hexToRgb(settings.primaryColor)}, 0.05);
              font-weight: bold;
              z-index: -1;
              pointer-events: none;
            }
          ` : ''}
          
          .header {
            background: ${settings.headerBackgroundColor};
            padding: 20px;
            text-align: ${settings.logoPosition.includes('center') ? 'center' : settings.logoPosition.includes('left') ? 'left' : 'right'};
            border-bottom: 3px solid ${settings.primaryColor};
            margin-bottom: 30px;
            display: flex;
            ${settings.logoPosition.includes('header') ? 'justify-content: space-between; align-items: center;' : 'flex-direction: column;'}
          }
          
          .company-logo {
            max-width: ${settings.logoSize === 'small' ? '80px' : settings.logoSize === 'large' ? '200px' : '150px'};
            max-height: ${settings.logoSize === 'small' ? '50px' : settings.logoSize === 'large' ? '120px' : '80px'};
            margin-bottom: ${settings.logoPosition.includes('header') ? '0' : '15px'};
          }
          
          .company-name {
            font-size: ${settings.fontSize + 8}px;
            font-weight: bold;
            color: ${settings.primaryColor};
            margin-bottom: 10px;
          }
          
          .company-info {
            font-size: ${settings.fontSize - 1}px;
            color: ${settings.secondaryColor};
            line-height: 1.5;
          }
          
          .document-title {
            font-size: ${settings.fontSize + 10}px;
            font-weight: bold;
            color: ${settings.primaryColor};
            margin: 20px 0;
            text-align: center;
            background: linear-gradient(135deg, ${settings.headerBackgroundColor}, #ffffff);
            padding: 20px;
            border-radius: 10px;
            border: 2px solid ${settings.primaryColor};
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: ${settings.showCustomerInfo ? '1fr 1fr' : '1fr'};
            gap: 20px;
            margin-bottom: 30px;
          }
          
          .info-section {
            background: ${settings.headerBackgroundColor};
            border: 1px solid ${settings.borderColor};
            border-radius: 8px;
            padding: 20px;
          }
          
          .section-title {
            font-weight: bold;
            font-size: ${settings.fontSize + 2}px;
            color: ${settings.primaryColor};
            margin-bottom: 15px;
            border-bottom: 2px solid ${settings.primaryColor};
            padding-bottom: 8px;
          }
          
          .info-row {
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .label {
            font-weight: 600;
            color: ${settings.secondaryColor};
            min-width: 120px;
          }
          
          .value {
            color: #1e293b;
            font-weight: 500;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          
          .items-table th {
            background: linear-gradient(135deg, ${settings.primaryColor}, ${adjustColor(settings.primaryColor, -20)});
            color: white;
            font-weight: bold;
            padding: 15px 12px;
            text-align: center;
            font-size: ${settings.fontSize}px;
            border: 1px solid ${settings.borderColor};
          }
          
          .items-table td {
            padding: 12px;
            text-align: center;
            border: 1px solid ${settings.borderColor};
            vertical-align: middle;
          }
          
          .items-table tr:nth-child(even) {
            background-color: ${settings.headerBackgroundColor};
          }
          
          .totals-section {
            margin: 30px auto 0 auto;
            width: 100%;
            max-width: 450px;
            background: linear-gradient(135deg, ${settings.headerBackgroundColor}, #ffffff);
            border: 2px solid ${settings.primaryColor};
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 8px 25px rgba(${hexToRgb(settings.primaryColor)}, 0.15);
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            padding: 8px 0;
            border-bottom: 1px solid ${settings.borderColor};
          }
          
          .final-total {
            background: linear-gradient(135deg, ${settings.primaryColor}, ${adjustColor(settings.primaryColor, -20)});
            color: white;
            padding: 15px;
            margin: 20px -25px -25px -25px;
            border-radius: 0 0 13px 13px;
            font-size: ${settings.fontSize + 4}px;
            font-weight: bold;
            text-align: center;
          }
          
          .notes-section {
            margin: 30px 0;
            background: #fffbeb;
            border: 2px solid #f59e0b;
            border-radius: 10px;
            padding: 20px;
          }
          
          .footer {
            margin-top: 40px;
            text-align: ${settings.footerPosition};
            padding: 20px;
            background: ${settings.headerBackgroundColor};
            border-radius: 10px;
            border: 1px solid ${settings.borderColor};
          }
          
          .custom-footer {
            font-size: ${settings.fontSize + 2}px;
            font-weight: bold;
            color: ${settings.primaryColor};
            margin-bottom: 15px;
          }
          
          .page-number {
            position: fixed;
            bottom: 10mm;
            right: 50%;
            transform: translateX(50%);
            font-size: ${settings.fontSize - 2}px;
            color: ${settings.secondaryColor};
          }
          
          .signatures {
            margin-top: 40px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            text-align: center;
          }
          
          .signature-box {
            padding: 20px 0;
          }
          
          .signature-line {
            border-top: 2px solid ${settings.primaryColor};
            margin-top: 40px;
            padding-top: 10px;
            font-weight: bold;
            color: ${settings.primaryColor};
          }
          
          @media print {
            body {
              margin: 0;
              background: white !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .no-print {
              display: none !important;
            }
            
            @page {
              size: ${settings.paperSize === 'A4' ? 'A4' : settings.paperSize} ${settings.orientation};
              margin: ${settings.margins.top}mm ${settings.margins.right}mm ${settings.margins.bottom}mm ${settings.margins.left}mm;
            }
          }
          
          /* Thermal printer styles */
          ${template.type === 'thermal' ? `
            body { 
              width: ${settings.paperSize}; 
              font-size: ${settings.fontSize - 2}px;
              margin: 2mm;
            }
            .info-grid { 
              grid-template-columns: 1fr;
              gap: 10px;
            }
            .info-section { 
              padding: 10px; 
              margin-bottom: 10px;
            }
            .items-table th, .items-table td { 
              padding: 6px 4px; 
              font-size: ${settings.fontSize - 3}px;
            }
            .totals-section { 
              max-width: 100%; 
              padding: 15px;
            }
          ` : ''}
        </style>
      </head>
      <body>
        ${settings.watermark ? `<div class="watermark">${settings.watermarkText}</div>` : ''}
        
        <div class="document-container">
          ${generateHeaderHTML(template, companyInfo)}
          
          <div class="document-title">
            ${getDocumentTitle(template, data)}
          </div>
          
          ${generateContentHTML(template, data)}
          
          ${settings.showFooter ? generateFooterHTML(template, companyInfo) : ''}
          
          ${template.category === 'returns' ? generateSignaturesHTML(template) : ''}
          
          ${settings.showPageNumbers ? '<div class="page-number">صفحة 1</div>' : ''}
        </div>
      </body>
      </html>
    `;
  };

  // دوال مساعدة لإنشاء HTML
  const generateHeaderHTML = (template: EnhancedPrintTemplate, companyInfo: any) => {
    if (!template.settings.showCompanyInfo && !template.settings.showLogo) return '';
    
    const company = companyInfo || {
      name: 'شركة عُمران للتجارة',
      address: 'العنوان، المدينة، الدولة',
      phone: '+966123456789',
      email: 'info@omran.com'
    };

    return `
      <div class="header">
        ${template.settings.showLogo ? `
          <div class="logo-container">
            ${company.logo ? 
              `<img src="${company.logo}" alt="شعار الشركة" class="company-logo" />` :
              `<div class="company-name">${company.name}</div>`
            }
          </div>
        ` : ''}
        
        ${template.settings.showCompanyInfo ? `
          <div class="company-details">
            <div class="company-name">${company.name}</div>
            <div class="company-info">
              <div>${company.address}</div>
              <div>هاتف: ${company.phone} | بريد إلكتروني: ${company.email}</div>
              ${company.taxNumber ? `<div>الرقم الضريبي: ${company.taxNumber}</div>` : ''}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  };

  const generateContentHTML = (template: EnhancedPrintTemplate, data: any) => {
    // إنشاء محتوى مخصص حسب نوع المستند
    return `
      <div class="info-grid">
        <div class="info-section">
          <div class="section-title">معلومات المستند</div>
          <div class="info-row">
            <span class="label">الرقم:</span>
            <span class="value">${data.id || data.returnNumber || 'غير محدد'}</span>
          </div>
          <div class="info-row">
            <span class="label">التاريخ:</span>
            <span class="value">${new Date(data.date || Date.now()).toLocaleDateString('ar-SA')}</span>
          </div>
        </div>
        
        ${template.settings.showCustomerInfo && data.customerName ? `
          <div class="info-section">
            <div class="section-title">معلومات العميل</div>
            <div class="info-row">
              <span class="label">الاسم:</span>
              <span class="value">${data.customerName}</span>
            </div>
            ${data.customerPhone ? `
              <div class="info-row">
                <span class="label">الهاتف:</span>
                <span class="value">${data.customerPhone}</span>
              </div>
            ` : ''}
          </div>
        ` : ''}
      </div>
      
      ${template.settings.showItemDetails && data.items ? generateItemsTableHTML(template, data) : ''}
      
      ${template.settings.showTotals ? generateTotalsHTML(template, data) : ''}
      
      ${template.settings.showNotes && data.notes ? `
        <div class="notes-section">
          <div style="font-weight: bold; margin-bottom: 10px;">ملاحظات:</div>
          <div>${data.notes}</div>
        </div>
      ` : ''}
    `;
  };

  const generateItemsTableHTML = (template: EnhancedPrintTemplate, data: any) => {
    if (!data.items || data.items.length === 0) return '';
    
    return `
      <table class="items-table">
        <thead>
          <tr>
            <th>م</th>
            <th>المنتج</th>
            <th>الكمية</th>
            ${template.settings.showPrices ? '<th>السعر</th><th>المجموع</th>' : ''}
          </tr>
        </thead>
        <tbody>
          ${data.items.map((item: any, index: number) => `
            <tr>
              <td>${index + 1}</td>
              <td>${item.productName || item.name || 'منتج'}</td>
              <td>${item.quantity || 1}</td>
              ${template.settings.showPrices ? `
                <td>${(item.unitPrice || item.price || 0).toLocaleString()} ر.س</td>
                <td>${(item.total || (item.quantity * item.unitPrice) || 0).toLocaleString()} ر.س</td>
              ` : ''}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  };

  const generateTotalsHTML = (template: EnhancedPrintTemplate, data: any) => {
    return `
      <div class="totals-section">
        <div class="total-row">
          <span class="label">المجموع الفرعي:</span>
          <span class="value">${(data.subtotal || data.totalAmount || data.total || 0).toLocaleString()} ر.س</span>
        </div>
        
        ${data.discountAmount ? `
          <div class="total-row">
            <span class="label">الخصم:</span>
            <span class="value">-${data.discountAmount.toLocaleString()} ر.س</span>
          </div>
        ` : ''}
        
        ${data.taxAmount ? `
          <div class="total-row">
            <span class="label">الضريبة:</span>
            <span class="value">${data.taxAmount.toLocaleString()} ر.س</span>
          </div>
        ` : ''}
        
        <div class="final-total">
          المبلغ الإجمالي: ${(data.totalAmount || data.total || 0).toLocaleString()} ر.س
        </div>
      </div>
    `;
  };

  const generateFooterHTML = (template: EnhancedPrintTemplate, companyInfo: any) => {
    return `
      <div class="footer">
        <div class="custom-footer">${template.settings.customFooter}</div>
        <div style="font-size: ${template.settings.fontSize - 2}px; color: ${template.settings.secondaryColor};">
          تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')} - ${new Date().toLocaleTimeString('ar-SA')}
        </div>
      </div>
    `;
  };

  const generateSignaturesHTML = (template: EnhancedPrintTemplate) => {
    return `
      <div class="signatures">
        <div class="signature-box">
          <div class="signature-line">توقيع العميل</div>
        </div>
        <div class="signature-box">
          <div class="signature-line">توقيع المندوب</div>
        </div>
      </div>
    `;
  };

  const getDocumentTitle = (template: EnhancedPrintTemplate, data: any) => {
    switch (template.category) {
      case 'returns': return `قسيمة إرجاع رقم ${data.returnNumber || data.id}`;
      case 'reports': return `تقرير ${data.title || 'مفصل'}`;
      case 'purchase': return `فاتورة شراء رقم ${data.id}`;
      default: return `فاتورة مبيعات رقم ${data.id}`;
    }
  };

  // دوال مساعدة للألوان
  const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
      `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
      '0, 0, 0';
  };

  const adjustColor = (hex: string, amount: number): string => {
    const usePound = hex[0] === '#';
    const col = usePound ? hex.slice(1) : hex;
    const num = parseInt(col, 16);
    let r = (num >> 16) + amount;
    let g = (num >> 8 & 0x00FF) + amount;
    let b = (num & 0x0000FF) + amount;
    r = r > 255 ? 255 : r < 0 ? 0 : r;
    g = g > 255 ? 255 : g < 0 ? 0 : g;
    b = b > 255 ? 255 : b < 0 ? 0 : b;
    return (usePound ? '#' : '') + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
  };

  // معالجات الأحداث
  const handlePrint = () => {
    const printContent = generateEnhancedHTML(currentTemplate);
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // طباعة عدة نسخ إذا كان مطلوباً
      for (let i = 0; i < currentTemplate.settings.duplicateCount; i++) {
        setTimeout(() => {
          printWindow.print();
        }, i * 1000);
      }
      
      printWindow.onafterprint = () => printWindow.close();
    }
    
    onPrint?.(currentTemplate.id);
  };

  const handlePreview = () => {
    const printContent = generateEnhancedHTML(currentTemplate);
    const previewWindow = window.open('', '_blank');
    
    if (previewWindow) {
      previewWindow.document.write(printContent);
      previewWindow.document.close();
    }
  };

  const handleDownload = () => {
    const printContent = generateEnhancedHTML(currentTemplate);
    const blob = new Blob([printContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = `${currentTemplate.name}-${data.id || Date.now()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "تم التحميل",
      description: "تم تحميل المستند بنجاح",
    });
  };

  const saveCustomTemplate = () => {
    if (customTemplate) {
      const savedTemplates = JSON.parse(localStorage.getItem('custom_print_templates') || '[]');
      const templateToSave = {
        ...customTemplate,
        id: `custom-${Date.now()}`,
        name: `${customTemplate.name} (مخصص)`
      };
      
      savedTemplates.push(templateToSave);
      localStorage.setItem('custom_print_templates', JSON.stringify(savedTemplates));
      
      toast({
        title: "تم الحفظ",
        description: "تم حفظ القالب المخصص بنجاح",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Printer className="h-5 w-5" />
          قوالب الطباعة المحسّنة
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* اختيار القالب */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>اختر القالب</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{template.name}</span>
                      <span className="text-sm text-muted-foreground">{template.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-end gap-2">
            <Badge variant={currentTemplate.type === 'thermal' ? 'secondary' : 'default'}>
              {currentTemplate.type}
            </Badge>
            <Badge variant="outline">
              {currentTemplate.category}
            </Badge>
          </div>
        </div>

        {/* أزرار العمليات */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            طباعة
          </Button>
          
          <Button variant="outline" onClick={handlePreview} className="gap-2">
            <Eye className="h-4 w-4" />
            معاينة
          </Button>
          
          <Button variant="outline" onClick={handleDownload} className="gap-2">
            <Download className="h-4 w-4" />
            تحميل
          </Button>
          
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Settings className="h-4 w-4" />
                تخصيص القالب
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>تخصيص قالب الطباعة</DialogTitle>
              </DialogHeader>
              
              <Tabs defaultValue="content" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="content">المحتوى</TabsTrigger>
                  <TabsTrigger value="design">التصميم</TabsTrigger>
                  <TabsTrigger value="layout">التخطيط</TabsTrigger>
                  <TabsTrigger value="advanced">متقدم</TabsTrigger>
                </TabsList>
                
                <TabsContent value="content" className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        العناصر المرئية
                      </h4>
                      
                      {Object.entries({
                        showLogo: 'عرض الشعار',
                        showCompanyInfo: 'معلومات الشركة',
                        showCustomerInfo: 'معلومات العميل',
                        showItemDetails: 'تفاصيل الأصناف',
                        showPrices: 'عرض الأسعار',
                        showTotals: 'الإجماليات',
                        showNotes: 'الملاحظات',
                        showFooter: 'التذييل'
                      }).map(([key, label]) => (
                        <div key={key} className="flex items-center justify-between p-3 border rounded">
                          <Label className="font-medium">{label}</Label>
                          <Switch
                            checked={currentTemplate.settings[key as keyof typeof currentTemplate.settings] as boolean}
                            onCheckedChange={(checked) => updateTemplateSetting(key, checked)}
                          />
                        </div>
                      ))}
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-medium">التذييل المخصص</h4>
                      <Textarea
                        placeholder="نص التذييل المخصص..."
                        value={currentTemplate.settings.customFooter}
                        onChange={(e) => updateTemplateSetting('customFooter', e.target.value)}
                      />
                      
                      <div>
                        <Label>موضع التذييل</Label>
                        <Select
                          value={currentTemplate.settings.footerPosition}
                          onValueChange={(value) => updateTemplateSetting('footerPosition', value)}
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
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="design" className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        الألوان والخطوط
                      </h4>
                      
                      <div className="grid gap-3">
                        <div>
                          <Label>اللون الأساسي</Label>
                          <Input
                            type="color"
                            value={currentTemplate.settings.primaryColor}
                            onChange={(e) => updateTemplateSetting('primaryColor', e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <Label>اللون الثانوي</Label>
                          <Input
                            type="color"
                            value={currentTemplate.settings.secondaryColor}
                            onChange={(e) => updateTemplateSetting('secondaryColor', e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <Label>لون الخلفية</Label>
                          <Input
                            type="color"
                            value={currentTemplate.settings.headerBackgroundColor}
                            onChange={(e) => updateTemplateSetting('headerBackgroundColor', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <Type className="h-4 w-4" />
                        الخط والحجم
                      </h4>
                      
                      <div>
                        <Label>حجم الخط</Label>
                        <Input
                          type="number"
                          min="8"
                          max="24"
                          value={currentTemplate.settings.fontSize}
                          onChange={(e) => updateTemplateSetting('fontSize', parseInt(e.target.value))}
                        />
                      </div>
                      
                      <div>
                        <Label>نوع الخط</Label>
                        <Select
                          value={currentTemplate.settings.fontFamily}
                          onValueChange={(value) => updateTemplateSetting('fontFamily', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Arial">Arial</SelectItem>
                            <SelectItem value="Tahoma">Tahoma</SelectItem>
                            <SelectItem value="Verdana">Verdana</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="layout" className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <Layout className="h-4 w-4" />
                        تخطيط الصفحة
                      </h4>
                      
                      <div>
                        <Label>حجم الورق</Label>
                        <Select
                          value={currentTemplate.settings.paperSize}
                          onValueChange={(value) => updateTemplateSetting('paperSize', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A4">A4</SelectItem>
                            <SelectItem value="58mm">58mm</SelectItem>
                            <SelectItem value="80mm">80mm</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>اتجاه الصفحة</Label>
                        <Select
                          value={currentTemplate.settings.orientation}
                          onValueChange={(value) => updateTemplateSetting('orientation', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="portrait">عمودي</SelectItem>
                            <SelectItem value="landscape">أفقي</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-medium">الهوامش (مم)</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>أعلى</Label>
                          <Input
                            type="number"
                            value={currentTemplate.settings.margins.top}
                            onChange={(e) => updateTemplateSetting('margins', {
                              ...currentTemplate.settings.margins,
                              top: parseInt(e.target.value)
                            })}
                          />
                        </div>
                        <div>
                          <Label>أسفل</Label>
                          <Input
                            type="number"
                            value={currentTemplate.settings.margins.bottom}
                            onChange={(e) => updateTemplateSetting('margins', {
                              ...currentTemplate.settings.margins,
                              bottom: parseInt(e.target.value)
                            })}
                          />
                        </div>
                        <div>
                          <Label>يسار</Label>
                          <Input
                            type="number"
                            value={currentTemplate.settings.margins.left}
                            onChange={(e) => updateTemplateSetting('margins', {
                              ...currentTemplate.settings.margins,
                              left: parseInt(e.target.value)
                            })}
                          />
                        </div>
                        <div>
                          <Label>يمين</Label>
                          <Input
                            type="number"
                            value={currentTemplate.settings.margins.right}
                            onChange={(e) => updateTemplateSetting('margins', {
                              ...currentTemplate.settings.margins,
                              right: parseInt(e.target.value)
                            })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="advanced" className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-4">
                      <h4 className="font-medium">إعدادات متقدمة</h4>
                      
                      <div className="flex items-center justify-between p-3 border rounded">
                        <Label>علامة مائية</Label>
                        <Switch
                          checked={currentTemplate.settings.watermark}
                          onCheckedChange={(checked) => updateTemplateSetting('watermark', checked)}
                        />
                      </div>
                      
                      {currentTemplate.settings.watermark && (
                        <div>
                          <Label>نص العلامة المائية</Label>
                          <Input
                            value={currentTemplate.settings.watermarkText}
                            onChange={(e) => updateTemplateSetting('watermarkText', e.target.value)}
                          />
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between p-3 border rounded">
                        <Label>أرقام الصفحات</Label>
                        <Switch
                          checked={currentTemplate.settings.showPageNumbers}
                          onCheckedChange={(checked) => updateTemplateSetting('showPageNumbers', checked)}
                        />
                      </div>
                      
                      <div>
                        <Label>عدد النسخ</Label>
                        <Input
                          type="number"
                          min="1"
                          max="5"
                          value={currentTemplate.settings.duplicateCount}
                          onChange={(e) => updateTemplateSetting('duplicateCount', parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        إعدادات الشعار
                      </h4>
                      
                      <div>
                        <Label>موضع الشعار</Label>
                        <Select
                          value={currentTemplate.settings.logoPosition}
                          onValueChange={(value) => updateTemplateSetting('logoPosition', value)}
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
                          value={currentTemplate.settings.logoSize}
                          onValueChange={(value) => updateTemplateSetting('logoSize', value)}
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
                  </div>
                </TabsContent>
              </Tabs>
              
              <Separator />
              
              <div className="flex justify-between gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setCustomTemplate(null)}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  إعادة تعيين
                </Button>
                
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={saveCustomTemplate}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    حفظ كقالب
                  </Button>
                  
                  <Button onClick={handlePreview} className="gap-2">
                    <Eye className="h-4 w-4" />
                    معاينة التغييرات
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}