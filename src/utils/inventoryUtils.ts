import { Product, InventoryMovement, StockAnalysis } from '@/types/inventory';
import { storage } from './storage';

export class InventoryManager {
  private static instance: InventoryManager;

  static getInstance(): InventoryManager {
    if (!InventoryManager.instance) {
      InventoryManager.instance = new InventoryManager();
    }
    return InventoryManager.instance;
  }

  // Get all products
  getProducts(): Product[] {
    return storage.getItem<Product[]>('products', []);
  }

  // Get all inventory movements
  getMovements(): InventoryMovement[] {
    return storage.getItem<InventoryMovement[]>('inventoryMovements', []);
  }

  // Add a new inventory movement
  addMovement(movement: Omit<InventoryMovement, 'id'>): boolean {
    try {
      const movements = this.getMovements();
      const newMovement: InventoryMovement = {
        ...movement,
        id: `mov_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      movements.push(newMovement);
      storage.setItem('inventoryMovements', movements);

      // Update product stock
      this.updateProductStock(movement.productId, movement.type, movement.quantity);

      return true;
    } catch (error) {
      console.error('Error adding inventory movement:', error);
      return false;
    }
  }

  // Update product stock
  private updateProductStock(productId: string, type: 'in' | 'out', quantity: number): void {
    const products = this.getProducts();
    const productIndex = products.findIndex(p => p.id === productId);
    
    if (productIndex !== -1) {
      const product = products[productIndex];
      if (type === 'in') {
        product.stock += quantity;
      } else {
        product.stock = Math.max(0, product.stock - quantity);
      }
      
      storage.setItem('products', products);
    }
  }

  // Get movements for a specific product
  getProductMovements(productId: string): InventoryMovement[] {
    const movements = this.getMovements();
    return movements.filter(m => m.productId === productId);
  }

  // Get movements for a date range
  getMovementsByDateRange(startDate: string, endDate: string): InventoryMovement[] {
    const movements = this.getMovements();
    return movements.filter(m => {
      const movementDate = new Date(m.date).getTime();
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      return movementDate >= start && movementDate <= end;
    });
  }

  // Calculate stock analysis
  calculateStockAnalysis(): StockAnalysis[] {
    const products = this.getProducts();
    const movements = this.getMovements();
    
    return products.map(product => {
      const productMovements = movements.filter(m => m.productId === product.id);
      
      // Calculate average movement (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentMovements = productMovements.filter(m => 
        new Date(m.date) >= thirtyDaysAgo
      );
      
      const outboundMovements = recentMovements.filter(m => m.type === 'out');
      const avgMovement = outboundMovements.length > 0 
        ? outboundMovements.reduce((sum, m) => sum + m.quantity, 0) / 30
        : 0;

      // Calculate turnover rate (movements per month)
      const turnoverRate = avgMovement > 0 ? (avgMovement * 30) / Math.max(product.stock, 1) : 0;
      
      // Calculate days to stockout
      const daysToStockout = avgMovement > 0 ? product.stock / avgMovement : 999;
      
      // Get last movement date
      const lastMovement = productMovements.length > 0 
        ? productMovements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
        : null;

      return {
        productId: product.id,
        productName: product.name,
        code: product.code,
        category: product.category,
        currentStock: product.stock,
        avgMovement: Math.round(avgMovement * 100) / 100,
        turnoverRate: Math.round(turnoverRate * 100) / 100,
        daysToStockout: Math.round(daysToStockout),
        reorderPoint: product.minStock,
        stockValue: product.stock * product.cost,
        lastMovementDate: lastMovement ? lastMovement.date : 'لا توجد حركات'
      };
    });
  }

  // Get low stock products
  getLowStockProducts(): Product[] {
    const products = this.getProducts();
    return products.filter(p => p.stock <= p.minStock && p.stock > 0);
  }

  // Get out of stock products
  getOutOfStockProducts(): Product[] {
    const products = this.getProducts();
    return products.filter(p => p.stock === 0);
  }

  // Get movement statistics for a period
  getMovementStats(startDate: string, endDate: string) {
    const movements = this.getMovementsByDateRange(startDate, endDate);
    
    const inboundMovements = movements.filter(m => m.type === 'in');
    const outboundMovements = movements.filter(m => m.type === 'out');
    
    return {
      totalMovements: movements.length,
      inboundCount: inboundMovements.length,
      outboundCount: outboundMovements.length,
      inboundValue: inboundMovements.reduce((sum, m) => sum + m.value, 0),
      outboundValue: outboundMovements.reduce((sum, m) => sum + m.value, 0),
      totalValue: movements.reduce((sum, m) => sum + m.value, 0),
      movements: movements
    };
  }

  // Sync product data with stock data
  syncProductsWithStock(): void {
    const products = this.getProducts();
    const stockData = products.map(product => ({
      id: product.id,
      name: product.name,
      code: product.code,
      category: product.category,
      currentStock: product.stock,
      minStock: product.minStock,
      maxStock: product.minStock * 5, // Estimate max stock as 5x min stock
      cost: product.cost,
      value: product.stock * product.cost,
      lastMovement: new Date().toLocaleDateString('ar-EG'),
      movementType: 'in' as const
    }));
    
    storage.setItem('stockData', stockData);
  }

  // Add movement from sales
  addSaleMovement(productId: string, quantity: number, saleValue: number, invoiceId: string, ownerId?: string, ownerType?: "investor" | "company"): boolean {
    const products = this.getProducts();
    const product = products.find(p => p.id === productId);
    
    if (!product) return false;

    return this.addMovement({
      productId,
      productName: product.name,
      code: product.code,
      type: 'out',
      quantity,
      date: new Date().toISOString(),
      reason: 'بيع',
      value: saleValue,
      referenceType: 'sale',
      referenceId: invoiceId,
      notes: `بيع من فاتورة رقم ${invoiceId}`,
      ownerId,
      ownerType
    });
  }

  // Add movement from purchases
  addPurchaseMovement(productId: string, quantity: number, purchaseValue: number, invoiceId: string, ownerId?: string, ownerType?: "investor" | "company"): boolean {
    const products = this.getProducts();
    const product = products.find(p => p.id === productId);
    
    if (!product) return false;

    return this.addMovement({
      productId,
      productName: product.name,
      code: product.code,
      type: 'in',
      quantity,
      date: new Date().toISOString(),
      reason: 'شراء',
      value: purchaseValue,
      referenceType: 'purchase',
      referenceId: invoiceId,
      notes: `شراء من فاتورة رقم ${invoiceId}`,
      ownerId,
      ownerType
    });
  }

  // Manual stock adjustment
  addStockAdjustment(productId: string, quantity: number, reason: string, type: 'in' | 'out'): boolean {
    const products = this.getProducts();
    const product = products.find(p => p.id === productId);
    
    if (!product) return false;

    return this.addMovement({
      productId,
      productName: product.name,
      code: product.code,
      type,
      quantity,
      date: new Date().toISOString(),
      reason,
      value: quantity * product.cost,
      referenceType: 'adjustment',
      notes: `تعديل يدوي: ${reason}`
    });
  }

  // Get products owned by a specific investor
  getInvestorProducts(investorId: string): Product[] {
    const products = this.getProducts();
    return products.filter(p => p.ownerId === investorId && p.ownerType === 'investor');
  }

  // Get company owned products
  getCompanyProducts(): Product[] {
    const products = this.getProducts();
    return products.filter(p => p.ownerType === 'company' || !p.ownerType);
  }

  // Get movements for a specific investor
  getInvestorMovements(investorId: string): InventoryMovement[] {
    const movements = this.getMovements();
    return movements.filter(m => m.ownerId === investorId && m.ownerType === 'investor');
  }

  // Calculate investor stock value
  calculateInvestorStockValue(investorId: string): number {
    const investorProducts = this.getInvestorProducts(investorId);
    return investorProducts.reduce((total, product) => total + (product.stock * product.cost), 0);
  }

  // Get investor sales movements
  getInvestorSalesMovements(investorId: string): InventoryMovement[] {
    const movements = this.getInvestorMovements(investorId);
    return movements.filter(m => m.type === 'out' && (m.referenceType === 'sale' || m.referenceType === 'investor_sale'));
  }

  // Get investor purchase movements
  getInvestorPurchaseMovements(investorId: string): InventoryMovement[] {
    const movements = this.getInvestorMovements(investorId);
    return movements.filter(m => m.type === 'in' && (m.referenceType === 'purchase' || m.referenceType === 'investor_purchase'));
  }

  // Add investor purchase movement
  addInvestorPurchaseMovement(productId: string, quantity: number, cost: number, investorId: string, invoiceId: string): boolean {
    const products = this.getProducts();
    const product = products.find(p => p.id === productId);
    
    if (!product) return false;

    // Update product owner if it's a new product for this investor
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex !== -1 && !products[productIndex].ownerId) {
      products[productIndex].ownerId = investorId;
      products[productIndex].ownerType = 'investor';
      storage.setItem('products', products);
    }

    return this.addMovement({
      productId,
      productName: product.name,
      code: product.code,
      type: 'in',
      quantity,
      date: new Date().toISOString(),
      reason: 'شراء مستثمر',
      value: cost,
      referenceType: 'investor_purchase',
      referenceId: invoiceId,
      notes: `شراء مستثمر من فاتورة رقم ${invoiceId}`,
      ownerId: investorId,
      ownerType: 'investor'
    });
  }

  // Add investor sale movement
  addInvestorSaleMovement(productId: string, quantity: number, saleValue: number, investorId: string, saleId: string): boolean {
    const products = this.getProducts();
    const product = products.find(p => p.id === productId);
    
    if (!product) return false;

    return this.addMovement({
      productId,
      productName: product.name,
      code: product.code,
      type: 'out',
      quantity,
      date: new Date().toISOString(),
      reason: 'بيع مستثمر',
      value: saleValue,
      referenceType: 'investor_sale',
      referenceId: saleId,
      notes: `بيع مستثمر رقم ${saleId}`,
      ownerId: investorId,
      ownerType: 'investor'
    });
  }
}

// Export singleton instance
export const inventoryManager = InventoryManager.getInstance();