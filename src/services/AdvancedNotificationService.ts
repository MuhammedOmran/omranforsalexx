import { supabase } from '@/integrations/supabase/client';
import { CreateNotificationInput } from '@/hooks/useNotifications';

export interface NotificationRule {
  id: string;
  category: string;
  type: string;
  enabled: boolean;
  timing: {
    beforeDue?: number; // أيام قبل الاستحقاق
    recurring?: boolean;
    frequency?: 'daily' | 'weekly' | 'monthly';
    time?: string; // وقت الإرسال
  };
  conditions: {
    threshold?: number;
    operator?: 'greater_than' | 'less_than' | 'equal_to';
    field?: string;
  };
  recipients: {
    roles: string[];
    userIds?: string[];
  };
  template: {
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    actionRequired: boolean;
    actionText?: string;
    actionUrl?: string;
  };
}

class AdvancedNotificationService {
  private static instance: AdvancedNotificationService;
  private rules: NotificationRule[] = [];

  static getInstance(): AdvancedNotificationService {
    if (!AdvancedNotificationService.instance) {
      AdvancedNotificationService.instance = new AdvancedNotificationService();
    }
    return AdvancedNotificationService.instance;
  }

  constructor() {
    this.initializeDefaultRules();
  }

  // تهيئة القواعد الافتراضية
  private initializeDefaultRules() {
    this.rules = [
      // إشعارات الفواتير
      {
        id: 'invoice_due_soon',
        category: 'invoices',
        type: 'due_reminder',
        enabled: true,
        timing: { beforeDue: 3, recurring: true, frequency: 'daily', time: '09:00' },
        conditions: { field: 'due_date', operator: 'less_than', threshold: 3 },
        recipients: { roles: ['manager', 'accountant'] },
        template: {
          title: 'فاتورة مستحقة قريباً',
          message: 'الفاتورة رقم {invoice_number} مستحقة خلال {days_remaining} أيام',
          priority: 'high',
          actionRequired: true,
          actionText: 'عرض الفاتورة',
          actionUrl: '/sales/invoices/{invoice_id}'
        }
      },
      {
        id: 'invoice_overdue',
        category: 'invoices',
        type: 'overdue_alert',
        enabled: true,
        timing: { recurring: true, frequency: 'daily', time: '10:00' },
        conditions: { field: 'due_date', operator: 'less_than', threshold: 0 },
        recipients: { roles: ['manager', 'accountant', 'sales'] },
        template: {
          title: 'فاتورة متأخرة الدفع',
          message: 'الفاتورة رقم {invoice_number} متأخرة {days_overdue} يوم',
          priority: 'critical',
          actionRequired: true,
          actionText: 'متابعة التحصيل',
          actionUrl: '/sales/invoices/{invoice_id}'
        }
      },
      // إشعارات المخزون
      {
        id: 'low_stock_alert',
        category: 'inventory',
        type: 'low_stock',
        enabled: true,
        timing: { recurring: true, frequency: 'daily', time: '08:00' },
        conditions: { field: 'stock', operator: 'less_than', threshold: 10 },
        recipients: { roles: ['manager', 'inventory_manager'] },
        template: {
          title: 'مخزون منخفض',
          message: 'المنتج "{product_name}" وصل إلى الحد الأدنى ({stock} قطعة)',
          priority: 'high',
          actionRequired: true,
          actionText: 'طلب إعادة تزويد',
          actionUrl: '/inventory/products/{product_id}'
        }
      },
      {
        id: 'out_of_stock_alert',
        category: 'inventory',
        type: 'out_of_stock',
        enabled: true,
        timing: { recurring: false },
        conditions: { field: 'stock', operator: 'equal_to', threshold: 0 },
        recipients: { roles: ['manager', 'inventory_manager', 'sales'] },
        template: {
          title: 'نفاد المخزون',
          message: 'المنتج "{product_name}" نفد من المخزون تماماً',
          priority: 'critical',
          actionRequired: true,
          actionText: 'طلب عاجل',
          actionUrl: '/inventory/products/{product_id}'
        }
      },
      // إشعارات الشيكات
      {
        id: 'check_due_soon',
        category: 'checks',
        type: 'due_reminder',
        enabled: true,
        timing: { beforeDue: 2, recurring: true, frequency: 'daily', time: '09:30' },
        conditions: { field: 'due_date', operator: 'less_than', threshold: 2 },
        recipients: { roles: ['manager', 'accountant'] },
        template: {
          title: 'شيك مستحق قريباً',
          message: 'الشيك رقم {check_number} من {customer_name} مستحق خلال {days_remaining} أيام',
          priority: 'high',
          actionRequired: true,
          actionText: 'إدارة الشيكات',
          actionUrl: '/checks/{check_id}'
        }
      },
      // إشعارات التدفق النقدي
      {
        id: 'low_cash_balance',
        category: 'cash_flow',
        type: 'low_balance',
        enabled: true,
        timing: { recurring: true, frequency: 'daily', time: '08:30' },
        conditions: { field: 'balance', operator: 'less_than', threshold: 10000 },
        recipients: { roles: ['manager', 'accountant'] },
        template: {
          title: 'رصيد نقدي منخفض',
          message: 'رصيد الصندوق الحالي: {current_balance} ريال',
          priority: 'critical',
          actionRequired: true,
          actionText: 'عرض الصندوق',
          actionUrl: '/cash-register'
        }
      },
      // إشعارات الأداء المالي
      {
        id: 'monthly_performance_report',
        category: 'financial_performance',
        type: 'monthly_report',
        enabled: true,
        timing: { recurring: true, frequency: 'monthly', time: '09:00' },
        conditions: {},
        recipients: { roles: ['manager', 'owner'] },
        template: {
          title: 'تقرير الأداء المالي الشهري',
          message: 'إجمالي المبيعات: {total_sales} ريال، صافي الربح: {net_profit} ريال',
          priority: 'medium',
          actionRequired: false,
          actionText: 'عرض التقرير المفصل',
          actionUrl: '/reports/profit'
        }
      },
      // إشعارات العملاء المتأخرين
      {
        id: 'customer_payment_overdue',
        category: 'customers',
        type: 'payment_overdue',
        enabled: true,
        timing: { recurring: true, frequency: 'weekly', time: '10:00' },
        conditions: { field: 'overdue_amount', operator: 'greater_than', threshold: 1000 },
        recipients: { roles: ['manager', 'sales', 'accountant'] },
        template: {
          title: 'عميل متأخر في السداد',
          message: 'العميل "{customer_name}" متأخر في دفع {overdue_amount} ريال منذ {days_overdue} يوم',
          priority: 'high',
          actionRequired: true,
          actionText: 'متابعة العميل',
          actionUrl: '/sales/customers/{customer_id}'
        }
      },
      // إشعارات الأمان
      {
        id: 'failed_login_attempts',
        category: 'security',
        type: 'security_alert',
        enabled: true,
        timing: { recurring: false },
        conditions: { field: 'failed_attempts', operator: 'greater_than', threshold: 3 },
        recipients: { roles: ['manager', 'admin'] },
        template: {
          title: 'محاولات دخول فاشلة',
          message: 'تم تسجيل {attempt_count} محاولة دخول فاشلة للمستخدم {username}',
          priority: 'critical',
          actionRequired: true,
          actionText: 'مراجعة الأمان',
          actionUrl: '/comprehensive-security'
        }
      },
      // إشعارات الموردين
      {
        id: 'supplier_payment_due',
        category: 'suppliers',
        type: 'payment_due',
        enabled: true,
        timing: { beforeDue: 5, recurring: true, frequency: 'daily', time: '09:00' },
        conditions: { field: 'payment_due_date', operator: 'less_than', threshold: 5 },
        recipients: { roles: ['manager', 'accountant'] },
        template: {
          title: 'دفعة مستحقة للمورد',
          message: 'دفعة بقيمة {amount} ريال مستحقة للمورد "{supplier_name}" خلال {days_remaining} أيام',
          priority: 'high',
          actionRequired: true,
          actionText: 'تسديد الدفعة',
          actionUrl: '/purchases/suppliers/{supplier_id}'
        }
      }
    ];
  }

