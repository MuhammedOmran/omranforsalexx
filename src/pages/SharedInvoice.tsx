import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Printer, Clock, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { InvoicePrintData } from '@/components/ui/enhanced-invoice-print';

const SharedInvoice = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const { toast } = useToast();
  const [invoiceData, setInvoiceData] = useState<InvoicePrintData | null>(null);
  const [shareData, setShareData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSharedInvoice = async () => {
      if (!shareId) return;

      try {
        // جلب بيانات المشاركة
        const { data, error } = await supabase
          .from('shared_products')
          .select('*')
          .eq('share_id', shareId)
          .eq('display_option', 'invoice')
          .single();

        if (error) {
          console.error('Error loading shared invoice:', error);
          setError('فشل في تحميل الفاتورة المشتركة');
          return;
        }

        if (!data) {
          setError('الفاتورة غير موجودة أو منتهية الصلاحية');
          return;
        }

        // التحقق من انتهاء الصلاحية
        const now = new Date();
        const expiresAt = new Date(data.expires_at);
        
        if (now > expiresAt) {
          setError('انتهت صلاحية رابط المشاركة');
          return;
        }

        // التحقق من عدد المشاهدات
        if (data.max_views && data.views >= data.max_views) {
          setError('تم تجاوز الحد الأقصى لعدد المشاهدات');
          return;
        }

        setShareData(data);
        setInvoiceData(data.products as unknown as InvoicePrintData);

        // تحديث عدد المشاهدات
        try {
          const { error: updateError } = await supabase
            .from('shared_products')
            .update({ views: data.views + 1 })
            .eq('share_id', shareId);

          if (updateError) {
            console.error('Error updating view count:', updateError);
          }
        } catch (err) {
          console.error('Error updating view count:', err);
        }

      } catch (error) {
        console.error('Error loading shared invoice:', error);
        setError('حدث خطأ أثناء تحميل الفاتورة');
      } finally {
        setLoading(false);
      }
    };

    loadSharedInvoice();
  }, [shareId]);

  const handlePrint = () => {
    if (!invoiceData) return;

    const printContent = generatePrintHTML();
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const generatePrintHTML = (): string => {
    if (!invoiceData || !shareData) return '';

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
            margin: 15mm;
          }
          
          body {
            font-family: 'Cairo', 'IBM Plex Sans Arabic', 'Arial', sans-serif;
            font-size: 14px;
            line-height: 1.6;
            color: #333;
            direction: rtl;
            background: white;
          }
          
          .invoice-container {
            max-width: 100%;
            margin: 0 auto;
            background: white;
            padding: 20px;
          }
          
          .header {
            text-align: center;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          
          .invoice-title {
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
          }
          
          .invoice-number {
            font-size: 18px;
            color: #666;
          }
          
          .invoice-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
          }
          
          .detail-section {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #2563eb;
          }
          
          .detail-title {
            font-size: 16px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 15px;
          }
          
          .detail-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 5px 0;
          }
          
          .detail-label {
            font-weight: 600;
            color: #374151;
          }
          
          .detail-value {
            color: #111827;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          
          .items-table th {
            background: #2563eb;
            color: white;
            font-weight: bold;
            padding: 15px 10px;
            text-align: center;
          }
          
          .items-table td {
            padding: 12px 10px;
            text-align: center;
            border-bottom: 1px solid #e5e7eb;
          }
          
          .items-table tbody tr:nth-child(even) {
            background: #f9fafb;
          }
          
          .items-table tbody tr:hover {
            background: #e0f2fe;
          }
          
          .totals-section {
            background: #f0f9ff;
            border: 2px solid #2563eb;
            border-radius: 12px;
            padding: 20px;
            margin: 30px 0;
            float: left;
            min-width: 300px;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 16px;
          }
          
          .total-row.final {
            font-size: 20px;
            font-weight: bold;
            color: #2563eb;
            border-top: 2px solid #2563eb;
            padding-top: 15px;
            margin-top: 15px;
          }
          
          .footer {
            clear: both;
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 12px;
          }
          
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <div class="invoice-title">🧾 فاتورة مبيعات</div>
            <div class="invoice-number">رقم الفاتورة: ${invoiceData.id}</div>
          </div>

          <div class="invoice-details">
            <div class="detail-section">
              <div class="detail-title">📋 معلومات الفاتورة</div>
              <div class="detail-item">
                <span class="detail-label">رقم الفاتورة:</span>
                <span class="detail-value">${invoiceData.id}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">التاريخ:</span>
                <span class="detail-value">${new Date(invoiceData.date).toLocaleDateString('ar-EG')}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">الحالة:</span>
                <span class="detail-value">${invoiceData.status === 'paid' ? '✅ مدفوعة' : '⏳ غير مدفوعة'}</span>
              </div>
              ${invoiceData.paymentMethod ? `
                <div class="detail-item">
                  <span class="detail-label">طريقة الدفع:</span>
                  <span class="detail-value">${invoiceData.paymentMethod}</span>
                </div>
              ` : ''}
            </div>

            <div class="detail-section">
              <div class="detail-title">👤 معلومات العميل</div>
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
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>المنتج</th>
                <th>الكمية</th>
                <th>سعر الوحدة</th>
                <th>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              ${invoiceData.items.map(item => `
                <tr>
                  <td>${item.product_name || item.name || 'غير محدد'}</td>
                  <td>${item.quantity}</td>
                  <td>${(item.unit_price || item.price || 0).toLocaleString('ar-SA')} ج.م</td>
                  <td>${(item.total_price || item.total || 0).toLocaleString('ar-SA')} ج.م</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals-section">
            <div class="total-row">
              <span>المجموع الفرعي:</span>
              <span>${invoiceData.subtotal.toLocaleString('ar-SA')} ج.م</span>
            </div>
            ${invoiceData.discountAmount && invoiceData.discountAmount > 0 ? `
              <div class="total-row">
                <span>الخصم:</span>
                <span>-${invoiceData.discountAmount.toLocaleString('ar-SA')} ج.م</span>
              </div>
            ` : ''}
            ${invoiceData.taxAmount && invoiceData.taxAmount > 0 ? `
              <div class="total-row">
                <span>الضريبة:</span>
                <span>${invoiceData.taxAmount.toLocaleString('ar-SA')} ج.م</span>
              </div>
            ` : ''}
            <div class="total-row final">
              <span>المجموع الإجمالي:</span>
              <span>${invoiceData.total.toLocaleString('ar-SA')} ج.م</span>
            </div>
          </div>

          ${invoiceData.notes ? `
            <div class="detail-section" style="clear: both; margin-top: 30px;">
              <div class="detail-title">📝 ملاحظات</div>
              <p>${invoiceData.notes}</p>
            </div>
          ` : ''}

          <div class="footer">
            <p>تم إنشاء هذه الفاتورة في: ${new Date().toLocaleDateString('ar-EG')} - ${new Date().toLocaleTimeString('ar-EG')}</p>
            <p>مشتركة عبر نظام SPADEX</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">جاري تحميل الفاتورة...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !invoiceData || !shareData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-red-700 mb-2">خطأ في تحميل الفاتورة</h2>
            <p className="text-red-600">{error || 'حدث خطأ غير متوقع'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <Card className="mb-6 border-blue-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold">🧾 {shareData.name}</CardTitle>
                <p className="text-blue-100 mt-1">فاتورة مشتركة - رقم {invoiceData.id}</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <User className="w-3 h-3 mr-1" />
                  {invoiceData.customerName}
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <Clock className="w-3 h-3 mr-1" />
                  {shareData.views} مشاهدة
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Invoice Content */}
        <Card className="mb-6 shadow-lg">
          <CardContent className="p-6">
            {/* Invoice Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg border-r-4 border-blue-500">
                <h3 className="font-bold text-blue-800 mb-3 flex items-center">
                  📋 معلومات الفاتورة
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">رقم الفاتورة:</span>
                    <span className="font-medium">{invoiceData.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">التاريخ:</span>
                    <span className="font-medium">{new Date(invoiceData.date).toLocaleDateString('ar-EG')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">الحالة:</span>
                    <span className={`font-medium ${invoiceData.status === 'paid' ? 'text-green-600' : 'text-orange-600'}`}>
                      {invoiceData.status === 'paid' ? '✅ مدفوعة' : '⏳ غير مدفوعة'}
                    </span>
                  </div>
                  {invoiceData.paymentMethod && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">طريقة الدفع:</span>
                      <span className="font-medium">{invoiceData.paymentMethod}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border-r-4 border-green-500">
                <h3 className="font-bold text-green-800 mb-3 flex items-center">
                  👤 معلومات العميل
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">اسم العميل:</span>
                    <span className="font-medium">{invoiceData.customerName}</span>
                  </div>
                  {invoiceData.customerPhone && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">رقم الهاتف:</span>
                      <span className="font-medium">{invoiceData.customerPhone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto mb-8">
              <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <th className="border border-gray-300 px-4 py-3 text-center font-bold">المنتج</th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-bold">الكمية</th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-bold">سعر الوحدة</th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-bold">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.items.map((item, index) => (
                    <tr key={index} className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50 transition-colors`}>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        {item.product_name || item.name || 'غير محدد'}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        {item.quantity}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        {(item.unit_price || item.price || 0).toLocaleString('ar-SA')} ج.م
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center font-medium">
                        {(item.total_price || item.total || 0).toLocaleString('ar-SA')} ج.م
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-lg border-2 border-blue-200 max-w-md ml-auto">
              <h3 className="font-bold text-blue-800 mb-4 text-center">💰 ملخص المبالغ</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">المجموع الفرعي:</span>
                  <span className="font-medium">{invoiceData.subtotal.toLocaleString('ar-SA')} ج.م</span>
                </div>
                {invoiceData.discountAmount && invoiceData.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>الخصم:</span>
                    <span>-{invoiceData.discountAmount.toLocaleString('ar-SA')} ج.م</span>
                  </div>
                )}
                {invoiceData.taxAmount && invoiceData.taxAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">الضريبة:</span>
                    <span className="font-medium">{invoiceData.taxAmount.toLocaleString('ar-SA')} ج.م</span>
                  </div>
                )}
                <div className="border-t-2 border-blue-300 pt-3">
                  <div className="flex justify-between text-lg font-bold text-blue-800">
                    <span>المجموع الإجمالي:</span>
                    <span>{invoiceData.total.toLocaleString('ar-SA')} ج.م</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoiceData.notes && (
              <div className="mt-8 bg-yellow-50 p-4 rounded-lg border-r-4 border-yellow-400">
                <h3 className="font-bold text-yellow-800 mb-2">📝 ملاحظات:</h3>
                <p className="text-gray-700">{invoiceData.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center">
          <Button onClick={handlePrint} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
            <Printer className="w-4 h-4" />
            طباعة الفاتورة
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>تم إنشاء هذه الفاتورة المشتركة في: {new Date(shareData.created_at).toLocaleDateString('ar-EG')}</p>
          <p className="mt-1">مشتركة عبر نظام SPADEX للمبيعات</p>
        </div>
      </div>
    </div>
  );
};

export default SharedInvoice;