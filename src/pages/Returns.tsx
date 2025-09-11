import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Search, Filter, Eye, Edit, Trash2, Package, AlertCircle, CheckCircle, Clock, XCircle, RotateCcw } from "lucide-react";
import { useReturns, type Return } from "@/hooks/useReturns";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface ReturnFormData {
  customer_name: string;
  original_invoice_number: string;
  reason: string;
  notes?: string;
  return_date?: string;
  items: {
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    reason: string;
  }[];
}

const Returns = () => {
  const { 
    returns, 
    loading, 
    error,
    addReturn, 
    updateReturnStatus, 
    deleteReturn, 
    getDeletedReturns,
    restoreReturn,
    permanentlyDeleteReturn,
    getReturnsByStatus,
    getReturnStatistics 
  } = useReturns();
  
  const [selectedTab, setSelectedTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [deletedReturns, setDeletedReturns] = useState<Return[]>([]);
  const [loadingDeleted, setLoadingDeleted] = useState(false);
  const [formData, setFormData] = useState<ReturnFormData>({
    customer_name: "",
    original_invoice_number: "",
    reason: "",
    notes: "",
    return_date: new Date().toISOString().split('T')[0],
    items: [{
      product_name: "",
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      reason: ""
    }]
  });

  const statistics = getReturnStatistics();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-800"><Clock className="w-3 h-3 ml-1" />في الانتظار</Badge>;
      case 'approved':
        return <Badge className="bg-blue-100 text-blue-800"><CheckCircle className="w-3 h-3 ml-1" />موافق عليه</Badge>;
      case 'processed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 ml-1" />تم المعالجة</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 ml-1" />مرفوض</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        product_name: "",
        quantity: 1,
        unit_price: 0,
        total_price: 0,
        reason: ""
      }]
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      
      // حساب السعر الإجمالي تلقائياً
      if (field === 'quantity' || field === 'unit_price') {
        newItems[index].total_price = newItems[index].quantity * newItems[index].unit_price;
      }
      
      return { ...prev, items: newItems };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customer_name || !formData.original_invoice_number || !formData.reason) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    if (formData.items.length === 0 || formData.items.some(item => !item.product_name || item.quantity <= 0)) {
      toast.error("يرجى إضافة عناصر صالحة للمرتجع");
      return;
    }

    const success = await addReturn(formData);
    if (success) {
      setShowAddDialog(false);
      setFormData({
        customer_name: "",
        original_invoice_number: "",
        reason: "",
        notes: "",
        return_date: new Date().toISOString().split('T')[0],
        items: [{
          product_name: "",
          quantity: 1,
          unit_price: 0,
          total_price: 0,
          reason: ""
        }]
      });
    }
  };

  const handleStatusUpdate = async (returnId: string, newStatus: string) => {
    const success = await updateReturnStatus(returnId, newStatus as any);
    if (success) {
      toast.success("تم تحديث الحالة بنجاح");
    }
  };

  const handleDelete = async (returnId: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا المرتجع؟")) {
      const success = await deleteReturn(returnId);
      if (success) {
        toast.success("تم حذف المرتجع بنجاح");
      }
    }
  };

  const handleRestoreDialogOpen = async () => {
    setLoadingDeleted(true);
    setShowRestoreDialog(true);
    const deleted = await getDeletedReturns(30);
    setDeletedReturns(deleted);
    setLoadingDeleted(false);
  };

  const handleRestoreReturn = async (returnId: string) => {
    const success = await restoreReturn(returnId);
    if (success) {
      setDeletedReturns(prev => prev.filter(ret => ret.id !== returnId));
    }
  };

  const handlePermanentDelete = async (returnId: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا المرتجع نهائياً؟ لا يمكن التراجع عن هذا الإجراء.")) {
      const success = await permanentlyDeleteReturn(returnId);
      if (success) {
        setDeletedReturns(prev => prev.filter(ret => ret.id !== returnId));
      }
    }
  };

  const filteredReturns = returns.filter(returnItem => {
    const matchesSearch = returnItem.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         returnItem.return_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         returnItem.original_invoice_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedTab === "all") return matchesSearch;
    return matchesSearch && returnItem.status === selectedTab;
  });

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} ج.م`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
        <span className="mr-3 font-tajawal">جاري التحميل...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600 font-cairo">خطأ في تحميل المرتجعات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 font-tajawal mb-4">{error}</p>
              <Button 
                onClick={() => window.location.reload()} 
                className="font-cairo"
              >
                إعادة المحاولة
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-cairo">إدارة المرتجعات</h1>
          <p className="text-muted-foreground font-tajawal">إدارة مرتجعات المبيعات والمنتجات</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="font-cairo">
              <Plus className="w-4 h-4 ml-2" />
              مرتجع جديد
            </Button>
          </DialogTrigger>
          
          <Button 
            variant="destructive" 
            className="font-cairo"
            onClick={handleRestoreDialogOpen}
          >
            <RotateCcw className="w-4 h-4 ml-2" />
            استعادة المرتجعات المحذوفة
          </Button>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-cairo">إضافة مرتجع جديد</DialogTitle>
              <DialogDescription className="font-tajawal">قم بإدخال تفاصيل المرتجع والعناصر المرتجعة</DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer_name" className="font-tajawal">اسم العميل *</Label>
                  <Input
                    id="customer_name"
                    value={formData.customer_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                    required
                    className="font-tajawal"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="original_invoice_number" className="font-tajawal">رقم الفاتورة الأصلية *</Label>
                  <Input
                    id="original_invoice_number"
                    value={formData.original_invoice_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, original_invoice_number: e.target.value }))}
                    required
                    className="font-tajawal"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="return_date" className="font-tajawal">تاريخ المرتجع</Label>
                  <Input
                    id="return_date"
                    type="date"
                    value={formData.return_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, return_date: e.target.value }))}
                    className="font-tajawal"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reason" className="font-tajawal">سبب المرتجع *</Label>
                  <Select value={formData.reason} onValueChange={(value) => setFormData(prev => ({ ...prev, reason: value }))}>
                    <SelectTrigger className="font-tajawal">
                      <SelectValue placeholder="اختر السبب" className="font-tajawal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="defective" className="font-tajawal">عيب في المنتج</SelectItem>
                      <SelectItem value="wrong_item" className="font-tajawal">منتج خاطئ</SelectItem>
                      <SelectItem value="not_as_described" className="font-tajawal">غير مطابق للوصف</SelectItem>
                      <SelectItem value="customer_change_mind" className="font-tajawal">تغيير رأي العميل</SelectItem>
                      <SelectItem value="damaged_shipping" className="font-tajawal">تلف أثناء الشحن</SelectItem>
                      <SelectItem value="other" className="font-tajawal">أخرى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes" className="font-tajawal">ملاحظات</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="أي ملاحظات إضافية..."
                  className="font-tajawal"
                />
              </div>

              <Separator />
              
              {/* العناصر المرتجعة */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold font-cairo">العناصر المرتجعة</h3>
                  <Button type="button" variant="outline" onClick={handleAddItem} className="font-cairo">
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة عنصر
                  </Button>
                </div>
                
                {formData.items.map((item, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="space-y-2">
                          <Label className="font-tajawal">اسم المنتج *</Label>
                          <Input
                            value={item.product_name}
                            onChange={(e) => handleItemChange(index, 'product_name', e.target.value)}
                            placeholder="اسم المنتج"
                            required
                            className="font-tajawal"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="font-tajawal">الكمية *</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                            required
                            className="font-tajawal"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="font-tajawal">سعر الوحدة</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unit_price}
                            onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                            className="font-tajawal"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="font-tajawal">المبلغ الإجمالي</Label>
                          <Input
                            type="number"
                            value={item.total_price}
                            readOnly
                            className="bg-muted font-tajawal"
                          />
                        </div>
                        
                        <div className="flex items-end space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveItem(index)}
                            disabled={formData.items.length === 1}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-4 space-y-2">
                        <Label className="font-tajawal">سبب إرجاع هذا العنصر</Label>
                        <Input
                          value={item.reason}
                          onChange={(e) => handleItemChange(index, 'reason', e.target.value)}
                          placeholder="سبب إرجاع هذا العنصر"
                          className="font-tajawal"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)} className="font-cairo">
                  إلغاء
                </Button>
                <Button type="submit" className="font-cairo">
                  إضافة المرتجع
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">إجمالي المرتجعات</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-tajawal">{statistics.totalReturns}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">في الانتظار</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 font-tajawal">{statistics.pendingCount}</div>
            <p className="text-xs text-muted-foreground font-tajawal">
              {formatCurrency(statistics.pendingAmount)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">تم المعالجة</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 font-tajawal">{statistics.processedCount}</div>
            <p className="text-xs text-muted-foreground font-tajawal">
              {formatCurrency(statistics.processedAmount)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-tajawal">المبلغ الإجمالي</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-tajawal">{formatCurrency(statistics.totalAmount)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="البحث في المرتجعات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 font-tajawal"
          />
        </div>
      </div>

      {/* Tabs and Table */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="all" className="font-tajawal">الكل ({returns.length})</TabsTrigger>
          <TabsTrigger value="pending" className="font-tajawal">في الانتظار ({statistics.pendingCount})</TabsTrigger>
          <TabsTrigger value="approved" className="font-tajawal">موافق عليه ({statistics.approvedCount})</TabsTrigger>
          <TabsTrigger value="processed" className="font-tajawal">تم المعالجة ({statistics.processedCount})</TabsTrigger>
          <TabsTrigger value="rejected" className="font-tajawal">مرفوض ({statistics.rejectedCount})</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab}>
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-tajawal">رقم المرتجع</TableHead>
                      <TableHead className="font-tajawal">العميل</TableHead>
                      <TableHead className="font-tajawal">الفاتورة الأصلية</TableHead>
                      <TableHead className="font-tajawal">تاريخ المرتجع</TableHead>
                      <TableHead className="font-tajawal">المبلغ</TableHead>
                      <TableHead className="font-tajawal">الحالة</TableHead>
                      <TableHead className="font-tajawal">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReturns.map((returnItem) => (
                      <TableRow key={returnItem.id}>
                        <TableCell className="font-medium">{returnItem.return_number}</TableCell>
                        <TableCell>{returnItem.customer_name}</TableCell>
                        <TableCell>{returnItem.original_invoice_number}</TableCell>
                        <TableCell>
                          {format(new Date(returnItem.return_date), 'dd/MM/yyyy', { locale: ar })}
                        </TableCell>
                        <TableCell>{formatCurrency(returnItem.total_amount)}</TableCell>
                        <TableCell>{getStatusBadge(returnItem.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedReturn(returnItem);
                                setShowViewDialog(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            
                            {returnItem.status === 'pending' && (
                              <Select 
                                onValueChange={(value) => handleStatusUpdate(returnItem.id, value)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue placeholder="تحديث الحالة" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="approved">موافقة</SelectItem>
                                  <SelectItem value="rejected">رفض</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                            
                            {returnItem.status === 'approved' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStatusUpdate(returnItem.id, 'processed')}
                              >
                                معالجة
                              </Button>
                            )}
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(returnItem.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تفاصيل المرتجع</DialogTitle>
          </DialogHeader>
          
          {selectedReturn && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">رقم المرتجع</Label>
                  <p className="text-sm">{selectedReturn.return_number}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">اسم العميل</Label>
                  <p className="text-sm">{selectedReturn.customer_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">الفاتورة الأصلية</Label>
                  <p className="text-sm">{selectedReturn.original_invoice_number}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">تاريخ المرتجع</Label>
                  <p className="text-sm">{format(new Date(selectedReturn.return_date), 'dd/MM/yyyy', { locale: ar })}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">السبب</Label>
                  <p className="text-sm">{selectedReturn.reason}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">الحالة</Label>
                  <div>{getStatusBadge(selectedReturn.status)}</div>
                </div>
              </div>
              
              {selectedReturn.notes && (
                <div>
                  <Label className="text-sm font-medium">الملاحظات</Label>
                  <p className="text-sm">{selectedReturn.notes}</p>
                </div>
              )}
              
              <Separator />
              
              <div>
                <Label className="text-sm font-medium mb-2 block">العناصر المرتجعة</Label>
                {selectedReturn.items && selectedReturn.items.length > 0 ? (
                  <div className="space-y-2">
                    {selectedReturn.items.map((item) => (
                      <Card key={item.id}>
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{item.product_name}</p>
                              <p className="text-sm text-muted-foreground">
                                الكمية: {item.quantity} - السعر: {formatCurrency(item.unit_price)}
                              </p>
                              {item.reason && (
                                <p className="text-sm text-muted-foreground">السبب: {item.reason}</p>
                              )}
                            </div>
                            <div className="text-left">
                              <p className="font-semibold">{formatCurrency(item.total_price)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">لا توجد عناصر مسجلة</p>
                )}
              </div>
              
              <Separator />
              
              <div className="text-left">
                <Label className="text-lg font-semibold">
                  إجمالي المرتجع: {formatCurrency(selectedReturn.total_amount)}
                </Label>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Restore Deleted Returns Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-cairo">استعادة المرتجعات المحذوفة</DialogTitle>
            <DialogDescription className="font-tajawal">يمكنك هنا استعادة المرتجعات التي تم حذفها خلال آخر 30 يوماً</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {loadingDeleted ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
                <span className="mr-3 font-tajawal">جاري التحميل...</span>
              </div>
            ) : deletedReturns.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-tajawal">لا توجد مرتجعات محذوفة للاستعادة</p>
                <p className="text-sm text-muted-foreground font-tajawal mt-2">سيتم عرض المرتجعات المحذوفة خلال آخر 30 يوماً هنا</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-tajawal">رقم المرتجع</TableHead>
                      <TableHead className="font-tajawal">العميل</TableHead>
                      <TableHead className="font-tajawal">المبلغ</TableHead>
                      <TableHead className="font-tajawal">تاريخ الحذف</TableHead>
                      <TableHead className="font-tajawal">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deletedReturns.map((returnItem) => (
                      <TableRow key={returnItem.id}>
                        <TableCell className="font-medium">{returnItem.return_number}</TableCell>
                        <TableCell>{returnItem.customer_name}</TableCell>
                        <TableCell>{formatCurrency(returnItem.total_amount)}</TableCell>
                        <TableCell>
                          {returnItem.deleted_at && format(new Date(returnItem.deleted_at), 'dd/MM/yyyy', { locale: ar })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRestoreReturn(returnItem.id)}
                              className="font-tajawal"
                            >
                              <RotateCcw className="w-4 h-4 ml-1" />
                              استعادة
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handlePermanentDelete(returnItem.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRestoreDialog(false)} className="font-cairo">
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Returns;