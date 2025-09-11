import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { usePurchaseInvoices, PurchaseInvoiceItem } from '@/hooks/usePurchaseInvoices';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useInventory } from '@/hooks/useInventory';
import { ProductSelector } from '@/components/inventory/ProductSelector';
import { toast } from 'sonner';

export default function NewPurchase() {
  const navigate = useNavigate();
  const { addInvoice } = usePurchaseInvoices();
  const { suppliers, fetchSuppliers } = useSuppliers();
  const { products, addProduct } = useInventory();
  
  const [formData, setFormData] = useState({
    invoice_number: `pl-${Date.now().toString().slice(-6)}`,
    supplier_id: '',
    supplier_name: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    payment_method: 'cash',
    notes: '',
    items_count: 1
  });
  
  const [items, setItems] = useState<PurchaseInvoiceItem[]>([{
    product_name: '',
    quantity: 1,
    unit_cost: 0,
    total_cost: 0
  }]);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'supplier_id') {
      const selectedSupplier = suppliers.find(s => s.id === value);
      if (selectedSupplier) {
        setFormData(prev => ({ 
          ...prev, 
          supplier_id: value,
          supplier_name: selectedSupplier.name 
        }));
      }
    }
  };

  const handleItemChange = async (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'unit_cost') {
      const quantity = field === 'quantity' ? Number(value) : newItems[index].quantity;
      const unitCost = field === 'unit_cost' ? Number(value) : newItems[index].unit_cost;
      newItems[index].total_cost = quantity * unitCost;
    }
    
    setItems(newItems);
  };

  const handleProductSelect = (index: number, productName: string, productData?: any) => {
    const newItems = [...items];
    const unitCost = productData?.cost || productData?.price || newItems[index].unit_cost;
    
    newItems[index] = { 
      ...newItems[index], 
      product_name: productName,
      product_id: productData?.id,
      unit_cost: unitCost,
      total_cost: newItems[index].quantity * unitCost
    };
    
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, {
      product_name: '',
      quantity: 1,
      unit_cost: 0,
      total_cost: 0
    }]);
    setFormData(prev => ({ ...prev, items_count: prev.items_count + 1 }));
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
      setFormData(prev => ({ ...prev, items_count: Math.max(1, prev.items_count - 1) }));
    }
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => total + item.total_cost, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplier_name.trim()) {
      toast.error('يرجى اختيار المورد');
      return;
    }

    // منع الإرسال المتعدد
    const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
    if (submitButton) {
      submitButton.disabled = true;
    }

    try {
      // الآن سيتم تحديث المخزون تلقائياً عن طريق triggers قاعدة البيانات
      // لا حاجة لإضافة المنتجات يدوياً - ستتولى triggers هذا الأمر

      const invoiceData = {
        invoice_number: formData.invoice_number,
        supplier_id: formData.supplier_id,
        supplier_name: formData.supplier_name,
        invoice_date: formData.invoice_date,
        due_date: formData.due_date,
        payment_method: formData.payment_method,
        notes: formData.notes,
        subtotal: calculateTotal(),
        total_amount: calculateTotal(),
        paid_amount: 0
      };

      const success = await addInvoice(invoiceData, items);
      
      if (success) {
        navigate('/purchases/invoices');
      }
    } finally {
      // إعادة تفعيل الزر
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl max-h-screen overflow-y-auto" dir="rtl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => navigate('/purchases/invoices')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold font-cairo">فاتورة شراء جديدة</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-tajawal">بيانات الفاتورة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-tajawal">رقم الفاتورة *</Label>
                <Input
                  value={formData.invoice_number}
                  onChange={(e) => handleInputChange('invoice_number', e.target.value)}
                  required
                  className="font-tajawal"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-tajawal">المورد *</Label>
                <Select value={formData.supplier_id} onValueChange={(value) => handleInputChange('supplier_id', value)}>
                  <SelectTrigger className="font-tajawal">
                    <SelectValue placeholder="اختر المورد" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-tajawal">تاريخ الفاتورة *</Label>
                <Input
                  type="date"
                  value={formData.invoice_date}
                  onChange={(e) => handleInputChange('invoice_date', e.target.value)}
                  required
                  className="font-tajawal"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-tajawal">تاريخ الاستحقاق</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => handleInputChange('due_date', e.target.value)}
                  className="font-tajawal"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-tajawal">تفاصيل الأصناف</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label className="font-tajawal">عدد الأصناف</Label>
                 <Input
                   type="number"
                   value={formData.items_count}
                   onChange={(e) => setFormData(prev => ({ ...prev, items_count: parseInt(e.target.value) || 1 }))}
                   min="1"
                   readOnly
                   className="bg-muted/50 font-tajawal"
                 />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="font-tajawal">أصناف الفاتورة</CardTitle>
              <Button type="button" onClick={addItem} variant="outline" size="sm" className="font-tajawal">
                <Plus className="h-4 w-4 ml-2" />
                إضافة صنف
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-tajawal">المنتج</TableHead>
                  <TableHead className="font-tajawal">الكمية</TableHead>
                  <TableHead className="font-tajawal">تكلفة الوحدة</TableHead>
                  <TableHead className="font-tajawal">الإجمالي</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="min-w-[300px]">
                      <ProductSelector
                        value={item.product_name}
                        onChange={(productName, productData) => handleProductSelect(index, productName, productData)}
                        onProductAdded={() => {
                          // تحديث قائمة المنتجات بعد الإضافة
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                        min="1"
                        step="1"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.unit_cost}
                        onChange={(e) => handleItemChange(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                        min="0.01"
                        step="0.01"
                      />
                    </TableCell>
                    <TableCell className="font-medium bg-muted/50 text-center font-tajawal">
                      {item.total_cost.toLocaleString()} ج.م
                    </TableCell>
                    <TableCell>
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex justify-end mt-4">
              <div className="text-right space-y-2">
                <p className="text-lg font-tajawal"><strong>الإجمالي: {calculateTotal().toLocaleString()} ج.م</strong></p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => navigate('/purchases/invoices')} className="font-cairo">
            إلغاء
          </Button>
          <Button type="submit" className="font-cairo">
            <Save className="h-4 w-4 ml-2" />
            حفظ الفاتورة
          </Button>
        </div>
      </form>
    </div>
  );
}