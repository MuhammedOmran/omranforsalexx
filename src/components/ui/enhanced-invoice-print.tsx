/**
 * نظام طباعة الفواتير المحسن - صفحة واحدة منظمة
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer, FileText, Eye, Share, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useInvoiceExport } from '@/hooks/useInvoiceExport';
import { InvoiceShareDialog } from '@/components/invoice/InvoiceShareDialog';
import { CompanyLogoManager } from '@/components/company/CompanyLogoManager';

export interface InvoicePrintData {
  id: string;
  customerName: string;
  customerPhone?: string;
  date: string;
  items: any[];
  itemsDetails?: any[];
  total: number;
  subtotal: number;
  taxAmount?: number;
  discountAmount?: number;
  notes?: string;
  paymentMethod?: string;
  status?: string;
}

interface EnhancedInvoicePrintProps {
  invoiceData: InvoicePrintData;
  onPrint?: () => void;
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    taxNumber?: string;
    logo?: string;
  };
}

export function EnhancedInvoicePrint({ 
  invoiceData, 
  onPrint,
  companyInfo
}: EnhancedInvoicePrintProps) {
  const { toast } = useToast();
  const { exportInvoiceToPDF } = useInvoiceExport();

  // جلب بيانات الشركة من الإعدادات
  const getCompanyInfo = () => {
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
          logo: companySettings.logo || undefined
        };
      }
    } catch (error) {
      console.error('Error loading company settings:', error);
    }
    
    return companyInfo || {
      name: 'شركة عمران للمبيعات',
      address: 'العنوان، المدينة، الدولة',
      phone: '+20123456789',
      email: 'info@omran.com',
      taxNumber: '123456789'
    };
  };

  const currentCompanyInfo = getCompanyInfo();

  const generateEnhancedPrintHTML = (): string => {
    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>فاتورة ${invoiceData.id}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap');
          
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          
          @page {
            size: A4;
            margin: 10mm;
          }
          
          body {
            font-family: 'Cairo', 'IBM Plex Sans Arabic', 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #1e293b;
            direction: rtl;
            background: white;
            margin: 0;
            padding: 0;
            height: 100vh;
          }
          
          .invoice-container {
            width: 100%;
            max-width: 100%;
            background: white;
            padding: 0;
            margin: 0;
            box-sizing: border-box;
          }
          
          /* Header Section */
          .header {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            align-items: center;
            gap: 20px;
            margin: 0 0 20px 0;
            padding: 20px;
            background: linear-gradient(135deg, #e0f2fe 0%, #f8fafc 100%);
            border: 2px solid #0284c7;
            border-radius: 15px;
            position: relative;
          }
          
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #0284c7, #0369a1);
            border-radius: 15px 15px 0 0;
          }
          
          .company-info {
            text-align: right;
            font-size: 11px;
            line-height: 1.5;
          }
          
          .company-name {
            font-size: 16px;
            font-weight: 700;
            color: #0284c7;
            margin-bottom: 8px;
          }
          
          .company-details {
            color: #475569;
            font-weight: 500;
          }
          
          .invoice-title-section {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
          }

          .invoice-title {
            text-align: center;
            font-size: 18px;
            font-weight: 700;
            color: white;
            background: linear-gradient(135deg, #0284c7, #0369a1);
            padding: 15px 25px;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(2, 132, 199, 0.3);
            border: 2px solid #0284c7;
          }

          .invoice-logo {
            max-width: 50px;
            max-height: 50px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            border: 2px solid #0284c7;
          }
          
          .company-logo {
            max-width: 80px;
            max-height: 60px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          
          /* Main Content */
          .main-content {
            display: flex;
            flex-direction: column;
            gap: 15px;
          }
          
          .invoice-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            flex-shrink: 0;
          }
          
          .detail-section {
            background: linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%);
            border: 1px solid #0284c7;
            border-radius: 10px;
            padding: 15px;
            box-shadow: 0 2px 8px rgba(2, 132, 199, 0.1);
          }
          
          .detail-title {
            font-weight: 700;
            font-size: 13px;
            color: #0369a1;
            margin-bottom: 10px;
            border-bottom: 2px solid #0284c7;
            padding-bottom: 5px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .detail-item {
            margin-bottom: 6px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
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
          
          /* Items Table */
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
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            border: 2px solid #0284c7;
            flex: 1;
          }
          
          .items-table th {
            background: linear-gradient(135deg, #0284c7, #0369a1);
            color: white;
            font-weight: 700;
            padding: 12px 8px;
            text-align: center;
            font-size: 12px;
            text-shadow: 0 1px 2px rgba(0,0,0,0.1);
          }
          
          .items-table td {
            padding: 10px 8px;
            text-align: center;
            border-bottom: 1px solid #e2e8f0;
            font-size: 11px;
            vertical-align: middle;
          }
          
          .items-table tbody tr:nth-child(even) {
            background-color: #f8fafc;
          }
          
          .items-table tbody tr:hover {
            background-color: #e0f2fe;
          }
          
          /* Footer Section */
          .footer-section {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 20px;
            margin-top: 15px;
            flex-shrink: 0;
          }
          
          .notes-section {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 15px;
          }
          
          .notes-title {
            font-weight: 700;
            color: #0369a1;
            margin-bottom: 8px;
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          
          .notes-content {
            font-size: 11px;
            color: #475569;
            line-height: 1.5;
          }
          
          .totals-box {
            background: linear-gradient(135deg, #e0f2fe 0%, #ffffff 100%);
            border: 2px solid #0284c7;
            border-radius: 12px;
            padding: 20px;
            min-width: 280px;
            box-shadow: 0 4px 15px rgba(2, 132, 199, 0.1);
          }
          
          .totals-title {
            font-size: 14px;
            font-weight: 700;
            color: #0369a1;
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 2px solid #0284c7;
            padding-bottom: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 12px;
            padding: 4px 0;
          }
          
          .total-row.final {
            font-size: 14px;
            font-weight: 700;
            color: #0284c7;
            border-top: 2px solid #0284c7;
            padding-top: 10px;
            margin-top: 10px;
            background: linear-gradient(135deg, #f0f9ff, #ffffff);
            padding: 10px;
            border-radius: 8px;
          }
          
          .footer {
            text-align: center;
            margin-top: 15px;
            padding: 12px;
            background: linear-gradient(135deg, #f8fafc, #ffffff);
            border-radius: 10px;
            border: 1px solid #e2e8f0;
            font-size: 10px;
            color: #64748b;
            flex-shrink: 0;
          }
          
          .footer-logo {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-bottom: 5px;
          }
          
          @media print {
            body { 
              margin: 0; 
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .invoice-container { 
              padding: 0;
              margin: 0;
              page-break-inside: avoid;
            }

            .header {
              margin: 0 0 15px 0;
              padding: 15px;
            }
            
            .no-print { 
              display: none; 
            }
            
            .items-table {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <!-- Header Section -->
          <div class="header">
            <div class="company-info">
              <div class="company-name">${currentCompanyInfo.name}</div>
              <div class="company-details">
                <div>📍 ${currentCompanyInfo.address}</div>
                <div>📞 ${currentCompanyInfo.phone}</div>
                <div>📧 ${currentCompanyInfo.email}</div>
                ${currentCompanyInfo.taxNumber ? `<div>🏢 رقم ضريبي: ${currentCompanyInfo.taxNumber}</div>` : ''}
              </div>
            </div>
            
            <div class="invoice-title-section">
              ${currentCompanyInfo.logo ? `
                <img src="${currentCompanyInfo.logo}" alt="شعار الشركة" class="invoice-logo" />
              ` : ''}
              <div class="invoice-title">
                🧾 فاتورة رقم ${invoiceData.id}
              </div>
            </div>
            
            <div></div>
          </div>

          <!-- Main Content -->
          <div class="main-content">
            <!-- Invoice Details -->
            <div class="invoice-details">
              <div class="detail-section">
                <div class="detail-title">📋 تفاصيل الفاتورة</div>
                <div class="detail-item">
                  <span class="detail-label">رقم الفاتورة:</span>
                  <span class="detail-value">${invoiceData.id}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">التاريخ:</span>
                  <span class="detail-value">${new Date(invoiceData.date).toLocaleDateString('ar-EG', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    calendar: 'gregory'
                  })}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">حالة الدفع:</span>
                  <span class="detail-value">${invoiceData.status === 'paid' ? '✅ مدفوعة' : '⏳ غير مدفوعة'}</span>
                </div>
                ${invoiceData.paymentMethod ? `
                  <div class="detail-item">
                    <span class="detail-label">طريقة الدفع:</span>
                    <span class="detail-value">💳 ${invoiceData.paymentMethod}</span>
                  </div>
                ` : ''}
              </div>

              <div class="detail-section">
                <div class="detail-title">👤 بيانات العميل</div>
                <div class="detail-item">
                  <span class="detail-label">اسم العميل:</span>
                  <span class="detail-value">${invoiceData.customerName}</span>
                </div>
                ${invoiceData.customerPhone ? `
                  <div class="detail-item">
                    <span class="detail-label">رقم الهاتف:</span>
                    <span class="detail-value">📱 ${invoiceData.customerPhone}</span>
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- Items Section -->
            <div class="items-section">
              <table class="items-table">
                <thead>
                  <tr>
                    <th style="width: 40%;">🛍️ المنتج</th>
                    <th style="width: 15%;">📦 الكمية</th>
                    <th style="width: 20%;">💰 سعر الوحدة</th>
                    <th style="width: 25%;">💎 الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  ${(invoiceData.items || invoiceData.itemsDetails || []).map((item: any) => `
                    <tr>
                      <td style="text-align: right; font-weight: 500;">
                        ${item.product_name || item.name || item.productName || 'منتج غير محدد'}
                      </td>
                      <td style="font-weight: 600;">${item.quantity || 0}</td>
                      <td>${(item.unit_price || item.price || item.unitPrice || 0).toLocaleString('ar-SA')} ج.م</td>
                      <td style="font-weight: 700; color: #0284c7;">
                        ${(item.total_price || item.total || (item.quantity * (item.unit_price || item.price || item.unitPrice || 0))).toLocaleString('ar-SA')} ج.م
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <!-- Footer Section -->
            <div class="footer-section">
              ${invoiceData.notes ? `
                <div class="notes-section">
                  <div class="notes-title">📝 ملاحظات</div>
                  <div class="notes-content">${invoiceData.notes}</div>
                </div>
              ` : '<div></div>'}
              
              <div class="totals-box">
                <div class="totals-title">💰 ملخص الفاتورة</div>
                
                ${invoiceData.subtotal && invoiceData.subtotal !== invoiceData.total ? `
                  <div class="total-row">
                    <span>المجموع الفرعي:</span>
                    <span>${invoiceData.subtotal.toLocaleString('ar-SA')} ج.م</span>
                  </div>
                ` : ''}
                
                ${invoiceData.discountAmount ? `
                  <div class="total-row">
                    <span>الخصم:</span>
                    <span style="color: #dc2626;">-${invoiceData.discountAmount.toLocaleString('ar-SA')} ج.م</span>
                  </div>
                ` : ''}
                
                ${invoiceData.taxAmount ? `
                  <div class="total-row">
                    <span>الضريبة:</span>
                    <span>+${invoiceData.taxAmount.toLocaleString('ar-SA')} ج.م</span>
                  </div>
                ` : ''}
                
                <div class="total-row final">
                  <span>💎 الإجمالي النهائي:</span>
                  <span>${invoiceData.total.toLocaleString('ar-SA')} ج.م</span>
                </div>
              </div>
            </div>
          </div>

          <div class="footer">
            <div class="footer-logo">
              <span>🌟</span>
              <span>شكراً لثقتكم بنا - ${currentCompanyInfo.name}</span>
              <span>🌟</span>
            </div>
            <div>
              تاريخ الطباعة: ${new Date().toLocaleString('ar-EG', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                calendar: 'gregory'
              })}
            </div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(() => {
              window.print();
            }, 500);
            
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
      </html>
    `;
  };

  const handlePrint = () => {
    try {
      const printContent = generateEnhancedPrintHTML();
      const printWindow = window.open('', '_blank');
      
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        toast({
          title: "✅ تم إرسال الطباعة",
          description: `تم طباعة الفاتورة ${invoiceData.id} بتصميم محسن`,
        });
        
        onPrint?.();
      } else {
        toast({
          title: "❌ خطأ في الطباعة",
          description: "يرجى السماح بفتح النوافذ المنبثقة",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error printing invoice:', error);
      toast({
        title: "❌ خطأ في الطباعة",
        description: "حدث خطأ أثناء طباعة الفاتورة",
        variant: "destructive",
      });
    }
  };

  const handlePreview = () => {
    try {
      const previewContent = generateEnhancedPrintHTML();
      const previewWindow = window.open('', '_blank');
      
      if (previewWindow) {
        previewWindow.document.write(previewContent);
        previewWindow.document.close();
        
        toast({
          title: "👁️ معاينة الفاتورة",
          description: "تم فتح معاينة الفاتورة في نافذة جديدة",
        });
      }
    } catch (error) {
      console.error('Error previewing invoice:', error);
    }
  };

  const handleExportPDF = async () => {
    try {
      await exportInvoiceToPDF(invoiceData);
      toast({
        title: "📄 تم تصدير PDF",
        description: "تم تصدير الفاتورة بصيغة PDF بنجاح",
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "❌ خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير الفاتورة",
        variant: "destructive",
      });
    }
  };

  return (
    <>
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Printer className="h-5 w-5" />
          طباعة الفاتورة المحسنة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">

        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={handlePrint}
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            طباعة فورية
          </Button>
          
          <Button 
            variant="outline"
            onClick={handlePreview}
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
          
          <CompanyLogoManager>
            <Button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white">
              <Building className="h-4 w-4" />
              شعار الشركة
            </Button>
          </CompanyLogoManager>
        </div>

        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium text-sm mb-2">✨ مميزات الطباعة المحسنة:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• تصميم منظم في صفحة واحدة</li>
            <li>• تنسيق جميل ومناسب للطباعة</li>
            <li>• ألوان وخطوط محسنة</li>
            <li>• عرض جميع المعلومات بوضوح</li>
          </ul>
        </div>
      </CardContent>
    </Card>

    </>
  );
}