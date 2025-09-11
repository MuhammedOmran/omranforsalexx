/**
 * Reports Plugin - نظام التقارير المرن والقابل للتوسع
 */

import { Plugin } from '@/core/PluginSystem';
import { businessIntegration } from '@/utils/businessIntegration';
import { inventoryManager } from '@/utils/inventoryUtils';
import { cashFlowManager } from '@/utils/cashFlowManager';

export interface ReportConfig {
  name: string;
  description: string;
  type: 'financial' | 'inventory' | 'sales' | 'custom';
  enabled: boolean;
  autoGenerate: boolean;
  schedule?: string; // cron-like string
}

export interface ReportsPluginConfig {
  reports: ReportConfig[];
  defaultDateRange: number; // days
  autoExport: boolean;
  exportFormat: 'json' | 'csv' | 'pdf';
}

class ReportsPluginManager {
  private config: ReportsPluginConfig = {
    reports: [
      {
        name: 'sales-summary',
        description: 'ملخص المبيعات اليومي',
        type: 'sales',
        enabled: true,
        autoGenerate: true,
        schedule: '0 23 * * *' // يومياً في 11 مساءً
      },
      {
        name: 'inventory-status',
        description: 'حالة المخزون',
        type: 'inventory',
        enabled: true,
        autoGenerate: false
      },
      {
        name: 'financial-overview',
        description: 'نظرة عامة مالية',
        type: 'financial',
        enabled: true,
        autoGenerate: true,
        schedule: '0 0 1 * *' // شهرياً في بداية الشهر
      }
    ],
    defaultDateRange: 30,
    autoExport: false,
    exportFormat: 'json'
  };

  private reportGenerators: Map<string, Function> = new Map();

  async onInit(): Promise<void> {
    console.log('Reports Plugin initialized');
    this.loadConfig();
    this.registerDefaultReports();
    
    if (this.config.autoExport) {
      this.startAutoReporting();
    }
  }

  async onDestroy(): Promise<void> {
    console.log('Reports Plugin destroyed');
    this.stopAutoReporting();
  }

  async onReportGenerate(reportData: any): Promise<any> {
    try {
      const { reportType, dateRange, filters, customParams } = reportData;
      
      const generator = this.reportGenerators.get(reportType);
      if (!generator) {
        return {
          success: false,
          error: `تقرير غير معروف: ${reportType}`,
          code: 'UNKNOWN_REPORT_TYPE'
        };
      }

      const report = await generator({
        dateRange: dateRange || this.config.defaultDateRange,
        filters: filters || {},
        customParams: customParams || {}
      });

      return {
        success: true,
        report,
        generatedAt: new Date().toISOString(),
        reportType
      };
    } catch (error) {
      console.error('Report generation error:', error);
      return {
        success: false,
        error: 'حدث خطأ في إنشاء التقرير',
        code: 'REPORT_GENERATION_ERROR'
      };
    }
  }

  private registerDefaultReports(): void {
    // تقرير المبيعات
    this.reportGenerators.set('sales-summary', async (params: any) => {
      const businessAnalytics = businessIntegration.getBusinessAnalytics();
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - params.dateRange);

      return {
        title: 'ملخص المبيعات',
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        metrics: {
          totalSales: businessAnalytics.salesRevenue,
          totalProfit: businessAnalytics.grossProfit,
          profitMargin: businessAnalytics.grossProfitMargin,
          totalTransactions: 0 // يمكن إضافة هذا لاحقاً
        },
        breakdown: {
          // يمكن إضافة تفاصيل أكثر حسب المتطلبات
        }
      };
    });

    // تقرير المخزون
    this.reportGenerators.set('inventory-status', async (params: any) => {
      const products = inventoryManager.getProducts();
      const analysis = inventoryManager.calculateStockAnalysis();
      const lowStock = inventoryManager.getLowStockProducts();
      const outOfStock = inventoryManager.getOutOfStockProducts();

      return {
        title: 'حالة المخزون',
        generatedAt: new Date().toISOString(),
        summary: {
          totalProducts: products.length,
          totalStockValue: products.reduce((sum, p) => sum + (p.stock * p.cost), 0),
          lowStockItems: lowStock.length,
          outOfStockItems: outOfStock.length
        },
        details: {
          products: products.map(p => ({
            id: p.id,
            name: p.name,
            code: p.code,
            currentStock: p.stock,
            minStock: p.minStock,
            status: p.stock <= 0 ? 'out_of_stock' : 
                   p.stock <= p.minStock ? 'low_stock' : 'normal',
            value: p.stock * p.cost
          })),
          alerts: {
            lowStock: lowStock.map(p => ({
              productId: p.id,
              productName: p.name,
              currentStock: p.stock,
              minStock: p.minStock
            })),
            outOfStock: outOfStock.map(p => ({
              productId: p.id,
              productName: p.name
            }))
          }
        }
      };
    });

