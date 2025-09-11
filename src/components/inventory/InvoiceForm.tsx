import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { useInventory } from '@/hooks/useInventory';
import { toast } from 'sonner';

interface InvoiceFormProps {
  onClose: () => void;
}

interface InvoiceItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_amount: number;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ onClose }) => {
  const { products, addInvoice, isAddingInvoice } = useInventory();
  const [invoiceData, setInvoiceData] = useState({
    invoice_number: `INV-${Date.now()}`,
    invoice_type: 'sale' as 'sale' | 'purchase' | 'return',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    discount_amount: 0,
    tax_amount: 0,
    notes: ''
  });

  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [newItem, setNewItem] = useState({
    product_id: '',
    quantity: 1,
    discount_amount: 0
  });

  const addItem = () => {
    if (!newItem.product_id) {
      toast.error('يرجى اختيار منتج');
      return;
    }

    const product = products.find(p => p.id === newItem.product_id);
    if (!product) return;

    const unitPrice = product.unit_price;
    const totalPrice = (newItem.quantity * unitPrice) - newItem.discount_amount;

    const item: InvoiceItem = {
      product_id: newItem.product_id,
      quantity: newItem.quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
      discount_amount: newItem.discount_amount
    };

    setItems(prev => [...prev, item]);
    setNewItem({ product_id: '', quantity: 1, discount_amount: 0 });
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((sum, item) => sum + item.total_price, 0);
  const netAmount = totalAmount - invoiceData.discount_amount + invoiceData.tax_amount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.length === 0) {
      toast.error('يرجى إضافة عناصر للفاتورة');
      return;
    }

    try {
      await addInvoice({
        invoice: {
          ...invoiceData,
          total_amount: totalAmount,
          net_amount: netAmount,
          status: 'draft',
          payment_status: 'pending'
        },
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          discount_amount: item.discount_amount
        }))
      });
      onClose();
    } catch (error) {
      // Error handled by the hook
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>إنشاء فاتورة جديدة</DialogTitle>
          <DialogDescription>
            أنشئ فاتورة بيع أو شراء جديدة
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* بيانات الفاتورة الأساسية */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">بيانات الفاتورة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>رقم الفاتورة</Label>
                  <Input
                    value={invoiceData.invoice_number}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, invoice_number: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>نوع الفاتورة</Label>
                  <Select 
                    value={invoiceData.invoice_type} 
                    onValueChange={(value: 'sale' | 'purchase' | 'return') => 
                      setInvoiceData(prev => ({ ...prev, invoice_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sale">بيع</SelectItem>
                      <SelectItem value="purchase">شراء</SelectItem>
                      <SelectItem value="return">مرتجع</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>اسم العميل</Label>
                  <Input
                    value={invoiceData.customer_name}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, customer_name: e.target.value }))}
                    placeholder="اسم العميل"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>رقم الهاتف</Label>
                  <Input
                    value={invoiceData.customer_phone}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, customer_phone: e.target.value }))}
                    placeholder="رقم الهاتف"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>البريد الإلكتروني</Label>
                  <Input
                    type="email"
                    value={invoiceData.customer_email}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, customer_email: e.target.value }))}
                    placeholder="البريد الإلكتروني"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* إضافة عناصر */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">إضافة منتج</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <Label>المنتج</Label>
                  <Select value={newItem.product_id} onValueChange={(value) => setNewItem(prev => ({ ...prev, product_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المنتج" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - {product.unit_price.toLocaleString()} ج.م
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>الكمية</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    className="w-20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>خصم</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newItem.discount_amount}
                    onChange={(e) => setNewItem(prev => ({ ...prev, discount_amount: parseFloat(e.target.value) || 0 }))}
                    className="w-24"
                  />
                </div>
                
                <Button type="button" onClick={addItem} className="gap-2">
                  <Plus className="h-4 w-4" />
                  إضافة
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* عناصر الفاتورة */}
          {items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">عناصر الفاتورة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {items.map((item, index) => {
                    const product = products.find(p => p.id === item.product_id);
                    return (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-medium">{product?.name}</h3>
                          <p className="text-sm text-muted-foreground">
                             {item.quantity} × {item.unit_price.toLocaleString()} ج.م
                             {item.discount_amount > 0 && ` - خصم ${item.discount_amount.toLocaleString()} ج.م`}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">
                            {item.total_price.toLocaleString()} ج.م
                          </Badge>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ملخص الفاتورة */}
          {items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ملخص الفاتورة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>خصم إضافي</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={invoiceData.discount_amount}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, discount_amount: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>ضريبة</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={invoiceData.tax_amount}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, tax_amount: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>المجموع الفرعي:</span>
                    <span>{totalAmount.toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الخصم:</span>
                    <span>-{invoiceData.discount_amount.toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الضريبة:</span>
                    <span>+{invoiceData.tax_amount.toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>المجموع النهائي:</span>
                    <span>{netAmount.toLocaleString()} ج.م</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isAddingInvoice || items.length === 0}>
              {isAddingInvoice ? 'جاري الحفظ...' : 'حفظ الفاتورة'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceForm;