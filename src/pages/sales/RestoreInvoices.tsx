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

interface DeletedInvoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  status: string;
  deleted_at: string;
  created_at: string;
  customers?: {
    name: string;
    phone?: string;
  };
}

export default function RestoreInvoices() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useSupabaseAuth();
  const [deletedInvoices, setDeletedInvoices] = useState<DeletedInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);

  // تحميل الفواتير المحذوفة
  const loadDeletedInvoices = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_deleted_invoices', {
        p_user_id: user.id,
        p_days_back: 30
      });

      if (error) throw error;
      
      // تحويل البيانات للنوع المطلوب
      const transformedData: DeletedInvoice[] = (data || []).map((invoice: any) => ({
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        total_amount: invoice.total_amount,
        status: invoice.status,
        deleted_at: invoice.deleted_at,
        created_at: invoice.created_at,
        customers: invoice.customers && typeof invoice.customers === 'object' 
          ? invoice.customers 
          : undefined
      }));
      
      setDeletedInvoices(transformedData);
    } catch (error) {
      console.error('Error loading deleted invoices:', error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل الفواتير المحذوفة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeletedInvoices();
  }, [user]);

  // استعادة فاتورة واحدة
  const restoreSingleInvoice = async (invoiceId: string) => {
    if (!user) return;

    try {
      setRestoring(invoiceId);
      const { data, error } = await supabase.rpc('restore_single_invoice', {
        p_user_id: user.id,
        p_invoice_id: invoiceId
      });

      if (error) throw error;

      const result = data?.[0];
      if (result?.success) {
        toast({
          title: "تم الاستعادة بنجاح",
          description: "تم استعادة الفاتورة بنجاح. سيتم توجيهك لصفحة الفواتير لرؤيتها.",
        });
        // إزالة الفاتورة من القائمة
        setDeletedInvoices(prev => prev.filter(invoice => invoice.id !== invoiceId));
        
        // التوجه لصفحة الفواتير بعد ثانيتين
        setTimeout(() => {
          navigate('/sales/invoices');
        }, 2000);
      } else {
        toast({
          title: "خطأ في الاستعادة",
          description: result?.message || "فشلت عملية الاستعادة",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error restoring invoice:', error);
      toast({
        title: "خطأ في الاستعادة",
        description: "حدث خطأ أثناء استعادة الفاتورة",
        variant: "destructive",
      });
    } finally {
      setRestoring(null);
    }
  };

  // استعادة جميع الفواتير
  const restoreAllInvoices = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('restore_deleted_invoices', {
        p_user_id: user.id,
        p_days_back: 30
      });

      if (error) throw error;

      const result = data?.[0];
      if (result?.restored_count > 0) {
        toast({
          title: "تم الاستعادة بنجاح",
          description: `تم استعادة ${result.restored_count} فاتورة بنجاح`,
        });
        setDeletedInvoices([]);
      } else {
        toast({
          title: "لا يوجد فواتير للاستعادة",
          description: "لا يوجد فواتير محذوفة في الفترة المحددة",
        });
      }
    } catch (error) {
      console.error('Error restoring all invoices:', error);
      toast({
        title: "خطأ في الاستعادة",
        description: "حدث خطأ أثناء استعادة الفواتير",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // حذف نهائي لفاتورة
  const permanentlyDeleteInvoice = async (invoiceId: string) => {
    if (!user) return;
    
    if (!confirm("هل أنت متأكد من الحذف النهائي؟ لا يمكن التراجع عن هذا الإجراء.")) {
      return;
    }

    try {
      setRestoring(invoiceId);
      const { data, error } = await supabase.rpc('permanently_delete_invoice', {
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
      console.error('Error permanently deleting invoice:', error);
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء حذف الفاتورة نهائياً",
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
            onClick={() => navigate("/sales/invoices")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-mada-heading text-foreground">استعادة الفواتير المحذوفة</h1>
            <p className="text-muted-foreground">إدارة الفواتير المحذوفة خلال آخر 30 يوماً</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={loadDeletedInvoices}
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
            إحصائيات الفواتير المحذوفة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-center">
            {deletedInvoices.length} فاتورة محذوفة
          </div>
          <p className="text-muted-foreground text-center mt-2">
            خلال آخر 30 يوماً
          </p>
        </CardContent>
      </Card>

      {/* Deleted Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>الفواتير المحذوفة</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : deletedInvoices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا يوجد فواتير محذوفة</h3>
              <p className="text-muted-foreground">
                لا يوجد فواتير محذوفة خلال آخر 30 يوماً
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الفاتورة</TableHead>
                  <TableHead>اسم العميل</TableHead>
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
                    <TableCell>{invoice.customers?.name || '-'}</TableCell>
                    <TableCell className="font-cairo font-mono">
                      {invoice.total_amount.toLocaleString('en-US')} ج.م
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