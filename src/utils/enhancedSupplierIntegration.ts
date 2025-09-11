import { storage } from './storage';
import { cashFlowManager } from './cashFlowManager';

export interface SupplierProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  totalPurchases: number;
  totalDebt: number;
  creditLimit: number;
  riskLevel: 'low' | 'medium' | 'high';
  lastPurchaseDate: string;
  registrationDate: string;
  status: 'active' | 'inactive' | 'blocked';
  pendingChecksAmount: number;
  overdueInstallmentsAmount: number;
  averageOrderValue: number;
  deliveryRating: number;
  qualityRating: number;
  priceCompetitiveness: number;
  paymentTerms: string;
  paymentHistory: Array<{
    date: string;
    amount: number;
    method: 'cash' | 'check' | 'installment';
    status: 'paid' | 'pending' | 'overdue';
  }>;
}

export class EnhancedSupplierIntegration {
  private static instance: EnhancedSupplierIntegration;

  static getInstance(): EnhancedSupplierIntegration {
    if (!EnhancedSupplierIntegration.instance) {
      EnhancedSupplierIntegration.instance = new EnhancedSupplierIntegration();
    }
    return EnhancedSupplierIntegration.instance;
  }

  // تحديث ملف المورد عند إنشاء فاتورة شراء
  updateSupplierOnPurchase(supplierId: string, purchaseData: any) {
    try {
      const suppliers = storage.getItem('suppliers', []);
      const supplierIndex = suppliers.findIndex((s: any) => s.id === supplierId);
      
      if (supplierIndex !== -1) {
        const supplier = suppliers[supplierIndex];
        
        // تحديث إجمالي المشتريات من المورد
        supplier.totalPurchases = (supplier.totalPurchases || 0) + purchaseData.total;
        
        // تحديث تاريخ آخر شراء
        supplier.lastPurchaseDate = purchaseData.date;
        
        // تحديث متوسط قيمة الطلب
        const purchasesCount = this.getSupplierPurchasesCount(supplierId);
        supplier.averageOrderValue = supplier.totalPurchases / purchasesCount;
        
        // تحديث مستوى المخاطر
        supplier.riskLevel = this.calculateSupplierRiskLevel(supplier);
        
        // إضافة للتاريخ الدفع
        if (!supplier.paymentHistory) supplier.paymentHistory = [];
        supplier.paymentHistory.push({
          date: purchaseData.date,
          amount: purchaseData.total,
          method: purchaseData.paymentMethod || 'cash',
          status: 'paid'
        });
        
        suppliers[supplierIndex] = supplier;
        storage.setItem('suppliers', suppliers);
        
        // تم إزالة الربط مع الصندوق
        // cashFlowManager.addTransaction({
        //   type: 'expense',
        //   amount: purchaseData.total,
        //   description: `مشتريات من المورد: ${supplier.name}`,
        //   category: 'purchases',
        //   paymentMethod: purchaseData.paymentMethod || 'cash',
        //   referenceId: `supplier-${supplierId}`,
        //   date: purchaseData.date
        // });
        
        return supplier;
      }
    } catch (error) {
      console.error('Error updating supplier on purchase:', error);
    }
  }

  // ربط المورد مع الأقساط
  linkSupplierWithInstallments(supplierId: string, installmentData: any) {
    try {
      const suppliers = storage.getItem('suppliers', []);
      const supplierIndex = suppliers.findIndex((s: any) => s.id === supplierId);
      
      if (supplierIndex !== -1) {
        const supplier = suppliers[supplierIndex];
        
        // تحديث المديونية للمورد
        if (installmentData.status === 'pending') {
          supplier.totalDebt = (supplier.totalDebt || 0) + installmentData.amount;
          supplier.overdueInstallmentsAmount = (supplier.overdueInstallmentsAmount || 0) + installmentData.amount;
        }
        
        // إضافة للتاريخ الدفع
        if (!supplier.paymentHistory) supplier.paymentHistory = [];
        supplier.paymentHistory.push({
          date: installmentData.date,
          amount: installmentData.amount,
          method: 'installment',
          status: installmentData.status
        });
        
        suppliers[supplierIndex] = supplier;
        storage.setItem('suppliers', suppliers);
        
        return supplier;
      }
    } catch (error) {
      console.error('Error linking supplier with installments:', error);
    }
  }

