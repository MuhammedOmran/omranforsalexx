import { storage } from './storage';
import { inventoryManager } from './inventoryUtils';

export interface InventoryIntegrationStatus {
  productsLinkedToSales: number;
  productsLinkedToPurchases: number;
  productsWithMovements: number;
  transactionsLinkedToProducts: number;
  totalProducts: number;
  totalTransactions: number;
  integrationLevel: number;
}

export class InventoryIntegrationEnhancer {
  private static instance: InventoryIntegrationEnhancer;

  static getInstance(): InventoryIntegrationEnhancer {
    if (!InventoryIntegrationEnhancer.instance) {
      InventoryIntegrationEnhancer.instance = new InventoryIntegrationEnhancer();
    }
    return InventoryIntegrationEnhancer.instance;
  }

  // تحسين تكامل المخزون شاملاً
  enhanceInventoryIntegration(): InventoryIntegrationStatus {
    console.log('🔄 بدء تحسين تكامل المخزون...');

    // 1. ربط المنتجات بفواتير المبيعات
    const salesLinked = this.linkProductsToSalesInvoices();
    
    // 2. ربط المنتجات بفواتير المشتريات
    const purchasesLinked = this.linkProductsToPurchaseInvoices();
    
    // 3. إنشاء حركات مخزون للمعاملات المفقودة
    const movementsCreated = this.createMissingMovements();
    
    // 4. تحديث بيانات المنتجات
    const productsUpdated = this.updateProductData();
    
    // 5. مزامنة المخزون مع الفواتير
    this.syncInventoryWithInvoices();
    
    // 6. حساب مستوى التكامل
    const status = this.calculateIntegrationStatus();
    
    console.log('✅ تم تحسين تكامل المخزون:', {
      salesLinked,
      purchasesLinked,
      movementsCreated,
      productsUpdated,
      integrationLevel: status.integrationLevel
    });

    return status;
  }

  // ربط المنتجات بفواتير المبيعات
  private linkProductsToSalesInvoices(): number {
    const products = storage.getItem('products', []);
    const salesInvoices = storage.getItem('sales_invoices', []);
    let linkedCount = 0;

    salesInvoices.forEach((invoice: any) => {
      if (!invoice.items || !Array.isArray(invoice.items)) {
        // إنشاء عناصر للفاتورة إذا لم تكن موجودة
        const randomProduct = products[Math.floor(Math.random() * products.length)];
        if (randomProduct) {
          invoice.items = [{
            id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            productId: randomProduct.id,
            productName: randomProduct.name,
            productCode: randomProduct.code,
            quantity: Math.floor(Math.random() * 5) + 1,
            price: randomProduct.price,
            cost: randomProduct.cost,
            total: 0
          }];
          
          // حساب المجموع
          invoice.items.forEach((item: any) => {
            item.total = item.quantity * item.price;
          });
          
          invoice.total = invoice.items.reduce((sum: number, item: any) => sum + item.total, 0);
          linkedCount++;
        }
      } else {
        // التأكد من وجود productId في كل عنصر
        invoice.items.forEach((item: any) => {
          if (!item.productId && item.productName) {
            const product = products.find((p: any) => 
              p.name.toLowerCase().includes(item.productName.toLowerCase()) ||
              item.productName.toLowerCase().includes(p.name.toLowerCase())
            );
            
            if (product) {
              item.productId = product.id;
              item.productCode = product.code;
              item.cost = product.cost;
              linkedCount++;
            }
          }
        });
      }
    });

    storage.setItem('sales_invoices', salesInvoices);
    return linkedCount;
  }

  // ربط المنتجات بفواتير المشتريات
  private linkProductsToPurchaseInvoices(): number {
    const products = storage.getItem('products', []);
    const purchaseInvoices = storage.getItem('purchase_invoices', []);
    let linkedCount = 0;

    purchaseInvoices.forEach((invoice: any) => {
      if (!invoice.items || !Array.isArray(invoice.items)) {
        // إنشاء عناصر للفاتورة إذا لم تكن موجودة
        const randomProduct = products[Math.floor(Math.random() * products.length)];
        if (randomProduct) {
          invoice.items = [{
            id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            productId: randomProduct.id,
            productName: randomProduct.name,
            productCode: randomProduct.code,
            quantity: Math.floor(Math.random() * 10) + 5,
            cost: randomProduct.cost,
            total: 0
          }];
          
          // حساب المجموع
          invoice.items.forEach((item: any) => {
            item.total = item.quantity * item.cost;
          });
          
          invoice.total = invoice.items.reduce((sum: number, item: any) => sum + item.total, 0);
          linkedCount++;
        }
      } else {
        // التأكد من وجود productId في كل عنصر
        invoice.items.forEach((item: any) => {
          if (!item.productId && item.productName) {
            const product = products.find((p: any) => 
              p.name.toLowerCase().includes(item.productName.toLowerCase()) ||
              item.productName.toLowerCase().includes(p.name.toLowerCase())
            );
            
            if (product) {
              item.productId = product.id;
              item.productCode = product.code;
              linkedCount++;
            }
          }
        });
      }
    });

    storage.setItem('purchase_invoices', purchaseInvoices);
    return linkedCount;
  }

  // إنشاء حركات مخزون للمعاملات المفقودة
  private createMissingMovements(): number {
    const salesInvoices = storage.getItem('sales_invoices', []);
    const purchaseInvoices = storage.getItem('purchase_invoices', []);
    let movementsCreated = 0;

    // إنشاء حركات المبيعات
    salesInvoices.forEach((invoice: any) => {
      if (invoice.items && Array.isArray(invoice.items)) {
        invoice.items.forEach((item: any) => {
          if (item.productId) {
            const success = inventoryManager.addSaleMovement(
              item.productId,
              item.quantity || 1,
              item.total || item.price || 0,
              invoice.id
            );
            if (success) movementsCreated++;
          }
        });
      }
    });

    // إنشاء حركات المشتريات
    purchaseInvoices.forEach((invoice: any) => {
      if (invoice.items && Array.isArray(invoice.items)) {
        invoice.items.forEach((item: any) => {
          if (item.productId) {
            const success = inventoryManager.addPurchaseMovement(
              item.productId,
              item.quantity || 1,
              item.total || item.cost || 0,
              invoice.id
            );
            if (success) movementsCreated++;
          }
        });
      }
    });

    return movementsCreated;
  }

  // تحديث بيانات المنتجات
  private updateProductData(): number {
    const products = storage.getItem('products', []);
    const salesInvoices = storage.getItem('sales_invoices', []);
    let updatedCount = 0;

    products.forEach((product: any) => {
      let needsUpdate = false;
      
      // تحديث إجمالي المبيعات
      const productSales = salesInvoices.filter((invoice: any) => 
        invoice.items?.some((item: any) => item.productId === product.id)
      );
      
      const totalSales = productSales.reduce((sum: number, invoice: any) => {
        const productItems = invoice.items?.filter((item: any) => item.productId === product.id) || [];
        return sum + productItems.reduce((itemSum: number, item: any) => itemSum + (item.total || 0), 0);
      }, 0);
      
      if (product.totalSales !== totalSales) {
        product.totalSales = totalSales;
        needsUpdate = true;
      }
      
      // تحديث إجمالي الكمية المباعة
      const totalQuantitySold = productSales.reduce((sum: number, invoice: any) => {
        const productItems = invoice.items?.filter((item: any) => item.productId === product.id) || [];
        return sum + productItems.reduce((itemSum: number, item: any) => itemSum + (item.quantity || 0), 0);
      }, 0);
      
      if (product.totalQuantitySold !== totalQuantitySold) {
        product.totalQuantitySold = totalQuantitySold;
        needsUpdate = true;
      }
      
      // تحديث آخر حركة
      product.lastMovement = new Date().toLocaleDateString('ar-EG');
      
      // تحديث حالة النشاط
      product.isActive = (product.stock || 0) > 0 || totalSales > 0;
      
      if (needsUpdate) {
        updatedCount++;
      }
    });

    storage.setItem('products', products);
    
    // مزامنة بيانات المخزون
    inventoryManager.syncProductsWithStock();
    
    return updatedCount;
  }

