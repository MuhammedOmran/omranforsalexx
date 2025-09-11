import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface InvoiceItem {
  id?: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string | null;
  total_amount: number;
  status: string;
  notes?: string;
  invoice_date?: string;
  created_at: string;
  updated_at: string;
}

interface EditSalesInvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onUpdate: () => void;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

interface Customer {
  id: string;
  name: string;
}

export default function EditSalesInvoiceDialog({
  isOpen,
  onClose,
  invoice,
  onUpdate
}: EditSalesInvoiceDialogProps) {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  
  // بيانات الفاتورة
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [status, setStatus] = useState("draft");
  const [notes, setNotes] = useState("");
  
  // عنصر جديد
  const [newItem, setNewItem] = useState({
    product_id: "",
    quantity: 1,
    unit_price: 0
  });

  // تحميل البيانات عند فتح الحوار
  useEffect(() => {
    if (isOpen && invoice) {
      loadInvoiceData();
      loadProducts();
      loadCustomers();
    }
  }, [isOpen, invoice]);

  const loadInvoiceData = async () => {
    if (!invoice) return;
    
    setInvoiceNumber(invoice.invoice_number);
    setCustomerId(invoice.customer_id);
    setStatus(invoice.status);
    setNotes(invoice.notes || "");
    
    // تحميل عناصر الفاتورة
    const { data: invoiceItems, error } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoice.id);
    
    if (error) {
      console.error('خطأ في تحميل عناصر الفاتورة:', error);
      toast.error('خطأ في تحميل عناصر الفاتورة');
      return;
    }
    
    setItems(invoiceItems || []);
  };

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, stock')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .order('name');
    
    if (error) {
      console.error('خطأ في تحميل المنتجات:', error);
      return;
    }
    
    setProducts(data || []);
  };

  const loadCustomers = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('id, name')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .order('name');
    
    if (error) {
      console.error('خطأ في تحميل العملاء:', error);
      return;
    }
    
    setCustomers(data || []);
  };

  const addItem = () => {
    if (!newItem.product_id) {
      toast.error('يرجى اختيار منتج');
      return;
    }

    const product = products.find(p => p.id === newItem.product_id);
    if (!product) {
      toast.error('المنتج غير موجود');
      return;
    }

    if (newItem.quantity > product.stock) {
      toast.error(`الكمية المتاحة: ${product.stock}`);
      return;
    }

    const item: InvoiceItem = {
      id: `temp_${Date.now()}`,
      product_id: newItem.product_id,
      product_name: product.name,
      quantity: newItem.quantity,
      unit_price: newItem.unit_price || product.price,
      total_price: newItem.quantity * (newItem.unit_price || product.price)
    };

    setItems([...items, item]);
    setNewItem({ product_id: "", quantity: 1, unit_price: 0 });
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) return;
    
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      quantity,
      total_price: quantity * updatedItems[index].unit_price
    };
    setItems(updatedItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.total_price, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invoice || items.length === 0) {
      toast.error('يرجى إضافة عناصر للفاتورة');
      return;
    }

    setLoading(true);
    
    try {
      const totalAmount = calculateTotal();
      
      // تحديث الفاتورة
      const { error: invoiceError } = await supabase
        .from('invoices')
        .update({
          customer_id: customerId,
          total_amount: totalAmount,
          status,
          notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoice.id);

      if (invoiceError) throw invoiceError;

      // حذف العناصر القديمة
      await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', invoice.id);

      // إضافة العناصر الجديدة
      const itemsToInsert = items.map(item => ({
        invoice_id: invoice.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast.success('تم تحديث الفاتورة بنجاح');
      onUpdate();
      onClose();
      
    } catch (error) {
      console.error('خطأ في تحديث الفاتورة:', error);
      toast.error('حدث خطأ في تحديث الفاتورة');
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = products.find(p => p.id === newItem.product_id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">تعديل فاتورة المبيعات</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* معلومات الفاتورة الأساسية */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">معلومات الفاتورة</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>رقم الفاتورة</Label>
                <Input value={invoiceNumber} disabled className="bg-muted" />
              </div>
              
              <div className="space-y-2">
                <Label>العميل</Label>
                <Select value={customerId || ""} onValueChange={setCustomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر العميل" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>حالة الفاتورة</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">مسودة</SelectItem>
                    <SelectItem value="paid">مدفوعة</SelectItem>
                    <SelectItem value="pending">معلقة</SelectItem>
                    <SelectItem value="cancelled">ملغية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* إضافة منتج جديد */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">إضافة منتج</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-2">
                  <Label>المنتج</Label>
                  <Select 
                    value={newItem.product_id} 
                    onValueChange={(value) => {
                      const product = products.find(p => p.id === value);
                      setNewItem(prev => ({ 
                        ...prev, 
                        product_id: value,
                        unit_price: product?.price || 0
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المنتج" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - {product.price.toLocaleString()} ج.م
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
                    max={selectedProduct?.stock || 999}
                    value={newItem.quantity}
                    onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  />
                  {selectedProduct && (
                    <p className="text-xs text-muted-foreground">
                      متاح: {selectedProduct.stock}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>السعر</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newItem.unit_price}
                    onChange={(e) => setNewItem(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
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
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={item.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <div>
                          <p className="font-medium">{item.product_name}</p>
                        </div>
                        <div>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 1)}
                            className="w-20"
                          />
                        </div>
                        <div>
                          <Badge variant="outline">
                            {item.unit_price.toLocaleString()} ج.م
                          </Badge>
                        </div>
                        <div>
                          <Badge>
                            {item.total_price.toLocaleString()} ج.م
                          </Badge>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                {/* المجموع */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>المجموع الإجمالي:</span>
                    <span>{calculateTotal().toLocaleString()} ج.م</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ملاحظات */}
          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ملاحظات إضافية..."
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit" disabled={loading || items.length === 0}>
              {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              {loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}