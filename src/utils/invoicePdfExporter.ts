import { EnhancedArabicPDFExporter } from './enhancedArabicPdfExporter';

export interface InvoiceData {
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
  nameAr?: string;
}

export class InvoicePDFExporter {
  private exporter: EnhancedArabicPDFExporter;

  constructor() {
    this.exporter = new EnhancedArabicPDFExporter();
  }

  async exportInvoice(invoiceData: InvoiceData, companyInfo: CompanyInfo): Promise<void> {
    try {
      // الحصول على الشعار من localStorage أو Supabase
      let logoUrl = companyInfo.logo;
      if (!logoUrl) {
        try {
          const savedSettings = localStorage.getItem('company_settings');
          if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            logoUrl = settings.logo;
          }
        } catch (error) {
          console.log('لا يوجد شعار محفوظ');
        }
      }

      // إنشاء محتوى الفاتورة
      const content = {
        title: `فاتورة رقم ${invoiceData.id}`,
        subtitle: `${companyInfo.nameAr || companyInfo.name} - فاتورة مبيعات`,
        logo: logoUrl,
        sections: [
          {
            title: "معلومات الفاتورة",
            data: [
              { label: "رقم الفاتورة", value: invoiceData.id },
              { label: "التاريخ", value: new Date(invoiceData.date).toLocaleDateString('ar-SA') },
              { label: "حالة الدفع", value: invoiceData.status === 'paid' ? 'مدفوعة' : 'غير مدفوعة' },
              ...(invoiceData.paymentMethod ? [{ label: "طريقة الدفع", value: invoiceData.paymentMethod }] : [])
            ]
          },
          {
            title: "معلومات العميل",
            data: [
              { label: "اسم العميل", value: invoiceData.customerName },
              ...(invoiceData.customerPhone ? [{ label: "رقم الهاتف", value: invoiceData.customerPhone }] : [])
            ]
          },
          {
            title: "معلومات الشركة",
            data: [
              { label: "اسم الشركة", value: companyInfo.nameAr || companyInfo.name },
              { label: "العنوان", value: companyInfo.address },
              { label: "الهاتف", value: companyInfo.phone },
              { label: "البريد الإلكتروني", value: companyInfo.email },
              ...(companyInfo.taxNumber ? [{ label: "الرقم الضريبي", value: companyInfo.taxNumber }] : [])
            ]
          }
        ],
        tables: [
          {
            title: "تفاصيل الأصناف",
            headers: ["اسم الصنف", "الكمية", "سعر الوحدة", "الإجمالي"],
            rows: invoiceData.items.map(item => [
              item.product_name || item.name || 'غير محدد',
              item.quantity.toString(),
              `${(item.unit_price || item.price || 0).toLocaleString('ar-SA')} ج.م`,
              `${(item.total_price || item.total || (item.quantity * (item.unit_price || item.price || 0))).toLocaleString('ar-SA')} ج.م`
            ])
          }
        ]
      };

      // إضافة المحتوى إلى PDF
      await this.exporter.addArabicContent(content);

      // إضافة معلومات إضافية
      this.addFinancialSummary(invoiceData);

      // إضافة الملاحظات إذا كانت موجودة
      if (invoiceData.notes) {
        this.addNotes(invoiceData.notes);
      }

      // حفظ الملف
      const fileName = `فاتورة-${invoiceData.id}-${new Date().toISOString().split('T')[0]}.pdf`;
      this.exporter.save(fileName);

    } catch (error) {
      console.error('خطأ في تصدير فاتورة PDF:', error);
      throw new Error('فشل في تصدير الفاتورة كملف PDF');
    }
  }

  private addFinancialSummary(invoiceData: InvoiceData): void {
    const doc = this.exporter.getDocument();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = doc.internal.pageSize.getHeight() - 100;

    // إضافة الملخص المالي
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('الملخص المالي:', pageWidth - 20, yPos, { align: 'right' });
    
    yPos += 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');

    // المجموع الفرعي
    if (invoiceData.subtotal && invoiceData.subtotal !== invoiceData.total) {
      doc.text(`المجموع الفرعي: ${invoiceData.subtotal.toLocaleString('ar-SA')} ج.م`, pageWidth - 20, yPos, { align: 'right' });
      yPos += 10;
    }

    // الخصم
    if (invoiceData.discountAmount) {
      doc.text(`الخصم: ${invoiceData.discountAmount.toLocaleString('ar-SA')} ج.م`, pageWidth - 20, yPos, { align: 'right' });
      yPos += 10;
    }

    // الضريبة
    if (invoiceData.taxAmount) {
      doc.text(`الضريبة: ${invoiceData.taxAmount.toLocaleString('ar-SA')} ج.م`, pageWidth - 20, yPos, { align: 'right' });
      yPos += 10;
    }

    // الإجمالي النهائي
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`الإجمالي النهائي: ${invoiceData.total.toLocaleString('ar-SA')} ج.م`, pageWidth - 20, yPos, { align: 'right' });
  }

  private addNotes(notes: string): void {
    const doc = this.exporter.getDocument();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = doc.internal.pageSize.getHeight() - 40;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('ملاحظات:', pageWidth - 20, yPos, { align: 'right' });
    
    yPos += 10;
    doc.setFont('helvetica', 'normal');
    
    // تقسيم النص إلى أسطر متعددة إذا كان طويلاً
    const lines = doc.splitTextToSize(notes, pageWidth - 40);
    lines.forEach((line: string) => {
      doc.text(line, pageWidth - 20, yPos, { align: 'right' });
      yPos += 8;
    });
  }
}

// دالة مساعدة للاستخدام المباشر
export const exportInvoiceToPDF = async (invoiceData: InvoiceData, companyInfo?: CompanyInfo): Promise<void> => {
  // إذا لم يتم تمرير معلومات الشركة، اجلبها من localStorage  
  let finalCompanyInfo = companyInfo;
  if (!finalCompanyInfo) {
    try {
      const savedSettings = localStorage.getItem('company_settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        finalCompanyInfo = {
          name: settings.name || 'شركة عمران',
          nameAr: settings.nameAr || settings.name || 'شركة عمران',
          address: settings.address || 'العنوان',
          phone: settings.phone || 'الهاتف',
          email: settings.email || 'البريد الإلكتروني',
          taxNumber: settings.taxNumber,
          logo: settings.logo
        };
      }
    } catch (error) {
      console.error('خطأ في جلب إعدادات الشركة:', error);
    }
  }
  
  // استخدام قيم افتراضية إذا لم تتوفر معلومات الشركة
  if (!finalCompanyInfo) {
    finalCompanyInfo = {
      name: 'شركة عمران',
      nameAr: 'شركة عمران', 
      address: 'العنوان',
      phone: 'الهاتف',
      email: 'البريد الإلكتروني'
    };
  }
  
  const exporter = new InvoicePDFExporter();
  await exporter.exportInvoice(invoiceData, finalCompanyInfo);
};