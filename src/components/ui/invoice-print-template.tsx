/**
 * نظام قوالب طباعة الفواتير المتقدم
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer, FileText, Eye, Share } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useInvoiceExport } from '@/hooks/useInvoiceExport';
import { InvoiceShareDialog } from '@/components/invoice/InvoiceShareDialog';
import { useCompanyLogoSupabase } from '@/hooks/useCompanyLogoSupabase';

export interface PrintTemplate {
  id: string;
  name: string;
  description: string;
  type: 'standard' | 'thermal' | 'a4' | 'receipt';
  settings: {
    showLogo: boolean;
    showCompanyInfo: boolean;
    showCustomerInfo: boolean;
    showItemDetails: boolean;
    showPrices: boolean;
    showTotals: boolean;
    showNotes: boolean;
    showFooter: boolean;
    fontSize: number;
    paperSize: string;
    margins: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
    // إعدادات إضافية جديدة
    customTitle?: string;
    customFooter?: string;
    showTimestamp?: boolean;
    showBarcode?: boolean;
    showQRCode?: boolean;
    colorScheme?: 'default' | 'green' | 'red' | 'purple' | 'orange' | 'monochrome';
  };
}

export interface InvoicePrintData {
  id: string;
  customerName: string;
  customerPhone?: string;
  date: string;
  items: any[];
  itemsDetails?: any[]; // إضافة دعم للفواتير القديمة
  total: number;
  subtotal: number;
  taxAmount?: number;
  discountAmount?: number;
  notes?: string;
  paymentMethod?: string;
  status?: string;
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    taxNumber?: string;
  };
}

const defaultTemplates: PrintTemplate[] = [
  {
    id: 'standard',
    name: 'قالب قياسي',
    description: 'قالب طباعة قياسي مناسب لجميع الاستخدامات',
    type: 'standard',
    settings: {
      showLogo: true,
      showCompanyInfo: true,
      showCustomerInfo: true,
      showItemDetails: true,
      showPrices: true,
      showTotals: true,
      showNotes: true,
      showFooter: true,
      fontSize: 14,
      paperSize: 'A4',
      margins: { top: 20, bottom: 20, left: 20, right: 20 }
    }
  },
  {
    id: 'thermal',
    name: 'طابعة حرارية',
    description: 'قالب مخصص للطابعات الحرارية الصغيرة',
    type: 'thermal',
    settings: {
      showLogo: false,
      showCompanyInfo: true,
      showCustomerInfo: false,
      showItemDetails: true,
      showPrices: true,
      showTotals: true,
      showNotes: false,
      showFooter: false,
      fontSize: 12,
      paperSize: '58mm',
      margins: { top: 5, bottom: 5, left: 5, right: 5 }
    }
  },
  {
    id: 'receipt',
    name: 'إيصال بسيط',
    description: 'إيصال بسيط للعمليات السريعة',
    type: 'receipt',
    settings: {
      showLogo: false,
      showCompanyInfo: false,
      showCustomerInfo: false,
      showItemDetails: false,
      showPrices: true,
      showTotals: true,
      showNotes: false,
      showFooter: false,
      fontSize: 12,
      paperSize: '80mm',
      margins: { top: 10, bottom: 10, left: 10, right: 10 }
    }
  },
  {
    id: 'detailed',
    name: 'تفصيلي',
    description: 'قالب مفصل يعرض جميع المعلومات',
    type: 'a4',
    settings: {
      showLogo: true,
      showCompanyInfo: true,
      showCustomerInfo: true,
      showItemDetails: true,
      showPrices: true,
      showTotals: true,
      showNotes: true,
      showFooter: true,
      fontSize: 12,
      paperSize: 'A4',
      margins: { top: 30, bottom: 30, left: 25, right: 25 }
    }
  }
];

interface InvoicePrintTemplateProps {
  invoiceData: InvoicePrintData;
  onPrint?: (templateId: string) => void;
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    taxNumber?: string;
    logo?: string;
  };
}

export function InvoicePrintTemplate({ 
  invoiceData, 
  onPrint,
  companyInfo
}: InvoicePrintTemplateProps) {
  const { toast } = useToast();
  const { exportInvoiceToPDF } = useInvoiceExport();
  const [selectedTemplate, setSelectedTemplate] = React.useState<string>('standard');
  const [previewMode, setPreviewMode] = React.useState(false);
  const { currentLogo } = useCompanyLogoSupabase();

  // تحديث البيانات عند تغيير إعدادات الشركة
  
  // جلب بيانات الشركة من الإعدادات
  const getCompanyInfo = (): {
    name: string;
    address: string;
    phone: string;
    email: string;
    taxNumber?: string;
    website?: string;
    description?: string;
    logo?: string;
  } => {
    try {
      const savedCompanySettings = localStorage.getItem('company_settings');
      if (savedCompanySettings) {
        const companySettings = JSON.parse(savedCompanySettings);
        return {
          name: companySettings.nameAr || companySettings.name || 'شركة عمران للمبيعات',
          address: companySettings.address || 'العنوان، المدينة، الدولة',
          phone: companySettings.phone || '+20123456789',
          email: companySettings.email || 'info@omran.com',
          taxNumber: companySettings.taxNumber || '123456789',
          website: companySettings.website || '',
          description: companySettings.description || '',
          logo: companySettings.logo || currentLogo || undefined
        };
      }
    } catch (error) {
      console.error('Error loading company settings:', error);
    }
    
    // القيم الافتراضية في حالة عدم وجود إعدادات محفوظة
    return companyInfo || {
      name: 'شركة عمران للمبيعات',
      address: 'العنوان، المدينة، الدولة',
      phone: '+20123456789',
      email: 'info@omran.com',
      taxNumber: '123456789'
    };
  };

  const currentCompanyInfo = getCompanyInfo();

  const baseTemplate = defaultTemplates.find(t => t.id === selectedTemplate) || defaultTemplates[0];
  const currentTemplate = baseTemplate;

  const generatePrintHTML = (template: PrintTemplate): string => {
    const { settings } = template;
    
    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>فاتورة ${invoiceData.id}</title>
        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          
          :root {
            ${(() => {
              const colorScheme = settings.colorScheme || 'default';
              switch (colorScheme) {
                case 'green':
                  return `
                    --primary-color: #16a34a;
                    --primary-light: #dcfce7;
                    --primary-dark: #15803d;
                    --gradient: linear-gradient(135deg, #16a34a, #15803d);
                  `;
                case 'red':
                  return `
                    --primary-color: #dc2626;
                    --primary-light: #fee2e2;
                    --primary-dark: #b91c1c;
                    --gradient: linear-gradient(135deg, #dc2626, #b91c1c);
                  `;
                case 'purple':
                  return `
                    --primary-color: #9333ea;
                    --primary-light: #f3e8ff;
                    --primary-dark: #7c3aed;
                    --gradient: linear-gradient(135deg, #9333ea, #7c3aed);
                  `;
                case 'orange':
                  return `
                    --primary-color: #ea580c;
                    --primary-light: #fed7aa;
                    --primary-dark: #c2410c;
                    --gradient: linear-gradient(135deg, #ea580c, #c2410c);
                  `;
                case 'monochrome':
                  return `
                    --primary-color: #374151;
                    --primary-light: #f9fafb;
                    --primary-dark: #111827;
                    --gradient: linear-gradient(135deg, #374151, #111827);
                  `;
                default:
                  return `
                    --primary-color: #2563eb;
                    --primary-light: #f0f8ff;
                    --primary-dark: #1d4ed8;
                    --gradient: linear-gradient(135deg, #2563eb, #1d4ed8);
                  `;
              }
            })()}
          }
          
          @page {
            size: A4;
            margin: 10mm;
          }
          
          body {
            font-family: 'Cairo', 'IBM Plex Sans Arabic', 'Arial', 'Tahoma', sans-serif;
            font-size: ${Math.max(settings.fontSize - 2, 10)}px;
            line-height: 1.4;
            color: #1e293b;
            direction: rtl;
            background: white;
            margin: 0;
            padding: 0;
            height: 100vh;
            overflow: hidden;
          }
          
          .invoice-container {
            width: 100%;
            max-width: 100%;
            background: white;
            padding: 0;
            margin: 0;
            box-sizing: border-box;
          }
          
          .header {
            display: grid;
            grid-template-columns: ${currentCompanyInfo.logo ? 'auto 1fr auto' : '1fr auto 1fr'};
            align-items: center;
            gap: 15px;
            margin-bottom: 15px;
            padding: 15px;
            background: linear-gradient(135deg, var(--primary-light), white);
            border: 2px solid var(--primary-color);
            border-radius: 12px;
            position: relative;
            flex-shrink: 0;
          }
          
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: var(--gradient);
            border-radius: 12px 12px 0 0;
          }
          
          .company-info {
            text-align: right;
            font-size: ${Math.max(settings.fontSize - 3, 9)}px;
          }
          
          .company-logo {
            max-width: 80px;
            max-height: 60px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          
          .company-name {
            font-size: ${Math.max(settings.fontSize + 2, 12)}px;
            font-weight: bold;
            color: var(--primary-color);
            margin-bottom: 8px;
          }
          
          .invoice-title-section {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
          }

          .invoice-title {
            text-align: center;
            font-size: ${Math.max(settings.fontSize + 4, 14)}px;
            font-weight: 700;
            color: white;
            background: var(--gradient);
            padding: 12px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
          }

          .invoice-logo {
            max-width: 40px;
            max-height: 40px;
            border-radius: 6px;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
            border: 2px solid var(--primary-color);
          }
          
          .main-content {
            flex: 1;
            display: grid;
            grid-template-rows: auto 1fr auto;
            gap: 12px;
            min-height: 0;
          }
          
          .invoice-details {
            display: grid;
            grid-template-columns: ${settings.showCustomerInfo ? '1fr 1fr' : '1fr'};
            gap: 12px;
            flex-shrink: 0;
          }
          
          .detail-section {
            background: linear-gradient(135deg, var(--primary-light), white);
            border: 1px solid var(--primary-color);
            border-radius: 8px;
            padding: 12px;
            box-shadow: 0 2px 8px rgba(37, 99, 235, 0.1);
          }
          
          .detail-title {
            font-weight: bold;
            font-size: ${Math.max(settings.fontSize, 11)}px;
            color: var(--primary-dark);
            margin-bottom: 8px;
            border-bottom: 1px solid var(--primary-color);
            padding-bottom: 4px;
          }
          
          .detail-item {
            margin-bottom: 4px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: ${Math.max(settings.fontSize - 2, 9)}px;
          }
          
          .detail-label {
            font-weight: 600;
            color: #475569;
            min-width: 80px;
          }
          
          .detail-value {
            color: #1e293b;
            font-weight: 500;
          }
          
          .items-section {
            flex: 1;
            min-height: 0;
            display: flex;
            flex-direction: column;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            border: 1px solid var(--primary-color);
            flex: 1;
            height: 100%;
          }
          
          .items-table th {
            background: var(--gradient);
            color: white;
            font-weight: 700;
            padding: 8px 6px;
            text-align: center;
            font-size: ${Math.max(settings.fontSize - 1, 10)}px;
            text-shadow: 0 1px 2px rgba(0,0,0,0.1);
            white-space: nowrap;
          }
          
          .items-table td {
            padding: 6px 4px;
            text-align: center;
            border-bottom: 1px solid #e2e8f0;
            font-size: ${Math.max(settings.fontSize - 2, 9)}px;
            vertical-align: middle;
          }
          
          .items-table tbody tr:nth-child(even) {
            background-color: #f8fafc;
          }
          
          .items-table tbody tr:hover {
            background-color: var(--primary-light);
          }
          
          .totals-section {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 20px;
            margin-top: 12px;
            flex-shrink: 0;
          }
          
          .notes-section {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px;
          }
          
          .notes-title {
            font-weight: bold;
            color: var(--primary-dark);
            margin-bottom: 6px;
            font-size: ${Math.max(settings.fontSize - 1, 10)}px;
          }
          
          .notes-content {
            font-size: ${Math.max(settings.fontSize - 2, 9)}px;
            color: #475569;
            line-height: 1.4;
          }
          
          .totals-box {
            background: linear-gradient(135deg, var(--primary-light), white);
            border: 2px solid var(--primary-color);
            border-radius: 10px;
            padding: 15px;
            min-width: 250px;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);
          }
          
          .totals-title {
            font-size: ${Math.max(settings.fontSize, 11)}px;
            font-weight: bold;
            color: var(--primary-dark);
            text-align: center;
            margin-bottom: 10px;
            border-bottom: 2px solid var(--primary-color);
            padding-bottom: 6px;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
            font-size: ${Math.max(settings.fontSize - 1, 10)}px;
          }
          
          .total-row.final {
            font-size: ${Math.max(settings.fontSize + 1, 12)}px;
            font-weight: bold;
            color: var(--primary-color);
            border-top: 2px solid var(--primary-color);
            padding-top: 8px;
            margin-top: 8px;
          }
          
          .footer {
            text-align: center;
            margin-top: 12px;
            padding: 10px;
            background: linear-gradient(135deg, #f8fafc, white);
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            font-size: ${Math.max(settings.fontSize - 3, 8)}px;
            color: #64748b;
            flex-shrink: 0;
          }
          
          @media print {
            body { 
              margin: 0; 
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .invoice-container { 
              height: 100vh;
              page-break-inside: avoid;
            }
            .items-table {
              page-break-inside: avoid;
            }
            .no-print { 
              display: none; 
            }
          }
        </style>
      </head>
          
          .invoice-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 6px;
            background: var(--gradient);
            border-radius: 20px 20px 0 0;
          }
          
          .header {
            text-align: center;
            margin-bottom: 15px;
            background: linear-gradient(135deg, var(--primary-light), white);
            border-radius: 10px;
            padding: 15px;
            border: 2px solid var(--primary-color);
            position: relative;
            flex-shrink: 0;
          }
          
          .header::after {
            content: '';
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 60px;
            height: 4px;
            background: var(--gradient);
            border-radius: 2px;
          }
          
          .company-logo {
            max-width: 180px;
            max-height: 100px;
            margin-bottom: 20px;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease;
          }
          
          .company-logo:hover {
            transform: scale(1.05);
          }
          
          .company-name {
            font-size: ${settings.fontSize + 6}px;
            font-weight: bold;
            color: var(--primary-color);
            margin-bottom: 10px;
          }
          
          .company-info {
            font-size: ${settings.fontSize - 2}px;
            color: #666;
            line-height: 1.4;
          }
          
          .invoice-title {
            font-size: ${settings.fontSize + 6}px;
            font-weight: 700;
            color: white;
            margin: 10px 0;
            text-align: center;
            background: var(--gradient);
            padding: 15px;
            border-radius: 10px;
            border: 2px solid var(--primary-color);
            box-shadow: 0 5px 15px rgba(37, 99, 235, 0.3);
            position: relative;
            overflow: hidden;
            flex-shrink: 0;
          }
          
          .invoice-title::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            animation: shimmer 2s infinite;
          }
          
          @keyframes shimmer {
            0% { left: -100%; }
            100% { left: 100%; }
          }
          
          .invoice-details {
            display: grid;
            grid-template-columns: ${settings.showCustomerInfo ? '1fr 1fr' : '1fr'};
            gap: 10px;
            margin-bottom: 15px;
            flex-shrink: 0;
          }
          
          .detail-section {
            background: linear-gradient(135deg, var(--primary-light), white);
            border: 1px solid var(--primary-color);
            border-radius: 8px;
            padding: 12px;
            box-shadow: 0 2px 8px rgba(37, 99, 235, 0.1);
            position: relative;
          }
          
          .detail-section:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 40px rgba(37, 99, 235, 0.15);
          }
          
          .detail-section::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: var(--gradient);
            border-radius: 15px 15px 0 0;
          }
          
          .detail-title {
            font-weight: bold;
            font-size: ${settings.fontSize + 2}px;
            color: var(--primary-dark);
            margin-bottom: 15px;
            border-bottom: 2px solid var(--primary-color);
            padding-bottom: 8px;
          }
          
          .detail-item {
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .detail-label {
            font-weight: 600;
            color: #475569;
            min-width: 100px;
          }
          
          .detail-value {
            color: #1e293b;
            font-weight: 500;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            border: 1px solid var(--primary-color);
            flex: 1;
            min-height: 0;
          }
          
          .items-table th {
            background: var(--gradient);
            color: white;
            font-weight: 700;
            padding: 8px 6px;
            text-align: center;
            font-size: ${settings.fontSize}px;
            text-shadow: 0 1px 2px rgba(0,0,0,0.1);
            position: relative;
          }
          
          .items-table th::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: rgba(255,255,255,0.3);
          }
          
          .items-table td {
            padding: 18px 15px;
            text-align: center;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: middle;
            font-weight: 500;
            transition: background-color 0.3s ease;
          }
          
          .items-table tr:nth-child(even) {
            background-color: var(--primary-light);
          }
          
          .items-table tr:hover {
            background-color: #f1f5f9;
          }
          
          .totals-section {
            margin: 40px auto 0 auto;
            width: 100%;
            max-width: 450px;
            background: linear-gradient(135deg, var(--primary-light), white);
            border: 3px solid var(--primary-color);
            border-radius: 20px;
            padding: 35px;
            box-shadow: 0 20px 60px rgba(37, 99, 235, 0.2);
            position: relative;
            overflow: hidden;
          }
          
          .totals-section::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 6px;
            background: var(--gradient);
            border-radius: 20px 20px 0 0;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          
          .total-label {
            font-weight: 600;
            color: #475569;
          }
          
          .total-value {
            font-weight: bold;
            color: #1e293b;
          }
          
          .final-total {
            background: var(--gradient);
            color: white;
            padding: 25px;
            margin: 25px -35px -35px -35px;
            border-radius: 0 0 17px 17px;
            font-size: ${settings.fontSize + 6}px;
            font-weight: 700;
            text-align: center;
            box-shadow: 0 10px 30px rgba(37, 99, 235, 0.3);
            position: relative;
            overflow: hidden;
          }
          
          .final-total::before {
            content: '💰';
            position: absolute;
            left: 20px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 24px;
            opacity: 0.7;
          }
          
          .notes-section {
            margin: 30px 0;
            background: #fffbeb;
            border: 2px solid #f59e0b;
            border-radius: 10px;
            padding: 20px;
          }
          
          .notes-title {
            font-weight: bold;
            color: #92400e;
            margin-bottom: 10px;
            font-size: ${settings.fontSize + 2}px;
          }
          
          .notes-content {
            color: #78350f;
            line-height: 1.6;
          }
          
          .footer {
            margin-top: 50px;
            text-align: center;
            padding: 30px;
            background: linear-gradient(135deg, var(--primary-light), white);
            border-radius: 15px;
            border: 2px solid var(--primary-color);
            box-shadow: 0 10px 30px rgba(37, 99, 235, 0.1);
            position: relative;
          }
          
          .footer::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: var(--gradient);
            border-radius: 15px 15px 0 0;
          }
          
          .thank-you {
            font-size: ${settings.fontSize + 6}px;
            font-weight: 700;
            color: var(--primary-color);
            margin-bottom: 20px;
            text-shadow: 0 2px 4px rgba(37, 99, 235, 0.1);
          }
          
          .thank-you::before {
            content: '🙏 ';
            margin-left: 10px;
          }
          
          .footer-info {
            font-size: ${settings.fontSize - 2}px;
            color: #64748b;
            line-height: 1.4;
          }
          
          .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 120px;
            color: rgba(37, 99, 235, 0.05);
            font-weight: bold;
            z-index: -1;
            pointer-events: none;
          }
          
          .qr-code, .barcode {
            margin: 30px auto;
            text-align: center;
          }
          
          .code-container {
            display: inline-block;
            padding: 20px;
            border: 3px dashed var(--primary-color);
            border-radius: 15px;
            background: linear-gradient(135deg, var(--primary-light), white);
            box-shadow: 0 10px 30px rgba(37, 99, 235, 0.1);
            transition: transform 0.3s ease;
          }
          
          .code-container:hover {
            transform: scale(1.05);
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
            
            .invoice-container {
              box-shadow: none;
            }
            
            @page {
              size: ${settings.paperSize === 'A4' ? 'A4' : settings.paperSize};
              margin: ${settings.margins.top}mm ${settings.margins.right}mm ${settings.margins.bottom}mm ${settings.margins.left}mm;
            }
          }
          
          /* Thermal printer specific styles */
          ${template.type === 'thermal' ? `
            body { 
              width: 58mm; 
              font-size: 10px;
              margin: 2mm;
              background: white;
            }
            .invoice-container {
              padding: 5mm;
              background: white;
            }
            .invoice-details { 
              grid-template-columns: 1fr;
              gap: 8px;
            }
            .detail-section { 
              padding: 8px; 
              margin-bottom: 8px;
              background: #f9f9f9;
              border: 1px solid #ddd;
            }
            .detail-title {
              font-size: 11px;
              margin-bottom: 6px;
            }
            .items-table {
              font-size: 9px;
              margin: 10px 0;
            }
            .items-table th, .items-table td { 
              padding: 4px 2px; 
              font-size: 9px;
            }
            .totals-section { 
              max-width: 100%; 
              padding: 10px;
              margin: 10px 0;
            }
            .header { 
              margin-bottom: 10px; 
              padding-bottom: 8px;
            }
            .company-name {
              font-size: 12px;
            }
            .company-info {
              font-size: 8px;
            }
            .invoice-title {
              font-size: 11px;
              padding: 8px;
            }
            .final-total {
              font-size: 11px;
              padding: 8px;
            }
          ` : ''}
          
          /* Receipt printer specific styles */
          ${template.type === 'receipt' ? `
            body { 
              width: 80mm; 
              font-size: 11px;
              margin: 3mm;
              background: white;
            }
            .invoice-container {
              padding: 5mm;
            }
            .invoice-details {
              grid-template-columns: 1fr;
              gap: 10px;
            }
            .detail-section {
              padding: 12px;
              background: #f8f9fa;
              border: 1px solid #e9ecef;
            }
            .invoice-title { 
              font-size: 14px; 
              margin: 8px 0;
              padding: 10px;
            }
            .items-table {
              font-size: 10px;
            }
            .items-table th, .items-table td { 
              padding: 6px 4px;
              font-size: 10px;
            }
            .company-name {
              font-size: 16px;
            }
            .company-info {
              font-size: 10px;
            }
            .totals-section {
              max-width: 100%;
              padding: 15px;
            }
            .final-total {
              font-size: 13px;
            }
          ` : ''}
          
          /* A4 detailed template styles */
          ${template.type === 'a4' ? `
            body {
              font-size: ${settings.fontSize}px;
              margin: ${settings.margins.top}mm ${settings.margins.right}mm ${settings.margins.bottom}mm ${settings.margins.left}mm;
            }
            .invoice-container {
              max-width: 210mm;
              padding: 20mm;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
              margin-bottom: 40px;
              padding-bottom: 25px;
            }
            .company-name {
              font-size: ${settings.fontSize + 8}px;
            }
            .invoice-title {
              font-size: ${settings.fontSize + 10}px;
              padding: 20px;
              margin: 25px 0;
            }
            .detail-section {
              padding: 25px;
            }
            .items-table th, .items-table td {
              padding: 15px 12px;
            }
            .totals-section {
              padding: 30px;
              margin: 40px auto;
              max-width: 500px;
            }
            .final-total {
              font-size: ${settings.fontSize + 6}px;
              padding: 20px;
            }
          ` : ''}
        </style>
      </head>
      <body>
        <div class="watermark">فاتورة</div>
        <div class="invoice-container">
          ${settings.showLogo && currentCompanyInfo.logo ? `
            <div class="header">
              <img src="${currentCompanyInfo.logo}" alt="شعار الشركة" class="company-logo" 
                   style="max-width: 120px; max-height: 80px; float: right; margin-bottom: 15px;"
                   onerror="this.style.display='none'" />
            </div>
          ` : ''}
          
          ${settings.showCompanyInfo ? `
            <div class="header">
              <div class="company-name">${currentCompanyInfo.name}</div>
              <div class="company-info">
                <div>${currentCompanyInfo.address}</div>
                <div>هاتف: ${currentCompanyInfo.phone} | بريد إلكتروني: ${currentCompanyInfo.email}</div>
                ${currentCompanyInfo.taxNumber ? `<div>الرقم الضريبي: ${currentCompanyInfo.taxNumber}</div>` : ''}
                ${currentCompanyInfo.website ? `<div>الموقع الإلكتروني: ${currentCompanyInfo.website}</div>` : ''}
              </div>
            </div>
          ` : ''}
          
          <div class="invoice-title-section">
          ${settings.showLogo && currentCompanyInfo.logo ? `
            <img src="${currentCompanyInfo.logo}" alt="شعار الشركة" class="invoice-logo" 
                 onerror="this.style.display='none'" />
          ` : ''}
            <div class="invoice-title">
              ${settings.customTitle || `فاتورة مبيعات رقم ${invoiceData.id}`}
            </div>
          </div>
          
          <div class="invoice-details">
            <div class="detail-section">
              <div class="detail-title">معلومات الفاتورة</div>
              <div class="detail-item">
                <span class="detail-label">رقم الفاتورة:</span>
                <span class="detail-value">${invoiceData.id}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">تاريخ الإصدار:</span>
                <span class="detail-value">${new Date(invoiceData.date).toLocaleDateString('ar-EG')}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">وقت الإصدار:</span>
                <span class="detail-value">${new Date().toLocaleTimeString('ar-EG')}</span>
              </div>
              ${invoiceData.paymentMethod ? `
                <div class="detail-item">
                  <span class="detail-label">طريقة الدفع:</span>
                  <span class="detail-value">${invoiceData.paymentMethod}</span>
                </div>
              ` : ''}
              ${invoiceData.status ? `
                <div class="detail-item">
                  <span class="detail-label">حالة الفاتورة:</span>
                  <span class="detail-value">${invoiceData.status === 'paid' ? 'مدفوعة' : invoiceData.status === 'pending' ? 'معلقة' : invoiceData.status === 'draft' ? 'مسودة' : invoiceData.status}</span>
                </div>
              ` : ''}
            </div>
            
            ${settings.showCustomerInfo ? `
              <div class="detail-section">
                <div class="detail-title">معلومات العميل</div>
                <div class="detail-item">
                  <span class="detail-label">اسم العميل:</span>
                  <span class="detail-value">${invoiceData.customerName}</span>
                </div>
                ${invoiceData.customerPhone ? `
                  <div class="detail-item">
                    <span class="detail-label">رقم الهاتف:</span>
                    <span class="detail-value">${invoiceData.customerPhone}</span>
                  </div>
                ` : ''}
              </div>
            ` : ''}
          </div>
          
          ${settings.showItemDetails && invoiceData.items && invoiceData.items.length > 0 ? `
            <table class="items-table">
              <thead>
                <tr>
                  <th>م</th>
                  <th>اسم المنتج</th>
                  <th>الكمية</th>
                  ${settings.showPrices ? '<th>السعر</th>' : ''}
                  ${settings.showPrices ? '<th>الإجمالي</th>' : ''}
                </tr>
              </thead>
              <tbody>
                ${invoiceData.items.map((item: any, index: number) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${item.product_name || item.productName || item.name || 'منتج غير محدد'}</td>
                    <td>${item.quantity || 1}</td>
                    ${settings.showPrices ? `<td>${(item.unit_price || item.price || 0).toLocaleString()} ج.م</td>` : ''}
                    ${settings.showPrices ? `<td>${(item.total_price || item.total || (item.quantity * (item.unit_price || item.price)) || 0).toLocaleString()} ج.م</td>` : ''}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}
          
          ${settings.showTotals ? `
            <div class="totals-section">
              ${invoiceData.discountAmount && invoiceData.discountAmount > 0 ? `
                <div class="total-row">
                  <span class="total-label">الخصم:</span>
                  <span class="total-value">-${(invoiceData.discountAmount || 0).toLocaleString()} ج.م</span>
                </div>
              ` : ''}
              
              ${invoiceData.taxAmount && invoiceData.taxAmount > 0 ? `
                <div class="total-row">
                  <span class="total-label">الضريبة:</span>
                  <span class="total-value">${(invoiceData.taxAmount || 0).toLocaleString()} ج.م</span>
                </div>
              ` : ''}
              
              <div class="final-total">
                المبلغ الإجمالي: ${(invoiceData.total || 0).toLocaleString()} ج.م
              </div>
            </div>
          ` : ''}
          
          ${settings.showNotes && invoiceData.notes ? `
            <div class="notes-section">
              <div class="notes-title">ملاحظات:</div>
              <div class="notes-content">${invoiceData.notes}</div>
            </div>
          ` : ''}
          
          ${(settings.showBarcode || currentTemplate.settings.showBarcode) ? `
            <div class="barcode">
              <div class="code-container">
                <div style="font-family: 'Courier New', monospace; font-size: 24px; letter-spacing: 2px; text-align: center; padding: 15px; border: 2px solid var(--primary-color); background: white; min-height: 60px; display: flex; align-items: center; justify-content: center;">
                  |||| | ||| |||| | ||||| || ||| |||||
                </div>
                <div style="text-align: center; font-size: 12px; color: #666; margin-top: 5px; font-weight: bold;">
                  باركود الفاتورة: ${invoiceData.id}
                </div>
              </div>
            </div>
          ` : ''}
          
          ${(settings.showQRCode || currentTemplate.settings.showQRCode) ? `
            <div class="qr-code">
              <div class="code-container">
                <div style="
                  width: 120px; 
                  height: 120px; 
                  margin: 0 auto; 
                  border: 2px solid var(--primary-color); 
                  background: white;
                  background-image: url('data:image/svg+xml;charset=utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="0" y="0" width="15" height="15" fill="%23000"/><rect x="20" y="0" width="15" height="15" fill="%23000"/><rect x="40" y="0" width="15" height="15" fill="%23000"/><rect x="60" y="0" width="15" height="15" fill="%23000"/><rect x="80" y="0" width="15" height="15" fill="%23000"/><rect x="0" y="20" width="15" height="15" fill="%23000"/><rect x="80" y="20" width="15" height="15" fill="%23000"/><rect x="0" y="40" width="15" height="15" fill="%23000"/><rect x="20" y="40" width="15" height="15" fill="%23000"/><rect x="40" y="40" width="15" height="15" fill="%23000"/><rect x="60" y="40" width="15" height="15" fill="%23000"/><rect x="80" y="40" width="15" height="15" fill="%23000"/><rect x="0" y="60" width="15" height="15" fill="%23000"/><rect x="80" y="60" width="15" height="15" fill="%23000"/><rect x="0" y="80" width="15" height="15" fill="%23000"/><rect x="20" y="80" width="15" height="15" fill="%23000"/><rect x="40" y="80" width="15" height="15" fill="%23000"/><rect x="60" y="80" width="15" height="15" fill="%23000"/><rect x="80" y="80" width="15" height="15" fill="%23000"/></svg>');
                  background-size: 80%;
                  background-repeat: no-repeat;
                  background-position: center;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 10px;
                  color: var(--primary-color);
                  border-radius: 8px;
                ">
                </div>
                <div style="text-align: center; font-size: 12px; color: #666; margin-top: 8px; font-weight: bold;">
                  رمز الاستجابة السريعة
                </div>
                <div style="text-align: center; font-size: 10px; color: #888; margin-top: 2px;">
                  ${invoiceData.id} - ${new Date().toLocaleDateString('ar-EG')}
                </div>
              </div>
            </div>
          ` : ''}
          
          ${settings.showFooter ? `
            <div class="footer">
              <div class="thank-you">${settings.customFooter ? settings.customFooter.split('\n')[0] : 'شكراً لتعاملكم معنا'}</div>
              <div class="footer-info">
                ${settings.customFooter ? settings.customFooter.split('\n').slice(1).join('<br>') : `نتطلع لخدمتكم مرة أخرى<br>
                لأي استفسارات يرجى التواصل معنا على ${currentCompanyInfo.phone}`}
                ${settings.showTimestamp ? `<br>تم إنشاء هذه الفاتورة في: ${new Date().toLocaleString('ar-EG')}` : ''}
              </div>
            </div>
          ` : ''}
        </div>
      </body>
      </html>
    `;
  };

  const handlePrint = (templateId: string) => {
    try {
      const template = defaultTemplates.find(t => t.id === templateId) || currentTemplate;
      const printContent = generatePrintHTML(template);
      
      // تحديد حجم النافذة حسب نوع القالب
      let windowOptions = 'scrollbars=yes,resizable=yes';
      switch (template.type) {
        case 'thermal':
          windowOptions = 'width=300,height=600,scrollbars=yes,resizable=yes';
          break;
        case 'receipt':
          windowOptions = 'width=400,height=700,scrollbars=yes,resizable=yes';
          break;
        case 'a4':
        case 'standard':
          windowOptions = 'width=900,height=800,scrollbars=yes,resizable=yes';
          break;
      }
      
      // إنشاء نافذة الطباعة مع معالجة أفضل للأخطاء
      const printWindow = window.open('', '_blank', windowOptions);
      
      if (!printWindow) {
        // إذا فشل فتح النافذة، استخدم طريقة بديلة
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.left = '-9999px';
        iframe.style.width = '0';
        iframe.style.height = '0';
        document.body.appendChild(iframe);
        
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
          doc.open();
          doc.write(printContent);
          doc.close();
          
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          
          // إزالة الـ iframe بعد الطباعة
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        }
        
        toast({
          title: "تم إرسال الطباعة",
          description: `تم طباعة الفاتورة بقالب ${template.name}`,
        });
        return;
      }
      
      printWindow.document.open();
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // إضافة عنوان مناسب للنافذة
      printWindow.document.title = `طباعة فاتورة ${invoiceData.id} - ${template.name}`;
      
      // انتظار تحميل المحتوى قبل الطباعة
      printWindow.onload = () => {
        printWindow.focus();
        
        // تأخير قصير للتأكد من تحميل التنسيقات
        setTimeout(() => {
          printWindow.print();
        }, 500);
        
        // إغلاق النافذة بعد الطباعة
        printWindow.onafterprint = () => {
          printWindow.close();
        };
      };
      
      if (onPrint) {
        onPrint(templateId);
      }
      
      toast({
        title: "✅ تم إرسال الطباعة",
        description: `تم طباعة الفاتورة ${invoiceData.id} بقالب ${template.name}`,
      });
      
    } catch (error) {
      console.error('خطأ في الطباعة:', error);
      toast({
        title: "❌ خطأ في الطباعة",
        description: "حدث خطأ أثناء الطباعة. يرجى المحاولة مرة أخرى أو استخدام المعاينة أولاً.",
        variant: "destructive",
      });
    }
  };

  const handlePreview = (templateId: string) => {
    try {
      const printContent = generatePrintHTML(currentTemplate);
      
      // إنشاء نافذة المعاينة مع إعدادات محسنة
      const previewWindow = window.open('', '_blank', 'width=1000,height=800,scrollbars=yes,resizable=yes,toolbar=yes,menubar=yes');
      
      if (!previewWindow) {
        // إذا فشل فتح النافذة، عرض رسالة للمستخدم
        alert('يرجى السماح بفتح النوافذ المنبثقة لعرض المعاينة، أو استخدم تحميل HTML بدلاً من ذلك.');
        return;
      }
      
      previewWindow.document.open();
      previewWindow.document.write(printContent);
      previewWindow.document.close();
      
      // إضافة عنوان للنافذة
      previewWindow.document.title = `معاينة فاتورة ${invoiceData.id}`;
      
      // التركيز على النافذة
      previewWindow.focus();
      
    } catch (error) {
      console.error('خطأ في المعاينة:', error);
      alert('حدث خطأ أثناء فتح المعاينة. يرجى المحاولة مرة أخرى.');
    }
  };

  const handleDownload = (templateId: string) => {
    try {
      const printContent = generatePrintHTML(currentTemplate);
      
      // إنشاء ملف HTML محسن مع تنسيق متطور وجميل
      const enhancedHTML = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>فاتورة ${invoiceData.id} - ${currentCompanyInfo.name}</title>
  <meta name="description" content="فاتورة مبيعات رقم ${invoiceData.id} - تم إنشاؤها بواسطة نظام SPADEX">
  <meta name="author" content="${currentCompanyInfo.name}">
  <meta name="generator" content="نظام إدارة المبيعات SPADEX">
  <meta name="keywords" content="فاتورة، مبيعات، ${invoiceData.customerName}">
  
  <!-- إضافة أيقونة مخصصة -->
  <link rel="icon" type="image/svg+xml" data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%232563eb'%3E%3Cpath d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z'/%3E%3Cpolyline points='14,2 14,8 20,8'/%3E%3Cline x1='16' y1='13' x2='8' y2='13'/%3E%3Cline x1='16' y1='17' x2='8' y2='17'/%3E%3Cpolyline points='10,9 9,9 8,9'/%3E%3C/svg%3E" />
  
  <!-- إضافة أنيميشن تحميل جميل -->
  <style>
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      animation: fadeOut 2s ease-in-out forwards;
    }
    
    .loading-content {
      text-align: center;
      color: white;
    }
    
    .loading-spinner {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(255,255,255,0.3);
      border-top: 4px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    @keyframes fadeOut {
      0% { opacity: 1; }
      70% { opacity: 1; }
      100% { opacity: 0; visibility: hidden; }
    }
    
    .invoice-container {
      opacity: 0;
      animation: fadeIn 1s ease-in-out 1.5s forwards;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    /* إضافة تأثيرات جميلة للطباعة */
    .print-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 10px 10px 0 0;
      margin-bottom: 30px;
    }
    
    .download-info {
      background: #f8fafc;
      border: 2px dashed #cbd5e1;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
      text-align: center;
      color: #64748b;
      font-size: 14px;
    }
    
    .digital-signature {
      margin-top: 40px;
      padding: 20px;
      background: linear-gradient(45deg, #f0f9ff, #e0f2fe);
      border-radius: 10px;
      border-left: 4px solid #0ea5e9;
    }
    
    @media print {
      .loading-overlay, .download-info { display: none !important; }
    }
  </style>
</head>
<body>
  <!-- شاشة تحميل جميلة -->
  <div class="loading-overlay">
    <div class="loading-content">
      <div class="loading-spinner"></div>
      <h2>جاري تحميل الفاتورة...</h2>
      <p>يتم إعداد فاتورة ${invoiceData.id} للعرض</p>
    </div>
  </div>

  <!-- معلومات التحميل -->
  <div class="download-info">
    <strong>📄 ملف فاتورة رقمي</strong><br>
    تم إنشاء هذا الملف في: ${new Date().toLocaleString('ar-EG')}<br>
    يمكنك طباعة هذه الفاتورة أو مشاركتها إلكترونياً
  </div>

  <!-- رأس الصفحة للملف المحمل -->
  <div class="print-header no-print">
    <h1>🧾 ${currentCompanyInfo.name}</h1>
    <p>فاتورة مبيعات رقم ${invoiceData.id}</p>
    <small>تم إنشاؤها بواسطة نظام SPADEX المتطور</small>
  </div>

${printContent.substring(printContent.indexOf('<body>') + 6, printContent.lastIndexOf('</body>'))}

  <!-- توقيع رقمي -->
  <div class="digital-signature no-print">
    <h3>🔐 توقيع رقمي</h3>
    <p><strong>تم إنشاء هذه الفاتورة بواسطة:</strong> نظام SPADEX</p>
    <p><strong>تاريخ الإنشاء:</strong> ${new Date().toLocaleString('ar-EG')}</p>
    <p><strong>معرف الجلسة:</strong> ${Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
    <p><strong>صالحة حتى:</strong> ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('ar-EG')}</p>
    <small>هذا المستند محمي رقمياً ومعتمد من نظام SPADEX</small>
  </div>

  <script>
    // إضافة تفاعلية للملف المحمل
    document.addEventListener('DOMContentLoaded', function() {
      console.log('🎉 تم تحميل فاتورة ${invoiceData.id} بنجاح!');
      
      // إضافة إمكانية الطباعة السريعة
      document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'p') {
          e.preventDefault();
          window.print();
        }
      });
      
      // إضافة زر طباعة سريع
      const printBtn = document.createElement('button');
      printBtn.innerHTML = '🖨️ طباعة سريعة';
      printBtn.style.cssText = \`
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        padding: 10px 20px;
        background: #2563eb;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-family: inherit;
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        transition: all 0.3s ease;
      \`;
      
      printBtn.onmouseover = function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 6px 20px rgba(37, 99, 235, 0.4)';
      };
      
      printBtn.onmouseout = function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
      };
      
      printBtn.onclick = function() {
        window.print();
      };
      
      document.body.appendChild(printBtn);
      
      // إخفاء زر الطباعة عند الطباعة
      window.addEventListener('beforeprint', function() {
        printBtn.style.display = 'none';
      });
      
      window.addEventListener('afterprint', function() {
        printBtn.style.display = 'block';
      });
    });
  </script>
</body>
</html>`;
      
      const blob = new Blob([enhancedHTML], { 
        type: 'text/html;charset=utf-8' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `فاتورة-${invoiceData.id}-${currentTemplate.name}-${new Date().toISOString().split('T')[0]}.html`;
      link.style.display = 'none';
      
      // إضافة الرابط للمستند وتفعيله
      document.body.appendChild(link);
      link.click();
      
      // تنظيف الموارد
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      // إشعار نجاح محسن
      toast({
        title: "✅ تم التحميل بنجاح",
        description: `تم تحميل فاتورة ${invoiceData.id} بتصميم ${currentTemplate.name} بصيغة HTML المطورة`,
      });
      
    } catch (error) {
      console.error('خطأ في تحميل HTML:', error);
      toast({
        title: "❌ خطأ في التحميل",
        description: "حدث خطأ أثناء إنشاء ملف HTML. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  // وظيفة لتصدير الفاتورة كـ PDF بنفس تصميم تصدير المنتجات
  const handleExportPDF = async () => {
    try {
      // تصدير الفاتورة بتصميم محسن مثل تصدير المنتجات
      await exportInvoiceToPDF(invoiceData);
      
    } catch (error) {
      console.error('خطأ في تصدير PDF:', error);
      
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير الفاتورة. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  const handleShareInvoice = async () => {
    try {
      const shareData = {
        title: `فاتورة رقم ${invoiceData.id}`,
        text: `فاتورة ${invoiceData.customerName} - إجمالي: ${invoiceData.total.toLocaleString('ar-SA')} ج.م`,
        url: window.location.href
      };

      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast({
          title: "✅ تم المشاركة",
          description: "تم مشاركة الفاتورة بنجاح",
        });
      } else {
        // Fallback: نسخ الرابط إلى الحافظة
        await navigator.clipboard.writeText(`فاتورة رقم ${invoiceData.id} - ${invoiceData.customerName}\nالإجمالي: ${invoiceData.total.toLocaleString('ar-SA')} ج.م\n${window.location.href}`);
        toast({
          title: "📋 تم النسخ",
          description: "تم نسخ بيانات الفاتورة إلى الحافظة",
        });
      }
    } catch (error) {
      console.error('Error sharing invoice:', error);
      toast({
        title: "❌ خطأ في المشاركة",
        description: "حدث خطأ أثناء مشاركة الفاتورة",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Printer className="h-5 w-5" />
          طباعة الفاتورة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="template-select" className="text-sm font-medium">اختر قالب الطباعة</label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="اختر قالب" />
              </SelectTrigger>
              <SelectContent>
                {defaultTemplates.map((template) => (
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
        </div>

        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={() => handlePrint(selectedTemplate)}
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            طباعة فورية
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => handlePreview(selectedTemplate)}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            معاينة
          </Button>
          
          
          <Button 
            onClick={handleExportPDF}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            تصدير PDF
          </Button>

          <InvoiceShareDialog invoiceData={invoiceData} />
        </div>

        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>القالب المحدد:</strong> {currentTemplate.name}</p>
          <p><strong>النوع:</strong> {currentTemplate.type}</p>
          <p><strong>الوصف:</strong> {currentTemplate.description}</p>
        </div>
      </CardContent>
    </Card>
  );
}