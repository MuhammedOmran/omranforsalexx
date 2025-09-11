import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CheckCircle, XCircle, Clock, Eye, Trash2, Edit, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useChecks, Check } from "@/hooks/useChecks";

export default function Checks() {
  const { 
    checks, 
    loading, 
    addCheck, 
    updateCheckStatus, 
    deleteCheck,
    updateCheck,
    getChecksByStatus,
    getCheckStatistics,
    fetchDeletedChecks,
    restoreCheck,
    restoreAllDeletedChecks,
    deleteCheckPermanently
  } = useChecks();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [deletedChecks, setDeletedChecks] = useState<Check[]>([]);
  const [selectedCheck, setSelectedCheck] = useState<Check | null>(null);
  const [editingCheck, setEditingCheck] = useState({
    check_number: "",
    amount: "",
    customer_name: "",
    bank_name: "",
    due_date: "",
    description: "",
    check_type: "incoming"
  });
  const { toast } = useToast();

  const [newCheck, setNewCheck] = useState({
    check_number: "",
    amount: "",
    customer_name: "",
    bank_name: "",
    due_date: "",
    description: "",
    check_type: "incoming"
  });

  const getStatusBadge = (status: Check['status'], checkType: string = 'incoming') => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="gap-1 font-tajawal"><Clock className="h-3 w-3" />معلق</Badge>;
      case 'cashed':
        const cashedText = checkType === 'incoming' ? 'تم التحصيل' : 'تم الدفع';
        return <Badge variant="default" className="gap-1 bg-green-500 font-tajawal"><CheckCircle className="h-3 w-3" />{cashedText}</Badge>;
      case 'paid':
        return <Badge variant="default" className="gap-1 bg-green-500 font-tajawal"><CheckCircle className="h-3 w-3" />مدفوعة</Badge>;
      case 'bounced':
        return <Badge variant="destructive" className="gap-1 font-tajawal"><XCircle className="h-3 w-3" />مرتد</Badge>;
      default:
        return null;
    }
  };

  const handleAddCheck = async () => {
    if (!newCheck.check_number || !newCheck.amount || !newCheck.customer_name || !newCheck.bank_name || !newCheck.due_date) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    const checkData = {
      check_number: newCheck.check_number,
      amount: parseFloat(newCheck.amount),
      customer_name: newCheck.customer_name,
      bank_name: newCheck.bank_name,
      due_date: newCheck.due_date,
      description: newCheck.description,
      date_received: new Date().toISOString().split('T')[0],
      check_type: newCheck.check_type as 'incoming' | 'outgoing'
    };

    const success = await addCheck(checkData);
    
    if (success) {
      setNewCheck({
        check_number: "",
        amount: "",
        customer_name: "",
        bank_name: "",
        due_date: "",
        description: "",
        check_type: "incoming"
      });
      setIsAddDialogOpen(false);
    }
  };

  const handleUpdateCheckStatus = async (checkId: string, newStatus: Check['status']) => {
    await updateCheckStatus(checkId, newStatus);
  };

  const handleViewCheck = (check: Check) => {
    setSelectedCheck(check);
    setIsViewDialogOpen(true);
  };

  const handleEditCheck = (check: Check) => {
    setSelectedCheck(check);
    setEditingCheck({
      check_number: check.check_number,
      amount: check.amount.toString(),
      customer_name: check.customer_name,
      bank_name: check.bank_name,
      due_date: check.due_date,
      description: check.description || "",
      check_type: check.check_type || "incoming"
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteCheck = async (checkId: string) => {
    const success = await deleteCheck(checkId);
    if (success) {
      toast({
        title: "تم الحذف",
        description: "تم حذف الشيك بنجاح",
      });
    }
  };

  const handleUpdateCheck = async () => {
    if (!selectedCheck || !editingCheck.check_number || !editingCheck.amount || !editingCheck.customer_name || !editingCheck.bank_name || !editingCheck.due_date) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    const checkData = {
      check_number: editingCheck.check_number,
      amount: parseFloat(editingCheck.amount),
      customer_name: editingCheck.customer_name,
      bank_name: editingCheck.bank_name,
      due_date: editingCheck.due_date,
      description: editingCheck.description,
      check_type: editingCheck.check_type as 'incoming' | 'outgoing'
    };

    const success = await updateCheck(selectedCheck.id, checkData);
    
    if (success) {
      setIsEditDialogOpen(false);
      setSelectedCheck(null);
      setEditingCheck({
        check_number: "",
        amount: "",
        customer_name: "",
        bank_name: "",
        due_date: "",
        description: "",
        check_type: "incoming"
      });
    }
  };

  const handleRestoreDialogOpen = async () => {
    setIsRestoreDialogOpen(true);
    const deleted = await fetchDeletedChecks();
    setDeletedChecks(deleted);
  };

  const handleRestoreCheck = async (checkId: string) => {
    const success = await restoreCheck(checkId);
    if (success) {
      // تحديث قائمة الشيكات المحذوفة
      const updated = await fetchDeletedChecks();
      setDeletedChecks(updated);
      
      toast({
        title: "تم الأمر بنجاح",
        description: "تم استعادة الشيك بنجاح",
      });
    }
  };

  const handleRestoreAllDeletedChecks = async () => {
    if (!window.confirm('هل أنت متأكد من استعادة جميع الشيكات المحذوفة؟')) {
      return;
    }

    try {
      const result = await restoreAllDeletedChecks();
      
      if (result.success > 0) {
        toast({
          title: "تم الاستعادة بنجاح",
          description: `تم استعادة ${result.success} شيك بإجمالي مبلغ ${result.totalAmount?.toLocaleString()} ج.م`,
        });
      } else {
        toast({
          title: "تنبيه",
          description: result.message || "لا توجد شيكات محذوفة للاستعادة",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error restoring all deleted checks:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء استعادة الشيكات",
        variant: "destructive",
      });
    }
  };

  const stats = getCheckStatistics();
  const pendingChecks = getChecksByStatus('pending');
  const cashedChecks = getChecksByStatus('cashed');
  const bouncedChecks = getChecksByStatus('bounced');
  const paidChecks = getChecksByStatus('paid');

  if (loading) {
    return <div className="container mx-auto p-6">جاري التحميل...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-cairo font-bold">إدارة الشيكات</h1>
          <p className="text-muted-foreground font-tajawal">متابعة وإدارة الشيكات المستقبلة</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 font-cairo">
                <Plus className="h-4 w-4" />
                إضافة شيك جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-cairo">إضافة شيك جديد</DialogTitle>
              <DialogDescription className="font-tajawal">
                أدخل تفاصيل الشيك المستقبل
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="check_number" className="font-tajawal">رقم الشيك *</Label>
                <Input
                  id="check_number"
                  value={newCheck.check_number}
                  onChange={(e) => setNewCheck({...newCheck, check_number: e.target.value})}
                  placeholder="رقم الشيك"
                  className="font-tajawal"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="check_type" className="font-tajawal">نوع الشيك *</Label>
                <Select
                  value={newCheck.check_type}
                  onValueChange={(value) => setNewCheck({...newCheck, check_type: value})}
                >
                  <SelectTrigger className="font-tajawal">
                    <SelectValue placeholder="اختر نوع الشيك" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="incoming" className="font-tajawal">وارد (+)</SelectItem>
                    <SelectItem value="outgoing" className="font-tajawal">صادر (-)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount" className="font-tajawal">المبلغ *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={newCheck.amount}
                  onChange={(e) => setNewCheck({...newCheck, amount: e.target.value})}
                  placeholder="0.00"
                  className="font-tajawal"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="customer_name" className="font-tajawal">اسم العميل *</Label>
                <Input
                  id="customer_name"
                  value={newCheck.customer_name}
                  onChange={(e) => setNewCheck({...newCheck, customer_name: e.target.value})}
                  placeholder="اسم العميل"
                  className="font-tajawal"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bank_name" className="font-tajawal">اسم البنك *</Label>
                <Input
                  id="bank_name"
                  value={newCheck.bank_name}
                  onChange={(e) => setNewCheck({...newCheck, bank_name: e.target.value})}
                  placeholder="اسم البنك"
                  className="font-tajawal"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="due_date" className="font-tajawal">تاريخ الاستحقاق *</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={newCheck.due_date}
                  onChange={(e) => setNewCheck({...newCheck, due_date: e.target.value})}
                  className="font-tajawal"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description" className="font-tajawal">وصف</Label>
                <Textarea
                  id="description"
                  value={newCheck.description}
                  onChange={(e) => setNewCheck({...newCheck, description: e.target.value})}
                  placeholder="وصف أو ملاحظات"
                  className="font-tajawal"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddCheck} className="font-cairo">إضافة الشيك</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Restore Deleted Checks Button */}
        <Button 
          variant="secondary" 
          className="gap-2 font-cairo bg-red-600 hover:bg-red-700 text-white"
          onClick={handleRestoreDialogOpen}
        >
          <RotateCcw className="h-4 w-4" />
          استعادة الشيكات المحذوفة
        </Button>

        </div>
      </div>

      {/* View Check Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-cairo">عرض تفاصيل الشيك</DialogTitle>
          </DialogHeader>
          {selectedCheck && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-tajawal text-sm font-medium">رقم الشيك</Label>
                  <p className="font-tajawal text-lg">{selectedCheck.check_number}</p>
                </div>
                <div>
                  <Label className="font-tajawal text-sm font-medium">المبلغ</Label>
                  <p className="font-tajawal text-lg">{selectedCheck.amount.toLocaleString()} ج.م</p>
                </div>
                <div>
                  <Label className="font-tajawal text-sm font-medium">اسم العميل</Label>
                  <p className="font-tajawal text-lg">{selectedCheck.customer_name}</p>
                </div>
                <div>
                  <Label className="font-tajawal text-sm font-medium">اسم البنك</Label>
                  <p className="font-tajawal text-lg">{selectedCheck.bank_name}</p>
                </div>
                <div>
                  <Label className="font-tajawal text-sm font-medium">تاريخ الاستحقاق</Label>
                  <p className="font-tajawal text-lg">{new Date(selectedCheck.due_date).toLocaleDateString('ar-EG')}</p>
                </div>
                <div>
                  <Label className="font-tajawal text-sm font-medium">تاريخ الاستلام</Label>
                  <p className="font-tajawal text-lg">{new Date(selectedCheck.date_received).toLocaleDateString('ar-EG')}</p>
                </div>
                <div>
                  <Label className="font-tajawal text-sm font-medium">نوع الشيك</Label>
                  <p className="font-tajawal text-lg">
                    {selectedCheck.check_type === 'incoming' ? 'وارد (+)' : 'صادر (-)'}
                  </p>
                </div>
                <div>
                  <Label className="font-tajawal text-sm font-medium">الحالة</Label>
                  <div className="mt-1">{getStatusBadge(selectedCheck.status, selectedCheck.check_type)}</div>
                </div>
                {selectedCheck.cashed_date && (
                  <div>
                    <Label className="font-tajawal text-sm font-medium">تاريخ التحصيل</Label>
                    <p className="font-tajawal text-lg">{new Date(selectedCheck.cashed_date).toLocaleDateString('ar-EG')}</p>
                  </div>
                )}
              </div>
              {selectedCheck.description && (
                <div>
                  <Label className="font-tajawal text-sm font-medium">الوصف</Label>
                  <p className="font-tajawal text-sm mt-1">{selectedCheck.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Check Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-cairo">تعديل الشيك</DialogTitle>
            <DialogDescription className="font-tajawal">
              تعديل تفاصيل الشيك المحدد
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit_check_number" className="font-tajawal">رقم الشيك *</Label>
              <Input
                id="edit_check_number"
                value={editingCheck.check_number}
                onChange={(e) => setEditingCheck({...editingCheck, check_number: e.target.value})}
                placeholder="رقم الشيك"
                className="font-tajawal"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_check_type" className="font-tajawal">نوع الشيك *</Label>
              <Select
                value={editingCheck.check_type}
                onValueChange={(value) => setEditingCheck({...editingCheck, check_type: value})}
              >
                <SelectTrigger className="font-tajawal">
                  <SelectValue placeholder="اختر نوع الشيك" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="incoming" className="font-tajawal">وارد (+)</SelectItem>
                  <SelectItem value="outgoing" className="font-tajawal">صادر (-)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_amount" className="font-tajawal">المبلغ *</Label>
              <Input
                id="edit_amount"
                type="number"
                value={editingCheck.amount}
                onChange={(e) => setEditingCheck({...editingCheck, amount: e.target.value})}
                placeholder="0.00"
                className="font-tajawal"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_customer_name" className="font-tajawal">اسم العميل *</Label>
              <Input
                id="edit_customer_name"
                value={editingCheck.customer_name}
                onChange={(e) => setEditingCheck({...editingCheck, customer_name: e.target.value})}
                placeholder="اسم العميل"
                className="font-tajawal"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_bank_name" className="font-tajawal">اسم البنك *</Label>
              <Input
                id="edit_bank_name"
                value={editingCheck.bank_name}
                onChange={(e) => setEditingCheck({...editingCheck, bank_name: e.target.value})}
                placeholder="اسم البنك"
                className="font-tajawal"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_due_date" className="font-tajawal">تاريخ الاستحقاق *</Label>
              <Input
                id="edit_due_date"
                type="date"
                value={editingCheck.due_date}
                onChange={(e) => setEditingCheck({...editingCheck, due_date: e.target.value})}
                className="font-tajawal"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_description" className="font-tajawal">وصف</Label>
              <Textarea
                id="edit_description"
                value={editingCheck.description}
                onChange={(e) => setEditingCheck({...editingCheck, description: e.target.value})}
                placeholder="وصف أو ملاحظات"
                className="font-tajawal"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateCheck} className="font-cairo">حفظ التغييرات</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deleted Checks Dialog */}
      <Dialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-cairo">الشيكات المحذوفة</DialogTitle>
            <DialogDescription className="font-tajawal">
              يمكنك استعادة الشيكات أو حذفها نهائياً
            </DialogDescription>
          </DialogHeader>
          
          {deletedChecks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground font-tajawal">لا توجد شيكات محذوفة</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground font-tajawal">
                  عدد الشيكات المحذوفة: {deletedChecks.length}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-600 font-tajawal"
                    onClick={async () => {
                      if (window.confirm('هل أنت متأكد من استعادة جميع الشيكات المحذوفة؟')) {
                        try {
                          const result = await restoreAllDeletedChecks();
                          if (result.success > 0) {
                            const updated = await fetchDeletedChecks();
                            setDeletedChecks(updated);
                            toast({
                              title: "تم الاستعادة بنجاح",
                              description: `تم استعادة ${result.success} شيك`,
                            });
                          }
                        } catch (error) {
                          toast({
                            title: "خطأ",
                            description: "حدث خطأ أثناء الاستعادة",
                            variant: "destructive",
                          });
                        }
                      }
                    }}
                  >
                    <RotateCcw className="h-3 w-3 ml-1" />
                    استعادة الكل
                  </Button>
                </div>
              </div>
              
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-tajawal">رقم الشيك</TableHead>
                      <TableHead className="font-tajawal">العميل</TableHead>
                      <TableHead className="font-tajawal">البنك</TableHead>
                      <TableHead className="font-tajawal">المبلغ</TableHead>
                      <TableHead className="font-tajawal">تاريخ الحذف</TableHead>
                      <TableHead className="font-tajawal">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deletedChecks.map((check) => (
                      <TableRow key={check.id}>
                        <TableCell className="font-medium font-tajawal">{check.check_number}</TableCell>
                        <TableCell className="font-tajawal">{check.customer_name}</TableCell>
                        <TableCell className="font-tajawal">{check.bank_name}</TableCell>
                        <TableCell className="font-tajawal">{check.amount.toLocaleString()} ج.م</TableCell>
                        <TableCell className="font-tajawal">
                          {check.deleted_at ? new Date(check.deleted_at).toLocaleDateString('ar-EG') : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 font-tajawal"
                              onClick={async () => {
                                const success = await restoreCheck(check.id);
                                if (success) {
                                  const updated = await fetchDeletedChecks();
                                  setDeletedChecks(updated);
                                }
                              }}
                            >
                              <RotateCcw className="h-3 w-3 ml-1" />
                              استعادة
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 font-tajawal"
                                >
                                  <Trash2 className="h-3 w-3 ml-1" />
                                  حذف نهائي
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="font-cairo">حذف الشيك نهائياً</AlertDialogTitle>
                                  <AlertDialogDescription className="font-tajawal">
                                    هل أنت متأكد من حذف شيك "{check.check_number}" نهائياً؟
                                    <br />
                                    هذا الإجراء لا يمكن التراجع عنه.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="font-tajawal">إلغاء</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700 font-tajawal"
                                    onClick={async () => {
                                      const success = await deleteCheckPermanently(check.id);
                                      if (success) {
                                        const updated = await fetchDeletedChecks();
                                        setDeletedChecks(updated);
                                      }
                                    }}
                                  >
                                    حذف نهائي
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">الشيكات المعلقة</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-tajawal">{stats.pendingCount}</div>
            <p className="text-xs text-muted-foreground font-tajawal">
              إجمالي المبلغ: {stats.totalPendingAmount.toLocaleString()} ج.م
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">الشيكات المحصلة</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-tajawal text-blue-600">{stats.cashedCount}</div>
            <p className="text-xs text-blue-600 font-tajawal">
              إجمالي المبلغ: {stats.totalCashedAmount.toLocaleString()} ج.م
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">الشيكات المرتدة</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-tajawal">{stats.bouncedCount}</div>
            <p className="text-xs text-muted-foreground font-tajawal">
              يتطلب متابعة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">الشيكات المدفوعة</CardTitle>
            <CheckCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-tajawal text-red-600">{stats.paidCount}</div>
            <p className="text-xs text-red-600 font-tajawal">
              إجمالي المبلغ: {stats.totalPaidAmount.toLocaleString()} ج.م
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Checks Table */}
      <Card>
        <CardHeader>
          <CardTitle className="font-cairo">قائمة الشيكات</CardTitle>
          <CardDescription className="font-tajawal">جميع الشيكات المسجلة في النظام</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all" className="font-tajawal">الكل ({checks.length})</TabsTrigger>
              <TabsTrigger value="pending" className="font-tajawal">معلق ({pendingChecks.length})</TabsTrigger>
              <TabsTrigger value="cashed" className="font-tajawal">محصل ({cashedChecks.length})</TabsTrigger>
              <TabsTrigger value="bounced" className="font-tajawal">مرتد ({bouncedChecks.length})</TabsTrigger>
              <TabsTrigger value="paid" className="font-tajawal">مدفوع ({paidChecks.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <ChecksTable 
                checks={checks} 
                onUpdateStatus={handleUpdateCheckStatus}
                onViewCheck={handleViewCheck}
                onEditCheck={handleEditCheck}
                onDeleteCheck={handleDeleteCheck}
              />
            </TabsContent>
            <TabsContent value="pending">
              <ChecksTable 
                checks={pendingChecks} 
                onUpdateStatus={handleUpdateCheckStatus}
                onViewCheck={handleViewCheck}
                onEditCheck={handleEditCheck}
                onDeleteCheck={handleDeleteCheck}
              />
            </TabsContent>
            <TabsContent value="cashed">
              <ChecksTable 
                checks={cashedChecks} 
                onUpdateStatus={handleUpdateCheckStatus}
                onViewCheck={handleViewCheck}
                onEditCheck={handleEditCheck}
                onDeleteCheck={handleDeleteCheck}
              />
            </TabsContent>
            <TabsContent value="bounced">
              <ChecksTable 
                checks={bouncedChecks} 
                onUpdateStatus={handleUpdateCheckStatus}
                onViewCheck={handleViewCheck}
                onEditCheck={handleEditCheck}
                onDeleteCheck={handleDeleteCheck}
              />
            </TabsContent>
            <TabsContent value="paid">
              <ChecksTable 
                checks={paidChecks} 
                onUpdateStatus={handleUpdateCheckStatus}
                onViewCheck={handleViewCheck}
                onEditCheck={handleEditCheck}
                onDeleteCheck={handleDeleteCheck}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function ChecksTable({ 
  checks, 
  onUpdateStatus,
  onViewCheck,
  onEditCheck,
  onDeleteCheck
}: { 
  checks: Check[]; 
  onUpdateStatus: (checkId: string, status: Check['status']) => void;
  onViewCheck: (check: Check) => void;
  onEditCheck: (check: Check) => void;
  onDeleteCheck: (checkId: string) => void;
}) {
  const getStatusBadge = (status: Check['status'], checkType: string = 'incoming') => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="gap-1 font-tajawal"><Clock className="h-3 w-3" />معلق</Badge>;
      case 'cashed':
        const cashedText = checkType === 'incoming' ? 'تم التحصيل' : 'تم الدفع';
        return <Badge variant="default" className="gap-1 bg-green-500 font-tajawal"><CheckCircle className="h-3 w-3" />{cashedText}</Badge>;
      case 'paid':
        return <Badge variant="default" className="gap-1 bg-green-500 font-tajawal"><CheckCircle className="h-3 w-3" />مدفوعة</Badge>;
      case 'bounced':
        return <Badge variant="destructive" className="gap-1 font-tajawal"><XCircle className="h-3 w-3" />مرتد</Badge>;
      default:
        return null;
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="font-tajawal">رقم الشيك</TableHead>
          <TableHead className="font-tajawal">نوع الشيك</TableHead>
          <TableHead className="font-tajawal">العميل</TableHead>
          <TableHead className="font-tajawal">البنك</TableHead>
          <TableHead className="font-tajawal">المبلغ</TableHead>
          <TableHead className="font-tajawal">تاريخ الاستحقاق</TableHead>
          <TableHead className="font-tajawal">الحالة</TableHead>
          <TableHead className="font-tajawal">إجراءات</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {checks.map((check) => (
          <TableRow key={check.id}>
            <TableCell className="font-medium font-tajawal">{check.check_number}</TableCell>
            <TableCell className="font-tajawal">
              <Badge 
                variant={check.check_type === 'incoming' ? 'default' : 'destructive'} 
                className={`font-tajawal ${check.check_type === 'outgoing' ? 'bg-red-500 hover:bg-red-600' : ''}`}
              >
                {check.check_type === 'incoming' ? 'وارد (+)' : 'صادر (-)'}
              </Badge>
            </TableCell>
            <TableCell className="font-tajawal">{check.customer_name}</TableCell>
            <TableCell className="font-tajawal">{check.bank_name}</TableCell>
            <TableCell className="font-tajawal">{check.amount.toLocaleString()} ج.م</TableCell>
            <TableCell className="font-tajawal">{new Date(check.due_date).toLocaleDateString('ar-EG')}</TableCell>
            <TableCell>{getStatusBadge(check.status, check.check_type)}</TableCell>
            <TableCell>
              <div className="flex gap-1 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-blue-600 font-tajawal"
                  onClick={() => onViewCheck(check)}
                >
                  <Eye className="h-3 w-3 ml-1" />
                  عرض
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-orange-600 font-tajawal"
                  onClick={() => onEditCheck(check)}
                >
                  <Edit className="h-3 w-3 ml-1" />
                  تعديل
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 font-tajawal"
                  onClick={() => {
                    const confirmDelete = window.confirm('هل أنت متأكد من حذف هذا الشيك؟');
                    if (confirmDelete) {
                      onDeleteCheck(check.id);
                    }
                  }}
                >
                  <Trash2 className="h-3 w-3 ml-1" />
                  حذف
                </Button>
                {check.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 font-tajawal"
                      onClick={() => onUpdateStatus(check.id, check.check_type === 'incoming' ? 'cashed' : 'paid')}
                    >
                      <CheckCircle className="h-3 w-3 ml-1" />
                      {check.check_type === 'incoming' ? 'تحصيل' : 'دفع'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 font-tajawal"
                      onClick={() => onUpdateStatus(check.id, 'bounced')}
                    >
                      <XCircle className="h-3 w-3 ml-1" />
                      ارتداد
                    </Button>
                  </>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}