import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Download, Search, Filter, Printer, Share2 } from "lucide-react";
import { useProductDisplay } from "@/contexts/ProductDisplayContext";
import { ProductDisplayAdvancedFilters } from "./ProductDisplayAdvancedFilters";
import { ProductDisplayShareDialog } from "./ProductDisplayShareDialog";

interface ProductDisplayFiltersProps {
  onExport: () => void;
}

const ProductDisplayFilters = memo(({ onExport }: ProductDisplayFiltersProps) => {
  const {
    searchTerm,
    selectedCategory,
    isExporting,
    filteredProducts,
    isPrintMode,
    setSearchTerm,
    setSelectedCategory,
    setIsPrintMode,
    getCategories
  } = useProductDisplay();

  const handlePrintMode = () => {
    setIsPrintMode(!isPrintMode);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-cairo">
          <Filter className="w-5 h-5" />
          البحث والتصفية
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* الصف الأول - البحث والفئة */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث عن منتج..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الفئة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-tajawal">جميع الفئات</SelectItem>
                {getCategories().map((category) => (
                  <SelectItem key={category} value={category} className="font-tajawal">{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* الصف الثاني - الأزرار */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <ProductDisplayAdvancedFilters />
            
            <Button 
              variant="outline"
              onClick={handlePrintMode}
              className={`font-tajawal ${isPrintMode ? "bg-primary text-primary-foreground" : ""}`}
            >
              <Printer className="w-4 h-4 ml-2" />
              وضع الطباعة
            </Button>

            <ProductDisplayShareDialog />
            
            <Button 
              onClick={onExport}
              disabled={isExporting || filteredProducts.length === 0}
              variant={isExporting ? "secondary" : "default"}
              className={`font-tajawal transition-all duration-200 ${
                isExporting 
                  ? "bg-muted text-muted-foreground" 
                  : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              }`}
            >
              <Download className="w-4 h-4 ml-2" />
              {isExporting ? "جاري التصدير..." : "تصدير PDF"}
            </Button>

            <div className="text-sm text-muted-foreground flex items-center justify-center font-tajawal">
              {filteredProducts.length} منتج
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ProductDisplayFilters.displayName = "ProductDisplayFilters";

export { ProductDisplayFilters };