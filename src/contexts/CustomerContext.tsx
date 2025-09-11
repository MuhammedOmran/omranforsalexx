import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { toast } from "@/hooks/use-toast";

export interface Customer {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  company?: string;
  notes?: string;
  customer_number?: string;
  created_at: string;
  updated_at: string;
  // Enhanced fields for local compatibility
  city?: string;
  center?: string;
  country?: string;
  customerType?: string;
  taxNumber?: string;
  paymentOption?: string;
  debtLimit?: string;
  customerNumber?: string;
  totalOrders?: number;
  totalSpent?: number;
  status?: string;
  loyaltyPoints?: number;
  totalDebt?: number;
  creditLimit?: number;
  paymentReliability?: number;
  customerRank?: string;
  hasInstallments?: boolean;
  installmentAmount?: number;
}

interface CustomerContextType {
  customers: Customer[];
  loading: boolean;
  addCustomer: (customer: Omit<Customer, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateCustomer: (id: string, customerData: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  refreshCustomers: () => Promise<void>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export function CustomerProvider({ children }: { children: ReactNode }) {
  const { user } = useSupabaseAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // تحميل العملاء من Supabase
  const loadCustomers = async () => {
    if (!user) {
      setCustomers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)  // فقط العملاء غير المحذوفين
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast({
        title: "خطأ في تحميل العملاء",
        description: "حدث خطأ أثناء تحميل قائمة العملاء",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // تحميل العملاء عند تسجيل الدخول أو تغيير المستخدم
  useEffect(() => {
    loadCustomers();
  }, [user]);

  const addCustomer = async (customerData: Omit<Customer, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive",
      });
      return;
    }

    try {
      // استخراج الحقول الموجودة في قاعدة البيانات فقط
      const dbData = {
        name: customerData.name,
        email: customerData.email || null,
        phone: customerData.phone || null,
        address: customerData.address || null,
        company: customerData.company || null,
        notes: customerData.notes || null,
        customer_number: customerData.customerNumber || null,
        user_id: user.id,
      };

      const { data, error } = await supabase
        .from('customers')
        .insert([dbData])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setCustomers(prev => [data, ...prev]);
        toast({
          title: "تم إضافة العميل",
          description: "تم إضافة العميل بنجاح",
        });
      }
    } catch (error) {
      console.error('Error adding customer:', error);
      toast({
        title: "خطأ في إضافة العميل",
        description: "حدث خطأ أثناء إضافة العميل",
        variant: "destructive",
      });
    }
  };

  const updateCustomer = async (id: string, customerData: Partial<Customer>) => {
    if (!user) return;

    try {
      // فلترة البيانات لإبقاء الحقول الموجودة في قاعدة البيانات فقط
      const dbData = {
        name: customerData.name,
        email: customerData.email || null,
        phone: customerData.phone || null,
        address: customerData.address || null,
        company: customerData.company || null,
        notes: customerData.notes || null,
        customer_number: customerData.customer_number || null,
      };

      // إزالة القيم غير المحددة
      Object.keys(dbData).forEach(key => 
        dbData[key as keyof typeof dbData] === undefined && delete dbData[key as keyof typeof dbData]
      );

      console.log('Updating customer with data:', dbData);

      const { data, error } = await supabase
        .from('customers')
        .update(dbData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setCustomers(prev => prev.map(customer => 
          customer.id === id ? data : customer
        ));
        toast({
          title: "تم تحديث العميل",
          description: "تم تحديث بيانات العميل بنجاح",
        });
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      toast({
        title: "خطأ في تحديث العميل",
        description: "حدث خطأ أثناء تحديث العميل",
        variant: "destructive",
      });
    }
  };

  const deleteCustomer = async (id: string) => {
    if (!user) return;

    try {
      // استخدام الحذف الناعم بدلاً من الحذف النهائي
      const { error } = await supabase
        .from('customers')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setCustomers(prev => prev.filter(customer => customer.id !== id));
      toast({
        title: "تم حذف العميل",
        description: "تم نقل العميل إلى سلة المحذوفات",
      });
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast({
        title: "خطأ في حذف العميل",
        description: "حدث خطأ أثناء حذف العميل",
        variant: "destructive",
      });
    }
  };

  const refreshCustomers = async () => {
    await loadCustomers();
  };

  return (
    <CustomerContext.Provider value={{ 
      customers,
      loading,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      refreshCustomers
    }}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomers() {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error('useCustomers must be used within a CustomerProvider');
  }
  return context;
}