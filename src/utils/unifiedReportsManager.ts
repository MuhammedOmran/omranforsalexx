import { storage } from './storage';
import { customerIntegrationManager } from './customerIntegrationManager';
import { supplierIntegrationManager } from './supplierIntegrationManager';
import { checkIntegrationManager } from './checkIntegrationManager';
import { cashFlowManager } from './cashFlowManager';
import { inventoryManager } from './inventoryUtils';
import { checksManager } from './checksManager';

export class UnifiedReportsManager {
  private static instance: UnifiedReportsManager;

  static getInstance(): UnifiedReportsManager {
    if (!UnifiedReportsManager.instance) {
      UnifiedReportsManager.instance = new UnifiedReportsManager();
    }
    return UnifiedReportsManager.instance;
  }

  // تقرير الربحية الشامل
  getComprehensiveProfitReport(startDate: string, endDate: string) {
    try {
      const salesInvoices = storage.getItem('sales_invoices', [])
        .filter((inv: any) => inv.date >= startDate && inv.date <= endDate);
      const purchaseInvoices = storage.getItem('purchase_invoices', [])
        .filter((inv: any) => inv.date >= startDate && inv.date <= endDate);
      const expenses = storage.getItem('expenses', [])
        .filter((exp: any) => exp.date >= startDate && exp.date <= endDate);
      const cashFlowTransactions = cashFlowManager.getTransactionsByDateRange(startDate, endDate);
      const totalIncome = cashFlowTransactions
        .filter((t: any) => t.type === 'income')
        .reduce((sum: number, t: any) => sum + t.amount, 0);
      const totalExpense = cashFlowTransactions
        .filter((t: any) => t.type === 'expense')
        .reduce((sum: number, t: any) => sum + t.amount, 0);

      const totalSales = salesInvoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);
      const totalPurchases = purchaseInvoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);
      const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);
      
      const grossProfit = totalSales - totalPurchases;
      const netProfit = grossProfit - totalExpenses;

      return {
        period: { startDate, endDate },
        revenue: {
          totalSales,
          salesCount: salesInvoices.length,
          averageSaleValue: salesInvoices.length > 0 ? totalSales / salesInvoices.length : 0
        },
        costs: {
          totalPurchases,
          totalExpenses,
          totalCosts: totalPurchases + totalExpenses
        },
        profitability: {
          grossProfit,
          netProfit,
          grossMargin: totalSales > 0 ? (grossProfit / totalSales) * 100 : 0,
          netMargin: totalSales > 0 ? (netProfit / totalSales) * 100 : 0
        },
        cashFlow: {
          totalIncome,
          totalExpense,
          netFlow: totalIncome - totalExpense
        }
      };
    } catch (error) {
      console.error('Error generating comprehensive profit report:', error);
      return null;
    }
  }

  // تقرير التدفق النقدي الموحد
  getUnifiedCashFlowReport(startDate: string, endDate: string) {
    try {
      const transactions = cashFlowManager.getTransactionsByDateRange(startDate, endDate);
      const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const netCashFlow = totalIncome - totalExpenses;
      
      const checks = storage.getItem('checks', [])
        .filter((check: any) => check.dateReceived >= startDate && check.dateReceived <= endDate);
      const installments = storage.getItem('installments', [])
        .filter((inst: any) => inst.createdAt >= startDate && inst.createdAt <= endDate);

      return {
        period: { startDate, endDate },
        transactions: {
          totalIncome,
          totalExpense: totalExpenses,
          netFlow: netCashFlow,
          transactionCount: transactions.length
        },
        checks: {
          totalAmount: checks.reduce((sum: number, c: any) => sum + c.amount, 0),
          pendingAmount: checks.filter((c: any) => c.status === 'pending').reduce((sum: number, c: any) => sum + c.amount, 0),
          cashedAmount: checks.filter((c: any) => c.status === 'cashed').reduce((sum: number, c: any) => sum + c.amount, 0)
        },
        installments: {
          totalAmount: installments.reduce((sum: number, i: any) => sum + i.amount, 0),
          paidAmount: installments.filter((i: any) => i.status === 'paid').reduce((sum: number, i: any) => sum + i.amount, 0),
          pendingAmount: installments.filter((i: any) => i.status === 'pending').reduce((sum: number, i: any) => sum + i.amount, 0)
        }
      };
    } catch (error) {
      console.error('Error generating unified cash flow report:', error);
      return null;
    }
  }

  // تحليل أداء العملاء والموردين (محسن)
  getIntegratedPerformanceReport() {
    try {
      const topCustomers = customerIntegrationManager.getTopCustomers(10);
      const overdueCustomers = customerIntegrationManager.getOverdueCustomers();
      const topSuppliers = supplierIntegrationManager.getTopSuppliers(10);
      const supplierReport = supplierIntegrationManager.getSupplierPerformanceReport();
      const customersWithPendingChecks = customerIntegrationManager.getCustomersWithPendingChecks();

      return {
        customers: {
          topPerformers: topCustomers,
          riskCustomers: overdueCustomers,
          totalCustomers: storage.getItem('customers', []).length,
          customersWithPendingChecks: customersWithPendingChecks.length,
          totalPendingChecksAmount: customersWithPendingChecks.reduce((sum: number, c: any) => sum + (c.pendingChecksAmount || 0), 0)
        },
        suppliers: {
          topPerformers: topSuppliers,
          performanceReport: supplierReport,
          totalSuppliers: storage.getItem('suppliers', []).length
        }
      };
    } catch (error) {
      console.error('Error generating integrated performance report:', error);
      return null;
    }
  }

  // تقرير الترابط الشامل بين الأنظمة
  getSystemIntegrationReport(startDate: string, endDate: string) {
    try {
      const profitReport = this.getComprehensiveProfitReport(startDate, endDate);
      const cashFlowReport = this.getUnifiedCashFlowReport(startDate, endDate);
      const performanceReport = this.getIntegratedPerformanceReport();

      // إحصائيات الترابط
      const salesInvoices = storage.getItem('sales_invoices', [])
        .filter((inv: any) => inv.date >= startDate && inv.date <= endDate);
      const purchaseInvoices = storage.getItem('purchase_invoices', [])
        .filter((inv: any) => inv.date >= startDate && inv.date <= endDate);
      const movements = inventoryManager.getMovements()
        .filter((mov: any) => mov.date >= startDate && mov.date <= endDate);

      // ربط الفواتير مع المخزون
      const salesWithInventoryUpdate = salesInvoices.filter((inv: any) => 
        movements.some((mov: any) => mov.referenceId === inv.id && mov.type === 'out')
      );
      const purchasesWithInventoryUpdate = purchaseInvoices.filter((inv: any) => 
        movements.some((mov: any) => mov.referenceId === inv.id && mov.type === 'in')
      );

      return {
        period: { startDate, endDate },
        profitability: profitReport,
        cashFlow: cashFlowReport,
        performance: performanceReport,
        integration: {
          totalSalesInvoices: salesInvoices.length,
          salesLinkedToInventory: salesWithInventoryUpdate.length,
          salesInventoryLinkRate: salesInvoices.length > 0 ? 
            (salesWithInventoryUpdate.length / salesInvoices.length) * 100 : 0,
          
          totalPurchaseInvoices: purchaseInvoices.length,
          purchasesLinkedToInventory: purchasesWithInventoryUpdate.length,
          purchaseInventoryLinkRate: purchaseInvoices.length > 0 ? 
            (purchasesWithInventoryUpdate.length / purchaseInvoices.length) * 100 : 0,
          
          totalInventoryMovements: movements.length,
          linkedMovements: movements.filter((mov: any) => mov.referenceId).length,
          movementLinkRate: movements.length > 0 ? 
            (movements.filter((mov: any) => mov.referenceId).length / movements.length) * 100 : 0
        }
      };
    } catch (error) {
      console.error('Error generating system integration report:', error);
      return null;
    }
  }

  // تقرير التنبيهات والمخاطر
  getRisksAndAlertsReport() {
    try {
      const lowStockProducts = inventoryManager.getProducts().filter(p => p.stock <= p.minStock);
      const overdueCustomers = customerIntegrationManager.getOverdueCustomers();
      const overdueChecks = checksManager.getOverdueChecks();
      const overdueInstallments = storage.getItem('installments', [])
        .filter((inst: any) => inst.status === 'pending' && new Date(inst.dueDate) < new Date());

      return {
        inventory: {
          lowStockCount: lowStockProducts.length,
          outOfStockCount: lowStockProducts.filter(p => p.stock === 0).length,
          lowStockValue: lowStockProducts.reduce((sum: number, p: any) => sum + (p.stock * p.cost), 0)
        },
        customers: {
          overdueCustomersCount: overdueCustomers.length,
          totalOverdueAmount: overdueCustomers.reduce((sum: number, c: any) => sum + (c.totalDebt || 0), 0)
        },
        checks: {
          overdueChecksCount: overdueChecks.length,
          overdueChecksAmount: overdueChecks.reduce((sum: number, c: any) => sum + c.amount, 0)
        },
        installments: {
          overdueInstallmentsCount: overdueInstallments.length,
          overdueInstallmentsAmount: overdueInstallments.reduce((sum: number, i: any) => sum + i.amount, 0)
        }
      };
    } catch (error) {
      console.error('Error generating risks and alerts report:', error);
      return null;
    }
  }
}

export const unifiedReportsManager = UnifiedReportsManager.getInstance();