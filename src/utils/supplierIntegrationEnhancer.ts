import { storage } from './storage';
import { cashFlowManager } from './cashFlowManager';

export interface SupplierIntegration {
  supplierId: string;
  totalPurchases: number;
  totalSpent: number;
  lastPurchaseDate?: string;
  averageOrderValue: number;
  totalOrders: number;
  totalDebt: number;
  paidAmount: number;
  pendingPayments: number;
  overduePayments: number;
  status: 'نشط' | 'متأخر' | 'معلق';
  performanceRating: 'ممتاز' | 'جيد' | 'متوسط' | 'ضعيف';
  paymentTermsCompliance: number; // نسبة الالتزام بشروط الدفع
  deliveryReliability: number; // مؤشر موثوقية التسليم
}

export class SupplierIntegrationEnhancer {
  private static instance: SupplierIntegrationEnhancer;

  static getInstance(): SupplierIntegrationEnhancer {
    if (!SupplierIntegrationEnhancer.instance) {
      SupplierIntegrationEnhancer.instance = new SupplierIntegrationEnhancer();
    }
    return SupplierIntegrationEnhancer.instance;
  }

  // تحديث بيانات المورد عند إنشاء فاتورة شراء جديدة
  updateSupplierOnPurchase(supplierId: string, invoiceData: any): void {
    try {
      const suppliers = storage.getItem('suppliers', []);
      const supplierIndex = suppliers.findIndex((s: any) => s.id?.toString() === supplierId.toString());
      
      if (supplierIndex !== -1) {
        const supplier = suppliers[supplierIndex];
        
        // تحديث إحصائيات المشتريات
        supplier.totalOrders = (supplier.totalOrders || 0) + 1;
        supplier.totalSpent = (supplier.totalSpent || 0) + invoiceData.total;
        supplier.lastPurchaseDate = invoiceData.date;
        supplier.averageOrderValue = supplier.totalSpent / supplier.totalOrders;
        
        // تحديث المديونية للمورد
        if (invoiceData.paymentStatus === 'partial') {
          const paidAmount = invoiceData.paidAmount || 0;
          const remainingAmount = invoiceData.total - paidAmount;
          supplier.totalDebt = (supplier.totalDebt || 0) + remainingAmount;
        }
        
        // ربط الفاتورة بالمورد
        this.linkInvoiceToSupplier(supplier.id, invoiceData);
        
        // تحديث تقييم الأداء
        supplier.performanceRating = this.calculatePerformanceRating(supplier);
        supplier.status = this.calculateSupplierStatus(supplier);
        
        suppliers[supplierIndex] = supplier;
        storage.setItem('suppliers', suppliers);
      }
    } catch (error) {
      console.error('Error updating supplier on purchase:', error);
    }
  }

  // ربط الفاتورة بالمورد
  private linkInvoiceToSupplier(supplierId: string, invoiceData: any): void {
    try {
      const purchaseInvoices = storage.getItem('purchase_invoices', []);
      const invoiceIndex = purchaseInvoices.findIndex((inv: any) => inv.id === invoiceData.id);
      
      if (invoiceIndex !== -1) {
        purchaseInvoices[invoiceIndex].supplierId = supplierId;
        purchaseInvoices[invoiceIndex].linkedToSupplier = true;
        storage.setItem('purchase_invoices', purchaseInvoices);
      }
    } catch (error) {
      console.error('Error linking invoice to supplier:', error);
    }
  }

  // تحديث بيانات المورد عند دفع مبلغ
  updateSupplierOnPayment(supplierId: string, paymentAmount: number): void {
    try {
      const suppliers = storage.getItem('suppliers', []);
      const supplierIndex = suppliers.findIndex((s: any) => s.id?.toString() === supplierId.toString());
      
      if (supplierIndex !== -1) {
        const supplier = suppliers[supplierIndex];
        
        // تقليل المديونية
        supplier.totalDebt = Math.max(0, (supplier.totalDebt || 0) - paymentAmount);
        supplier.paidAmount = (supplier.paidAmount || 0) + paymentAmount;
        
        // تحديث مؤشر الالتزام بالدفع
        supplier.paymentTermsCompliance = this.calculatePaymentCompliance(supplier);
        
        // تحديث التقييم
        supplier.performanceRating = this.calculatePerformanceRating(supplier);
        supplier.status = this.calculateSupplierStatus(supplier);
        
        suppliers[supplierIndex] = supplier;
        storage.setItem('suppliers', suppliers);
      }
    } catch (error) {
      console.error('Error updating supplier on payment:', error);
    }
  }

