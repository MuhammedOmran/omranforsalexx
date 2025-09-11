import { storage } from './storage';
import { cashFlowManager } from './cashFlowManager';
import { logger } from './logger';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
  status: 'paid' | 'pending';
  employeeId?: string;
  employeeName?: string;
  createdBy?: string;
  createdAt: string;
}

export interface DeletedExpense extends Expense {
  deletedAt: string;
  deletedBy?: string;
}

export class ExpensesManager {
  private static instance: ExpensesManager;

  static getInstance(): ExpensesManager {
    if (!ExpensesManager.instance) {
      ExpensesManager.instance = new ExpensesManager();
    }
    return ExpensesManager.instance;
  }

  // Get all expenses
  getExpenses(): Expense[] {
    return storage.getItem('expenses', []);
  }

  // Get deleted expenses
  getDeletedExpenses(): DeletedExpense[] {
    return storage.getItem('deleted_expenses', []);
  }

  // Add new expense with cash flow integration
  addExpense(expense: Omit<Expense, 'id' | 'createdAt'>): boolean {
    try {
      const newExpense: Expense = {
        ...expense,
        id: `EXP_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        createdAt: new Date().toISOString()
      };

      const expenses = this.getExpenses();
      expenses.push(newExpense);
      storage.setItem('expenses', expenses);

      // Add to cash flow if paid
      if (newExpense.status === 'paid') {
        this.addToCashFlow(newExpense);
      }

      return true;
    } catch (error) {
      logger.error('Error adding expense:', error);
      return false;
    }
  }

  // Update expense
  updateExpense(id: string, updates: Partial<Expense>): boolean {
    try {
      const expenses = this.getExpenses();
      const expenseIndex = expenses.findIndex(exp => exp.id === id);
      
      if (expenseIndex === -1) return false;

      const oldExpense = expenses[expenseIndex];
      const updatedExpense = { ...oldExpense, ...updates };

      expenses[expenseIndex] = updatedExpense;
      storage.setItem('expenses', expenses);

      // Handle cash flow changes
      if (oldExpense.status !== updatedExpense.status) {
        if (updatedExpense.status === 'paid' && oldExpense.status === 'pending') {
          this.addToCashFlow(updatedExpense);
        } else if (updatedExpense.status === 'pending' && oldExpense.status === 'paid') {
          this.removeFromCashFlow(updatedExpense);
        }
      }

      return true;
    } catch (error) {
      logger.error('Error updating expense:', error);
      return false;
    }
  }

  // Soft delete expense (move to deleted list)
  deleteExpense(id: string, deletedBy?: string): boolean {
    try {
      const expenses = this.getExpenses();
      const expenseToDelete = expenses.find(exp => exp.id === id);
      
      if (!expenseToDelete) return false;

      // Add to deleted expenses
      const deletedExpense: DeletedExpense = {
        ...expenseToDelete,
        deletedAt: new Date().toISOString(),
        deletedBy: deletedBy || 'مستخدم النظام'
      };

      const deletedExpenses = this.getDeletedExpenses();
      deletedExpenses.push(deletedExpense);
      storage.setItem('deleted_expenses', deletedExpenses);

      // Remove from active expenses
      const updatedExpenses = expenses.filter(exp => exp.id !== id);
      storage.setItem('expenses', updatedExpenses);

      // Remove from cash flow if it was paid
      if (expenseToDelete.status === 'paid') {
        this.removeFromCashFlow(expenseToDelete);
      }

      return true;
    } catch (error) {
      logger.error('Error deleting expense:', error);
      return false;
    }
  }

  // Restore deleted expense
  restoreExpense(id: string): boolean {
    try {
      const deletedExpenses = this.getDeletedExpenses();
      const expenseToRestore = deletedExpenses.find(exp => exp.id === id);
      
      if (!expenseToRestore) return false;

      // Remove from deleted expenses
      const updatedDeletedExpenses = deletedExpenses.filter(exp => exp.id !== id);
      storage.setItem('deleted_expenses', updatedDeletedExpenses);

      // Add back to active expenses
      const { deletedAt, deletedBy, ...restoredExpense } = expenseToRestore;
      const expenses = this.getExpenses();
      expenses.push(restoredExpense);
      storage.setItem('expenses', expenses);

      // Add back to cash flow if paid
      if (restoredExpense.status === 'paid') {
        this.addToCashFlow(restoredExpense);
      }

      return true;
    } catch (error) {
      logger.error('Error restoring expense:', error);
      return false;
    }
  }

  // Permanently delete expense
  permanentDeleteExpense(id: string): boolean {
    try {
      const deletedExpenses = this.getDeletedExpenses();
      const updatedDeletedExpenses = deletedExpenses.filter(exp => exp.id !== id);
      storage.setItem('deleted_expenses', updatedDeletedExpenses);

      return true;
    } catch (error) {
      logger.error('Error permanently deleting expense:', error);
      return false;
    }
  }

  // Delete all expenses (soft delete)
  deleteAllExpenses(deletedBy?: string): boolean {
    try {
      const expenses = this.getExpenses();
      if (expenses.length === 0) return true;

      const deletedExpensesFromAll: DeletedExpense[] = expenses.map(expense => ({
        ...expense,
        deletedAt: new Date().toISOString(),
        deletedBy: deletedBy || 'مستخدم النظام'
      }));

      const deletedExpenses = this.getDeletedExpenses();
      const updatedDeletedExpenses = [...deletedExpenses, ...deletedExpensesFromAll];
      storage.setItem('deleted_expenses', updatedDeletedExpenses);

      // Clear active expenses
      storage.setItem('expenses', []);

      // Remove all paid expenses from cash flow
      expenses.forEach(expense => {
        if (expense.status === 'paid') {
          this.removeFromCashFlow(expense);
        }
      });

      return true;
    } catch (error) {
      logger.error('Error deleting all expenses:', error);
      return false;
    }
  }

  // Clear all deleted expenses permanently
  clearDeletedExpenses(): boolean {
    try {
      storage.setItem('deleted_expenses', []);
      return true;
    } catch (error) {
      logger.error('Error clearing deleted expenses:', error);
      return false;
    }
  }

  // Get expenses by category
  getExpensesByCategory(category: string): Expense[] {
    const expenses = this.getExpenses();
    return expenses.filter(exp => exp.category === category);
  }

  // Get expenses by date range
  getExpensesByDateRange(startDate: string, endDate: string): Expense[] {
    const expenses = this.getExpenses();
    return expenses.filter(exp => {
      const expenseDate = new Date(exp.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return expenseDate >= start && expenseDate <= end;
    });
  }

  // Get expense statistics
  getExpenseStatistics() {
    const expenses = this.getExpenses();
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const paidExpenses = expenses.filter(e => e.status === 'paid').reduce((sum, exp) => sum + exp.amount, 0);
    const pendingExpenses = expenses.filter(e => e.status === 'pending').reduce((sum, exp) => sum + exp.amount, 0);

    // Category breakdown
    const categoryBreakdown: { [key: string]: number } = {};
    expenses.forEach(exp => {
      categoryBreakdown[exp.category] = (categoryBreakdown[exp.category] || 0) + exp.amount;
    });

    return {
      totalExpenses,
      paidExpenses,
      pendingExpenses,
      expenseCount: expenses.length,
      categoryBreakdown,
      deletedCount: this.getDeletedExpenses().length
    };
  }

  // Add expense to cash flow with smart conflict prevention
  private addToCashFlow(expense: Expense): void {
    try {
      // Check if this expense already exists in cash flow
      const existingTransactions = cashFlowManager.getTransactions();
      const alreadyExists = existingTransactions.some(t => 
        t.referenceId === expense.id && t.referenceType === 'expense_system'
      );
      
      if (alreadyExists) {
        logger.warn('Expense already synced with cash flow:', expense.id);
        return;
      }

      cashFlowManager.addTransaction({
        date: expense.date,
        type: 'expense',
        category: this.mapExpenseCategory(expense.category),
        subcategory: expense.category,
        amount: expense.amount,
        description: `[نظام المصروفات] ${expense.description}`,
        referenceId: expense.id,
        referenceType: 'expense_system', // Changed from 'manual' to identify source
        paymentMethod: 'cash',
        notes: expense.notes,
        createdBy: expense.createdBy,
        metadata: {
          sourceSystem: 'expenses',
          originalCategory: expense.category,
          autoSynced: true
        }
      });
    } catch (error) {
      logger.error('Error adding expense to cash flow:', error);
    }
  }

  // Remove expense from cash flow with smart filtering
  private removeFromCashFlow(expense: Expense): void {
    try {
      // Get cash flow transactions and remove only expense system entries
      const transactions = cashFlowManager.getTransactions();
      const updatedTransactions = transactions.filter(t => 
        !(t.referenceId === expense.id && t.referenceType === 'expense_system')
      );
      storage.setItem('cash_flow_transactions', updatedTransactions);
    } catch (error) {
      logger.error('Error removing expense from cash flow:', error);
    }
  }

  // Map expense category to cash flow category
  private mapExpenseCategory(expenseCategory: string): 'sales' | 'purchases' | 'payroll' | 'utilities' | 'rent' | 'marketing' | 'other' {
    const categoryMap: { [key: string]: any } = {
      'إيجار المحل': 'rent',
      'الكهرباء والمياه': 'utilities',
      'رواتب الموظفين': 'payroll',
      'مصاريف التسويق': 'marketing',
      'صيانة المعدات': 'other',
      'مصاريف النقل': 'other',
      'أخرى': 'other'
    };

    return categoryMap[expenseCategory] || 'other';
  }

  // Smart sync to prevent conflicts and duplicates
  syncWithCashFlow(): void {
    try {
      const expenses = this.getExpenses().filter(exp => exp.status === 'paid');
      const existingTransactions = cashFlowManager.getTransactions();
      
      expenses.forEach(expense => {
        // Check if already synced from expense system specifically
        const alreadySynced = existingTransactions.some(t => 
          t.referenceId === expense.id && t.referenceType === 'expense_system'
        );
        if (!alreadySynced) {
          this.addToCashFlow(expense);
        }
      });
    } catch (error) {
      logger.error('Error syncing expenses with cash flow:', error);
    }
  }

  // Get conflicts between manual cash flow expenses and expense system
  getConflicts(): Array<{type: string, description: string, amount: number, suggestions: string[]}> {
    try {
      const expenses = this.getExpenses();
      const cashFlowTransactions = cashFlowManager.getTransactions();
      
      // Find manual expense entries that might conflict
      const manualExpenses = cashFlowTransactions.filter(t => 
        t.type === 'expense' && t.referenceType === 'manual'
      );
      
      const conflicts: Array<{type: string, description: string, amount: number, suggestions: string[]}> = [];
      
      manualExpenses.forEach(manualExpense => {
        // Look for similar expenses in expense system
        const similarExpenses = expenses.filter(exp => {
          const amountMatch = Math.abs(exp.amount - manualExpense.amount) < 0.01;
          const dateMatch = exp.date === manualExpense.date;
          const descriptionSimilar = exp.description.includes(manualExpense.description.replace('[نظام المصروفات] ', '')) ||
                                   manualExpense.description.includes(exp.description);
          
          return amountMatch && (dateMatch || descriptionSimilar);
        });
        
        if (similarExpenses.length > 0) {
          conflicts.push({
            type: 'potential_duplicate',
            description: manualExpense.description,
            amount: manualExpense.amount,
            suggestions: [
              'حذف المدخل اليدوي من الصندوق',
              'دمج البيانات في نظام المصروفات',
              'تجاهل إذا كانت مصروفات مختلفة'
            ]
          });
        }
      });
      
      return conflicts;
    } catch (error) {
      logger.error('Error getting conflicts:', error);
      return [];
    }
  }

  // Auto-resolve conflicts by preference
  autoResolveConflicts(preference: 'keep_manual' | 'keep_expense_system' | 'merge'): boolean {
    try {
      const conflicts = this.getConflicts();
      if (conflicts.length === 0) return true;

      const transactions = cashFlowManager.getTransactions();
      
      switch (preference) {
        case 'keep_expense_system':
          // Remove manual entries that have expense system equivalents
          const filteredTransactions = transactions.filter(t => {
            if (t.type !== 'expense' || t.referenceType !== 'manual') return true;
            
            const hasExpenseSystemEquivalent = this.getExpenses().some(exp => 
              Math.abs(exp.amount - t.amount) < 0.01 && 
              (exp.date === t.date || exp.description.includes(t.description))
            );
            
            return !hasExpenseSystemEquivalent;
          });
          
          storage.setItem('cash_flow_transactions', filteredTransactions);
          break;
          
        case 'keep_manual':
          // Don't auto-sync expenses that have manual equivalents
          // This is handled in addToCashFlow method
          break;
          
        case 'merge':
          // Keep both but add clear labels
          // Already handled by the description prefixes
          break;
      }
      
      return true;
    } catch (error) {
      logger.error('Error auto-resolving conflicts:', error);
      return false;
    }
  }
}

// Export singleton instance
export const expensesManager = ExpensesManager.getInstance();