  // ربط المورد مع الشيكات
  linkSupplierWithCheck(supplierId: string, checkData: any) {
    try {
      const suppliers = storage.getItem('suppliers', []);
      const supplierIndex = suppliers.findIndex((s: any) => s.id === supplierId);
      
      if (supplierIndex !== -1) {
        const supplier = suppliers[supplierIndex];
        
        // تحديث مبلغ الشيكات المعلقة للمورد
        if (checkData.status === 'pending') {
          supplier.pendingChecksAmount = (supplier.pendingChecksAmount || 0) + checkData.amount;
        }
        
        // إضافة للتاريخ الدفع
        if (!supplier.paymentHistory) supplier.paymentHistory = [];
        supplier.paymentHistory.push({
          date: checkData.dateIssued,
          amount: checkData.amount,
          method: 'check',
          status: checkData.status
        });
        
        suppliers[supplierIndex] = supplier;
        storage.setItem('suppliers', suppliers);
        
        return supplier;
      }
    } catch (error) {
      console.error('Error linking supplier with check:', error);
    }
  }

  // دفع قسط للمورد
  paySupplierInstallment(supplierId: string, installmentId: string, amount: number) {
    try {
      const suppliers = storage.getItem('suppliers', []);
      const supplierIndex = suppliers.findIndex((s: any) => s.id === supplierId);
      
      if (supplierIndex !== -1) {
        const supplier = suppliers[supplierIndex];
        
        // تقليل المديونية
        supplier.totalDebt = Math.max(0, (supplier.totalDebt || 0) - amount);
        supplier.overdueInstallmentsAmount = Math.max(0, (supplier.overdueInstallmentsAmount || 0) - amount);
        
        // تحديث تاريخ الدفع
        const paymentIndex = supplier.paymentHistory?.findIndex(
          (p: any) => p.method === 'installment' && p.amount === amount && p.status === 'pending'
        );
        if (paymentIndex !== -1 && supplier.paymentHistory) {
          supplier.paymentHistory[paymentIndex].status = 'paid';
        }
        
        suppliers[supplierIndex] = supplier;
        storage.setItem('suppliers', suppliers);
        
        // إضافة للتدفق النقدي
        cashFlowManager.addTransaction({
          type: 'expense',
          amount: amount,
          description: `دفع قسط للمورد: ${supplier.name}`,
          category: 'other',
          paymentMethod: 'cash',
          referenceId: `supplier-${supplierId}-installment-${installmentId}`,
          date: new Date().toISOString().split('T')[0]
        });
        
        return supplier;
      }
    } catch (error) {
      console.error('Error paying supplier installment:', error);
    }
  }

  // تقييم أداء المورد
  updateSupplierRating(supplierId: string, deliveryRating: number, qualityRating: number, priceRating: number) {
    try {
      const suppliers = storage.getItem('suppliers', []);
      const supplierIndex = suppliers.findIndex((s: any) => s.id === supplierId);
      
      if (supplierIndex !== -1) {
        const supplier = suppliers[supplierIndex];
        
        // تحديث التقييمات (متوسط التقييمات السابقة مع التقييم الجديد)
        supplier.deliveryRating = supplier.deliveryRating ? 
          (supplier.deliveryRating + deliveryRating) / 2 : deliveryRating;
        supplier.qualityRating = supplier.qualityRating ? 
          (supplier.qualityRating + qualityRating) / 2 : qualityRating;
        supplier.priceCompetitiveness = supplier.priceCompetitiveness ? 
          (supplier.priceCompetitiveness + priceRating) / 2 : priceRating;
        
        suppliers[supplierIndex] = supplier;
        storage.setItem('suppliers', suppliers);
        
        return supplier;
      }
    } catch (error) {
      console.error('Error updating supplier rating:', error);
    }
  }

  // حساب مستوى المخاطر للمورد
  private calculateSupplierRiskLevel(supplier: any): 'low' | 'medium' | 'high' {
    let riskScore = 0;
    
    // المديونية المرتفعة
    const debtRatio = supplier.totalDebt / Math.max(supplier.totalPurchases, 1);
    if (debtRatio > 0.3) riskScore += 2;
    else if (debtRatio > 0.1) riskScore += 1;
    
    // الشيكات المعلقة
    if (supplier.pendingChecksAmount > 20000) riskScore += 2;
    else if (supplier.pendingChecksAmount > 10000) riskScore += 1;
    
    // التقييمات المنخفضة
    const averageRating = (
      (supplier.deliveryRating || 5) + 
      (supplier.qualityRating || 5) + 
      (supplier.priceCompetitiveness || 5)
    ) / 3;
    
    if (averageRating < 3) riskScore += 2;
    else if (averageRating < 4) riskScore += 1;
    
    if (riskScore >= 4) return 'high';
    if (riskScore >= 2) return 'medium';
    return 'low';
  }

