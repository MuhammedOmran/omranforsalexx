import { storage } from './storage';
import { cashFlowManager } from './cashFlowManager';
import { checksManager } from './checksManager';
import { installmentsManager } from './installmentsManager';

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  totalPurchases: number;
  totalDebt: number;
  loyaltyPoints: number;
  creditLimit: number;
  riskLevel: 'low' | 'medium' | 'high';
  lastPurchaseDate: string;
  registrationDate: string;
  status: 'active' | 'inactive' | 'blocked';
  pendingChecksAmount: number;
  overdueInstallmentsAmount: number;
  averageOrderValue: number;
  purchaseFrequency: number;
  paymentHistory: Array<{
    date: string;
    amount: number;
    method: 'cash' | 'check' | 'installment';
    status: 'paid' | 'pending' | 'overdue';
  }>;
}

export class EnhancedCustomerIntegration {
  private static instance: EnhancedCustomerIntegration;

  static getInstance(): EnhancedCustomerIntegration {
    if (!EnhancedCustomerIntegration.instance) {
      EnhancedCustomerIntegration.instance = new EnhancedCustomerIntegration();
    }
    return EnhancedCustomerIntegration.instance;
  }

  // تحديث ملف العميل عند إنشاء فاتورة بيع
  updateCustomerOnSale(customerId: string, saleData: any) {
    try {
      const customers = storage.getItem('customers', []);
      const customerIndex = customers.findIndex((c: any) => c.id === customerId);
      
      if (customerIndex !== -1) {
        const customer = customers[customerIndex];
        
        // تحديث إجمالي المشتريات
        customer.totalPurchases = (customer.totalPurchases || 0) + saleData.total;
        
        // تحديث تاريخ آخر شراء
        customer.lastPurchaseDate = saleData.date;
        
        // حساب نقاط الولاء (1 نقطة لكل 100 وحدة)
        const loyaltyPointsEarned = Math.floor(saleData.total / 100);
        customer.loyaltyPoints = (customer.loyaltyPoints || 0) + loyaltyPointsEarned;
        
        // تحديث متوسط قيمة الطلب
        const salesCount = this.getCustomerSalesCount(customerId);
        customer.averageOrderValue = customer.totalPurchases / salesCount;
        
        // تحديث تكرار الشراء
        customer.purchaseFrequency = this.calculatePurchaseFrequency(customerId);
        
        // تحديث مستوى المخاطر
        customer.riskLevel = this.calculateRiskLevel(customer);
        
        // إضافة للتاريخ الدفع
        if (!customer.paymentHistory) customer.paymentHistory = [];
        customer.paymentHistory.push({
          date: saleData.date,
          amount: saleData.total,
          method: saleData.paymentMethod || 'cash',
          status: 'paid'
        });
        
        customers[customerIndex] = customer;
        storage.setItem('customers', customers);
        
        // إضافة للتدفق النقدي
        cashFlowManager.addTransaction({
          type: 'income',
          amount: saleData.total,
          description: `مبيعات للعميل: ${customer.name}`,
          category: 'sales',
          paymentMethod: saleData.paymentMethod || 'cash',
          referenceId: `customer-${customerId}`,
          date: saleData.date
        });
        
        return customer;
      }
    } catch (error) {
      console.error('Error updating customer on sale:', error);
    }
  }

  // ربط العميل مع الأقساط
  linkCustomerWithInstallments(customerId: string, installmentData: any) {
    try {
      const customers = storage.getItem('customers', []);
      const customerIndex = customers.findIndex((c: any) => c.id === customerId);
      
      if (customerIndex !== -1) {
        const customer = customers[customerIndex];
        
        // تحديث المديونية
        if (installmentData.status === 'pending') {
          customer.totalDebt = (customer.totalDebt || 0) + installmentData.amount;
          customer.overdueInstallmentsAmount = (customer.overdueInstallmentsAmount || 0) + installmentData.amount;
        }
        
        // إضافة للتاريخ الدفع
        if (!customer.paymentHistory) customer.paymentHistory = [];
        customer.paymentHistory.push({
          date: installmentData.date,
          amount: installmentData.amount,
          method: 'installment',
          status: installmentData.status
        });
        
        customers[customerIndex] = customer;
        storage.setItem('customers', customers);
        
        return customer;
      }
    } catch (error) {
      console.error('Error linking customer with installments:', error);
    }
  }

