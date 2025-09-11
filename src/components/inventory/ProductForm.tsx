import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useInventory } from '@/hooks/useInventory';
import { toast } from 'sonner';

interface ProductFormProps {
  onClose: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ onClose }) => {
  const { addProduct, isAddingProduct } = useInventory();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    barcode: '',
    category: undefined as string | undefined,
    unit_price: '',
    cost_price: '',
    min_stock_level: '5'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.sku || !formData.unit_price) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }

    try {
      await addProduct({
        name: formData.name,
        description: formData.description,
        sku: formData.sku,
        barcode: formData.barcode || undefined,
        category: formData.category,
        unit_price: parseFloat(formData.unit_price),
        cost_price: parseFloat(formData.cost_price) || 0,
        min_stock_level: parseInt(formData.min_stock_level) || 5,
        is_active: true
      });
      onClose();
    } catch (error) {
      // Error handled by the hook
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-cairo">إضافة منتج جديد</DialogTitle>
          <DialogDescription className="font-cairo">
            أدخل تفاصيل المنتج الجديد
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-tajawal">اسم المنتج *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="أدخل اسم المنتج"
                className="font-tajawal"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sku" className="font-tajawal">كود المنتج (SKU) *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => handleChange('sku', e.target.value)}
                placeholder="مثال: PRD001"
                className="font-tajawal"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="font-tajawal">الوصف</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="وصف المنتج"
              className="font-tajawal"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="barcode" className="font-tajawal">الباركود</Label>
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(e) => handleChange('barcode', e.target.value)}
                placeholder="رقم الباركود"
                className="font-tajawal"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category" className="font-tajawal">الفئة</Label>
              <Select value={formData.category || undefined} onValueChange={(value) => handleChange('category', value)}>
                <SelectTrigger className="font-tajawal">
                  <SelectValue placeholder="اختر الفئة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="electronics" className="font-tajawal">إلكترونيات</SelectItem>
                  <SelectItem value="clothing" className="font-tajawal">ملابس</SelectItem>
                  <SelectItem value="food" className="font-tajawal">غذائية</SelectItem>
                  <SelectItem value="books" className="font-tajawal">كتب</SelectItem>
                  <SelectItem value="home" className="font-tajawal">منزلية</SelectItem>
                  <SelectItem value="other" className="font-tajawal">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit_price" className="font-tajawal">سعر البيع *</Label>
              <Input
                id="unit_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.unit_price}
                onChange={(e) => handleChange('unit_price', e.target.value)}
                placeholder="0.00"
                className="font-tajawal"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cost_price" className="font-tajawal">سعر التكلفة</Label>
              <Input
                id="cost_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.cost_price}
                onChange={(e) => handleChange('cost_price', e.target.value)}
                placeholder="0.00"
                className="font-tajawal"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="min_stock_level" className="font-tajawal">الحد الأدنى للمخزون</Label>
              <Input
                id="min_stock_level"
                type="number"
                min="0"
                value={formData.min_stock_level}
                onChange={(e) => handleChange('min_stock_level', e.target.value)}
                placeholder="5"
                className="font-tajawal"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="font-cairo">
              إلغاء
            </Button>
            <Button type="submit" disabled={isAddingProduct} className="font-cairo">
              {isAddingProduct ? 'جاري الحفظ...' : 'حفظ المنتج'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductForm;