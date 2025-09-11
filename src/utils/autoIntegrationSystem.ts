import { storage } from './storage';
import { customerIntegrationManager } from './customerIntegrationManager';
import { checksManager } from './checksManager';
import { installmentsManager } from './installmentsManager';

export class AutoIntegrationSystem {
  private static instance: AutoIntegrationSystem;

  static getInstance(): AutoIntegrationSystem {
    if (!AutoIntegrationSystem.instance) {
      AutoIntegrationSystem.instance = new AutoIntegrationSystem();
    }
    return AutoIntegrationSystem.instance;
  }

  // تهيئة النظام وتطبيق كل الروابط التلقائية
  async initializeSystemIntegration(): Promise<void> {
    try {
      console.log('🚀 بدء تهيئة النظام وتطبيق الترابط التلقائي...');

      // تطبيق جميع التحسينات بشكل تلقائي
      await Promise.all([
        this.syncAllCustomerData(),
        this.linkAllChecksAutomatically(),
        this.linkAllInstallmentsAutomatically(),
        this.syncAllPaymentMethods(),
        this.implementLoyaltySystem(),
        this.enhanceSupplierData(),
        this.createDataIndexes()
      ]);

      console.log('✅ تم تطبيق الترابط التلقائي بنجاح!');
      
      // حفظ طابع زمني للتهيئة
      storage.setItem('system_integration_initialized', {
        timestamp: new Date().toISOString(),
        version: '2.0',
        integrationLevel: this.calculateIntegrationLevel()
      });

    } catch (error) {
      console.error('خطأ في تهيئة النظام:', error);
    }
  }

  // مزامنة جميع بيانات العملاء
  private async syncAllCustomerData(): Promise<void> {
    try {
      const customers = storage.getItem('customers', []);
      const salesInvoices = storage.getItem('sales_invoices', []);

      customers.forEach((customer: any) => {
        // البحث عن فواتير العميل
        const customerInvoices = salesInvoices.filter((invoice: any) => 
          invoice.customerId?.toString() === customer.id?.toString() ||
          invoice.customerName === customer.name
        );

        if (customerInvoices.length > 0) {
          // تحديث إحصائيات العميل
          customer.totalOrders = customerInvoices.length;
          customer.totalSpent = customerInvoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);
          customer.averageOrderValue = customer.totalSpent / customer.totalOrders;
          customer.loyaltyPoints = Math.floor(customer.totalSpent);
          
          // آخر عملية شراء
          const sortedInvoices = customerInvoices.sort((a: any, b: any) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          customer.lastPurchaseDate = sortedInvoices[0].date;

          // ربط الفواتير بالعميل
          customerInvoices.forEach((invoice: any) => {
            if (!invoice.customerId) {
              invoice.customerId = customer.id;
              invoice.linkedToCustomer = true;
            }
          });
        }

        // تصنيف العميل
        customer.classification = this.classifyCustomer(customer);
        
        // حالة العميل
        customer.status = this.calculateCustomerStatus(customer);
      });

      storage.setItem('customers', customers);
      storage.setItem('sales_invoices', salesInvoices);
      
      console.log(`✅ تم مزامنة بيانات ${customers.length} عميل`);
    } catch (error) {
      console.error('خطأ في مزامنة بيانات العملاء:', error);
    }
  }

  // ربط جميع الشيكات تلقائياً
  private async linkAllChecksAutomatically(): Promise<void> {
    try {
      const checks = storage.getItem('checks', []);
      const customers = storage.getItem('customers', []);
      const suppliers = storage.getItem('suppliers', []);
      
      let linkedCount = 0;

      checks.forEach((check: any) => {
        if (!check.customerId && !check.supplierId) {
          // محاولة الربط مع العميل
          const customer = customers.find((c: any) => 
            c.name === check.customerName || 
            c.phone === check.customerPhone ||
            (check.customerName && c.name.includes(check.customerName))
          );

          if (customer) {
            check.customerId = customer.id;
            check.entityType = 'customer';
            
            // تحديث إحصائيات العميل
            customer.totalChecks = (customer.totalChecks || 0) + 1;
            customer.checkAmount = (customer.checkAmount || 0) + check.amount;
            if (check.status === 'pending') {
              customer.pendingChecks = (customer.pendingChecks || 0) + 1;
              customer.pendingCheckAmount = (customer.pendingCheckAmount || 0) + check.amount;
            }
            
            linkedCount++;
          } else {
            // محاولة الربط مع المورد
            const supplier = suppliers.find((s: any) => 
              s.name === check.customerName || 
              s.phone === check.customerPhone ||
              (check.customerName && s.name.includes(check.customerName))
            );

            if (supplier) {
              check.supplierId = supplier.id;
              check.entityType = 'supplier';
              
              // تحديث إحصائيات المورد
              supplier.totalChecks = (supplier.totalChecks || 0) + 1;
              supplier.checkAmount = (supplier.checkAmount || 0) + check.amount;
              if (check.status === 'pending') {
                supplier.pendingChecks = (supplier.pendingChecks || 0) + 1;
                supplier.pendingCheckAmount = (supplier.pendingCheckAmount || 0) + check.amount;
              }
              
              linkedCount++;
            }
          }
        }
      });

      storage.setItem('checks', checks);
      storage.setItem('customers', customers);
      storage.setItem('suppliers', suppliers);
      
      console.log(`✅ تم ربط ${linkedCount} شيك تلقائياً`);
    } catch (error) {
      console.error('خطأ في ربط الشيكات:', error);
    }
  }

