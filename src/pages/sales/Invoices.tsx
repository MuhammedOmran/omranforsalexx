import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye, Download, RefreshCw, Loader2, FileText, Trash2, Edit } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import { SupabaseInvoiceActions } from "@/components/sales/SupabaseInvoiceActions";
import { EnhancedInvoicePrint } from "@/components/ui/enhanced-invoice-print";
import { AuthRequired } from "@/components/sales/AuthRequired";
import EditSalesInvoiceDialog from "@/components/sales/EditSalesInvoiceDialog";
import { useSalesInvoices } from "@/hooks/useSalesInvoices";

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_phone?: string;
  total_amount: number;
  status: 'paid' | 'unpaid';
  created_at: string;
  items_count: number;
  supabaseId: string;
}

interface DeletedInvoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  status: string;
  deleted_at: string;
  created_at: string;
}

export default function Invoices() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("الكل");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [deletedInvoices, setDeletedInvoices] = useState<DeletedInvoice[]>([]);
  const [editInvoiceDialogOpen, setEditInvoiceDialogOpen] = useState(false);
  const [invoiceToEdit, setInvoiceToEdit] = useState<any>(null);
  
  const { fetchInvoices: refreshInvoices } = useSalesInvoices();

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        logger.warn('User not authenticated', {}, 'Invoices');
        toast({
          title: "يجب تسجيل الدخول",
          description: "يرجى تسجيل الدخول للوصول إلى فواتير المبيعات",
          variant: "destructive",
        });
        // توجيه المستخدم لصفحة تسجيل الدخول
        navigate('/login');
        return;
      }

      // جلب الفواتير مع عدد العناصر وبيانات العميل (استبعاد المحذوفة)
      const { data: invoicesData, error } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          total_amount,
          status,
          created_at,
          customer_id,
          customers(
            id,
            name
          ),
          invoice_items (
            id
          )
        `)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('خطأ في تحميل الفواتير من Supabase', error, 'Invoices');
        toast({
          title: "خطأ في تحميل الفواتير",
          description: "حدث خطأ أثناء تحميل الفواتير من قاعدة البيانات",
          variant: "destructive",
        });
        return;
      }

      // تحويل البيانات من Supabase إلى التنسيق المتوقع
      const formattedInvoices: Invoice[] = (invoicesData || []).map((invoice: any) => ({
        id: invoice.invoice_number || invoice.id,
        invoice_number: invoice.invoice_number || invoice.id,
        customer_name: invoice.customers?.name || 'عميل غير محدد',
        total_amount: invoice.total_amount || 0,
        status: invoice.status as 'paid' | 'unpaid',
        created_at: invoice.created_at,
        items_count: invoice.invoice_items?.length || 0,
        supabaseId: invoice.id
      }));

      setInvoices(formattedInvoices);
    } catch (error) {
      logger.error('خطأ في تحميل الفواتير', error, 'Invoices');
      toast({
        title: "خطأ",
        description: "حدث خطأ غير متوقع أثناء تحميل الفواتير",
        variant: "destructive",
      });
      setInvoices([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditInvoice = async (invoice: Invoice) => {
    try {
      // جلب تفاصيل الفاتورة الكاملة
      const { data: invoiceData, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoice.supabaseId)
        .single();

      if (error) throw error;

      setInvoiceToEdit(invoiceData);
      setEditInvoiceDialogOpen(true);
    } catch (error) {
      logger.error('خطأ في تحميل الفاتورة للتعديل', error, 'Invoices');
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل الفاتورة للتعديل",
        variant: "destructive",
      });
    }
  };

  const handleViewInvoice = async (invoice: Invoice) => {
    try {
      // جلب تفاصيل الفاتورة مع العناصر وبيانات العميل
      const { data: invoiceData, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customers(
            id,
            name,
            phone,
            email
          ),
          invoice_items (
            id,
            product_name,
            quantity,
            unit_price,
            total_price
          )
        `)
        .eq('id', invoice.supabaseId)
        .single();

      if (error) throw error;

      setSelectedInvoice({
        ...invoiceData,
        // تحويل أسماء الحقول لتتوافق مع InvoicePrintTemplate
        id: invoiceData.invoice_number || invoiceData.id,
        customerName: invoiceData.customers?.name || 'عميل غير محدد',
        customerPhone: '', // إزالة رقم العميل من الطباعة
        date: invoiceData.invoice_date || invoiceData.created_at,
        total: invoiceData.total_amount || 0,
        subtotal: invoiceData.subtotal || invoiceData.total_amount || 0,
        taxAmount: invoiceData.tax_amount || 0,
        discountAmount: invoiceData.discount_amount || 0,
        items: invoiceData.invoice_items || [],
        itemsDetails: invoiceData.invoice_items || [],
        notes: invoiceData.notes || ''
      });
    } catch (error) {
      logger.error('خطأ في عرض تفاصيل الفاتورة', error, 'Invoices');
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل تفاصيل الفاتورة",
        variant: "destructive",
      });
    }
  };

  const handleOpenRestoreDialog = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "يجب تسجيل الدخول",
          description: "يرجى تسجيل الدخول للوصول إلى الفواتير المحذوفة",
          variant: "destructive",
        });
        return;
      }

      // جلب الفواتير المحذوفة
      const { data, error } = await supabase.rpc('get_deleted_invoices', {
        p_user_id: user.id,
        p_days_back: 30
      });

      if (error) {
        logger.error('خطأ في تحميل الفواتير المحذوفة', error, 'Invoices');
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء تحميل الفواتير المحذوفة",
          variant: "destructive",
        });
        return;
      }

      setDeletedInvoices(data || []);
      setIsRestoreDialogOpen(true);
    } catch (error) {
      logger.error('خطأ في فتح نافذة استعادة الفواتير', error, 'Invoices');
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء فتح نافذة استعادة الفواتير",
        variant: "destructive",
      });
    }
  };

  const handleRestoreInvoice = async (invoiceId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "يجب تسجيل الدخول",
          description: "يرجى تسجيل الدخول لاستعادة الفاتورة",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.rpc('restore_single_invoice', {
        p_user_id: user.id,
        p_invoice_id: invoiceId
      });

      if (error) throw error;

      const result = data[0];
      if (result.success) {
        toast({
          title: "تم الاستعادة",
          description: result.message,
        });
        
        // تحديث قائمة الفواتير المحذوفة
        setDeletedInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
        
        // إعادة تحميل الفواتير العادية
        await loadInvoices();
      } else {
        toast({
          title: "خطأ في الاستعادة",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      logger.error('خطأ في استعادة الفاتورة', error, 'Invoices');
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء استعادة الفاتورة",
        variant: "destructive",
      });
    }
  };

  const handlePermanentDelete = async (invoiceId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "يجب تسجيل الدخول",
          description: "يرجى تسجيل الدخول لحذف الفاتورة",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.rpc('permanently_delete_invoice', {
        p_user_id: user.id,
        p_invoice_id: invoiceId
      });

      if (error) throw error;

      // تنظيف المعاملات المالية المرتبطة بالفواتير المحذوفة
      try {
        await supabase.rpc('cleanup_orphaned_invoice_transactions', {
          p_user_id: user.id
        });
      } catch (cleanupError) {
        console.warn('تحذير: لم يتم تنظيف المعاملات المالية بشكل كامل:', cleanupError);
      }

      const result = data[0];
      if (result.success) {
        toast({
          title: "تم الحذف",
          description: result.message,
        });
        
        // تحديث قائمة الفواتير المحذوفة
        setDeletedInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
      } else {
        toast({
          title: "خطأ في الحذف",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      logger.error('خطأ في حذف الفاتورة نهائياً', error, 'Invoices');
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف الفاتورة نهائياً",
        variant: "destructive",
      });
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "paid":
        return "default";
      case "unpaid":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return "مدفوعة";
      case "unpaid":
        return "معلقة";
      default:
        return status;
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "الكل" || 
                         (statusFilter === "مدفوعة" && invoice.status === "paid") ||
                         (statusFilter === "معلقة" && invoice.status === "unpaid");
    return matchesSearch && matchesStatus;
  });

  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(inv => inv.status === "paid").length;
  const pendingInvoices = invoices.filter(inv => inv.status === "unpaid").length;
  const totalRevenue = invoices
    .filter(inv => inv.status === "paid")
    .reduce((sum, inv) => sum + inv.total_amount, 0);

  if (isLoading) {
    return (
      <AuthRequired feature="فواتير المبيعات">
        <div className="container mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle>فواتير المبيعات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="mr-2">جاري تحميل الفواتير...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </AuthRequired>
    );
  }

  return (
    <AuthRequired feature="فواتير المبيعات">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">فواتير المبيعات</h1>
            <div className="flex gap-2">
              <Button onClick={loadInvoices} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 ml-2" />
                تحديث
              </Button>
              <Button onClick={() => navigate('/sales/invoices/new')}>
                <Plus className="h-4 w-4 ml-2" />
                فاتورة جديدة
              </Button>
              <Button 
                onClick={() => navigate('/sales/invoices/restore')}
                variant="destructive" 
                size="sm"
                className="font-cairo"
              >
                <FileText className="h-4 w-4 ml-2" />
                استعادة الفواتير المحذوفة
              </Button>
            </div>
          </div>
          
          {/* إحصائيات سريعة */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{totalInvoices}</div>
                <p className="text-xs text-muted-foreground">إجمالي الفواتير</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{paidInvoices}</div>
                <p className="text-xs text-muted-foreground">فواتير مدفوعة</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-yellow-600">{pendingInvoices}</div>
                <p className="text-xs text-muted-foreground">فواتير معلقة</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{totalRevenue.toLocaleString()} ج.م</div>
                <p className="text-xs text-muted-foreground">إجمالي الإيرادات</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>قائمة الفواتير</CardTitle>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="بحث في الفواتير..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="الكل">جميع الحالات</SelectItem>
                  <SelectItem value="مدفوعة">مدفوعة</SelectItem>
                  <SelectItem value="معلقة">معلقة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الفاتورة</TableHead>
                  <TableHead>العميل</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>عدد العناصر</TableHead>
                  <TableHead>المبلغ الإجمالي</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.supabaseId}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{invoice.customer_name}</TableCell>
                    <TableCell>
                      {format(new Date(invoice.created_at), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>{invoice.items_count}</TableCell>
                    <TableCell>{invoice.total_amount.toLocaleString()} ج.م</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(invoice.status)}>
                        {getStatusText(invoice.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewInvoice(invoice)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>تفاصيل الفاتورة {invoice.invoice_number}</DialogTitle>
                            </DialogHeader>
                            {selectedInvoice && (
                              <EnhancedInvoicePrint
                                invoiceData={selectedInvoice}
                                onPrint={() => {
                                  toast({
                                    title: "تم إرسال الطباعة",
                                    description: `تم طباعة الفاتورة ${invoice.invoice_number}`,
                                  });
                                  setSelectedInvoice(null);
                                }}
                              />
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        <SupabaseInvoiceActions 
                          invoice={invoice}
                          onUpdate={loadInvoices}
                          onEdit={handleEditInvoice}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredInvoices.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>لا توجد فواتير تطابق معايير البحث</p>
              </div>
            )}
          </CardContent>
        </Card>

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
                          <TableHead className="text-right font-cairo">التاريخ</TableHead>
                          <TableHead className="text-right font-cairo">المبلغ الإجمالي</TableHead>
                          <TableHead className="text-right font-cairo">الحالة</TableHead>
                          <TableHead className="text-right font-cairo">تاريخ الحذف</TableHead>
                          <TableHead className="text-center font-cairo">الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {deletedInvoices.map((invoice) => (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-mono">{invoice.invoice_number}</TableCell>
                            <TableCell className="font-tajawal">
                              {format(new Date(invoice.created_at), "dd/MM/yyyy", { locale: ar })}
                            </TableCell>
                            <TableCell className="font-mono">
                              {invoice.total_amount.toLocaleString('ar-SA')} ج.م
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusVariant(invoice.status)}>
                                {getStatusText(invoice.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-tajawal">
                              {invoice.deleted_at 
                                ? format(new Date(invoice.deleted_at), "dd/MM/yyyy HH:mm", { locale: ar })
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
              <div className="flex justify-end mt-6">
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

        {/* مكون تعديل الفاتورة المبسط */}
        <EditSalesInvoiceDialog
          isOpen={editInvoiceDialogOpen}
          onClose={() => {
            setEditInvoiceDialogOpen(false);
            setInvoiceToEdit(null);
          }}
          invoice={invoiceToEdit}
          onUpdate={() => {
            loadInvoices();
            refreshInvoices();
          }}
        />
      </div>
    </AuthRequired>
  );
}