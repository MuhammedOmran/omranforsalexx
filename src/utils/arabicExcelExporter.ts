import * as XLSX from 'xlsx';

export class ArabicExcelExporter {
  private workbook: XLSX.WorkBook;
  private worksheets: { [key: string]: XLSX.WorkSheet } = {};

  constructor() {
    this.workbook = XLSX.utils.book_new();
  }

  // إضافة ورقة عمل جديدة
  addWorksheet(name: string): void {
    this.worksheets[name] = XLSX.utils.aoa_to_sheet([]);
    XLSX.utils.book_append_sheet(this.workbook, this.worksheets[name], name);
  }

  // إضافة عنوان رئيسي
  addTitle(worksheet: string, title: string, row: number = 0): number {
    const ws = this.worksheets[worksheet];
    if (!ws) return row;

    // دمج الخلايا للعنوان الرئيسي
    const titleRow = [title];
    XLSX.utils.sheet_add_aoa(ws, [titleRow], { origin: `A${row + 1}` });
    
    // تنسيق العنوان
    const cellRef = XLSX.utils.encode_cell({ r: row, c: 0 });
    if (!ws[cellRef]) ws[cellRef] = { v: title };
    ws[cellRef].s = {
      font: { bold: true, sz: 16 },
      alignment: { horizontal: 'center', vertical: 'center' },
      fill: { fgColor: { rgb: "366092" } }
    };

    return row + 2; // إرجاع الصف التالي مع مسافة
  }

  // إضافة معلومات التقرير
  addReportInfo(worksheet: string, reportDate: string, period: string, startRow: number): number {
    const ws = this.worksheets[worksheet];
    if (!ws) return startRow;

    const infoData = [
      ['تاريخ التقرير:', reportDate],
      ['الفترة الزمنية:', period],
      ['', ''] // سطر فارغ
    ];

    XLSX.utils.sheet_add_aoa(ws, infoData, { origin: `A${startRow + 1}` });

    // تنسيق معلومات التقرير
    for (let i = 0; i < 2; i++) {
      const labelRef = XLSX.utils.encode_cell({ r: startRow + i, c: 0 });
      const valueRef = XLSX.utils.encode_cell({ r: startRow + i, c: 1 });
      
      if (ws[labelRef]) {
        ws[labelRef].s = { font: { bold: true }, alignment: { horizontal: 'right' } };
      }
      if (ws[valueRef]) {
        ws[valueRef].s = { alignment: { horizontal: 'left' } };
      }
    }

    return startRow + 3;
  }

  // إضافة قسم جديد
  addSection(worksheet: string, title: string, startRow: number): number {
    const ws = this.worksheets[worksheet];
    if (!ws) return startRow;

    const sectionData = [
      [title],
      [''] // سطر فارغ
    ];

    XLSX.utils.sheet_add_aoa(ws, sectionData, { origin: `A${startRow + 1}` });

    // تنسيق عنوان القسم
    const cellRef = XLSX.utils.encode_cell({ r: startRow, c: 0 });
    if (ws[cellRef]) {
      ws[cellRef].s = {
        font: { bold: true, sz: 14 },
        alignment: { horizontal: 'right' },
        fill: { fgColor: { rgb: "D9E2F3" } }
      };
    }

    return startRow + 2;
  }

  // إضافة بيانات في عمودين
  addKeyValueData(worksheet: string, data: { [key: string]: string | number }, startRow: number): number {
    const ws = this.worksheets[worksheet];
    if (!ws) return startRow;

    const kvData = Object.entries(data).map(([key, value]) => [key, value]);
    XLSX.utils.sheet_add_aoa(ws, kvData, { origin: `A${startRow + 1}` });

    // تنسيق البيانات
    kvData.forEach((_, index) => {
      const labelRef = XLSX.utils.encode_cell({ r: startRow + index, c: 0 });
      const valueRef = XLSX.utils.encode_cell({ r: startRow + index, c: 1 });
      
      if (ws[labelRef]) {
        ws[labelRef].s = { 
          font: { bold: true }, 
          alignment: { horizontal: 'right' },
          fill: { fgColor: { rgb: "F2F2F2" } }
        };
      }
      if (ws[valueRef]) {
        ws[valueRef].s = { 
          alignment: { horizontal: 'left' },
          numFmt: typeof data[Object.keys(data)[index]] === 'number' ? '#,##0' : '@'
        };
      }
    });

    return startRow + kvData.length + 1;
  }

