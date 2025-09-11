import { inventoryManager } from '@/utils/inventoryUtils';
import { storage } from '@/utils/storage';
import { Investor, InvestorPurchase, InvestorSale } from '@/contexts/InvestorContext';

export interface IntegratedSaleItem {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  price: number;
  cost: number;
  total: number;
}

export interface IntegratedInvoice {
  id: string;
  customerName: string;
  date: string;
  items: IntegratedSaleItem[];
  total: number;
  status: 'paid' | 'pending' | 'cancelled';
  paymentMethod: string;
}

export interface IntegratedPurchaseItem {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  cost: number;
  total: number;
}

export interface IntegratedPurchaseInvoice {
  id: string;
  supplier: string;
  date: string;
  items: IntegratedPurchaseItem[];
  total: number;
  status: 'paid' | 'pending' | 'cancelled';
}

export class BusinessIntegrationManager {
  private static instance: BusinessIntegrationManager;

  static getInstance(): BusinessIntegrationManager {
    if (!BusinessIntegrationManager.instance) {
      BusinessIntegrationManager.instance = new BusinessIntegrationManager();
    }
    return BusinessIntegrationManager.instance;
  }

  // Process a sales invoice and update inventory
  processSalesInvoice(invoice: IntegratedInvoice): boolean {
    try {
      if (invoice.status !== 'paid') {
        return true; // Don't update inventory for unpaid invoices
      }

      // Update inventory for each item sold
      for (const item of invoice.items) {
        const success = inventoryManager.addSaleMovement(
          item.productId,
          item.quantity,
          item.total,
          invoice.id
        );
        
        if (!success) {
          console.error(`Failed to update inventory for product ${item.productId}`);
          return false;
        }
      }

      // Update customer purchase history
      this.updateCustomerHistory(invoice);

      return true;
    } catch (error) {
      console.error('Error processing sales invoice:', error);
      return false;
    }
  }

  // Process a purchase invoice and update inventory
  processPurchaseInvoice(invoice: IntegratedPurchaseInvoice): boolean {
    try {
      if (invoice.status !== 'paid') {
        return true; // Don't update inventory for unpaid invoices
      }

      // Update inventory for each item purchased
      for (const item of invoice.items) {
        const success = inventoryManager.addPurchaseMovement(
          item.productId,
          item.quantity,
          item.total,
          invoice.id
        );
        
        if (!success) {
          console.error(`Failed to update inventory for product ${item.productId}`);
          return false;
        }
      }

      // Update supplier purchase history
      this.updateSupplierHistory(invoice);

      return true;
    } catch (error) {
      console.error('Error processing purchase invoice:', error);
      return false;
    }
  }

  // Convert legacy sale invoice to integrated format
  convertLegacySaleInvoice(legacyInvoice: any): IntegratedInvoice | null {
    try {
      const products = inventoryManager.getProducts();
      
      const integratedItems: IntegratedSaleItem[] = [];
      
      if (legacyInvoice.itemsDetails && Array.isArray(legacyInvoice.itemsDetails)) {
        for (const item of legacyInvoice.itemsDetails) {
          // Find matching product by name
          const product = products.find(p => p.name === item.productName);
          
          if (product) {
            integratedItems.push({
              id: item.id,
              productId: product.id,
              productName: item.productName,
              productCode: product.code,
              quantity: item.quantity,
              price: item.price,
              cost: item.cost || product.cost,
              total: item.total
            });
          }
        }
      }

      return {
        id: legacyInvoice.id,
        customerName: legacyInvoice.customerName,
        date: legacyInvoice.date,
        items: integratedItems,
        total: legacyInvoice.total,
        status: legacyInvoice.paymentStatus === 'paid' ? 'paid' : 
                legacyInvoice.paymentStatus === 'pending' ? 'pending' : 'cancelled',
        paymentMethod: legacyInvoice.paymentMethod
      };
    } catch (error) {
      console.error('Error converting legacy sale invoice:', error);
      return null;
    }
  }

