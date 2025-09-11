import { storage } from './storage';
import { cashFlowManager } from './cashFlowManager';
import { enhancedCustomerIntegration } from './enhancedCustomerIntegration';
import { enhancedSupplierIntegration } from './enhancedSupplierIntegration';

export interface EnhancedCheck {
  id: string;
  checkNumber: string;
  amount: number;
  dateReceived: string;
  dateIssued: string;
  bankName: string;
  status: 'pending' | 'cashed' | 'returned' | 'cancelled';
  holderType: 'customer' | 'supplier' | 'employee' | 'other';
  holderId: string;
  holderName: string;
  notes: string;
  cashingDate?: string;
  returnReason?: string;
  createdAt: string;
  updatedAt: string;
}

export class EnhancedChecksIntegration {
  private static instance: EnhancedChecksIntegration;

  static getInstance(): EnhancedChecksIntegration {
    if (!EnhancedChecksIntegration.instance) {
      EnhancedChecksIntegration.instance = new EnhancedChecksIntegration();
    }
    return EnhancedChecksIntegration.instance;
  }

  // إضافة شيك مع ربطه بصاحبه
  addCheckWithHolder(checkData: Omit<EnhancedCheck, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const newCheck: EnhancedCheck = {
        ...checkData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // حفظ الشيك
      const checks = storage.getItem('checks', []);
      checks.push(newCheck);
      storage.setItem('checks', checks);

      // ربط الشيك بصاحبه
      this.linkCheckToHolder(newCheck);

      return newCheck;
    } catch (error) {
      console.error('Error adding check with holder:', error);
      return null;
    }
  }

  // ربط الشيك بصاحبه (عميل أو مورد أو موظف)
  private linkCheckToHolder(check: EnhancedCheck) {
    try {
      switch (check.holderType) {
        case 'customer':
          enhancedCustomerIntegration.linkCustomerWithCheck(check.holderId, {
            id: check.id,
            amount: check.amount,
            dateReceived: check.dateReceived,
            status: check.status
          });
          break;
        
        case 'supplier':
          enhancedSupplierIntegration.linkSupplierWithCheck(check.holderId, {
            id: check.id,
            amount: check.amount,
            dateIssued: check.dateIssued,
            status: check.status
          });
          break;
        
        case 'employee':
          this.linkCheckToEmployee(check.holderId, check);
          break;
      }
    } catch (error) {
      console.error('Error linking check to holder:', error);
    }
  }

  // ربط الشيك بموظف
  private linkCheckToEmployee(employeeId: string, check: EnhancedCheck) {
    try {
      const employees = storage.getItem('employees', []);
      const employeeIndex = employees.findIndex((emp: any) => emp.id === employeeId);
      
      if (employeeIndex !== -1) {
        const employee = employees[employeeIndex];
        
        if (!employee.checksHistory) employee.checksHistory = [];
        employee.checksHistory.push({
          checkId: check.id,
          amount: check.amount,
          date: check.dateIssued,
          status: check.status,
          type: 'issued' // الشيك صادر للموظف
        });
        
        employees[employeeIndex] = employee;
        storage.setItem('employees', employees);
      }
    } catch (error) {
      console.error('Error linking check to employee:', error);
    }
  }

  // صرف شيك
  cashCheck(checkId: string) {
    try {
      const checks = storage.getItem('checks', []);
      const checkIndex = checks.findIndex((c: any) => c.id === checkId);
      
      if (checkIndex !== -1) {
        const check = checks[checkIndex];
        
        // تحديث حالة الشيك
        check.status = 'cashed';
        check.cashingDate = new Date().toISOString().split('T')[0];
        check.updatedAt = new Date().toISOString();
        
        checks[checkIndex] = check;
        storage.setItem('checks', checks);
        
        // إضافة للتدفق النقدي
        cashFlowManager.addTransaction({
          type: 'income',
          amount: check.amount,
          description: `صرف شيك رقم ${check.checkNumber} من ${check.holderName}`,
          category: 'other',
          paymentMethod: 'check',
          referenceId: `check-${checkId}`,
          date: check.cashingDate
        });
        
        // تحديث ملف صاحب الشيك
        if (check.holderType === 'customer') {
          enhancedCustomerIntegration.cashCustomerCheck(check.holderId, checkId, check.amount);
        }
        
        return check;
      }
    } catch (error) {
      console.error('Error cashing check:', error);
      return null;
    }
  }

