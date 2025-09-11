import { storage } from './storage';

export interface SupplierIntegration {
  supplierId: string;
  totalPurchases: number;
  totalSpent: number;
  lastPurchaseDate?: string;
  averageOrderValue: number;
  totalOrders: number;
  totalDebt: number;
  paidAmount: number;
  performance: 'ممتاز' | 'جيد' | 'متوسط' | 'ضعيف';
  reliability: 'عالية' | 'متوسطة' | 'منخفضة';
  avgDeliveryDays: number;
  onTimeDeliveryRate: number;
  qualityRating: number;
  priceCompetitiveness: 'ممتاز' | 'جيد' | 'متوسط' | 'مرتفع';
}

export class SupplierIntegrationManager {
  private static instance: SupplierIntegrationManager;

  static getInstance(): SupplierIntegrationManager {
    if (!SupplierIntegrationManager.instance) {
      SupplierIntegrationManager.instance = new SupplierIntegrationManager();
    }
    return SupplierIntegrationManager.instance;
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
        
        // تحديث المديونية إذا لم يتم الدفع كاملاً
        if (invoiceData.paymentStatus === 'partial') {
          const paidAmount = invoiceData.paidAmount || 0;
          const remainingAmount = invoiceData.total - paidAmount;
          supplier.totalDebt = (supplier.totalDebt || 0) + remainingAmount;
        }
        
        // تحديث تقييم الأداء
        supplier.performance = this.calculateSupplierPerformance(supplier);
        supplier.reliability = this.calculateReliability(supplier);
        
        suppliers[supplierIndex] = supplier;
        storage.setItem('suppliers', suppliers);
      }
    } catch (error) {
      console.error('Error updating supplier on purchase:', error);
    }
  }

  // تحديث تقييم المورد
  updateSupplierRating(supplierId: string, rating: {
    deliveryDays?: number;
    onTime?: boolean;
    qualityRating?: number;
    priceRating?: number;
  }): void {
    try {
      const suppliers = storage.getItem('suppliers', []);
      const supplierIndex = suppliers.findIndex((s: any) => s.id?.toString() === supplierId.toString());
      
      if (supplierIndex !== -1) {
        const supplier = suppliers[supplierIndex];
        
        // تحديث متوسط أيام التسليم
        if (rating.deliveryDays !== undefined) {
          const currentDeliveryDays = supplier.avgDeliveryDays || 0;
          const currentOrders = supplier.totalOrders || 1;
          supplier.avgDeliveryDays = ((currentDeliveryDays * (currentOrders - 1)) + rating.deliveryDays) / currentOrders;
        }
        
        // تحديث معدل التسليم في الوقت المحدد
        if (rating.onTime !== undefined) {
          const currentOnTimeCount = Math.floor((supplier.onTimeDeliveryRate || 0) * (supplier.totalOrders || 1) / 100);
          const newOnTimeCount = rating.onTime ? currentOnTimeCount + 1 : currentOnTimeCount;
          supplier.onTimeDeliveryRate = (newOnTimeCount / (supplier.totalOrders || 1)) * 100;
        }
        
        // تحديث تقييم الجودة
        if (rating.qualityRating !== undefined) {
          const currentQuality = supplier.qualityRating || 0;
          const currentOrders = supplier.totalOrders || 1;
          supplier.qualityRating = ((currentQuality * (currentOrders - 1)) + rating.qualityRating) / currentOrders;
        }
        
        // إعادة حساب التقييمات
        supplier.performance = this.calculateSupplierPerformance(supplier);
        supplier.reliability = this.calculateReliability(supplier);
        supplier.priceCompetitiveness = this.calculatePriceCompetitiveness(supplier);
        
        suppliers[supplierIndex] = supplier;
        storage.setItem('suppliers', suppliers);
      }
    } catch (error) {
      console.error('Error updating supplier rating:', error);
    }
  }

  // حساب أداء المورد
  private calculateSupplierPerformance(supplier: any): 'ممتاز' | 'جيد' | 'متوسط' | 'ضعيف' {
    const onTimeRate = supplier.onTimeDeliveryRate || 0;
    const qualityRating = supplier.qualityRating || 0;
    const avgPerformance = (onTimeRate + (qualityRating * 20)) / 2; // تحويل qualityRating من 5 إلى 100
    
    if (avgPerformance >= 90) return 'ممتاز';
    if (avgPerformance >= 75) return 'جيد';
    if (avgPerformance >= 60) return 'متوسط';
    return 'ضعيف';
  }

  // حساب موثوقية المورد
  private calculateReliability(supplier: any): 'عالية' | 'متوسطة' | 'منخفضة' {
    const onTimeRate = supplier.onTimeDeliveryRate || 0;
    const avgDeliveryDays = supplier.avgDeliveryDays || 0;
    
    if (onTimeRate >= 85 && avgDeliveryDays <= 7) return 'عالية';
    if (onTimeRate >= 70 && avgDeliveryDays <= 14) return 'متوسطة';
    return 'منخفضة';
  }

  // حساب تنافسية الأسعار
  private calculatePriceCompetitiveness(supplier: any): 'ممتاز' | 'جيد' | 'متوسط' | 'مرتفع' {
    // هذا سيتطلب مقارنة مع موردين آخرين - تطبيق مبسط
    const avgOrderValue = supplier.averageOrderValue || 0;
    const totalOrders = supplier.totalOrders || 1;
    
    // حساب مبسط بناءً على حجم الطلبات
    if (avgOrderValue > 5000 && totalOrders >= 10) return 'ممتاز';
    if (avgOrderValue > 2000 && totalOrders >= 5) return 'جيد';
    if (avgOrderValue > 1000) return 'متوسط';
    return 'مرتفع';
  }

  // تحليل أسعار المورد مقارنة بالموردين الآخرين
  analyzeSupplierPricing(supplierId: string): {
    averagePrice: number;
    priceRank: number;
    totalSuppliers: number;
    competitiveAdvantage: string;
  } {
    try {
      const suppliers = storage.getItem('suppliers', []);
      const purchaseInvoices = storage.getItem('purchase_invoices', []);
      
      // حساب متوسط أسعار كل مورد
      const supplierPrices = suppliers.map((supplier: any) => {
        const supplierInvoices = purchaseInvoices.filter((inv: any) => 
          inv.supplierId?.toString() === supplier.id?.toString()
        );
        
        const totalSpent = supplierInvoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);
        const totalOrders = supplierInvoices.length;
        
        return {
          id: supplier.id,
          name: supplier.name,
          averagePrice: totalOrders > 0 ? totalSpent / totalOrders : 0
        };
      }).filter(s => s.averagePrice > 0);
      
      // ترتيب حسب السعر (من الأقل إلى الأعلى)
      supplierPrices.sort((a, b) => a.averagePrice - b.averagePrice);
      
      const targetSupplier = supplierPrices.find(s => s.id?.toString() === supplierId.toString());
      const priceRank = targetSupplier ? supplierPrices.findIndex(s => s.id === targetSupplier.id) + 1 : 0;
      
      let competitiveAdvantage = '';
      if (priceRank <= supplierPrices.length * 0.25) {
        competitiveAdvantage = 'ممتاز - من أقل الأسعار';
      } else if (priceRank <= supplierPrices.length * 0.5) {
        competitiveAdvantage = 'جيد - أسعار تنافسية';
      } else if (priceRank <= supplierPrices.length * 0.75) {
        competitiveAdvantage = 'متوسط - أسعار معقولة';
      } else {
        competitiveAdvantage = 'مرتفع - أسعار أعلى من المنافسين';
      }
      
      return {
        averagePrice: targetSupplier?.averagePrice || 0,
        priceRank,
        totalSuppliers: supplierPrices.length,
        competitiveAdvantage
      };
    } catch (error) {
      console.error('Error analyzing supplier pricing:', error);
      return {
        averagePrice: 0,
        priceRank: 0,
        totalSuppliers: 0,
        competitiveAdvantage: 'غير محدد'
      };
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
        performance: supplier.performance || 'متوسط',
        reliability: supplier.reliability || 'متوسطة',
        avgDeliveryDays: supplier.avgDeliveryDays || 0,
        onTimeDeliveryRate: supplier.onTimeDeliveryRate || 0,
        qualityRating: supplier.qualityRating || 0,
        priceCompetitiveness: supplier.priceCompetitiveness || 'متوسط'
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
        }
        
        // تحديث التقييمات
        supplier.performance = this.calculateSupplierPerformance(supplier);
        supplier.reliability = this.calculateReliability(supplier);
        supplier.priceCompetitiveness = this.calculatePriceCompetitiveness(supplier);
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
        .map((supplier: any) => this.getSupplierIntegratedData(supplier.id))
        .filter(Boolean)
        .sort((a: any, b: any) => {
          // ترتيب حسب الأداء والموثوقية
          const scoreA = (a.onTimeDeliveryRate + (a.qualityRating * 20)) / 2;
          const scoreB = (b.onTimeDeliveryRate + (b.qualityRating * 20)) / 2;
          return scoreB - scoreA;
        })
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting top suppliers:', error);
      return [];
    }
  }

  // الحصول على الموردين المتأخرين في الدفع
  getSuppliersWithDebt() {
    try {
      const suppliers = storage.getItem('suppliers', []);
      return suppliers
        .filter((supplier: any) => (supplier.totalDebt || 0) > 0)
        .map((supplier: any) => this.getSupplierIntegratedData(supplier.id))
        .filter(Boolean)
        .sort((a: any, b: any) => b.totalDebt - a.totalDebt);
    } catch (error) {
      console.error('Error getting suppliers with debt:', error);
      return [];
    }
  }

  // تقرير أداء الموردين
  getSupplierPerformanceReport() {
    try {
      const suppliers = storage.getItem('suppliers', []);
      const integratedData = suppliers
        .map((supplier: any) => this.getSupplierIntegratedData(supplier.id))
        .filter(Boolean);
      
      const totalSuppliers = integratedData.length;
      const excellentSuppliers = integratedData.filter(s => s.performance === 'ممتاز').length;
      const goodSuppliers = integratedData.filter(s => s.performance === 'جيد').length;
      const averageSuppliers = integratedData.filter(s => s.performance === 'متوسط').length;
      const poorSuppliers = integratedData.filter(s => s.performance === 'ضعيف').length;
      
      const avgOnTimeRate = integratedData.reduce((sum, s) => sum + s.onTimeDeliveryRate, 0) / totalSuppliers;
      const avgQualityRating = integratedData.reduce((sum, s) => sum + s.qualityRating, 0) / totalSuppliers;
      const avgDeliveryDays = integratedData.reduce((sum, s) => sum + s.avgDeliveryDays, 0) / totalSuppliers;
      
      return {
        totalSuppliers,
        performanceBreakdown: {
          excellent: excellentSuppliers,
          good: goodSuppliers,
          average: averageSuppliers,
          poor: poorSuppliers
        },
        averageMetrics: {
          onTimeDeliveryRate: avgOnTimeRate || 0,
          qualityRating: avgQualityRating || 0,
          deliveryDays: avgDeliveryDays || 0
        },
        topPerformers: this.getTopSuppliers(5),
        suppliersWithDebt: this.getSuppliersWithDebt()
      };
    } catch (error) {
      console.error('Error generating supplier performance report:', error);
      return null;
    }
  }
}

// Export singleton instance
export const supplierIntegrationManager = SupplierIntegrationManager.getInstance();