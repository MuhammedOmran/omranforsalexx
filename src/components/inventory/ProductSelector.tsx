import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSupabaseProducts } from '@/hooks/useSupabaseProducts';
import { SupabaseProduct } from '@/types/supabase-types';
import { toast } from 'sonner';

interface ProductSelectorProps {
  value: string;
  onChange: (productName: string, productData?: SupabaseProduct) => void;
  onProductAdded?: () => void;
  className?: string;
}

export function ProductSelector({ value, onChange, onProductAdded, className }: ProductSelectorProps) {
  const { products, createProduct, refreshProducts } = useSupabaseProducts();
  const [showNewProductDialog, setShowNewProductDialog] = useState(false);
  const [newProductData, setNewProductData] = useState({
    name: '',
    price: 0,
    cost: 0,
    stock: 0,
    min_stock: 0
  });

  useEffect(() => {
    refreshProducts();
  }, []);

  const handleProductSelect = (productName: string) => {
    const selectedProduct = products.find(p => p.name === productName);
    onChange(productName, selectedProduct);
  };

  const handleAddNewProduct = async () => {
    if (!newProductData.name.trim()) {
      toast.error('يرجى إدخال اسم المنتج');
      return;
    }

    try {
      const newProduct = await createProduct({
        name: newProductData.name,
        code: `PRD${Date.now()}`,
        price: newProductData.price,
        cost: newProductData.cost,
        stock: newProductData.stock,
        min_stock: newProductData.min_stock,
        is_active: true,
        unit: 'قطعة'
      });
      
      toast.success('تم إضافة المنتج بنجاح');
      onChange(newProductData.name, newProduct);
      setShowNewProductDialog(false);
      setNewProductData({ name: '', price: 0, cost: 0, stock: 0, min_stock: 0 });
      onProductAdded?.();
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('فشل في إضافة المنتج');
    }
  };

  return (
    <div className={cn("flex gap-2", className)}>
      <Select value={value} onValueChange={handleProductSelect}>
        <SelectTrigger className="font-tajawal">
          <SelectValue placeholder="اختر المنتج" />
        </SelectTrigger>
        <SelectContent>
          {products.map((product) => (
            <SelectItem key={product.id} value={product.name}>
              {product.name} - {product.price} ج.م
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={showNewProductDialog} onOpenChange={setShowNewProductDialog}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="icon" title="إضافة منتج جديد">
            <Plus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة منتج جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>اسم المنتج *</Label>
              <Input
                value={newProductData.name}
                onChange={(e) => setNewProductData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="أدخل اسم المنتج"
              />
            </div>
            
            <div className="space-y-2">
              <Label>السعر (ج.م) *</Label>
              <Input
                type="number"
                value={newProductData.price}
                onChange={(e) => setNewProductData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                placeholder="أدخل سعر المنتج"
                min="0"
                step="0.01"
              />
            </div>
            
            <div className="space-y-2">
              <Label>التكلفة (ج.م)</Label>
              <Input
                type="number"
                value={newProductData.cost}
                onChange={(e) => setNewProductData(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                placeholder="أدخل تكلفة المنتج"
                min="0"
                step="0.01"
              />
            </div>
            
            <div className="space-y-2">
              <Label>الكمية الأولية</Label>
              <Input
                type="number"
                value={newProductData.stock}
                onChange={(e) => setNewProductData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                placeholder="أدخل الكمية الأولية"
                min="0"
              />
            </div>
            
            <div className="space-y-2">
              <Label>الحد الأدنى للكمية</Label>
              <Input
                type="number"
                value={newProductData.min_stock}
                onChange={(e) => setNewProductData(prev => ({ ...prev, min_stock: parseInt(e.target.value) || 0 }))}
                placeholder="أدخل الحد الأدنى للكمية"
                min="0"
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button onClick={handleAddNewProduct} className="flex-1">
                إضافة المنتج
              </Button>
              <Button 
                type="button"
                variant="outline" 
                onClick={() => setShowNewProductDialog(false)}
                className="flex-1"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}