  // إضافة جدول مع العناوين
  addTable(worksheet: string, headers: string[], rows: (string | number)[][], startRow: number): number {
    const ws = this.worksheets[worksheet];
    if (!ws) return startRow;

    // إضافة العناوين
    XLSX.utils.sheet_add_aoa(ws, [headers], { origin: `A${startRow + 1}` });
    
    // تنسيق العناوين
    headers.forEach((_, colIndex) => {
      const cellRef = XLSX.utils.encode_cell({ r: startRow, c: colIndex });
      if (ws[cellRef]) {
        ws[cellRef].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          alignment: { horizontal: 'center', vertical: 'center' },
          fill: { fgColor: { rgb: "4472C4" } },
          border: {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          }
        };
      }
    });

    // إضافة البيانات
    if (rows.length > 0) {
      XLSX.utils.sheet_add_aoa(ws, rows, { origin: `A${startRow + 2}` });
      
      // تنسيق البيانات
      rows.forEach((row, rowIndex) => {
        row.forEach((_, colIndex) => {
          const cellRef = XLSX.utils.encode_cell({ r: startRow + 1 + rowIndex, c: colIndex });
          if (ws[cellRef]) {
            ws[cellRef].s = {
              alignment: { horizontal: 'center', vertical: 'center' },
              border: {
                top: { style: 'thin' },
                bottom: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' }
              },
              fill: { 
                fgColor: { rgb: rowIndex % 2 === 0 ? "FFFFFF" : "F8F9FA" } 
              }
            };

            // تنسيق الأرقام
            if (typeof row[colIndex] === 'number') {
              ws[cellRef].s.numFmt = '#,##0';
            }
          }
        });
      });
    }

