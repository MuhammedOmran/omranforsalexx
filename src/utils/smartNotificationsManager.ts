import { storage } from './storage';
import { enhancedCustomerIntegration } from './enhancedCustomerIntegration';
import { enhancedSupplierIntegration } from './enhancedSupplierIntegration';
import { enhancedChecksIntegration } from './enhancedChecksIntegration';

export interface SmartNotification {
  id: string;
  type: 'alert' | 'warning' | 'info' | 'success';
  category: 'inventory' | 'customers' | 'suppliers' | 'checks' | 'installments' | 'cash-flow' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionRequired: boolean;
  actionUrl?: string;
  actionText?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  createdAt: string;
  isRead: boolean;
  autoResolve: boolean;
  resolvedAt?: string;
}

export class SmartNotificationsManager {
  private static instance: SmartNotificationsManager;

  static getInstance(): SmartNotificationsManager {
    if (!SmartNotificationsManager.instance) {
      SmartNotificationsManager.instance = new SmartNotificationsManager();
    }
    return SmartNotificationsManager.instance;
  }

  // إنشاء تنبيه ذكي
  private createNotification(notification: Omit<SmartNotification, 'id' | 'createdAt' | 'isRead'>): SmartNotification {
    const newNotification: SmartNotification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      isRead: false
    };

    const notifications = storage.getItem('smart_notifications', []);
    notifications.unshift(newNotification); // إضافة في المقدمة
    
    // الاحتفاظ بآخر 1000 تنبيه فقط
    if (notifications.length > 1000) {
      notifications.splice(1000);
    }
    
