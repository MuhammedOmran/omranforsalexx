import { storage } from './storage';
import { inventoryManager } from './inventoryUtils';
import { cashFlowManager } from './cashFlowManager';

export interface ReturnItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  reason: string;
}

export interface Return {
  id: string;
  returnNumber: string;
  customerId?: string;
  customerName: string;
  originalInvoiceId?: string;
  originalInvoiceNumber: string;
  date: string;
  items: ReturnItem[];
  totalAmount: number;
  status: 'pending' | 'approved' | 'processed' | 'rejected';
  reason: string;
  notes?: string;
  processedBy?: string;
  processedDate?: string;
  createdBy?: string;
  createdAt: string;
}

export class ReturnsManager {
  private static instance: ReturnsManager;

  static getInstance(): ReturnsManager {
    if (!ReturnsManager.instance) {
      ReturnsManager.instance = new ReturnsManager();
    }
    return ReturnsManager.instance;
  }

  // Get all returns
  getReturns(): Return[] {
    return storage.getItem('returns', []);
  }

  // Add new return
  addReturn(returnData: Omit<Return, 'id' | 'returnNumber' | 'createdAt' | 'status'>): boolean {
    try {
      const newReturn: Return = {
        ...returnData,
        id: `RET_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        returnNumber: `RET-${Date.now().toString().slice(-6)}`,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      const returns = this.getReturns();
      returns.unshift(newReturn); // Add to beginning for recent first
      storage.setItem('returns', returns);

      // Link with customer and original invoice
      this.linkWithCustomerAndInvoice(newReturn);

      return true;
    } catch (error) {
      console.error('Error adding return:', error);
      return false;
    }
  }

  // Update return status
  updateReturnStatus(returnId: string, newStatus: Return['status'], processedBy?: string): boolean {
    try {
      const returns = this.getReturns();
      const returnIndex = returns.findIndex(ret => ret.id === returnId);
      
      if (returnIndex === -1) return false;

      const updatedReturn = {
        ...returns[returnIndex],
        status: newStatus,
        processedBy: processedBy || 'مستخدم النظام',
        processedDate: new Date().toISOString()
      };

      returns[returnIndex] = updatedReturn;
      storage.setItem('returns', returns);

      // Handle inventory and cash flow based on status
      if (newStatus === 'processed') {
        this.processReturnInventory(updatedReturn);
        this.processReturnCashFlow(updatedReturn);
      } else if (newStatus === 'rejected') {
        // Remove any previous processing effects
        this.reverseReturnProcessing(updatedReturn);
      }

      return true;
    } catch (error) {
      console.error('Error updating return status:', error);
      return false;
    }
  }

  // Update return details
  updateReturn(returnId: string, updates: Partial<Return>): boolean {
    try {
      const returns = this.getReturns();
      const returnIndex = returns.findIndex(ret => ret.id === returnId);
      
      if (returnIndex === -1) return false;

      returns[returnIndex] = { ...returns[returnIndex], ...updates };
      storage.setItem('returns', returns);

      return true;
    } catch (error) {
      console.error('Error updating return:', error);
      return false;
    }
  }

  // Delete return
  deleteReturn(returnId: string): boolean {
    try {
      const returns = this.getReturns();
      const returnToDelete = returns.find(ret => ret.id === returnId);
      
      if (!returnToDelete) return false;

      // Reverse any processing effects if it was processed
      if (returnToDelete.status === 'processed') {
        this.reverseReturnProcessing(returnToDelete);
      }

      const updatedReturns = returns.filter(ret => ret.id !== returnId);
      storage.setItem('returns', updatedReturns);

      return true;
    } catch (error) {
      console.error('Error deleting return:', error);
      return false;
    }
  }

  // Get returns by status
  getReturnsByStatus(status: Return['status']): Return[] {
    return this.getReturns().filter(ret => ret.status === status);
  }

  // Get returns by customer
  getReturnsByCustomer(customerId: string): Return[] {
    return this.getReturns().filter(ret => ret.customerId === customerId);
  }

  // Get returns by date range
  getReturnsByDateRange(startDate: string, endDate: string): Return[] {
    const returns = this.getReturns();
    return returns.filter(ret => {
      const returnDate = new Date(ret.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return returnDate >= start && returnDate <= end;
    });
  }

  // Get return statistics
  getReturnStatistics() {
    const returns = this.getReturns();
    const pendingReturns = returns.filter(r => r.status === 'pending');
    const approvedReturns = returns.filter(r => r.status === 'approved');
    const processedReturns = returns.filter(r => r.status === 'processed');
    const rejectedReturns = returns.filter(r => r.status === 'rejected');

    return {
      totalReturns: returns.length,
      pendingCount: pendingReturns.length,
      approvedCount: approvedReturns.length,
      processedCount: processedReturns.length,
      rejectedCount: rejectedReturns.length,
      totalReturnValue: returns.reduce((sum, r) => sum + r.totalAmount, 0),
      processedValue: processedReturns.reduce((sum, r) => sum + r.totalAmount, 0),
      averageReturnValue: returns.length > 0 ? returns.reduce((sum, r) => sum + r.totalAmount, 0) / returns.length : 0
    };
  }

  // Get return reasons analysis
  getReturnReasonsAnalysis() {
    const returns = this.getReturns();
    const reasonCounts: { [key: string]: { count: number; value: number } } = {};

    returns.forEach(ret => {
      if (!reasonCounts[ret.reason]) {
        reasonCounts[ret.reason] = { count: 0, value: 0 };
      }
      reasonCounts[ret.reason].count++;
      reasonCounts[ret.reason].value += ret.totalAmount;
    });

    return Object.entries(reasonCounts).map(([reason, data]) => ({
      reason,
      count: data.count,
      value: data.value,
      percentage: returns.length > 0 ? (data.count / returns.length) * 100 : 0
    }));
  }

  // Link return with customer and original invoice
  private linkWithCustomerAndInvoice(returnRecord: Return): void {
    try {
      // Link with customer
      const customers = storage.getItem('customers', []);
      const customer = customers.find((c: any) => 
        c.name === returnRecord.customerName || c.id === returnRecord.customerId
      );

      if (customer) {
        returnRecord.customerId = customer.id;
        
        // Update customer record
        customer.totalReturns = (customer.totalReturns || 0) + 1;
        customer.returnValue = (customer.returnValue || 0) + returnRecord.totalAmount;
        customer.lastReturnDate = returnRecord.date;
        
        storage.setItem('customers', customers);
      }

      // Link with original invoice
      const salesInvoices = storage.getItem('sales_invoices', []);
      const originalInvoice = salesInvoices.find((inv: any) => 
        inv.id === returnRecord.originalInvoiceNumber || 
        inv.invoiceNumber === returnRecord.originalInvoiceNumber
      );

      if (originalInvoice) {
        returnRecord.originalInvoiceId = originalInvoice.id;
        
        // Update original invoice with return info
        originalInvoice.hasReturns = true;
        originalInvoice.returnCount = (originalInvoice.returnCount || 0) + 1;
        originalInvoice.returnValue = (originalInvoice.returnValue || 0) + returnRecord.totalAmount;
        
        storage.setItem('sales_invoices', salesInvoices);
      }
    } catch (error) {
      console.error('Error linking return with customer and invoice:', error);
    }
  }

  // Process return inventory (add back to stock)
  private processReturnInventory(returnRecord: Return): void {
    try {
      returnRecord.items.forEach(item => {
        // Add return movement to inventory (add back to stock)
        const products = inventoryManager.getProducts();
        const productIndex = products.findIndex(p => p.id === item.productId);
        if (productIndex !== -1) {
          products[productIndex].stock += item.quantity;
          storage.setItem('products', products);
        }
      });
    } catch (error) {
      console.error('Error processing return inventory:', error);
    }
  }

  // Process return cash flow (refund)
  private processReturnCashFlow(returnRecord: Return): void {
    try {
      cashFlowManager.addTransaction({
        date: returnRecord.processedDate || new Date().toISOString(),
        type: 'expense',
        category: 'sales',
        subcategory: 'مرتجعات',
        amount: returnRecord.totalAmount,
        description: `مرتجع رقم ${returnRecord.returnNumber} - ${returnRecord.customerName}`,
        referenceId: returnRecord.id,
        referenceType: 'manual',
        paymentMethod: 'cash',
        notes: `السبب: ${returnRecord.reason}, الفاتورة الأصلية: ${returnRecord.originalInvoiceNumber}`,
        createdBy: returnRecord.processedBy
      });
    } catch (error) {
      console.error('Error processing return cash flow:', error);
    }
  }

  // Reverse return processing effects
  private reverseReturnProcessing(returnRecord: Return): void {
    try {
      // Remove inventory movements
      const movements = inventoryManager.getMovements();
      const updatedMovements = movements.filter(m => m.referenceId !== returnRecord.id);
      storage.setItem('inventory_movements', updatedMovements);

      // Remove cash flow transaction
      const transactions = cashFlowManager.getTransactions();
      const updatedTransactions = transactions.filter(t => t.referenceId !== returnRecord.id);
      storage.setItem('cash_flow_transactions', updatedTransactions);

      // Revert product stock changes
      returnRecord.items.forEach(item => {
        const products = inventoryManager.getProducts();
        const productIndex = products.findIndex(p => p.id === item.productId);
        if (productIndex !== -1) {
          products[productIndex].stock = Math.max(0, products[productIndex].stock - item.quantity);
          storage.setItem('products', products);
        }
      });
    } catch (error) {
      console.error('Error reversing return processing:', error);
    }
  }

  // Get monthly returns report
  getMonthlyReturnsReport(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const monthlyReturns = this.getReturnsByDateRange(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );

    const processedReturns = monthlyReturns.filter(r => r.status === 'processed');

    return {
      totalReturns: monthlyReturns.length,
      processedReturns: processedReturns.length,
      totalValue: monthlyReturns.reduce((sum, r) => sum + r.totalAmount, 0),
      processedValue: processedReturns.reduce((sum, r) => sum + r.totalAmount, 0),
      reasonAnalysis: this.getReturnReasonsAnalysis(),
      returns: monthlyReturns
    };
  }

  // Validate return against original invoice
  validateReturnAgainstInvoice(returnRecord: Return): { valid: boolean; errors: string[] } {
    try {
      const errors: string[] = [];
      
      if (!returnRecord.originalInvoiceNumber) {
        errors.push('رقم الفاتورة الأصلية مطلوب');
        return { valid: false, errors };
      }

      const salesInvoices = storage.getItem('sales_invoices', []);
      const originalInvoice = salesInvoices.find((inv: any) => 
        inv.invoiceNumber === returnRecord.originalInvoiceNumber ||
        inv.id === returnRecord.originalInvoiceId
      );
      
      if (!originalInvoice) {
        errors.push('الفاتورة الأصلية غير موجودة في النظام');
        return { valid: false, errors };
      }

      // Check invoice date (not older than 30 days for returns)
      const invoiceDate = new Date(originalInvoice.date);
      const returnDate = new Date(returnRecord.date);
      const daysDiff = Math.floor((returnDate.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff > 30) {
        errors.push('لا يمكن إرجاع المنتجات بعد مرور أكثر من 30 يوم على الشراء');
      }

      // Check if return items exist in original invoice and validate quantities
      const returnedQuantities: { [key: string]: number } = {};
      
      // Get previously returned quantities for this invoice
      const existingReturns = this.getReturns().filter(ret => 
        ret.originalInvoiceNumber === returnRecord.originalInvoiceNumber &&
        ret.id !== returnRecord.id &&
        ret.status !== 'rejected'
      );
      
      existingReturns.forEach(ret => {
        ret.items.forEach(item => {
          returnedQuantities[item.productName] = (returnedQuantities[item.productName] || 0) + item.quantity;
        });
      });

      returnRecord.items.forEach(returnItem => {
        const originalItem = originalInvoice.itemsDetails?.find((item: any) => 
          item.productName === returnItem.productName ||
          item.productId === returnItem.productId
        );
        
        if (!originalItem) {
          errors.push(`المنتج "${returnItem.productName}" غير موجود في الفاتورة الأصلية`);
        } else {
          const totalReturned = (returnedQuantities[returnItem.productName] || 0) + returnItem.quantity;
          
          if (totalReturned > originalItem.quantity) {
            errors.push(
              `إجمالي كمية المرتجع للمنتج "${returnItem.productName}" (${totalReturned}) ` +
              `أكبر من الكمية الأصلية (${originalItem.quantity})`
            );
          }

          // Validate price consistency (allow 5% variance for price changes)
          const priceVariance = Math.abs(returnItem.unitPrice - originalItem.unitPrice) / originalItem.unitPrice;
          if (priceVariance > 0.05) {
            errors.push(
              `سعر المنتج "${returnItem.productName}" في المرتجع لا يتطابق مع السعر الأصلي`
            );
          }
        }
      });

      // Check if customer matches
      if (originalInvoice.customerName && returnRecord.customerName !== originalInvoice.customerName) {
        errors.push('اسم العميل لا يتطابق مع الفاتورة الأصلية');
      }

      return { valid: errors.length === 0, errors };
    } catch (error) {
      console.error('Error validating return:', error);
      return { valid: false, errors: ['خطأ في التحقق من صحة المرتجع'] };
    }
  }

  // Get return suggestions based on historical data
  getReturnSuggestions(productName: string): string[] {
    const returns = this.getReturns();
    const productReturns = returns.filter(ret => 
      ret.items.some(item => item.productName.includes(productName))
    );
    
    const reasonFrequency: { [key: string]: number } = {};
    productReturns.forEach(ret => {
      ret.items.forEach(item => {
        if (item.productName.includes(productName) && item.reason) {
          reasonFrequency[item.reason] = (reasonFrequency[item.reason] || 0) + 1;
        }
      });
    });

    return Object.entries(reasonFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([reason]) => reason);
  }

  // Check if product needs quality review
  checkProductQualityAlert(productName: string): { needsReview: boolean; returnCount: number; reasons: string[] } {
    const returns = this.getReturns();
    const productReturns = returns.filter(ret => 
      ret.items.some(item => item.productName === productName)
    ).filter(ret => ret.status === 'processed');

    const returnCount = productReturns.reduce((total, ret) => 
      total + ret.items.filter(item => item.productName === productName).length, 0
    );

    const reasons = [...new Set(
      productReturns.flatMap(ret => 
        ret.items
          .filter(item => item.productName === productName)
          .map(item => item.reason)
          .filter(reason => reason)
      )
    )];

    return {
      needsReview: returnCount > 5, // Alert if more than 5 returns
      returnCount,
      reasons
    };
  }
}

// Export singleton instance
export const returnsManager = ReturnsManager.getInstance();