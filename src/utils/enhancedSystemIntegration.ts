import { storage } from './storage';
import { logger } from './logger';
import { cashFlowManager } from './cashFlowManager';

// واجهات للبيانات المترابطة
export interface EnhancedCustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  totalPurchases: number;
  totalInstallments: number;
  pendingInstallments: number;
  totalChecks: number;
  pendingChecks: number;
  lastPurchaseDate?: string;
  creditLimit: number;
  currentBalance: number;
  loyaltyPoints: number;
  createdAt: string;
}

export interface EnhancedSupplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  totalPurchases: number;
  totalPayments: number;
  pendingPayments: number;
  averageDeliveryTime: number;
  qualityRating: number;
  lastOrderDate?: string;
  createdAt: string;
}

export interface CustomerInstallment {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  invoiceId?: string;
  createdAt: string;
}

export interface CustomerCheck {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  bankName: string;
  checkNumber: string;
  dueDate: string;
  status: 'pending' | 'cleared' | 'bounced';
  dateReceived: string;
  clearedDate?: string;
}

export interface UnifiedReport {
  period: {
    start: string;
    end: string;
  };
  sales: {
    totalRevenue: number;
    totalInvoices: number;
    averageOrderValue: number;
    topCustomers: Array<{
      customerId: string;
      customerName: string;
      totalPurchases: number;
      totalAmount: number;
    }>;
  };
  inventory: {
    totalValue: number;
    lowStockItems: number;
    totalMovements: number;
    topProducts: Array<{
      productId: string;
      productName: string;
      totalSold: number;
      totalRevenue: number;
    }>;
  };
  financial: {
    totalIncome: number;
    totalExpenses: number;
    netProfit: number; 
    profitMargin: number;
    cashFlow: number;
  };
  customers: {
    totalCustomers: number;
    activeCustomers: number;
    newCustomers: number;
    topLoyalCustomers: Array<{
      customerId: string;
      customerName: string;
      loyaltyPoints: number;
      totalPurchases: number;
    }>;
  };
  installments: {
    totalInstallments: number;
    paidInstallments: number;
    overdueInstallments: number;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
  };
  checks: {
    totalChecks: number;
    clearedChecks: number;
    pendingChecks: number;
    bouncedChecks: number;
    totalAmount: number;
  };
}

export interface SmartAlert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  category: 'inventory' | 'financial' | 'customers' | 'sales' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionRequired: boolean;
  actionUrl?: string;
  actionText?: string;
  createdAt: string;
  readAt?: string;
  resolvedAt?: string;
}

export class EnhancedSystemIntegration {
  private static instance: EnhancedSystemIntegration;

  static getInstance(): EnhancedSystemIntegration {
    if (!EnhancedSystemIntegration.instance) {
      EnhancedSystemIntegration.instance = new EnhancedSystemIntegration();
    }
    return EnhancedSystemIntegration.instance;
  }