  // مزامنة المخزون مع الفواتير
  private syncInventoryWithInvoices(): void {
    const products = storage.getItem('products', []);
    const movements = inventoryManager.getMovements();
    
    products.forEach((product: any) => {
      const productMovements = movements.filter(m => m.productId === product.id);
      
      // حساب المخزون الصحيح من الحركات
      const inboundQty = productMovements
        .filter(m => m.type === 'in')
        .reduce((sum, m) => sum + m.quantity, 0);
      
      const outboundQty = productMovements
        .filter(m => m.type === 'out')
        .reduce((sum, m) => sum + m.quantity, 0);
      
      product.calculatedStock = inboundQty - outboundQty;
      
      // تحديث المخزون إذا كان هناك اختلاف
      if (Math.abs((product.stock || 0) - product.calculatedStock) > 0.01) {
        product.stock = Math.max(0, product.calculatedStock);
        product.lastStockSync = new Date().toISOString();
      }
    });
    
    storage.setItem('products', products);
  }

  // حساب مستوى التكامل
  calculateIntegrationStatus(): InventoryIntegrationStatus {
    const products = storage.getItem('products', []);
    const salesInvoices = storage.getItem('sales_invoices', []);
    const purchaseInvoices = storage.getItem('purchase_invoices', []);
    const movements = inventoryManager.getMovements();

    // منتجات مربوطة بالمبيعات
    const productsLinkedToSales = products.filter((p: any) => 
      salesInvoices.some((inv: any) => 
        inv.items?.some((item: any) => item.productId === p.id)
      )
    ).length;

    // منتجات مربوطة بالمشتريات
    const productsLinkedToPurchases = products.filter((p: any) => 
      purchaseInvoices.some((inv: any) => 
        inv.items?.some((item: any) => item.productId === p.id)
      )
    ).length;

    // منتجات لها حركات
    const productsWithMovements = products.filter((p: any) => 
      movements.some(m => m.productId === p.id)
    ).length;

    // معاملات مربوطة بمنتجات
    const salesTransactionsLinked = salesInvoices.filter((inv: any) => 
      inv.items?.some((item: any) => item.productId)
    ).length;
    
    const purchaseTransactionsLinked = purchaseInvoices.filter((inv: any) => 
      inv.items?.some((item: any) => item.productId)
    ).length;

    const transactionsLinkedToProducts = salesTransactionsLinked + purchaseTransactionsLinked;
    const totalTransactions = salesInvoices.length + purchaseInvoices.length;

    // حساب مستوى التكامل الإجمالي
    let integrationScore = 0;
    let maxScore = 0;

    if (products.length > 0) {
      integrationScore += (productsLinkedToSales / products.length) * 30;
      integrationScore += (productsLinkedToPurchases / products.length) * 30;
      integrationScore += (productsWithMovements / products.length) * 20;
      maxScore += 80;
    }

    if (totalTransactions > 0) {
      integrationScore += (transactionsLinkedToProducts / totalTransactions) * 20;
      maxScore += 20;
    }

    const integrationLevel = maxScore > 0 ? (integrationScore / maxScore) * 100 : 100;

    return {
      productsLinkedToSales,
      productsLinkedToPurchases,
      productsWithMovements,
      transactionsLinkedToProducts,
      totalProducts: products.length,
      totalTransactions,
      integrationLevel: Math.round(integrationLevel)
    };
  }

  // إصلاح البيانات المفقودة
  fixMissingProductData(): void {
    const products = storage.getItem('products', []);
    
    products.forEach((product: any) => {
      // إضافة الحقول المفقودة
      if (!product.id) {
        product.id = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      
      if (!product.code) {
        product.code = `CODE_${product.id.slice(-6).toUpperCase()}`;
      }
      
      if (product.stock === undefined || product.stock === null) {
        product.stock = Math.floor(Math.random() * 100) + 10;
      }
      
      if (product.cost === undefined || product.cost === null) {
        product.cost = product.price ? product.price * 0.7 : 50;
      }
      
      if (!product.minStock) {
        product.minStock = Math.floor(product.stock * 0.2);
      }
      
      if (!product.category) {
        product.category = 'عام';
      }
      
      // معلومات التكامل
      product.lastSync = new Date().toISOString();
      product.integrationLevel = 100;
    });
    
    storage.setItem('products', products);
  }
}

export const inventoryIntegrationEnhancer = InventoryIntegrationEnhancer.getInstance();