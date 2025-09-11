import { useState, useEffect } from "react";
import { Package, AlertTriangle, TrendingUp, TrendingDown, Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useSupabaseProducts } from "@/hooks/useSupabaseProducts";

interface StockItem {
  id: string;
  name: string;
  code: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  cost: number;
  value: number;
  lastMovement: string;
  movementType: "in" | "out";
}

export default function Stock() {
  const { products, loading, error, updateProduct, refreshProducts } = useSupabaseProducts();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // تحويل منتجات Supabase إلى تنسيق المخزون
  const stockData: StockItem[] = products.map(product => ({
    id: product.id,
    name: product.name,
    code: product.code,
    category: product.category || 'غير محدد',
    currentStock: product.stock,
    minStock: product.min_stock || 5,
    maxStock: product.max_stock || (product.min_stock || 5) * 5,
    cost: product.cost,
    value: product.stock * product.cost,
    lastMovement: new Date(product.updated_at).toLocaleDateString('ar-EG'),
    movementType: "in" as const
  }));

  // إضافة دالة لتحديث الحد الأدنى والأقصى للمخزون
  const updateStockLimits = async (productId: string, minStock: number, maxStock: number) => {
    try {
      await updateProduct(productId, { min_stock: minStock, max_stock: maxStock });
      refreshProducts();
    } catch (error) {
      console.error('خطأ في تحديث حدود المخزون:', error);
    }
  };

  // الحصول على فئات المنتجات المتاحة
  const availableCategories = [...new Set(stockData.map(item => item.category).filter(Boolean))];

  const getStockStatus = (current: number, min: number, max: number) => {
    if (current === 0) return { label: "نفدت الكمية", variant: "destructive" as const, percentage: 0 };
    if (current <= min) return { label: "كمية قليلة", variant: "secondary" as const, percentage: (current / max) * 100 };
    if (current >= max * 0.8) return { label: "مخزون عالي", variant: "default" as const, percentage: (current / max) * 100 };
    return { label: "مناسب", variant: "default" as const, percentage: (current / max) * 100 };
  };

  const filteredStock = (stockData || []).filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    
    let matchesStatus = true;
    if (statusFilter === "low") matchesStatus = item.currentStock <= item.minStock;
    if (statusFilter === "out") matchesStatus = item.currentStock === 0;
    if (statusFilter === "high") matchesStatus = item.currentStock >= item.maxStock * 0.8;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalValue = (stockData || []).reduce((sum, item) => sum + item.value, 0);
  const lowStockItems = (stockData || []).filter(item => item.currentStock <= item.minStock && item.currentStock > 0).length;
  const outOfStockItems = (stockData || []).filter(item => item.currentStock === 0).length;
  const totalItems = (stockData || []).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-cairo text-foreground">المخزون الحالي</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">إجمالي القيمة</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-tajawal">{totalValue.toLocaleString()} ج.م</div>
            <p className="text-xs text-muted-foreground font-tajawal">
              قيمة المخزون الإجمالية
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">إجمالي الأصناف</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-tajawal">{totalItems}</div>
            <p className="text-xs text-muted-foreground font-tajawal">
              عدد الأصناف المختلفة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">كمية قليلة</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500 font-tajawal">{lowStockItems}</div>
            <p className="text-xs text-muted-foreground font-tajawal">
              أصناف تحتاج إعادة طلب
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">نفدت الكمية</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500 font-tajawal">{outOfStockItems}</div>
            <p className="text-xs text-muted-foreground font-tajawal">
              أصناف غير متوفرة
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="font-cairo">فلترة المخزون</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث في المخزون..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="font-tajawal"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48 font-tajawal">
                <SelectValue placeholder="فلترة بالفئة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-tajawal">جميع الفئات</SelectItem>
                {availableCategories.map((category) => (
                  <SelectItem key={category} value={category} className="font-tajawal">
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48 font-tajawal">
                <SelectValue placeholder="فلترة بالحالة" />
              </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-tajawal">جميع الحالات</SelectItem>
                  <SelectItem value="low" className="font-tajawal">كمية قليلة</SelectItem>
                  <SelectItem value="out" className="font-tajawal">نفدت الكمية</SelectItem>
                  <SelectItem value="high" className="font-tajawal">مخزون عالي</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stock Table */}
      <Card>
        <CardHeader>
          <CardTitle className="font-cairo">تفاصيل المخزون</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">جار التحميل...</div>
          ) : error ? (
            <div className="text-center py-4 text-red-500">خطأ: {error}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-tajawal">اسم المنتج</TableHead>
                  <TableHead className="font-tajawal">الكود</TableHead>
                  <TableHead className="font-tajawal">الفئة</TableHead>
                  <TableHead className="font-tajawal">الكمية الحالية</TableHead>
                  <TableHead className="font-tajawal">مستوى المخزون</TableHead>
                  <TableHead className="font-tajawal">الحالة</TableHead>
                  <TableHead className="font-tajawal">القيمة</TableHead>
                  <TableHead className="font-tajawal">آخر حركة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStock.map((item) => {
                  const status = getStockStatus(item.currentStock, item.minStock, item.maxStock);
                  return (
                     <TableRow key={item.id}>
                       <TableCell className="font-medium font-tajawal">{item.name}</TableCell>
                       <TableCell className="font-tajawal">{item.code}</TableCell>
                       <TableCell className="font-tajawal">{item.category}</TableCell>
                       <TableCell>
                         <div className="flex items-center gap-2 font-tajawal">
                           <span>{item.currentStock}</span>
                           <span className="text-sm text-muted-foreground">/ {item.maxStock}</span>
                         </div>
                       </TableCell>
                       <TableCell className="w-32">
                         <div className="space-y-2">
                           <Progress value={status.percentage} className="h-2" />
                           <div className="text-xs text-muted-foreground font-tajawal">
                             {Math.round(status.percentage)}%
                           </div>
                         </div>
                       </TableCell>
                       <TableCell>
                         <Badge variant={status.variant} className="font-tajawal">
                           {status.label}
                         </Badge>
                       </TableCell>
                       <TableCell className="font-tajawal">{item.value.toLocaleString()} ج.م</TableCell>
                       <TableCell>
                         <div className="flex items-center gap-2 font-tajawal">
                           <span>{item.lastMovement}</span>
                           {item.movementType === "in" ? (
                             <TrendingUp className="h-4 w-4 text-green-500" />
                           ) : (
                             <TrendingDown className="h-4 w-4 text-red-500" />
                           )}
                         </div>
                       </TableCell>
                     </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}