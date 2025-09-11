/**
 * مثال توضيحي لتكامل إعدادات الشركة مع طباعة الفواتير
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InvoicePrintTemplate } from '@/components/ui/invoice-print-template';
import { useToast } from '@/hooks/use-toast';

const InvoiceIntegrationExample = () => {
  const { toast } = useToast();
  const [showExample, setShowExample] = useState(false);

  // مثال على بيانات فاتورة
  const sampleInvoiceData = {
    id: 'INV-2024-001',
    customerName: 'أحمد محمد علي',
    customerPhone: '05555555555',
    date: new Date().toISOString(),
    items: [
      {
        id: '1',
        productName: 'منتج تجريبي أول',
        quantity: 2,
        price: 150,
        total: 300
      },
      {
        id: '2',
        productName: 'منتج تجريبي ثاني',
        quantity: 1,
        price: 200,
        total: 200
      }
    ],
    total: 500,
    subtotal: 500,
    taxAmount: 0,
    discountAmount: 0,
    notes: 'هذه فاتورة تجريبية لاختبار التكامل مع إعدادات الشركة',
    paymentMethod: 'نقداً',
    status: 'مدفوعة'
  };

  // قراءة إعدادات الشركة الحالية
  const getCompanySettings = () => {
    try {
      const saved = localStorage.getItem('company_settings');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  };

  const companySettings = getCompanySettings();

  return (
    <div className="space-y-6 p-6" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle>مثال على تكامل إعدادات الشركة مع الفواتير</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">إعدادات الشركة الحالية:</h4>
            {companySettings ? (
              <div className="text-sm text-blue-700 space-y-1">
                <p><strong>الاسم العربي:</strong> {companySettings.nameAr || 'غير محدد'}</p>
                <p><strong>الاسم الإنجليزي:</strong> {companySettings.name || 'غير محدد'}</p>
                <p><strong>العنوان:</strong> {companySettings.address || 'غير محدد'}</p>
                <p><strong>الهاتف:</strong> {companySettings.phone || 'غير محدد'}</p>
                <p><strong>البريد الإلكتروني:</strong> {companySettings.email || 'غير محدد'}</p>
                <p><strong>الرقم الضريبي:</strong> {companySettings.taxNumber || 'غير محدد'}</p>
              </div>
            ) : (
              <p className="text-blue-700">لا توجد إعدادات شركة محفوظة. يرجى الانتقال إلى الإعدادات لتحديد بيانات الشركة.</p>
            )}
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2">كيف يعمل التكامل:</h4>
            <ul className="text-sm text-green-700 space-y-1 list-disc list-inside">
              <li>عند تغيير إعدادات الشركة، تظهر التغييرات فوراً في جميع الفواتير الجديدة</li>
              <li>لا حاجة لإعادة إدخال بيانات الشركة في كل فاتورة</li>
              <li>تحديث مركزي واحد يؤثر على جميع قوالب الطباعة</li>
              <li>يعمل مع جميع أنواع القوالب: القياسي، الحراري، الإيصالات، والتفصيلي</li>
            </ul>
          </div>

          <Button 
            onClick={() => setShowExample(!showExample)}
            variant={showExample ? "secondary" : "default"}
          >
            {showExample ? 'إخفاء المثال' : 'عرض مثال الفاتورة'}
          </Button>

          {showExample && (
            <Card className="border-2 border-dashed border-gray-300">
              <CardHeader>
                <CardTitle>فاتورة تجريبية - ستستخدم إعدادات الشركة الحالية</CardTitle>
              </CardHeader>
              <CardContent>
                <InvoicePrintTemplate
                  invoiceData={sampleInvoiceData}
                  onPrint={(templateId) => {
                    toast({
                      title: "تم إرسال الطباعة",
                      description: `تم طباعة الفاتورة التجريبية باستخدام ${templateId} مع بيانات الشركة المحفوظة`
                    });
                  }}
                />
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceIntegrationExample;