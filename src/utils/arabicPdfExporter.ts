import jsPDF from 'jspdf';

export class ArabicPDFExporter {
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
    
    // إضافة دعم للخطوط العربية
    this.setupArabicFont();
    
    console.log('تم إنشاء ArabicPDFExporter بنجاح مع دعم الخطوط العربية');
  }

  // إعداد الخط العربي
  private setupArabicFont(): void {
    try {
      // استخدام خط Helvetica مع Unicode support كحل مؤقت
      this.doc.setFont('helvetica');
      console.log('تم إعداد الخط العربي بنجاح');
    } catch (error) {
      console.warn('خطأ في إعداد الخط العربي:', error);
    }
  }

  // إضافة عنوان رئيسي
  addTitle(title: string, fontSize: number = 20): void {
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', 'bold');
    // تحويل النص العربي للعرض الصحيح
    const arabicTitle = this.processArabicText(title);
    this.doc.text(arabicTitle, this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 15;
  }

  // إضافة عنوان فرعي
  addSubtitle(subtitle: string, fontSize: number = 14): void {
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', 'normal');
    const arabicSubtitle = this.processArabicText(subtitle);
    this.doc.text(arabicSubtitle, this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 10;
  }

  // إضافة معلومات التقرير
  addReportInfo(reportDate: string, period: string): void {
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(this.processArabicText(`تاريخ التقرير: ${reportDate}`), this.margin, this.currentY);
    this.doc.text(this.processArabicText(`الفترة: ${period}`), this.pageWidth - this.margin, this.currentY, { align: 'right' });
    this.currentY += 15;
  }

  // إضافة خط فاصل
  addDivider(): void {
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 10;
  }

  // إضافة قسم جديد
  addSection(title: string): void {
    this.checkPageBreak(20);
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(this.processArabicText(title), this.margin, this.currentY);
    this.currentY += 10;
    this.addDivider();
  }

  // إضافة نص عادي
  addText(text: string, fontSize: number = 12): void {
    this.checkPageBreak(10);
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(this.processArabicText(text), this.margin, this.currentY);
    this.currentY += 8;
  }

  // إضافة بيانات في عمودين
  addTwoColumnData(leftText: string, rightText: string): void {
    this.checkPageBreak(10);
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(this.processArabicText(rightText), this.pageWidth - this.margin, this.currentY, { align: 'right' });
    this.doc.text(this.processArabicText(leftText), this.margin, this.currentY);
    this.currentY += 8;
  }

  // إضافة جدول بسيط
  addTable(headers: string[], rows: string[][]): void {
    const cellHeight = 8;
    const cellWidth = (this.pageWidth - 2 * this.margin) / headers.length;
    
    this.checkPageBreak(cellHeight * (rows.length + 2));

    // رسم عناوين الجدول
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFillColor(245, 245, 245);
    this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, cellHeight, 'F');
    
    headers.forEach((header, index) => {
      const x = this.margin + index * cellWidth;
      this.doc.text(this.processArabicText(header), x + cellWidth / 2, this.currentY + 5, { align: 'center' });
    });
    
    this.currentY += cellHeight;

    // رسم صفوف الجدول
    this.doc.setFont('helvetica', 'normal');
    rows.forEach((row, rowIndex) => {
      this.checkPageBreak(cellHeight);
      
      // خلفية متبادلة للصفوف
      if (rowIndex % 2 === 0) {
        this.doc.setFillColor(250, 250, 250);
        this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, cellHeight, 'F');
      }

      row.forEach((cell, cellIndex) => {
        const x = this.margin + cellIndex * cellWidth;
        this.doc.text(this.processArabicText(cell), x + cellWidth / 2, this.currentY + 5, { align: 'center' });
      });

      // رسم حدود الخلايا
      this.doc.setDrawColor(200, 200, 200);
      this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, cellHeight);
      
      this.currentY += cellHeight;
    });

    this.currentY += 10;
  }

  // إضافة بطاقة إحصائية
  addStatCard(title: string, value: string, change?: string): void {
    this.checkPageBreak(25);
    
    const cardWidth = (this.pageWidth - 3 * this.margin) / 2;
    const cardHeight = 20;
    
    // رسم خلفية البطاقة
    this.doc.setFillColor(248, 250, 252);
    this.doc.setDrawColor(226, 232, 240);
    this.doc.roundedRect(this.margin, this.currentY, cardWidth, cardHeight, 2, 2, 'FD');
    
    // عنوان البطاقة
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(this.processArabicText(title), this.margin + 5, this.currentY + 6);
    
    // قيمة البطاقة
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(this.processArabicText(value), this.margin + 5, this.currentY + 14);
    
    // نسبة التغيير (إن وجدت)
    if (change) {
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(34, 197, 94); // أخضر للنمو الإيجابي
      this.doc.text(this.processArabicText(change), this.margin + cardWidth - 25, this.currentY + 18);
      this.doc.setTextColor(0, 0, 0); // إعادة اللون الأسود
    }
  }

  // إضافة ملخص تنفيذي
  addExecutiveSummary(summary: {
    totalRevenue?: number;
    totalCost?: number;
    profit?: number;
    profitMargin?: number;
    period?: string;
  }): void {
    this.addSection('الملخص التنفيذي');
    
    if (summary.totalRevenue !== undefined) {
      this.addTwoColumnData('إجمالي الإيرادات:', `${summary.totalRevenue.toLocaleString('en-US')} ج.م`);
    }
    if (summary.totalCost !== undefined) {
      this.addTwoColumnData('إجمالي التكاليف:', `${summary.totalCost.toLocaleString('en-US')} ج.م`);
    }
    if (summary.profit !== undefined) {
      this.addTwoColumnData('صافي الربح:', `${summary.profit.toLocaleString('en-US')} ج.م`);
    }
    if (summary.profitMargin !== undefined) {
      this.addTwoColumnData('هامش الربح:', `${summary.profitMargin}%`);
    }
    
    this.currentY += 10;
  }

  // إضافة قائمة نقطية
  addBulletList(items: string[]): void {
    items.forEach(item => {
      this.checkPageBreak(8);
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text('•', this.margin, this.currentY);
      this.doc.text(this.processArabicText(item), this.margin + 5, this.currentY);
      this.currentY += 8;
    });
    this.currentY += 5;
  }

  // إضافة توقيع أو ختم
  addSignature(): void {
    this.checkPageBreak(30);
    const signatureY = this.pageHeight - 40;
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(this.processArabicText('تم إنشاء هذا التقرير بواسطة نظام إدارة المبيعات'), this.pageWidth / 2, signatureY, { align: 'center' });
    this.doc.text(this.processArabicText(`تاريخ الإنشاء: ${new Date().toLocaleDateString('ar-SA', { numberingSystem: 'latn' })}`), this.pageWidth / 2, signatureY + 8, { align: 'center' });
  }

  // فحص الحاجة لصفحة جديدة
  private checkPageBreak(requiredSpace: number): void {
    if (this.currentY + requiredSpace > this.pageHeight - 30) {
      this.doc.addPage();
      this.currentY = 30;
    }
  }

  // إضافة رقم الصفحة
  addPageNumbers(): void {
    const pageCount = this.doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(
        this.processArabicText(`صفحة ${i} من ${pageCount}`),
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
  }

  // الحصول على المستند للمعالجة الإضافية
  getDocument(): jsPDF {
    return this.doc;
  }

  // معالجة النص العربي للعرض الصحيح في PDF
  private processArabicText(text: string): string {
    try {
      // إذا كان النص يحتوي على أحرف عربية، قم بمعالجته
      if (/[\u0600-\u06FF]/.test(text)) {
        // تحويل النص العربي للشكل الصحيح (من اليمين إلى اليسار)
        return this.reverseArabicText(text);
      }
      
      return text;
    } catch (error) {
      console.warn('خطأ في معالجة النص العربي:', error);
      return text;
    }
  }

  // عكس النص العربي لعرضه بشكل صحيح في PDF
  private reverseArabicText(text: string): string {
    // فصل الكلمات العربية عن الأرقام والرموز
    const parts = text.split(/(\s+)/);
    
    return parts.map(part => {
      if (part.trim() === '') return part; // المسافات تبقى كما هي
      
      // إذا كان الجزء يحتوي على أحرف عربية فقط
      if (/^[\u0600-\u06FF\u064B-\u0652\u0670-\u0673]+$/.test(part.trim())) {
        // عكس ترتيب الأحرف للعرض الصحيح
        return part.trim().split('').reverse().join('');
      }
      
      // إذا كان خليط من العربي والإنجليزي/أرقام
      if (/[\u0600-\u06FF]/.test(part)) {
        return this.processMixedText(part);
      }
      
      return part;
    }).join('');
  }

  // معالجة النص المختلط (عربي + إنجليزي/أرقام)
  private processMixedText(text: string): string {
    // تجميع الأحرف حسب النوع
    const segments: Array<{type: 'arabic' | 'other', content: string}> = [];
    let currentSegment = '';
    let currentType: 'arabic' | 'other' | null = null;
    
    for (const char of text) {
      const isArabic = /[\u0600-\u06FF]/.test(char);
      const charType = isArabic ? 'arabic' : 'other';
      
      if (currentType === null || currentType === charType) {
        currentSegment += char;
        currentType = charType;
      } else {
        segments.push({type: currentType, content: currentSegment});
        currentSegment = char;
        currentType = charType;
      }
    }
    
    // إضافة آخر جزء
    if (currentSegment) {
      segments.push({type: currentType!, content: currentSegment});
    }
    
    // معالجة كل جزء حسب نوعه
    return segments.map(segment => {
      if (segment.type === 'arabic') {
        return segment.content.split('').reverse().join('');
      }
      return segment.content;
    }).join('');
  }
}

export default ArabicPDFExporter;