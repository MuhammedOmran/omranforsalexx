import { storage } from './storage';
import { logger } from './logger';

export interface CashFlowTransaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: 'sales' | 'purchases' | 'payroll' | 'utilities' | 'rent' | 'marketing' | 'other';
  subcategory?: string;
  amount: number;
  description: string;
  referenceId?: string; // ID of related invoice, payroll, etc.
  referenceType?: 'sales_invoice' | 'purchase_invoice' | 'payroll' | 'manual' | 'expense_system';
  paymentMethod: 'cash' | 'bank' | 'credit' | 'check';
  attachments?: string[];
  notes?: string;
  createdAt: string;
  createdBy?: string;
  metadata?: {
    sourceSystem?: string;
    originalCategory?: string;
    autoSynced?: boolean;
    [key: string]: any;
  };
}

export interface CashFlowSummary {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  openingBalance: number;
  closingBalance: number;
  period: {
    start: string;
    end: string;
  };
}

export interface CashFlowReport {
  summary: CashFlowSummary;
  transactions: CashFlowTransaction[];
  categoryBreakdown: {
    income: { [key: string]: number };
    expenses: { [key: string]: number };
  };
  monthlyTrends: {
    month: string;
    income: number;
    expenses: number;
    netFlow: number;
  }[];
}

export class CashFlowManager {
  private static instance: CashFlowManager;

  static getInstance(): CashFlowManager {
    if (!CashFlowManager.instance) {
      CashFlowManager.instance = new CashFlowManager();
    }
    return CashFlowManager.instance;
  }

  // Get all cash flow transactions
  getTransactions(): CashFlowTransaction[] {
    return storage.getItem('cash_flow_transactions', []);
  }

