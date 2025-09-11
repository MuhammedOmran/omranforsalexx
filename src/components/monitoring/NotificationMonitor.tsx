import React, { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { advancedNotificationService } from '@/services/AdvancedNotificationService';
import { supabase } from '@/integrations/supabase/client';
import { storage } from '@/utils/storage';

export const NotificationMonitor: React.FC = () => {
  const { user } = useSupabaseAuth();
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  useEffect(() => {
    if (!user) return;

    const runChecks = async () => {
      try {
        console.log('🔔 Starting notification checks...');

        // فحص الفواتير المستحقة
        await checkOverdueInvoices();
        
        // فحص المخزون المنخفض
        await checkLowStock();
        
        // فحص الشيكات المستحقة
        await checkOverdueChecks();
        
        // فحص التدفق النقدي
        await checkCashFlow();
        
        // فحص العملاء المتأخرين
        await checkOverdueCustomers();
        
        // فحص التقارير الشهرية
        await checkMonthlyReports();

        setLastCheck(new Date());
        console.log('✅ Notification checks completed');
      } catch (error) {
        console.error('❌ Error in notification checks:', error);
      }
    };

    // تشغيل الفحص فوراً
    runChecks();

    // تشغيل الفحص كل 5 دقائق
    const interval = setInterval(runChecks, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  const checkOverdueInvoices = async () => {
    try {
      const invoices = storage.getItem('invoices', []);
      const today = new Date();

      for (const invoice of invoices) {
        if (invoice.user_id !== user?.id || invoice.deleted_at) continue;

        const dueDate = new Date(invoice.due_date);
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // فاتورة مستحقة خلال 3 أيام
        if (daysUntilDue <= 3 && daysUntilDue >= 0 && invoice.status !== 'paid') {
          await advancedNotificationService.notifyInvoiceDue({
            ...invoice,
            invoice_id: invoice.id,
            invoice_number: invoice.invoice_number,
            due_date: invoice.due_date,
            customer_name: invoice.customer_name || 'عميل غير محدد'
          }, user.id);
        }
        
        // فاتورة متأخرة
        if (daysUntilDue < 0 && invoice.status !== 'paid') {
          await advancedNotificationService.notifyInvoiceDue({
            ...invoice,
            invoice_id: invoice.id,
            invoice_number: invoice.invoice_number,
            due_date: invoice.due_date,
            customer_name: invoice.customer_name || 'عميل غير محدد'
          }, user.id);
        }
      }
    } catch (error) {
      console.error('Error checking overdue invoices:', error);
    }
  };

  const checkLowStock = async () => {
    try {
      // جلب المنتجات من سوبابيس
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, stock, min_stock, is_active')
        .eq('user_id', user?.id)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching products from Supabase:', error);
        return;
      }

      if (!products || products.length === 0) {
        console.log('No products found for stock check');
        return;
      }

      for (const product of products) {
        const currentStock = product.stock || 0;
        const minStock = product.min_stock || 5;

        // مخزون منتهي
        if (currentStock === 0) {
          console.log(`Product ${product.name} is out of stock`);
          await advancedNotificationService.notifyLowStock({
            id: product.id,
            product_id: product.id,
            product_name: product.name,
            stock: currentStock,
            min_stock: minStock
          }, user.id);
        }
        
        // مخزون منخفض
        else if (currentStock <= minStock) {
          console.log(`Product ${product.name} is low in stock: ${currentStock}/${minStock}`);
          await advancedNotificationService.notifyLowStock({
            id: product.id,
            product_id: product.id,
            product_name: product.name,
            stock: currentStock,
            min_stock: minStock
          }, user.id);
        }
      }
    } catch (error) {
      console.error('Error checking low stock:', error);
    }
  };

  const checkOverdueChecks = async () => {
    try {
      const checks = storage.getItem('checks', []);
      const today = new Date();

      for (const check of checks) {
        if (check.user_id !== user?.id || check.deleted_at || check.status !== 'pending') continue;

        const dueDate = new Date(check.due_date);
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilDue <= 2 && daysUntilDue >= 0) {
          await advancedNotificationService.notifyCheckDue({
            ...check,
            check_id: check.id,
            check_number: check.check_number,
            customer_name: check.customer_name,
            due_date: check.due_date,
            amount: check.amount
          }, user.id);
        }
      }
    } catch (error) {
      console.error('Error checking overdue checks:', error);
    }
  };

  const checkCashFlow = async () => {
    try {
      const transactions = storage.getItem('cash_transactions', []);
      
      // حساب الرصيد الحالي
      const currentBalance = transactions
        .filter((t: any) => t.user_id === user?.id && !t.deleted_at)
        .reduce((sum: number, t: any) => {
          return sum + (t.transaction_type === 'income' ? t.amount : -t.amount);
        }, 0);

      if (currentBalance < 10000) {
        await advancedNotificationService.notifyLowCashBalance({
          current_balance: currentBalance,
          entityId: 'cash_balance_' + user.id
        }, user.id);
      }
    } catch (error) {
      console.error('Error checking cash flow:', error);
    }
  };

  const checkOverdueCustomers = async () => {
    try {
      const customers = storage.getItem('customers', []);
      const invoices = storage.getItem('invoices', []);

      for (const customer of customers) {
        if (customer.user_id !== user?.id || customer.deleted_at) continue;

        // حساب المبالغ المتأخرة للعميل
        const customerInvoices = invoices.filter((inv: any) => 
          inv.customer_id === customer.id && 
          inv.status !== 'paid' && 
          !inv.deleted_at &&
          new Date(inv.due_date) < new Date()
        );

        const overdueAmount = customerInvoices.reduce((sum: number, inv: any) => sum + inv.total_amount, 0);
        
        if (overdueAmount > 1000) {
          const oldestInvoice = customerInvoices.reduce((oldest: any, inv: any) => 
            new Date(inv.due_date) < new Date(oldest.due_date) ? inv : oldest, customerInvoices[0]);
          
          const daysOverdue = Math.floor((new Date().getTime() - new Date(oldestInvoice.due_date).getTime()) / (1000 * 60 * 60 * 24));

          await advancedNotificationService.notifyCustomerOverdue({
            ...customer,
            customer_id: customer.id,
            customer_name: customer.name,
            overdue_amount: overdueAmount,
            days_overdue: daysOverdue
          }, user.id);
        }
      }
    } catch (error) {
      console.error('Error checking overdue customers:', error);
    }
  };

  const checkMonthlyReports = async () => {
    try {
      const today = new Date();
      const isFirstOfMonth = today.getDate() === 1;
      
      if (!isFirstOfMonth) return;

      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const startOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
      const endOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);

      const invoices = storage.getItem('invoices', []);
      const transactions = storage.getItem('cash_transactions', []);

      // حساب إحصائيات الشهر الماضي
      const lastMonthInvoices = invoices.filter((inv: any) => {
        const invDate = new Date(inv.invoice_date);
        return inv.user_id === user?.id && 
               !inv.deleted_at &&
               invDate >= startOfLastMonth && 
               invDate <= endOfLastMonth;
      });

      const totalSales = lastMonthInvoices
        .filter((inv: any) => inv.status === 'paid')
        .reduce((sum: number, inv: any) => sum + inv.total_amount, 0);

      const lastMonthExpenses = transactions
        .filter((t: any) => {
          const tDate = new Date(t.created_at);
          return t.user_id === user?.id && 
                 !t.deleted_at &&
                 t.transaction_type === 'expense' &&
                 tDate >= startOfLastMonth && 
                 tDate <= endOfLastMonth;
        })
        .reduce((sum: number, t: any) => sum + t.amount, 0);

      const netProfit = totalSales - lastMonthExpenses;

      await advancedNotificationService.notifyMonthlyReport({
        month: lastMonth.getMonth() + 1,
        year: lastMonth.getFullYear(),
        total_sales: totalSales,
        total_expenses: lastMonthExpenses,
        net_profit: netProfit,
        invoices_count: lastMonthInvoices.length,
        entityId: `monthly_report_${lastMonth.getMonth()}_${lastMonth.getFullYear()}`
      }, user.id);

    } catch (error) {
      console.error('Error generating monthly reports:', error);
    }
  };

  // هذا المكون لا يعرض واجهة مستخدم، فقط يعمل في الخلفية
  return null;
};