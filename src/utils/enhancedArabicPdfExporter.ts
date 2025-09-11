import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export class EnhancedArabicPDFExporter {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;
  private currentY: number = 30;

  constructor() {
    this.doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    
    console.log('تم إنشاء Enhanced ArabicPDFExporter بنجاح - أبعاد الصفحة:', this.pageWidth, 'x', this.pageHeight);
  }

  // إنشاء HTML مؤقت وتحويله لصورة ثم إدراجه في PDF
  async addArabicContent(content: {
    title?: string;
    subtitle?: string;
    logo?: string;
    sections?: Array<{
      title: string;
      data: Array<{ label: string; value: string }>;
    }>;
    tables?: Array<{
      title: string;
      headers: string[];
      rows: string[][];
    }>;
  }): Promise<void> {
    console.log('بدء إضافة المحتوى العربي:', content);

    // إنشاء HTML للمحتوى
    const htmlContent = this.createArabicHTML(content);
    
    // إنشاء عنصر مؤقت في DOM
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '800px'; // عرض ثابت للتحكم في التخطيط
    tempDiv.style.fontFamily = '"IBM Plex Sans Arabic", "Amiri", Arial, sans-serif';
    tempDiv.style.direction = 'rtl';
    tempDiv.style.textAlign = 'right';
    
    document.body.appendChild(tempDiv);

    try {
      // انتظار تحميل الخطوط
      await document.fonts.ready;
      
      // تحويل HTML إلى Canvas
      const canvas = await html2canvas(tempDiv, {
        backgroundColor: '#ffffff',
        scale: 3, // دقة أعلى للنص العربي
        useCORS: true,
        allowTaint: true,
        width: 800,
        height: tempDiv.scrollHeight,
        logging: false,
        foreignObjectRendering: true
      });

      // حساب الأبعاد للـ PDF
      const imgWidth = this.pageWidth - (2 * this.margin);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // تحويل Canvas إلى صورة
      const imgData = canvas.toDataURL('image/png');

      // إضافة الصورة للـ PDF
      this.checkPageBreak(imgHeight);
      this.doc.addImage(imgData, 'PNG', this.margin, this.currentY, imgWidth, imgHeight);
      this.currentY += imgHeight + 10;

      console.log('تم إضافة المحتوى العربي بنجاح - أبعاد الصورة:', imgWidth, 'x', imgHeight);
    } catch (error) {
      console.error('خطأ في تحويل المحتوى العربي:', error);
      console.error('تفاصيل الخطأ:', error.stack);
      // في حالة الخطأ، استخدم الطريقة التقليدية
      this.addFallbackContent(content);
    } finally {
      // إزالة العنصر المؤقت
      document.body.removeChild(tempDiv);
    }
  }

  // إنشاء HTML للمحتوى العربي
  private createArabicHTML(content: {
    title?: string;
    subtitle?: string;
    logo?: string;
    sections?: Array<{
      title: string;
      data: Array<{ label: string; value: string }>;
    }>;
    tables?: Array<{
      title: string;
      headers: string[];
      rows: string[][];
    }>;
  }): string {
    let html = `
      <div style="
        font-family: 'IBM Plex Sans Arabic', 'Amiri', 'Segoe UI', Tahoma, Arial, sans-serif;
        direction: rtl;
        text-align: right;
        line-height: 1.8;
        padding: 20px;
        background: white;
        font-size: 14px;
      ">
    `;

    // الشعار في أعلى يسار الصفحة
    if (content.logo) {
      html += `
        <div style="
          position: relative;
          width: 100%;
          height: 100px;
          margin-bottom: 20px;
        ">
          <img src="${content.logo}" alt="شعار الشركة" style="
            position: absolute;
            top: 0;
            left: 0;
            max-width: 150px;
            max-height: 100px;
            object-fit: contain;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            z-index: 10;
          " onerror="this.style.display='none'" />
        </div>
      `;
    }

    // العنوان الرئيسي
    if (content.title) {
      html += `
        <h1 style="
          font-size: 24px;
          font-weight: bold;
          text-align: center;
          margin-bottom: 10px;
          color: #1f2937;
        ">${content.title}</h1>
      `;
    }

    // العنوان الفرعي
    if (content.subtitle) {
      html += `
        <h2 style="
          font-size: 16px;
          text-align: center;
          margin-bottom: 20px;
          color: #6b7280;
        ">${content.subtitle}</h2>
      `;
    }

    // الأقسام
    if (content.sections) {
      content.sections.forEach(section => {
        html += `
          <div style="margin-bottom: 25px;">
            <h3 style="
              font-size: 18px;
              font-weight: bold;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 5px;
              margin-bottom: 15px;
              color: #1f2937;
            ">${section.title}</h3>
        `;

        section.data.forEach(item => {
          html += `
            <div style="
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #f3f4f6;
            ">
              <span style="font-weight: bold;">${item.label}</span>
              <span>${item.value}</span>
            </div>
          `;
        });

        html += '</div>';
      });
    }

    // الجداول
    if (content.tables) {
      content.tables.forEach(table => {
        html += `
          <div style="margin-bottom: 25px;">
            <h3 style="
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 15px;
              color: #1f2937;
            ">${table.title}</h3>
            <table style="
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            ">
              <thead>
                <tr style="background-color: #f9fafb;">
        `;

        table.headers.forEach(header => {
          html += `
            <th style="
              border: 1px solid #d1d5db;
              padding: 12px 8px;
              text-align: center;
              font-weight: bold;
              background-color: #f3f4f6;
            ">${header}</th>
          `;
        });

        html += '</tr></thead><tbody>';

        table.rows.forEach((row, index) => {
          const bgColor = index % 2 === 0 ? '#ffffff' : '#f9fafb';
          html += `<tr style="background-color: ${bgColor};">`;
          
          row.forEach(cell => {
            html += `
              <td style="
                border: 1px solid #d1d5db;
                padding: 10px 8px;
                text-align: center;
              ">${cell}</td>
            `;
          });
          
          html += '</tr>';
        });

        html += '</tbody></table></div>';
      });
    }

    html += '</div>';
    return html;
  }

  // طريقة احتياطية في حالة فشل التحويل
  private addFallbackContent(content: any): void {
    console.log('استخدام الطريقة الاحتياطية للمحتوى');
    
    if (content.title) {
      this.doc.setFontSize(20);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(content.title, this.pageWidth / 2, this.currentY, { align: 'center' });
      this.currentY += 15;
    }

    if (content.subtitle) {
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(content.subtitle, this.pageWidth / 2, this.currentY, { align: 'center' });
      this.currentY += 15;
    }
  }

  // إضافة معلومات التقرير
  addReportInfo(reportDate: string, period: string): void {
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Report Date: ${reportDate}`, this.margin, this.currentY);
    this.doc.text(`Period: ${period}`, this.pageWidth - this.margin, this.currentY, { align: 'right' });
    this.currentY += 15;
  }

  // فحص الحاجة لصفحة جديدة
  private checkPageBreak(requiredSpace: number): void {
    if (this.currentY + requiredSpace > this.pageHeight - 30) {
      this.doc.addPage();
      this.currentY = 30;
    }
  }

  // إضافة توقيع
  addSignature(): void {
    this.checkPageBreak(30);
    const signatureY = this.pageHeight - 40;
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Generated by SPADEX Sales Management System', this.pageWidth / 2, signatureY, { align: 'center' });
    this.doc.text(`Generated on: ${new Date().toLocaleDateString()}`, this.pageWidth / 2, signatureY + 8, { align: 'center' });
  }

  // إضافة أرقام الصفحات
  addPageNumbers(): void {
    const pageCount = this.doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(
        `Page ${i} of ${pageCount}`,
        this.pageWidth / 2,
        this.pageHeight - 10,
        { align: 'center' }
      );
    }
  }

  // حفظ الملف
  save(filename: string): void {
    this.addSignature();
    this.addPageNumbers();
    this.doc.save(filename);
    console.log('تم حفظ الملف:', filename);
  }

  // الحصول على المستند
  getDocument(): jsPDF {
    return this.doc;
  }
}

export default EnhancedArabicPDFExporter;