import { storage } from './storage';
import { cashFlowManager } from './cashFlowManager';

export interface CustomerIntegration {
  customerId: string;
  totalPurchases: number;
  totalSpent: number;
  lastPurchaseDate?: string;
  averageOrderValue: number;
  totalOrders: number;
  loyaltyPoints: number;
  totalDebt: number;
  paidAmount: number;
  pendingInstallments: number;
  overdueInstallments: number;
  status: 'نشط' | 'متأخر' | 'معلق';
  riskLevel: 'منخفض' | 'متوسط' | 'عالي';
}

export class CustomerIntegrationManager {
  private static instance: CustomerIntegrationManager;

  static getInstance(): CustomerIntegrationManager {
    if (!CustomerIntegrationManager.instance) {
      CustomerIntegrationManager.instance = new CustomerIntegrationManager();
    }
    return CustomerIntegrationManager.instance;
  }

  // تحديث بيانات العميل عند إنشاء فاتورة جديدة
  updateCustomerOnSale(customerId: string, invoiceData: any): void {
    try {
      const customers = storage.getItem('customers', []);
      const customerIndex = customers.findIndex((c: any) => c.id?.toString() === customerId.toString());
      
      if (customerIndex !== -1) {
        const customer = customers[customerIndex];
        
        // تحديث إحصائيات المبيعات
        customer.totalOrders = (customer.totalOrders || 0) + 1;
        customer.totalSpent = (customer.totalSpent || 0) + invoiceData.total;
        customer.lastPurchaseDate = invoiceData.date;
        customer.averageOrderValue = customer.totalSpent / customer.totalOrders;
        
        // تحديث نقاط الولاء (نقطة لكل جنيه)
        customer.loyaltyPoints = (customer.loyaltyPoints || 0) + Math.floor(invoiceData.total);
        
        // تحديث المديونية إذا لم يتم الدفع كاملاً
        if (invoiceData.paymentStatus === 'partial') {
          const paidAmount = invoiceData.paidAmount || 0;
          const remainingAmount = invoiceData.total - paidAmount;
          customer.totalDebt = (customer.totalDebt || 0) + remainingAmount;
        }
        
        // ربط الفاتورة بالعميل
        this.linkInvoiceToCustomer(customer.id, invoiceData);
        
        // تحديث تقييم المخاطر
        customer.riskLevel = this.calculateRiskLevel(customer);
        customer.status = this.calculateCustomerStatus(customer);
        
        customers[customerIndex] = customer;
        storage.setItem('customers', customers);
      }
    } catch (error) {
      console.error('Error updating customer on sale:', error);
    }
  }

  // ربط الفاتورة بالعميل
  private linkInvoiceToCustomer(customerId: string, invoiceData: any): void {
    try {
      const salesInvoices = storage.getItem('sales_invoices', []);
      const invoiceIndex = salesInvoices.findIndex((inv: any) => inv.id === invoiceData.id);
      
      if (invoiceIndex !== -1) {
        salesInvoices[invoiceIndex].customerId = customerId;
        salesInvoices[invoiceIndex].linkedToCustomer = true;
        storage.setItem('sales_invoices', salesInvoices);
      }
    } catch (error) {
      console.error('Error linking invoice to customer:', error);
    }
  }

  // تحديث بيانات العميل عند دفع قسط
  updateCustomerOnInstallmentPayment(customerId: string, installmentAmount: number): void {
    try {
      const customers = storage.getItem('customers', []);
      const customerIndex = customers.findIndex((c: any) => c.id?.toString() === customerId.toString());
      
      if (customerIndex !== -1) {
        const customer = customers[customerIndex];
        
        // تقليل المديونية
        customer.totalDebt = Math.max(0, (customer.totalDebt || 0) - installmentAmount);
        customer.paidAmount = (customer.paidAmount || 0) + installmentAmount;
        
        // تحديث نقاط الولاء للدفع في الوقت المحدد
        customer.loyaltyPoints = (customer.loyaltyPoints || 0) + Math.floor(installmentAmount * 0.1);
        
        // تحديث التقييم
        customer.riskLevel = this.calculateRiskLevel(customer);
        customer.status = this.calculateCustomerStatus(customer);
        
        customers[customerIndex] = customer;
        storage.setItem('customers', customers);
      }
    } catch (error) {
      console.error('Error updating customer on installment payment:', error);
    }
  }

