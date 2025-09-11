import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  CalendarIcon,
  FileText,
  DollarSign,
  Package,
  RefreshCw,
  RotateCcw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePurchaseInvoices, PurchaseInvoice, PurchaseInvoiceItem } from "@/hooks/usePurchaseInvoices";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useInventory } from "@/hooks/useInventory";
import EditInvoiceDialog from "@/components/EditInvoiceDialog";
import { ProductSelector } from "@/components/inventory/ProductSelector";
import { formatNumberEnglish, formatCurrencyEnglish, formatDateEnglish } from "@/utils/numberLocalization";

export default function PurchaseInvoices() {
  // استخدام Supabase hooks
  const { suppliers } = useSuppliers();
  const { products } = useInventory();
  const { 
    invoices, 
    deletedInvoices,
    loading, 
    addInvoice,
    updateInvoice,
    updatePaymentStatus, 
    deleteInvoice, 
    restoreInvoice,
    permanentDeleteInvoice,
    permanentDeleteAllInvoices,
    fetchDeletedInvoices,
    getInvoiceItems,
    syncExistingInvoicesWithCash
  } = usePurchaseInvoices();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [invoiceItems, setInvoiceItems] = useState<PurchaseInvoiceItem[]>([]);

  const { toast } = useToast();

  // Form state for new invoice
  const [newInvoice, setNewInvoice] = useState({
    invoiceNumber: "",
    supplier: "",
    productId: "", // إضافة product_id للربط مع المخزون
    productName: "",
    category: "",
    quantity: 0,
    unitCost: 0,
    paymentType: "cash", // "cash" للعاجل أو "credit" للآجل
    paidAmount: 0,
    date: new Date(),
    total: 0,
    items: 0,
    notes: ""
  });

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.supplier_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      paid: "default",
      pending: "secondary", 
      overdue: "destructive",
      cancelled: "outline"
    } as const;
    
    const labels = {
      paid: "مدفوع",
      pending: "معلق",
      overdue: "متأخر",
      cancelled: "ملغي"
    };
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newInvoice.supplier || !newInvoice.productName || newInvoice.quantity <= 0 || newInvoice.unitCost <= 0) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    // منع الإرسال المتعدد
    const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
    if (submitButton) {
      submitButton.disabled = true;
    }

    try {
      // البحث عن المورد للحصول على ID
      const selectedSupplier = suppliers.find(s => s.name === newInvoice.supplier);
      
      const total = newInvoice.quantity * newInvoice.unitCost;
        const invoiceData = {
          supplier_id: selectedSupplier?.id || null,
          supplier_name: newInvoice.supplier,
          invoice_number: `pl-${Date.now().toString().slice(-6)}`,
          invoice_date: format(newInvoice.date, 'yyyy-MM-dd'),
          subtotal: total,
          tax_amount: 0,
          discount_amount: 0,
          total_amount: total,
          paid_amount: newInvoice.paidAmount,
          payment_method: newInvoice.paymentType,
          notes: newInvoice.notes || null
        };

      const items: PurchaseInvoiceItem[] = [{
        product_id: newInvoice.productId || null, // ربط المنتج بالمخزون
        product_name: newInvoice.productName,
        quantity: newInvoice.quantity,
        unit_cost: newInvoice.unitCost,
        total_cost: total,
        notes: newInvoice.category ? `الفئة: ${newInvoice.category}` : null
      }];

      const success = await addInvoice(invoiceData, items);
      if (success) {
        setIsAddDialogOpen(false);
        setNewInvoice({
          invoiceNumber: `pl-${invoices.length + 2}`,
          supplier: "",
          productId: "", // إعادة تعيين معرف المنتج
          productName: "",
          category: "",
          quantity: 0,
          unitCost: 0,
          paymentType: "cash",
          paidAmount: 0,
          date: new Date(),
          total: 0,
          items: 0,
          notes: ""
        });
      }
    } finally {
      // إعادة تفعيل الزر
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  };

  const handleViewInvoice = async (invoice: PurchaseInvoice) => {
    setSelectedInvoice(invoice);
    const items = await getInvoiceItems(invoice.id);
    setInvoiceItems(items);
    setIsViewDialogOpen(true);
  };

  const handleEditInvoice = async (invoice: PurchaseInvoice) => {
    setSelectedInvoice(invoice);
    const items = await getInvoiceItems(invoice.id);
    setInvoiceItems(items);
    setIsEditDialogOpen(true);
  };

  const handleUpdateInvoice = async (
    invoiceId: string,
    invoiceData: Partial<Omit<PurchaseInvoice, 'id' | 'user_id' | 'created_at' | 'updated_at'>>,
    items: PurchaseInvoiceItem[]
  ) => {
    const success = await updateInvoice(invoiceId, invoiceData, items);
    if (success) {
      setIsEditDialogOpen(false);
      setSelectedInvoice(null);
      setInvoiceItems([]);
    }
    return success;
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    const success = await deleteInvoice(invoiceId);
    if (success && selectedInvoice?.id === invoiceId) {
      setSelectedInvoice(null);
      setIsViewDialogOpen(false);
    }
  };

  const handleUpdatePayment = async (invoiceId: string, paidAmount: number) => {
    const success = await updatePaymentStatus(invoiceId, paidAmount);
    if (success) {
      // تحديث الفاتورة المحددة إذا كانت مفتوحة
      if (selectedInvoice?.id === invoiceId) {
        const updatedInvoice = invoices.find(inv => inv.id === invoiceId);
        if (updatedInvoice) {
          setSelectedInvoice(updatedInvoice);
        }
      }
    }
  };

  const handleOpenRestoreDialog = async () => {
    await fetchDeletedInvoices();
    setIsRestoreDialogOpen(true);
  };

  const handleRestoreInvoice = async (invoiceId: string) => {
    const success = await restoreInvoice(invoiceId);
    if (success) {
      // إغلاق الـ dialog إذا لم تعد هناك فواتير محذوفة
      if (deletedInvoices.length === 1) {
        setIsRestoreDialogOpen(false);
      }
    }
  };

  const handlePermanentDelete = async (invoiceId: string) => {
    const success = await permanentDeleteInvoice(invoiceId);
    if (success) {
      // إغلاق الـ dialog إذا لم تعد هناك فواتير محذوفة
      if (deletedInvoices.length === 1) {
        setIsRestoreDialogOpen(false);
      }
    }
  };

  const handlePermanentDeleteAll = async () => {
    const success = await permanentDeleteAllInvoices();
    if (success) {
      setIsRestoreDialogOpen(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold font-cairo">فواتير الشراء</h1>
          <p className="text-muted-foreground mt-1 font-cairo">
            إدارة فواتير المشتريات والمدفوعات للموردين
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="font-cairo">
                <Plus className="ml-2 h-4 w-4" />
                إضافة فاتورة شراء
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-cairo">إضافة فاتورة شراء جديدة</DialogTitle>
              </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="invoiceNumber" className="font-tajawal">رقم الفاتورة</Label>
                  <Input
                    id="invoiceNumber"
                    value={`pl-${invoices.length + 1}`}
                    readOnly
                    className="font-tajawal bg-muted"
                  />
                </div>
                <div>
                  <Label htmlFor="supplier" className="font-tajawal">المورد *</Label>
                  <Select
                    value={newInvoice.supplier}
                    onValueChange={(value) => setNewInvoice(prev => ({ ...prev, supplier: value }))}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-tajawal">اسم المنتج *</Label>
                  <ProductSelector
                    value={newInvoice.productName}
                     onChange={(productName, productData) => {
                        setNewInvoice(prev => ({ 
                          ...prev, 
                          productId: productData?.id || "", // حفظ معرف المنتج
                          productName,
                          unitCost: productData?.cost || productData?.price || prev.unitCost
                        }));
                    }}
                    onProductAdded={() => {
                      // تحديث قائمة المنتجات بعد الإضافة
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="category" className="font-tajawal">الفئة</Label>
                  <Input
                    id="category"
                    value={newInvoice.category}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="فئة المنتج"
                    className="font-tajawal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity" className="font-tajawal">الكمية *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={newInvoice.quantity || ""}
                    onChange={(e) => {
                      const quantity = parseInt(e.target.value) || 0;
                      const total = quantity * newInvoice.unitCost;
                      setNewInvoice(prev => ({ 
                        ...prev, 
                        quantity,
                        paidAmount: prev.paymentType === 'cash' ? total : prev.paidAmount
                      }));
                    }}
                    required
                    className="font-tajawal"
                  />
                </div>
                <div>
                  <Label htmlFor="unitCost" className="font-tajawal">سعر الوحدة *</Label>
                  <Input
                    id="unitCost"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={newInvoice.unitCost || ""}
                    onChange={(e) => {
                      const unitCost = parseFloat(e.target.value) || 0;
                      const total = newInvoice.quantity * unitCost;
                      setNewInvoice(prev => ({ 
                        ...prev, 
                        unitCost,
                        paidAmount: prev.paymentType === 'cash' ? total : prev.paidAmount
                      }));
                    }}
                    required
                    className="font-tajawal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-tajawal">نوع الدفع</Label>
                  <Select
                    value={newInvoice.paymentType}
                    onValueChange={(value) => {
                      const total = newInvoice.quantity * newInvoice.unitCost;
                      setNewInvoice(prev => ({ 
                        ...prev, 
                        paymentType: value,
                        paidAmount: value === 'cash' ? total : 0
                      }));
                    }}
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
                <div>
                  <Label htmlFor="paidAmount" className="font-tajawal">المبلغ المدفوع</Label>
                  <Input
                    id="paidAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newInvoice.paymentType === 'cash' ? (newInvoice.quantity * newInvoice.unitCost) : newInvoice.paidAmount || ""}
                    onChange={(e) => {
                      if (newInvoice.paymentType !== 'cash') {
                        setNewInvoice(prev => ({ ...prev, paidAmount: parseFloat(e.target.value) || 0 }));
                      }
                    }}
                    readOnly={newInvoice.paymentType === 'cash'}
                    className={`font-tajawal ${newInvoice.paymentType === 'cash' ? 'bg-muted' : ''}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-tajawal">تاريخ الفاتورة</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newInvoice.date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {newInvoice.date ? format(newInvoice.date, "PPP", { locale: ar }) : "اختر التاريخ"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newInvoice.date}
                        onSelect={(date) => date && setNewInvoice(prev => ({ ...prev, date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                {newInvoice.paymentType === 'credit' && (
                  <div>
                    <Label htmlFor="paidAmount" className="font-tajawal">المبلغ المدفوع</Label>
                    <Input
                      id="paidAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newInvoice.paidAmount || ""}
                      onChange={(e) => {
                        setNewInvoice(prev => ({ ...prev, paidAmount: parseFloat(e.target.value) || 0 }));
                      }}
                      className="font-tajawal"
                    />
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="notes" className="font-tajawal">ملاحظات</Label>
                <Textarea
                  id="notes"
                  value={newInvoice.notes}
                  onChange={(e) => setNewInvoice(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="ملاحظات إضافية..."
                  rows={3}
                  className="font-tajawal"
                />
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-tajawal">إجمالي التكلفة:</span>
                   <span className="font-bold text-lg font-tajawal">
                     {formatCurrencyEnglish(newInvoice.quantity * newInvoice.unitCost)}
                   </span>
                </div>
              </div>

              <div className="flex justify-end space-x-2 space-x-reverse">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="font-cairo">
                  إلغاء
                </Button>
                <Button type="submit" className="font-cairo" disabled={loading}>
                  {loading ? 'جاري الحفظ...' : 'إضافة الفاتورة'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        <Button variant="destructive" className="font-cairo" onClick={handleOpenRestoreDialog}>
          <FileText className="h-4 w-4 ml-2" />
          استعادة الفواتير المحذوفة
        </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="البحث برقم الفاتورة أو اسم المورد..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="فلتر حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="pending">معلق</SelectItem>
                <SelectItem value="paid">مدفوع</SelectItem>
                <SelectItem value="overdue">متأخر</SelectItem>
                <SelectItem value="cancelled">ملغي</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <span className="font-cairo">قائمة فواتير الشراء</span>
            </div>
            <span className="text-sm font-normal text-muted-foreground">
              {loading ? 'جاري التحميل...' : `${filteredInvoices.length} فاتورة`}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">جاري تحميل الفواتير...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2 font-tajawal">لا توجد فواتير</h3>
              <p className="text-muted-foreground mb-4 font-tajawal">
                {searchTerm || statusFilter !== 'all' 
                  ? 'لا توجد فواتير تطابق معايير البحث المحددة'
                  : 'لم تقم بإضافة أي فواتير شراء بعد'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="ml-2 h-4 w-4" />
                  إضافة أول فاتورة
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-tajawal">رقم الفاتورة</TableHead>
                  <TableHead className="font-tajawal">المورد</TableHead>
                  <TableHead className="font-tajawal">التاريخ</TableHead>
                  <TableHead className="font-tajawal">تاريخ الاستحقاق</TableHead>
                  <TableHead className="font-tajawal">المبلغ الإجمالي</TableHead>
                  <TableHead className="font-tajawal">المبلغ المدفوع</TableHead>
                  <TableHead className="font-tajawal">الحالة</TableHead>
                  <TableHead className="font-tajawal">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium font-tajawal">
                      {invoice.invoice_number}
                    </TableCell>
                    <TableCell className="font-tajawal">{invoice.supplier_name}</TableCell>
                    <TableCell className="font-tajawal">
                      {formatDateEnglish(invoice.invoice_date, 'en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="font-tajawal">
                      {invoice.due_date ? formatDateEnglish(invoice.due_date, 'en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}
                    </TableCell>
                    <TableCell className="font-tajawal">
                      {formatCurrencyEnglish(invoice.total_amount)}
                    </TableCell>
                    <TableCell className="font-tajawal">
                      {formatCurrencyEnglish(invoice.paid_amount)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(invoice.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewInvoice(invoice)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditInvoice(invoice)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteInvoice(invoice.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Invoice Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-cairo">تفاصيل الفاتورة</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-cairo">رقم الفاتورة</Label>
                  <p className="font-medium font-tajawal">{selectedInvoice.invoice_number}</p>
                </div>
                <div>
                  <Label className="font-cairo">المورد</Label>
                  <p className="font-medium font-tajawal">{selectedInvoice.supplier_name}</p>
                </div>
                <div>
                  <Label className="font-cairo">تاريخ الفاتورة</Label>
                  <p className="font-tajawal">{format(new Date(selectedInvoice.invoice_date), "dd/MM/yyyy", { locale: ar })}</p>
                </div>
                <div>
                  <Label className="font-cairo">الحالة</Label>
                  <div>{getStatusBadge(selectedInvoice.status)}</div>
                </div>
                <div>
                  <Label className="font-cairo">طريقة الدفع</Label>
                  <p className="font-tajawal">{selectedInvoice.payment_method === 'cash' ? 'عاجل (كاش)' : 'آجل (دين)'}</p>
                </div>
              </div>

              {invoiceItems.length > 0 && (
                <div>
                  <Label className="text-base font-semibold font-cairo">عناصر الفاتورة</Label>
                  <Table className="mt-2">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-tajawal">المنتج</TableHead>
                        <TableHead className="font-tajawal">الكمية</TableHead>
                        <TableHead className="font-tajawal">سعر الوحدة</TableHead>
                        <TableHead className="font-tajawal">الإجمالي</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoiceItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-tajawal">{item.product_name}</TableCell>
                          <TableCell className="font-tajawal">{item.quantity}</TableCell>
                          <TableCell className="font-tajawal">{formatCurrencyEnglish(item.unit_cost)}</TableCell>
                          <TableCell className="font-tajawal">{formatCurrencyEnglish(item.total_cost)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-cairo">المجموع الفرعي:</span>
                      <span className="font-cairo">{formatCurrencyEnglish(selectedInvoice.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-cairo">الضريبة:</span>
                      <span className="font-cairo">{formatCurrencyEnglish(selectedInvoice.tax_amount || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-cairo">الخصم:</span>
                      <span className="font-cairo">{formatCurrencyEnglish(selectedInvoice.discount_amount || 0)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span className="font-cairo">الإجمالي:</span>
                      <span className="font-cairo">{formatCurrencyEnglish(selectedInvoice.total_amount)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span className="font-cairo">المدفوع:</span>
                      <span className="font-cairo">{formatCurrencyEnglish(selectedInvoice.paid_amount)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span className="font-cairo">المتبقي:</span>
                      <span className="font-cairo">{formatCurrencyEnglish(selectedInvoice.total_amount - selectedInvoice.paid_amount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedInvoice.notes && (
                <div>
                  <Label className="font-cairo">ملاحظات</Label>
                  <p className="text-sm text-muted-foreground font-tajawal">{selectedInvoice.notes}</p>
                </div>
              )}

              {selectedInvoice.status !== 'paid' && (
                <div className="border-t pt-4">
                  <Label className="font-cairo">تحديث المبلغ المدفوع</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      type="number"
                      placeholder="المبلغ المدفوع"
                      max={selectedInvoice.total_amount}
                      min={0}
                      step={0.01}
                      id="updatePayment"
                      className="font-tajawal"
                    />
                    <Button
                      onClick={() => {
                        const input = document.getElementById('updatePayment') as HTMLInputElement;
                        const amount = parseFloat(input.value);
                        if (amount >= 0 && amount <= selectedInvoice.total_amount) {
                          handleUpdatePayment(selectedInvoice.id, amount);
                          input.value = '';
                        }
                      }}
                      className="font-cairo"
                    >
                      تحديث الدفعة
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Invoice Dialog */}
      <EditInvoiceDialog
        invoice={selectedInvoice}
        invoiceItems={invoiceItems}
        suppliers={suppliers}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setSelectedInvoice(null);
          setInvoiceItems([]);
        }}
        onUpdate={handleUpdateInvoice}
      />

      {/* Restore Deleted Invoices Dialog */}
      <Dialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-cairo">استعادة الفواتير المحذوفة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {deletedInvoices.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground font-tajawal">لا توجد فواتير محذوفة</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-tajawal mb-4">
                  يمكنك استعادة الفواتير المحذوفة أو حذفها نهائياً
                </p>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right font-cairo">رقم الفاتورة</TableHead>
                        <TableHead className="text-right font-cairo">المورد</TableHead>
                        <TableHead className="text-right font-cairo">التاريخ</TableHead>
                        <TableHead className="text-right font-cairo">المبلغ الإجمالي</TableHead>
                        <TableHead className="text-right font-cairo">تاريخ الحذف</TableHead>
                        <TableHead className="text-center font-cairo">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deletedInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-mono">{invoice.invoice_number}</TableCell>
                          <TableCell className="font-tajawal">{invoice.supplier_name}</TableCell>
                          <TableCell className="font-tajawal">
                            {formatDateEnglish(invoice.invoice_date, 'en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </TableCell>
                          <TableCell className="font-mono">
                            {formatCurrencyEnglish(invoice.total_amount)}
                          </TableCell>
                          <TableCell className="font-tajawal">
                            {invoice.deleted_at 
                              ? formatDateEnglish(invoice.deleted_at, 'en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                              : '-'
                            }
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleRestoreInvoice(invoice.id)}
                                className="font-cairo"
                              >
                                استعادة
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  if (confirm('هل أنت متأكد من حذف هذه الفاتورة نهائياً؟ لا يمكن التراجع عن هذا الإجراء!')) {
                                    handlePermanentDelete(invoice.id);
                                  }
                                }}
                                className="font-cairo"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
            <div className="flex justify-between mt-6">
              {deletedInvoices.length > 0 && (
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    if (confirm('هل أنت متأكد من حذف جميع الفواتير المحذوفة نهائياً؟ لا يمكن التراجع عن هذا الإجراء!')) {
                      handlePermanentDeleteAll();
                    }
                  }}
                  className="font-cairo"
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4 ml-2" />
                  حذف جميع الفواتير نهائياً
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => setIsRestoreDialogOpen(false)}
                className="font-cairo"
              >
                إغلاق
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}