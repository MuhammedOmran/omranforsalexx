/**
 * Inventory Plugin - إدارة المخزون كـ plugin منفصل
 */

import { Plugin } from '@/core/PluginSystem';
import { inventoryManager } from '@/utils/inventoryUtils';

export interface InventoryPluginConfig {
  autoReorderAlerts: boolean;
  lowStockThreshold: number;
  autoCalculateReorderPoint: boolean;
  enableStockMovementTracking: boolean;
}

class InventoryPluginManager {
  private config: InventoryPluginConfig = {
    autoReorderAlerts: true,
    lowStockThreshold: 10,
    autoCalculateReorderPoint: true,
    enableStockMovementTracking: true
  };

  async onInit(): Promise<void> {
    console.log('Inventory Plugin initialized');
    this.loadConfig();
    
    if (this.config.autoReorderAlerts) {
      this.startStockMonitoring();
    }
  }

  async onDestroy(): Promise<void> {
    console.log('Inventory Plugin destroyed');
    this.stopStockMonitoring();
  }

  async onInventoryUpdate(inventoryData: any): Promise<any> {
    try {
      const result = {
        success: true,
        updates: [],
        alerts: [],
        timestamp: new Date().toISOString()
      };

      if (inventoryData.type === 'stock_movement') {
        await this.processStockMovement(inventoryData);
        result.updates.push('stock_movement_processed');
      }

      if (inventoryData.type === 'product_update') {
        await this.processProductUpdate(inventoryData);
        result.updates.push('product_updated');
      }

      // التحقق من التنبيهات
      const alerts = await this.checkStockAlerts();
      result.alerts = alerts;

      return result;
    } catch (error) {
      console.error('Inventory update error:', error);
      return {
        success: false,
        error: 'حدث خطأ في تحديث المخزون',
        code: 'INVENTORY_UPDATE_ERROR'
      };
    }
  }

  private async processStockMovement(data: any): Promise<void> {
    if (this.config.enableStockMovementTracking) {
      // تسجيل حركة المخزون
      const movementData = {
        productId: data.productId,
        productName: data.productName,
        code: data.code,
        type: data.type,
        quantity: data.quantity,
        reason: data.reason,
        value: data.value || 0,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        notes: data.notes,
        date: data.date || new Date().toISOString()
      };

      inventoryManager.addMovement(movementData);
    }
  }

  private async processProductUpdate(data: any): Promise<void> {
    // تحديث بيانات المنتج
    const products = inventoryManager.getProducts();
    const productIndex = products.findIndex(p => p.id === data.productId);
    
    if (productIndex !== -1) {
      products[productIndex] = { ...products[productIndex], ...data.updates };
      // حفظ التحديثات
    }
  }

  private async checkStockAlerts(): Promise<any[]> {
    const alerts = [];
    
    if (this.config.autoReorderAlerts) {
      const lowStockProducts = inventoryManager.getLowStockProducts();
      const outOfStockProducts = inventoryManager.getOutOfStockProducts();
      
      alerts.push(...lowStockProducts.map(product => ({
        type: 'low_stock',
        productId: product.id,
        productName: product.name,
        currentStock: product.stock,
        threshold: this.config.lowStockThreshold,
        severity: 'warning'
      })));

      alerts.push(...outOfStockProducts.map(product => ({
        type: 'out_of_stock',
        productId: product.id,
        productName: product.name,
        currentStock: product.stock,
        severity: 'error'
      })));
    }

    return alerts;
  }

  private startStockMonitoring(): void {
    // مراقبة المخزون كل 30 دقيقة
    setInterval(() => {
      this.checkStockAlerts().then(alerts => {
        if (alerts.length > 0) {
          console.log('Stock alerts detected:', alerts);
          // يمكن إضافة تنبيهات للمستخدم هنا
        }
      });
    }, 30 * 60 * 1000);
  }

  private stopStockMonitoring(): void {
    // إيقاف المراقبة عند الحاجة
  }

  private loadConfig(): void {
    const savedConfig = localStorage.getItem('inventoryPluginConfig');
    if (savedConfig) {
      this.config = { ...this.config, ...JSON.parse(savedConfig) };
    }
  }

  updateConfig(newConfig: Partial<InventoryPluginConfig>): void {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem('inventoryPluginConfig', JSON.stringify(this.config));
  }

  getConfig(): InventoryPluginConfig {
    return { ...this.config };
  }

  // API للاستخدام الخارجي
  async getStockReport(): Promise<any> {
    const products = inventoryManager.getProducts();
    const movements = inventoryManager.getMovements();
    const analysis = inventoryManager.calculateStockAnalysis();

    return {
      totalProducts: products.length,
      totalStockValue: products.reduce((sum, p) => sum + (p.stock * p.cost), 0),
      lowStockCount: inventoryManager.getLowStockProducts().length,
      outOfStockCount: inventoryManager.getOutOfStockProducts().length,
      recentMovements: movements.slice(-10),
      analysis
    };
  }

  async getProductHistory(productId: string): Promise<any> {
    const movements = inventoryManager.getMovements()
      .filter(m => m.productId === productId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const product = inventoryManager.getProducts().find(p => p.id === productId);

    return {
      product,
      movements,
      totalMovements: movements.length,
      totalIn: movements.filter(m => m.type === 'in').reduce((sum, m) => sum + m.quantity, 0),
      totalOut: movements.filter(m => m.type === 'out').reduce((sum, m) => sum + m.quantity, 0)
    };
  }
}

const inventoryPluginManager = new InventoryPluginManager();

export const inventoryPlugin: Plugin = {
  metadata: {
    name: 'inventory-plugin',
    version: '1.0.0',
    description: 'نظام إدارة المخزون المتقدم',
    author: 'System'
  },
  hooks: {
    onInit: () => inventoryPluginManager.onInit(),
    onDestroy: () => inventoryPluginManager.onDestroy(),
    onInventoryUpdate: (data) => inventoryPluginManager.onInventoryUpdate(data)
  },
  config: inventoryPluginManager.getConfig()
};

export { inventoryPluginManager };