    return startRow + rows.length + 3; // العناوين + البيانات + مسافة
  }

  // إضافة ملخص إحصائي
  addSummaryStats(worksheet: string, stats: { [key: string]: number | string }, startRow: number): number {
    const ws = this.worksheets[worksheet];
    if (!ws) return startRow;

    // إضافة عنوان الملخص
    let currentRow = this.addSection(worksheet, 'الملخص الإحصائي', startRow);
    
    // إضافة الإحصائيات في شكل جدول
    const statsHeaders = ['المؤشر', 'القيمة'];
    const statsRows = Object.entries(stats).map(([key, value]) => [
      key, 
      typeof value === 'number' ? value.toLocaleString() : value
    ]);

    return this.addTable(worksheet, statsHeaders, statsRows, currentRow);
  }

  // إضافة رسوم بيانية (كنص وصفي)
  addChartDescription(worksheet: string, title: string, description: string, startRow: number): number {
    const ws = this.worksheets[worksheet];
    if (!ws) return startRow;

    const chartData = [
      [title],
      ['الوصف:', description],
      ['ملاحظة: يمكن إنشاء الرسوم البيانية من البيانات أعلاه في Excel'],
      [''] // سطر فارغ
    ];

    XLSX.utils.sheet_add_aoa(ws, chartData, { origin: `A${startRow + 1}` });

    // تنسيق وصف الرسم البياني
    const titleRef = XLSX.utils.encode_cell({ r: startRow, c: 0 });
    if (ws[titleRef]) {
      ws[titleRef].s = {
        font: { bold: true, sz: 12 },
        alignment: { horizontal: 'right' },
        fill: { fgColor: { rgb: "E7E6E6" } }
      };
    }

    return startRow + 4;
  }

  // إضافة توصيات وملاحظات
  addRecommendations(worksheet: string, recommendations: string[], startRow: number): number {
    const ws = this.worksheets[worksheet];
    if (!ws) return startRow;

    let currentRow = this.addSection(worksheet, 'التوصيات والملاحظات', startRow);
    
    const recData = recommendations.map((rec, index) => [`${index + 1}.`, rec]);
    XLSX.utils.sheet_add_aoa(ws, recData, { origin: `A${currentRow + 1}` });

    // تنسيق التوصيات
    recommendations.forEach((_, index) => {
      const numRef = XLSX.utils.encode_cell({ r: currentRow + index, c: 0 });
      const textRef = XLSX.utils.encode_cell({ r: currentRow + index, c: 1 });
      
      if (ws[numRef]) {
        ws[numRef].s = { font: { bold: true }, alignment: { horizontal: 'center' } };
      }
      if (ws[textRef]) {
        ws[textRef].s = { alignment: { horizontal: 'right', wrapText: true } };
      }
    });

    return currentRow + recommendations.length + 1;
  }

  // تعديل عرض الأعمدة تلقائياً
  autoFitColumns(worksheet: string): void {
    const ws = this.worksheets[worksheet];
    if (!ws) return;

    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    const colWidths: number[] = [];

    for (let col = range.s.c; col <= range.e.c; col++) {
      let maxWidth = 10; // الحد الأدنى للعرض
      
      for (let row = range.s.r; row <= range.e.r; row++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = ws[cellRef];
        
        if (cell && cell.v) {
          const cellValue = cell.v.toString();
          const cellWidth = cellValue.length + 2; // إضافة مسافة إضافية
          maxWidth = Math.max(maxWidth, cellWidth);
        }
      }
      
      colWidths[col] = Math.min(maxWidth, 50); // الحد الأقصى 50 حرف
    }

    ws['!cols'] = colWidths.map(width => ({ width }));
  }

  // إضافة تذييل
  addFooter(worksheet: string): void {
    const ws = this.worksheets[worksheet];
    if (!ws) return;

    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    const footerRow = range.e.r + 3;

    const footerData = [
      [''],
      [`تم إنشاء هذا التقرير بواسطة نظام إدارة المبيعات`],
      [`تاريخ الإنشاء: ${new Date().toLocaleDateString('ar-SA')}`],
      [`الوقت: ${new Date().toLocaleTimeString('ar-SA')}`]
    ];

    XLSX.utils.sheet_add_aoa(ws, footerData, { origin: `A${footerRow + 1}` });

    // تنسيق التذييل
    for (let i = 1; i < footerData.length; i++) {
      const cellRef = XLSX.utils.encode_cell({ r: footerRow + i, c: 0 });
      if (ws[cellRef]) {
        ws[cellRef].s = {
          font: { italic: true, sz: 10 },
          alignment: { horizontal: 'center' }
        };
      }
    }
  }

  // حفظ الملف
  save(filename: string): void {
    // تطبيق التنسيق النهائي على جميع الأوراق
    Object.keys(this.worksheets).forEach(sheetName => {
      this.autoFitColumns(sheetName);
      this.addFooter(sheetName);
    });

    // تصدير الملف
    XLSX.writeFile(this.workbook, filename);
  }

  // إنشاء ملف Excel من البيانات الخام
  static createQuickExport(
    data: any[][],
    headers: string[],
    filename: string,
    sheetName: string = 'التقرير'
  ): void {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    
    // تنسيق العناوين
    headers.forEach((_, colIndex) => {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: colIndex });
      if (ws[cellRef]) {
        ws[cellRef].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "4472C4" } },
          alignment: { horizontal: 'center' }
        };
      }
    });

    // تعديل عرض الأعمدة
    const colWidths = headers.map(() => ({ width: 20 }));
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename);
  }
}

export default ArabicExcelExporter;