  // Convert legacy purchase invoice to integrated format
  convertLegacyPurchaseInvoice(legacyInvoice: any): IntegratedPurchaseInvoice | null {
    try {
      const products = inventoryManager.getProducts();
      
      const integratedItems: IntegratedPurchaseItem[] = [];
      
      // Handle different legacy purchase invoice formats
      if (legacyInvoice.items && Array.isArray(legacyInvoice.items)) {
        // New format with items array
        for (const item of legacyInvoice.items) {
          const product = products.find(p => p.name === item.productName || p.id === item.productId);
          
          if (product) {
            integratedItems.push({
              id: item.id || Date.now().toString(),
              productId: product.id,
              productName: item.productName || product.name,
              productCode: product.code,
              quantity: item.quantity || 1,
              cost: item.cost || (item.total / item.quantity) || product.cost,
              total: item.total || (item.quantity * item.cost)
            });
          }
        }
      } else if (legacyInvoice.productName) {
        // Old format with single product
        const product = products.find(p => p.name === legacyInvoice.productName);
        
        if (product) {
          integratedItems.push({
            id: Date.now().toString(),
            productId: product.id,
            productName: legacyInvoice.productName,
            productCode: product.code,
            quantity: legacyInvoice.quantity || 1,
            cost: legacyInvoice.total / (legacyInvoice.quantity || 1),
            total: legacyInvoice.total
          });
        }
      }

      return {
        id: legacyInvoice.id,
        supplier: legacyInvoice.supplier,
        date: legacyInvoice.date instanceof Date ? legacyInvoice.date.toISOString() : legacyInvoice.date,
        items: integratedItems,
        total: legacyInvoice.total,
        status: legacyInvoice.status === 'paid' ? 'paid' : 
                legacyInvoice.status === 'pending' ? 'pending' : 'cancelled'
      };
    } catch (error) {
      console.error('Error converting legacy purchase invoice:', error);
      return null;
    }
  }

  // Update customer purchase history
  private updateCustomerHistory(invoice: IntegratedInvoice): void {
    try {
      const customers = storage.getItem('customers', []);
      const customerIndex = customers.findIndex((c: any) => c.name === invoice.customerName);
      
      if (customerIndex !== -1) {
        customers[customerIndex].totalOrders = (customers[customerIndex].totalOrders || 0) + 1;
        customers[customerIndex].totalSpent = (customers[customerIndex].totalSpent || 0) + invoice.total;
        customers[customerIndex].lastOrderDate = invoice.date;
        
        storage.setItem('customers', customers);
      }
    } catch (error) {
      console.error('Error updating customer history:', error);
    }
  }

  // Update supplier purchase history
  private updateSupplierHistory(invoice: IntegratedPurchaseInvoice): void {
    try {
      const suppliers = storage.getItem('suppliers', []);
      let supplierIndex = suppliers.findIndex((s: any) => s.name === invoice.supplier);
      
      if (supplierIndex === -1) {
        // Create new supplier
        suppliers.push({
          id: Date.now().toString(),
          name: invoice.supplier,
          totalOrders: 1,
          totalSpent: invoice.total,
          lastOrderDate: invoice.date
        });
      } else {
        suppliers[supplierIndex].totalOrders = (suppliers[supplierIndex].totalOrders || 0) + 1;
        suppliers[supplierIndex].totalSpent = (suppliers[supplierIndex].totalSpent || 0) + invoice.total;
        suppliers[supplierIndex].lastOrderDate = invoice.date;
      }
      
      storage.setItem('suppliers', suppliers);
    } catch (error) {
      console.error('Error updating supplier history:', error);
    }
  }

  // Process all existing invoices to update inventory
  migrateExistingData(): { salesProcessed: number; purchasesProcessed: number; errors: string[] } {
    const errors: string[] = [];
    let salesProcessed = 0;
    let purchasesProcessed = 0;

    try {
      // Process existing sales invoices
      const salesInvoices = storage.getItem('sales_invoices', []);
      for (const invoice of salesInvoices) {
        const integratedInvoice = this.convertLegacySaleInvoice(invoice);
        if (integratedInvoice && integratedInvoice.items.length > 0) {
          if (this.processSalesInvoice(integratedInvoice)) {
            salesProcessed++;
          } else {
            errors.push(`Failed to process sales invoice ${invoice.id}`);
          }
        }
      }

      // Process existing purchase invoices
      const purchaseInvoices = storage.getItem('purchase_invoices', []);
      for (const invoice of purchaseInvoices) {
        const integratedPurchaseInvoice = this.convertLegacyPurchaseInvoice(invoice);
        if (integratedPurchaseInvoice && integratedPurchaseInvoice.items.length > 0) {
          if (this.processPurchaseInvoice(integratedPurchaseInvoice)) {
            purchasesProcessed++;
          } else {
            errors.push(`Failed to process purchase invoice ${invoice.id}`);
          }
        }
      }

      // Sync inventory data
      inventoryManager.syncProductsWithStock();

    } catch (error) {
      errors.push(`Migration error: ${error.message}`);
    }

    return { salesProcessed, purchasesProcessed, errors };
  }

