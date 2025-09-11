import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface InvoiceExportData {
  id: string;
  customerName: string;
  customerPhone?: string;
  date: string;
  items: Array<{
    product_name?: string;
    name?: string;
    quantity: number;
    unit_price?: number;
    price?: number;
    total_price?: number;
    total?: number;
  }>;
  total: number;
  subtotal?: number;
  taxAmount?: number;
  discountAmount?: number;
  notes?: string;
  status?: string;
  paymentMethod?: string;
}

export interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxNumber?: string;
  logo?: string;
}

export const useInvoiceExport = () => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  // جلب بيانات الشركة من الإعدادات المحلية
  const getCompanyInfo = (): CompanyInfo => {
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
          logo: companySettings.logo
        };
      }
    } catch (error) {
      console.error('Error loading company settings:', error);
    }
    
    // القيم الافتراضية
    return {
      name: 'شركة عمران للمبيعات',
      address: 'العنوان، المدينة، الدولة',
      phone: '+20123456789',
      email: 'info@omran.com',
      taxNumber: '123456789'
    };
  };

  // تصدير فاتورة بنفس تصميم تصدير المنتجات
  const exportInvoiceToPDF = async (invoiceData: any): Promise<void> => {
    if (isExporting) return;

    try {
      setIsExporting(true);

      // إنشاء نافذة جديدة للطباعة (نفس النظام المستخدم في تقرير المنتجات)
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({
          title: "خطأ في فتح النافذة",
          description: 'يرجى السماح بفتح النوافذ المنبثقة لتصدير التقرير',
          variant: "destructive",
        });
        return;
      }

      const companyInfo = getCompanyInfo();
      
      // إعداد العنوان والمعلومات
      const title = `فاتورة رقم ${invoiceData.id}`;
      const subtitle = `${companyInfo.name} - فاتورة مبيعات`;
      
      // إعداد بيانات الجدول
      const headers = ["اسم المنتج", "الكمية", "سعر الوحدة", "الإجمالي"];
      const rows = (invoiceData.items || invoiceData.itemsDetails || []).map((item: any) => `
        <tr>
          <td>${item.product_name || item.name || 'غير محدد'}</td>
          <td>${item.quantity || 1}</td>
          <td>${(item.unit_price || item.price || 0).toLocaleString('ar-SA')} ج.م</td>
          <td>${(item.total_price || item.total || ((item.quantity || 1) * (item.unit_price || item.price || 0))).toLocaleString('ar-SA')} ج.م</td>
        </tr>
      `);

      // حساب الإحصائيات
      const itemCount = (invoiceData.items || invoiceData.itemsDetails || []).length;
      const totalAmount = invoiceData.total || invoiceData.total_amount || 0;
      
      // إحصائيات إضافية
      const statisticsText = `إجمالي قيمة الفاتورة: ${totalAmount.toLocaleString('ar-SA')} ج.م`;
      const customerInfo = invoiceData.customerName || invoiceData.customer_name || 'عميل غير محدد';
      const invoiceStatus = invoiceData.status === 'paid' ? 'مدفوعة' : 'غير مدفوعة';

      const htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <title>${title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
            body { 
              font-family: 'Cairo', Arial, sans-serif; 
              direction: rtl; 
              margin: 20px;
              color: #333;
              background: #fff;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 3px solid #2563eb;
              padding-bottom: 20px;
            }
            .title { 
              font-size: 28px; 
              font-weight: bold; 
              margin-bottom: 10px; 
              color: #1e40af;
            }
            .subtitle { 
              font-size: 18px; 
              color: #64748b; 
              margin-bottom: 20px; 
            }
            .company-info {
              background: #f8fafc;
              border: 2px solid #e2e8f0;
              border-radius: 12px;
              padding: 20px;
              margin: 20px 0;
              text-align: center;
            }
            .company-name {
              font-size: 24px;
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 10px;
            }
            .company-details {
              font-size: 14px;
              color: #64748b;
              line-height: 1.6;
            }
            .invoice-details {
              background: #f0f9ff;
              border: 2px solid #0ea5e9;
              border-radius: 12px;
              padding: 20px;
              margin: 20px 0;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
            }
            .detail-item {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #e0f2fe;
            }
            .detail-label {
              font-weight: bold;
              color: #0c4a6e;
            }
            .detail-value {
              color: #0369a1;
              font-weight: 500;
            }
            .section { 
              margin: 30px 0; 
            }
            .section-title { 
              font-size: 20px; 
              font-weight: bold; 
              border-bottom: 2px solid #2563eb; 
              padding-bottom: 8px; 
              margin-bottom: 20px; 
              color: #1e40af;
            }
            .stats { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 15px; 
              margin: 25px 0; 
            }
            .stat-item { 
              background: #fef3c7;
              border: 2px solid #f59e0b;
              border-radius: 10px;
              padding: 15px;
              text-align: center;
            }
            .stat-label { 
              font-weight: bold; 
              color: #92400e;
              font-size: 14px;
              margin-bottom: 5px;
            }
            .stat-value {
              font-size: 18px;
              font-weight: bold;
              color: #78350f;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 20px 0; 
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            th, td { 
              border: 1px solid #e2e8f0; 
              padding: 12px 8px; 
              text-align: center; 
            }
            th { 
              background: linear-gradient(135deg, #2563eb, #1d4ed8); 
              color: white; 
              font-weight: bold; 
              font-size: 16px;
            }
            tbody tr:nth-child(even) {
              background-color: #f8fafc;
            }
            tbody tr:hover {
              background-color: #f1f5f9;
            }
            .total-section {
              background: #dcfce7;
              border: 3px solid #16a34a;
              border-radius: 15px;
              padding: 25px;
              margin: 30px 0;
              text-align: center;
            }
            .total-title {
              font-size: 22px;
              font-weight: bold;
              color: #15803d;
              margin-bottom: 15px;
            }
            .total-amount {
              font-size: 32px;
              font-weight: bold;
              color: #166534;
            }
            .notes-section {
              background: #fef7cd;
              border: 2px solid #eab308;
              border-radius: 12px;
              padding: 20px;
              margin: 25px 0;
            }
            .notes-title {
              font-weight: bold;
              color: #a16207;
              margin-bottom: 10px;
              font-size: 16px;
            }
            .notes-content {
              color: #92400e;
              line-height: 1.6;
            }
            .footer { 
              margin-top: 50px; 
              text-align: center; 
              font-size: 12px; 
              color: #64748b; 
              border-top: 2px solid #e2e8f0;
              padding-top: 20px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">${title}</h1>
            <div class="subtitle">${subtitle}</div>
          </div>

          <div class="company-info">
            <div class="company-name">${companyInfo.name}</div>
            <div class="company-details">
              ${companyInfo.address}<br>
              هاتف: ${companyInfo.phone} | بريد إلكتروني: ${companyInfo.email}<br>
              ${companyInfo.taxNumber ? `الرقم الضريبي: ${companyInfo.taxNumber}` : ''}
            </div>
          </div>

          <div class="invoice-details">
            <div class="detail-item">
              <span class="detail-label">رقم الفاتورة:</span>
              <span class="detail-value">${invoiceData.id}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">التاريخ:</span>
              <span class="detail-value">${new Date(invoiceData.date || invoiceData.created_at).toLocaleDateString('ar-SA')}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">العميل:</span>
              <span class="detail-value">${customerInfo}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">حالة الدفع:</span>
              <span class="detail-value">${invoiceStatus}</span>
            </div>
          </div>

          <div class="section">
            <h2 class="section-title">الملخص الإحصائي</h2>
            <div class="stats">
              <div class="stat-item">
                <div class="stat-label">عدد الأصناف</div>
                <div class="stat-value">${itemCount}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">إجمالي المبلغ</div>
                <div class="stat-value">${totalAmount.toLocaleString('ar-SA')} ج.م</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h2 class="section-title">تفاصيل الأصناف</h2>
            <table>
              <thead>
                <tr>
                  ${headers.map(header => `<th>${header}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${rows.join('')}
              </tbody>
            </table>
          </div>

          <div class="total-section">
            <div class="total-title">إجمالي الفاتورة</div>
            <div class="total-amount">${totalAmount.toLocaleString('ar-SA')} ج.م</div>
          </div>

          ${invoiceData.notes ? `
          <div class="notes-section">
            <div class="notes-title">ملاحظات:</div>
            <div class="notes-content">${invoiceData.notes}</div>
          </div>
          ` : ''}

          <div class="footer">
            <p>تم إنشاء هذا التقرير بواسطة نظام إدارة المبيعات - ${companyInfo.name}</p>
            <p>تاريخ الطباعة: ${new Date().toLocaleString('ar-SA')}</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      toast({
        title: "تم التصدير بنجاح",
        description: `تم تصدير الفاتورة ${invoiceData.id} بتصميم محسن باللغة العربية`,
      });
      
    } catch (error) {
      console.error('خطأ في تصدير PDF:', error);
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير الفاتورة. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportInvoiceToPDF,
    isExporting,
    companyInfo: getCompanyInfo()
  };
};

export default useInvoiceExport;