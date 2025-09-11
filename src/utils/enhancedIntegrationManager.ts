import { storage } from './storage';
import { installmentsManager } from './installmentsManager';
import { checksManager } from './checksManager';
import { cashFlowManager } from './cashFlowManager';

export interface IntegrationAlert {
  id: string;
  type: 'overdue_installment' | 'overdue_check' | 'low_stock' | 'high_value_customer' | 'debt_limit';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  customerId?: string;
  amount?: number;
  dueDate?: string;
  createdAt: string;
  isRead: boolean;
}

export interface CustomerDebtInfo {
  customerId: string;
  customerName: string;
  totalDebt: number;
  overdueAmount: number;
  creditLimit: number;
  lastPaymentDate?: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface SystemIntegrationMetrics {
  totalCustomers: number;
  activeInstallments: number;
  pendingChecks: number;
  overdueCustomers: number;
  totalDebtAmount: number;
  averageCustomerValue: number;
  loyaltyPointsIssued: number;
  paymentReliabilityAvg: number;
}

class EnhancedIntegrationManager {
  private static instance: EnhancedIntegrationManager;

  static getInstance(): EnhancedIntegrationManager {
    if (!EnhancedIntegrationManager.instance) {
      EnhancedIntegrationManager.instance = new EnhancedIntegrationManager();
    }
    return EnhancedIntegrationManager.instance;
  }

  // تحديث بيانات العميل عند إتمام بيع
  updateCustomerOnSale(customerId: string, saleData: {
    amount: number;
    invoiceId: string;
    date: string;
    items: any[];
  }): void {
    try {
      const customers = storage.getItem('customers', []);
      const customerIndex = customers.findIndex((c: any) => c.id.toString() === customerId);
      
      if (customerIndex !== -1) {
        const customer = customers[customerIndex];
        
        // تحديث إحصائيات العميل
        customer.totalOrders = (customer.totalOrders || 0) + 1;
        customer.totalSpent = (customer.totalSpent || 0) + saleData.amount;
        customer.lastOrderDate = saleData.date;
        customer.lastPurchaseDate = saleData.date;
        
        // حساب نقاط الولاء (1 نقطة لكل 100 جنيه)
        const newLoyaltyPoints = Math.floor(saleData.amount / 100);
        customer.loyaltyPoints = (customer.loyaltyPoints || 0) + newLoyaltyPoints;
        
        // تحديث متوسط قيمة الطلب
        customer.averageOrderValue = customer.totalSpent / customer.totalOrders;
        
        // تحديث رتبة العميل
        customer.customerRank = this.calculateCustomerRank(customer.totalSpent, customer.totalOrders);
        
        // إضافة السجل للتاريخ
        if (!customer.purchaseHistory) customer.purchaseHistory = [];
        customer.purchaseHistory.unshift({
          invoiceId: saleData.invoiceId,
          amount: saleData.amount,
          date: saleData.date,
          items: saleData.items.length,
          loyaltyPointsEarned: newLoyaltyPoints
        });
        
        // الاحتفاظ بآخر 50 عملية شراء فقط
        if (customer.purchaseHistory.length > 50) {
          customer.purchaseHistory = customer.purchaseHistory.slice(0, 50);
        }
        
        customers[customerIndex] = customer;
        storage.setItem('customers', customers);
        
        // إنشاء تنبيه للعملاء المهمين
        if (saleData.amount > 10000) {
          this.createAlert({
            type: 'high_value_customer',
            title: 'عملية شراء عالية القيمة',
            message: `العميل ${customer.name} قام بعملية شراء بقيمة ${saleData.amount.toLocaleString()} ج.م`,
            severity: 'medium',
            customerId: customerId,
            amount: saleData.amount
          });
        }
      }
    } catch (error) {
      console.error('خطأ في تحديث بيانات العميل:', error);
    }
  }

  // ربط الشيك بالعميل أو المورد
  linkCheckToEntity(checkId: string, entityData: {
    entityId: string;
    entityType: 'customer' | 'supplier';
    entityName: string;
  }): boolean {
    try {
      const checks = storage.getItem('checks', []);
      const checkIndex = checks.findIndex((c: any) => c.id === checkId);
      
      if (checkIndex === -1) return false;
      
      const check = checks[checkIndex];
      check.entityId = entityData.entityId;
      check.entityType = entityData.entityType;
      check.entityName = entityData.entityName;
      
      // ربط العميل أو المورد
      if (entityData.entityType === 'customer') {
        check.customerId = entityData.entityId;
        check.customerName = entityData.entityName;
      } else {
        check.supplierId = entityData.entityId;
        check.supplierName = entityData.entityName;
      }
      
      checks[checkIndex] = check;
      storage.setItem('checks', checks);
      
      // تحديث سجل العميل/المورد
      this.updateEntityCheckRecord(entityData.entityId, entityData.entityType, check);
      
      return true;
    } catch (error) {
      console.error('خطأ في ربط الشيك:', error);
      return false;
    }
  }