  // إنشاء إشعار ذكي بناءً على القواعد
  async createSmartNotification(
    category: string,
    type: string,
    data: any,
    userId: string,
    companyId?: string
  ): Promise<boolean> {
    try {
      const rule = this.rules.find(r => r.category === category && r.type === type && r.enabled);
      
      if (!rule) {
        console.log(`No rule found for category: ${category}, type: ${type}`);
        return false;
      }

      // التحقق من الشروط
      if (!this.checkConditions(rule.conditions, data)) {
        console.log('Conditions not met for notification rule');
        return false;
      }

      // التحقق من عدم وجود إشعار مشابه حديث
      if (await this.hasRecentSimilarNotification(category, type, data, userId)) {
        console.log('Similar notification already exists');
        return false;
      }

      // إنشاء الإشعار
      const notification: CreateNotificationInput = {
        type: this.mapPriorityToType(rule.template.priority),
        category,
        priority: rule.template.priority,
        title: this.interpolateTemplate(rule.template.title, data),
        message: this.interpolateTemplate(rule.template.message, data),
        action_required: rule.template.actionRequired,
        action_text: rule.template.actionText,
        action_url: this.interpolateTemplate(rule.template.actionUrl || '', data),
        related_entity_id: data.id || data.entityId,
        related_entity_type: category,
        auto_resolve: !rule.template.actionRequired,
        company_id: companyId
      };

      const { error } = await supabase
        .from('notifications')
        .insert([{ ...notification, user_id: userId }]);

      if (error) throw error;

      console.log('Smart notification created successfully');
      return true;
    } catch (error) {
      console.error('Error creating smart notification:', error);
      return false;
    }
  }

