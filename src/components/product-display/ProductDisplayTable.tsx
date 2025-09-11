import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useProductDisplay } from "@/contexts/ProductDisplayContext";
import { VirtualizedList } from "@/components/performance/VirtualizedList";

const ProductDisplayTable = memo(() => {
  const { filteredProducts, displayOption } = useProductDisplay();

  const renderTableHeaders = () => {
    switch (displayOption) {
      case "selling":
        return (
          <>
            <TableHead className="text-right">اسم المنتج</TableHead>
            <TableHead className="text-right">سعر البيع</TableHead>
            <TableHead className="text-right">الفئة</TableHead>
            <TableHead className="text-right">الكمية المتاحة</TableHead>
            <TableHead className="text-right">الباركود</TableHead>
            <TableHead className="text-right">الحالة</TableHead>
          </>
        );
      case "purchase":
        return (
          <>
            <TableHead className="text-right">اسم المنتج</TableHead>
            <TableHead className="text-right">سعر الشراء</TableHead>
            <TableHead className="text-right">الفئة</TableHead>
            <TableHead className="text-right">الكمية المتاحة</TableHead>
            <TableHead className="text-right">الباركود</TableHead>
            <TableHead className="text-right">الحالة</TableHead>
          </>
        );
      case "stock":
        return (
          <>
            <TableHead className="text-right">اسم المنتج</TableHead>
            <TableHead className="text-right">الكمية المتاحة</TableHead>
            <TableHead className="text-right">الفئة</TableHead>
            <TableHead className="text-right">الباركود</TableHead>
            <TableHead className="text-right">الكود</TableHead>
            <TableHead className="text-right">الحالة</TableHead>
          </>
        );
      default:
        return null;
    }
  };

  const renderProductRow = (product: typeof filteredProducts[0], index: number) => {
    return (
      <TableRow key={product.id}>
        <TableCell className="font-medium">{product.name}</TableCell>
        {displayOption === "selling" && (
          <TableCell className="text-green-600 font-semibold">
            {product.price.toLocaleString()} ج.م
          </TableCell>
        )}
        {displayOption === "purchase" && (
          <TableCell className="text-blue-600 font-semibold">
            {product.cost.toLocaleString()} ج.م
          </TableCell>
        )}
        {displayOption === "stock" && (
          <TableCell className="font-semibold">
            {product.stock} {product.unit || "قطعة"}
          </TableCell>
        )}
        <TableCell>{product.category || "غير محدد"}</TableCell>
        {displayOption !== "stock" && (
          <TableCell className="font-semibold">
            {product.stock} {product.unit || "قطعة"}
          </TableCell>
        )}
        {displayOption !== "stock" && (
          <TableCell className="font-mono text-sm">
            {product.barcode || "غير محدد"}
          </TableCell>
        )}
        {displayOption === "stock" && (
          <>
            <TableCell className="font-mono text-sm">
              {product.barcode || "غير محدد"}
            </TableCell>
            <TableCell className="font-mono text-sm">
              {product.code}
            </TableCell>
          </>
        )}
        <TableCell>
          <Badge 
            variant={product.stock > 0 ? "default" : "destructive"}
          >
            {product.stock > 0 ? "متوفر" : "نفد من المخزن"}
          </Badge>
        </TableCell>
      </TableRow>
    );
  };

  if (filteredProducts.length === 0) {
    return (
      <Card>
      <CardHeader>
        <CardTitle className="font-cairo">قائمة المنتجات</CardTitle>
      </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground font-tajawal">لا توجد منتجات مطابقة للبحث</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-cairo">
          قائمة المنتجات 
          <Badge variant="secondary" className="mr-2 font-tajawal">
            {filteredProducts.length} منتج
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          {filteredProducts.length > 100 ? (
            <VirtualizedList
              items={filteredProducts}
              itemHeight={60}
              containerHeight={500}
              renderItem={(item, index) => (
                <div className="flex items-center justify-between p-4 border-b">
                  <span className="font-medium">{item.name}</span>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{item.category}</span>
                    <span>{item.stock} {item.unit || "قطعة"}</span>
                    {displayOption === "selling" && (
                      <span className="text-green-600 font-semibold">
                        {item.price.toLocaleString()} ج.م
                      </span>
                    )}
                    {displayOption === "purchase" && (
                      <span className="text-blue-600 font-semibold">
                        {item.cost.toLocaleString()} ج.م
                      </span>
                    )}
                  </div>
                </div>
              )}
              className="border rounded-lg"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {renderTableHeaders()}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product, index) => renderProductRow(product, index))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

ProductDisplayTable.displayName = "ProductDisplayTable";

export { ProductDisplayTable };