import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Undo2, Trash2, RefreshCw, AlertCircle, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";

interface DeletedPurchaseInvoice {
  id: string;
  invoice_number: string;
  supplier_name: string;
  total_amount: number;
  status: string;
  deleted_at: string;
  created_at: string;
  suppliers?: Record<string, unknown> | null;
}

export default function RestorePurchaseInvoices() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useSupabaseAuth();
  const [deletedInvoices, setDeletedInvoices] = useState<DeletedPurchaseInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);

  // تحميل فواتير الشراء المحذوفة
  const loadDeletedPurchaseInvoices = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_deleted_purchase_invoices', {
        p_user_id: user.id,
        p_days_back: 30
      });

      if (error) throw error;
      setDeletedInvoices(data || []);
    } catch (error) {
      console.error('Error loading deleted purchase invoices:', error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل فواتير الشراء المحذوفة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeletedPurchaseInvoices();
  }, [user]);

  // استعادة فاتورة شراء واحدة
  const restoreSingleInvoice = async (invoiceId: string) => {
    if (!user) return;

    try {
      setRestoring(invoiceId);
      const { data, error } = await supabase.rpc('restore_single_purchase_invoice', {
        p_user_id: user.id,
        p_invoice_id: invoiceId
      });

      if (error) throw error;

      const result = data?.[0];
      if (result?.success) {
        toast({
          title: "تم الاستعادة بنجاح",
          description: result.message,
        });
        // إزالة الفاتورة من القائمة
        setDeletedInvoices(prev => prev.filter(invoice => invoice.id !== invoiceId));
      } else {
        toast({
          title: "خطأ في الاستعادة",
          description: result?.message || "فشلت عملية الاستعادة",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error restoring purchase invoice:', error);
      toast({
        title: "خطأ في الاستعادة",
        description: "حدث خطأ أثناء استعادة فاتورة الشراء",
        variant: "destructive",
      });
    } finally {
      setRestoring(null);
    }
  };

  // استعادة جميع فواتير الشراء
  const restoreAllInvoices = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('restore_deleted_purchase_invoices', {
        p_user_id: user.id,
        p_days_back: 30
      });

      if (error) throw error;

      const result = data?.[0];
      if (result?.restored_count > 0) {
        toast({
          title: "تم الاستعادة بنجاح",
          description: `تم استعادة ${result.restored_count} فاتورة شراء بنجاح`,
        });
        setDeletedInvoices([]);
      } else {
        toast({
          title: "لا يوجد فواتير للاستعادة",
          description: "لا يوجد فواتير شراء محذوفة في الفترة المحددة",
        });
      }
    } catch (error) {
      console.error('Error restoring all purchase invoices:', error);
      toast({
        title: "خطأ في الاستعادة",
        description: "حدث خطأ أثناء استعادة فواتير الشراء",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // حذف نهائي لفاتورة شراء
  const permanentlyDeleteInvoice = async (invoiceId: string) => {
    if (!user) return;
    
    if (!confirm("هل أنت متأكد من الحذف النهائي؟ لا يمكن التراجع عن هذا الإجراء.")) {
      return;
    }

    try {
      setRestoring(invoiceId);
      const { data, error } = await supabase.rpc('permanently_delete_purchase_invoice', {
        p_user_id: user.id,
        p_invoice_id: invoiceId
      });

      if (error) throw error;

      const result = data?.[0];
      if (result?.success) {
        toast({
          title: "تم الحذف نهائياً",
          description: result.message,
        });
        // إزالة الفاتورة من القائمة
        setDeletedInvoices(prev => prev.filter(invoice => invoice.id !== invoiceId));
      } else {
        toast({
          title: "خطأ في الحذف",
          description: result?.message || "فشلت عملية الحذف",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error permanently deleting purchase invoice:', error);
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء حذف فاتورة الشراء نهائياً",
        variant: "destructive",
      });
    } finally {
      setRestoring(null);
    }
  };

  // الحصول على نص الحالة
  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'مدفوعة';
      case 'unpaid': return 'غير مدفوعة';
      case 'pending': return 'معلقة';
      case 'cancelled': return 'ملغية';
      case 'draft': return 'مسودة';
      case 'overdue': return 'متأخرة';
      default: return status;
    }
  };

  // الحصول على لون الحالة
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'default' as const;
      case 'unpaid': return 'destructive' as const;
      case 'pending': return 'secondary' as const;
      case 'cancelled': return 'outline' as const;
      case 'draft': return 'secondary' as const;
      case 'overdue': return 'destructive' as const;
      default: return 'secondary' as const;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/purchases/invoices")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-mada-heading text-foreground">استعادة فواتير الشراء المحذوفة</h1>
            <p className="text-muted-foreground">إدارة فواتير الشراء المحذوفة خلال آخر 30 يوماً</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={loadDeletedPurchaseInvoices}
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          {deletedInvoices.length > 0 && (
            <Button
              onClick={restoreAllInvoices}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              <Undo2 className="h-4 w-4 ml-2" />
              استعادة الكل
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            إحصائيات فواتير الشراء المحذوفة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-center">
            {deletedInvoices.length} فاتورة شراء محذوفة
          </div>
          <p className="text-muted-foreground text-center mt-2">
            خلال آخر 30 يوماً
          </p>
        </CardContent>
      </Card>

      {/* Deleted Purchase Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>فواتير الشراء المحذوفة</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : deletedInvoices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا يوجد فواتير شراء محذوفة</h3>
              <p className="text-muted-foreground">
                لا يوجد فواتير شراء محذوفة خلال آخر 30 يوماً
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الفاتورة</TableHead>
                  <TableHead>اسم المورد</TableHead>
                  <TableHead>المبلغ الإجمالي</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>تاريخ الحذف</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deletedInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium font-mono">{invoice.invoice_number}</TableCell>
                    <TableCell>{(invoice.suppliers as any)?.name || invoice.supplier_name || '-'}</TableCell>
                    <TableCell className="font-mono">
                      {invoice.total_amount.toLocaleString('ar-SA')} ج.م
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(invoice.status)}>
                        {getStatusText(invoice.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(invoice.deleted_at).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => restoreSingleInvoice(invoice.id)}
                          disabled={restoring === invoice.id}
                          className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                        >
                          <Undo2 className="h-4 w-4" />
                          استعادة
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => permanentlyDeleteInvoice(invoice.id)}
                          disabled={restoring === invoice.id}
                        >
                          <Trash2 className="h-4 w-4" />
                          حذف نهائي
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
    </div>
  );
}