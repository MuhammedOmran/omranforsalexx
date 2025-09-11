import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type CashTransactionRow = Database['public']['Tables']['cash_transactions']['Row'];
type CashBalanceRow = Database['public']['Tables']['cash_balances']['Row'];

export interface CashTransaction {
  id?: string;
  user_id?: string;
  transaction_type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  subcategory?: string;
  payment_method: 'cash' | 'bank' | 'credit' | 'check';
  reference_id?: string;
  reference_type?: string;
  notes?: string;
  metadata?: any;
  created_at?: string;
  updated_at?: string;
}

export interface CashBalance {
  id?: string;
  user_id?: string;
  current_balance: number;
  opening_balance: number;
  last_transaction_id?: string;
  balance_date: string;
  created_at?: string;
  updated_at?: string;
}

export function useCashRegister() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // جلب المعاملات (فقط المعاملات غير المحذوفة)
  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('cash_transactions')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions((data || []) as CashTransaction[]);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "خطأ في جلب المعاملات",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // جلب الرصيد الحالي
  const fetchCurrentBalance = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // محاولة جلب الرصيد من جدول الأرصدة
      const { data: balanceData } = await supabase
        .from('cash_balances')
        .select('current_balance')
        .eq('user_id', user.user.id)
        .order('balance_date', { ascending: false })
        .limit(1)
        .single();

      if (balanceData) {
        setCurrentBalance(balanceData.current_balance);
      } else {
        // حساب الرصيد من المعاملات
        await calculateBalance();
      }
    } catch (err: any) {
      console.log('لا يوجد رصيد سابق، سيتم حساب الرصيد من المعاملات');
      await calculateBalance();
    }
  };

  // حساب الرصيد من المعاملات
  const calculateBalance = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .rpc('calculate_cash_balance', { p_user_id: user.user.id });

      if (error) throw error;
      setCurrentBalance(data || 0);
      
      // تحديث جدول الأرصدة
      await updateBalanceRecord(data || 0);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // تحديث سجل الرصيد
  const updateBalanceRecord = async (balance: number, lastTransactionId?: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const today = new Date().toISOString().split('T')[0];

      // البحث عن سجل اليوم
      const { data: existingBalance } = await supabase
        .from('cash_balances')
        .select('id')
        .eq('user_id', user.user.id)
        .eq('balance_date', today)
        .single();

      if (existingBalance) {
        // تحديث الرصيد الموجود
        await supabase
          .from('cash_balances')
          .update({
            current_balance: balance,
            last_transaction_id: lastTransactionId
          })
          .eq('id', existingBalance.id);
      } else {
        // إنشاء سجل جديد
        await supabase
          .from('cash_balances')
          .insert({
            user_id: user.user.id,
            current_balance: balance,
            opening_balance: currentBalance, // الرصيد السابق كرصيد افتتاحي
            balance_date: today,
            last_transaction_id: lastTransactionId
          });
      }
    } catch (err: any) {
      console.error('خطأ في تحديث سجل الرصيد:', err);
    }
  };

  // إضافة معاملة جديدة
  const addTransaction = async (transaction: Omit<CashTransaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      setIsLoading(true);
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('المستخدم غير مسجل دخول');

      const { data, error } = await supabase
        .from('cash_transactions')
        .insert({
          ...transaction,
          user_id: user.user.id
        })
        .select()
        .single();

      if (error) throw error;

      // إعادة حساب الرصيد
      await calculateBalance();
      
      // تحديث قائمة المعاملات
      await fetchTransactions();

      toast({
        title: "تم بنجاح",
        description: `تم ${transaction.transaction_type === 'income' ? 'إضافة' : 'خصم'} ${transaction.amount.toLocaleString()} جنيه`,
      });

      return data;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "خطأ في إضافة المعاملة",
        description: err.message,
        variant: "destructive"
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // تحديث معاملة
  const updateTransaction = async (id: string, updates: Partial<CashTransaction>) => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('cash_transactions')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // إعادة حساب الرصيد
      await calculateBalance();
      
      // تحديث قائمة المعاملات
      await fetchTransactions();

      toast({
        title: "تم التحديث",
        description: "تم تحديث المعاملة بنجاح"
      });
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "خطأ في تحديث المعاملة",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // حذف معاملة (soft delete)
  const deleteTransaction = async (id: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('cash_transactions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      // إعادة حساب الرصيد
      await calculateBalance();
      
      // تحديث قائمة المعاملات
      await fetchTransactions();

      toast({
        title: "تم الحذف",
        description: "تم حذف المعاملة وحفظها للاستعادة خلال 30 يوم"
      });
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "خطأ في حذف المعاملة",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // جلب المعاملات بفترة زمنية (فقط المعاملات غير المحذوفة)
  const getTransactionsByDateRange = async (startDate: string, endDate: string) => {
    try {
      const { data, error } = await supabase
        .from('cash_transactions')
        .select('*')
        .is('deleted_at', null)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  };

  // إضافة معاملة زيادة قيمة المخزون
  const addInventoryValueTransaction = async (productId: string, productName: string, adjustmentAmount: number, reason?: string, notes?: string) => {
    try {
      setIsLoading(true);
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('المستخدم غير مسجل دخول');

      // استخدام معاملة نقدية عادية بدلاً من RPC
      const transaction = await addTransaction({
        transaction_type: 'income',
        amount: adjustmentAmount,
        description: `زيادة قيمة المخزون - ${productName}`,
        category: 'inventory_increase',
        payment_method: 'cash',
        reference_id: productId,
        reference_type: 'inventory_adjustment',
        notes: notes || reason || 'تعديل قيمة المخزون'
      });

      toast({
        title: "تم بنجاح", 
        description: `تم إضافة زيادة قيمة المخزون - ${productName} بمبلغ ${adjustmentAmount.toLocaleString()} جنيه`,
      });

      return transaction;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "خطأ في إضافة معاملة المخزون",
        description: err.message,
        variant: "destructive"
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // حساب إجمالي قيمة المخزون
  const getTotalInventoryValue = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return 0;

      const { data, error } = await supabase.rpc('get_total_inventory_value', {
        p_user_id: user.user.id
      });

      if (error) throw error;
      return data || 0;
    } catch (err: any) {
      console.error('خطأ في حساب قيمة المخزون:', err);
      return 0;
    }
  };

  // إحصائيات الصندوق
  const getCashStatistics = async () => {
    try {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();

      const monthlyTransactions = await getTransactionsByDateRange(startOfMonth, endOfMonth);
      
      const income = monthlyTransactions
        .filter(t => t.transaction_type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expenses = monthlyTransactions
        .filter(t => t.transaction_type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      // حساب معاملات زيادة المخزون منفصلة
      const inventoryIncrease = monthlyTransactions
        .filter(t => t.category === 'inventory_increase')
        .reduce((sum, t) => sum + t.amount, 0);

      const inventoryValue = await getTotalInventoryValue();

      return {
        currentBalance,
        monthlyIncome: income,
        monthlyExpenses: expenses,
        monthlyNetFlow: income - expenses,
        totalTransactions: transactions.length,
        monthlyTransactions: monthlyTransactions.length,
        inventoryIncrease, // إضافة قيمة زيادة المخزون
        totalInventoryValue: inventoryValue // إضافة إجمالي قيمة المخزون
      };
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  // استعادة المعاملات المحذوفة
  const restoreDeletedTransactions = async () => {
    try {
      setIsLoading(true);
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('المستخدم غير مسجل دخول');

      // أولاً، جلب المعاملات المحذوفة
      const { data: deletedData, error: getError } = await supabase
        .rpc('get_deleted_transactions', { 
          p_user_id: user.user.id, 
          p_days_back: 30 
        });

      if (getError) throw getError;

      if (!deletedData || deletedData.length === 0) {
        toast({
          title: "لا توجد معاملات محذوفة",
          description: "لا توجد معاملات محذوفة خلال آخر 30 يوم",
        });
        return;
      }

      // استعادة المعاملات
      const { data: restoreData, error: restoreError } = await supabase
        .rpc('restore_deleted_transactions', { 
          p_user_id: user.user.id, 
          p_days_back: 30 
        });

      if (restoreError) throw restoreError;

      const restoredCount = restoreData?.[0]?.restored_count || 0;

      // تحديث البيانات
      await fetchTransactions();
      await fetchCurrentBalance();

      toast({
        title: "تم استعادة المعاملات",
        description: `تم استعادة ${restoredCount} معاملة بنجاح`,
      });

    } catch (err: any) {
      toast({
        title: "خطأ في استعادة المعاملات",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // جلب المعاملات المحذوفة للعرض
  const getDeletedTransactions = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const { data, error } = await supabase.rpc('get_deleted_transactions', {
        p_user_id: user.user.id,
        p_days_back: 30
      });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('خطأ في جلب المعاملات المحذوفة:', err);
    }
  };

  // حذف معاملة نهائياً 
  const permanentDeleteTransaction = async (transactionId: string) => {
    try {
      setIsLoading(true);
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('المستخدم غير مسجل دخول');

      const { data, error } = await supabase.rpc('permanently_delete_transaction', {
        p_user_id: user.user.id,
        p_transaction_id: transactionId
      });

      if (error) throw error;

      const result = data?.[0];
      if (result?.success) {
        // تحديث البيانات
        await fetchTransactions();
        await fetchCurrentBalance();

        toast({
          title: "تم الحذف النهائي",
          description: result.message || "تم حذف المعاملة نهائياً",
        });
        return true;
      } else {
        toast({
          title: "فشل الحذف النهائي",
          description: result?.message || "لا يمكن حذف هذه المعاملة نهائياً",
          variant: "destructive"
        });
        return false;
      }
    } catch (err: any) {
      toast({
        title: "خطأ في الحذف النهائي",
        description: err.message,
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // حذف جميع المعاملات المحذوفة نهائياً
  const permanentDeleteAllTransactions = async () => {
    try {
      setIsLoading(true);
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('المستخدم غير مسجل دخول');

      // أولاً جلب المعاملات المحذوفة
      const deletedTransactions = await getDeletedTransactions();
      if (!deletedTransactions || deletedTransactions.length === 0) {
        toast({
          title: "لا توجد معاملات للحذف",
          description: "لا توجد معاملات محذوفة لحذفها نهائياً",
        });
        return false;
      }

      // حذف كل معاملة على حدة
      let deletedCount = 0;
      let failedCount = 0;

      for (const transaction of deletedTransactions) {
        try {
          const { data, error } = await supabase.rpc('permanently_delete_transaction', {
            p_user_id: user.user.id,
            p_transaction_id: transaction.id
          });

          if (error) throw error;

          const result = data?.[0];
          if (result?.success) {
            deletedCount++;
          } else {
            failedCount++;
          }
        } catch (err) {
          failedCount++;
          console.error(`فشل في حذف المعاملة ${transaction.id}:`, err);
        }
      }

      // تحديث البيانات
      await fetchTransactions();
      await fetchCurrentBalance();

      if (deletedCount > 0) {
        toast({
          title: "تم الحذف النهائي",
          description: `تم حذف ${deletedCount} معاملة نهائياً${failedCount > 0 ? ` (فشل حذف ${failedCount} معاملة)` : ''}`,
        });
      }

      if (failedCount > 0 && deletedCount === 0) {
        toast({
          title: "فشل الحذف النهائي",
          description: `فشل في حذف ${failedCount} معاملة`,
          variant: "destructive"
        });
      }

      return deletedCount > 0;

    } catch (err: any) {
      toast({
        title: "خطأ في الحذف النهائي",
        description: err.message,
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // تهيئة البيانات عند تحميل الصفحة
  useEffect(() => {
    const initializeCashRegister = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await fetchTransactions();
        await fetchCurrentBalance();
      }
    };

    initializeCashRegister();

    // الاشتراك في التغييرات الفورية
    const subscription = supabase
      .channel('cash_transactions_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'cash_transactions' },
        () => {
          fetchTransactions();
          fetchCurrentBalance();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    transactions,
    currentBalance,
    isLoading,
    error,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    restoreDeletedTransactions,
    getDeletedTransactions,
    permanentDeleteTransaction,
    permanentDeleteAllTransactions,
    getTransactionsByDateRange,
    getCashStatistics,
    addInventoryValueTransaction,
    getTotalInventoryValue,
    refreshData: () => {
      fetchTransactions();
      fetchCurrentBalance();
    }
  };
}