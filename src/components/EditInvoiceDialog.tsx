import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { PurchaseInvoice, PurchaseInvoiceItem } from "@/hooks/usePurchaseInvoices";
import { ProductSelector } from "@/components/inventory/ProductSelector";

interface EditInvoiceDialogProps {
  invoice: PurchaseInvoice | null;
  invoiceItems: PurchaseInvoiceItem[];
  suppliers: Array<{ id: string; name: string }>;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (
    invoiceId: string,
    invoiceData: Partial<Omit<PurchaseInvoice, 'id' | 'user_id' | 'created_at' | 'updated_at'>>,
    items: PurchaseInvoiceItem[]
  ) => Promise<boolean>;
}

export default function EditInvoiceDialog({
  invoice,
  invoiceItems,
  suppliers,
  isOpen,
  onClose,
  onUpdate
}: EditInvoiceDialogProps) {
  const [editData, setEditData] = useState({
    invoiceNumber: "",
    supplierName: "",
    invoiceDate: new Date(),
    dueDate: null as Date | null,
    paymentMethod: "cash",
    notes: "",
    items: [] as PurchaseInvoiceItem[]
  });

  const [newItem, setNewItem] = useState({
    product_id: "",
    product_name: "",
    quantity: 1,
    unit_cost: 0
  });

  useEffect(() => {
    if (invoice && invoiceItems) {
      setEditData({
        invoiceNumber: invoice.invoice_number,
        supplierName: invoice.supplier_name,
        invoiceDate: new Date(invoice.invoice_date),
        dueDate: invoice.due_date ? new Date(invoice.due_date) : null,
        paymentMethod: invoice.payment_method || "cash",
        notes: invoice.notes || "",
        items: invoiceItems
      });
    }
  }, [invoice, invoiceItems]);

  const handleAddItem = () => {
    if (newItem.product_id && newItem.product_name && newItem.quantity > 0 && newItem.unit_cost > 0) {
      const item: PurchaseInvoiceItem = {
        product_id: newItem.product_id,
        product_name: newItem.product_name,
        quantity: newItem.quantity,
        unit_cost: newItem.unit_cost,
        total_cost: newItem.quantity * newItem.unit_cost
      };
      
      setEditData(prev => ({
        ...prev,
        items: [...prev.items, item]
      }));
      
      setNewItem({
        product_id: "",
        product_name: "",
        quantity: 1,
        unit_cost: 0
      });
    }
  };

  const handleRemoveItem = (index: number) => {
    setEditData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const getTotals = () => {
    const subtotal = editData.items.reduce((sum, item) => sum + item.total_cost, 0);
    return {
      subtotal,
      total_amount: subtotal
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invoice || editData.items.length === 0) {
      return;
    }

    const totals = getTotals();
    const invoiceData = {
      supplier_name: editData.supplierName,
      invoice_number: editData.invoiceNumber,
      invoice_date: format(editData.invoiceDate, 'yyyy-MM-dd'),
      due_date: editData.dueDate ? format(editData.dueDate, 'yyyy-MM-dd') : null,
      subtotal: totals.subtotal,
      total_amount: totals.total_amount,
      payment_method: editData.paymentMethod,
      notes: editData.notes || null
    };

    const success = await onUpdate(invoice.id, invoiceData, editData.items);
    if (success) {
      onClose();
    }
  };

  const totals = getTotals();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-cairo">تعديل الفاتورة</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* معلومات الفاتورة الأساسية */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invoiceNumber" className="font-tajawal">رقم الفاتورة</Label>
              <Input
                id="invoiceNumber"
                value={editData.invoiceNumber}
                onChange={(e) => setEditData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                className="font-tajawal"
              />
            </div>
            
            <div>
              <Label htmlFor="supplier" className="font-tajawal">المورد</Label>
              <Select
                value={editData.supplierName}
                onValueChange={(value) => setEditData(prev => ({ ...prev, supplierName: value }))}
              >
                <SelectTrigger className="font-tajawal">
                  <SelectValue placeholder="اختر المورد" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.name}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* التواريخ */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="font-tajawal">تاريخ الفاتورة</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !editData.invoiceDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {editData.invoiceDate ? format(editData.invoiceDate, "PPP", { locale: ar }) : "اختر التاريخ"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={editData.invoiceDate}
                    onSelect={(date) => date && setEditData(prev => ({ ...prev, invoiceDate: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label className="font-tajawal">تاريخ الاستحقاق</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !editData.dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {editData.dueDate ? format(editData.dueDate, "PPP", { locale: ar }) : "اختر التاريخ"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={editData.dueDate}
                    onSelect={(date) => setEditData(prev => ({ ...prev, dueDate: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* طريقة الدفع */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="font-tajawal">طريقة الدفع</Label>
              <Select
                value={editData.paymentMethod}
                onValueChange={(value) => setEditData(prev => ({ ...prev, paymentMethod: value }))}
              >
                <SelectTrigger className="font-tajawal">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">عاجل (كاش)</SelectItem>
                  <SelectItem value="credit">آجل (دين)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* عناصر الفاتورة */}
          <div>
            <Label className="text-lg font-semibold font-cairo">عناصر الفاتورة</Label>
            
            {/* قائمة العناصر الحالية */}
            {editData.items.length > 0 && (
              <div className="mt-4 border rounded-lg">
                <div className="grid grid-cols-5 gap-4 p-4 bg-muted font-semibold font-tajawal">
                  <div>المنتج</div>
                  <div>الكمية</div>
                  <div>سعر الوحدة</div>
                  <div>الإجمالي</div>
                  <div>الإجراءات</div>
                </div>
                {editData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-5 gap-4 p-4 border-t">
                    <div className="font-tajawal">{item.product_name}</div>
                    <div className="font-tajawal">{item.quantity}</div>
                    <div className="font-tajawal">{item.unit_cost.toLocaleString('ar-SA')} ج.م</div>
                    <div className="font-tajawal">{item.total_cost.toLocaleString('ar-SA')} ج.م</div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveItem(index)}
                      className="font-cairo"
                    >
                      حذف
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* إضافة عنصر جديد */}
            <div className="mt-4 p-4 border rounded-lg bg-muted/50">
              <h3 className="font-semibold font-cairo mb-3">إضافة عنصر جديد</h3>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label className="font-tajawal">المنتج</Label>
                  <ProductSelector
                    value={newItem.product_name}
                    onChange={(productName, productData) =>
                      setNewItem(prev => ({
                        ...prev,
                        product_name: productName,
                        product_id: productData?.id || ""
                      }))}
                  />
                </div>
                <div>
                  <Label className="font-tajawal">الكمية</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                    className="font-tajawal"
                  />
                </div>
                <div>
                  <Label className="font-tajawal">سعر الوحدة</Label>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={newItem.unit_cost}
                    onChange={(e) => setNewItem(prev => ({ ...prev, unit_cost: parseFloat(e.target.value) || 0 }))}
                    className="font-tajawal"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={handleAddItem}
                    className="w-full font-cairo"
                  >
                    إضافة
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* ملاحظات */}
          <div>
            <Label htmlFor="notes" className="font-tajawal">ملاحظات</Label>
            <Textarea
              id="notes"
              value={editData.notes}
              onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="ملاحظات إضافية..."
              rows={3}
              className="font-tajawal"
            />
          </div>

          {/* المجموع */}
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between items-center text-lg font-bold">
              <span className="font-cairo">المجموع الإجمالي:</span>
              <span className="font-tajawal">
                {totals.total_amount.toLocaleString('ar-SA')} ج.م
              </span>
            </div>
          </div>

          {/* أزرار الحفظ والإلغاء */}
          <div className="flex justify-end space-x-2 space-x-reverse">
            <Button type="button" variant="outline" onClick={onClose} className="font-cairo">
              إلغاء
            </Button>
            <Button type="submit" className="font-cairo">
              حفظ التعديلات
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}