  // Get integrated business analytics
  getBusinessAnalytics() {
    try {
      // تحقق من وجود inventoryManager ودوالها
      if (!inventoryManager || typeof inventoryManager.getProducts !== 'function') {
        console.warn('inventoryManager غير متوفر أو غير مهيأ بشكل صحيح');
        return this.getDefaultAnalytics();
      }

      const products = inventoryManager.getProducts() || [];
      const movements = inventoryManager.getMovements ? inventoryManager.getMovements() || [] : [];
      
      // Calculate sales analytics مع حماية من الأخطاء
      const salesMovements = movements.filter(m => m && m.type === 'out' && m.referenceType === 'sale') || [];
      const purchaseMovements = movements.filter(m => m && m.type === 'in' && m.referenceType === 'purchase') || [];
      
      const totalSalesRevenue = salesMovements.reduce((sum, m) => sum + (m.value || 0), 0);
      const totalPurchaseCosts = purchaseMovements.reduce((sum, m) => sum + (m.value || 0), 0);
      const grossProfit = totalSalesRevenue - totalPurchaseCosts;
      
      // Get low stock alerts مع حماية من الأخطاء
      let lowStockProducts = [];
      let outOfStockProducts = [];
      
      try {
        lowStockProducts = inventoryManager.getLowStockProducts ? inventoryManager.getLowStockProducts() || [] : [];
        outOfStockProducts = inventoryManager.getOutOfStockProducts ? inventoryManager.getOutOfStockProducts() || [] : [];
      } catch (error) {
        console.warn('خطأ في الحصول على تنبيهات المخزون:', error);
      }

      // Get top selling products مع حماية من الأخطاء
      let topSellingProducts = [];
      try {
        topSellingProducts = this.getTopSellingProducts();
      } catch (error) {
        console.warn('خطأ في الحصول على أفضل المنتجات مبيعاً:', error);
        topSellingProducts = [];
      }
      
      return {
        totalProducts: products.length,
        totalMovements: movements.length,
        salesRevenue: totalSalesRevenue,
        purchaseCosts: totalPurchaseCosts,
        grossProfit,
        grossProfitMargin: totalSalesRevenue > 0 ? (grossProfit / totalSalesRevenue) * 100 : 0,
        lowStockAlerts: lowStockProducts.length,
        outOfStockAlerts: outOfStockProducts.length,
        topSellingProducts,
        recentActivity: movements.slice(-10).reverse()
      };
    } catch (error) {
      console.error('خطأ في الحصول على تحليلات الأعمال:', error);
      return this.getDefaultAnalytics();
    }
  }

  // إرجاع بيانات افتراضية في حالة الخطأ
  private getDefaultAnalytics() {
    return {
      totalProducts: 0,
      totalMovements: 0,
      salesRevenue: 0,
      purchaseCosts: 0,
      grossProfit: 0,
      grossProfitMargin: 0,
      lowStockAlerts: 0,
      outOfStockAlerts: 0,
      topSellingProducts: [],
      recentActivity: []
    };
  }