  // ربط العميل مع الشيكات
  linkCustomerWithCheck(customerId: string, checkData: any) {
    try {
      const customers = storage.getItem('customers', []);
      const customerIndex = customers.findIndex((c: any) => c.id === customerId);
      
      if (customerIndex !== -1) {
        const customer = customers[customerIndex];
        
        // تحديث مبلغ الشيكات المعلقة
        if (checkData.status === 'pending') {
          customer.pendingChecksAmount = (customer.pendingChecksAmount || 0) + checkData.amount;
        }
        
        // إضافة للتاريخ الدفع
        if (!customer.paymentHistory) customer.paymentHistory = [];
        customer.paymentHistory.push({
          date: checkData.dateReceived,
          amount: checkData.amount,
          method: 'check',
          status: checkData.status
        });
        
        customers[customerIndex] = customer;
        storage.setItem('customers', customers);
        
        return customer;
      }
    } catch (error) {
      console.error('Error linking customer with check:', error);
    }
  }

  // دفع قسط العميل
  payCustomerInstallment(customerId: string, installmentId: string, amount: number) {
    try {
      const customers = storage.getItem('customers', []);
      const customerIndex = customers.findIndex((c: any) => c.id === customerId);
      
      if (customerIndex !== -1) {
        const customer = customers[customerIndex];
        
        // تقليل المديونية
        customer.totalDebt = Math.max(0, (customer.totalDebt || 0) - amount);
        customer.overdueInstallmentsAmount = Math.max(0, (customer.overdueInstallmentsAmount || 0) - amount);
        
        // تحديث تاريخ الدفع
        const paymentIndex = customer.paymentHistory?.findIndex(
          (p: any) => p.method === 'installment' && p.amount === amount && p.status === 'pending'
        );
        if (paymentIndex !== -1 && customer.paymentHistory) {
          customer.paymentHistory[paymentIndex].status = 'paid';
        }
        
        customers[customerIndex] = customer;
        storage.setItem('customers', customers);
        
        // إضافة للتدفق النقدي
        cashFlowManager.addTransaction({
          type: 'income',
          amount: amount,
          description: `دفع قسط من العميل: ${customer.name}`,
          category: 'other',
          paymentMethod: 'cash',
          referenceId: `customer-${customerId}-installment-${installmentId}`,
          date: new Date().toISOString().split('T')[0]
        });
        
        return customer;
      }
    } catch (error) {
      console.error('Error paying customer installment:', error);
    }
  }

  // صرف شيك العميل
  cashCustomerCheck(customerId: string, checkId: string, amount: number) {
    try {
      const customers = storage.getItem('customers', []);
      const customerIndex = customers.findIndex((c: any) => c.id === customerId);
      
      if (customerIndex !== -1) {
        const customer = customers[customerIndex];
        
        // تقليل مبلغ الشيكات المعلقة
        customer.pendingChecksAmount = Math.max(0, (customer.pendingChecksAmount || 0) - amount);
        
        // تحديث تاريخ الدفع
        const paymentIndex = customer.paymentHistory?.findIndex(
          (p: any) => p.method === 'check' && p.amount === amount && p.status === 'pending'
        );
        if (paymentIndex !== -1 && customer.paymentHistory) {
          customer.paymentHistory[paymentIndex].status = 'paid';
        }
        
        customers[customerIndex] = customer;
        storage.setItem('customers', customers);
        
        return customer;
      }
    } catch (error) {
      console.error('Error cashing customer check:', error);
    }
  }

