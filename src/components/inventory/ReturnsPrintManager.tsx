import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Printer, FileText, Download } from "lucide-react";
import { useState } from "react";
import { Return } from "@/utils/returnsManager";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface ReturnsPrintManagerProps {
  returnData: Return;
  isOpen: boolean;
  onClose: () => void;
}

export function ReturnsPrintManager({ returnData, isOpen, onClose }: ReturnsPrintManagerProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  const generateReturnReceipt = () => {
    const receiptContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>قسيمة إرجاع - ${returnData.returnNumber}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            direction: rtl;
            background: white;
          }
          .receipt {
            max-width: 400px;
            margin: 0 auto;
            border: 2px solid #333;
            padding: 20px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .company-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .receipt-title {
            font-size: 18px;
            font-weight: bold;
            margin-top: 10px;
          }
          .info-section {
            margin-bottom: 20px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            border-bottom: 1px dotted #ccc;
            padding-bottom: 5px;
          }
          .label {
            font-weight: bold;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .items-table th,
          .items-table td {
            border: 1px solid #333;
            padding: 8px;
            text-align: center;
          }
          .items-table th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          .total-section {
            border-top: 2px solid #333;
            padding-top: 15px;
            margin-top: 20px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            border-top: 1px solid #ccc;
            padding-top: 15px;
            font-size: 12px;
            color: #666;
          }
          .signature-section {
            margin-top: 30px;
            display: flex;
            justify-content: space-between;
          }
          .signature-box {
            width: 150px;
            text-align: center;
          }
          .signature-line {
            border-top: 1px solid #333;
            margin-top: 30px;
            padding-top: 5px;
          }
          @media print {
            body { margin: 0; padding: 10px; }
            .receipt { border: none; box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="company-name">شركة عُمران للتجارة</div>
            <div class="receipt-title">قسيمة إرجاع</div>
            <div>رقم المرتجع: ${returnData.returnNumber}</div>
          </div>

          <div class="info-section">
            <div class="info-row">
              <span class="label">التاريخ:</span>
              <span>${format(new Date(returnData.date), 'dd/MM/yyyy', { locale: ar })}</span>
            </div>
            <div class="info-row">
              <span class="label">العميل:</span>
              <span>${returnData.customerName}</span>
            </div>
            <div class="info-row">
              <span class="label">الفاتورة الأصلية:</span>
              <span>${returnData.originalInvoiceNumber}</span>
            </div>
            <div class="info-row">
              <span class="label">سبب الإرجاع:</span>
              <span>${returnData.reason}</span>
            </div>
            <div class="info-row">
              <span class="label">الحالة:</span>
              <span>${
                returnData.status === 'pending' ? 'في الانتظار' :
                returnData.status === 'approved' ? 'موافق عليه' :
                returnData.status === 'processed' ? 'تم المعالجة' :
                returnData.status === 'rejected' ? 'مرفوض' : returnData.status
              }</span>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>المنتج</th>
                <th>الكمية</th>
                <th>السعر</th>
                <th>المجموع</th>
              </tr>
            </thead>
            <tbody>
              ${returnData.items.map(item => `
                <tr>
                  <td>${item.productName}</td>
                  <td>${item.quantity}</td>
                  <td>${item.unitPrice.toFixed(2)} ر.س</td>
                  <td>${item.total.toFixed(2)} ر.س</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-row">
              <span>المجموع الكلي:</span>
              <span>${returnData.totalAmount.toLocaleString()} ر.س</span>
            </div>
          </div>

          ${returnData.notes ? `
            <div class="info-section">
              <div class="info-row">
                <span class="label">ملاحظات:</span>
              </div>
              <div style="margin-top: 10px; padding: 10px; border: 1px solid #ccc; background: #f9f9f9;">
                ${returnData.notes}
              </div>
            </div>
          ` : ''}

          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line">توقيع العميل</div>
            </div>
            <div class="signature-box">
              <div class="signature-line">توقيع المندوب</div>
            </div>
          </div>

          <div class="footer">
            <p>شكراً لثقتكم بنا</p>
            <p>تاريخ الطباعة: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ar })}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return receiptContent;
  };

  const handlePrint = () => {
    setIsPrinting(true);
    
    try {
      const receiptContent = generateReturnReceipt();
      const printWindow = window.open('', '_blank');
      
      if (printWindow) {
        printWindow.document.write(receiptContent);
        printWindow.document.close();
        
        printWindow.onload = () => {
          printWindow.print();
          printWindow.onafterprint = () => {
            printWindow.close();
            setIsPrinting(false);
          };
        };
      }
    } catch (error) {
      console.error('Error printing receipt:', error);
      setIsPrinting(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsPrinting(true);
    
    try {
      // استخدام Enhanced PDF Exporter للحصول على جودة أفضل
      const { EnhancedArabicPDFExporter } = await import('@/utils/enhancedArabicPdfExporter');
      const pdfExporter = new EnhancedArabicPDFExporter();
      
      // إعداد محتوى قسيمة الإرجاع
      const content = {
        title: 'قسيمة إرجاع',
        subtitle: `رقم المرتجع: ${returnData.returnNumber}`,
        sections: [
          {
            title: 'معلومات المرتجع',
            data: [
              { label: 'رقم المرتجع', value: returnData.returnNumber },
              { label: 'التاريخ', value: format(new Date(returnData.date), 'dd/MM/yyyy', { locale: ar }) },
              { label: 'العميل', value: returnData.customerName },
              { label: 'الفاتورة الأصلية', value: returnData.originalInvoiceNumber },
              { label: 'سبب الإرجاع', value: returnData.reason },
              { label: 'الحالة', value: returnData.status === 'pending' ? 'في الانتظار' :
                                            returnData.status === 'approved' ? 'موافق عليه' :
                                            returnData.status === 'processed' ? 'تم المعالجة' :
                                            returnData.status === 'rejected' ? 'مرفوض' : returnData.status }
            ]
          }
        ],
        tables: [
          {
            title: 'أصناف المرتجع',
            headers: ['المنتج', 'الكمية', 'السعر', 'المجموع'],
            rows: returnData.items.map(item => [
              item.productName,
              item.quantity.toString(),
              `${item.unitPrice.toFixed(2)} ر.س`,
              `${item.total.toFixed(2)} ر.س`
            ])
          }
        ]
      };
      
      await pdfExporter.addArabicContent(content);
      
      // إضافة معلومات إضافية
      pdfExporter.addReportInfo(
        format(new Date(), 'dd/MM/yyyy', { locale: ar }),
        'قسيمة إرجاع'
      );
      
      // حفظ ملف PDF
      pdfExporter.save(`return-receipt-${returnData.returnNumber}.pdf`);
      setIsPrinting(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      
      // في حالة فشل PDF، استخدم HTML كبديل
      const receiptContent = generateReturnReceipt();
      const blob = new Blob([receiptContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `return-receipt-${returnData.returnNumber}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      setIsPrinting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            طباعة قسيمة الإرجاع
          </DialogTitle>
          <DialogDescription>
            اختر طريقة الحصول على قسيمة إرجاع المنتج
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">معلومات المرتجع</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">رقم المرتجع:</span>
                <span className="font-medium">{returnData.returnNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">العميل:</span>
                <span className="font-medium">{returnData.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">المبلغ:</span>
                <span className="font-medium">{returnData.totalAmount.toLocaleString()} ر.س</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadPDF}
            disabled={isPrinting}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            تحميل
          </Button>
          <Button
            onClick={handlePrint}
            disabled={isPrinting}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            {isPrinting ? 'جاري الطباعة...' : 'طباعة'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}