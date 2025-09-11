import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Save } from "lucide-react";
import { useCustomers } from "@/contexts/CustomerContext";
import { useToast } from "@/hooks/use-toast";

const customerSchema = z.object({
  name: z.string().min(1, "اسم العميل مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  phone: z.string().min(1, "رقم الهاتف مطلوب"),
  address: z.string().min(1, "العنوان مطلوب"),
  city: z.string().optional(),
  center: z.string().optional(),
  country: z.string().optional(),
  customerType: z.string().optional(),
  taxNumber: z.string().optional(),
  paymentOption: z.string().optional(),
  debtLimit: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

export default function EditCustomer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { customers, updateCustomer } = useCustomers();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      center: "",
      country: "",
      customerType: "",
      taxNumber: "",
      paymentOption: "",
      debtLimit: "",
    }
  });

  useEffect(() => {
    if (id) {
      const customer = customers.find(c => c.id === id);
      if (customer) {
        // محاولة استخراج البيانات الإضافية من notes إذا كانت موجودة
        let additionalData: any = {};
        if (customer.notes) {
          try {
            const parsedNotes = JSON.parse(customer.notes);
            if (typeof parsedNotes === 'object' && parsedNotes !== null) {
              additionalData = parsedNotes;
            }
          } catch (e) {
            // إذا لم تكن notes في صيغة JSON، اتركها كما هي
          }
        }

        form.reset({
          name: customer.name,
          email: customer.email || "",
          phone: customer.phone || "",
          address: customer.address || "",
          city: additionalData.city || (customer as any).city || "",
          center: additionalData.center || (customer as any).center || "",
          country: additionalData.country || (customer as any).country || "",
          customerType: additionalData.customerType || (customer as any).customerType || "",
          taxNumber: additionalData.taxNumber || (customer as any).taxNumber || "",
          paymentOption: additionalData.paymentOption || (customer as any).paymentOption || "",
          debtLimit: additionalData.debtLimit || (customer as any).debtLimit || "",
        });
      } else {
        toast({
          title: "خطأ",
          description: "لم يتم العثور على العميل",
          variant: "destructive",
        });
        navigate("/sales/customers");
      }
    }
  }, [id, customers, navigate, toast, form]);

  const onSubmit = async (data: CustomerFormData) => {
    if (!id) return;
    
    setLoading(true);
    try {
      const existingCustomer = customers.find(c => c.id === id);
      
      if (existingCustomer) {
        // تحضير البيانات للحقول الأساسية فقط
        const updateData = {
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          // حفظ البيانات الإضافية في notes
          notes: JSON.stringify({
            city: data.city,
            center: data.center,
            country: data.country,
            customerType: data.customerType,
            taxNumber: data.taxNumber,
            paymentOption: data.paymentOption,
            debtLimit: data.debtLimit,
            originalNotes: existingCustomer.notes
          })
        };

        await updateCustomer(id, updateData);
        
        toast({
          title: "تم تحديث بيانات العميل",
          description: "تم حفظ التغييرات بنجاح",
        });
        
        navigate("/sales/customers");
      }
    } catch (error) {
      console.error('Error in onSubmit:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث بيانات العميل",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/sales/customers");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 ml-2" />
            العودة
          </Button>
          <h1 className="text-3xl font-mada-heading text-foreground">تعديل بيانات العميل</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>معلومات العميل</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم العميل *</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل اسم العميل" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>البريد الإلكتروني *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="example@domain.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم الهاتف *</FormLabel>
                      <FormControl>
                        <Input placeholder="01xxxxxxxxx" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>العنوان *</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل العنوان" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المدينة</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل المدينة" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>البلد</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل البلد" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع العميل</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر نوع العميل" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="individual">فرد</SelectItem>
                          <SelectItem value="company">شركة</SelectItem>
                          <SelectItem value="government">جهة حكومية</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="taxNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الرقم الضريبي</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل الرقم الضريبي" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentOption"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>طريقة الدفع المفضلة</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر طريقة الدفع" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cash">نقداً</SelectItem>
                          <SelectItem value="credit">آجل</SelectItem>
                          <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                          <SelectItem value="check">شيك</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="debtLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>حد الدين</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل حد الدين" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={handleBack}>
                  إلغاء
                </Button>
                <Button type="submit" disabled={loading}>
                  <Save className="h-4 w-4 ml-2" />
                  {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}