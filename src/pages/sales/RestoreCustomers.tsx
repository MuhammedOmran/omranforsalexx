import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Undo2, Trash2, RefreshCw, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";

interface DeletedCustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  deleted_at: string;
  created_at: string;
}

export default function RestoreCustomers() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useSupabaseAuth();
  const [deletedCustomers, setDeletedCustomers] = useState<DeletedCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);

  // تحميل العملاء المحذوفين
  const loadDeletedCustomers = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_deleted_customers', {
        p_user_id: user.id,
        p_days_back: 30
      });

      if (error) throw error;
      setDeletedCustomers(data || []);
    } catch (error) {
      console.error('Error loading deleted customers:', error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل العملاء المحذوفين",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeletedCustomers();
  }, [user]);

  // استعادة عميل واحد
  const restoreSingleCustomer = async (customerId: string) => {
    if (!user) return;

    try {
      setRestoring(customerId);
      const { data, error } = await supabase.rpc('restore_single_customer', {
        p_user_id: user.id,
        p_customer_id: customerId
      });

      if (error) throw error;

      const result = data?.[0];
      if (result?.success) {
        toast({
          title: "تم الاستعادة بنجاح",
          description: result.message,
        });
        // إزالة العميل من القائمة
        setDeletedCustomers(prev => prev.filter(customer => customer.id !== customerId));
      } else {
        toast({
          title: "خطأ في الاستعادة",
          description: result?.message || "فشلت عملية الاستعادة",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error restoring customer:', error);
      toast({
        title: "خطأ في الاستعادة",
        description: "حدث خطأ أثناء استعادة العميل",
        variant: "destructive",
      });
    } finally {
      setRestoring(null);
    }
  };

  // استعادة جميع العملاء
  const restoreAllCustomers = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('restore_deleted_customers', {
        p_user_id: user.id,
        p_days_back: 30
      });

      if (error) throw error;

      const result = data?.[0];
      if (result?.restored_count > 0) {
        toast({
          title: "تم الاستعادة بنجاح",
          description: `تم استعادة ${result.restored_count} عميل بنجاح`,
        });
        setDeletedCustomers([]);
      } else {
        toast({
          title: "لا يوجد عملاء للاستعادة",
          description: "لا يوجد عملاء محذوفين في الفترة المحددة",
        });
      }
    } catch (error) {
      console.error('Error restoring all customers:', error);
      toast({
        title: "خطأ في الاستعادة",
        description: "حدث خطأ أثناء استعادة العملاء",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // حذف نهائي لعميل
  const permanentlyDeleteCustomer = async (customerId: string) => {
    if (!user) return;
    
    if (!confirm("هل أنت متأكد من الحذف النهائي؟ لا يمكن التراجع عن هذا الإجراء.")) {
      return;
    }

    try {
      setRestoring(customerId);
      const { data, error } = await supabase.rpc('permanently_delete_customer', {
        p_user_id: user.id,
        p_customer_id: customerId
      });

      if (error) throw error;

      const result = data?.[0];
      if (result?.success) {
        toast({
          title: "تم الحذف نهائياً",
          description: result.message,
        });
        // إزالة العميل من القائمة
        setDeletedCustomers(prev => prev.filter(customer => customer.id !== customerId));
      } else {
        toast({
          title: "خطأ في الحذف",
          description: result?.message || "فشلت عملية الحذف",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error permanently deleting customer:', error);
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء حذف العميل نهائياً",
        variant: "destructive",
      });
    } finally {
      setRestoring(null);
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
            onClick={() => navigate("/sales/customers")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-mada-heading text-foreground">استعادة العملاء المحذوفين</h1>
            <p className="text-muted-foreground">إدارة العملاء المحذوفين خلال آخر 30 يوماً</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={loadDeletedCustomers}
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          {deletedCustomers.length > 0 && (
            <Button
              onClick={restoreAllCustomers}
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
            إحصائيات العملاء المحذوفين
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-center">
            {deletedCustomers.length} عميل محذوف
          </div>
          <p className="text-muted-foreground text-center mt-2">
            خلال آخر 30 يوماً
          </p>
        </CardContent>
      </Card>

      {/* Deleted Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>العملاء المحذوفين</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : deletedCustomers.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا يوجد عملاء محذوفين</h3>
              <p className="text-muted-foreground">
                لا يوجد عملاء محذوفين خلال آخر 30 يوماً
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم العميل</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>رقم الهاتف</TableHead>
                  <TableHead>تاريخ الحذف</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deletedCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.email || '-'}</TableCell>
                    <TableCell>{customer.phone || '-'}</TableCell>
                    <TableCell>
                      {new Date(customer.deleted_at).toLocaleDateString('ar-EG', {
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
                          onClick={() => restoreSingleCustomer(customer.id)}
                          disabled={restoring === customer.id}
                          className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                        >
                          <Undo2 className="h-4 w-4" />
                          استعادة
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => permanentlyDeleteCustomer(customer.id)}
                          disabled={restoring === customer.id}
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