  // حساب مستوى المخاطر
  private calculateRiskLevel(customer: any): 'low' | 'medium' | 'high' {
    let riskScore = 0;
    
    // المديونية المرتفعة
    const debtRatio = customer.totalDebt / Math.max(customer.totalPurchases, 1);
    if (debtRatio > 0.5) riskScore += 3;
    else if (debtRatio > 0.2) riskScore += 1;
    
    // الشيكات المعلقة
    if (customer.pendingChecksAmount > 10000) riskScore += 2;
    else if (customer.pendingChecksAmount > 5000) riskScore += 1;
    
    // الأقساط المتأخرة
    if (customer.overdueInstallmentsAmount > 5000) riskScore += 2;
    else if (customer.overdueInstallmentsAmount > 2000) riskScore += 1;
    
    // تكرار الشراء المنخفض
    if (customer.purchaseFrequency < 1) riskScore += 1;
    
    if (riskScore >= 4) return 'high';
    if (riskScore >= 2) return 'medium';
    return 'low';
  }

  // حساب تكرار الشراء (شراء في الشهر)
  private calculatePurchaseFrequency(customerId: string): number {
    try {
      const salesInvoices = storage.getItem('sales_invoices', [])
        .filter((inv: any) => inv.customerId === customerId);
      
      if (salesInvoices.length === 0) return 0;
      
      const firstSale = new Date(salesInvoices[0].date);
      const lastSale = new Date(salesInvoices[salesInvoices.length - 1].date);
      const monthsDiff = (lastSale.getTime() - firstSale.getTime()) / (1000 * 60 * 60 * 24 * 30);
      
      return monthsDiff > 0 ? salesInvoices.length / monthsDiff : salesInvoices.length;
    } catch (error) {
      return 0;
    }
  }

  // عدد فواتير البيع للعميل
  private getCustomerSalesCount(customerId: string): number {
    const salesInvoices = storage.getItem('sales_invoices', [])
      .filter((inv: any) => inv.customerId === customerId);
    return salesInvoices.length;
  }

  // الحصول على ملف العميل الشامل
  getEnhancedCustomerProfile(customerId: string): CustomerProfile | null {
    try {
      const customers = storage.getItem('customers', []);
      const customer = customers.find((c: any) => c.id === customerId);
      
      if (!customer) return null;
      
      // حساب البيانات المحدثة
      const salesInvoices = storage.getItem('sales_invoices', [])
        .filter((inv: any) => inv.customerId === customerId);
      const checks = storage.getItem('checks', [])
        .filter((check: any) => check.customerId === customerId);
      const installments = storage.getItem('installments', [])
        .filter((inst: any) => inst.customerId === customerId);
      
      return {
        ...customer,
        totalPurchases: salesInvoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0),
        pendingChecksAmount: checks.filter((c: any) => c.status === 'pending')
          .reduce((sum: number, c: any) => sum + c.amount, 0),
        overdueInstallmentsAmount: installments.filter((i: any) => i.status === 'pending')
          .reduce((sum: number, i: any) => sum + i.amount, 0),
        averageOrderValue: salesInvoices.length > 0 ? 
          salesInvoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0) / salesInvoices.length : 0,
        purchaseFrequency: this.calculatePurchaseFrequency(customerId)
      };
    } catch (error) {
      console.error('Error getting enhanced customer profile:', error);
      return null;
    }
  }

  // العملاء المتأخرين في الدفع
  getOverdueCustomers(): CustomerProfile[] {
    try {
      const customers = storage.getItem('customers', []);
      return customers.filter((customer: any) => 
        customer.totalDebt > 0 || 
        customer.overdueInstallmentsAmount > 0 ||
        customer.riskLevel === 'high'
      ).map((customer: any) => this.getEnhancedCustomerProfile(customer.id))
      .filter(Boolean);
    } catch (error) {
      console.error('Error getting overdue customers:', error);
      return [];
    }
  }

  // أفضل العملاء
  getTopCustomers(limit: number = 10): CustomerProfile[] {
    try {
      const customers = storage.getItem('customers', []);
      return customers
        .map((customer: any) => this.getEnhancedCustomerProfile(customer.id))
        .filter(Boolean)
        .sort((a: any, b: any) => b.totalPurchases - a.totalPurchases)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting top customers:', error);
      return [];
    }
  }
}

export const enhancedCustomerIntegration = EnhancedCustomerIntegration.getInstance();