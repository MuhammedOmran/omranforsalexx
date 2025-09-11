import { storage } from './storage';
import { cashFlowManager } from './cashFlowManager';
import { expensesManager } from './expensesManager';
import { employeeManager, Employee } from './employeeManager';

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  month: number;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  totalAmount: number; // Adding this field for compatibility
  date: string; // Adding this field for compatibility
  isPaid: boolean;
  paidDate?: string;
  paymentReference?: string;
  createdAt: string;
  notes?: string;
}

export interface SalaryAdjustment {
  id: string;
  employeeId: string;
  type: 'bonus' | 'deduction' | 'allowance';
  amount: number;
  reason: string;
  appliedMonth: number;
  appliedYear: number;
  createdAt: string;
  createdBy: string;
}

export class PayrollManager {
  private static instance: PayrollManager;

  static getInstance(): PayrollManager {
    if (!PayrollManager.instance) {
      PayrollManager.instance = new PayrollManager();
    }
    return PayrollManager.instance;
  }

  // Get all payroll records
  getPayrollRecords(): PayrollRecord[] {
    return storage.getItem('payroll_records', []);
  }

  // Get payroll records for specific month/year
  getPayrollByPeriod(month: number, year: number): PayrollRecord[] {
    const records = this.getPayrollRecords();
    return records.filter(record => record.month === month && record.year === year);
  }

  // Get payroll records for specific employee
  getEmployeePayroll(employeeId: string): PayrollRecord[] {
    const records = this.getPayrollRecords();
    return records.filter(record => record.employeeId === employeeId);
  }

  // Get payroll records by date range
  getPayrollByDateRange(startDate: string, endDate: string): PayrollRecord[] {
    const records = this.getPayrollRecords();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return records.filter(record => {
      const recordDate = new Date(record.year, record.month - 1, 1);
      return recordDate >= start && recordDate <= end;
    });
  }

  // Generate payroll for a specific period
  generatePayroll(month: number, year: number): { success: boolean; message: string; recordsGenerated: number } {
    try {
      const existingRecords = this.getPayrollByPeriod(month, year);
      if (existingRecords.length > 0) {
        return {
          success: false,
          message: 'كشف الرواتب لهذه الفترة موجود بالفعل',
          recordsGenerated: 0
        };
      }

      const employees = employeeManager.getEmployees().filter(emp => emp.status === 'active');
      const adjustments = this.getSalaryAdjustments().filter(adj => 
        adj.appliedMonth === month && adj.appliedYear === year
      );

      const newRecords: PayrollRecord[] = employees.map(employee => {
        // Calculate adjustments for this employee
        const employeeAdjustments = adjustments.filter(adj => adj.employeeId === employee.id);
        const totalAllowances = employeeAdjustments
          .filter(adj => adj.type === 'allowance' || adj.type === 'bonus')
          .reduce((sum, adj) => sum + adj.amount, 0);
        const totalDeductions = employeeAdjustments
          .filter(adj => adj.type === 'deduction')
          .reduce((sum, adj) => sum + adj.amount, 0);

        const netSalary = employee.salary + totalAllowances - totalDeductions;

        return {
          id: `PAY_${Date.now()}_${employee.id}_${month}_${year}`,
          employeeId: employee.id,
          employeeName: employee.name,
          month,
          year,
          basicSalary: employee.salary,
          allowances: totalAllowances,
          deductions: totalDeductions,
          netSalary,
          totalAmount: netSalary, // For compatibility
          date: new Date(year, month - 1, 1).toISOString(), // For compatibility
          isPaid: false,
          createdAt: new Date().toISOString()
        };
      });

      // Save payroll records
      const allRecords = [...this.getPayrollRecords(), ...newRecords];
      storage.setItem('payroll_records', allRecords);

      return {
        success: true,
        message: `تم إنشاء كشف الرواتب بنجاح`,
        recordsGenerated: newRecords.length
      };
    } catch (error) {
      console.error('Error generating payroll:', error);
      return {
        success: false,
        message: 'حدث خطأ أثناء إنشاء كشف الرواتب',
        recordsGenerated: 0
      };
    }
  }

  // Pay salary for an employee
  paySalary(recordId: string, paymentMethod: 'cash' | 'bank' | 'check' = 'bank'): boolean {
    try {
      const records = this.getPayrollRecords();
      const recordIndex = records.findIndex(r => r.id === recordId);
      
      if (recordIndex === -1) return false;

      const record = records[recordIndex];
      if (record.isPaid) return false;

      // Mark as paid
      record.isPaid = true;
      record.paidDate = new Date().toISOString();
      record.paymentReference = `PAY_${Date.now()}`;

      // Add to cash flow
      cashFlowManager.addTransaction({
        date: new Date().toISOString(),
        type: 'expense',
        category: 'payroll',
        subcategory: 'رواتب',
        amount: record.netSalary,
        description: `راتب ${record.employeeName} - ${this.getMonthName(record.month)}/${record.year}`,
        referenceId: record.id,
        referenceType: 'payroll',
        paymentMethod,
        notes: `راتب أساسي: ${record.basicSalary}، بدلات: ${record.allowances}، خصومات: ${record.deductions}`
      });

      // Add to expenses if needed for tracking
      expensesManager.addExpense({
        category: 'الرواتب والأجور',
        amount: record.netSalary,
        description: `راتب ${record.employeeName} - ${this.getMonthName(record.month)}/${record.year}`,
        date: record.paidDate || new Date().toISOString(),
        status: 'paid',
        notes: `راتب أساسي: ${record.basicSalary}، بدلات: ${record.allowances}، خصومات: ${record.deductions}`
      });

      storage.setItem('payroll_records', records);
      return true;
    } catch (error) {
      console.error('Error paying salary:', error);
      return false;
    }
  }

  // Add salary adjustment
  addSalaryAdjustment(adjustment: Omit<SalaryAdjustment, 'id' | 'createdAt'>): boolean {
    try {
      const newAdjustment: SalaryAdjustment = {
        ...adjustment,
        id: `ADJ_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        createdAt: new Date().toISOString()
      };

      const adjustments = this.getSalaryAdjustments();
      adjustments.push(newAdjustment);
      storage.setItem('salary_adjustments', adjustments);

      return true;
    } catch (error) {
      console.error('Error adding salary adjustment:', error);
      return false;
    }
  }

  // Get salary adjustments
  getSalaryAdjustments(): SalaryAdjustment[] {
    return storage.getItem('salary_adjustments', []);
  }

  // Get payroll statistics
  getPayrollStatistics() {
    const records = this.getPayrollRecords();
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const currentMonthRecords = records.filter(r => r.month === currentMonth && r.year === currentYear);
    const paidThisMonth = currentMonthRecords.filter(r => r.isPaid);
    const unpaidThisMonth = currentMonthRecords.filter(r => !r.isPaid);

    const totalPaidAmount = paidThisMonth.reduce((sum, r) => sum + r.netSalary, 0);
    const totalUnpaidAmount = unpaidThisMonth.reduce((sum, r) => sum + r.netSalary, 0);

    return {
      totalEmployees: currentMonthRecords.length,
      paidEmployees: paidThisMonth.length,
      unpaidEmployees: unpaidThisMonth.length,
      totalPaidAmount,
      totalUnpaidAmount,
      totalPayrollBudget: totalPaidAmount + totalUnpaidAmount,
      paymentRate: currentMonthRecords.length > 0 ? (paidThisMonth.length / currentMonthRecords.length) * 100 : 0
    };
  }

  // Get monthly payroll summary
  getMonthlyPayrollSummary(month: number, year: number) {
    const records = this.getPayrollByPeriod(month, year);
    const employees = employeeManager.getEmployees();
    
    const summary = {
      period: { month, year, monthName: this.getMonthName(month) },
      totalRecords: records.length,
      paidRecords: records.filter(r => r.isPaid).length,
      unpaidRecords: records.filter(r => !r.isPaid).length,
      totalBasicSalary: records.reduce((sum, r) => sum + r.basicSalary, 0),
      totalAllowances: records.reduce((sum, r) => sum + r.allowances, 0),
      totalDeductions: records.reduce((sum, r) => sum + r.deductions, 0),
      totalNetSalary: records.reduce((sum, r) => sum + r.netSalary, 0),
      paidAmount: records.filter(r => r.isPaid).reduce((sum, r) => sum + r.netSalary, 0),
      unpaidAmount: records.filter(r => !r.isPaid).reduce((sum, r) => sum + r.netSalary, 0),
      departmentBreakdown: this.getDepartmentPayrollBreakdown(records, employees)
    };

    return summary;
  }

  // Get department payroll breakdown
  private getDepartmentPayrollBreakdown(records: PayrollRecord[], employees: Employee[]) {
    const breakdown: { [key: string]: { count: number; totalSalary: number; paidCount: number } } = {};
    
    records.forEach(record => {
      const employee = employees.find(emp => emp.id === record.employeeId);
      const department = employee?.department || 'غير محدد';
      
      if (!breakdown[department]) {
        breakdown[department] = { count: 0, totalSalary: 0, paidCount: 0 };
      }
      
      breakdown[department].count++;
      breakdown[department].totalSalary += record.netSalary;
      if (record.isPaid) {
        breakdown[department].paidCount++;
      }
    });

    return Object.entries(breakdown).map(([department, data]) => ({
      department,
      employeeCount: data.count,
      totalSalary: data.totalSalary,
      paidCount: data.paidCount,
      unpaidCount: data.count - data.paidCount,
      averageSalary: data.totalSalary / data.count
    }));
  }

  // Sync with financial systems
  syncWithFinancialSystems(): void {
    try {
      // This method ensures payroll data is in sync with cash flow and expenses
      const paidRecords = this.getPayrollRecords().filter(r => r.isPaid);
      
      // Verify all paid salaries are in cash flow
      paidRecords.forEach(record => {
        const transactions = cashFlowManager.getTransactions();
        const hasTransaction = transactions.some(t => 
          t.referenceId === record.id && t.referenceType === 'payroll'
        );
        
        if (!hasTransaction) {
          // Re-add missing transaction
          cashFlowManager.addTransaction({
            date: record.paidDate || new Date().toISOString(),
            type: 'expense',
            category: 'payroll',
            subcategory: 'رواتب',
            amount: record.netSalary,
            description: `راتب ${record.employeeName} - ${this.getMonthName(record.month)}/${record.year}`,
            referenceId: record.id,
            referenceType: 'payroll',
            paymentMethod: 'bank',
            notes: `مزامنة تلقائية`
          });
        }
      });
    } catch (error) {
      console.error('Error syncing payroll with financial systems:', error);
    }
  }

  // Helper method to get month name
  private getMonthName(month: number): string {
    const months = [
      '', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return months[month] || 'غير محدد';
  }

  // Export payroll data for accounting
  exportPayrollData(month?: number, year?: number) {
    try {
      let records = this.getPayrollRecords();
      
      if (month && year) {
        records = records.filter(r => r.month === month && r.year === year);
      }

      return {
        exportDate: new Date().toISOString(),
        period: month && year ? { month, year } : 'جميع الفترات',
        totalRecords: records.length,
        records: records.map(record => ({
          ...record,
          monthName: this.getMonthName(record.month)
        }))
      };
    } catch (error) {
      console.error('Error exporting payroll data:', error);
      return null;
    }
  }
}

// Export singleton instance
export const payrollManager = PayrollManager.getInstance();