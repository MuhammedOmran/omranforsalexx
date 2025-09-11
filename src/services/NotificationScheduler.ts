import { advancedNotificationService } from './AdvancedNotificationService';
import { storage } from '@/utils/storage';

export interface ScheduledNotification {
  id: string;
  userId: string;
  category: string;
  type: string;
  scheduledFor: string;
  data: any;
  recurring: boolean;
  frequency?: 'daily' | 'weekly' | 'monthly';
  executed: boolean;
  createdAt: string;
}

class NotificationScheduler {
  private static instance: NotificationScheduler;
  private scheduledNotifications: ScheduledNotification[] = [];
  private isRunning = false;

  static getInstance(): NotificationScheduler {
    if (!NotificationScheduler.instance) {
      NotificationScheduler.instance = new NotificationScheduler();
    }
    return NotificationScheduler.instance;
  }

  constructor() {
    this.loadScheduledNotifications();
    this.startScheduler();
  }

  private loadScheduledNotifications() {
    try {
      const saved = localStorage.getItem('scheduled_notifications');
      if (saved) {
        this.scheduledNotifications = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading scheduled notifications:', error);
      this.scheduledNotifications = [];
    }
  }

  private saveScheduledNotifications() {
    try {
      localStorage.setItem('scheduled_notifications', JSON.stringify(this.scheduledNotifications));
    } catch (error) {
      console.error('Error saving scheduled notifications:', error);
    }
  }

  // جدولة إشعار جديد
  scheduleNotification(
    userId: string,
    category: string,
    type: string,
    scheduledFor: Date,
    data: any,
    recurring = false,
    frequency?: 'daily' | 'weekly' | 'monthly'
  ): string {
    const notification: ScheduledNotification = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      userId,
      category,
      type,
      scheduledFor: scheduledFor.toISOString(),
      data,
      recurring,
      frequency,
      executed: false,
      createdAt: new Date().toISOString()
    };

    this.scheduledNotifications.push(notification);
    this.saveScheduledNotifications();

    console.log(`Notification scheduled: ${category}/${type} for ${scheduledFor.toLocaleString()}`);
    return notification.id;
  }

  // جدولة إشعارات متكررة للفواتير المستحقة
  scheduleInvoiceDueReminders(userId: string) {
    const invoices = storage.getItem('invoices', []);
    const userInvoices = invoices.filter((inv: any) => 
      inv.user_id === userId && 
      !inv.deleted_at && 
      inv.status !== 'paid' && 
      inv.due_date
    );

    userInvoices.forEach((invoice: any) => {
      const dueDate = new Date(invoice.due_date);
      
      // إشعار قبل 3 أيام من الاستحقاق
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(dueDate.getDate() - 3);
      
      if (reminderDate > new Date()) {
        this.scheduleNotification(
          userId,
          'invoices',
          'due_reminder',
          reminderDate,
          {
            invoice_id: invoice.id,
            invoice_number: invoice.invoice_number,
            customer_name: invoice.customer_name || 'عميل غير محدد',
            due_date: invoice.due_date,
            amount: invoice.total_amount,
            days_remaining: 3
          }
        );
      }

      // إشعار في يوم الاستحقاق
      if (dueDate > new Date()) {
        this.scheduleNotification(
          userId,
          'invoices',
          'due_today',
          dueDate,
          {
            invoice_id: invoice.id,
            invoice_number: invoice.invoice_number,
            customer_name: invoice.customer_name || 'عميل غير محدد',
            due_date: invoice.due_date,
            amount: invoice.total_amount,
            days_remaining: 0
          }
        );
      }
    });
  }

  // جدولة التقارير الشهرية
  scheduleMonthlyReports(userId: string) {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    nextMonth.setHours(9, 0, 0, 0);

    this.scheduleNotification(
      userId,
      'financial_performance',
      'monthly_report',
      nextMonth,
      { userId },
      true,
      'monthly'
    );
  }

