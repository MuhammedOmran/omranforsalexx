import { useState, useEffect } from "react";
import { Plus, Search, Calendar, DollarSign, FileText, Trash2, Edit, CheckCircle, AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { installmentsManager, DeletedInstallment } from "@/utils/installmentsManager";

interface Installment {
  id: string;
  user_id: string;
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  installment_amount: number;
  installment_period: number;
  start_date: string;
  due_date: string;
  status: 'active' | 'completed' | 'overdue' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
  paymentHistory?: PaymentRecord[];
}

interface PaymentRecord {
  id: string;
  amount: number;
  date: string;
  notes?: string;
}

export default function Installments() {
  const { toast } = useToast();
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInstallments = async () => {
    setLoading(true);
    const data = await installmentsManager.getInstallments();
    setInstallments(data);
    setLoading(false);
  };

  const loadDeletedInstallments = async () => {
    const data = await installmentsManager.getDeletedInstallments();
    setDeletedInstallments(data);
  };

  useEffect(() => {
    loadInstallments();
  }, []);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [editingInstallment, setEditingInstallment] = useState<Installment | null>(null);
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [deletedInstallments, setDeletedInstallments] = useState<DeletedInstallment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    totalAmount: "",
    installmentAmount: "",
    startDate: "",
    notes: ""
  });

  const [paymentData, setPaymentData] = useState({
    amount: "",
    notes: ""
  });

  const handleAddInstallment = async () => {
    if (!formData.customerName || !formData.customerPhone || !formData.totalAmount || !formData.installmentAmount || !formData.startDate) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    const totalAmount = parseFloat(formData.totalAmount);
    const installmentAmount = parseFloat(formData.installmentAmount);
    
    const installmentData = {
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      totalAmount,
      installmentAmount,
      installmentPeriod: 12, // Default period
      startDate: formData.startDate,
      dueDate: formData.startDate,
      notes: formData.notes,
    };

    let success = false;
    if (editingInstallment) {
      success = await installmentsManager.updateInstallment(editingInstallment.id, installmentData);
      if (success) {
        toast({
          title: "تم التحديث",
          description: "تم تحديث بيانات القسط بنجاح"
        });
      }
    } else {
      success = await installmentsManager.addInstallment(installmentData);
      if (success) {
        toast({
          title: "تم الإضافة",
          description: "تم إضافة القسط بنجاح"
        });
      }
    }
    
    if (success) {
      await loadInstallments();
      resetForm();
    } else {
      toast({
        title: "خطأ",
        description: "فشل في حفظ البيانات",
        variant: "destructive"
      });
    }
  };

  const handleAddPayment = async () => {
    if (!selectedInstallment || !paymentData.amount) {
      toast({
        title: "خطأ",
        description: "يرجى ملء مبلغ الدفع",
        variant: "destructive"
      });
      return;
    }

    const paymentAmount = parseFloat(paymentData.amount);
    
    if (paymentAmount > selectedInstallment.remaining_amount) {
      toast({
        title: "خطأ",
        description: "مبلغ الدفع أكبر من المبلغ المتبقي",
        variant: "destructive"
      });
      return;
    }

    const newPaymentData = {
      amount: paymentAmount,
      date: new Date().toISOString().split('T')[0],
      notes: paymentData.notes,
      paymentMethod: 'cash' as const
    };

    const success = await installmentsManager.addPayment(selectedInstallment.id, newPaymentData);
    
    if (success) {
      await loadInstallments();
      toast({
        title: "تم التسجيل",
        description: "تم تسجيل الدفعة بنجاح"
      });
      setPaymentData({ amount: "", notes: "" });
      setIsPaymentDialogOpen(false);
      setSelectedInstallment(null);
    } else {
      toast({
        title: "خطأ",
        description: "فشل في تسجيل الدفعة",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      customerName: "",
      customerPhone: "",
      totalAmount: "",
      installmentAmount: "",
      startDate: "",
      notes: ""
    });
    setEditingInstallment(null);
    setIsDialogOpen(false);
  };

  const handleEditInstallment = (installment: any) => {
    setEditingInstallment(installment);
    setFormData({
      customerName: installment.customer_name,
      customerPhone: installment.customer_phone,
      totalAmount: installment.total_amount.toString(),
      installmentAmount: installment.installment_amount.toString(),
      startDate: installment.start_date,
      notes: installment.notes || ""
    });
    setIsDialogOpen(true);
  };

  const handleDeleteInstallment = async (id: string) => {
    const success = await installmentsManager.deleteInstallment(id);
    if (success) {
      await loadInstallments();
      toast({
        title: "تم الحذف",
        description: "تم حذف القسط بنجاح"
      });
    } else {
      toast({
        title: "خطأ",
        description: "فشل في حذف القسط",
        variant: "destructive"
      });
    }
  };

  const handleRestoreInstallment = async (id: string) => {
    const success = await installmentsManager.restoreInstallment(id);
    if (success) {
      toast({
        title: "تم الاستعادة",
        description: "تم استعادة القسط بنجاح"
      });
      await loadInstallments();
      await loadDeletedInstallments();
    } else {
      toast({
        title: "خطأ",
        description: "فشل في استعادة القسط",
        variant: "destructive"
      });
    }
  };

  const handlePermanentDelete = async (id: string) => {
    const success = await installmentsManager.permanentlyDeleteInstallment(id);
    if (success) {
      toast({
        title: "تم الحذف نهائياً",
        description: "تم حذف القسط نهائياً"
      });
      await loadDeletedInstallments();
    } else {
      toast({
        title: "خطأ",
        description: "فشل في الحذف النهائي",
        variant: "destructive"
      });
    }
  };

  const handleOpenRestoreDialog = () => {
    loadDeletedInstallments();
    setIsRestoreDialogOpen(true);
  };

  const openPaymentDialog = (installment: Installment) => {
    setSelectedInstallment(installment);
    setPaymentData({ amount: selectedInstallment.installment_amount?.toString() || "", notes: "" });
    setIsPaymentDialogOpen(true);
  };

  const filteredInstallments = installments.filter(installment => {
    const matchesSearch = installment.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         installment.customer_phone.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || installment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalAmount = installments.reduce((sum, installment) => sum + installment.total_amount, 0);
  const totalPaid = installments.reduce((sum, installment) => sum + installment.paid_amount, 0);
  const totalRemaining = installments.reduce((sum, installment) => sum + installment.remaining_amount, 0);
  const overdueCount = installments.filter(i => i.status === 'overdue').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="secondary">نشط</Badge>;
      case 'completed':
        return <Badge variant="default">مكتمل</Badge>;
      case 'overdue':
        return <Badge variant="destructive">متأخر</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-cairo">الأقساط</h1>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingInstallment(null)} className="font-cairo">
                <Plus className="h-4 w-4 ml-2" />
                إضافة قسط جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-cairo">{editingInstallment ? "تعديل القسط" : "إضافة قسط جديد"}</DialogTitle>
                <DialogDescription className="font-tajawal">
                  {editingInstallment ? "تعديل بيانات القسط" : "أدخل تفاصيل القسط الجديد"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="customerName" className="font-tajawal">اسم العميل *</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                    placeholder="اسم العميل"
                    className="font-tajawal"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="customerPhone" className="font-tajawal">رقم الهاتف *</Label>
                  <Input
                    id="customerPhone"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                    placeholder="05xxxxxxxx"
                    className="font-tajawal"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="totalAmount" className="font-tajawal">المبلغ الإجمالي *</Label>
                  <Input
                    id="totalAmount"
                    type="number"
                    value={formData.totalAmount}
                    onChange={(e) => setFormData({...formData, totalAmount: e.target.value})}
                    placeholder="0.00"
                    className="font-tajawal"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="installmentAmount" className="font-tajawal">مبلغ القسط *</Label>
                  <Input
                    id="installmentAmount"
                    type="number"
                    value={formData.installmentAmount}
                    onChange={(e) => setFormData({...formData, installmentAmount: e.target.value})}
                    placeholder="0.00"
                    className="font-tajawal"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="startDate" className="font-tajawal">تاريخ البداية *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="font-tajawal"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes" className="font-tajawal">ملاحظات</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="ملاحظات إضافية"
                    className="font-tajawal"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={resetForm} className="font-cairo">إلغاء</Button>
                <Button onClick={handleAddInstallment} className="font-cairo">
                  {editingInstallment ? "تحديث" : "إضافة"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button 
            variant="destructive" 
            onClick={handleOpenRestoreDialog}
            className="font-cairo"
          >
            <RotateCcw className="h-4 w-4 ml-2" />
            استعادة الأقساط المحذوفة
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">إجمالي المبالغ</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-tajawal">{totalAmount.toLocaleString()} ج.م</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">المبالغ المحصلة</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 font-tajawal">{totalPaid.toLocaleString()} ج.م</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">المبالغ المتبقية</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 font-tajawal">{totalRemaining.toLocaleString()} ج.م</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">الأقساط المتأخرة</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 font-tajawal">{overdueCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="font-cairo">البحث والتصفية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="البحث بالاسم أو رقم الهاتف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 font-tajawal"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-tajawal">جميع الحالات</SelectItem>
                <SelectItem value="active" className="font-tajawal">نشط</SelectItem>
                <SelectItem value="completed" className="font-tajawal">مكتمل</SelectItem>
                <SelectItem value="overdue" className="font-tajawal">متأخر</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Installments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="font-cairo">قائمة الأقساط</CardTitle>
          <CardDescription className="font-tajawal">
            عرض جميع الأقساط ({filteredInstallments.length} قسط)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-tajawal">العميل</TableHead>
                <TableHead className="font-tajawal">المبلغ الإجمالي</TableHead>
                <TableHead className="font-tajawal">المبلغ المدفوع</TableHead>
                <TableHead className="font-tajawal">المبلغ المتبقي</TableHead>
                <TableHead className="font-tajawal">قيمة القسط</TableHead>
                <TableHead className="font-tajawal">الحالة</TableHead>
                <TableHead className="font-tajawal">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInstallments.map((installment) => (
                <TableRow key={installment.id}>
                   <TableCell>
                      <div>
                        <div className="font-medium font-tajawal">{installment.customer_name}</div>
                        <div className="text-sm text-muted-foreground font-tajawal">{installment.customer_phone}</div>
                      </div>
                    </TableCell>
                     <TableCell className="font-medium font-tajawal">{installment.total_amount.toLocaleString()} ج.م</TableCell>
                     <TableCell className="text-green-600 font-tajawal">{installment.paid_amount.toLocaleString()} ج.م</TableCell>
                     <TableCell className="text-amber-600 font-tajawal">{installment.remaining_amount.toLocaleString()} ج.م</TableCell>
                     <TableCell className="font-tajawal">{installment.installment_amount.toLocaleString()} ج.م</TableCell>
                  <TableCell>{getStatusBadge(installment.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {installment.status !== 'completed' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openPaymentDialog(installment)}
                          className="font-tajawal"
                        >
                          دفع
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditInstallment(installment)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteInstallment(installment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تسجيل دفعة</DialogTitle>
            <DialogDescription>
              تسجيل دفعة جديدة للعميل {selectedInstallment?.customer_name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>المبلغ المتبقي: {selectedInstallment?.remaining_amount.toLocaleString()} ج.م</Label>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="paymentAmount">مبلغ الدفع *</Label>
              <Input
                id="paymentAmount"
                type="number"
                value={paymentData.amount}
                onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                placeholder="0.00"
                max={selectedInstallment?.remaining_amount}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="paymentNotes">ملاحظات</Label>
              <Textarea
                id="paymentNotes"
                value={paymentData.notes}
                onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
                placeholder="ملاحظات على الدفعة"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleAddPayment}>تسجيل الدفعة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Deleted Installments Dialog */}
      <Dialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-cairo">استعادة الأقساط المحذوفة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {deletedInstallments.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground font-tajawal">لا توجد أقساط محذوفة</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-tajawal mb-4">
                  يمكنك استعادة الأقساط المحذوفة أو حذفها نهائياً ({deletedInstallments.length} قسط محذوف)
                </p>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right font-cairo">اسم العميل</TableHead>
                        <TableHead className="text-right font-cairo">رقم الهاتف</TableHead>
                        <TableHead className="text-right font-cairo">المبلغ الإجمالي</TableHead>
                        <TableHead className="text-right font-cairo">مبلغ القسط</TableHead>
                        <TableHead className="text-right font-cairo">تاريخ البداية</TableHead>
                        <TableHead className="text-center font-cairo">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deletedInstallments.map((installment) => (
                        <TableRow key={installment.id}>
                          <TableCell className="font-tajawal">{installment.customer_name}</TableCell>
                          <TableCell className="font-tajawal">{installment.customer_phone}</TableCell>
                          <TableCell className="font-tajawal">
                            {installment.total_amount.toLocaleString('ar-SA')} ج.م
                          </TableCell>
                          <TableCell className="font-tajawal">
                            {installment.installment_amount.toLocaleString('ar-SA')} ج.م
                          </TableCell>
                          <TableCell className="font-tajawal">{installment.start_date}</TableCell>
                          <TableCell>
                            <div className="flex justify-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRestoreInstallment(installment.id)}
                                className="font-cairo"
                              >
                                استعادة
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handlePermanentDelete(installment.id)}
                                className="font-cairo"
                              >
                                حذف نهائي
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}