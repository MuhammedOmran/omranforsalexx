import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useProductDisplay } from "@/contexts/ProductDisplayContext";

const ProductDisplayStats = memo(() => {
  const { getStats, displayOption } = useProductDisplay();
  const stats = getStats();

  const getValueLabel = () => {
    switch (displayOption) {
      case "selling": return "إجمالي قيمة البيع";
      case "purchase": return "إجمالي قيمة الشراء";
      case "stock": return "إجمالي الكميات";
      default: return "";
    }
  };

  const formatValue = (value: number) => {
    if (displayOption === "stock") {
      return value.toLocaleString();
    }
    return `${value.toLocaleString()} ج.م`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-primary font-tajawal">{stats.totalProducts}</h3>
            <p className="text-sm text-muted-foreground font-tajawal">إجمالي المنتجات</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-green-600 font-tajawal">
              {formatValue(stats.totalValue)}
            </h3>
            <p className="text-sm text-muted-foreground font-tajawal">
              {getValueLabel()}
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-destructive font-tajawal">{stats.outOfStock}</h3>
            <p className="text-sm text-muted-foreground font-tajawal">منتجات نفدت من المخزن</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

ProductDisplayStats.displayName = "ProductDisplayStats";

export { ProductDisplayStats };