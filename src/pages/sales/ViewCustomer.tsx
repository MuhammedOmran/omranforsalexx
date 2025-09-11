import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Phone, Mail, MapPin, Calendar, Users, ShoppingCart } from "lucide-react";
import { useCustomers } from "@/contexts/CustomerContext";
import { useCustomerStats } from "@/hooks/useCustomerStats";
import { useToast } from "@/hooks/use-toast";

export default function ViewCustomer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { customers } = useCustomers();
  const { stats, loading: statsLoading } = useCustomerStats(id || '');
  const { toast } = useToast();
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    if (id) {
      const foundCustomer = customers.find(c => c.id === id);
      if (foundCustomer) {
        setCustomer(foundCustomer);
      } else {
        toast({
          title: "خطأ",
          description: "لم يتم العثور على العميل",
          variant: "destructive",
        });
        navigate("/sales/customers");
      }
    }
  }, [id, customers, navigate, toast]);

  const handleEdit = () => {
    navigate(`/sales/customers/edit/${id}`);
  };

  const handleBack = () => {
    navigate("/sales/customers");
  };

  if (!customer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 ml-2" />
            العودة
          </Button>
          <h1 className="text-3xl font-mada-heading text-foreground">عرض بيانات العميل</h1>
        </div>
        <Button onClick={handleEdit}>
          <Edit className="h-4 w-4 ml-2" />
          تعديل البيانات
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              المعلومات الأساسية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">اسم العميل</label>
              <p className="text-lg font-semibold">{customer.name}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">البريد الإلكتروني</label>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <p>{customer.email}</p>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">رقم الهاتف</label>
              <div className="flex items-center gap-2 mt-1">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <p>{customer.phone}</p>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">العنوان</label>
              <div className="flex items-center gap-2 mt-1">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <p>{customer.address}</p>
              </div>
            </div>

            {customer.city && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">المدينة</label>
                <p>{customer.city}</p>
              </div>
            )}

            {customer.country && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">البلد</label>
                <p>{customer.country}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              معلومات التسوق
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">الحالة</label>
              <div className="mt-1">
                <Badge variant={customer.status === "نشط" ? "default" : "secondary"}>
                  {customer.status || "نشط"}
                </Badge>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">عدد الطلبات</label>
              <p className="text-lg font-semibold">
                {statsLoading ? "جاري التحميل..." : stats.totalOrders}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">إجمالي المشتريات</label>
              <p className="text-lg font-semibold">
                {statsLoading ? "جاري التحميل..." : `${stats.totalSpent.toLocaleString()} ج.م`}
              </p>
            </div>

            {stats.pendingAmount > 0 && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">المبلغ المعلق</label>
                <p className="text-lg font-semibold text-amber-600">
                  {stats.pendingAmount.toLocaleString()} ج.م
                </p>
              </div>
            )}

            {stats.lastOrderDate && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">آخر طلب</label>
                <p className="text-lg font-semibold">
                  {new Date(stats.lastOrderDate).toLocaleDateString('ar-EG')}
                </p>
              </div>
            )}

            {customer.customerType && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">نوع العميل</label>
                <p>{customer.customerType}</p>
              </div>
            )}

            {customer.taxNumber && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">الرقم الضريبي</label>
                <p>{customer.taxNumber}</p>
              </div>
            )}

            {customer.paymentOption && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">طريقة الدفع المفضلة</label>
                <p>{customer.paymentOption}</p>
              </div>
            )}

            {customer.debtLimit && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">حد الدين</label>
                <p>{customer.debtLimit}</p>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">تاريخ التسجيل</label>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p>{customer.created_at ? new Date(customer.created_at).toLocaleDateString('ar-EG') : 'غير متوفر'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}