  // ربط المورد مع الشيكات
  linkSupplierWithChecks(supplierId: string): any[] {
    try {
      const checks = storage.getItem('checks', []);
      return checks.filter((check: any) => check.supplierId === supplierId);
    } catch (error) {
      console.error('Error linking supplier with checks:', error);
      return [];
    }
  }

  // حساب تقييم الأداء
  private calculatePerformanceRating(supplier: any): 'ممتاز' | 'جيد' | 'متوسط' | 'ضعيف' {
    try {
      const totalSpent = supplier.totalSpent || 0;
      const totalDebt = supplier.totalDebt || 0;
      const paymentCompliance = supplier.paymentTermsCompliance || 0;
      const deliveryReliability = supplier.deliveryReliability || 0;
      
      const debtRatio = totalSpent > 0 ? totalDebt / totalSpent : 0;
      
      // حساب النقاط الإجمالية
      let totalScore = 0;
      let maxScore = 0;
      
      // نقاط الالتزام بالدفع (40%)
      totalScore += paymentCompliance * 0.4;
      maxScore += 40;
      
      // نقاط موثوقية التسليم (30%)
      totalScore += deliveryReliability * 0.3;
      maxScore += 30;
      
      // نقاط نسبة الديون (30%)
      if (debtRatio < 0.1) {
        totalScore += 30;
      } else if (debtRatio < 0.3) {
        totalScore += 20;
      } else if (debtRatio < 0.5) {
        totalScore += 10;
      }
      maxScore += 30;
      
      const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
      
      if (percentage >= 85) return 'ممتاز';
      if (percentage >= 70) return 'جيد';
      if (percentage >= 50) return 'متوسط';
      return 'ضعيف';
    } catch (error) {
      console.error('Error calculating performance rating:', error);
      return 'متوسط';
    }
  }

  // حساب حالة المورد
  private calculateSupplierStatus(supplier: any): 'نشط' | 'متأخر' | 'معلق' {
    try {
      const totalDebt = supplier.totalDebt || 0;
      const lastPurchase = supplier.lastPurchaseDate ? new Date(supplier.lastPurchaseDate) : null;
      const monthsAgo = lastPurchase ? 
        (new Date().getTime() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24 * 30) : 0;
      
      if (totalDebt > 0) {
        return 'متأخر';
      }
      
      if (monthsAgo > 6) {
        return 'معلق';
      }
      
      return 'نشط';
    } catch (error) {
      console.error('Error calculating supplier status:', error);
      return 'نشط';
    }
  }

  // حساب مؤشر الالتزام بالدفع
  private calculatePaymentCompliance(supplier: any): number {
    try {
      const purchaseInvoices = storage.getItem('purchase_invoices', []);
      const supplierInvoices = purchaseInvoices.filter((inv: any) => inv.supplierId === supplier.id);
      
      if (supplierInvoices.length === 0) return 100;
      
      const paidOnTimeCount = supplierInvoices.filter((inv: any) => {
        if (inv.paymentStatus === 'paid' && inv.paidDate) {
          const dueDate = new Date(inv.dueDate || inv.date);
          const paidDate = new Date(inv.paidDate);
          return paidDate <= dueDate;
        }
        return false;
      }).length;
      
      return (paidOnTimeCount / supplierInvoices.length) * 100;
    } catch (error) {
      console.error('Error calculating payment compliance:', error);
      return 0;
    }
  }

  // الحصول على بيانات المورد المتكاملة
  getSupplierIntegratedData(supplierId: string): SupplierIntegration | null {
    try {
      const suppliers = storage.getItem('suppliers', []);
      const supplier = suppliers.find((s: any) => s.id?.toString() === supplierId.toString());
      
      if (!supplier) return null;
      
      return {
        supplierId: supplier.id,
        totalPurchases: supplier.totalOrders || 0,
        totalSpent: supplier.totalSpent || 0,
        lastPurchaseDate: supplier.lastPurchaseDate,
        averageOrderValue: supplier.averageOrderValue || 0,
        totalOrders: supplier.totalOrders || 0,
        totalDebt: supplier.totalDebt || 0,
        paidAmount: supplier.paidAmount || 0,
        pendingPayments: 0, // سيتم حسابها من الفواتير المعلقة
        overduePayments: 0, // سيتم حسابها من الفواتير المتأخرة
        status: supplier.status || 'نشط',
        performanceRating: supplier.performanceRating || 'متوسط',
        paymentTermsCompliance: supplier.paymentTermsCompliance || 0,
        deliveryReliability: supplier.deliveryReliability || 0
      };
    } catch (error) {
      console.error('Error getting supplier integrated data:', error);
      return null;
    }
  }

