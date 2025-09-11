import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export interface PrintTemplate {
  id: string;
  name: string;
  type: 'thermal' | 'a4' | 'receipt' | 'custom';
  width: number;
  height: number;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  fontSize: {
    title: number;
    header: number;
    body: number;
    footer: number;
  };
  settings: {
    showLogo: boolean;
    showHeader: boolean;
    showFooter: boolean;
    showBorder: boolean;
    rtlSupport: boolean;
    arabicNumbers: boolean;
  };
}

export interface InvoiceData {
  id: string;
  date: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  tax?: number;
  discount?: number;
  total: number;
  notes?: string;
  paymentMethod?: string;
}

export interface CompanyInfo {
  name: string;
  nameEn?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxNumber?: string;
  logo?: string;
}

// قوالب الطباعة المحددة مسبقاً
export const printTemplates: PrintTemplate[] = [
  {
    id: 'thermal-58mm',
    name: 'طابعة حرارية 58 مم',
    type: 'thermal',
    width: 58,
    height: 0, // متغير حسب المحتوى
    margins: { top: 2, right: 2, bottom: 2, left: 2 },
    fontSize: { title: 14, header: 12, body: 10, footer: 8 },
    settings: {
      showLogo: false,
      showHeader: true,
      showFooter: true,
      showBorder: false,
      rtlSupport: true,
      arabicNumbers: true
    }
  },
  {
    id: 'thermal-80mm',
    name: 'طابعة حرارية 80 مم',
    type: 'thermal',
    width: 80,
    height: 0,
    margins: { top: 3, right: 3, bottom: 3, left: 3 },
    fontSize: { title: 16, header: 14, body: 12, footer: 10 },
    settings: {
      showLogo: true,
      showHeader: true,
      showFooter: true,
      showBorder: false,
      rtlSupport: true,
      arabicNumbers: true
    }
  },
  {
    id: 'a4-standard',
    name: 'A4 قياسي',
    type: 'a4',
    width: 210,
    height: 297,
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    fontSize: { title: 18, header: 14, body: 12, footer: 10 },
    settings: {
      showLogo: true,
      showHeader: true,
      showFooter: true,
      showBorder: true,
      rtlSupport: true,
      arabicNumbers: true
    }
  },
  {
    id: 'a4-detailed',
    name: 'A4 مفصل',
    type: 'a4',
    width: 210,
    height: 297,
    margins: { top: 25, right: 25, bottom: 25, left: 25 },
    fontSize: { title: 20, header: 16, body: 12, footer: 10 },
    settings: {
      showLogo: true,
      showHeader: true,
      showFooter: true,
      showBorder: true,
      rtlSupport: true,
      arabicNumbers: true
    }
  },
  {
    id: 'receipt-simple',
    name: 'إيصال بسيط',
    type: 'receipt',
    width: 76,
    height: 0,
    margins: { top: 2, right: 2, bottom: 2, left: 2 },
    fontSize: { title: 12, header: 10, body: 9, footer: 8 },
    settings: {
      showLogo: false,
      showHeader: false,
      showFooter: false,
      showBorder: false,
      rtlSupport: true,
      arabicNumbers: true
    }
  }
];

export class AdvancedPrintManager {
  private static instance: AdvancedPrintManager;
  private doc: jsPDF | null = null;
  private currentY: number = 0;
  private template: PrintTemplate | null = null;
  private companyInfo: CompanyInfo | null = null;

  static getInstance(): AdvancedPrintManager {
    if (!AdvancedPrintManager.instance) {
      AdvancedPrintManager.instance = new AdvancedPrintManager();
    }
    return AdvancedPrintManager.instance;
  }

  // تحميل معلومات الشركة
  loadCompanyInfo(): CompanyInfo {
    try {
      const saved = localStorage.getItem('company_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        return {
          name: settings.name || 'شركة عمران للمبيعات',
          nameEn: settings.nameEn || '',
          address: settings.address || '',
          phone: settings.phone || '',
          email: settings.email || '',
          website: settings.website || '',
          taxNumber: settings.taxNumber || '',
          logo: settings.logo || ''
        };
      }
    } catch (error) {
      console.error('Error loading company info:', error);
    }
    
