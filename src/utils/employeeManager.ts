import { storage } from './storage';
import { cashFlowManager } from './cashFlowManager';

export interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  salary: number;
  phoneNumber: string;
  email: string;
  startDate: string;
  status: "active" | "inactive" | "vacation";
  nationalId: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  createdAt: string;
  updatedAt: string;
  lastActivity?: string;
}

export interface EmployeeActivity {
  id: string;
  employeeId: string;
  action: 'created' | 'updated' | 'status_changed' | 'salary_changed' | 'deleted';
  details: string;
  performedBy: string;
  timestamp: string;
  previousValue?: any;
  newValue?: any;
}

export class EmployeeManager {
  private static instance: EmployeeManager;

  static getInstance(): EmployeeManager {
    if (!EmployeeManager.instance) {
      EmployeeManager.instance = new EmployeeManager();
    }
    return EmployeeManager.instance;
  }

  // Get all employees
  getEmployees(): Employee[] {
    return storage.getItem('employees', []);
  }

  // Get employee by ID
  getEmployeeById(id: string): Employee | null {
    const employees = this.getEmployees();
    return employees.find(emp => emp.id === id) || null;
  }

  // Add new employee
  addEmployee(employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): boolean {
    try {
      const employees = this.getEmployees();
      const newEmployee: Employee = {
        ...employee,
        id: `EMP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      employees.push(newEmployee);
      storage.setItem('employees', employees);

      // Log activity
      this.logActivity({
        employeeId: newEmployee.id,
        action: 'created',
        details: `تم إضافة الموظف ${newEmployee.name} في منصب ${newEmployee.position}`,
        performedBy: 'النظام'
      });

      return true;
    } catch (error) {
      console.error('Error adding employee:', error);
      return false;
    }
  }

  // Update employee
  updateEmployee(id: string, updates: Partial<Employee>): boolean {
    try {
      const employees = this.getEmployees();
      const employeeIndex = employees.findIndex(emp => emp.id === id);
      
      if (employeeIndex === -1) return false;

      const currentEmployee = employees[employeeIndex];
      const updatedEmployee = {
        ...currentEmployee,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      employees[employeeIndex] = updatedEmployee;
      storage.setItem('employees', employees);

      // Log salary changes for payroll integration
      if (updates.salary && updates.salary !== currentEmployee.salary) {
        this.logActivity({
          employeeId: id,
          action: 'salary_changed',
          details: `تم تغيير راتب ${currentEmployee.name} من ${currentEmployee.salary} إلى ${updates.salary}`,
          performedBy: 'النظام',
          previousValue: currentEmployee.salary,
          newValue: updates.salary
        });
      }

      // Log status changes
      if (updates.status && updates.status !== currentEmployee.status) {
        this.logActivity({
          employeeId: id,
          action: 'status_changed',
          details: `تم تغيير حالة ${currentEmployee.name} من ${currentEmployee.status} إلى ${updates.status}`,
          performedBy: 'النظام',
          previousValue: currentEmployee.status,
          newValue: updates.status
        });
      }

      return true;
    } catch (error) {
      console.error('Error updating employee:', error);
      return false;
    }
  }

  // Delete employee (soft delete)
  deleteEmployee(id: string): boolean {
    try {
      const employees = this.getEmployees();
      const deletedEmployees = storage.getItem('deletedEmployees', []);
      
      const employeeIndex = employees.findIndex(emp => emp.id === id);
      if (employeeIndex === -1) return false;

      const employeeToDelete = employees[employeeIndex];
      
      // Move to deleted employees
      deletedEmployees.push({
        ...employeeToDelete,
        deletedAt: new Date().toISOString()
      });
      
      // Remove from active employees
      employees.splice(employeeIndex, 1);
      
      storage.setItem('employees', employees);
      storage.setItem('deletedEmployees', deletedEmployees);

      // Log activity
      this.logActivity({
        employeeId: id,
        action: 'deleted',
        details: `تم حذف الموظف ${employeeToDelete.name}`,
        performedBy: 'النظام'
      });

      return true;
    } catch (error) {
      console.error('Error deleting employee:', error);
      return false;
    }
  }

  // Get employee activities
  getEmployeeActivities(employeeId?: string): EmployeeActivity[] {
    const activities = storage.getItem('employee_activities', []);
    return employeeId ? activities.filter(a => a.employeeId === employeeId) : activities;
  }

  // Log employee activity
  private logActivity(activity: Omit<EmployeeActivity, 'id' | 'timestamp'>): void {
    try {
      const activities = this.getEmployeeActivities();
      const newActivity: EmployeeActivity = {
        ...activity,
        id: `ACT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString()
      };

      activities.push(newActivity);
      storage.setItem('employee_activities', activities);
    } catch (error) {
      console.error('Error logging employee activity:', error);
    }
  }