  // تحديث جميع بيانات الموردين
  syncAllSuppliers(): void {
    try {
      const suppliers = storage.getItem('suppliers', []);
      const purchaseInvoices = storage.getItem('purchase_invoices', []);
      
      suppliers.forEach((supplier: any) => {
        // إعادة حساب كل البيانات من الفواتير
        const supplierInvoices = purchaseInvoices.filter((invoice: any) => 
          invoice.supplierId?.toString() === supplier.id?.toString() ||
          invoice.supplierName === supplier.name
        );
        
        if (supplierInvoices.length > 0) {
          supplier.totalOrders = supplierInvoices.length;
          supplier.totalSpent = supplierInvoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);
          supplier.averageOrderValue = supplier.totalSpent / supplier.totalOrders;
          
          // آخر عملية شراء
          const sortedInvoices = supplierInvoices.sort((a: any, b: any) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          supplier.lastPurchaseDate = sortedInvoices[0].date;
          
          // حساب المديونية
          supplier.totalDebt = supplierInvoices
            .filter((inv: any) => inv.paymentStatus === 'partial' || inv.paymentStatus === 'unpaid')
            .reduce((sum: number, inv: any) => sum + ((inv.total || 0) - (inv.paidAmount || 0)), 0);
        }
        
        // تحديث التقييم
        supplier.paymentTermsCompliance = this.calculatePaymentCompliance(supplier);
        supplier.performanceRating = this.calculatePerformanceRating(supplier);
        supplier.status = this.calculateSupplierStatus(supplier);
      });
      
      storage.setItem('suppliers', suppliers);
      console.log(`Synced ${suppliers.length} suppliers`);
    } catch (error) {
      console.error('Error syncing all suppliers:', error);
    }
  }

  // الحصول على أفضل الموردين
  getTopSuppliers(limit: number = 10) {
    try {
      const suppliers = storage.getItem('suppliers', []);
      return suppliers
        .sort((a: any, b: any) => {
          const aRating = this.getPerformanceScore(a.performanceRating);
          const bRating = this.getPerformanceScore(b.performanceRating);
          if (aRating === bRating) {
            return (b.totalSpent || 0) - (a.totalSpent || 0);
          }
          return bRating - aRating;
        })
        .slice(0, limit)
        .map((supplier: any) => this.getSupplierIntegratedData(supplier.id))
        .filter(Boolean);
    } catch (error) {
      console.error('Error getting top suppliers:', error);
      return [];
    }
  }

  // تحويل تقييم الأداء إلى نقاط
  private getPerformanceScore(rating: string): number {
    switch (rating) {
      case 'ممتاز': return 4;
      case 'جيد': return 3;
      case 'متوسط': return 2;
      case 'ضعيف': return 1;
      default: return 2;
    }
  }

  // الحصول على الموردين المتأخرين
  getOverdueSuppliers() {
    try {
      const suppliers = storage.getItem('suppliers', []);
      return suppliers
        .filter((supplier: any) => supplier.status === 'متأخر' || (supplier.totalDebt || 0) > 0)
        .map((supplier: any) => this.getSupplierIntegratedData(supplier.id))
        .filter(Boolean);
    } catch (error) {
      console.error('Error getting overdue suppliers:', error);
      return [];
    }
  }

  // تقرير تفصيلي للمورد
  getSupplierDetailedReport(supplierId: string) {
    try {
      const supplier = this.getSupplierIntegratedData(supplierId);
      if (!supplier) return null;

      const checks = this.linkSupplierWithChecks(supplierId);
      const purchaseInvoices = storage.getItem('purchase_invoices', []);
      const supplierInvoices = purchaseInvoices.filter((inv: any) => inv.supplierId === supplierId);

      return {
        supplier,
        invoices: {
          total: supplierInvoices.length,
          data: supplierInvoices,
          totalAmount: supplierInvoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0),
          paid: supplierInvoices.filter((inv: any) => inv.paymentStatus === 'paid').length,
          pending: supplierInvoices.filter((inv: any) => inv.paymentStatus === 'partial' || inv.paymentStatus === 'unpaid').length
        },
        checks: {
          total: checks.length,
          pending: checks.filter((check: any) => check.status === 'pending').length,
          cashed: checks.filter((check: any) => check.status === 'cashed').length,
          bounced: checks.filter((check: any) => check.status === 'bounced').length,
          data: checks
        },
        performance: {
          rating: supplier.performanceRating,
          paymentCompliance: supplier.paymentTermsCompliance,
          deliveryReliability: supplier.deliveryReliability,
          totalDebt: supplier.totalDebt
        }
      };
    } catch (error) {
      console.error('Error getting supplier detailed report:', error);
      return null;
    }
  }
}

// Export singleton instance
export const supplierIntegrationEnhancer = SupplierIntegrationEnhancer.getInstance();