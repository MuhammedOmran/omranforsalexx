import { businessIntegration } from './businessIntegration';
import { inventoryManager } from './inventoryUtils';
import { storage } from './storage';
import { backupRestoreSystem } from '@/core/BackupRestoreSystem';

export class AppInitializer {
  private static instance: AppInitializer;
  private initialized = false;

  static getInstance(): AppInitializer {
    if (!AppInitializer.instance) {
      AppInitializer.instance = new AppInitializer();
    }
    return AppInitializer.instance;
  }

  async initialize(): Promise<boolean> {
    if (this.initialized) {
      return true;
    }

    try {
      console.log('Initializing app systems...');

      // Ensure auto-backup every 5 minutes with retention of 20 versions
      backupRestoreSystem.updateConfig({ scheduleEnabled: true, scheduleInterval: 5 });
      // 1. Check and fix storage health
      const healthCheck = storage.checkStorageHealth();
      if (!healthCheck.isHealthy) {
        console.warn('Storage health issues detected:', healthCheck.errors);
        
        // Attempt to fix storage issues
        for (const error of healthCheck.errors) {
          if (error.includes('nearly full')) {
            // Create backup before cleanup
            storage.setItem('emergency_backup', storage.exportData());
            console.log('Emergency backup created');
          }
        }
      }

      // 2. Ensure all products have required fields
      await this.validateAndFixProducts();

      // 3. Migrate existing data to integrated system
      const migrationResult = businessIntegration.migrateExistingData();
      console.log(`Migration completed: ${migrationResult.salesProcessed} sales, ${migrationResult.purchasesProcessed} purchases processed`);
      
      if (migrationResult.errors.length > 0) {
        console.warn('Migration warnings:', migrationResult.errors);
      }

      // 4. Migrate investor data
      const investorMigration = businessIntegration.migrateInvestorData();
      console.log(`Investor migration completed: ${investorMigration.processed} items processed`);
      
      if (investorMigration.errors.length > 0) {
        console.warn('Investor migration warnings:', investorMigration.errors);
      }

      // 5. Sync all inventory data
      inventoryManager.syncProductsWithStock();

      // 6. Validate customer data integrity
      await this.validateCustomerData();

      // 7. Create initial sample data if needed
      await this.createSampleDataIfNeeded();

      this.initialized = true;
      console.log('App initialization completed successfully');
      return true;

    } catch (error) {
      console.error('App initialization failed:', error);
      return false;
    }
  }

  private async validateAndFixProducts(): Promise<void> {
    const products = inventoryManager.getProducts();
    let hasChanges = false;

    const fixedProducts = products.map(product => {
      let fixed = { ...product };
      
      // Ensure all required fields exist
      if (!fixed.ownerType) {
        fixed.ownerType = 'company';
        hasChanges = true;
      }
      
      if (typeof fixed.stock !== 'number') {
        fixed.stock = 0;
        hasChanges = true;
      }
      
      if (typeof fixed.minStock !== 'number') {
        fixed.minStock = 1;
        hasChanges = true;
      }
      
      if (typeof fixed.price !== 'number') {
        fixed.price = 0;
        hasChanges = true;
      }
      
      if (typeof fixed.cost !== 'number') {
        fixed.cost = 0;
        hasChanges = true;
      }

      return fixed;
    });

    if (hasChanges) {
      storage.setItem('products', fixedProducts);
      console.log('Product data validation and fixes applied');
    }
  }

  private async validateCustomerData(): Promise<void> {
    const customers = storage.getItem('customers', []);
    const salesInvoices = storage.getItem('sales_invoices', []);
    let hasChanges = false;

    const updatedCustomers = customers.map((customer: any) => {
      // Calculate actual statistics from invoices
      const customerInvoices = salesInvoices.filter((invoice: any) => 
        invoice.customerName === customer.name || 
        invoice.customerId === customer.id?.toString()
      );

      const actualTotalOrders = customerInvoices.length;
      const actualTotalSpent = customerInvoices.reduce((sum: number, invoice: any) => 
        sum + (invoice.total || 0), 0
      );

      if (customer.totalOrders !== actualTotalOrders || 
          Math.abs((customer.totalSpent || 0) - actualTotalSpent) > 0.01) {
        hasChanges = true;
        return {
          ...customer,
          totalOrders: actualTotalOrders,
          totalSpent: actualTotalSpent
        };
      }

      return customer;
    });

    if (hasChanges) {
      storage.setItem('customers', updatedCustomers);
      console.log('Customer data synchronized with actual sales');
    }
  }

  private async createSampleDataIfNeeded(): Promise<void> {
    const products = inventoryManager.getProducts();
    
    // تم إزالة إنشاء المنتجات الافتراضية - النظام يبدأ فارغ الآن
    // المنتجات ستتم إضافتها يدوياً فقط من قبل المستخدم
    console.log('النظام مُهيأ بدون منتجات افتراضية');
  }

  // Get system health status
  getSystemHealth() {
    const storageHealth = storage.checkStorageHealth();
    const businessAnalytics = businessIntegration.getBusinessAnalytics();
    const stockAnalysis = inventoryManager.calculateStockAnalysis();

    return {
      storage: storageHealth,
      business: {
        totalProducts: businessAnalytics.totalProducts,
        totalMovements: businessAnalytics.totalMovements,
        alerts: businessAnalytics.lowStockAlerts + businessAnalytics.outOfStockAlerts
      },
      inventory: {
        totalProducts: stockAnalysis.length,
        lowStock: inventoryManager.getLowStockProducts().length,
        outOfStock: inventoryManager.getOutOfStockProducts().length
      },
      initialized: this.initialized
    };
  }

  // Force re-initialization
  async reinitialize(): Promise<boolean> {
    this.initialized = false;
    return await this.initialize();
  }
}

// Export singleton instance
export const appInitializer = AppInitializer.getInstance();