  // ربط جميع الأقساط تلقائياً
  private async linkAllInstallmentsAutomatically(): Promise<void> {
    try {
      const installments = storage.getItem('installments', []);
      const customers = storage.getItem('customers', []);
      
      let linkedCount = 0;

      installments.forEach((installment: any) => {
        if (!installment.customerId) {
          const customer = customers.find((c: any) => 
            c.name === installment.customerName || 
            c.phone === installment.customerPhone
          );

          if (customer) {
            installment.customerId = customer.id;
            
            // تحديث إحصائيات العميل
            customer.hasInstallments = true;
            customer.totalInstallments = (customer.totalInstallments || 0) + 1;
            customer.installmentAmount = (customer.installmentAmount || 0) + installment.totalAmount;
            
            // إضافة الأقساط لملف العميل
            if (!customer.installmentDetails) {
              customer.installmentDetails = [];
            }
            customer.installmentDetails.push({
              id: installment.id,
              amount: installment.totalAmount,
              paidAmount: installment.paidAmount,
              remainingAmount: installment.remainingAmount,
              status: installment.status,
              dueDate: installment.dueDate
            });
            
            linkedCount++;
          }
        }
      });

      storage.setItem('installments', installments);
      storage.setItem('customers', customers);
      
      console.log(`✅ تم ربط ${linkedCount} قسط تلقائياً`);
    } catch (error) {
      console.error('خطأ في ربط الأقساط:', error);
    }
  }

  // مزامنة جميع طرق الدفع
  private async syncAllPaymentMethods(): Promise<void> {
    try {
      // مزامنة الشيكات مع التدفق النقدي
      checksManager.syncWithCashFlow();
      
      // مزامنة الأقساط مع التدفق النقدي
      installmentsManager.syncWithCashFlow();
      
      console.log('✅ تم مزامنة جميع طرق الدفع');
    } catch (error) {
      console.error('خطأ في مزامنة طرق الدفع:', error);
    }
  }

  // تطبيق نظام نقاط الولاء
  private async implementLoyaltySystem(): Promise<void> {
    try {
      const customers = storage.getItem('customers', []);
      
      customers.forEach((customer: any) => {
        const totalSpent = customer.totalSpent || 0;
        const loyaltyPoints = Math.floor(totalSpent / 10); // نقطة لكل 10 وحدات
        
        customer.loyaltyPoints = {
          current: loyaltyPoints,
          total: loyaltyPoints,
          tier: this.calculateLoyaltyTier(loyaltyPoints),
          nextTierPoints: this.getNextTierRequirement(loyaltyPoints),
          benefits: this.getLoyaltyBenefits(loyaltyPoints)
        };
      });

      storage.setItem('customers', customers);
      console.log(`⭐ تم تطبيق نظام نقاط الولاء لـ ${customers.length} عميل`);
    } catch (error) {
      console.error('خطأ في تطبيق نظام الولاء:', error);
    }
  }

