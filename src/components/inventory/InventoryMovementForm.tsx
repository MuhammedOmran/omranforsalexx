import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useInventory } from '@/hooks/useInventory';
import { toast } from 'sonner';

interface InventoryMovementFormProps {
  onClose: () => void;
}

const InventoryMovementForm: React.FC<InventoryMovementFormProps> = ({ onClose }) => {
  const { products, addMovement, isAddingMovement } = useInventory();
  const [formData, setFormData] = useState({
    product_id: '',
    movement_type: '' as 'purchase' | 'sale' | 'adjustment' | 'return' | 'transfer',
    quantity: '',
    unit_price: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.product_id || !formData.movement_type || !formData.quantity) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }

    const quantity = parseInt(formData.quantity);
    if (quantity === 0) {
      toast.error('الكمية يجب أن تكون أكبر من صفر');
      return;
    }

    try {
      const adjustedQuantity = formData.movement_type === 'sale' ? -Math.abs(quantity) : Math.abs(quantity);
      
      await addMovement({
        product_id: formData.product_id,
        movement_type: formData.movement_type,
        quantity: adjustedQuantity,
        unit_price: formData.unit_price ? parseFloat(formData.unit_price) : undefined,
        total_amount: formData.unit_price ? Math.abs(quantity) * parseFloat(formData.unit_price) : undefined,
        notes: formData.notes
      });
      onClose();
    } catch (error) {
      // Error handled by the hook
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const movementTypes = [
    { value: 'purchase', label: 'شراء' },
    { value: 'sale', label: 'بيع' },
    { value: 'adjustment', label: 'تسوية' },
    { value: 'return', label: 'مرتجع' },
    { value: 'transfer', label: 'نقل' }
  ];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>إضافة حركة مخزون</DialogTitle>
          <DialogDescription>
            سجل حركة جديدة للمخزون
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product_id">المنتج *</Label>
            <Select value={formData.product_id} onValueChange={(value) => handleChange('product_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="اختر المنتج" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} - {product.sku}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="movement_type">نوع الحركة *</Label>
              <Select value={formData.movement_type} onValueChange={(value) => handleChange('movement_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الحركة" />
                </SelectTrigger>
                <SelectContent>
                  {movementTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quantity">الكمية *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => handleChange('quantity', e.target.value)}
                placeholder="أدخل الكمية"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit_price">سعر الوحدة</Label>
            <Input
              id="unit_price"
              type="number"
              step="0.01"
              min="0"
              value={formData.unit_price}
              onChange={(e) => handleChange('unit_price', e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="ملاحظات إضافية"
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isAddingMovement}>
              {isAddingMovement ? 'جاري الحفظ...' : 'حفظ الحركة'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InventoryMovementForm;