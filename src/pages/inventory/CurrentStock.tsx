import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Package, AlertTriangle, Search, Edit, TrendingDown, TrendingUp } from 'lucide-react';
import { useSimpleInventory } from '@/hooks/useSimpleInventory';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

export default function CurrentStock() {
  const { products, loading, updateProduct, syncProductStock } = useSimpleInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [newStock, setNewStock] = useState('');

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockProducts = products.filter(product => product.stock <= 5);
  const outOfStockProducts = products.filter(product => product.stock === 0);

  const handleStockUpdate = async () => {
    if (!editingProduct || !newStock) return;

    const stockNumber = parseInt(newStock);
    if (isNaN(stockNumber) || stockNumber < 0) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رقم صحيح للكمية",
        variant: "destructive"
      });
      return;
    }

    const success = await updateProduct(editingProduct.id, { stock: stockNumber });
    if (success) {
      setEditingProduct(null);
      setNewStock('');
      toast({
        title: "نجح",
        description: "تم تحديث المخزون بنجاح"
      });
    }
  };

  const handleSyncStock = async (productId: string) => {
    const success = await syncProductStock(productId);
    if (success) {
      toast({
        title: "نجح",
        description: "تم تصحيح المخزون بناءً على المشتريات والمبيعات"
      });
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { status: 'نفد المخزون', color: 'bg-destructive', icon: AlertTriangle };
    if (stock <= 5) return { status: 'مخزون منخفض', color: 'bg-warning', icon: TrendingDown };
    return { status: 'متوفر', color: 'bg-success', icon: TrendingUp };
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">جاري تحميل المخزون...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">المخزون الحالي</h1>
          <p className="text-muted-foreground">
            إدارة ومراقبة مخزون المنتجات
          </p>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي المنتجات</p>
                <p className="text-2xl font-bold">{products.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <TrendingUp className="h-8 w-8 text-success" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">متوفر</p>
                <p className="text-2xl font-bold text-success">
                  {products.filter(p => p.stock > 5).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <TrendingDown className="h-8 w-8 text-warning" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">مخزون منخفض</p>
                <p className="text-2xl font-bold text-warning">{lowStockProducts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">نفد المخزون</p>
                <p className="text-2xl font-bold text-destructive">{outOfStockProducts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* شريط البحث */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="البحث في المنتجات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* قائمة المنتجات */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المنتجات</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد منتجات في المخزون</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProducts.map((product) => {
                const stockInfo = getStockStatus(product.stock);
                const StockIcon = stockInfo.icon;
                
                return (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4 space-x-reverse">
                      <Package className="h-10 w-10 text-muted-foreground" />
                      <div>
                        <h3 className="font-medium">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          السعر: {product.price.toLocaleString()} ج.م
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 space-x-reverse">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">الكمية المتاحة</p>
                        <p className="text-lg font-bold">{product.stock}</p>
                      </div>

                      <Badge variant="secondary" className={`${stockInfo.color} text-white`}>
                        <StockIcon className="h-3 w-3 me-1" />
                        {stockInfo.status}
                      </Badge>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}