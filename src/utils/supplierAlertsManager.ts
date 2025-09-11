import { storage } from './storage';

export interface SupplierAlert {
  id: string;
  supplierId: string;
  supplierName: string;
  type: 'debt' | 'rating' | 'contract' | 'payment' | 'delivery' | 'quality' | 'risk';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  actionRequired: boolean;
  isRead: boolean;
  createdAt: string;
  expiresAt?: string;
  data?: any;
}

export interface AlertRule {
  id: string;
  name: string;
  type: SupplierAlert['type'];
  condition: string;
  threshold: number;
  enabled: boolean;
  createdAt: string;
}

export class SupplierAlertsManager {
  private static instance: SupplierAlertsManager;

  static getInstance(): SupplierAlertsManager {
    if (!SupplierAlertsManager.instance) {
      SupplierAlertsManager.instance = new SupplierAlertsManager();
    }
    return SupplierAlertsManager.instance;
  }

  // الحصول على جميع التنبيهات
  getAllAlerts(): SupplierAlert[] {
    return storage.getItem('supplier_alerts', []);
  }

  // إضافة تنبيه جديد
  addAlert(alert: Omit<SupplierAlert, 'id' | 'createdAt' | 'isRead'>): SupplierAlert {
    const newAlert: SupplierAlert = {
      ...alert,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      isRead: false
    };

    const alerts = this.getAllAlerts();
    alerts.unshift(newAlert);
    storage.setItem('supplier_alerts', alerts);
    
    return newAlert;
  }

  // وضع علامة قراءة على التنبيه
  markAsRead(alertId: string): void {
    const alerts = this.getAllAlerts();
    const alertIndex = alerts.findIndex(alert => alert.id === alertId);
    
    if (alertIndex !== -1) {
      alerts[alertIndex].isRead = true;
      storage.setItem('supplier_alerts', alerts);
    }
  }

  // حذف تنبيه
  deleteAlert(alertId: string): void {
    const alerts = this.getAllAlerts();
    const filteredAlerts = alerts.filter(alert => alert.id !== alertId);
    storage.setItem('supplier_alerts', filteredAlerts);
  }

  // حذف جميع التنبيهات المقروءة
  clearReadAlerts(): void {
    const alerts = this.getAllAlerts();
    const unreadAlerts = alerts.filter(alert => !alert.isRead);
    storage.setItem('supplier_alerts', unreadAlerts);
  }

  // تحديث التنبيهات للمورد المحدد
  updateSupplierAlerts(supplierId: string): void {
    const suppliers = storage.getItem('suppliers', []);
    const supplier = suppliers.find((s: any) => s.id === supplierId);
    
    if (!supplier) return;

    this.checkDebtAlerts(supplier);
    this.checkRatingAlerts(supplier);
    this.checkPaymentAlerts(supplier);
    this.checkDeliveryAlerts(supplier);
    this.checkRiskAlerts(supplier);
  }

  // فحص تنبيهات المديونية
  private checkDebtAlerts(supplier: any): void {
    const debt = supplier.totalDebt || 0;
    const creditLimit = supplier.creditLimit || 0;
    
    if (debt > creditLimit * 0.9 && creditLimit > 0) {
      this.addAlert({
        supplierId: supplier.id,
        supplierName: supplier.name,
        type: 'debt',
        severity: debt > creditLimit ? 'critical' : 'high',
        title: 'تجاوز الحد الائتماني',
        message: `المورد ${supplier.name} تجاوز ${((debt / creditLimit) * 100).toFixed(1)}% من الحد الائتماني`,
        actionRequired: true,
        data: { debt, creditLimit, percentage: (debt / creditLimit) * 100 }
      });
    }

    if (debt > 50000) {
      this.addAlert({
        supplierId: supplier.id,
        supplierName: supplier.name,
        type: 'debt',
        severity: debt > 100000 ? 'high' : 'medium',
        title: 'مديونية مرتفعة',
        message: `المورد ${supplier.name} لديه مديونية ${debt.toLocaleString()} ج.م`,
        actionRequired: true,
        data: { debt }
      });
    }
  }

  // فحص تنبيهات التقييم
  private checkRatingAlerts(supplier: any): void {
    const rating = supplier.rating || 0;
    
    if (rating < 2.5) {
      this.addAlert({
        supplierId: supplier.id,
        supplierName: supplier.name,
        type: 'rating',
        severity: rating < 2 ? 'high' : 'medium',
        title: 'تقييم منخفض',
        message: `المورد ${supplier.name} حصل على تقييم ${rating.toFixed(1)} نجوم`,
        actionRequired: true,
        data: { rating }
      });
    }
  }