  // عدد فواتير الشراء من المورد
  private getSupplierPurchasesCount(supplierId: string): number {
    const purchaseInvoices = storage.getItem('purchase_invoices', [])
      .filter((inv: any) => inv.supplierId === supplierId);
    return Math.max(purchaseInvoices.length, 1);
  }

  // الحصول على ملف المورد الشامل
  getEnhancedSupplierProfile(supplierId: string): SupplierProfile | null {
    try {
      const suppliers = storage.getItem('suppliers', []);
      const supplier = suppliers.find((s: any) => s.id === supplierId);
      
      if (!supplier) return null;
      
      // حساب البيانات المحدثة
      const purchaseInvoices = storage.getItem('purchase_invoices', [])
        .filter((inv: any) => inv.supplierId === supplierId);
      const checks = storage.getItem('checks', [])
        .filter((check: any) => check.supplierId === supplierId);
      const installments = storage.getItem('installments', [])
        .filter((inst: any) => inst.supplierId === supplierId);
      
      return {
        ...supplier,
        totalPurchases: purchaseInvoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0),
        pendingChecksAmount: checks.filter((c: any) => c.status === 'pending')
          .reduce((sum: number, c: any) => sum + c.amount, 0),
        overdueInstallmentsAmount: installments.filter((i: any) => i.status === 'pending')
          .reduce((sum: number, i: any) => sum + i.amount, 0),
        averageOrderValue: purchaseInvoices.length > 0 ? 
          purchaseInvoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0) / purchaseInvoices.length : 0
      };
    } catch (error) {
      console.error('Error getting enhanced supplier profile:', error);
      return null;
    }
  }

  // أفضل الموردين
  getTopSuppliers(limit: number = 10): SupplierProfile[] {
    try {
      const suppliers = storage.getItem('suppliers', []);
      return suppliers
        .map((supplier: any) => this.getEnhancedSupplierProfile(supplier.id))
        .filter(Boolean)
        .sort((a: any, b: any) => {
          // ترتيب حسب التقييم العام ثم المشتريات
          const aRating = ((a.deliveryRating || 5) + (a.qualityRating || 5) + (a.priceCompetitiveness || 5)) / 3;
          const bRating = ((b.deliveryRating || 5) + (b.qualityRating || 5) + (b.priceCompetitiveness || 5)) / 3;
          
          if (Math.abs(aRating - bRating) < 0.5) {
            return b.totalPurchases - a.totalPurchases;
          }
          return bRating - aRating;
        })
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting top suppliers:', error);
      return [];
    }
  }

  // الموردين المتأخرين في الدفع
  getOverdueSuppliers(): SupplierProfile[] {
    try {
      const suppliers = storage.getItem('suppliers', []);
      return suppliers.filter((supplier: any) => 
        supplier.totalDebt > 0 || 
        supplier.overdueInstallmentsAmount > 0 ||
        supplier.riskLevel === 'high'
      ).map((supplier: any) => this.getEnhancedSupplierProfile(supplier.id))
      .filter(Boolean);
    } catch (error) {
      console.error('Error getting overdue suppliers:', error);
      return [];
    }
  }

  // تقرير أداء الموردين
  getSupplierPerformanceReport() {
    try {
      const suppliers = storage.getItem('suppliers', []);
      const enhancedSuppliers = suppliers.map((s: any) => this.getEnhancedSupplierProfile(s.id)).filter(Boolean);
      
      return {
        totalSuppliers: enhancedSuppliers.length,
        averageDeliveryRating: enhancedSuppliers.reduce((sum: number, s: any) => sum + (s.deliveryRating || 5), 0) / enhancedSuppliers.length,
        averageQualityRating: enhancedSuppliers.reduce((sum: number, s: any) => sum + (s.qualityRating || 5), 0) / enhancedSuppliers.length,
        averagePriceRating: enhancedSuppliers.reduce((sum: number, s: any) => sum + (s.priceCompetitiveness || 5), 0) / enhancedSuppliers.length,
        totalPurchaseValue: enhancedSuppliers.reduce((sum: number, s: any) => sum + s.totalPurchases, 0),
        suppliersWithDebt: enhancedSuppliers.filter((s: any) => s.totalDebt > 0).length,
        highRiskSuppliers: enhancedSuppliers.filter((s: any) => s.riskLevel === 'high').length
      };
    } catch (error) {
      console.error('Error getting supplier performance report:', error);
      return null;
    }
  }
}

export const enhancedSupplierIntegration = EnhancedSupplierIntegration.getInstance();