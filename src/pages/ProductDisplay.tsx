import { SEOManager } from "@/components/SEO/SEOManager";
import { ProductDisplayProvider } from "@/contexts/ProductDisplayContext";
import { ProductDisplayOptions } from "@/components/product-display/ProductDisplayOptions";
import { ProductDisplayStats } from "@/components/product-display/ProductDisplayStats";
import { ProductDisplayFilters } from "@/components/product-display/ProductDisplayFilters";
import { ProductDisplayTable } from "@/components/product-display/ProductDisplayTable";
import { ProductDisplayPrintMode } from "@/components/product-display/ProductDisplayPrintMode";
import { ProductDisplayQuickLinks } from "@/components/product-display/ProductDisplayQuickLinks";
import { useProductDisplayExport } from "@/hooks/useProductDisplayExport";
import { useProductDisplay } from "@/contexts/ProductDisplayContext";
import { memo } from "react";

import { ProductDisplayLoadingState } from "@/components/product-display/ProductDisplayLoadingState";
import { supabaseProductsToLocal } from "@/adapters/productAdapter";

const ProductDisplayContent = memo(() => {
  const { exportToPDF } = useProductDisplayExport();
  const { filteredProducts, displayOption, isPrintMode, setIsExporting, loading } = useProductDisplay();

  const handleExport = () => {
    const convertedProducts = supabaseProductsToLocal(filteredProducts);
    exportToPDF(convertedProducts, displayOption, setIsExporting);
  };

  if (loading) {
    return <ProductDisplayLoadingState />;
  }

  if (isPrintMode) {
    return <ProductDisplayPrintMode />;
  }

  return (
    <>
      <SEOManager 
        title="عرض المنتجات للعملاء - نظام إدارة المخزون"
        description="اعرض منتجاتك للعملاء بطريقة احترافية مع خيارات متنوعة لعرض الأسعار والكميات"
        keywords="عرض المنتجات, قائمة الأسعار, المخزون, البيع, الشراء"
      />
      
      <div className="container mx-auto p-6 space-y-6" dir="rtl">
        {/* العنوان الرئيسي */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-primary font-cairo">عرض المنتجات للعملاء</h1>
          <p className="text-muted-foreground font-tajawal">اختر نوع العرض المطلوب واعرض المنتجات بالتفصيل</p>
        </div>

        {/* خيارات العرض */}
        <ProductDisplayOptions />

        {/* الإحصائيات */}
        <ProductDisplayStats />

        {/* فلاتر البحث */}
        <ProductDisplayFilters onExport={handleExport} />

        {/* جدول المنتجات */}
        <ProductDisplayTable />
      </div>
    </>
  );
});

ProductDisplayContent.displayName = "ProductDisplayContent";

const ProductDisplay = () => {
  return (
    <ProductDisplayProvider>
      <ProductDisplayContent />
    </ProductDisplayProvider>
  );
};

export default ProductDisplay;