  // Get top selling products
  private getTopSellingProducts() {
    try {
      if (!inventoryManager || typeof inventoryManager.getMovements !== 'function') {
        return [];
      }

      const movements = inventoryManager.getMovements() || [];
      const salesMovements = movements.filter(m => m && m.type === 'out' && m.referenceType === 'sale') || [];
      
      const productSales: { [key: string]: { quantity: number; revenue: number; name: string } } = {};
      
      for (const movement of salesMovements) {
        if (movement && movement.productId) {
          if (!productSales[movement.productId]) {
            productSales[movement.productId] = {
              quantity: 0,
              revenue: 0,
              name: movement.productName || 'منتج غير محدد'
            };
          }
          
          productSales[movement.productId].quantity += movement.quantity || 0;
          productSales[movement.productId].revenue += movement.value || 0;
        }
      }
      
      return Object.entries(productSales)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);
    } catch (error) {
      console.warn('خطأ في الحصول على أفضل المنتجات مبيعاً:', error);
      return [];
    }
  }

  // Check stock before sale
  checkStockAvailability(productId: string, requestedQuantity: number): { available: boolean; currentStock: number; message: string } {
    const products = inventoryManager.getProducts();
    const product = products.find(p => p.id === productId);
    
    if (!product) {
      return {
        available: false,
        currentStock: 0,
        message: 'المنتج غير موجود'
      };
    }
    
    if (product.stock < requestedQuantity) {
      return {
        available: false,
        currentStock: product.stock,
        message: `الكمية المتاحة: ${product.stock}، الكمية المطلوبة: ${requestedQuantity}`
      };
    }
    
    return {
      available: true,
      currentStock: product.stock,
      message: 'الكمية متاحة'
    };
  }

  // Process investor purchase and update inventory
  processInvestorPurchase(purchase: InvestorPurchase): boolean {
    try {
      // Find or create product
      const products = inventoryManager.getProducts();
      let productId = purchase.productType;
      
      // Check if productType is actually a product name, not ID
      const existingProduct = products.find(p => p.name === purchase.productType || p.id === purchase.productType);
      if (existingProduct) {
        productId = existingProduct.id;
      } else {
        // Create new product if it doesn't exist
        const newProduct = {
          id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          name: purchase.productType,
          code: `CODE_${Date.now()}`,
          category: 'استثمار',
          cost: purchase.totalCost / purchase.quantity,
          price: purchase.totalCost / purchase.quantity * 1.2, // 20% markup
          stock: 0,
          minStock: 5,
          status: 'active' as const,
          description: `منتج من استثمار ${purchase.investorId}`,
          ownerId: purchase.investorId,
          ownerType: 'investor' as const
        };
        
        const updatedProducts = [...products, newProduct];
        storage.setItem('products', updatedProducts);
        productId = newProduct.id;
      }

      // Add movement to inventory
      const success = inventoryManager.addInvestorPurchaseMovement(
        productId,
        purchase.quantity,
        purchase.totalCost,
        purchase.investorId,
        purchase.id
      );

      if (success) {
        // Update investor remaining amount
        this.updateInvestorRemainingAmount(purchase.investorId, -purchase.totalCost);
      }

      return success;
    } catch (error) {
      console.error('Error processing investor purchase:', error);
      return false;
    }
  }

  // Process investor sale and update inventory
  processInvestorSale(sale: InvestorSale): boolean {
    try {
      // Get the original purchase to find product details
      const purchases = storage.getItem('investor_purchases', []);
      const originalPurchase = purchases.find((p: InvestorPurchase) => p.id === sale.purchaseId);
      
      if (!originalPurchase) {
        console.error('Original purchase not found for sale:', sale.id);
        return false;
      }

      // Find the actual product ID
      const products = inventoryManager.getProducts();
      let productId = originalPurchase.productType;
      
      const existingProduct = products.find(p => p.name === originalPurchase.productType || p.id === originalPurchase.productType);
      if (existingProduct) {
        productId = existingProduct.id;
      }

      // Add sale movement to inventory
      const success = inventoryManager.addInvestorSaleMovement(
        productId,
        sale.quantitySold,
        sale.quantitySold * sale.sellingPrice,
        sale.investorId,
        sale.id
      );

      if (success) {
        // Update investor remaining amount with the sale proceeds
        this.updateInvestorRemainingAmount(sale.investorId, sale.quantitySold * sale.sellingPrice);
      }

      return success;
    } catch (error) {
      console.error('Error processing investor sale:', error);
      return false;
    }
  }

  // Update investor remaining amount
  private updateInvestorRemainingAmount(investorId: string, amount: number): void {
    try {
      const investors = storage.getItem('investors', []);
      const investorIndex = investors.findIndex((inv: Investor) => inv.id === investorId);
      
      if (investorIndex !== -1) {
        investors[investorIndex].remainingAmount = (investors[investorIndex].remainingAmount || 0) + amount;
        storage.setItem('investors', investors);
      }
    } catch (error) {
      console.error('Error updating investor remaining amount:', error);
    }
  }

  // Get investor analytics
  getInvestorAnalytics(investorId: string) {
    try {
      const investorProducts = inventoryManager.getInvestorProducts(investorId);
      const investorMovements = inventoryManager.getInvestorMovements(investorId);
      const salesMovements = inventoryManager.getInvestorSalesMovements(investorId);
      const purchaseMovements = inventoryManager.getInvestorPurchaseMovements(investorId);
      
      const totalInvestment = purchaseMovements.reduce((sum, m) => sum + m.value, 0);
      const totalSales = salesMovements.reduce((sum, m) => sum + m.value, 0);
      const currentStockValue = inventoryManager.calculateInvestorStockValue(investorId);
      const totalProfit = totalSales - totalInvestment;
      
      return {
        totalInvestment,
        totalSales,
        totalProfit,
        profitMargin: totalSales > 0 ? (totalProfit / totalSales) * 100 : 0,
        currentStockValue,
        totalProducts: investorProducts.length,
        totalMovements: investorMovements.length,
        recentMovements: investorMovements.slice(-5).reverse()
      };
    } catch (error) {
      console.error('Error getting investor analytics:', error);
      return null;
    }
  }

  // Migrate existing investor data to new system
  migrateInvestorData(): { processed: number; errors: string[] } {
    const errors: string[] = [];
    let processed = 0;

    try {
      // Process existing investor purchases
      const purchases = storage.getItem('investor_purchases', []);
      for (const purchase of purchases) {
        if (this.processInvestorPurchase(purchase)) {
          processed++;
        } else {
          errors.push(`Failed to process investor purchase ${purchase.id}`);
        }
      }

      // Process existing investor sales
      const sales = storage.getItem('investor_sales', []);
      for (const sale of sales) {
        if (this.processInvestorSale(sale)) {
          processed++;
        } else {
          errors.push(`Failed to process investor sale ${sale.id}`);
        }
      }

    } catch (error) {
      errors.push(`Migration error: ${error.message}`);
    }

    return { processed, errors };
  }
}

// Export singleton instance
export const businessIntegration = BusinessIntegrationManager.getInstance();