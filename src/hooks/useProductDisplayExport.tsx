import { useCallback } from "react";
import { Product } from "@/types/inventory";
import { DisplayOption } from "@/contexts/ProductDisplayContext";
import { ArabicPDFExporter } from "@/utils/arabicPdfExporter";

export const useProductDisplayExport = () => {
  const exportToPDF = useCallback(async (
    filteredProducts: Product[],
    displayOption: DisplayOption,
    setIsExporting: (isExporting: boolean) => void
  ) => {
    if (filteredProducts.length === 0) {
      alert("لا توجد منتجات للتصدير");
      return;
    }

    setIsExporting(true);
    
    try {
      // إنشاء نافذة جديدة للطباعة (نفس النظام المستخدم في تقرير الأرباح)
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('يرجى السماح بفتح النوافذ المنبثقة لتصدير التقرير');
        setIsExporting(false);
        return;
      }

      // إعداد العنوان والمعلومات حسب نوع العرض
      const titles = {
        selling: "قائمة أسعار البيع للمنتجات",
        purchase: "قائمة أسعار الشراء للمنتجات", 
        stock: "قائمة المخزون والكميات"
      };
      
      const subtitles = {
        selling: "عرض جميع المنتجات مع أسعار البيع",
        purchase: "عرض جميع المنتجات مع أسعار الشراء",
        stock: "عرض جميع المنتجات مع الكميات المتاحة"
      };

      // إعداد بيانات الجدول حسب نوع العرض
      let headers: string[] = [];
      let rows: string[] = [];
      
      switch (displayOption) {
        case "selling":
          headers = ["اسم المنتج", "سعر البيع", "الفئة"];
          rows = filteredProducts.map(product => `
            <tr>
              <td>${product.name}</td>
              <td>${product.price.toLocaleString()} ج.م</td>
              <td>${product.category || "غير محدد"}</td>
            </tr>
          `);
          break;
          
        case "purchase":
          headers = ["اسم المنتج", "سعر الشراء", "الفئة"];
          rows = filteredProducts.map(product => `
            <tr>
              <td>${product.name}</td>
              <td>${product.cost.toLocaleString()} ج.م</td>
              <td>${product.category || "غير محدد"}</td>
            </tr>
          `);
          break;
          
        case "stock":
          headers = ["اسم المنتج", "سعر البيع", "الفئة"];
          rows = filteredProducts.map(product => `
            <tr>
              <td>${product.name}</td>
              <td>${product.price.toLocaleString()} ج.م</td>
              <td>${product.category || "غير محدد"}</td>
            </tr>
          `);
          break;
      }

      // حساب الإحصائيات
      let totalValue = 0;
      let statisticsText = "";
      
      if (displayOption === "selling") {
        totalValue = filteredProducts.reduce((sum, product) => sum + (product.price * product.stock), 0);
        statisticsText = `إجمالي قيمة المخزون (بأسعار البيع): ${totalValue.toLocaleString()} ج.م`;
      } else if (displayOption === "purchase") {
        totalValue = filteredProducts.reduce((sum, product) => sum + (product.cost * product.stock), 0);
        statisticsText = `إجمالي قيمة المخزون (بأسعار الشراء): ${totalValue.toLocaleString()} ج.م`;
      } else if (displayOption === "stock") {
        const totalStock = filteredProducts.reduce((sum, product) => sum + product.stock, 0);
        statisticsText = `إجمالي الكميات: ${totalStock.toLocaleString()}`;
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <title>${titles[displayOption]}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
            body { 
              font-family: 'Cairo', Arial, sans-serif; 
              direction: rtl; 
              margin: 20px;
              color: #333;
            }
            .header { text-align: center; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .subtitle { font-size: 16px; color: #666; margin-bottom: 20px; }
            .info { margin-bottom: 20px; }
            .section { margin: 30px 0; }
            .section-title { 
              font-size: 18px; 
              font-weight: bold; 
              border-bottom: 2px solid #333; 
              padding-bottom: 5px; 
              margin-bottom: 15px; 
            }
            .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0; }
            .stat-item { display: flex; justify-content: space-between; padding: 5px 0; }
            .stat-label { font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">${titles[displayOption]}</h1>
            <div class="subtitle">${subtitles[displayOption]}</div>
            <div class="info">
               <div>تاريخ التقرير: ${new Date().toLocaleDateString('en-GB')}</div>
              <div>عدد المنتجات: ${filteredProducts.length}</div>
            </div>
          </div>

          <div class="section">
            <h2 class="section-title">الملخص الإحصائي</h2>
            <div class="stats">
              <div class="stat-item">
                <span class="stat-label">إجمالي عدد المنتجات:</span>
                <span>${filteredProducts.length}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">${statisticsText}</span>
                <span></span>
              </div>
            </div>
          </div>

          <div class="section">
            <h2 class="section-title">بيانات المنتجات</h2>
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

          <div class="footer">
            <p>تم إنشاء هذا التقرير بواسطة نظام إدارة المبيعات</p>
             <p>تاريخ الإنشاء: ${new Date().toLocaleString('en-GB')}</p>
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
      
    } catch (error) {
      console.error('خطأ في تصدير PDF:', error);
      alert('حدث خطأ أثناء تصدير الملف');
    } finally {
      setIsExporting(false);
    }
  }, []);

  return { exportToPDF };
};