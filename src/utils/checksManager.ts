import { storage } from './storage';
import { cashFlowManager } from './cashFlowManager';

export interface Check {
  id: string;
  checkNumber: string;
  amount: number;
  customerId?: string;
  supplierId?: string;
  customerName: string;
  customerPhone?: string;
  bankName: string;
  dueDate: string;
  status: 'pending' | 'cashed' | 'bounced' | 'returned';
  description?: string;
  dateReceived: string;
  cashedDate?: string;
  bouncedDate?: string;
  notes?: string;
  relatedInvoiceId?: string;
  entityType?: 'customer' | 'supplier';
  createdBy?: string;
  createdAt: string;
}

export class ChecksManager {
  private static instance: ChecksManager;

  static getInstance(): ChecksManager {
    if (!ChecksManager.instance) {
      ChecksManager.instance = new ChecksManager();
    }
    return ChecksManager.instance;
  }

  // Get all checks
  getChecks(): Check[] {
    return storage.getItem('checks', []);
  }

  // Add new check
  addCheck(check: Omit<Check, 'id' | 'createdAt' | 'status'>): boolean {
    try {
      const newCheck: Check = {
        ...check,
        id: `CHK_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      const checks = this.getChecks();
      checks.push(newCheck);
      storage.setItem('checks', checks);

      // ربط تلقائي مع العميل أو المورد
      this.autoLinkWithEntity(newCheck);

      return true;
    } catch (error) {
      console.error('Error adding check:', error);
      return false;
    }
  }

  // ربط تلقائي محسن مع العميل أو المورد
  private autoLinkWithEntity(check: Check): void {
    try {
      const customers = storage.getItem('customers', []);
      const suppliers = storage.getItem('suppliers', []);
      
      // محاولة الربط مع العميل أولاً
      const customer = customers.find((c: any) => 
        c.name === check.customerName || 
        c.phone === check.customerPhone ||
        c.id?.toString() === check.customerId?.toString()
      );

      if (customer) {
        check.customerId = customer.id?.toString();
        check.entityType = 'customer';
        
        // تحديث سجل العميل تلقائياً
        customer.totalChecks = (customer.totalChecks || 0) + 1;
        customer.checkAmount = (customer.checkAmount || 0) + check.amount;
        customer.lastCheckDate = check.dateReceived;
        customer.pendingChecks = (customer.pendingChecks || 0) + 1;
        customer.pendingCheckAmount = (customer.pendingCheckAmount || 0) + check.amount;
        
        storage.setItem('customers', customers);
      } else {
        // محاولة الربط مع المورد
        const supplier = suppliers.find((s: any) => 
          s.name === check.customerName || 
          s.phone === check.customerPhone
        );

        if (supplier) {
          check.supplierId = supplier.id?.toString();
          check.entityType = 'supplier';
          
          // تحديث سجل المورد تلقائياً
          supplier.totalChecks = (supplier.totalChecks || 0) + 1;
          supplier.checkAmount = (supplier.checkAmount || 0) + check.amount;
          supplier.lastCheckDate = check.dateReceived;
          supplier.pendingChecks = (supplier.pendingChecks || 0) + 1;
          supplier.pendingCheckAmount = (supplier.pendingCheckAmount || 0) + check.amount;
          
          storage.setItem('suppliers', suppliers);
        }
      }

      // تحديث الشيك بمعلومات الربط
      const checks = this.getChecks();
      const checkIndex = checks.findIndex(c => c.id === check.id);
      if (checkIndex !== -1) {
        checks[checkIndex] = check;
        storage.setItem('checks', checks);
      }
    } catch (error) {
      console.error('Error auto-linking check:', error);
    }
  }

  // Update check status
  updateCheckStatus(checkId: string, newStatus: Check['status'], processedBy?: string): boolean {
    try {
      const checks = this.getChecks();
      const checkIndex = checks.findIndex(check => check.id === checkId);
      
      if (checkIndex === -1) return false;

      const updatedCheck = {
        ...checks[checkIndex],
        status: newStatus
      };

      // Set appropriate date based on status
      if (newStatus === 'cashed') {
        updatedCheck.cashedDate = new Date().toISOString();
        // Add to cash flow as income
        this.addToCashFlow(updatedCheck);
      } else if (newStatus === 'bounced') {
        updatedCheck.bouncedDate = new Date().toISOString();
        // Remove from cash flow if it was previously cashed
        if (checks[checkIndex].status === 'cashed') {
          this.removeFromCashFlow(updatedCheck);
        }
      }

      checks[checkIndex] = updatedCheck;
      storage.setItem('checks', checks);

      // Update customer record
      this.updateCustomerCheckRecord(updatedCheck);

      return true;
    } catch (error) {
      console.error('Error updating check status:', error);
      return false;
    }
  }

  // Update check details
  updateCheck(checkId: string, updates: Partial<Check>): boolean {
    try {
      const checks = this.getChecks();
      const checkIndex = checks.findIndex(check => check.id === checkId);
      
      if (checkIndex === -1) return false;

      checks[checkIndex] = { ...checks[checkIndex], ...updates };
      storage.setItem('checks', checks);

      return true;
    } catch (error) {
      console.error('Error updating check:', error);
      return false;
    }
  }

  // Delete check
  deleteCheck(checkId: string): boolean {
    try {
      const checks = this.getChecks();
      const checkToDelete = checks.find(check => check.id === checkId);
      
      if (!checkToDelete) return false;

      // Remove from cash flow if it was cashed
      if (checkToDelete.status === 'cashed') {
        this.removeFromCashFlow(checkToDelete);
      }

      const updatedChecks = checks.filter(check => check.id !== checkId);
      storage.setItem('checks', updatedChecks);

      return true;
    } catch (error) {
      console.error('Error deleting check:', error);
      return false;
    }
  }

  // Get checks by status
  getChecksByStatus(status: Check['status']): Check[] {
    return this.getChecks().filter(check => check.status === status);
  }

  // Get checks by customer
  getChecksByCustomer(customerId: string): Check[] {
    return this.getChecks().filter(check => check.customerId === customerId);
  }

  // Get checks by supplier
  getChecksBySupplier(supplierId: string): Check[] {
    return this.getChecks().filter(check => check.supplierId === supplierId);
  }

  // Get checks by entity (customer or supplier)
  getChecksByEntity(entityId: string, entityType: 'customer' | 'supplier'): Check[] {
    return this.getChecks().filter(check => 
      (entityType === 'customer' && check.customerId === entityId) ||
      (entityType === 'supplier' && check.supplierId === entityId)
    );
  }

  // Get overdue checks
  getOverdueChecks(): Check[] {
    const today = new Date();
    return this.getChecks().filter(check => {
      const dueDate = new Date(check.dueDate);
      return check.status === 'pending' && dueDate < today;
    });
  }

  // Get checks due soon (within next 7 days)
  getChecksDueSoon(): Check[] {
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return this.getChecks().filter(check => {
      const dueDate = new Date(check.dueDate);
      return check.status === 'pending' && dueDate >= today && dueDate <= weekFromNow;
    });
  }

  // Get check statistics
  getCheckStatistics() {
    const checks = this.getChecks();
    const pendingChecks = checks.filter(c => c.status === 'pending');
    const cashedChecks = checks.filter(c => c.status === 'cashed');
    const bouncedChecks = checks.filter(c => c.status === 'bounced');
    const overdueChecks = this.getOverdueChecks();

    return {
      totalChecks: checks.length,
      pendingCount: pendingChecks.length,
      cashedCount: cashedChecks.length,
      bouncedCount: bouncedChecks.length,
      overdueCount: overdueChecks.length,
      totalPendingAmount: pendingChecks.reduce((sum, c) => sum + c.amount, 0),
      totalCashedAmount: cashedChecks.reduce((sum, c) => sum + c.amount, 0),
      totalBouncedAmount: bouncedChecks.reduce((sum, c) => sum + c.amount, 0),
      overdueAmount: overdueChecks.reduce((sum, c) => sum + c.amount, 0)
    };
  }

  // Link check with customer or supplier (محسن)
  private linkWithCustomer(check: Check): void {
    try {
      const customers = storage.getItem('customers', []);
      const suppliers = storage.getItem('suppliers', []);
      
      // Try to link with customer first
      const customer = customers.find((c: any) => 
        c.name === check.customerName || 
        c.phone === check.customerPhone ||
        c.id?.toString() === check.customerId?.toString()
      );

      if (customer) {
        check.customerId = customer.id?.toString();
        check.entityType = 'customer';
        
        // Update customer record with check info (محسن)
        customer.totalChecks = (customer.totalChecks || 0) + 1;
        customer.checkAmount = (customer.checkAmount || 0) + check.amount;
        customer.lastCheckDate = check.dateReceived;
        customer.pendingChecks = (customer.pendingChecks || 0) + 1;
        customer.pendingCheckAmount = (customer.pendingCheckAmount || 0) + check.amount;
        
        storage.setItem('customers', customers);
        
        // Update the check with customer info
        const checksData = this.getChecks();
        const checkIndex = checksData.findIndex(c => c.id === check.id);
        if (checkIndex !== -1) {
          checksData[checkIndex] = check;
          storage.setItem('checks', checksData);
        }
      } else {
        // Try to link with supplier
        const supplier = suppliers.find((s: any) => 
          s.name === check.customerName || 
          s.phone === check.customerPhone ||
          s.id?.toString() === check.supplierId?.toString()
        );

        if (supplier) {
          check.supplierId = supplier.id?.toString();
          check.entityType = 'supplier';
          
          // Update supplier record with check info (محسن)
          supplier.totalChecks = (supplier.totalChecks || 0) + 1;
          supplier.checkAmount = (supplier.checkAmount || 0) + check.amount;
          supplier.lastCheckDate = check.dateReceived;
          supplier.pendingChecks = (supplier.pendingChecks || 0) + 1;
          supplier.pendingCheckAmount = (supplier.pendingCheckAmount || 0) + check.amount;
          
          storage.setItem('suppliers', suppliers);
          
          // Update the check with supplier info
          const checksData = this.getChecks();
          const checkIndex = checksData.findIndex(c => c.id === check.id);
          if (checkIndex !== -1) {
            checksData[checkIndex] = check;
            storage.setItem('checks', checksData);
          }
        }
      }
    } catch (error) {
      console.error('Error linking check with customer/supplier:', error);
    }
  }

  // ربط جميع الشيكات غير المربوطة بأصحابها
  linkAllUnlinkedChecks(): { linked: number; failed: number } {
    try {
      const checks = this.getChecks();
      let linked = 0;
      let failed = 0;

      checks.forEach(check => {
        if (!check.customerId && !check.supplierId) {
          try {
            this.linkWithCustomer(check);
            if (check.customerId || check.supplierId) {
              linked++;
            } else {
              failed++;
            }
          } catch (error) {
            failed++;
          }
        }
      });

      return { linked, failed };
    } catch (error) {
      console.error('Error linking all unlinked checks:', error);
      return { linked: 0, failed: 0 };
    }
  }

  // الحصول على ملخص شيكات العميل
  getCustomerChecksSummary(customerId: string) {
    const customerChecks = this.getChecksByCustomer(customerId);
    const pending = customerChecks.filter(c => c.status === 'pending');
    const cashed = customerChecks.filter(c => c.status === 'cashed');
    const bounced = customerChecks.filter(c => c.status === 'bounced');
    const overdue = customerChecks.filter(c => {
      const dueDate = new Date(c.dueDate);
      return c.status === 'pending' && dueDate < new Date();
    });

    return {
      totalChecks: customerChecks.length,
      pendingChecks: pending.length,
      cashedChecks: cashed.length,
      bouncedChecks: bounced.length,
      overdueChecks: overdue.length,
      totalAmount: customerChecks.reduce((sum, c) => sum + c.amount, 0),
      pendingAmount: pending.reduce((sum, c) => sum + c.amount, 0),
      cashedAmount: cashed.reduce((sum, c) => sum + c.amount, 0),
      bouncedAmount: bounced.reduce((sum, c) => sum + c.amount, 0),
      overdueAmount: overdue.reduce((sum, c) => sum + c.amount, 0)
    };
  }

  // الحصول على ملخص شيكات المورد
  getSupplierChecksSummary(supplierId: string) {
    const supplierChecks = this.getChecksBySupplier(supplierId);
    return this.getCustomerChecksSummary(supplierId); // نفس المنطق
  }

  // Update customer check record
  private updateCustomerCheckRecord(check: Check): void {
    try {
      if (!check.customerId) return;

      const customers = storage.getItem('customers', []);
      const customerIndex = customers.findIndex((c: any) => c.id === check.customerId);
      
      if (customerIndex !== -1) {
        const customer = customers[customerIndex];
        
        if (check.status === 'cashed') {
          customer.cashedChecks = (customer.cashedChecks || 0) + 1;
          customer.cashedAmount = (customer.cashedAmount || 0) + check.amount;
        } else if (check.status === 'bounced') {
          customer.bouncedChecks = (customer.bouncedChecks || 0) + 1;
          customer.bouncedAmount = (customer.bouncedAmount || 0) + check.amount;
          
          // Decrease cashed amount if it was previously cashed
          if (customer.cashedAmount && customer.cashedAmount >= check.amount) {
            customer.cashedAmount -= check.amount;
            customer.cashedChecks = Math.max(0, (customer.cashedChecks || 1) - 1);
          }
        }
        
        customers[customerIndex] = customer;
        storage.setItem('customers', customers);
      }
    } catch (error) {
      console.error('Error updating customer check record:', error);
    }
  }

  // Add check to cash flow when cashed
  private addToCashFlow(check: Check): void {
    try {
      cashFlowManager.addTransaction({
        date: check.cashedDate || new Date().toISOString(),
        type: 'income',
        category: 'sales',
        subcategory: 'شيكات',
        amount: check.amount,
        description: `تحصيل شيك رقم ${check.checkNumber} - ${check.customerName}`,
        referenceId: check.id,
        referenceType: 'manual',
        paymentMethod: 'check',
        notes: `بنك: ${check.bankName}, تاريخ الاستحقاق: ${check.dueDate}`,
        createdBy: check.createdBy
      });
    } catch (error) {
      console.error('Error adding check to cash flow:', error);
    }
  }

  // Remove check from cash flow
  private removeFromCashFlow(check: Check): void {
    try {
      const transactions = cashFlowManager.getTransactions();
      const updatedTransactions = transactions.filter(t => t.referenceId !== check.id);
      storage.setItem('cash_flow_transactions', updatedTransactions);
    } catch (error) {
      console.error('Error removing check from cash flow:', error);
    }
  }

  // Get monthly check collection report
  getMonthlyCollectionReport(year: number, month: number) {
    const checks = this.getChecks();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const monthlyChecks = checks.filter(check => {
      if (check.status === 'cashed' && check.cashedDate) {
        const cashedDate = new Date(check.cashedDate);
        return cashedDate >= startDate && cashedDate <= endDate;
      }
      return false;
    });

    return {
      totalCollected: monthlyChecks.length,
      totalAmount: monthlyChecks.reduce((sum, c) => sum + c.amount, 0),
      checks: monthlyChecks
    };
  }

  // Sync existing cashed checks with cash flow
  syncWithCashFlow(): void {
    try {
      const cashedChecks = this.getChecksByStatus('cashed');
      const existingTransactions = cashFlowManager.getTransactions();
      
      cashedChecks.forEach(check => {
        // Check if already synced
        const alreadySynced = existingTransactions.some(t => t.referenceId === check.id);
        if (!alreadySynced) {
          this.addToCashFlow(check);
        }
      });
    } catch (error) {
      console.error('Error syncing checks with cash flow:', error);
    }
  }
}

// Export singleton instance
export const checksManager = ChecksManager.getInstance();