    return {
      name: 'شركة عمران للمبيعات',
      address: '',
      phone: '',
      email: ''
    };
  }

  // إنشاء فاتورة بقالب محدد
  async generateInvoice(
    invoiceData: InvoiceData, 
    templateId: string = 'a4-standard'
  ): Promise<string> {
    this.template = printTemplates.find(t => t.id === templateId) || printTemplates[2];
    this.companyInfo = this.loadCompanyInfo();
    
    if (this.template.type === 'thermal' || this.template.type === 'receipt') {
      return this.generateThermalInvoice(invoiceData);
    } else {
      return this.generatePDFInvoice(invoiceData);
    }
  }

  // إنشاء فاتورة PDF للطابعات العادية
  private async generatePDFInvoice(invoiceData: InvoiceData): Promise<string> {
    const template = this.template!;
    
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [template.width, template.height]
    });

    this.currentY = template.margins.top;

    // رأس الفاتورة
    if (template.settings.showHeader) {
      await this.addPDFHeader(invoiceData);
    }

    // معلومات الفاتورة
    this.addInvoiceInfo(invoiceData);

    // معلومات العميل
    this.addCustomerInfo(invoiceData);

    // جدول المنتجات
    this.addItemsTable(invoiceData);

    // المجاميع
    this.addTotals(invoiceData);

    // الملاحظات
    if (invoiceData.notes) {
      this.addNotes(invoiceData.notes);
    }

    // تذييل الفاتورة
    if (template.settings.showFooter) {
      this.addPDFFooter();
    }

    const pdfBlob = this.doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    return url;
  }

  // إنشاء فاتورة للطابعات الحرارية
  private generateThermalInvoice(invoiceData: InvoiceData): string {
    const template = this.template!;
    let html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>فاتورة ${invoiceData.id}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Courier', monospace;
            font-size: ${template.fontSize.body}px;
            line-height: 1.2;
            width: ${template.width}mm;
            margin: ${template.margins.top}mm ${template.margins.right}mm ${template.margins.bottom}mm ${template.margins.left}mm;
            direction: rtl;
            background: white;
          }
          
          .center { text-align: center; }
          .right { text-align: right; }
          .left { text-align: left; }
          .bold { font-weight: bold; }
          
          .title {
            font-size: ${template.fontSize.title}px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .header {
            font-size: ${template.fontSize.header}px;
            margin-bottom: 3px;
          }
          
          .separator {
            border-top: 1px dashed #000;
            margin: 5px 0;
          }
          
          .item-row {
            display: flex;
            justify-content: space-between;
            margin: 2px 0;
          }
          
          .total-row {
            font-weight: bold;
            margin: 3px 0;
          }
          
          .footer {
            font-size: ${template.fontSize.footer}px;
            margin-top: 10px;
          }

          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
    `;

    // رأس الفاتورة
    if (template.settings.showHeader && this.companyInfo) {
      html += `
        <div class="center">
          <div class="title">${this.processArabicText(this.companyInfo.name)}</div>
          ${this.companyInfo.address ? `<div class="header">${this.processArabicText(this.companyInfo.address)}</div>` : ''}
          ${this.companyInfo.phone ? `<div class="header">ت: ${this.processArabicText(this.companyInfo.phone)}</div>` : ''}
          ${this.companyInfo.taxNumber ? `<div class="header">ض.ر: ${this.companyInfo.taxNumber}</div>` : ''}
        </div>
        <div class="separator"></div>
      `;
    }

    // معلومات الفاتورة
    html += `
      <div class="center title">فاتورة مبيعات</div>
      <div class="item-row">
        <span>رقم الفاتورة:</span>
        <span>${invoiceData.id}</span>
      </div>
      <div class="item-row">
        <span>التاريخ:</span>
        <span>${this.formatArabicDate(invoiceData.date)}</span>
      </div>
    `;

    // معلومات العميل
    if (invoiceData.customerName) {
      html += `
        <div class="item-row">
          <span>العميل:</span>
          <span>${this.processArabicText(invoiceData.customerName)}</span>
        </div>
      `;
    }

    html += `<div class="separator"></div>`;

    // المنتجات
    invoiceData.items.forEach(item => {
      html += `
        <div class="item-row">
          <span>${this.processArabicText(item.name)}</span>
        </div>
        <div class="item-row">
          <span>${item.quantity} × ${this.formatCurrency(item.price)}</span>
          <span>${this.formatCurrency(item.total)}</span>
        </div>
      `;
    });

    html += `<div class="separator"></div>`;

    // المجاميع
    html += `
      <div class="item-row">
        <span>المجموع الفرعي:</span>
        <span>${this.formatCurrency(invoiceData.subtotal)}</span>
      </div>
    `;

    if (invoiceData.discount && invoiceData.discount > 0) {
      html += `
        <div class="item-row">
          <span>خصم:</span>
          <span>-${this.formatCurrency(invoiceData.discount)}</span>
        </div>
      `;
    }

    if (invoiceData.tax && invoiceData.tax > 0) {
      html += `
        <div class="item-row">
          <span>ضريبة:</span>
          <span>${this.formatCurrency(invoiceData.tax)}</span>
        </div>
      `;
    }

    html += `
      <div class="separator"></div>
      <div class="item-row total-row">
        <span>الإجمالي:</span>
        <span>${this.formatCurrency(invoiceData.total)}</span>
      </div>
    `;

    // طريقة الدفع
    if (invoiceData.paymentMethod) {
      html += `
        <div class="item-row">
          <span>طريقة الدفع:</span>
          <span>${this.getPaymentMethodName(invoiceData.paymentMethod)}</span>
        </div>
      `;
    }

    // الملاحظات
    if (invoiceData.notes) {
      html += `
        <div class="separator"></div>
        <div class="header">ملاحظات:</div>
        <div>${this.processArabicText(invoiceData.notes)}</div>
      `;
    }

    // التذييل
    if (template.settings.showFooter) {
      html += `
        <div class="separator"></div>
        <div class="center footer">
          <div>شكراً لتعاملكم معنا</div>
          <div>${this.formatArabicDate(new Date().toISOString())}</div>
        </div>
      `;
    }

    html += `
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    return URL.createObjectURL(blob);
  }

  // إضافة رأس PDF
  private async addPDFHeader(invoiceData: InvoiceData): Promise<void> {
    const template = this.template!;
    const company = this.companyInfo!;

    // شعار الشركة (إذا متوفر)
    if (template.settings.showLogo && company.logo) {
      try {
        // إضافة الشعار هنا إذا كان متوفراً
        this.currentY += 20;
      } catch (error) {
        console.warn('Could not add logo:', error);
      }
    }

    // اسم الشركة
    this.doc!.setFontSize(template.fontSize.title);
    this.doc!.setFont('helvetica', 'bold');
    this.doc!.text(
      this.processArabicText(company.name),
      template.width / 2,
      this.currentY,
      { align: 'center' }
    );
    this.currentY += 8;

    // معلومات الشركة
    this.doc!.setFontSize(template.fontSize.body);
    this.doc!.setFont('helvetica', 'normal');
    
    if (company.address) {
      this.doc!.text(
        this.processArabicText(company.address),
        template.width / 2,
        this.currentY,
        { align: 'center' }
      );
      this.currentY += 5;
    }

    const contactInfo = [];
    if (company.phone) contactInfo.push(`ت: ${company.phone}`);
    if (company.email) contactInfo.push(`إ: ${company.email}`);
    if (company.website) contactInfo.push(company.website);

    if (contactInfo.length > 0) {
      this.doc!.text(
        contactInfo.join(' | '),
        template.width / 2,
        this.currentY,
        { align: 'center' }
      );
      this.currentY += 5;
    }

    if (company.taxNumber) {
      this.doc!.text(
        `الرقم الضريبي: ${company.taxNumber}`,
        template.width / 2,
        this.currentY,
        { align: 'center' }
      );
      this.currentY += 8;
    }

    // خط فاصل
    this.doc!.setDrawColor(0, 0, 0);
    this.doc!.line(
      template.margins.left,
      this.currentY,
      template.width - template.margins.right,
      this.currentY
    );
    this.currentY += 8;
  }

  // إضافة معلومات الفاتورة
  private addInvoiceInfo(invoiceData: InvoiceData): void {
    const template = this.template!;

    this.doc!.setFontSize(template.fontSize.header);
    this.doc!.setFont('helvetica', 'bold');
    this.doc!.text(
      'فاتورة مبيعات',
      template.width / 2,
      this.currentY,
      { align: 'center' }
    );
    this.currentY += 10;

    this.doc!.setFontSize(template.fontSize.body);
    this.doc!.setFont('helvetica', 'normal');

    // رقم الفاتورة والتاريخ
    this.doc!.text(
      `رقم الفاتورة: ${invoiceData.id}`,
      template.margins.left,
      this.currentY
    );
    this.doc!.text(
      `التاريخ: ${this.formatArabicDate(invoiceData.date)}`,
      template.width - template.margins.right,
      this.currentY,
      { align: 'right' }
    );
    this.currentY += 8;
  }

  // إضافة معلومات العميل
  private addCustomerInfo(invoiceData: InvoiceData): void {
    const template = this.template!;

    if (invoiceData.customerName) {
      this.doc!.setFontSize(template.fontSize.body);
      this.doc!.setFont('helvetica', 'bold');
      this.doc!.text(
        'بيانات العميل:',
        template.margins.left,
        this.currentY
      );
      this.currentY += 6;

      this.doc!.setFont('helvetica', 'normal');
      this.doc!.text(
        `الاسم: ${this.processArabicText(invoiceData.customerName)}`,
        template.margins.left,
        this.currentY
      );
      this.currentY += 5;

      if (invoiceData.customerPhone) {
        this.doc!.text(
          `الهاتف: ${invoiceData.customerPhone}`,
          template.margins.left,
          this.currentY
        );
        this.currentY += 5;
      }

      if (invoiceData.customerAddress) {
        this.doc!.text(
          `العنوان: ${this.processArabicText(invoiceData.customerAddress)}`,
          template.margins.left,
          this.currentY
        );
        this.currentY += 5;
      }

      this.currentY += 5;
    }
  }

  // إضافة جدول المنتجات
  private addItemsTable(invoiceData: InvoiceData): void {
    const template = this.template!;
    const tableWidth = template.width - template.margins.left - template.margins.right;
    const colWidths = [tableWidth * 0.4, tableWidth * 0.15, tableWidth * 0.2, tableWidth * 0.25];
    const rowHeight = 8;

    // رأس الجدول
    this.doc!.setFontSize(template.fontSize.body);
    this.doc!.setFont('helvetica', 'bold');
    this.doc!.setFillColor(240, 240, 240);
    this.doc!.rect(template.margins.left, this.currentY, tableWidth, rowHeight, 'F');

    let currentX = template.margins.left;
    const headers = ['الصنف', 'الكمية', 'السعر', 'الإجمالي'];
    
    headers.forEach((header, index) => {
      this.doc!.text(
        header,
        currentX + colWidths[index] / 2,
        this.currentY + 5,
        { align: 'center' }
      );
      currentX += colWidths[index];
    });

    this.currentY += rowHeight;

    // صفوف المنتجات
    this.doc!.setFont('helvetica', 'normal');
    invoiceData.items.forEach((item, index) => {
      if (index % 2 === 0) {
        this.doc!.setFillColor(250, 250, 250);
        this.doc!.rect(template.margins.left, this.currentY, tableWidth, rowHeight, 'F');
      }

      currentX = template.margins.left;
      const values = [
        this.processArabicText(item.name),
        item.quantity.toString(),
        this.formatCurrency(item.price),
        this.formatCurrency(item.total)
      ];

      values.forEach((value, colIndex) => {
        this.doc!.text(
          value,
          currentX + colWidths[colIndex] / 2,
          this.currentY + 5,
          { align: 'center' }
        );
        currentX += colWidths[colIndex];
      });

      // رسم حدود الصف
      this.doc!.setDrawColor(200, 200, 200);
      this.doc!.rect(template.margins.left, this.currentY, tableWidth, rowHeight);

      this.currentY += rowHeight;
    });

    this.currentY += 5;
  }

  // إضافة المجاميع
  private addTotals(invoiceData: InvoiceData): void {
    const template = this.template!;
    const rightX = template.width - template.margins.right;
    const leftX = rightX - 60;

    this.doc!.setFontSize(template.fontSize.body);
    this.doc!.setFont('helvetica', 'normal');

    // المجموع الفرعي
    this.doc!.text('المجموع الفرعي:', leftX, this.currentY);
    this.doc!.text(this.formatCurrency(invoiceData.subtotal), rightX, this.currentY, { align: 'right' });
    this.currentY += 6;

    // الخصم
    if (invoiceData.discount && invoiceData.discount > 0) {
      this.doc!.text('خصم:', leftX, this.currentY);
      this.doc!.text(`-${this.formatCurrency(invoiceData.discount)}`, rightX, this.currentY, { align: 'right' });
      this.currentY += 6;
    }

    // الضريبة
    if (invoiceData.tax && invoiceData.tax > 0) {
      this.doc!.text('ضريبة القيمة المضافة:', leftX, this.currentY);
      this.doc!.text(this.formatCurrency(invoiceData.tax), rightX, this.currentY, { align: 'right' });
      this.currentY += 6;
    }

    // خط فاصل
    this.doc!.setDrawColor(0, 0, 0);
    this.doc!.line(leftX, this.currentY, rightX, this.currentY);
    this.currentY += 4;

    // الإجمالي النهائي
    this.doc!.setFont('helvetica', 'bold');
    this.doc!.setFontSize(template.fontSize.header);
    this.doc!.text('الإجمالي:', leftX, this.currentY);
    this.doc!.text(this.formatCurrency(invoiceData.total), rightX, this.currentY, { align: 'right' });
    this.currentY += 10;
  }

  // إضافة الملاحظات
  private addNotes(notes: string): void {
    const template = this.template!;

    this.doc!.setFontSize(template.fontSize.body);
    this.doc!.setFont('helvetica', 'bold');
    this.doc!.text('ملاحظات:', template.margins.left, this.currentY);
    this.currentY += 6;

    this.doc!.setFont('helvetica', 'normal');
    const lines = this.doc!.splitTextToSize(
      this.processArabicText(notes),
      template.width - template.margins.left - template.margins.right
    );
    
    lines.forEach((line: string) => {
      this.doc!.text(line, template.margins.left, this.currentY);
      this.currentY += 5;
    });

    this.currentY += 5;
  }

  // إضافة تذييل PDF
  private addPDFFooter(): void {
    const template = this.template!;

    this.doc!.setFontSize(template.fontSize.footer);
    this.doc!.setFont('helvetica', 'normal');
    
    const footerY = template.height - template.margins.bottom - 10;
    
    this.doc!.text(
      'شكراً لتعاملكم معنا',
      template.width / 2,
      footerY,
      { align: 'center' }
    );

    this.doc!.text(
      `تم الإنشاء: ${this.formatArabicDate(new Date().toISOString())}`,
      template.width / 2,
      footerY + 5,
      { align: 'center' }
    );
  }

  // طباعة مباشرة
  async printInvoice(invoiceData: InvoiceData, templateId: string = 'thermal-80mm'): Promise<void> {
    const url = await this.generateInvoice(invoiceData, templateId);
    
    if (templateId.includes('thermal') || templateId.includes('receipt')) {
      // فتح نافذة جديدة للطباعة المباشرة
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
          printWindow.onafterprint = () => {
            printWindow.close();
            URL.revokeObjectURL(url);
          };
        };
      }
    } else {
      // طباعة PDF
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  }

  // تصدير Excel محسن للأرقام العربية
  exportToExcel(data: any[], filename: string, sheetName: string = 'البيانات'): void {
    try {
      // إنشاء workbook جديد
      const wb = XLSX.utils.book_new();
      
      // معالجة البيانات لدعم العربية والأرقام
      const processedData = data.map(row => {
        const newRow: any = {};
        Object.keys(row).forEach(key => {
          let value = row[key];
          
          // تحويل التواريخ
          if (value instanceof Date) {
            value = value.toLocaleDateString('ar-SA', { numberingSystem: 'arab' });
          }
          // تحويل الأرقام للعربية إذا كان مطلوباً
          else if (typeof value === 'number') {
            value = this.formatArabicNumber(value);
          }
          // معالجة النصوص العربية
          else if (typeof value === 'string' && /[\u0600-\u06FF]/.test(value)) {
            value = this.processArabicText(value);
          }
          
          newRow[key] = value;
        });
        return newRow;
      });

      // إنشاء worksheet
      const ws = XLSX.utils.json_to_sheet(processedData);
      
      // تحسين عرض الأعمدة
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:Z1');
      const colWidths = [];
      
      for (let C = range.s.c; C <= range.e.c; ++C) {
        let maxWidth = 10;
        for (let R = range.s.r; R <= range.e.r; ++R) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          const cell = ws[cellAddress];
          if (cell && cell.v) {
            const width = cell.v.toString().length;
            maxWidth = Math.max(maxWidth, width);
          }
        }
        colWidths.push({ wch: Math.min(maxWidth + 2, 50) });
      }
      
      ws['!cols'] = colWidths;
      
      // إضافة الـ worksheet للـ workbook
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      
      // حفظ الملف
      XLSX.writeFile(wb, `${filename}.xlsx`, {
        bookType: 'xlsx',
        type: 'binary',
        cellStyles: true
      });
      
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw new Error('فشل في تصدير ملف Excel');
    }
  }

  // معالجة النص العربي للعرض الصحيح
  private processArabicText(text: string): string {
    // إزالة الأحرف غير المرغوب فيها
    return text.replace(/[\u200E\u200F\u202A-\u202E]/g, '').trim();
  }

  // تنسيق التاريخ بالعربية
  private formatArabicDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      numberingSystem: 'arab'
    });
  }

  // تنسيق العملة
  private formatCurrency(amount: number): string {
    const currency = JSON.parse(localStorage.getItem('default_currency') || '{"symbol":"ر.س"}');
    return `${amount.toLocaleString('ar-SA', { numberingSystem: 'arab' })} ${currency.symbol}`;
  }

  // تحويل الأرقام للعربية
  private formatArabicNumber(num: number): string {
    return num.toLocaleString('ar-SA', { numberingSystem: 'arab' });
  }

  // الحصول على اسم طريقة الدفع
  private getPaymentMethodName(method: string): string {
    const methods: { [key: string]: string } = {
      'cash': 'نقدي',
      'card': 'بطاقة',
      'bank': 'تحويل بنكي',
      'credit': 'آجل',
      'check': 'شيك'
    };
    return methods[method] || method;
  }

  // الحصول على القوالب المتاحة
  getAvailableTemplates(): PrintTemplate[] {
    return [...printTemplates];
  }

  // حفظ قالب مخصص
  saveCustomTemplate(template: PrintTemplate): void {
    const customTemplates = JSON.parse(localStorage.getItem('custom_print_templates') || '[]');
    const existingIndex = customTemplates.findIndex((t: PrintTemplate) => t.id === template.id);
    
    if (existingIndex !== -1) {
      customTemplates[existingIndex] = template;
    } else {
      customTemplates.push(template);
    }
    
    localStorage.setItem('custom_print_templates', JSON.stringify(customTemplates));
  }

  // الحصول على القوالب المخصصة
  getCustomTemplates(): PrintTemplate[] {
    return JSON.parse(localStorage.getItem('custom_print_templates') || '[]');
  }
}

export const advancedPrintManager = AdvancedPrintManager.getInstance();