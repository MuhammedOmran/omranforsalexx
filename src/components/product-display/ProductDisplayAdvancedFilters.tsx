import { memo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Filter, RotateCcw, Save, Upload } from "lucide-react";
import { useProductDisplay } from "@/contexts/ProductDisplayContext";
import { useProductDisplayPreferences } from "@/hooks/useProductDisplayPreferences";
import { useToast } from "@/hooks/use-toast";

const ProductDisplayAdvancedFilters = memo(() => {
  const { 
    searchTerm, 
    selectedCategory, 
    setSearchTerm, 
    setSelectedCategory,
    getCategories,
    filteredProducts 
  } = useProductDisplay();
  
  const { 
    preferences, 
    savedPresets, 
    savePreferences, 
    saveAsPreset, 
    loadPreset, 
    deletePreset, 
    resetToDefault 
  } = useProductDisplayPreferences();
  
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [stockRange, setStockRange] = useState([0, 1000]);
  const [showOutOfStock, setShowOutOfStock] = useState(true);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const applyFilters = () => {
    savePreferences({
      searchTerm,
      selectedCategory,
      priceRange: { min: priceRange[0], max: priceRange[1] },
      stockRange: { min: stockRange[0], max: stockRange[1] },
      showOutOfStock,
      sortBy,
      sortOrder
    });
    setIsOpen(false);
    toast({
      title: "تم تطبيق الفلاتر",
      description: "تم تطبيق الفلاتر المتقدمة بنجاح"
    });
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setPriceRange([0, 100000]);
    setStockRange([0, 1000]);
    setShowOutOfStock(true);
    setSortBy("name");
    setSortOrder('asc');
    resetToDefault();
    toast({
      title: "تم إعادة التعيين",
      description: "تم إعادة تعيين جميع الفلاتر"
    });
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم للإعداد المسبق",
        variant: "destructive"
      });
      return;
    }

    saveAsPreset(presetName, {
      searchTerm,
      selectedCategory,
      priceRange: { min: priceRange[0], max: priceRange[1] },
      stockRange: { min: stockRange[0], max: stockRange[1] },
      showOutOfStock,
      sortBy,
      sortOrder
    });
    
    setPresetName("");
    toast({
      title: "تم الحفظ",
      description: `تم حفظ الإعداد المسبق "${presetName}"`
    });
  };

  const handleLoadPreset = (name: string) => {
    loadPreset(name);
    const preset = savedPresets[name];
    if (preset) {
      setSearchTerm(preset.searchTerm || "");
      setSelectedCategory(preset.selectedCategory || "all");
      setPriceRange([preset.priceRange?.min || 0, preset.priceRange?.max || 100000]);
      setStockRange([preset.stockRange?.min || 0, preset.stockRange?.max || 1000]);
      setShowOutOfStock(preset.showOutOfStock ?? true);
      setSortBy(preset.sortBy || "name");
      setSortOrder(preset.sortOrder || 'asc');
    }
    toast({
      title: "تم التحميل",
      description: `تم تحميل الإعداد المسبق "${name}"`
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Filter className="w-4 h-4 ml-2" />
          فلاتر متقدمة
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>الفلاتر المتقدمة</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* فلاتر النطاق */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">فلاتر النطاق</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>نطاق الأسعار (ج.م)</Label>
                <div className="px-4 py-2">
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={100000}
                    step={100}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>{priceRange[0].toLocaleString()} ج.م</span>
                    <span>{priceRange[1].toLocaleString()} ج.م</span>
                  </div>
                </div>
              </div>

              <div>
                <Label>نطاق الكمية</Label>
                <div className="px-4 py-2">
                  <Slider
                    value={stockRange}
                    onValueChange={setStockRange}
                    max={1000}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>{stockRange[0]} قطعة</span>
                    <span>{stockRange[1]} قطعة</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* خيارات العرض */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">خيارات العرض</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-out-of-stock">عرض المنتجات المنتهية من المخزن</Label>
                <Switch
                  id="show-out-of-stock"
                  checked={showOutOfStock}
                  onCheckedChange={setShowOutOfStock}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>ترتيب حسب</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">الاسم</SelectItem>
                      <SelectItem value="price">السعر</SelectItem>
                      <SelectItem value="stock">الكمية</SelectItem>
                      <SelectItem value="category">الفئة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>اتجاه الترتيب</Label>
                  <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">تصاعدي</SelectItem>
                      <SelectItem value="desc">تنازلي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* الإعدادات المسبقة */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">الإعدادات المسبقة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="اسم الإعداد المسبق"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSavePreset}>
                  <Save className="w-4 h-4 ml-2" />
                  حفظ
                </Button>
              </div>

              {Object.keys(savedPresets).length > 0 && (
                <div>
                  <Label className="text-sm font-medium">الإعدادات المحفوظة:</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Object.keys(savedPresets).map((presetName) => (
                      <div key={presetName} className="flex items-center gap-1">
                        <Badge
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => handleLoadPreset(presetName)}
                        >
                          {presetName}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deletePreset(presetName)}
                          className="h-6 w-6 p-0 text-destructive"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* أزرار التحكم */}
          <div className="flex justify-between gap-4">
            <Button variant="outline" onClick={resetFilters}>
              <RotateCcw className="w-4 h-4 ml-2" />
              إعادة تعيين
            </Button>
            
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setIsOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={applyFilters}>
                تطبيق الفلاتر
              </Button>
            </div>
          </div>

          {/* إحصائيات النتائج */}
          <div className="text-center text-sm text-muted-foreground">
            النتائج الحالية: {filteredProducts.length} منتج
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

ProductDisplayAdvancedFilters.displayName = "ProductDisplayAdvancedFilters";

export { ProductDisplayAdvancedFilters };