  // Add a new cash flow transaction
  addTransaction(transaction: Omit<CashFlowTransaction, 'id' | 'createdAt'>): boolean {
    try {
      const transactions = this.getTransactions();
      const newTransaction: CashFlowTransaction = {
        ...transaction,
        id: `CF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString()
      };

      transactions.push(newTransaction);
      storage.setItem('cash_flow_transactions', transactions);
      
      // Update account balances
      this.updateAccountBalances();
      
      return true;
    } catch (error) {
      logger.error('Error adding cash flow transaction:', error);
      return false;
    }
  }

  // Sync sales invoices to cash flow
  syncSalesInvoices(): void {
    try {
      const salesInvoices = storage.getItem('sales_invoices', []);
      const existingTransactions = this.getTransactions();
      
      for (const invoice of salesInvoices) {
        // Skip if already synced
        const alreadySynced = existingTransactions.some(
          t => t.referenceId === invoice.id && t.referenceType === 'sales_invoice'
        );
        
        if (!alreadySynced && invoice.paymentStatus === 'paid') {
          this.addTransaction({
            date: invoice.date,
            type: 'income',
            category: 'sales',
            amount: invoice.total,
            description: `مبيعات - فاتورة رقم ${invoice.id}`,
            referenceId: invoice.id,
            referenceType: 'sales_invoice',
            paymentMethod: invoice.paymentMethod === 'cash' ? 'cash' : 'credit',
            notes: `عميل: ${invoice.customerName}`
          });
        }
      }
    } catch (error) {
      logger.error('Error syncing sales invoices:', error);
    }
  }

  // تم إزالة مزامنة فواتير الشراء مع الصندوق
  syncPurchaseInvoices(): void {
    // تم إلغاء هذه الميزة - لا يتم ربط فواتير الشراء بالصندوق تلقائياً
    console.log('مزامنة فواتير الشراء مع الصندوق تم إلغاؤها');
  }

  // Sync payroll to cash flow
  syncPayrollRecords(): void {
    try {
      const payrollRecords = storage.getItem('payroll_records', []);
      const existingTransactions = this.getTransactions();
      
      for (const record of payrollRecords) {
        // Skip if already synced
        const alreadySynced = existingTransactions.some(
          t => t.referenceId === record.id && t.referenceType === 'payroll'
        );
        
        if (!alreadySynced && record.isPaid) {
          this.addTransaction({
            date: record.paidDate || new Date().toISOString(),
            type: 'expense',
            category: 'payroll',
            subcategory: record.employeeName,
            amount: record.netSalary,
            description: `راتب - ${record.employeeName} - ${record.month}/${record.year}`,
            referenceId: record.id,
            referenceType: 'payroll',
            paymentMethod: 'bank', // Usually paid via bank
            notes: `راتب أساسي: ${record.basicSalary}, بدلات: ${record.allowances}, خصومات: ${record.deductions}`
          });
        }
      }
    } catch (error) {
      logger.error('Error syncing payroll records:', error);
    }
  }

  // Get transactions by date range
  getTransactionsByDateRange(startDate: string, endDate: string): CashFlowTransaction[] {
    const transactions = this.getTransactions();
    return transactions.filter(t => {
      const transactionDate = new Date(t.date).getTime();
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      return transactionDate >= start && transactionDate <= end;
    });
  }

  // Generate cash flow report
  generateCashFlowReport(startDate: string, endDate: string): CashFlowReport {
    const transactions = this.getTransactionsByDateRange(startDate, endDate);
    
    const income = transactions.filter(t => t.type === 'income');
    const expenses = transactions.filter(t => t.type === 'expense');
    
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    const netCashFlow = totalIncome - totalExpenses;
    
    // Get opening balance
    const openingBalance = this.getOpeningBalance(startDate);
    const closingBalance = openingBalance + netCashFlow;
    
    // Category breakdown
    const incomeCategories: { [key: string]: number } = {};
    const expenseCategories: { [key: string]: number } = {};
    
    income.forEach(t => {
      incomeCategories[t.category] = (incomeCategories[t.category] || 0) + t.amount;
    });
    
    expenses.forEach(t => {
      expenseCategories[t.category] = (expenseCategories[t.category] || 0) + t.amount;
    });
    
    // Monthly trends (last 12 months)
    const monthlyTrends = this.getMonthlyTrends();
    
    return {
      summary: {
        totalIncome,
        totalExpenses,
        netCashFlow,
        openingBalance,
        closingBalance,
        period: { start: startDate, end: endDate }
      },
      transactions: transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      categoryBreakdown: {
        income: incomeCategories,
        expenses: expenseCategories
      },
      monthlyTrends
    };
  }

  // Get opening balance for a date
  private getOpeningBalance(date: string): number {
    const allTransactions = this.getTransactions();
    const transactionsBeforeDate = allTransactions.filter(
      t => new Date(t.date) < new Date(date)
    );
    
    const totalIncome = transactionsBeforeDate
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = transactionsBeforeDate
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return totalIncome - totalExpenses;
  }

  // Get monthly trends for the last 12 months
  private getMonthlyTrends(): { month: string; income: number; expenses: number; netFlow: number; }[] {
    const trends = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      
      const monthTransactions = this.getTransactionsByDateRange(
        startOfMonth.toISOString(),
        endOfMonth.toISOString()
      );
      
      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      trends.push({
        month: monthDate.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' }),
        income,
        expenses,
        netFlow: income - expenses
      });
    }
    
    return trends;
  }

  // Update account balances based on transactions
  private updateAccountBalances(): void {
    try {
      const transactions = this.getTransactions();
      const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const currentBalance = totalIncome - totalExpenses;
      
      // Store current balance
      storage.setItem('account_balance', {
        currentBalance,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error updating account balances:', error);
    }
  }

  // Get current account balance
  getCurrentBalance(): number {
    const balanceData = storage.getItem('account_balance', { currentBalance: 0 });
    return balanceData.currentBalance;
  }

  // Sync all financial data
  syncAllFinancialData(): void {
    this.syncSalesInvoices();
    // تم إزالة مزامنة فواتير الشراء
    this.syncPayrollRecords();
    this.updateAccountBalances();
  }

  // Get financial summary for dashboard
  getFinancialSummary() {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const thisMonthTransactions = this.getTransactionsByDateRange(
      thisMonth.toISOString(),
      now.toISOString()
    );
    
    const lastMonthTransactions = this.getTransactionsByDateRange(
      lastMonth.toISOString(),
      endOfLastMonth.toISOString()
    );
    
    const thisMonthIncome = thisMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const thisMonthExpenses = thisMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const lastMonthIncome = lastMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const lastMonthExpenses = lastMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const incomeGrowth = lastMonthIncome > 0 ? 
      ((thisMonthIncome - lastMonthIncome) / lastMonthIncome) * 100 : 0;
    
    const expenseGrowth = lastMonthExpenses > 0 ? 
      ((thisMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 : 0;
    
    return {
      currentBalance: this.getCurrentBalance(),
      thisMonthIncome,
      thisMonthExpenses,
      thisMonthNetFlow: thisMonthIncome - thisMonthExpenses,
      incomeGrowth,
      expenseGrowth,
      recentTransactions: this.getTransactions()
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10)
    };
  }
}

// Export singleton instance
export const cashFlowManager = CashFlowManager.getInstance();