  // ربط القسط بالعميل
  linkInstallmentToCustomer(installmentId: string, customerId: string): boolean {
    try {
      const installments = storage.getItem('installments', []);
      const installmentIndex = installments.findIndex((i: any) => i.id === installmentId);
      
      if (installmentIndex === -1) return false;
      
      const installment = installments[installmentIndex];
      installment.customerId = customerId;
      
      installments[installmentIndex] = installment;
      storage.setItem('installments', installments);
      
      // تحديث سجل العميل
      const customers = storage.getItem('customers', []);
      const customerIndex = customers.findIndex((c: any) => c.id.toString() === customerId);
      
      if (customerIndex !== -1) {
        const customer = customers[customerIndex];
        customer.hasInstallments = true;
        customer.totalInstallments = (customer.totalInstallments || 0) + 1;
        customer.installmentAmount = (customer.installmentAmount || 0) + installment.totalAmount;
        
        customers[customerIndex] = customer;
        storage.setItem('customers', customers);
      }
      
      return true;
    } catch (error) {
      console.error('خطأ في ربط القسط بالعميل:', error);
      return false;
    }
  }

  // إنشاء تنبيهات ذكية
  async generateSmartAlerts(): Promise<IntegrationAlert[]> {
    const alerts: IntegrationAlert[] = [];
    
    // تنبيهات الأقساط المتأخرة
    const overdueInstallments = await installmentsManager.getOverdueInstallments();
    overdueInstallments.forEach(installment => {
      alerts.push({
        id: `overdue_inst_${installment.id}`,
        type: 'overdue_installment',
        title: 'قسط متأخر',
        message: `العميل ${installment.customer_name} لديه قسط متأخر بقيمة ${installment.remaining_amount.toLocaleString()} ج.م`,
        severity: 'high',
        customerId: installment.customer_id,
        amount: installment.remaining_amount,
        dueDate: installment.due_date,
        createdAt: new Date().toISOString(),
        isRead: false
      });
    });
    
    // تنبيهات الشيكات المتأخرة
    const overdueChecks = checksManager.getOverdueChecks();
    overdueChecks.forEach(check => {
      alerts.push({
        id: `overdue_check_${check.id}`,
        type: 'overdue_check',
        title: 'شيك متأخر',
        message: `الشيك رقم ${check.checkNumber} من ${check.customerName} متأخر عن الاستحقاق`,
        severity: 'high',
        customerId: check.customerId,
        amount: check.amount,
        dueDate: check.dueDate,
        createdAt: new Date().toISOString(),
        isRead: false
      });
    });
    
    // تنبيهات الحد الائتماني
    const customers = storage.getItem('customers', []);
    for (const customer of customers) {
      const debtInfo = await this.getCustomerDebtInfo(customer.id.toString());
      if (debtInfo && debtInfo.totalDebt > debtInfo.creditLimit * 0.8) {
        alerts.push({
          id: `debt_limit_${customer.id}`,
          type: 'debt_limit',
          title: 'اقتراب من الحد الائتماني',
          message: `العميل ${customer.name} اقترب من حده الائتماني`,
          severity: 'medium',
          customerId: customer.id.toString(),
          amount: debtInfo.totalDebt,
          createdAt: new Date().toISOString(),
          isRead: false
        });
      }
    }
    
    return alerts;
  }

  // الحصول على معلومات مديونية العميل
  async getCustomerDebtInfo(customerId: string): Promise<CustomerDebtInfo | null> {
    try {
      const customers = storage.getItem('customers', []);
      const customer = customers.find((c: any) => c.id.toString() === customerId);
      
      if (!customer) return null;
      
      const customerInstallments = await installmentsManager.getInstallmentsByCustomer(customerId);
      const overdueInstallments = customerInstallments.filter(i => i.status === 'overdue');
      const overdueAmount = overdueInstallments.reduce((sum, i) => sum + i.remaining_amount, 0);
      const totalDebt = customerInstallments.reduce((sum, i) => sum + i.remaining_amount, 0);
      
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      const creditLimit = parseFloat(customer.debtLimit || '0');
      
      if (overdueAmount > 0) riskLevel = 'high';
      else if (totalDebt > creditLimit * 0.8) riskLevel = 'medium';
      
      return {
        customerId,
        customerName: customer.name,
        totalDebt,
        overdueAmount,
        creditLimit,
        lastPaymentDate: customer.lastPaymentDate,
        riskLevel
      };
    } catch (error) {
      console.error('خطأ في الحصول على معلومات المديونية:', error);
      return null;
    }
  }