  // إرجاع شيك
  returnCheck(checkId: string, returnReason: string) {
    try {
      const checks = storage.getItem('checks', []);
      const checkIndex = checks.findIndex((c: any) => c.id === checkId);
      
      if (checkIndex !== -1) {
        const check = checks[checkIndex];
        
        // تحديث حالة الشيك
        check.status = 'returned';
        check.returnReason = returnReason;
        check.updatedAt = new Date().toISOString();
        
        checks[checkIndex] = check;
        storage.setItem('checks', checks);
        
        // تحديث ملف صاحب الشيك بالإرجاع
        this.updateHolderOnCheckReturn(check);
        
        return check;
      }
    } catch (error) {
      console.error('Error returning check:', error);
      return null;
    }
  }

  // تحديث ملف صاحب الشيك عند الإرجاع
  private updateHolderOnCheckReturn(check: EnhancedCheck) {
    try {
      switch (check.holderType) {
        case 'customer':
          const customers = storage.getItem('customers', []);
          const customerIndex = customers.findIndex((c: any) => c.id === check.holderId);
          if (customerIndex !== -1) {
            const customer = customers[customerIndex];
            
            // زيادة مستوى المخاطر
            customer.riskLevel = 'high';
            
            // إضافة للتاريخ
            if (!customer.paymentHistory) customer.paymentHistory = [];
            const paymentIndex = customer.paymentHistory.findIndex(
              (p: any) => p.method === 'check' && p.amount === check.amount && p.status === 'paid'
            );
            if (paymentIndex !== -1) {
              customer.paymentHistory[paymentIndex].status = 'overdue';
            }
            
            customers[customerIndex] = customer;
            storage.setItem('customers', customers);
          }
          break;
        
        case 'supplier':
          // منطق مشابه للموردين
          break;
        
        case 'employee':
          // منطق مشابه للموظفين
          break;
      }
    } catch (error) {
      console.error('Error updating holder on check return:', error);
    }
  }

  // الحصول على شيكات صاحب معين
  getChecksByHolder(holderType: string, holderId: string): EnhancedCheck[] {
    try {
      const checks = storage.getItem('checks', []);
      return checks.filter((check: any) => 
        check.holderType === holderType && check.holderId === holderId
      );
    } catch (error) {
      console.error('Error getting checks by holder:', error);
      return [];
    }
  }

  // الشيكات المستحقة الصرف
  getOverdueChecks(): EnhancedCheck[] {
    try {
      const checks = storage.getItem('checks', []);
      const today = new Date();
      
      return checks.filter((check: any) => {
        if (check.status !== 'pending') return false;
        
        const checkDate = new Date(check.dateReceived);
        const daysDiff = (today.getTime() - checkDate.getTime()) / (1000 * 60 * 60 * 24);
        
        return daysDiff > 30; // الشيكات التي مر عليها أكثر من 30 يوم
      });
    } catch (error) {
      console.error('Error getting overdue checks:', error);
      return [];
    }
  }

  // إحصائيات الشيكات حسب صاحبها
  getChecksStatisticsByHolder() {
    try {
      const checks = storage.getItem('checks', []);
      const statistics: any = {
        customers: { total: 0, pending: 0, cashed: 0, returned: 0, totalAmount: 0 },
        suppliers: { total: 0, pending: 0, cashed: 0, returned: 0, totalAmount: 0 },
        employees: { total: 0, pending: 0, cashed: 0, returned: 0, totalAmount: 0 },
        other: { total: 0, pending: 0, cashed: 0, returned: 0, totalAmount: 0 }
      };
      
      checks.forEach((check: any) => {
        const holderStats = statistics[check.holderType] || statistics.other;
        
        holderStats.total++;
        holderStats.totalAmount += check.amount;
        
        switch (check.status) {
          case 'pending':
            holderStats.pending++;
            break;
          case 'cashed':
            holderStats.cashed++;
            break;
          case 'returned':
            holderStats.returned++;
            break;
        }
      });
      
      return statistics;
    } catch (error) {
      console.error('Error getting checks statistics by holder:', error);
      return null;
    }
  }

