import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin,
  Building2,
  User,
  Settings,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSuppliers, Supplier as SupabaseSupplier, SupplierStatistics, TopSupplier } from '@/hooks/useSuppliers';
import { useDuplicateSupplierCheck } from '@/hooks/useDuplicateSupplierCheck';
import { DuplicateWarningDialog } from './DuplicateWarningDialog';

interface SupplierFormData {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  company: string;
  taxNumber: string;
  paymentTerms: string;
  notes: string;
}

export function SupplierDashboard() {
  const { 
    suppliers, 
    loading, 
    addSupplier, 
    updateSupplier, 
    deleteSupplier,
    restoreSupplier,
    fetchDeletedSuppliers,
    permanentDeleteSupplier,
    getSupplierStatistics,
    getTopSuppliers,
    getSuppliersOverview
  } = useSuppliers();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupabaseSupplier | null>(null);
  const [deletedSuppliers, setDeletedSuppliers] = useState<SupabaseSupplier[]>([]);
  const [suppliersOverview, setSuppliersOverview] = useState<any>(null);
  const [topSuppliers, setTopSuppliers] = useState<TopSupplier[]>([]);
  const [selectedSupplierStats, setSelectedSupplierStats] = useState<SupplierStatistics | null>(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateMessage, setDuplicateMessage] = useState('');
  const [pendingSubmission, setPendingSubmission] = useState(false);
  
  const { checkForDuplicate, getDuplicateMessage, isChecking } = useDuplicateSupplierCheck();
  
  const [formData, setFormData] = useState<SupplierFormData>({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    company: '',
    taxNumber: '',
    paymentTerms: '',
    notes: ''
  });

  const { toast } = useToast();

  // جلب البيانات والإحصائيات - مع useCallback لتجنب إعادة التشغيل المستمر
  const loadOverviewData = useCallback(async () => {
    if (suppliers.length === 0) return;
    
    const [overview, topSuppliersData] = await Promise.all([
      getSuppliersOverview(),
      getTopSuppliers(10)
    ]);
    
    if (overview) setSuppliersOverview(overview);
    setTopSuppliers(topSuppliersData);
  }, [suppliers, getSuppliersOverview, getTopSuppliers]); // تغيير suppliers.length إلى suppliers

  useEffect(() => {
    if (suppliers.length > 0) {
      loadOverviewData();
    } else {
      // إعادة تعيين الإحصائيات عند عدم وجود موردين
      setSuppliersOverview(null);
      setTopSuppliers([]);
    }
  }, [suppliers, loadOverviewData]); // تغيير suppliers.length إلى suppliers

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = 
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.phone?.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && supplier.is_active) ||
      (statusFilter === 'inactive' && !supplier.is_active);
    return matchesSearch && matchesStatus;
  });

  const resetForm = () => {
    setFormData({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      company: '',
      taxNumber: '',
      paymentTerms: '',
      notes: ''
    });
    setShowDuplicateDialog(false);
    setPendingSubmission(false);
  };

  const performSubmission = async () => {
    const supplierData = {
      name: formData.name,
      contact_person: formData.contactPerson || null,
      email: formData.email || null,
      phone: formData.phone || null,
      address: formData.address || null,
      company: formData.company || null,
      tax_number: formData.taxNumber || null,
      payment_terms: formData.paymentTerms || null,
      notes: formData.notes || null,
      is_active: true
    };

    let success;
    if (selectedSupplier) {
      success = await updateSupplier(selectedSupplier.id, supplierData);
    } else {
      success = await addSupplier(supplierData);
    }

    if (success) {
      setIsAddDialogOpen(false);
      setIsEditDialogOpen(false);
      setSelectedSupplier(null);
      resetForm();
      setShowDuplicateDialog(false);
      setPendingSubmission(false);
      // تحديث الإحصائيات فوراً بعد الإضافة أو التحديث
      loadOverviewData();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم المورد",
        variant: "destructive"
      });
      return;
    }

    // التحقق من الازدواجية إذا لم يكن هناك submission معلق
    if (!pendingSubmission) {
      const duplicate = await checkForDuplicate(
        formData.name,
        formData.email,
        formData.phone,
        selectedSupplier?.id
      );

      if (duplicate) {
        const message = getDuplicateMessage(duplicate.duplicate_type, duplicate.existing_supplier_name);
        setDuplicateMessage(message);
        setShowDuplicateDialog(true);
        return;
      }
    }

    // إذا لم توجد ازدواجية أو تم الموافقة على المتابعة
    await performSubmission();
  };

  const handleEdit = (supplier: SupabaseSupplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      name: supplier.name,
      contactPerson: supplier.contact_person || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      company: supplier.company || '',
      taxNumber: supplier.tax_number || '',
      paymentTerms: supplier.payment_terms || '',
      notes: supplier.notes || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (supplierId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المورد؟')) {
      const success = await deleteSupplier(supplierId);
      if (success) {
        // تحديث الإحصائيات فوراً بعد الحذف
        loadOverviewData();
      }
    }
  };

  const openAddDialog = () => {
    setSelectedSupplier(null);
    resetForm();
    setIsAddDialogOpen(true);
  };

  const handleRestoreSuppliers = async () => {
    const deleted = await fetchDeletedSuppliers();
    setDeletedSuppliers(deleted);
    setIsRestoreDialogOpen(true);
  };

  const handleRestore = async (supplierId: string) => {
    const success = await restoreSupplier(supplierId);
    if (success) {
      setDeletedSuppliers(prev => prev.filter(s => s.id !== supplierId));
      // تحديث الإحصائيات فوراً بعد الاستعادة
      loadOverviewData();
    }
  };

  const handlePermanentDelete = async (supplierId: string) => {
    if (confirm('هل أنت متأكد من الحذف النهائي لهذا المورد؟ لن يمكن استرداده مرة أخرى.')) {
      const success = await permanentDeleteSupplier(supplierId);
      if (success) {
        setDeletedSuppliers(prev => prev.filter(s => s.id !== supplierId));
      }
    }
  };

  const handleViewSupplierStats = async (supplier: SupabaseSupplier) => {
    const stats = await getSupplierStatistics(supplier.id);
    setSelectedSupplierStats(stats);
    setSelectedSupplier(supplier);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 font-cairo">إدارة الموردين</h1>
          <p className="text-muted-foreground font-cairo">
            إدارة شاملة لجميع الموردين وبياناتهم التجارية
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openAddDialog} className="font-cairo">
            <Plus className="h-4 w-4 ml-2" />
            إضافة مورد جديد
          </Button>
          <Button variant="destructive" className="font-cairo" onClick={handleRestoreSuppliers}>
            <RefreshCw className="h-4 w-4 ml-2" />
            استعادة الموردين المحذوفين
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground font-cairo">إجمالي الموردين</p>
                <p className="text-2xl font-bold font-tajawal">{suppliers.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground font-cairo">الموردين النشطين</p>
                <p className="text-2xl font-bold font-tajawal">{suppliers.filter(s => s.is_active).length}</p>
              </div>
              <User className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground font-cairo">إجمالي قيمة المشتريات</p>
                <p className="text-2xl font-bold font-tajawal">
                  {suppliersOverview?.totalPurchaseValue 
                    ? `${Number(suppliersOverview.totalPurchaseValue).toLocaleString()} ج.م`
                    : '0 ج.م'
                  }
                </p>
              </div>
              <Settings className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground font-cairo">إجمالي الفواتير</p>
                <p className="text-2xl font-bold font-tajawal">{suppliersOverview?.totalInvoices || 0}</p>
              </div>
              <Mail className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Suppliers Section */}
      {topSuppliers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-cairo">أفضل الموردين</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topSuppliers.slice(0, 5).map((supplier, index) => (
                <div key={supplier.supplier_id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold font-tajawal">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium font-cairo">{supplier.supplier_name}</p>
                      <p className="text-sm text-muted-foreground font-cairo">
                        <span className="font-tajawal">{supplier.invoice_count}</span> فاتورة
                        {supplier.last_purchase && ` • آخر شراء: ${new Date(supplier.last_purchase).toLocaleDateString('en-GB')}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-green-600 font-tajawal">
                      <span className="font-tajawal">{Number(supplier.total_purchases).toLocaleString()}</span> ج.م
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="البحث بالاسم، البريد الإلكتروني، أو رقم الهاتف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 font-tajawal"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="فلتر حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-cairo">جميع الموردين</SelectItem>
                <SelectItem value="active" className="font-cairo">نشط</SelectItem>
                <SelectItem value="inactive" className="font-cairo">غير نشط</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="font-cairo">قائمة الموردين</span>
            <span className="text-sm font-normal text-muted-foreground font-tajawal">
              {loading ? 'جاري التحميل...' : `${filteredSuppliers.length} من ${suppliers.length} مورد`}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="rounded-full h-8 w-8 border-2 border-primary/20 border-t-primary mx-auto mb-2"></div>
              <p className="mt-2 text-muted-foreground font-cairo">جاري تحميل الموردين...</p>
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2 font-cairo">لا توجد موردين</h3>
              <p className="text-muted-foreground mb-4 font-cairo">
                {searchTerm || statusFilter !== 'all' 
                  ? 'لا توجد موردين تطابق معايير البحث المحددة'
                  : 'لم تقم بإضافة أي موردين بعد'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button onClick={openAddDialog} className="font-cairo">
                  <Plus className="ml-2 h-4 w-4" />
                  إضافة أول مورد
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-tajawal">اسم المورد</TableHead>
                  <TableHead className="font-tajawal">الشركة</TableHead>
                  <TableHead className="font-tajawal">الهاتف</TableHead>
                  <TableHead className="font-tajawal">البريد الإلكتروني</TableHead>
                  <TableHead className="font-tajawal">الحالة</TableHead>
                  <TableHead className="font-tajawal">تاريخ الإضافة</TableHead>
                  <TableHead className="font-tajawal">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div className="font-tajawal">
                        <div className="font-medium">{supplier.name}</div>
                        {supplier.contact_person && supplier.contact_person !== supplier.name && (
                          <div className="text-sm text-muted-foreground">
                            {supplier.contact_person}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-tajawal">
                      {supplier.company || '-'}
                    </TableCell>
                    <TableCell className="font-tajawal">
                      {supplier.phone ? (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {supplier.phone}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="font-tajawal">
                      {supplier.email ? (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {supplier.email}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={supplier.is_active ? "default" : "secondary"} className="font-tajawal">
                        {supplier.is_active ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-tajawal">
                      {new Date(supplier.created_at).toLocaleDateString('en-GB')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(supplier)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(supplier.id)}
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

      {/* Duplicate Warning Dialog */}
      <DuplicateWarningDialog
        open={showDuplicateDialog}
        onOpenChange={setShowDuplicateDialog}
        message={duplicateMessage}
        onConfirm={() => {
          setPendingSubmission(true);
          setShowDuplicateDialog(false);
          // إعادة تشغيل handleSubmit بدون فحص الازدواجية
          const form = document.querySelector('form');
          if (form) {
            const event = new Event('submit', { bubbles: true, cancelable: true });
            form.dispatchEvent(event);
          }
        }}
        onCancel={() => {
          setShowDuplicateDialog(false);
          setPendingSubmission(false);
        }}
      />

      {/* Add Supplier Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-cairo">إضافة مورد جديد</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="font-tajawal">اسم المورد *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="أدخل اسم المورد"
                  required
                />
              </div>
              <div>
                <Label htmlFor="contactPerson" className="font-tajawal">الشخص المسؤول</Label>
                <Input
                  id="contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                  placeholder="اسم الشخص المسؤول"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email" className="font-tajawal">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="example@company.com"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="font-tajawal">رقم الهاتف</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+966 50 123 4567"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company" className="font-tajawal">اسم الشركة</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="اسم الشركة"
                />
              </div>
              <div>
                <Label htmlFor="taxNumber" className="font-tajawal">الرقم الضريبي</Label>
                <Input
                  id="taxNumber"
                  value={formData.taxNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, taxNumber: e.target.value }))}
                  placeholder="الرقم الضريبي"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address" className="font-tajawal">العنوان</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="العنوان الكامل"
              />
            </div>

            <div>
              <Label htmlFor="paymentTerms" className="font-tajawal">شروط الدفع</Label>
              <Input
                id="paymentTerms"
                value={formData.paymentTerms}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                placeholder="مثل: 30 يوم، عند الاستلام، إلخ"
              />
            </div>

            <div>
              <Label htmlFor="notes" className="font-tajawal">ملاحظات</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="ملاحظات إضافية..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2 space-x-reverse">
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="font-cairo">
                إلغاء
              </Button>
              <Button type="submit" disabled={isChecking} className="font-cairo">
                {isChecking ? 'جاري الفحص...' : 'إضافة المورد'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Supplier Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل بيانات المورد</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">اسم المورد *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="أدخل اسم المورد"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-contactPerson">الشخص المسؤول</Label>
                <Input
                  id="edit-contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                  placeholder="اسم الشخص المسؤول"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-email">البريد الإلكتروني</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="example@company.com"
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">رقم الهاتف</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+966 50 123 4567"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-company">اسم الشركة</Label>
                <Input
                  id="edit-company"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="اسم الشركة"
                />
              </div>
              <div>
                <Label htmlFor="edit-taxNumber">الرقم الضريبي</Label>
                <Input
                  id="edit-taxNumber"
                  value={formData.taxNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, taxNumber: e.target.value }))}
                  placeholder="الرقم الضريبي"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-address">العنوان</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="العنوان الكامل"
              />
            </div>

            <div>
              <Label htmlFor="edit-paymentTerms">شروط الدفع</Label>
              <Input
                id="edit-paymentTerms"
                value={formData.paymentTerms}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                placeholder="مثل: 30 يوم، عند الاستلام، إلخ"
              />
            </div>

            <div>
              <Label htmlFor="edit-notes">ملاحظات</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="ملاحظات إضافية..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2 space-x-reverse">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isChecking}>
                {isChecking ? 'جاري الفحص...' : 'حفظ التغييرات'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Restore Suppliers Dialog */}
      <Dialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-cairo">استعادة الموردين المحذوفين</DialogTitle>
          </DialogHeader>
          
          {deletedSuppliers.length === 0 ? (
            <div className="text-center py-8">
              <RefreshCw className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2 font-cairo">لا توجد موردين محذوفين</h3>
              <p className="text-muted-foreground font-cairo">
                جميع الموردين نشطون حالياً
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground font-cairo">
                يمكنك استعادة الموردين المحذوفين من القائمة أدناه:
              </p>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {deletedSuppliers.map((supplier) => (
                  <div key={supplier.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium font-cairo">{supplier.name}</div>
                      <div className="text-sm text-muted-foreground font-cairo">
                        {supplier.company && `${supplier.company} • `}
                        {supplier.phone && `${supplier.phone} • `}
                        {supplier.email && supplier.email}
                      </div>
                      <div className="text-xs text-muted-foreground font-cairo">
                        تم الحذف في: {new Date(supplier.updated_at).toLocaleDateString('en-GB')}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleRestore(supplier.id)}
                        className="font-cairo"
                      >
                        <RefreshCw className="h-4 w-4 ml-2" />
                        استعادة
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handlePermanentDelete(supplier.id)}
                        className="font-cairo"
                      >
                        <Trash2 className="h-4 w-4 ml-2" />
                        حذف نهائياً
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end pt-4">
                <Button variant="outline" onClick={() => setIsRestoreDialogOpen(false)} className="font-cairo">
                  إغلاق
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}