  // Get employee statistics
  getEmployeeStatistics() {
    const employees = this.getEmployees();
    const activities = this.getEmployeeActivities();
    
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(emp => emp.status === 'active').length;
    const onVacationEmployees = employees.filter(emp => emp.status === 'vacation').length;
    const inactiveEmployees = employees.filter(emp => emp.status === 'inactive').length;
    
    const totalSalaries = employees
      .filter(emp => emp.status === 'active')
      .reduce((sum, emp) => sum + emp.salary, 0);
    
    const departments = [...new Set(employees.map(emp => emp.department))];
    const departmentDistribution = departments.map(dept => ({
      department: dept,
      count: employees.filter(emp => emp.department === dept).length
    }));

    const recentActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    return {
      totalEmployees,
      activeEmployees,
      onVacationEmployees,
      inactiveEmployees,
      totalSalaries,
      departments: departments.length,
      departmentDistribution,
      recentActivities,
      averageSalary: activeEmployees > 0 ? totalSalaries / activeEmployees : 0
    };
  }

  // Process payroll for active employees
  processPayroll(month: number, year: number): boolean {
    try {
      const employees = this.getEmployees().filter(emp => emp.status === 'active');
      const payrollRecords = storage.getItem('payroll_records', []);
      
      for (const employee of employees) {
        // Check if payroll already processed for this employee/month/year
        const existingRecord = payrollRecords.find(record => 
          record.employeeId === employee.id && 
          record.month === month && 
          record.year === year
        );
        
        if (!existingRecord) {
          const payrollRecord = {
            id: `PAY_${Date.now()}_${employee.id}`,
            employeeId: employee.id,
            employeeName: employee.name,
            month,
            year,
            basicSalary: employee.salary,
            allowances: 0, // Can be calculated based on employee data
            deductions: 0, // Can be calculated based on employee data
            netSalary: employee.salary,
            isPaid: false,
            createdAt: new Date().toISOString()
          };
          
          payrollRecords.push(payrollRecord);
        }
      }
      
      storage.setItem('payroll_records', payrollRecords);
      return true;
    } catch (error) {
      console.error('Error processing payroll:', error);
      return false;
    }
  }

  // Sync employee-related financial data
  async syncEmployeeFinancials(): Promise<void> {
    try {
      // Use dynamic import to avoid circular dependency
      const { payrollManager } = await import('./payrollManager');
      payrollManager.syncWithFinancialSystems();
      cashFlowManager.syncPayrollRecords();
    } catch (error) {
      console.error('Error syncing employee financials:', error);
    }
  }

  // Get employee payroll summary
  async getEmployeePayrollSummary(employeeId: string) {
    try {
      const { payrollManager } = await import('./payrollManager');
      const employee = this.getEmployeeById(employeeId);
      if (!employee) return null;

      const payrollRecords = payrollManager.getEmployeePayroll(employeeId);
      const totalPaid = payrollRecords.filter(r => r.isPaid).reduce((sum, r) => sum + r.netSalary, 0);
      const totalUnpaid = payrollRecords.filter(r => !r.isPaid).reduce((sum, r) => sum + r.netSalary, 0);

      return {
        employee,
        payrollHistory: payrollRecords,
        totalPaid,
        totalUnpaid,
        totalRecords: payrollRecords.length,
        lastPayment: payrollRecords.filter(r => r.isPaid).sort((a, b) => 
          new Date(b.paidDate || '').getTime() - new Date(a.paidDate || '').getTime()
        )[0] || null
      };
    } catch (error) {
      console.error('Error getting employee payroll summary:', error);
      return null;
    }
  }

  // Get department-wise salary breakdown
  getDepartmentSalaryBreakdown() {
    const employees = this.getEmployees().filter(emp => emp.status === 'active');
    const departments: { [key: string]: { count: number, totalSalary: number } } = {};
    
    employees.forEach(emp => {
      if (!departments[emp.department]) {
        departments[emp.department] = { count: 0, totalSalary: 0 };
      }
      departments[emp.department].count++;
      departments[emp.department].totalSalary += emp.salary;
    });
    
    return Object.entries(departments).map(([department, data]) => ({
      department,
      employeeCount: data.count,
      totalSalary: data.totalSalary,
      averageSalary: data.totalSalary / data.count
    }));
  }
}

// Export singleton instance
export const employeeManager = EmployeeManager.getInstance();