  // تقرير الشيكات الشامل
  getComprehensiveChecksReport(startDate: string, endDate: string) {
    try {
      const checks = storage.getItem('checks', [])
        .filter((check: any) => check.dateReceived >= startDate && check.dateReceived <= endDate);
      
      const totalAmount = checks.reduce((sum: number, check: any) => sum + check.amount, 0);
      const pendingAmount = checks.filter((c: any) => c.status === 'pending')
        .reduce((sum: number, c: any) => sum + c.amount, 0);
      const cashedAmount = checks.filter((c: any) => c.status === 'cashed')
        .reduce((sum: number, c: any) => sum + c.amount, 0);
      const returnedAmount = checks.filter((c: any) => c.status === 'returned')
        .reduce((sum: number, c: any) => sum + c.amount, 0);
      
      return {
        period: { startDate, endDate },
        summary: {
          totalChecks: checks.length,
          totalAmount,
          pendingChecks: checks.filter((c: any) => c.status === 'pending').length,
          pendingAmount,
          cashedChecks: checks.filter((c: any) => c.status === 'cashed').length,
          cashedAmount,
          returnedChecks: checks.filter((c: any) => c.status === 'returned').length,
          returnedAmount,
          successRate: checks.length > 0 ? (checks.filter((c: any) => c.status === 'cashed').length / checks.length) * 100 : 0
        },
        byHolder: this.getChecksStatisticsByHolder(),
        overdueChecks: this.getOverdueChecks(),
        riskAnalysis: {
          highRiskCustomers: this.getCustomersWithReturnedChecks(),
          avgDaysToNextCashing: this.calculateAverageCashingTime(),
          recommendedActions: this.getRecommendedActions()
        }
      };
    } catch (error) {
      console.error('Error getting comprehensive checks report:', error);
      return null;
    }
  }

  // العملاء الذين أرجعت شيكاتهم
  private getCustomersWithReturnedChecks() {
    const checks = storage.getItem('checks', []);
    const returnedChecks = checks.filter((c: any) => c.status === 'returned' && c.holderType === 'customer');
    
    const customerCounts: any = {};
    returnedChecks.forEach((check: any) => {
      customerCounts[check.holderId] = (customerCounts[check.holderId] || 0) + 1;
    });
    
    return Object.keys(customerCounts).map(customerId => ({
      customerId,
      customerName: returnedChecks.find((c: any) => c.holderId === customerId)?.holderName,
      returnedChecksCount: customerCounts[customerId]
    }));
  }

  // متوسط وقت الصرف
  private calculateAverageCashingTime(): number {
    const checks = storage.getItem('checks', []);
    const cashedChecks = checks.filter((c: any) => c.status === 'cashed' && c.cashingDate);
    
    if (cashedChecks.length === 0) return 0;
    
    const totalDays = cashedChecks.reduce((sum: number, check: any) => {
      const receivedDate = new Date(check.dateReceived);
      const cashedDate = new Date(check.cashingDate);
      const daysDiff = (cashedDate.getTime() - receivedDate.getTime()) / (1000 * 60 * 60 * 24);
      return sum + daysDiff;
    }, 0);
    
    return totalDays / cashedChecks.length;
  }

  // التوصيات المقترحة
  private getRecommendedActions(): string[] {
    const recommendations: string[] = [];
    const overdueChecks = this.getOverdueChecks();
    const returnRate = this.getCheckReturnRate();
    
    if (overdueChecks.length > 0) {
      recommendations.push(`يوجد ${overdueChecks.length} شيك متأخر يحتاج متابعة فورية`);
    }
    
    if (returnRate > 10) {
      recommendations.push('معدل إرجاع الشيكات مرتفع - يُنصح بتشديد شروط القبول');
    }
    
    if (returnRate > 20) {
      recommendations.push('معدل إرجاع الشيكات خطير - يجب مراجعة سياسة قبول الشيكات');
    }
    
    return recommendations;
  }

  // معدل إرجاع الشيكات
  private getCheckReturnRate(): number {
    const checks = storage.getItem('checks', []);
    if (checks.length === 0) return 0;
    
    const returnedChecks = checks.filter((c: any) => c.status === 'returned');
    return (returnedChecks.length / checks.length) * 100;
  }
}

export const enhancedChecksIntegration = EnhancedChecksIntegration.getInstance();