  // تحديث بيانات العملاء مع الربط المتقدم
  updateCustomerIntegration(): void {
    try {
      const customers = storage.getItem('customers', []);
      const salesInvoices = storage.getItem('sales_invoices', []);
      const installments = storage.getItem('installments', []);
      const checks = storage.getItem('checks', []);

      const enhancedCustomers: EnhancedCustomer[] = customers.map((customer: any) => {
        // حساب إجمالي المشتريات
        const customerInvoices = salesInvoices.filter((inv: any) => inv.customerId === customer.id);
        const totalPurchases = customerInvoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);
        
        // حساب الأقساط
        const customerInstallments = installments.filter((inst: any) => inst.customerId === customer.id);
        const totalInstallments = customerInstallments.reduce((sum: number, inst: any) => sum + (inst.amount || 0), 0);
        const pendingInstallments = customerInstallments
          .filter((inst: any) => inst.status === 'pending')
          .reduce((sum: number, inst: any) => sum + (inst.remainingAmount || inst.amount || 0), 0);

        // حساب الشيكات
        const customerChecks = checks.filter((check: any) => check.customerId === customer.id);
        const totalChecks = customerChecks.reduce((sum: number, check: any) => sum + (check.amount || 0), 0);
        const pendingChecks = customerChecks
          .filter((check: any) => check.status === 'pending')
          .reduce((sum: number, check: any) => sum + (check.amount || 0), 0);

        // حساب نقاط الولاء (1 نقطة لكل 100 وحدة عملة)
        const loyaltyPoints = Math.floor(totalPurchases / 100);

        // آخر تاريخ شراء
        const lastPurchaseDate = customerInvoices.length > 0 
          ? Math.max(...customerInvoices.map((inv: any) => new Date(inv.date).getTime()))
          : null;

        return {
          ...customer,
          totalPurchases,
          totalInstallments,
          pendingInstallments,
          totalChecks,
          pendingChecks,
          lastPurchaseDate: lastPurchaseDate ? new Date(lastPurchaseDate).toISOString() : undefined,
          creditLimit: customer.creditLimit || 10000,
          currentBalance: pendingInstallments + pendingChecks,
          loyaltyPoints
        };
      });

      storage.setItem('enhanced_customers', enhancedCustomers);
      logger.info('تم تحديث بيانات العملاء المحسنة', undefined, 'EnhancedSystemIntegration');
    } catch (error) {
      logger.error('خطأ في تحديث بيانات العملاء:', error, 'EnhancedSystemIntegration');
    }
  }

  // تحديث بيانات الموردين مع الربط المتقدم
  updateSupplierIntegration(): void {
    try {
      const suppliers = storage.getItem('suppliers', []);
      const purchaseInvoices = storage.getItem('purchase_invoices', []);
      const payments = storage.getItem('supplier_payments', []);

      const enhancedSuppliers: EnhancedSupplier[] = suppliers.map((supplier: any) => {
        // حساب إجمالي المشتريات
        const supplierOrders = purchaseInvoices.filter((order: any) => order.supplierId === supplier.id);
        const totalPurchases = supplierOrders.reduce((sum: number, order: any) => sum + (order.total || 0), 0);
        
        // حساب المدفوعات
        const supplierPayments = payments.filter((payment: any) => payment.supplierId === supplier.id);
        const totalPayments = supplierPayments.reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0);
        const pendingPayments = totalPurchases - totalPayments;

        // حساب متوسط وقت التسليم
        const deliveredOrders = supplierOrders.filter((order: any) => order.status === 'received' && order.receivedDate);
        let averageDeliveryTime = 0;
        if (deliveredOrders.length > 0) {
          const totalDeliveryTime = deliveredOrders.reduce((sum: number, order: any) => {
            const orderDate = new Date(order.date).getTime();
            const receivedDate = new Date(order.receivedDate).getTime();
            return sum + (receivedDate - orderDate) / (1000 * 60 * 60 * 24); // بالأيام
          }, 0);
          averageDeliveryTime = totalDeliveryTime / deliveredOrders.length;
        }

        // آخر تاريخ طلب
        const lastOrderDate = supplierOrders.length > 0 
          ? Math.max(...supplierOrders.map((order: any) => new Date(order.date).getTime()))
          : null;

        return {
          ...supplier,
          totalPurchases,
          totalPayments,
          pendingPayments: Math.max(0, pendingPayments),
          averageDeliveryTime: Math.round(averageDeliveryTime),
          qualityRating: supplier.rating || 4.0,
          lastOrderDate: lastOrderDate ? new Date(lastOrderDate).toISOString() : undefined
        };
      });

      storage.setItem('enhanced_suppliers', enhancedSuppliers);
      logger.info('تم تحديث بيانات الموردين المحسنة', undefined, 'EnhancedSystemIntegration');
    } catch (error) {
      logger.error('خطأ في تحديث بيانات الموردين:', error, 'EnhancedSystemIntegration');
    }
  }

  // إنشاء تقرير موحد شامل
  generateUnifiedReport(startDate: string, endDate: string): UnifiedReport {
    try {
      const salesInvoices = storage.getItem('sales_invoices', []);
      const products = storage.getItem('products', []);
      const customers = storage.getItem('enhanced_customers', []);
      const installments = storage.getItem('installments', []);
      const checks = storage.getItem('checks', []);

      // تصفية البيانات حسب الفترة
      const periodInvoices = salesInvoices.filter((inv: any) => {
        const invDate = new Date(inv.date);
        return invDate >= new Date(startDate) && invDate <= new Date(endDate);
      });

      const periodInstallments = installments.filter((inst: any) => {
        const instDate = new Date(inst.dueDate);
        return instDate >= new Date(startDate) && instDate <= new Date(endDate);
      });

      const periodChecks = checks.filter((check: any) => {
        const checkDate = new Date(check.dueDate);
        return checkDate >= new Date(startDate) && checkDate <= new Date(endDate);
      });

      // تحليل المبيعات
      const totalRevenue = periodInvoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);
      const totalInvoices = periodInvoices.length;
      const averageOrderValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;

      // أفضل العملاء
      const customerSales = new Map();
      periodInvoices.forEach((inv: any) => {
        const existing = customerSales.get(inv.customerId) || { 
          customerId: inv.customerId, 
          customerName: inv.customerName, 
          totalPurchases: 0, 
          totalAmount: 0 
        };
        existing.totalPurchases += 1;
        existing.totalAmount += inv.total || 0;
        customerSales.set(inv.customerId, existing);
      });

      const topCustomers = Array.from(customerSales.values())
        .sort((a: any, b: any) => b.totalAmount - a.totalAmount)
        .slice(0, 5);

      // تحليل المخزون
      const totalValue = products.reduce((sum: number, product: any) => 
        sum + ((product.quantity || 0) * (product.cost || 0)), 0);
      const lowStockItems = products.filter((product: any) => 
        (product.quantity || 0) <= (product.minQuantity || 0)).length;

      // أفضل المنتجات
      const productSales = new Map();
      periodInvoices.forEach((inv: any) => {
        inv.items?.forEach((item: any) => {
          const existing = productSales.get(item.productId) || {
            productId: item.productId,
            productName: item.productName,
            totalSold: 0,
            totalRevenue: 0
          };
          existing.totalSold += item.quantity || 0;
          existing.totalRevenue += item.total || 0;
          productSales.set(item.productId, existing);
        });
      });

      const topProducts = Array.from(productSales.values())
        .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
        .slice(0, 5);

      // التحليل المالي
      const cashFlowReport = cashFlowManager.generateCashFlowReport(startDate, endDate);
      const totalIncome = cashFlowReport.summary.totalIncome;
      const totalExpenses = cashFlowReport.summary.totalExpenses;
      const netProfit = totalIncome - totalExpenses;
      const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

      // تحليل العملاء
      const totalCustomers = customers.length;
      const activeCustomers = customers.filter((customer: any) => 
        customer.lastPurchaseDate && 
        new Date(customer.lastPurchaseDate) >= new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      ).length;

      const newCustomers = customers.filter((customer: any) => {
        const createdDate = new Date(customer.createdAt);
        return createdDate >= new Date(startDate) && createdDate <= new Date(endDate);
      }).length;

      const topLoyalCustomers = customers
        .sort((a: any, b: any) => (b.loyaltyPoints || 0) - (a.loyaltyPoints || 0))
        .slice(0, 5)
        .map((customer: any) => ({
          customerId: customer.id,
          customerName: customer.name,
          loyaltyPoints: customer.loyaltyPoints || 0,
          totalPurchases: customer.totalPurchases || 0
        }));

      // تحليل الأقساط
      const totalInstallments = periodInstallments.length;
      const paidInstallments = periodInstallments.filter((inst: any) => inst.status === 'paid').length;
      const overdueInstallments = periodInstallments.filter((inst: any) => 
        inst.status === 'pending' && new Date(inst.dueDate) < new Date()
      ).length;

      const totalInstallmentAmount = periodInstallments.reduce((sum: number, inst: any) => sum + (inst.amount || 0), 0);
      const paidInstallmentAmount = periodInstallments
        .filter((inst: any) => inst.status === 'paid')
        .reduce((sum: number, inst: any) => sum + (inst.paidAmount || inst.amount || 0), 0);
      const remainingInstallmentAmount = totalInstallmentAmount - paidInstallmentAmount;

      // تحليل الشيكات
      const totalChecks = periodChecks.length;
      const clearedChecks = periodChecks.filter((check: any) => check.status === 'cleared').length;
      const pendingChecks = periodChecks.filter((check: any) => check.status === 'pending').length;
      const bouncedChecks = periodChecks.filter((check: any) => check.status === 'bounced').length;
      const totalCheckAmount = periodChecks.reduce((sum: number, check: any) => sum + (check.amount || 0), 0);

      return {
        period: { start: startDate, end: endDate },
        sales: {
          totalRevenue,
          totalInvoices,
          averageOrderValue,
          topCustomers
        },
        inventory: {
          totalValue,
          lowStockItems,
          totalMovements: periodInvoices.reduce((sum: number, inv: any) => 
            sum + (inv.items?.reduce((itemSum: number, item: any) => itemSum + (item.quantity || 0), 0) || 0), 0),
          topProducts
        },
        financial: {
          totalIncome,
          totalExpenses,
          netProfit,
          profitMargin,
          cashFlow: cashFlowReport.summary.netCashFlow
        },
        customers: {
          totalCustomers,
          activeCustomers,
          newCustomers,
          topLoyalCustomers
        },
        installments: {
          totalInstallments,
          paidInstallments,
          overdueInstallments,
          totalAmount: totalInstallmentAmount,
          paidAmount: paidInstallmentAmount,
          remainingAmount: remainingInstallmentAmount
        },
        checks: {
          totalChecks,
          clearedChecks,
          pendingChecks,
          bouncedChecks,
          totalAmount: totalCheckAmount
        }
      };
    } catch (error) {
      logger.error('خطأ في إنشاء التقرير الموحد:', error, 'EnhancedSystemIntegration');
      throw error;
    }
  }

  // إنشاء تنبيهات ذكية
  generateSmartAlerts(): SmartAlert[] {
    const alerts: SmartAlert[] = [];
    const now = new Date();

    try {
      // تنبيهات المخزون
      const products = storage.getItem('products', []);
      const lowStockProducts = products.filter((product: any) => 
        (product.quantity || 0) <= (product.minQuantity || 0)
      );

      if (lowStockProducts.length > 0) {
        alerts.push({
          id: `low-stock-${Date.now()}`,
          type: 'warning',
          category: 'inventory',
          title: 'مخزون منخفض',
          message: `يوجد ${lowStockProducts.length} منتج بمخزون منخفض يحتاج إعادة تموين`,
          priority: 'high',
          actionRequired: true,
          actionUrl: '/inventory/stock',
          actionText: 'عرض المنتجات',
          createdAt: now.toISOString()
        });
      }

      // تنبيهات الأقساط المستحقة
      const installments = storage.getItem('installments', []);
      const overdueInstallments = installments.filter((inst: any) => 
        inst.status === 'pending' && new Date(inst.dueDate) < now
      );

      if (overdueInstallments.length > 0) {
        const totalOverdue = overdueInstallments.reduce((sum: number, inst: any) => 
          sum + (inst.remainingAmount || inst.amount || 0), 0);
        
        alerts.push({
          id: `overdue-installments-${Date.now()}`,
          type: 'error',
          category: 'financial',
          title: 'أقساط متأخرة',
          message: `يوجد ${overdueInstallments.length} قسط متأخر بقيمة ${totalOverdue.toLocaleString()} ر.س`,
          priority: 'critical',
          actionRequired: true,
          actionUrl: '/installments',
          actionText: 'متابعة الأقساط',
          createdAt: now.toISOString()
        });
      }

      // تنبيهات الشيكات المستحقة
      const checks = storage.getItem('checks', []);
      const dueChecks = checks.filter((check: any) => {
        const dueDate = new Date(check.dueDate);
        const daysDiff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return check.status === 'pending' && daysDiff <= 3 && daysDiff >= 0;
      });

      if (dueChecks.length > 0) {
        alerts.push({
          id: `due-checks-${Date.now()}`,
          type: 'warning',
          category: 'financial',
          title: 'شيكات مستحقة قريباً',
          message: `يوجد ${dueChecks.length} شيك يستحق خلال 3 أيام`,
          priority: 'medium',
          actionRequired: true,
          actionUrl: '/checks',
          actionText: 'عرض الشيكات',
          createdAt: now.toISOString()
        });
      }

      // تنبيهات العملاء غير النشطين
      const customers = storage.getItem('enhanced_customers', []);
      const inactiveCustomers = customers.filter((customer: any) => {
        if (!customer.lastPurchaseDate) return true;
        const lastPurchase = new Date(customer.lastPurchaseDate);
        const daysSinceLastPurchase = Math.ceil((now.getTime() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceLastPurchase > 90; // أكثر من 90 يوم
      });

      if (inactiveCustomers.length > 10) {
        alerts.push({
          id: `inactive-customers-${Date.now()}`,
          type: 'info',
          category: 'customers',
          title: 'عملاء غير نشطين',
          message: `يوجد ${inactiveCustomers.length} عميل لم يقم بشراء خلال آخر 90 يوم`,
          priority: 'low',
          actionRequired: false,
          actionUrl: '/sales/customers',
          actionText: 'عرض العملاء',
          createdAt: now.toISOString()
        });
      }

      // تنبيهات الأداء المالي
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const cashFlowReport = cashFlowManager.generateCashFlowReport(
        thirtyDaysAgo.toISOString(), 
        now.toISOString()
      );

      if (cashFlowReport.summary.netCashFlow < 0) {
        alerts.push({
          id: `negative-cashflow-${Date.now()}`,
          type: 'error',
          category: 'financial',
          title: 'تدفق نقدي سالب',
          message: `التدفق النقدي لآخر 30 يوم سالب: ${cashFlowReport.summary.netCashFlow.toLocaleString()} ر.س`,
          priority: 'high',
          actionRequired: true,
          actionUrl: '/cash-register',
          actionText: 'مراجعة التدفق النقدي',
          createdAt: now.toISOString()
        });
      }

      // حفظ التنبيهات
      const existingAlerts = storage.getItem('smart_alerts', []);
      const allAlerts = [...existingAlerts, ...alerts];
      
      // الاحتفاظ بآخر 50 تنبيه فقط
      const recentAlerts = allAlerts
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 50);
      
      storage.setItem('smart_alerts', recentAlerts);

      logger.info(`تم إنشاء ${alerts.length} تنبيه ذكي`, undefined, 'EnhancedSystemIntegration');
      return alerts;

    } catch (error) {
      logger.error('خطأ في إنشاء التنبيهات الذكية:', error, 'EnhancedSystemIntegration');
      return [];
    }
  }

  // الحصول على التنبيهات غير المقروءة
  getUnreadAlerts(): SmartAlert[] {
    const alerts = storage.getItem('smart_alerts', []);
    return alerts.filter((alert: SmartAlert) => !alert.readAt);
  }

  // تعليم التنبيه كمقروء
  markAlertAsRead(alertId: string): void {
    const alerts = storage.getItem('smart_alerts', []);
    const updatedAlerts = alerts.map((alert: SmartAlert) => 
      alert.id === alertId 
        ? { ...alert, readAt: new Date().toISOString() }
        : alert
    );
    storage.setItem('smart_alerts', updatedAlerts);
  }

  // حل التنبيه
  resolveAlert(alertId: string): void {
    const alerts = storage.getItem('smart_alerts', []);
    const updatedAlerts = alerts.map((alert: SmartAlert) => 
      alert.id === alertId 
        ? { ...alert, resolvedAt: new Date().toISOString() }
        : alert
    );
    storage.setItem('smart_alerts', updatedAlerts);
  }

  // تحديث جميع الترابطات
  updateAllIntegrations(): void {
    this.updateCustomerIntegration();
    this.updateSupplierIntegration();
    this.generateSmartAlerts();
    
    // تحديث آخر وقت للترابط
    storage.setItem('last_integration_update', new Date().toISOString());
    
    logger.info('تم تحديث جميع ترابطات النظام', undefined, 'EnhancedSystemIntegration');
  }

  // الحصول على إحصائيات الترابط
  getIntegrationStats(): any {
    const customers = storage.getItem('enhanced_customers', []);
    const suppliers = storage.getItem('enhanced_suppliers', []);
    const alerts = storage.getItem('smart_alerts', []);
    const lastUpdate = storage.getItem('last_integration_update', null);

    return {
      totalCustomers: customers.length,
      totalSuppliers: suppliers.length,
      activeAlerts: alerts.filter((alert: SmartAlert) => !alert.resolvedAt).length,
      lastUpdate,
      integrationLevel: this.calculateIntegrationLevel()
    };
  }

  // حساب مستوى الترابط
  private calculateIntegrationLevel(): number {
    try {
      const customers = storage.getItem('enhanced_customers', []);
      const suppliers = storage.getItem('enhanced_suppliers', []);
      const salesInvoices = storage.getItem('sales_invoices', []);
      const installments = storage.getItem('installments', []);
      const checks = storage.getItem('checks', []);

      let score = 0;
      const maxScore = 100;

      // العملاء المربوطون بالفواتير (20 نقطة)
      const customersWithSales = customers.filter((customer: any) => customer.totalPurchases > 0).length;
      score += Math.min(20, (customersWithSales / Math.max(customers.length, 1)) * 20);

      // الفواتير المربوطة بالمخزون (20 نقطة)
      const invoicesWithItems = salesInvoices.filter((inv: any) => inv.items && inv.items.length > 0).length;
      score += Math.min(20, (invoicesWithItems / Math.max(salesInvoices.length, 1)) * 20);

      // الأقساط المربوطة بالعملاء (20 نقطة)
      const installmentsWithCustomers = installments.filter((inst: any) => inst.customerId).length;
      score += Math.min(20, (installmentsWithCustomers / Math.max(installments.length, 1)) * 20);

      // الشيكات المربوطة بالعملاء (20 نقطة)
      const checksWithCustomers = checks.filter((check: any) => check.customerId).length;
      score += Math.min(20, (checksWithCustomers / Math.max(checks.length, 1)) * 20);

      // التدفق النقدي مربوط (20 نقطة)
      const cashFlowTransactions = cashFlowManager.getTransactions().length;
      score += Math.min(20, cashFlowTransactions > 0 ? 20 : 0);

      return Math.round(score);
    } catch (error) {
      logger.error('خطأ في حساب مستوى الترابط:', error, 'EnhancedSystemIntegration');
      return 0;
    }
  }
}

export const enhancedSystemIntegration = EnhancedSystemIntegration.getInstance();