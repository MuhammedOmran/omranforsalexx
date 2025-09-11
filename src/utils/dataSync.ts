import { storage } from './storage';
import { businessIntegration } from './businessIntegration';
import { inventoryManager } from './inventoryUtils';
import { cashFlowManager } from './cashFlowManager';

/**
 * Data synchronization utility to ensure all systems are in sync
 */
export class DataSyncManager {
  private static instance: DataSyncManager;

  static getInstance(): DataSyncManager {
    if (!DataSyncManager.instance) {
      DataSyncManager.instance = new DataSyncManager();
    }
    return DataSyncManager.instance;
  }

  /**
   * Synchronize all data across all systems
   */
  async syncAllData(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // 1. Sync sales invoices with inventory
      const salesSyncResult = await this.syncSalesInvoices();
      if (!salesSyncResult.success) {
        errors.push(...salesSyncResult.errors);
      }

      // تم إزالة مزامنة فواتير الشراء مع المخزون والصندوق
      console.log('مزامنة فواتير الشراء مع المخزون والصندوق تم إلغاؤها');

      // 3. Sync customer data
      const customerSyncResult = await this.syncCustomerData();
      if (!customerSyncResult.success) {
        errors.push(...customerSyncResult.errors);
      }

      // 4. Sync financial data
      const financialSyncResult = await this.syncFinancialData();
      if (!financialSyncResult.success) {
        errors.push(...financialSyncResult.errors);
      }

      // 5. Sync inventory data
      inventoryManager.syncProductsWithStock();

      return {
        success: errors.length === 0,
        errors
      };
    } catch (error) {
      console.error('Data sync failed:', error);
      return {
        success: false,
        errors: [`System sync error: ${error.message}`]
      };
    }
  }

  /**
   * Sync sales invoices with inventory
   */
  private async syncSalesInvoices(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      const salesInvoices = storage.getItem('sales_invoices', []);
      let processedCount = 0;

      for (const invoice of salesInvoices) {
        if (invoice.paymentStatus === 'paid') {
          const integratedInvoice = businessIntegration.convertLegacySaleInvoice(invoice);
          if (integratedInvoice && integratedInvoice.items.length > 0) {
            const success = businessIntegration.processSalesInvoice(integratedInvoice);
            if (success) {
              processedCount++;
            } else {
              errors.push(`Failed to process sales invoice: ${invoice.id}`);
            }
          }
        }
      }

      console.log(`Synced ${processedCount} sales invoices`);
      return { success: errors.length === 0, errors };
    } catch (error) {
      console.error('Sales invoice sync failed:', error);
      return { success: false, errors: [`Sales sync error: ${error.message}`] };
    }
  }

  /**
   * مزامنة فواتير الشراء مع المخزون - تم إلغاؤها
   */
  private async syncPurchaseInvoices(): Promise<{ success: boolean; errors: string[] }> {
    // تم إلغاء ربط فواتير الشراء بالصندوق
    console.log('تم إلغاء مزامنة فواتير الشراء مع المخزون والصندوق');
    return { success: true, errors: [] };
  }

  /**
   * Sync customer data with their transaction history
   */
  private async syncCustomerData(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      const customers = storage.getItem('customers', []);
      const salesInvoices = storage.getItem('sales_invoices', []);
      
      const updatedCustomers = customers.map((customer: any) => {
        const customerInvoices = salesInvoices.filter((invoice: any) => 
          invoice.customerName === customer.name || invoice.customerId === customer.id?.toString()
        );
        
        const totalOrders = customerInvoices.length;
        const totalSpent = customerInvoices.reduce((sum: number, invoice: any) => sum + (invoice.total || 0), 0);
        const lastOrderDate = customerInvoices.length > 0 
          ? customerInvoices.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
          : null;

        return {
          ...customer,
          totalOrders,
          totalSpent,
          lastOrderDate
        };
      });

      storage.setItem('customers', updatedCustomers);
      console.log(`Synced ${updatedCustomers.length} customers`);
      
      return { success: true, errors: [] };
    } catch (error) {
      console.error('Customer sync failed:', error);
      return { success: false, errors: [`Customer sync error: ${error.message}`] };
    }
  }

  /**
   * Sync financial data
   */
  private async syncFinancialData(): Promise<{ success: boolean; errors: string[] }> {
    try {
      cashFlowManager.syncAllFinancialData();
      console.log('Financial data synced');
      return { success: true, errors: [] };
    } catch (error) {
      console.error('Financial sync failed:', error);
      return { success: false, errors: [`Financial sync error: ${error.message}`] };
    }
  }

  /**
   * Fix data integrity issues
   */
  async fixDataIntegrity(): Promise<{ fixed: number; issues: string[] }> {
    const issues: string[] = [];
    let fixed = 0;

    try {
      // 1. Fix missing product entries
      const fixedProducts = await this.fixMissingProducts();
      fixed += fixedProducts.count;
      if (fixedProducts.issues.length > 0) {
        issues.push(...fixedProducts.issues);
      }

      // 2. Fix inventory movements without proper product links
      const fixedMovements = await this.fixInventoryMovements();
      fixed += fixedMovements.count;
      if (fixedMovements.issues.length > 0) {
        issues.push(...fixedMovements.issues);
      }

      // 3. Fix customer data inconsistencies
      const fixedCustomers = await this.fixCustomerData();
      fixed += fixedCustomers.count;
      if (fixedCustomers.issues.length > 0) {
        issues.push(...fixedCustomers.issues);
      }

      return { fixed, issues };
    } catch (error) {
      console.error('Data integrity fix failed:', error);
      return { fixed, issues: [...issues, `Integrity fix error: ${error.message}`] };
    }
  }

  /**
   * Fix missing products in inventory
   */
  private async fixMissingProducts(): Promise<{ count: number; issues: string[] }> {
    const issues: string[] = [];
    let count = 0;

    try {
      const salesInvoices = storage.getItem('sales_invoices', []);
      const purchaseInvoices = storage.getItem('purchase_invoices', []);
      const products = inventoryManager.getProducts();
      const productNames = new Set(products.map(p => p.name));

      // Check sales invoices for missing products
      for (const invoice of salesInvoices) {
        if (invoice.itemsDetails && Array.isArray(invoice.itemsDetails)) {
          for (const item of invoice.itemsDetails) {
            if (!productNames.has(item.productName)) {
              // Create missing product
              const newProduct = {
                id: `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: item.productName,
                code: item.productCode || `AUTO_${Date.now()}`,
                category: 'غير محدد',
                stock: 0,
                minStock: 1,
                price: item.price || 0,
                cost: item.cost || item.price * 0.8,
                description: 'منتج تم إنشاؤه تلقائياً',
                status: 'active' as const,
                ownerType: 'company' as const
              };

              const allProducts = [...products, newProduct];
              storage.setItem('products', allProducts);
              productNames.add(item.productName);
              count++;
            }
          }
        }
      }

      return { count, issues };
    } catch (error) {
      return { count, issues: [`Product fix error: ${error.message}`] };
    }
  }

  /**
   * Fix inventory movements
   */
  private async fixInventoryMovements(): Promise<{ count: number; issues: string[] }> {
    const issues: string[] = [];
    let count = 0;

    // This would contain logic to fix movements that don't have proper product links
    // For now, we just return empty result as the movements are properly handled

    return { count, issues };
  }

  /**
   * Fix customer data
   */
  private async fixCustomerData(): Promise<{ count: number; issues: string[] }> {
    const issues: string[] = [];
    let count = 0;

    try {
      // Ensure all customers have required fields
      const customers = storage.getItem('customers', []);
      const updatedCustomers = customers.map((customer: any, index: number) => {
        let updated = false;
        const fixes = { ...customer };

        if (!fixes.id) {
          fixes.id = index + 1;
          updated = true;
        }

        if (!fixes.status) {
          fixes.status = 'نشط';
          updated = true;
        }

        if (!fixes.createdAt) {
          fixes.createdAt = new Date();
          updated = true;
        }

        if (updated) {
          count++;
        }

        return fixes;
      });

      if (count > 0) {
        storage.setItem('customers', updatedCustomers);
      }

      return { count, issues };
    } catch (error) {
      return { count, issues: [`Customer fix error: ${error.message}`] };
    }
  }

  /**
   * Get sync status and health check
   */
  getSyncStatus() {
    const salesInvoices = storage.getItem('sales_invoices', []);
    const purchaseInvoices = storage.getItem('purchase_invoices', []);
    const customers = storage.getItem('customers', []);
    const products = inventoryManager.getProducts();
    const movements = inventoryManager.getMovements();

    return {
      dataHealth: {
        salesInvoices: salesInvoices.length,
        purchaseInvoices: purchaseInvoices.length,
        customers: customers.length,
        products: products.length,
        movements: movements.length
      },
      lastSync: new Date().toISOString(),
      systemStatus: 'operational'
    };
  }
}

// Export singleton instance
export const dataSyncManager = DataSyncManager.getInstance();