  // تحسين بيانات الموردين
  private async enhanceSupplierData(): Promise<void> {
    try {
      const suppliers = storage.getItem('suppliers', []);
      const purchaseInvoices = storage.getItem('purchase_invoices', []);
      
      suppliers.forEach((supplier: any) => {
        const supplierInvoices = purchaseInvoices.filter((inv: any) => 
          inv.supplierId === supplier.id || inv.supplierName === supplier.name
        );

        if (supplierInvoices.length > 0) {
          supplier.totalOrders = supplierInvoices.length;
          supplier.totalAmount = supplierInvoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);
          supplier.averageOrderValue = supplier.totalAmount / supplier.totalOrders;
          supplier.lastOrderDate = Math.max(...supplierInvoices.map((inv: any) => new Date(inv.date).getTime()));
          supplier.reliability = this.calculateSupplierReliability(supplierInvoices);
          supplier.rating = this.rateSupplier(supplier);
        }
      });

      storage.setItem('suppliers', suppliers);
      console.log(`🏭 تم تحسين بيانات ${suppliers.length} مورد`);
    } catch (error) {
      console.error('خطأ في تحسين بيانات الموردين:', error);
    }
  }

  // إنشاء فهارس البيانات
  private async createDataIndexes(): Promise<void> {
    try {
      const dataIndex = {
        lastUpdated: new Date().toISOString(),
        customers: {
          total: storage.getItem('customers', []).length,
          withLoyalty: storage.getItem('customers', []).filter((c: any) => c.loyaltyPoints).length,
          vip: storage.getItem('customers', []).filter((c: any) => c.classification === 'VIP').length
        },
        suppliers: {
          total: storage.getItem('suppliers', []).length,
          topRated: storage.getItem('suppliers', []).filter((s: any) => s.rating >= 80).length
        },
        integration: {
          checksLinked: storage.getItem('checks', []).filter((c: any) => c.customerId || c.supplierId).length,
          installmentsLinked: storage.getItem('installments', []).filter((i: any) => i.customerId).length,
          invoicesLinked: storage.getItem('sales_invoices', []).filter((i: any) => i.customerId).length
        }
      };

      storage.setItem('system_data_index', dataIndex);
      console.log('📊 تم إنشاء فهارس البيانات');
    } catch (error) {
      console.error('خطأ في إنشاء فهارس البيانات:', error);
    }
  }

  // حساب مستوى الترابط الحالي
  private calculateIntegrationLevel(): number {
    try {
      const checks = storage.getItem('checks', []);
      const installments = storage.getItem('installments', []);
      const customers = storage.getItem('customers', []);
      const suppliers = storage.getItem('suppliers', []);
      const salesInvoices = storage.getItem('sales_invoices', []);

      const linkedChecks = checks.filter((c: any) => c.customerId || c.supplierId).length;
      const linkedInstallments = installments.filter((i: any) => i.customerId).length;
      const linkedInvoices = salesInvoices.filter((i: any) => i.customerId).length;
      const customersWithLoyalty = customers.filter((c: any) => c.loyaltyPoints).length;

      const totalItems = checks.length + installments.length + salesInvoices.length + customers.length;
      const linkedItems = linkedChecks + linkedInstallments + linkedInvoices + customersWithLoyalty;

      return totalItems > 0 ? Math.round((linkedItems / totalItems) * 100) : 100;
    } catch (error) {
      console.error('خطأ في حساب مستوى الترابط:', error);
      return 0;
    }
  }

  // دوال مساعدة
  private classifyCustomer(customer: any): string {
    const totalAmount = customer.totalSpent || 0;
    const totalOrders = customer.totalOrders || 0;
    
    if (totalAmount > 50000 && totalOrders > 20) return 'VIP';
    if (totalAmount > 20000 && totalOrders > 10) return 'ذهبي';
    if (totalAmount > 5000 && totalOrders > 5) return 'فضي';
    return 'عادي';
  }

  private calculateCustomerStatus(customer: any): string {
    const lastPurchase = customer.lastPurchaseDate ? new Date(customer.lastPurchaseDate) : null;
    const monthsAgo = lastPurchase ? 
      (new Date().getTime() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24 * 30) : 0;
    
    if (monthsAgo > 6) return 'معلق';
    if (customer.overdueInstallments > 0) return 'متأخر';
    return 'نشط';
  }

  private calculateLoyaltyTier(points: number): string {
    if (points >= 1000) return 'بلاتيني';
    if (points >= 500) return 'ذهبي';
    if (points >= 200) return 'فضي';
    return 'برونزي';
  }

  private getNextTierRequirement(points: number): number {
    if (points >= 1000) return 0;
    if (points >= 500) return 1000 - points;
    if (points >= 200) return 500 - points;
    return 200 - points;
  }

  private getLoyaltyBenefits(points: number): string[] {
    const benefits = ['نقاط على كل عملية شراء'];
    
    if (points >= 200) benefits.push('خصم 5% على المشتريات');
    if (points >= 500) benefits.push('خصم 10% على المشتريات', 'شحن مجاني');
    if (points >= 1000) benefits.push('خصم 15% على المشتريات', 'أولوية في الخدمة');
    
    return benefits;
  }

  private calculateSupplierReliability(purchases: any[]): number {
    if (purchases.length === 0) return 0;
    
    const monthlyPurchases = purchases.reduce((acc: any, purchase: any) => {
      const month = new Date(purchase.date).toISOString().substring(0, 7);
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});
    
    const consistency = Object.keys(monthlyPurchases).length;
    return Math.min(consistency * 10, 100);
  }

  private rateSupplier(supplier: any): number {
    const reliability = supplier.reliability || 0;
    const orderCount = supplier.totalOrders || 0;
    const avgOrderValue = supplier.averageOrderValue || 0;
    
    return Math.round((reliability + Math.min(orderCount * 2, 50) + Math.min(avgOrderValue / 1000, 30)) / 3);
  }

  // التحقق من حالة التهيئة
  isSystemInitialized(): boolean {
    const initData = storage.getItem('system_integration_initialized', null);
    return initData !== null;
  }

  // الحصول على معلومات الترابط
  getIntegrationInfo() {
    const initData = storage.getItem('system_integration_initialized', null);
    const currentLevel = this.calculateIntegrationLevel();
    
    return {
      isInitialized: this.isSystemInitialized(),
      initData,
      currentLevel,
      lastUpdated: initData?.timestamp || null
    };
  }
}

export const autoIntegrationSystem = AutoIntegrationSystem.getInstance();