  // التحقق من الشروط
  private checkConditions(conditions: any, data: any): boolean {
    if (!conditions.field) return true;

    const fieldValue = data[conditions.field];
    const threshold = conditions.threshold;

    switch (conditions.operator) {
      case 'greater_than':
        return fieldValue > threshold;
      case 'less_than':
        return fieldValue < threshold;
      case 'equal_to':
        return fieldValue === threshold;
      default:
        return true;
    }
  }

  // التحقق من وجود إشعار مشابه حديث
  private async hasRecentSimilarNotification(
    category: string,
    type: string,
    data: any,
    userId: string
  ): Promise<boolean> {
    try {
      const { data: existingNotifications, error } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('category', category)
        .eq('related_entity_id', data.id || data.entityId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // آخر 24 ساعة
        .limit(1);

      if (error) throw error;

      return (existingNotifications || []).length > 0;
    } catch (error) {
      console.error('Error checking for similar notifications:', error);
      return false;
    }
  }

  // استبدال المتغيرات في النصوص
  private interpolateTemplate(template: string, data: any): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  // تحويل الأولوية إلى نوع الإشعار
  private mapPriorityToType(priority: string): 'info' | 'warning' | 'success' | 'error' | 'critical' {
    switch (priority) {
      case 'critical':
        return 'critical';
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'info';
    }
  }

  // إنشاء إشعارات محددة بناءً على أنواع البيانات

  // إشعارات الفواتير
  async notifyInvoiceDue(invoiceData: any, userId: string, companyId?: string) {
    const today = new Date();
    const dueDate = new Date(invoiceData.due_date);
    const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysRemaining <= 3 && daysRemaining >= 0) {
      await this.createSmartNotification('invoices', 'due_reminder', {
        ...invoiceData,
        days_remaining: daysRemaining
      }, userId, companyId);
    } else if (daysRemaining < 0) {
      await this.createSmartNotification('invoices', 'overdue_alert', {
        ...invoiceData,
        days_overdue: Math.abs(daysRemaining)
      }, userId, companyId);
    }
  }

  // إشعارات المخزون
  async notifyLowStock(productData: any, userId: string, companyId?: string) {
    if (productData.stock === 0) {
      await this.createSmartNotification('inventory', 'out_of_stock', productData, userId, companyId);
    } else if (productData.stock <= (productData.min_stock || 10)) {
      await this.createSmartNotification('inventory', 'low_stock', productData, userId, companyId);
    }
  }

  // إشعارات الشيكات
  async notifyCheckDue(checkData: any, userId: string, companyId?: string) {
    const today = new Date();
    const dueDate = new Date(checkData.due_date);
    const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysRemaining <= 2 && daysRemaining >= 0) {
      await this.createSmartNotification('checks', 'due_reminder', {
        ...checkData,
        days_remaining: daysRemaining
      }, userId, companyId);
    }
  }

  // إشعارات التدفق النقدي
  async notifyLowCashBalance(balanceData: any, userId: string, companyId?: string) {
    if (balanceData.current_balance < 10000) {
      await this.createSmartNotification('cash_flow', 'low_balance', {
        current_balance: balanceData.current_balance
      }, userId, companyId);
    }
  }

  // إشعارات العملاء المتأخرين
  async notifyCustomerOverdue(customerData: any, userId: string, companyId?: string) {
    if (customerData.overdue_amount > 1000) {
      await this.createSmartNotification('customers', 'payment_overdue', customerData, userId, companyId);
    }
  }

  // إشعارات الأمان
  async notifySecurityAlert(securityData: any, userId: string, companyId?: string) {
    await this.createSmartNotification('security', 'security_alert', securityData, userId, companyId);
  }

  // إشعارات التقارير الدورية
  async notifyMonthlyReport(reportData: any, userId: string, companyId?: string) {
    await this.createSmartNotification('financial_performance', 'monthly_report', reportData, userId, companyId);
  }

  // إدارة القواعد
  updateRule(ruleId: string, updates: Partial<NotificationRule>) {
    const index = this.rules.findIndex(r => r.id === ruleId);
    if (index !== -1) {
      this.rules[index] = { ...this.rules[index], ...updates };
    }
  }

  getRule(ruleId: string): NotificationRule | undefined {
    return this.rules.find(r => r.id === ruleId);
  }

  getAllRules(): NotificationRule[] {
    return [...this.rules];
  }

  enableRule(ruleId: string) {
    this.updateRule(ruleId, { enabled: true });
  }

  disableRule(ruleId: string) {
    this.updateRule(ruleId, { enabled: false });
  }
}

export const advancedNotificationService = AdvancedNotificationService.getInstance();