    // التقرير المالي
    this.reportGenerators.set('financial-overview', async (params: any) => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - params.dateRange);

      // الحصول على البيانات المالية
      const allTransactions = cashFlowManager.getTransactions();
      const periodTransactions = allTransactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= startDate && transactionDate <= endDate;
      });
      
      const totalIncome = periodTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalExpenses = periodTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const businessAnalytics = businessIntegration.getBusinessAnalytics();

      return {
        title: 'النظرة العامة المالية',
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        summary: {
          totalRevenue: businessAnalytics.salesRevenue,
          totalExpenses: totalExpenses,
          netProfit: businessAnalytics.grossProfit,
          cashFlow: totalIncome - totalExpenses
        },
        breakdown: {
          sales: {
            revenue: businessAnalytics.salesRevenue,
            cost: businessAnalytics.purchaseCosts,
            profit: businessAnalytics.grossProfit,
            margin: businessAnalytics.grossProfitMargin
          },
          expenses: {
            total: totalExpenses,
            byCategory: periodTransactions
              .filter(t => t.type === 'expense')
              .reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + t.amount;
                return acc;
              }, {} as Record<string, number>)
          },
          cashFlow: {
            income: totalIncome,
            expenses: totalExpenses,
            net: totalIncome - totalExpenses
          }
        }
      };
    });
  }

  // تسجيل تقرير مخصص
  registerCustomReport(name: string, generator: Function, config: ReportConfig): void {
    this.reportGenerators.set(name, generator);
    
    const existingIndex = this.config.reports.findIndex(r => r.name === name);
    if (existingIndex >= 0) {
      this.config.reports[existingIndex] = config;
    } else {
      this.config.reports.push(config);
    }
    
    this.saveConfig();
    console.log(`Custom report '${name}' registered successfully`);
  }

  // إلغاء تسجيل تقرير
  unregisterReport(name: string): boolean {
    if (!this.reportGenerators.has(name)) {
      return false;
    }

    this.reportGenerators.delete(name);
    this.config.reports = this.config.reports.filter(r => r.name !== name);
    this.saveConfig();
    
    console.log(`Report '${name}' unregistered successfully`);
    return true;
  }

  // الحصول على قائمة التقارير المتاحة
  getAvailableReports(): ReportConfig[] {
    return this.config.reports;
  }

  // إنشاء تقرير محدد
  async generateReport(reportName: string, params?: any): Promise<any> {
    return this.onReportGenerate({
      reportType: reportName,
      ...params
    });
  }

  private startAutoReporting(): void {
    // يمكن تطبيق جدولة التقارير التلقائية هنا
    console.log('Auto reporting started');
  }

  private stopAutoReporting(): void {
    console.log('Auto reporting stopped');
  }

  private loadConfig(): void {
    const savedConfig = localStorage.getItem('reportsPluginConfig');
    if (savedConfig) {
      this.config = { ...this.config, ...JSON.parse(savedConfig) };
    }
  }

  private saveConfig(): void {
    localStorage.setItem('reportsPluginConfig', JSON.stringify(this.config));
  }

  updateConfig(newConfig: Partial<ReportsPluginConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
  }

  getConfig(): ReportsPluginConfig {
    return { ...this.config };
  }
}

const reportsPluginManager = new ReportsPluginManager();

export const reportsPlugin: Plugin = {
  metadata: {
    name: 'reports-plugin',
    version: '1.0.0',
    description: 'نظام التقارير المتقدم والقابل للتوسع',
    author: 'System'
  },
  hooks: {
    onInit: () => reportsPluginManager.onInit(),
    onDestroy: () => reportsPluginManager.onDestroy(),
    onReportGenerate: (data) => reportsPluginManager.onReportGenerate(data)
  },
  config: reportsPluginManager.getConfig()
};

export { reportsPluginManager };