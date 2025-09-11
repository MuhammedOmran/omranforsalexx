import { storage } from './storage';
import { supplierIntegrationManager } from './supplierIntegrationManager';
import { enhancedSupplierIntegration } from './enhancedSupplierIntegration';
import { supplierAlertsManager } from './supplierAlertsManager';

export class EnhancedSupplierSync {
  private static instance: EnhancedSupplierSync;

  static getInstance(): EnhancedSupplierSync {
    if (!EnhancedSupplierSync.instance) {
      EnhancedSupplierSync.instance = new EnhancedSupplierSync();
    }
    return EnhancedSupplierSync.instance;
  }

  // مزامنة شاملة لجميع بيانات الموردين
  async syncAll(): Promise<void> {
    try {
      // 1. مزامنة بيانات الموردين مع فواتير الشراء
      supplierIntegrationManager.syncAllSuppliers();

      // 2. تحديث ملفات الموردين المحسنة
      const suppliers = storage.getItem('suppliers', []);
      for (const supplier of suppliers) {
        enhancedSupplierIntegration.updateSupplierOnPurchase(supplier.id, {
          total: supplier.totalPurchases || 0,
          date: supplier.lastPurchaseDate || new Date().toISOString(),
          paymentMethod: 'mixed'
        });
      }

      // 3. تحديث التنبيهات
      supplierAlertsManager.updateAllSupplierAlerts();
      supplierAlertsManager.cleanupExpiredAlerts();

      // 4. حفظ وقت آخر مزامنة
      localStorage.setItem('supplier_last_sync', new Date().toISOString());

      console.log('✅ Enhanced supplier sync completed successfully');
    } catch (error) {
      console.error('❌ Enhanced supplier sync failed:', error);
      throw error;
    }
  }

  // مزامنة مورد واحد
  async syncSupplier(supplierId: string): Promise<void> {
    try {
      // تحديث بيانات المورد
      const suppliers = storage.getItem('suppliers', []);
      const supplier = suppliers.find((s: any) => s.id === supplierId);
      
      if (supplier) {
        // تحديث التكامل
        const purchaseInvoices = storage.getItem('purchase_invoices', [])
          .filter((inv: any) => inv.supplierId === supplierId);

        if (purchaseInvoices.length > 0) {
          const latestInvoice = purchaseInvoices[purchaseInvoices.length - 1];
          enhancedSupplierIntegration.updateSupplierOnPurchase(supplierId, latestInvoice);
        }

        // تحديث التنبيهات
        supplierAlertsManager.updateSupplierAlerts(supplierId);
      }
    } catch (error) {
      console.error(`❌ Failed to sync supplier ${supplierId}:`, error);
      throw error;
    }
  }

  // إحصائيات المزامنة
  getSyncStats() {
    const lastSync = localStorage.getItem('supplier_last_sync');
    const suppliers = storage.getItem('suppliers', []);
    const alerts = supplierAlertsManager.getAllAlerts();
    
    return {
      lastSync: lastSync ? new Date(lastSync) : null,
      suppliersCount: suppliers.length,
      unreadAlerts: alerts.filter((a: any) => !a.isRead).length,
      criticalAlerts: alerts.filter((a: any) => a.severity === 'critical').length
    };
  }
}

export const enhancedSupplierSync = EnhancedSupplierSync.getInstance();