  // فحص تنبيهات الدفع
  private checkPaymentAlerts(supplier: any): void {
    const lastPurchaseDate = supplier.lastPurchaseDate;
    if (!lastPurchaseDate) return;

    const daysSinceLastPurchase = Math.floor(
      (new Date().getTime() - new Date(lastPurchaseDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    // تحديد شروط الدفع
    const paymentTerms = supplier.paymentTerms || '';
    const termsDays = this.extractDaysFromPaymentTerms(paymentTerms);
    
    if (termsDays > 0 && daysSinceLastPurchase > termsDays + 7) {
      this.addAlert({
        supplierId: supplier.id,
        supplierName: supplier.name,
        type: 'payment',
        severity: daysSinceLastPurchase > termsDays + 30 ? 'high' : 'medium',
        title: 'تأخير في الدفع',
        message: `تأخير ${daysSinceLastPurchase - termsDays} يوم عن موعد الدفع المتفق عليه`,
        actionRequired: true,
        data: { daysSinceLastPurchase, termsDays, overdue: daysSinceLastPurchase - termsDays }
      });
    }
  }

  // فحص تنبيهات التسليم
  private checkDeliveryAlerts(supplier: any): void {
    const onTimeRate = supplier.onTimeDeliveryRate || 100;
    const avgDeliveryDays = supplier.avgDeliveryDays || 0;
    
    if (onTimeRate < 70) {
      this.addAlert({
        supplierId: supplier.id,
        supplierName: supplier.name,
        type: 'delivery',
        severity: onTimeRate < 50 ? 'high' : 'medium',
        title: 'تأخير في التسليم',
        message: `معدل التسليم في الوقت المحدد ${onTimeRate.toFixed(1)}% فقط`,
        actionRequired: true,
        data: { onTimeRate, avgDeliveryDays }
      });
    }
  }

  // فحص تنبيهات المخاطر
  private checkRiskAlerts(supplier: any): void {
    if (supplier.riskLevel === 'high') {
      this.addAlert({
        supplierId: supplier.id,
        supplierName: supplier.name,
        type: 'risk',
        severity: 'high',
        title: 'مورد عالي المخاطر',
        message: `المورد ${supplier.name} مصنف كمورد عالي المخاطر`,
        actionRequired: true,
        data: { riskLevel: supplier.riskLevel }
      });
    }
  }

  // استخراج عدد الأيام من شروط الدفع
  private extractDaysFromPaymentTerms(paymentTerms: string): number {
    const match = paymentTerms.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  // الحصول على التنبيهات غير المقروءة
  getUnreadAlerts(): SupplierAlert[] {
    return this.getAllAlerts().filter(alert => !alert.isRead);
  }

  // الحصول على التنبيهات حسب مستوى الخطورة
  getAlertsBySeverity(severity: SupplierAlert['severity']): SupplierAlert[] {
    return this.getAllAlerts().filter(alert => alert.severity === severity);
  }

  // الحصول على التنبيهات حسب النوع
  getAlertsByType(type: SupplierAlert['type']): SupplierAlert[] {
    return this.getAllAlerts().filter(alert => alert.type === type);
  }

  // الحصول على تنبيهات مورد محدد
  getSupplierAlerts(supplierId: string): SupplierAlert[] {
    return this.getAllAlerts().filter(alert => alert.supplierId === supplierId);
  }

  // تحديث تنبيهات جميع الموردين
  updateAllSupplierAlerts(): void {
    const suppliers = storage.getItem('suppliers', []);
    suppliers.forEach((supplier: any) => {
      this.updateSupplierAlerts(supplier.id);
    });
  }

  // حذف التنبيهات المنتهية الصلاحية
  cleanupExpiredAlerts(): void {
    const alerts = this.getAllAlerts();
    const now = new Date().toISOString();
    const validAlerts = alerts.filter(alert => !alert.expiresAt || alert.expiresAt > now);
    storage.setItem('supplier_alerts', validAlerts);
  }

  // إحصائيات التنبيهات
  getAlertStats() {
    const alerts = this.getAllAlerts();
    const unread = alerts.filter(a => !a.isRead).length;
    const critical = alerts.filter(a => a.severity === 'critical').length;
    const high = alerts.filter(a => a.severity === 'high').length;
    const actionRequired = alerts.filter(a => a.actionRequired && !a.isRead).length;

    return {
      total: alerts.length,
      unread,
      critical,
      high,
      actionRequired,
      byType: {
        debt: alerts.filter(a => a.type === 'debt').length,
        rating: alerts.filter(a => a.type === 'rating').length,
        payment: alerts.filter(a => a.type === 'payment').length,
        delivery: alerts.filter(a => a.type === 'delivery').length,
        risk: alerts.filter(a => a.type === 'risk').length,
        contract: alerts.filter(a => a.type === 'contract').length,
        quality: alerts.filter(a => a.type === 'quality').length
      }
    };
  }
}

export const supplierAlertsManager = SupplierAlertsManager.getInstance();