  // جدولة فحص يومي للمخزون
  scheduleDailyStockCheck(userId: string) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);

    this.scheduleNotification(
      userId,
      'inventory',
      'daily_check',
      tomorrow,
      { userId },
      true,
      'daily'
    );
  }

  // جدولة فحص أسبوعي للعملاء المتأخرين
  scheduleWeeklyCustomerCheck(userId: string) {
    const nextMonday = new Date();
    const daysUntilMonday = (1 + 7 - nextMonday.getDay()) % 7;
    nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
    nextMonday.setHours(10, 0, 0, 0);

    this.scheduleNotification(
      userId,
      'customers',
      'weekly_overdue_check',
      nextMonday,
      { userId },
      true,
      'weekly'
    );
  }

  // تشغيل المجدول
  private startScheduler() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    // فحص كل دقيقة
    const interval = setInterval(() => {
      this.processScheduledNotifications();
    }, 60 * 1000);

    // تنظيف الذاكرة عند إغلاق الصفحة
    window.addEventListener('beforeunload', () => {
      clearInterval(interval);
      this.isRunning = false;
    });
  }

  // معالجة الإشعارات المجدولة
  private async processScheduledNotifications() {
    const now = new Date();
    const toExecute = this.scheduledNotifications.filter(
      notification => !notification.executed && new Date(notification.scheduledFor) <= now
    );

    for (const notification of toExecute) {
      try {
        await this.executeNotification(notification);
        
        if (notification.recurring && notification.frequency) {
          // إنشاء الجدولة التالية للإشعار المتكرر
          this.scheduleNextRecurrence(notification);
        }
        
        // تمييز الإشعار كمنفذ
        notification.executed = true;
      } catch (error) {
        console.error('Error executing scheduled notification:', error);
      }
    }

    // حفظ التحديثات
    if (toExecute.length > 0) {
      this.saveScheduledNotifications();
      
      // تنظيف الإشعارات المنفذة القديمة (أكثر من 7 أيام)
      this.cleanupOldNotifications();
    }
  }

  // تنفيذ إشعار مجدول
  private async executeNotification(notification: ScheduledNotification) {
    console.log(`Executing scheduled notification: ${notification.category}/${notification.type}`);
    
    switch (notification.category) {
      case 'invoices':
        await advancedNotificationService.notifyInvoiceDue(
          notification.data,
          notification.userId
        );
        break;
        
      case 'inventory':
        if (notification.type === 'daily_check') {
          await this.performDailyStockCheck(notification.userId);
        }
        break;
        
      case 'customers':
        if (notification.type === 'weekly_overdue_check') {
          await this.performWeeklyCustomerCheck(notification.userId);
        }
        break;
        
      case 'financial_performance':
        if (notification.type === 'monthly_report') {
          await this.generateMonthlyReport(notification.userId);
        }
        break;
        
      default:
        console.warn(`Unknown notification category: ${notification.category}`);
    }
  }

  // جدولة التكرار التالي
  private scheduleNextRecurrence(notification: ScheduledNotification) {
    const currentDate = new Date(notification.scheduledFor);
    let nextDate: Date;

    switch (notification.frequency) {
      case 'daily':
        nextDate = new Date(currentDate);
        nextDate.setDate(currentDate.getDate() + 1);
        break;
        
      case 'weekly':
        nextDate = new Date(currentDate);
        nextDate.setDate(currentDate.getDate() + 7);
        break;
        
      case 'monthly':
        nextDate = new Date(currentDate);
        nextDate.setMonth(currentDate.getMonth() + 1);
        break;
        
      default:
        return;
    }

    this.scheduleNotification(
      notification.userId,
      notification.category,
      notification.type,
      nextDate,
      notification.data,
      true,
      notification.frequency
    );
  }

  // فحص يومي للمخزون
  private async performDailyStockCheck(userId: string) {
    const products = storage.getItem('products', []);
    const userProducts = products.filter((product: any) => 
      product.user_id === userId && product.is_active
    );

    for (const product of userProducts) {
      if (product.stock <= (product.min_stock || 10)) {
        await advancedNotificationService.notifyLowStock(
          {
            ...product,
            product_id: product.id,
            product_name: product.name
          },
          userId
        );
      }
    }
  }

  // فحص أسبوعي للعملاء المتأخرين
  private async performWeeklyCustomerCheck(userId: string) {
    const customers = storage.getItem('customers', []);
    const invoices = storage.getItem('invoices', []);
    const userCustomers = customers.filter((customer: any) => 
      customer.user_id === userId && !customer.deleted_at
    );

    for (const customer of userCustomers) {
      const overdueInvoices = invoices.filter((inv: any) =>
        inv.customer_id === customer.id &&
        inv.status !== 'paid' &&
        !inv.deleted_at &&
        new Date(inv.due_date) < new Date()
      );

      const overdueAmount = overdueInvoices.reduce((sum: number, inv: any) => sum + inv.total_amount, 0);

      if (overdueAmount > 1000) {
        const oldestInvoice = overdueInvoices.reduce((oldest: any, inv: any) =>
          new Date(inv.due_date) < new Date(oldest.due_date) ? inv : oldest,
          overdueInvoices[0]
        );

        const daysOverdue = Math.floor(
          (new Date().getTime() - new Date(oldestInvoice.due_date).getTime()) / (1000 * 60 * 60 * 24)
        );

        await advancedNotificationService.notifyCustomerOverdue(
          {
            ...customer,
            customer_id: customer.id,
            customer_name: customer.name,
            overdue_amount: overdueAmount,
            days_overdue: daysOverdue
          },
          userId
        );
      }
    }
  }

  // إنتاج التقرير الشهري
  private async generateMonthlyReport(userId: string) {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
    const endOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);

    const invoices = storage.getItem('invoices', []);
    const transactions = storage.getItem('cash_transactions', []);

    const lastMonthInvoices = invoices.filter((inv: any) => {
      const invDate = new Date(inv.invoice_date);
      return inv.user_id === userId &&
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
        return t.user_id === userId &&
               !t.deleted_at &&
               t.transaction_type === 'expense' &&
               tDate >= startOfLastMonth &&
               tDate <= endOfLastMonth;
      })
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    const netProfit = totalSales - lastMonthExpenses;

    await advancedNotificationService.notifyMonthlyReport(
      {
        month: lastMonth.getMonth() + 1,
        year: lastMonth.getFullYear(),
        total_sales: totalSales,
        total_expenses: lastMonthExpenses,
        net_profit: netProfit,
        invoices_count: lastMonthInvoices.length
      },
      userId
    );
  }

  // تنظيف الإشعارات القديمة
  private cleanupOldNotifications() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const countBefore = this.scheduledNotifications.length;
    this.scheduledNotifications = this.scheduledNotifications.filter(
      notification => 
        !notification.executed || 
        new Date(notification.scheduledFor) > sevenDaysAgo
    );

    const countAfter = this.scheduledNotifications.length;
    if (countBefore !== countAfter) {
      console.log(`Cleaned up ${countBefore - countAfter} old notifications`);
      this.saveScheduledNotifications();
    }
  }

  // إلغاء إشعار مجدول
  cancelScheduledNotification(notificationId: string): boolean {
    const index = this.scheduledNotifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      this.scheduledNotifications.splice(index, 1);
      this.saveScheduledNotifications();
      return true;
    }
    return false;
  }

  // الحصول على الإشعارات المجدولة لمستخدم معين
  getScheduledNotifications(userId: string): ScheduledNotification[] {
    return this.scheduledNotifications.filter(n => n.userId === userId && !n.executed);
  }

  // إعداد الجدولة للمستخدم الجديد
  setupUserSchedule(userId: string) {
    console.log(`Setting up notification schedule for user: ${userId}`);
    
    // جدولة الفحوصات الدورية
    this.scheduleInvoiceDueReminders(userId);
    this.scheduleMonthlyReports(userId);
    this.scheduleDailyStockCheck(userId);
    this.scheduleWeeklyCustomerCheck(userId);
    
    console.log('User notification schedule setup completed');
  }
}

export const notificationScheduler = NotificationScheduler.getInstance();