  // ربط العميل مع أقساطه
  linkCustomerWithInstallments(customerId: string): any[] {
    try {
      const installments = storage.getItem('installments', []);
      return installments.filter((inst: any) => inst.customerId === customerId);
    } catch (error) {
      console.error('Error linking customer with installments:', error);
      return [];
    }
  }

  // حساب الأقساط المعلقة والمتأخرة للعميل
  calculateCustomerInstallmentStatus(customerId: string) {
    try {
      const installments = this.linkCustomerWithInstallments(customerId);
      const today = new Date();
      
      const pendingInstallments = installments.filter((inst: any) => inst.status === 'pending').length;
      const overdueInstallments = installments.filter((inst: any) => {
        return inst.status === 'pending' && new Date(inst.dueDate) < today;
      }).length;
      
      const pendingAmount = installments
        .filter((inst: any) => inst.status === 'pending')
        .reduce((sum: number, inst: any) => sum + inst.amount, 0);
      
      const overdueAmount = installments
        .filter((inst: any) => inst.status === 'pending' && new Date(inst.dueDate) < today)
        .reduce((sum: number, inst: any) => sum + inst.amount, 0);

      return {
        pendingInstallments,
        overdueInstallments,
        pendingAmount,
        overdueAmount
      };
    } catch (error) {
      console.error('Error calculating installment status:', error);
      return { pendingInstallments: 0, overdueInstallments: 0, pendingAmount: 0, overdueAmount: 0 };
    }
  }

  // حساب مستوى المخاطر
  private calculateRiskLevel(customer: any): 'منخفض' | 'متوسط' | 'عالي' {
    const debt = customer.totalDebt || 0;
    const totalSpent = customer.totalSpent || 1;
    const debtRatio = debt / totalSpent;
    
    const installmentStatus = this.calculateCustomerInstallmentStatus(customer.id);
    
    if (installmentStatus.overdueInstallments > 2 || debtRatio > 0.5) {
      return 'عالي';
    } else if (installmentStatus.overdueInstallments > 0 || debtRatio > 0.2) {
      return 'متوسط';
    }
    return 'منخفض';
  }

  // حساب حالة العميل
  private calculateCustomerStatus(customer: any): 'نشط' | 'متأخر' | 'معلق' {
    const installmentStatus = this.calculateCustomerInstallmentStatus(customer.id);
    
    if (installmentStatus.overdueInstallments > 0) {
      return 'متأخر';
    }
    
    const lastPurchase = customer.lastPurchaseDate ? new Date(customer.lastPurchaseDate) : null;
    const monthsAgo = lastPurchase ? 
      (new Date().getTime() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24 * 30) : 0;
    
    if (monthsAgo > 6) {
      return 'معلق';
    }
    
    return 'نشط';
  }

  // الحصول على بيانات العميل المتكاملة
  getCustomerIntegratedData(customerId: string): CustomerIntegration | null {
    try {
      const customers = storage.getItem('customers', []);
      const customer = customers.find((c: any) => c.id?.toString() === customerId.toString());
      
      if (!customer) return null;
      
      const installmentStatus = this.calculateCustomerInstallmentStatus(customerId);
      
      return {
        customerId: customer.id,
        totalPurchases: customer.totalOrders || 0,
        totalSpent: customer.totalSpent || 0,
        lastPurchaseDate: customer.lastPurchaseDate,
        averageOrderValue: customer.averageOrderValue || 0,
        totalOrders: customer.totalOrders || 0,
        loyaltyPoints: customer.loyaltyPoints || 0,
        totalDebt: customer.totalDebt || 0,
        paidAmount: customer.paidAmount || 0,
        pendingInstallments: installmentStatus.pendingInstallments,
        overdueInstallments: installmentStatus.overdueInstallments,
        status: customer.status || 'نشط',
        riskLevel: customer.riskLevel || 'منخفض'
      };
    } catch (error) {
      console.error('Error getting customer integrated data:', error);
      return null;
    }
  }

