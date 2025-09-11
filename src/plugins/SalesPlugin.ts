/**
 * Sales Plugin - معالجة المبيعات كـ plugin منفصل
 */

import { Plugin } from '@/core/PluginSystem';
import { businessIntegration } from '@/utils/businessIntegration';
import { cashFlowManager } from '@/utils/cashFlowManager';
import { inventoryManager } from '@/utils/inventoryUtils';

export interface SalesPluginConfig {
  autoInventoryUpdate: boolean;
  allowNegativeStock: boolean;
  defaultPaymentMethod: string;
  requireCustomerInfo: boolean;
}

class SalesPluginManager {
  private config: SalesPluginConfig = {
    autoInventoryUpdate: true,
    allowNegativeStock: false,
    defaultPaymentMethod: 'cash',
    requireCustomerInfo: false
  };

  async onInit(): Promise<void> {
    console.log('Sales Plugin initialized');
    // تهيئة إعدادات المبيعات
    this.loadConfig();
  }

  async onDestroy(): Promise<void> {
    console.log('Sales Plugin destroyed');
    // تنظيف الموارد
  }

  async onSaleProcess(saleData: any): Promise<any> {
    try {
      // التحقق من المخزون قبل البيع
      const stockValidation = await this.validateStock(saleData.items);
      if (!stockValidation.valid) {
        return {
          success: false,
          error: stockValidation.message,
          code: 'INSUFFICIENT_STOCK'
        };
      }

      // التحقق من بيانات العميل إذا كان مطلوباً
      if (this.config.requireCustomerInfo && !saleData.customerName) {
        return {
          success: false,
          error: 'بيانات العميل مطلوبة',
          code: 'CUSTOMER_INFO_REQUIRED'
        };
      }

      // معالجة الفاتورة
      const processedSale = await this.processSale(saleData);
      
      if (processedSale.success) {
        // تحديث المخزون تلقائياً
        if (this.config.autoInventoryUpdate) {
          await this.updateInventory(saleData.items);
        }

        // إضافة إلى التدفق النقدي
        await this.updateCashFlow(saleData);
      }

      return processedSale;
    } catch (error) {
      console.error('Sales processing error:', error);
      return {
        success: false,
        error: 'حدث خطأ في معالجة البيع',
        code: 'PROCESSING_ERROR'
      };
    }
  }

  private async validateStock(items: any[]): Promise<{ valid: boolean; message: string }> {
    for (const item of items) {
      const stockCheck = businessIntegration.checkStockAvailability(item.productId, item.quantity);
      
      if (!stockCheck.available && !this.config.allowNegativeStock) {
        return {
          valid: false,
          message: `${item.productName}: ${stockCheck.message}`
        };
      }
    }

    return { valid: true, message: 'Stock validation passed' };
  }

  private async processSale(saleData: any): Promise<any> {
    const integratedInvoice = {
      id: saleData.id,
      customerName: saleData.customerName,
      date: saleData.date,
      items: saleData.items.map((item: any) => ({
        id: item.id,
        productId: item.productId || item.id,
        productName: item.productName || item.name,
        productCode: item.productCode || item.code,
        quantity: item.quantity,
        price: item.price,
        cost: item.cost,
        total: item.total
      })),
      total: saleData.total,
      status: saleData.paymentStatus === 'paid' ? 'paid' as const : 'pending' as const,
      paymentMethod: saleData.paymentMethod || this.config.defaultPaymentMethod
    };

    const success = businessIntegration.processSalesInvoice(integratedInvoice);
    
    return {
      success,
      invoice: integratedInvoice,
      timestamp: new Date().toISOString()
    };
  }

  private async updateInventory(items: any[]): Promise<void> {
    for (const item of items) {
      // استخدام نظام الحركات لتحديث المخزون
      inventoryManager.addMovement({
        productId: item.productId,
        productName: item.productName || item.name,
        code: item.productCode || item.code,
        type: 'out',
        quantity: item.quantity,
        reason: 'sale',
        value: item.total,
        referenceType: 'sale',
        notes: `بيع - فاتورة رقم ${item.invoiceId || 'غير محدد'}`,
        date: new Date().toISOString()
      });
    }
  }

  private async updateCashFlow(saleData: any): Promise<void> {
    if (saleData.paymentStatus === 'paid') {
      cashFlowManager.addTransaction({
        type: 'income',
        amount: saleData.total,
        description: `مبيعات - فاتورة ${saleData.id}`,
        date: saleData.date,
        category: 'sales',
        referenceId: saleData.id,
        referenceType: 'sales_invoice',
        paymentMethod: saleData.paymentMethod || 'cash'
      });
    }
  }

  private loadConfig(): void {
    // تحميل الإعدادات من التخزين المحلي أو الإعدادات الافتراضية
    const savedConfig = localStorage.getItem('salesPluginConfig');
    if (savedConfig) {
      this.config = { ...this.config, ...JSON.parse(savedConfig) };
    }
  }

  updateConfig(newConfig: Partial<SalesPluginConfig>): void {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem('salesPluginConfig', JSON.stringify(this.config));
  }

  getConfig(): SalesPluginConfig {
    return { ...this.config };
  }
}

const salesPluginManager = new SalesPluginManager();

export const salesPlugin: Plugin = {
  metadata: {
    name: 'sales-plugin',
    version: '1.0.0',
    description: 'معالج المبيعات المتقدم',
    author: 'System'
  },
  hooks: {
    onInit: () => salesPluginManager.onInit(),
    onDestroy: () => salesPluginManager.onDestroy(),
    onSaleProcess: (data) => salesPluginManager.onSaleProcess(data)
  },
  config: salesPluginManager.getConfig()
};

export { salesPluginManager };