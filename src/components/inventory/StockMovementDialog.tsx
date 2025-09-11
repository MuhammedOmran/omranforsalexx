import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useStockManagement } from '@/hooks/useStockManagement';
import { useSupabaseProducts } from '@/hooks/useSupabaseProducts';
import { Package, Plus, Minus, Edit } from 'lucide-react';

interface StockMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId?: string;
  movementType?: 'in' | 'out' | 'adjustment';
}

export function StockMovementDialog({ 
  open, 
  onOpenChange, 
  productId, 
  movementType = 'adjustment' 
}: StockMovementDialogProps) {
  const { products } = useSupabaseProducts();
  const { addStockMovement, adjustStock } = useStockManagement();
  
  const [selectedProductId, setSelectedProductId] = useState(productId || '');
  const [selectedMovementType, setSelectedMovementType] = useState(movementType);
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const currentStock = selectedProduct?.stock || 0;

  const calculateNewStock = () => {
    const qty = parseInt(quantity) || 0;
    switch (selectedMovementType) {
      case 'in':
        return currentStock + qty;
      case 'out':
        return Math.max(0, currentStock - qty);
      case 'adjustment':
        return qty;
      default:
        return currentStock;
    }
  };

  const handleSubmit = async () => {
    if (!selectedProductId || !quantity || !reason) {
      return;
    }

    setLoading(true);
    try {
      const newStock = calculateNewStock();
      await adjustStock(selectedProductId, newStock, reason, notes);
      
      // Reset form
      setSelectedProductId('');
      setQuantity('');
      setReason('');
      setNotes('');
      onOpenChange(false);
    } catch (error) {
      console.error('خطأ في تسجيل حركة المخزون:', error);
    } finally {
      setLoading(false);
    }
  };

  const movementTypes = [
    { value: 'in', label: 'إدخال مخزون', icon: Plus, color: 'text-green-600' },
    { value: 'out', label: 'إخراج مخزون', icon: Minus, color: 'text-red-600' },
    { value: 'adjustment', label: 'تصحيح مخزون', icon: Edit, color: 'text-blue-600' }
  ];

  const reasons = {
    in: [
      'شراء جديد',
      'إرجاع من عميل',
      'تحويل من فرع آخر',
      'تصحيح جرد',
      'إنتاج داخلي',
      'أخرى'
    ],
    out: [
      'بيع',
      'تلف',
      'انتهاء صلاحية',
      'عينة مجانية',
      'تحويل لفرع آخر',
      'أخرى'
    ],
    adjustment: [
      'جرد دوري',
      'تصحيح خطأ',
      'تعديل نظام',
      'أخرى'
    ]
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-cairo">حركة مخزون</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* اختيار المنتج */}
          <div>
            <Label className="font-tajawal">المنتج</Label>
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger>
                <SelectValue placeholder="اختر المنتج" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    <div className="flex items-center justify-between w-full">
                      <span className="font-tajawal">{product.name}</span>
                      <span className="text-sm text-muted-foreground">
                        المخزون: {product.stock}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* نوع الحركة */}
          <div>
            <Label className="font-tajawal">نوع الحركة</Label>
            <Select value={selectedMovementType} onValueChange={(value: any) => setSelectedMovementType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {movementTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Icon className={`h-4 w-4 ${type.color}`} />
                        <span className="font-tajawal">{type.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* معلومات المخزون الحالي */}
          {selectedProduct && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="font-tajawal">المخزون الحالي:</span>
                <span className="font-bold">{currentStock}</span>
              </div>
              {quantity && (
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="font-tajawal">المخزون بعد الحركة:</span>
                  <span className="font-bold text-primary">{calculateNewStock()}</span>
                </div>
              )}
            </div>
          )}

          {/* الكمية */}
          <div>
            <Label className="font-tajawal">
              {selectedMovementType === 'adjustment' ? 'المخزون الجديد' : 'الكمية'}
            </Label>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={selectedMovementType === 'adjustment' ? 'أدخل المخزون الصحيح' : 'أدخل الكمية'}
              min="0"
            />
          </div>

          {/* السبب */}
          <div>
            <Label className="font-tajawal">السبب</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="اختر السبب" />
              </SelectTrigger>
              <SelectContent>
                {reasons[selectedMovementType].map((reasonOption) => (
                  <SelectItem key={reasonOption} value={reasonOption}>
                    <span className="font-tajawal">{reasonOption}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {reason === 'أخرى' && (
              <Input
                className="mt-2"
                placeholder="أدخل السبب"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            )}
          </div>

          {/* ملاحظات */}
          {reason !== 'أخرى' && (
            <div>
              <Label className="font-tajawal">ملاحظات (اختياري)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ملاحظات إضافية..."
                rows={3}
              />
            </div>
          )}

          {/* أزرار التحكم */}
          <div className="flex justify-end space-x-2 space-x-reverse pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedProductId || !quantity || !reason || loading}
              className="font-tajawal"
            >
              {loading ? 'جاري الحفظ...' : 'حفظ الحركة'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}