    storage.setItem('smart_notifications', notifications);
    return newNotification;
  }

  // فحص المخزون المنخفض
  checkLowStockAlerts() {
    try {
      const products = storage.getItem('products', []);
      const lowStockProducts = products.filter((product: any) => 
        product.stock <= (product.minStock || 10)
      );
      
      lowStockProducts.forEach((product: any) => {
        const existingAlert = this.getActiveNotification('inventory', product.id);
        
        if (!existingAlert) {
          const priority = product.stock === 0 ? 'critical' : 
                          product.stock <= (product.minStock || 10) / 2 ? 'high' : 'medium';
          
          this.createNotification({
            type: product.stock === 0 ? 'alert' : 'warning',
            category: 'inventory',
            title: product.stock === 0 ? 'نفاد المخزون' : 'مخزون منخفض',
            message: `المنتج "${product.name}" ${product.stock === 0 ? 'نفد من المخزون' : `مخزونه منخفض (${product.stock} قطعة)`}`,
            priority,
            actionRequired: true,
            actionUrl: '/inventory/products',
            actionText: 'إدارة المخزون',
            relatedEntityId: product.id,
            relatedEntityType: 'product',
            autoResolve: true
          });
        }
      });
    } catch (error) {
      console.error('Error checking low stock alerts:', error);
    }
  }

  // فحص العملاء المتأخرين
  checkOverdueCustomers() {
    try {
      const overdueCustomers = enhancedCustomerIntegration.getOverdueCustomers();
      
      overdueCustomers.forEach((customer: any) => {
        const existingAlert = this.getActiveNotification('customers', customer.id);
        
        if (!existingAlert && (customer.totalDebt > 0 || customer.overdueInstallmentsAmount > 0)) {
          const priority = customer.riskLevel === 'high' ? 'critical' :
                          customer.riskLevel === 'medium' ? 'high' : 'medium';
          
          this.createNotification({
            type: 'warning',
            category: 'customers',
            title: 'عميل متأخر في الدفع',
            message: `العميل "${customer.name}" متأخر في دفع مبلغ ${customer.totalDebt + customer.overdueInstallmentsAmount} ريال`,
            priority,
            actionRequired: true,
            actionUrl: `/sales/customers/${customer.id}`,
            actionText: 'عرض ملف العميل',
            relatedEntityId: customer.id,
            relatedEntityType: 'customer',
            autoResolve: false
          });
        }
      });
    } catch (error) {
      console.error('Error checking overdue customers:', error);
    }
  }

  // فحص الشيكات المستحقة
  checkOverdueChecks() {
    try {
      const overdueChecks = enhancedChecksIntegration.getOverdueChecks();
      
      overdueChecks.forEach((check: any) => {
        const existingAlert = this.getActiveNotification('checks', check.id);
        
        if (!existingAlert) {
          this.createNotification({
            type: 'warning',
            category: 'checks',
            title: 'شيك مستحق الصرف',
            message: `الشيك رقم ${check.checkNumber} من ${check.holderName} مستحق الصرف (${check.amount} ريال)`,
            priority: 'high',
            actionRequired: true,
            actionUrl: '/checks',
            actionText: 'إدارة الشيكات',
            relatedEntityId: check.id,
            relatedEntityType: 'check',
            autoResolve: true
          });
        }
      });
    } catch (error) {
      console.error('Error checking overdue checks:', error);
    }
  }

  // فحص الأقساط المستحقة
  checkOverdueInstallments() {
    try {
      const installments = storage.getItem('installments', []);
      const today = new Date();
      
      const overdueInstallments = installments.filter((installment: any) => {
        if (installment.status !== 'pending') return false;
        
        const dueDate = new Date(installment.dueDate);
        return dueDate < today;
      });
      
      overdueInstallments.forEach((installment: any) => {
        const existingAlert = this.getActiveNotification('installments', installment.id);
        
        if (!existingAlert) {
          const daysPastDue = Math.floor((today.getTime() - new Date(installment.dueDate).getTime()) / (1000 * 60 * 60 * 24));
          const priority = daysPastDue > 30 ? 'critical' : daysPastDue > 7 ? 'high' : 'medium';
          
          this.createNotification({
            type: 'warning',
            category: 'installments',
            title: 'قسط مستحق',
            message: `قسط بمبلغ ${installment.amount} ريال متأخر ${daysPastDue} يوم`,
            priority,
            actionRequired: true,
            actionUrl: '/installments',
            actionText: 'إدارة الأقساط',
            relatedEntityId: installment.id,
            relatedEntityType: 'installment',
            autoResolve: true
          });
        }
      });
    } catch (error) {
      console.error('Error checking overdue installments:', error);
    }
  }

  // فحص التدفق النقدي
  checkCashFlowAlerts() {
    try {
      const cashTransactions = storage.getItem('cash_transactions', []);
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const recentTransactions = cashTransactions.filter((transaction: any) => 
        new Date(transaction.date) >= thirtyDaysAgo
      );
      
      const totalIncome = recentTransactions
        .filter((t: any) => t.type === 'income')
        .reduce((sum: number, t: any) => sum + t.amount, 0);
      
      const totalExpenses = recentTransactions
        .filter((t: any) => t.type === 'expense')
        .reduce((sum: number, t: any) => sum + t.amount, 0);
      
      const cashFlow = totalIncome - totalExpenses;
      const currentBalance = storage.getItem('cash_balance', 0);
      
      // تنبيه عند انخفاض الرصيد
      if (currentBalance < 10000) {
        const existingAlert = this.getActiveNotification('cash-flow', 'low-balance');
        
        if (!existingAlert) {
          this.createNotification({
            type: 'alert',
            category: 'cash-flow',
            title: 'رصيد منخفض',
            message: `رصيد الصندوق منخفض: ${currentBalance} ريال`,
            priority: currentBalance < 5000 ? 'critical' : 'high',
            actionRequired: true,
            actionUrl: '/cash-register',
            actionText: 'عرض الصندوق',
            relatedEntityId: 'low-balance',
            relatedEntityType: 'cash-flow',
            autoResolve: true
          });
        }
      }
      
      // تنبيه عند التدفق النقدي السلبي
      if (cashFlow < 0) {
        const existingAlert = this.getActiveNotification('cash-flow', 'negative-flow');
        
        if (!existingAlert) {
          this.createNotification({
            type: 'warning',
            category: 'cash-flow',
            title: 'تدفق نقدي سلبي',
            message: `التدفق النقدي خلال آخر 30 يوم سلبي: ${cashFlow} ريال`,
            priority: 'high',
            actionRequired: true,
            actionUrl: '/reports/profit',
            actionText: 'عرض تقرير الأرباح',
            relatedEntityId: 'negative-flow',
            relatedEntityType: 'cash-flow',
            autoResolve: false
          });
        }
      }
    } catch (error) {
      console.error('Error checking cash flow alerts:', error);
    }
  }

  // فحص أداء النظام
  checkSystemPerformance() {
    try {
      // فحص حجم البيانات
      const allKeys = Object.keys(localStorage);
      const totalSize = allKeys.reduce((size, key) => {
        return size + (localStorage.getItem(key)?.length || 0);
      }, 0);
      
      // تنبيه عند اقتراب السعة من الحد الأقصى (5MB تقريباً)
      if (totalSize > 4 * 1024 * 1024) {
        const existingAlert = this.getActiveNotification('system', 'storage-limit');
        
        if (!existingAlert) {
          this.createNotification({
            type: 'warning',
            category: 'system',
            title: 'سعة التخزين تقترب من الحد الأقصى',
            message: 'يُنصح بعمل نسخة احتياطية وتنظيف البيانات القديمة',
            priority: 'medium',
            actionRequired: true,
            actionUrl: '/settings',
            actionText: 'إدارة البيانات',
            relatedEntityId: 'storage-limit',
            relatedEntityType: 'system',
            autoResolve: false
          });
        }
      }
      
      // فحص آخر نسخة احتياطية
      const lastBackup = storage.getItem('last_backup_date', null);
      if (lastBackup) {
        const daysSinceBackup = Math.floor(
          (new Date().getTime() - new Date(lastBackup).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysSinceBackup > 7) {
          const existingAlert = this.getActiveNotification('system', 'backup-reminder');
          
          if (!existingAlert) {
            this.createNotification({
              type: 'info',
              category: 'system',
              title: 'تذكير النسخ الاحتياطي',
              message: `لم يتم عمل نسخة احتياطية منذ ${daysSinceBackup} يوم`,
              priority: daysSinceBackup > 30 ? 'high' : 'medium',
              actionRequired: true,
              actionUrl: '/settings',
              actionText: 'عمل نسخة احتياطية',
              relatedEntityId: 'backup-reminder',
              relatedEntityType: 'system',
              autoResolve: true
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking system performance:', error);
    }
  }

  // فحص تنبيه موجود
  private getActiveNotification(category: string, relatedEntityId: string): SmartNotification | null {
    try {
      const notifications = storage.getItem('smart_notifications', []);
      return notifications.find((notification: SmartNotification) =>
        notification.category === category &&
        notification.relatedEntityId === relatedEntityId &&
        !notification.isRead &&
        !notification.resolvedAt
      ) || null;
    } catch (error) {
      return null;
    }
  }

  // تشغيل جميع فحوصات التنبيهات
  runAllChecks() {
    this.checkLowStockAlerts();
    this.checkOverdueCustomers();
    this.checkOverdueChecks();
    this.checkOverdueInstallments();
    this.checkCashFlowAlerts();
    this.checkSystemPerformance();
  }

  // الحصول على جميع التنبيهات
  getAllNotifications(limit: number = 50): SmartNotification[] {
    try {
      const notifications = storage.getItem('smart_notifications', []);
      return notifications.slice(0, limit);
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  // الحصول على التنبيهات غير المقروءة
  getUnreadNotifications(): SmartNotification[] {
    try {
      const notifications = storage.getItem('smart_notifications', []);
      return notifications.filter((notification: SmartNotification) => !notification.isRead);
    } catch (error) {
      console.error('Error getting unread notifications:', error);
      return [];
    }
  }

  // تمييز تنبيه كمقروء
  markAsRead(notificationId: string) {
    try {
      const notifications = storage.getItem('smart_notifications', []);
      const notificationIndex = notifications.findIndex((n: SmartNotification) => n.id === notificationId);
      
      if (notificationIndex !== -1) {
        notifications[notificationIndex].isRead = true;
        storage.setItem('smart_notifications', notifications);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  // تمييز جميع التنبيهات كمقروءة
  markAllAsRead() {
    try {
      const notifications = storage.getItem('smart_notifications', []);
      notifications.forEach((notification: SmartNotification) => {
        notification.isRead = true;
      });
      storage.setItem('smart_notifications', notifications);
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  // حذف تنبيه
  deleteNotification(notificationId: string) {
    try {
      const notifications = storage.getItem('smart_notifications', []);
      const filteredNotifications = notifications.filter((n: SmartNotification) => n.id !== notificationId);
      storage.setItem('smart_notifications', filteredNotifications);
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  // إحصائيات التنبيهات
  getNotificationsStats() {
    try {
      const notifications = storage.getItem('smart_notifications', []);
      const unreadCount = notifications.filter((n: SmartNotification) => !n.isRead).length;
      const criticalCount = notifications.filter((n: SmartNotification) => n.priority === 'critical' && !n.isRead).length;
      const highCount = notifications.filter((n: SmartNotification) => n.priority === 'high' && !n.isRead).length;
      
      const byCategory = notifications.reduce((acc: any, notification: SmartNotification) => {
        if (!notification.isRead) {
          acc[notification.category] = (acc[notification.category] || 0) + 1;
        }
        return acc;
      }, {});
      
      return {
        total: notifications.length,
        unread: unreadCount,
        critical: criticalCount,
        high: highCount,
        byCategory,
        actionRequired: notifications.filter((n: SmartNotification) => n.actionRequired && !n.isRead).length
      };
    } catch (error) {
      console.error('Error getting notifications stats:', error);
      return {
        total: 0,
        unread: 0,
        critical: 0,
        high: 0,
        byCategory: {},
        actionRequired: 0
      };
    }
  }
}

export const smartNotificationsManager = SmartNotificationsManager.getInstance();