  // إحصائيات التكامل الشاملة
  async getSystemIntegrationMetrics(): Promise<SystemIntegrationMetrics> {
    try {
      const customers = storage.getItem('customers', []);
      const installments = await installmentsManager.getInstallments();
      const checks = checksManager.getChecks();
      
      const activeInstallments = installments.filter(i => i.status === 'active').length;
      const pendingChecks = checks.filter(c => c.status === 'pending').length;
      const overdueCustomersPromises = customers.map(async (c: any) => {
        const debtInfo = await this.getCustomerDebtInfo(c.id.toString());
        return debtInfo && debtInfo.overdueAmount > 0;
      });
      const overdueCustomersResults = await Promise.all(overdueCustomersPromises);
      const overdueCustomers = overdueCustomersResults.filter(Boolean).length;
      
      const debtPromises = customers.map(async (c: any) => {
        const debtInfo = await this.getCustomerDebtInfo(c.id.toString());
        return debtInfo ? debtInfo.totalDebt : 0;
      });
      const debtAmounts = await Promise.all(debtPromises);
      const totalDebtAmount = debtAmounts.reduce((sum, amount) => sum + amount, 0);
      
      const totalCustomerValue = customers.reduce((sum: number, c: any) => sum + (c.totalSpent || 0), 0);
      const averageCustomerValue = customers.length > 0 ? totalCustomerValue / customers.length : 0;
      
      const loyaltyPointsIssued = customers.reduce((sum: number, c: any) => sum + (c.loyaltyPoints || 0), 0);
      
      const reliabilityScores = customers.map((c: any) => c.paymentReliability || 100);
      const paymentReliabilityAvg = reliabilityScores.length > 0 
        ? reliabilityScores.reduce((sum, score) => sum + score, 0) / reliabilityScores.length 
        : 100;
      
      return {
        totalCustomers: customers.length,
        activeInstallments,
        pendingChecks,
        overdueCustomers,
        totalDebtAmount,
        averageCustomerValue,
        loyaltyPointsIssued,
        paymentReliabilityAvg
      };
    } catch (error) {
      console.error('خطأ في حساب إحصائيات التكامل:', error);
      return {
        totalCustomers: 0,
        activeInstallments: 0,
        pendingChecks: 0,
        overdueCustomers: 0,
        totalDebtAmount: 0,
        averageCustomerValue: 0,
        loyaltyPointsIssued: 0,
        paymentReliabilityAvg: 100
      };
    }
  }

  // إنشاء تنبيه
  private createAlert(alertData: Omit<IntegrationAlert, 'id' | 'createdAt' | 'isRead'>): void {
    try {
      const alerts = storage.getItem('integration_alerts', []);
      const newAlert: IntegrationAlert = {
        ...alertData,
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        createdAt: new Date().toISOString(),
        isRead: false
      };
      
      alerts.unshift(newAlert);
      
      // الاحتفاظ بآخر 100 تنبيه فقط
      if (alerts.length > 100) {
        alerts.splice(100);
      }
      
      storage.setItem('integration_alerts', alerts);
    } catch (error) {
      console.error('خطأ في إنشاء التنبيه:', error);
    }
  }

  // تحديث سجل الشيكات للعميل/المورد
  private updateEntityCheckRecord(entityId: string, entityType: 'customer' | 'supplier', check: any): void {
    try {
      const storageKey = entityType === 'customer' ? 'customers' : 'suppliers';
      const entities = storage.getItem(storageKey, []);
      const entityIndex = entities.findIndex((e: any) => e.id.toString() === entityId);
      
      if (entityIndex !== -1) {
        const entity = entities[entityIndex];
        
        entity.totalChecks = (entity.totalChecks || 0) + 1;
        entity.checksAmount = (entity.checksAmount || 0) + check.amount;
        entity.lastCheckDate = check.dateReceived;
        
        if (!entity.checkHistory) entity.checkHistory = [];
        entity.checkHistory.unshift({
          checkId: check.id,
          checkNumber: check.checkNumber,
          amount: check.amount,
          bankName: check.bankName,
          dueDate: check.dueDate,
          status: check.status,
          dateReceived: check.dateReceived
        });
        
        // الاحتفاظ بآخر 50 شيك فقط
        if (entity.checkHistory.length > 50) {
          entity.checkHistory = entity.checkHistory.slice(0, 50);
        }
        
        entities[entityIndex] = entity;
        storage.setItem(storageKey, entities);
      }
    } catch (error) {
      console.error('خطأ في تحديث سجل الشيكات:', error);
    }
  }

  // حساب رتبة العميل
  private calculateCustomerRank(totalSpent: number, totalOrders: number): string {
    if (totalSpent > 100000) return 'premium';
    if (totalSpent > 50000) return 'vip';
    if (totalOrders > 5) return 'regular';
    return 'new';
  }
}

export const enhancedIntegrationManager = EnhancedIntegrationManager.getInstance();