  // تحديث جميع بيانات العملاء
  syncAllCustomers(): void {
    try {
      const customers = storage.getItem('customers', []);
      const salesInvoices = storage.getItem('sales_invoices', []);
      
      customers.forEach((customer: any) => {
        // إعادة حساب كل البيانات من الفواتير
        const customerInvoices = salesInvoices.filter((invoice: any) => 
          invoice.customerId?.toString() === customer.id?.toString() ||
          invoice.customerName === customer.name
        );
        
        if (customerInvoices.length > 0) {
          customer.totalOrders = customerInvoices.length;
          customer.totalSpent = customerInvoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);
          customer.averageOrderValue = customer.totalSpent / customer.totalOrders;
          customer.loyaltyPoints = Math.floor(customer.totalSpent);
          
          // آخر عملية شراء
          const sortedInvoices = customerInvoices.sort((a: any, b: any) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          customer.lastPurchaseDate = sortedInvoices[0].date;
        }
        
        // تحديث التقييم
        customer.riskLevel = this.calculateRiskLevel(customer);
        customer.status = this.calculateCustomerStatus(customer);
      });
      
      storage.setItem('customers', customers);
      console.log(`Synced ${customers.length} customers`);
    } catch (error) {
      console.error('Error syncing all customers:', error);
    }
  }

  // الحصول على أفضل العملاء
  getTopCustomers(limit: number = 10) {
    try {
      const customers = storage.getItem('customers', []);
      return customers
        .sort((a: any, b: any) => (b.totalSpent || 0) - (a.totalSpent || 0))
        .slice(0, limit)
        .map((customer: any) => this.getCustomerIntegratedData(customer.id))
        .filter(Boolean);
    } catch (error) {
      console.error('Error getting top customers:', error);
      return [];
    }
  }

  // الحصول على العملاء المتأخرين
  getOverdueCustomers() {
    try {
      const customers = storage.getItem('customers', []);
      return customers
        .filter((customer: any) => {
          const installmentStatus = this.calculateCustomerInstallmentStatus(customer.id);
          return installmentStatus.overdueInstallments > 0;
        })
        .map((customer: any) => this.getCustomerIntegratedData(customer.id))
        .filter(Boolean);
    } catch (error) {
      console.error('Error getting overdue customers:', error);
      return [];
    }
  }

  // ربط العملاء مع الشيكات
  linkCustomerWithChecks(customerId: string): any[] {
    try {
      const checks = storage.getItem('checks', []);
      return checks.filter((check: any) => check.customerId === customerId);
    } catch (error) {
      console.error('Error linking customer with checks:', error);
      return [];
    }
  }

  // الحصول على العملاء الذين لديهم شيكات معلقة
  getCustomersWithPendingChecks() {
    try {
      const checks = storage.getItem('checks', []);
      const customers = storage.getItem('customers', []);
      const pendingChecks = checks.filter((check: any) => check.status === 'pending');
      
      const customersWithPendingChecks = customers
        .filter((customer: any) => 
          pendingChecks.some((check: any) => check.customerId === customer.id)
        )
        .map((customer: any) => {
          const customerChecks = pendingChecks.filter((check: any) => check.customerId === customer.id);
          return {
            ...this.getCustomerIntegratedData(customer.id),
            pendingChecks: customerChecks.length,
            pendingChecksAmount: customerChecks.reduce((sum: number, check: any) => sum + check.amount, 0),
            checks: customerChecks
          };
        });

      return customersWithPendingChecks;
    } catch (error) {
      console.error('Error getting customers with pending checks:', error);
      return [];
    }
  }

  // تقرير تفصيلي للعميل
  getCustomerDetailedReport(customerId: string) {
    try {
      const customer = this.getCustomerIntegratedData(customerId);
      if (!customer) return null;

      const installments = this.linkCustomerWithInstallments(customerId);
      const checks = this.linkCustomerWithChecks(customerId);
      const salesInvoices = storage.getItem('sales_invoices', []);
      const customerInvoices = salesInvoices.filter((inv: any) => inv.customerId === customerId);

      return {
        customer,
        invoices: {
          total: customerInvoices.length,
          data: customerInvoices,
          totalAmount: customerInvoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0)
        },
        installments: {
          total: installments.length,
          active: installments.filter((inst: any) => inst.status === 'active').length,
          completed: installments.filter((inst: any) => inst.status === 'completed').length,
          overdue: installments.filter((inst: any) => inst.status === 'overdue').length,
          data: installments
        },
        checks: {
          total: checks.length,
          pending: checks.filter((check: any) => check.status === 'pending').length,
          cashed: checks.filter((check: any) => check.status === 'cashed').length,
          bounced: checks.filter((check: any) => check.status === 'bounced').length,
          data: checks
        }
      };
    } catch (error) {
      console.error('Error getting customer detailed report:', error);
      return null;
    }
  }
}

// Export singleton instance
export const customerIntegrationManager = CustomerIntegrationManager.getInstance();