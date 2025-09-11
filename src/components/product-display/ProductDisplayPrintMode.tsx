import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer, Download, ArrowRight } from "lucide-react";
import { useProductDisplay } from "@/contexts/ProductDisplayContext";
import { useProductDisplayExport } from "@/hooks/useProductDisplayExport";
import { Badge } from "@/components/ui/badge";
import { supabaseProductsToLocal } from "@/adapters/productAdapter";

const ProductDisplayPrintMode = memo(() => {
  const { filteredProducts, displayOption, getStats, setIsPrintMode, setIsExporting } = useProductDisplay();
  const { totalProducts, totalValue } = getStats();
  const { exportToPDF } = useProductDisplayExport();

  // تحويل المنتجات للتوافق مع دالة التصدير
  const convertedProducts = supabaseProductsToLocal(filteredProducts);

  const handleExportPDF = () => {
    exportToPDF(convertedProducts, displayOption, setIsExporting);
  };

  const handleBack = () => {
    setIsPrintMode(false);
  };

  const getDisplayTitle = () => {
    switch (displayOption) {
      case "selling": return "قائمة أسعار البيع";
      case "purchase": return "قائمة أسعار الشراء";
      case "stock": return "قائمة المخزون";
      default: return "قائمة المنتجات";
    }
  };

  const getPriceDisplay = (product: any) => {
    switch (displayOption) {
      case "selling": return `${product.price.toLocaleString()} ج.م`;
      case "purchase": return `${product.cost.toLocaleString()} ج.م`;
      case "stock": return `${product.price.toLocaleString()} ج.م`; // عرض السعر بدلاً من الكمية
      default: return "";
    }
  };

  return (
    <div className="print-mode">
      {/* أزرار التحكم - مخفية عند الطباعة */}
      <div className="no-print mb-4 flex gap-2">
        <Button onClick={handleBack} variant="outline">
          <ArrowRight className="w-4 h-4 ml-2" />
          العودة للصفحة السابقة
        </Button>
        <Button 
          onClick={handleExportPDF} 
          className="bg-blue-600 hover:bg-blue-700 text-white font-tajawal"
        >
          <Download className="w-4 h-4 ml-2" />
          تصدير كـ PDF
        </Button>
      </div>

      {/* محتوى الطباعة */}
      <div className="print-content">
        {/* رأس التقرير */}
        <div className="text-center mb-8 border-b-2 border-border pb-6">
          <h1 className="text-4xl font-bold mb-3 font-cairo text-primary">{getDisplayTitle()}</h1>
          <p className="text-xl text-muted-foreground mb-4 font-tajawal">
            تحليل شامل للمنتجات والأسعار
          </p>
          <div className="bg-muted/30 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-3 gap-4 text-sm font-tajawal">
              <div className="text-center">
                <div className="font-bold text-lg">{new Date().toLocaleDateString('ar-EG', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  numberingSystem: 'latn'
                })}</div>
                <div className="text-muted-foreground">تاريخ التقرير</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">{totalProducts}</div>
                <div className="text-muted-foreground">عدد المنتجات</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">{totalValue.toLocaleString()} ج.م</div>
                <div className="text-muted-foreground">
                  {displayOption === "selling" ? "إجمالي قيمة البيع" :
                   displayOption === "purchase" ? "إجمالي قيمة الشراء" : "إجمالي قيمة البيع"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* قسم المعلومات التفصيلية */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-primary border-b-2 border-primary pb-2 font-cairo">
            الملخص التنفيذي
          </h2>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-muted/20 rounded-lg p-4">
              <h3 className="font-bold text-lg mb-3 font-cairo">معلومات عامة</h3>
              <div className="space-y-2 text-sm font-tajawal">
                <div className="flex justify-between">
                  <span>نوع التقرير:</span>
                  <span className="font-bold">{getDisplayTitle()}</span>
                </div>
                <div className="flex justify-between">
                  <span>إجمالي المنتجات:</span>
                  <span className="font-bold">{totalProducts} منتج</span>
                </div>
                <div className="flex justify-between">
                  <span>المنتجات المتوفرة:</span>
                  <span className="font-bold text-green-600">
                    {filteredProducts.filter(p => p.stock > 0).length} منتج
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>المنتجات المنتهية:</span>
                  <span className="font-bold text-red-600">
                    {filteredProducts.filter(p => p.stock === 0).length} منتج
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-muted/20 rounded-lg p-4">
              <h3 className="font-bold text-lg mb-3 font-cairo">إحصائيات القيمة</h3>
              <div className="space-y-2 text-sm font-tajawal">
                <div className="flex justify-between">
                  <span>
                    {displayOption === "selling" ? "متوسط سعر البيع:" :
                     displayOption === "purchase" ? "متوسط سعر الشراء:" : "متوسط سعر البيع:"}
                  </span>
                  <span className="font-bold">
                    {totalProducts > 0 ? 
                      (totalValue / totalProducts).toLocaleString() + " ج.م"
                      : "0"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>أعلى قيمة:</span>
                  <span className="font-bold">
                    {filteredProducts.length > 0 ? 
                      Math.max(...filteredProducts.map(p => 
                        displayOption === "selling" ? p.price :
                        displayOption === "purchase" ? p.cost : p.price
                      )).toLocaleString() + " ج.م"
                      : "0"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>أقل قيمة:</span>
                  <span className="font-bold">
                    {filteredProducts.length > 0 ? 
                      Math.min(...filteredProducts.map(p => 
                        displayOption === "selling" ? p.price :
                        displayOption === "purchase" ? p.cost : p.price
                      )).toLocaleString() + " ج.م"
                      : "0"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* جدول المنتجات */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-primary border-b-2 border-primary pb-2 font-cairo">
            تفاصيل المنتجات
          </h2>
          
          <div className="overflow-hidden rounded-lg border border-border">
            {/* رأس الجدول */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-primary text-primary-foreground font-bold text-sm font-cairo">
              <div>اسم المنتج</div>
              <div className="text-center">
                {displayOption === "selling" ? "سعر البيع (ج.م)" :
                 displayOption === "purchase" ? "سعر الشراء (ج.م)" : 
                 displayOption === "stock" ? "سعر البيع (ج.م)" : "السعر"}
              </div>
              <div className="text-center">الفئة</div>
            </div>

            {/* صفوف المنتجات */}
            {filteredProducts.map((product, index) => (
              <div key={product.id} className={`grid grid-cols-3 gap-4 p-3 text-sm font-tajawal border-b border-border
                ${index % 2 === 0 ? 'bg-muted/20' : 'bg-background'}`}>
                <div className="font-medium">{product.name}</div>
                <div className="text-center font-semibold">
                  {getPriceDisplay(product)}
                </div>
                <div className="text-center">{product.category || "غير محدد"}</div>
              </div>
            ))}
          </div>
        </div>

        {/* تحليل الأداء */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-primary border-b-2 border-primary pb-2 font-cairo">
            تحليل الأداء
          </h2>
          <div className="bg-muted/20 rounded-lg p-4">
            <ul className="space-y-2 text-sm font-tajawal">
              <li>• إجمالي المنتجات المدرجة: <strong>{totalProducts}</strong> منتج</li>
              <li>• نسبة المنتجات المتوفرة: <strong>
                {totalProducts > 0 ? 
                  ((filteredProducts.filter(p => p.stock > 0).length / totalProducts) * 100).toFixed(1) 
                  : '0'}%
              </strong></li>
              <li>• 
                {displayOption === "selling" ? "إجمالي قيمة المخزون بأسعار البيع" :
                 displayOption === "purchase" ? "إجمالي قيمة المخزون بأسعار الشراء" : "إجمالي قيمة المخزون بأسعار البيع"}: 
                <strong> {totalValue.toLocaleString()} ج.م</strong>
              </li>
              <li>• أكثر الفئات تنوعاً: <strong>
                {filteredProducts.length > 0 ? 
                  [...new Set(filteredProducts.map(p => p.category).filter(Boolean))].join(', ') || 'غير محدد'
                  : 'لا توجد فئات'}
              </strong></li>
            </ul>
          </div>
        </div>

        {/* تذييل التقرير */}
        <div className="mt-12 pt-6 border-t-2 border-border text-center">
          <div className="bg-muted/20 rounded-lg p-4">
            <h3 className="font-bold text-lg mb-3 font-cairo">معلومات النظام</h3>
            <div className="text-sm text-muted-foreground font-tajawal space-y-1">
              <p>تم إنشاء هذا التقرير بواسطة <strong>نظام إدارة المخزون</strong></p>
              <p>تاريخ الإنشاء: <strong>{new Date().toLocaleDateString('ar-EG', { 
                numberingSystem: 'latn',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</strong></p>
              <p>نوع التقرير: <strong>{getDisplayTitle()}</strong></p>
            </div>
          </div>
        </div>
      </div>

      {/* استايلات الطباعة */}
      <style>{`
        @media print {
          /* إخفاء كل محتوى الصفحة */
          body > * {
            display: none !important;
          }
          
          /* إخفاء شريط العنوان والقوائم */
          header, nav, aside, footer, .sidebar, [data-sidebar], .app-sidebar {
            display: none !important;
          }
          
          /* إخفاء عناصر التطبيق الرئيسية */
          #root > div > *:not(.print-mode) {
            display: none !important;
          }
          
          /* إظهار وضع الطباعة فقط */
          .print-mode {
            display: block !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: white !important;
            z-index: 9999 !important;
          }
          
          /* إخفاء أزرار التحكم */
          .no-print {
            display: none !important;
          }
          
          /* تنسيق محتوى الطباعة */
          .print-content {
            display: block !important;
            position: relative !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 20px !important;
            background: white !important;
            color: black !important;
            font-family: 'Arial', sans-serif !important;
          }
          
          /* تنسيق عام للصفحة */
          html, body {
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          /* إعدادات الصفحة */
          @page {
            margin: 1cm;
            size: A4 portrait;
          }
          
          /* تحسين عرض الجدول للطباعة */
          .print-content .grid {
            page-break-inside: avoid;
          }
          
          /* منع كسر الصفحة داخل صفوف الجدول */
          .print-content .grid > div {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
});

ProductDisplayPrintMode.displayName = "ProductDisplayPrintMode";

export { ProductDisplayPrintMode };