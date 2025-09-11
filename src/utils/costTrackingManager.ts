import { storage } from './storage';
import { inventoryManager } from './inventoryUtils';
import { expensesManager } from './expensesManager';
import { payrollManager } from './payrollManager';

export interface CostCenter {
  id: string;
  name: string;
  description: string;
  category: 'production' | 'sales' | 'admin' | 'hr' | 'marketing' | 'other';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CostAllocation {
  id: string;
  costCenterId: string;
  amount: number;
  percentage?: number;
  description: string;
  date: string;
  referenceId?: string;
  referenceType?: 'product' | 'expense' | 'payroll' | 'manual';
  createdAt: string;
}

export interface ProductCost {
  productId: string;
  productName: string;
  directMaterialCost: number;
  directLaborCost: number;
  manufacturingOverhead: number;
  totalDirectCost: number;
  allocatedIndirectCost: number;
  totalCost: number;
  sellingPrice: number;
  profitMargin: number;
  profitAmount: number;
  lastCalculated: string;
}

export interface CostAnalysis {
  period: {
    start: string;
    end: string;
  };
  totalCosts: number;
  costsByCategory: {
    directMaterials: number;
    directLabor: number;
    manufacturingOverhead: number;
    operatingExpenses: number;
    administrativeExpenses: number;
  };
  costsByCenter: { [key: string]: number };
  variableCosts: number;
  fixedCosts: number;
  costPerUnit: { [productId: string]: number };
  profitabilityAnalysis: {
    totalRevenue: number;
    totalCosts: number;
    grossProfit: number;
    grossProfitMargin: number;
  };
}

export interface CostReport {
  id: string;
  title: string;
  type: 'product_costing' | 'cost_center' | 'profitability' | 'variance';
  period: {
    start: string;
    end: string;
  };
  data: any;
  generatedAt: string;
  generatedBy?: string;
}

export class CostTrackingManager {
  private static instance: CostTrackingManager;

  static getInstance(): CostTrackingManager {
    if (!CostTrackingManager.instance) {
      CostTrackingManager.instance = new CostTrackingManager();
    }
    return CostTrackingManager.instance;
  }

  constructor() {
    this.initializeDefaultCostCenters();
  }

  // Initialize default cost centers
  private initializeDefaultCostCenters(): void {
    const existingCenters = this.getCostCenters();
    if (existingCenters.length === 0) {
      const defaultCenters: CostCenter[] = [
        {
          id: 'production',
          name: 'مركز تكلفة الإنتاج',
          description: 'تكاليف مرتبطة بالإنتاج والتصنيع',
          category: 'production',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'sales',
          name: 'مركز تكلفة المبيعات',
          description: 'تكاليف مرتبطة بأنشطة المبيعات والتسويق',
          category: 'sales',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'admin',
          name: 'مركز التكاليف الإدارية',
          description: 'التكاليف الإدارية والعمومية',
          category: 'admin',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'hr',
          name: 'مركز تكلفة الموارد البشرية',
          description: 'تكاليف الموظفين والتدريب',
          category: 'hr',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'marketing',
          name: 'مركز تكلفة التسويق',
          description: 'تكاليف الإعلان والترويج',
          category: 'marketing',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      storage.setItem('cost_centers', defaultCenters);
    }
  }

  // Cost Centers Management
  getCostCenters(): CostCenter[] {
    return storage.getItem('cost_centers', []);
  }

  getCostCenter(id: string): CostCenter | null {
    const centers = this.getCostCenters();
    return centers.find(c => c.id === id) || null;
  }

  createCostCenter(centerData: Omit<CostCenter, 'id' | 'createdAt' | 'updatedAt'>): boolean {
    try {
      const centers = this.getCostCenters();
      const newCenter: CostCenter = {
        ...centerData,
        id: `center_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      centers.push(newCenter);
      storage.setItem('cost_centers', centers);
      return true;
    } catch (error) {
      console.error('Error creating cost center:', error);
      return false;
    }
  }

  updateCostCenter(id: string, updates: Partial<CostCenter>): boolean {
    try {
      const centers = this.getCostCenters();
      const centerIndex = centers.findIndex(c => c.id === id);
      
      if (centerIndex === -1) return false;

      centers[centerIndex] = {
        ...centers[centerIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      storage.setItem('cost_centers', centers);
      return true;
    } catch (error) {
      console.error('Error updating cost center:', error);
      return false;
    }
  }

  deleteCostCenter(id: string): boolean {
    try {
      const centers = this.getCostCenters();
      const filteredCenters = centers.filter(c => c.id !== id);
      storage.setItem('cost_centers', filteredCenters);
      return true;
    } catch (error) {
      console.error('Error deleting cost center:', error);
      return false;
    }
  }

  // Cost Allocations Management
  getCostAllocations(): CostAllocation[] {
    return storage.getItem('cost_allocations', []);
  }

  addCostAllocation(allocationData: Omit<CostAllocation, 'id' | 'createdAt'>): boolean {
    try {
      const allocations = this.getCostAllocations();
      const newAllocation: CostAllocation = {
        ...allocationData,
        id: `allocation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString()
      };

      allocations.push(newAllocation);
      storage.setItem('cost_allocations', allocations);
      return true;
    } catch (error) {
      console.error('Error adding cost allocation:', error);
      return false;
    }
  }

  getAllocationsByCostCenter(costCenterId: string): CostAllocation[] {
    const allocations = this.getCostAllocations();
    return allocations.filter(a => a.costCenterId === costCenterId);
  }

  getAllocationsByDateRange(startDate: string, endDate: string): CostAllocation[] {
    const allocations = this.getCostAllocations();
    return allocations.filter(a => {
      const allocationDate = new Date(a.date).getTime();
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      return allocationDate >= start && allocationDate <= end;
    });
  }

  // Product Costing
  calculateProductCosts(): ProductCost[] {
    try {
      const products = inventoryManager.getProducts();
      const movements = inventoryManager.getMovements();
      const expenses = expensesManager.getExpenses();
      const allocations = this.getCostAllocations();

      const productCosts: ProductCost[] = [];

      for (const product of products) {
        // Calculate direct material cost (from purchase movements)
        const purchaseMovements = movements.filter(m => 
          m.productId === product.id && 
          m.type === 'in' && 
          m.referenceType === 'purchase'
        );

        const totalPurchaseValue = purchaseMovements.reduce((sum, m) => sum + m.value, 0);
        const totalPurchaseQuantity = purchaseMovements.reduce((sum, m) => sum + m.quantity, 0);
        const directMaterialCost = totalPurchaseQuantity > 0 ? totalPurchaseValue / totalPurchaseQuantity : product.cost;

        // Calculate direct labor cost (simplified - could be enhanced)
        const directLaborCost = this.calculateDirectLaborCost(product.id);

        // Calculate manufacturing overhead
        const manufacturingOverhead = this.calculateManufacturingOverhead(product.id);

        const totalDirectCost = directMaterialCost + directLaborCost + manufacturingOverhead;

        // Calculate allocated indirect costs
        const allocatedIndirectCost = this.calculateAllocatedIndirectCosts(product.id);

        const totalCost = totalDirectCost + allocatedIndirectCost;
        const sellingPrice = product.price;
        const profitAmount = sellingPrice - totalCost;
        const profitMargin = sellingPrice > 0 ? (profitAmount / sellingPrice) * 100 : 0;

        productCosts.push({
          productId: product.id,
          productName: product.name,
          directMaterialCost,
          directLaborCost,
          manufacturingOverhead,
          totalDirectCost,
          allocatedIndirectCost,
          totalCost,
          sellingPrice,
          profitMargin,
          profitAmount,
          lastCalculated: new Date().toISOString()
        });
      }

      // Save calculated costs
      storage.setItem('product_costs', productCosts);
      
      return productCosts;
    } catch (error) {
      console.error('Error calculating product costs:', error);
      return [];
    }
  }

  getProductCosts(): ProductCost[] {
    return storage.getItem('product_costs', []);
  }

  getProductCost(productId: string): ProductCost | null {
    const costs = this.getProductCosts();
    return costs.find(c => c.productId === productId) || null;
  }

  // Cost Analysis
  generateCostAnalysis(startDate: string, endDate: string): CostAnalysis {
    try {
      const expenses = expensesManager.getExpensesByDateRange(startDate, endDate);
      const payrollRecords = payrollManager.getPayrollByDateRange(startDate, endDate);
      const allocations = this.getAllocationsByDateRange(startDate, endDate);
      const productCosts = this.getProductCosts();
      const salesInvoices = this.getSalesInvoicesByDateRange(startDate, endDate);

      // Calculate costs by category
      const directMaterials = this.calculateDirectMaterialsCost(startDate, endDate);
      const directLabor = payrollRecords.reduce((sum, pr) => sum + pr.totalAmount, 0);
      const manufacturingOverhead = expenses
        .filter(e => e.category === 'manufacturing')
        .reduce((sum, e) => sum + e.amount, 0);
      const operatingExpenses = expenses
        .filter(e => ['utilities', 'rent', 'maintenance'].includes(e.category))
        .reduce((sum, e) => sum + e.amount, 0);
      const administrativeExpenses = expenses
        .filter(e => e.category === 'administrative')
        .reduce((sum, e) => sum + e.amount, 0);

      const totalCosts = directMaterials + directLabor + manufacturingOverhead + operatingExpenses + administrativeExpenses;

      // Calculate costs by center
      const costsByCenter: { [key: string]: number } = {};
      const centers = this.getCostCenters();
      
      for (const center of centers) {
        const centerAllocations = allocations.filter(a => a.costCenterId === center.id);
        costsByCenter[center.name] = centerAllocations.reduce((sum, a) => sum + a.amount, 0);
      }

      // Estimate variable vs fixed costs (simplified)
      const variableCosts = directMaterials + (directLabor * 0.7); // Assume 70% of labor is variable
      const fixedCosts = totalCosts - variableCosts;

      // Calculate cost per unit
      const costPerUnit: { [productId: string]: number } = {};
      for (const cost of productCosts) {
        costPerUnit[cost.productId] = cost.totalCost;
      }

      // Calculate profitability
      const totalRevenue = salesInvoices.reduce((sum, inv) => sum + inv.total, 0);
      const grossProfit = totalRevenue - totalCosts;
      const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

      return {
        period: { start: startDate, end: endDate },
        totalCosts,
        costsByCategory: {
          directMaterials,
          directLabor,
          manufacturingOverhead,
          operatingExpenses,
          administrativeExpenses
        },
        costsByCenter,
        variableCosts,
        fixedCosts,
        costPerUnit,
        profitabilityAnalysis: {
          totalRevenue,
          totalCosts,
          grossProfit,
          grossProfitMargin
        }
      };
    } catch (error) {
      console.error('Error generating cost analysis:', error);
      throw error;
    }
  }

  // Automated cost allocation from expenses
  allocateExpensesToCostCenters(): void {
    try {
      const expenses = expensesManager.getExpenses();
      const existingAllocations = this.getCostAllocations();

      for (const expense of expenses) {
        // Skip if already allocated
        const alreadyAllocated = existingAllocations.some(a => 
          a.referenceId === expense.id && a.referenceType === 'expense'
        );

        if (!alreadyAllocated) {
          const costCenterId = this.determineCostCenterForExpense(expense);
          
          if (costCenterId) {
            this.addCostAllocation({
              costCenterId,
              amount: expense.amount,
              description: `تخصيص تلقائي للمصروف: ${expense.description}`,
              date: expense.date,
              referenceId: expense.id,
              referenceType: 'expense'
            });
          }
        }
      }
    } catch (error) {
      console.error('Error allocating expenses to cost centers:', error);
    }
  }

  // Automated cost allocation from payroll
  allocatePayrollToCostCenters(): void {
    try {
      const payrollRecords = payrollManager.getPayrollRecords();
      const existingAllocations = this.getCostAllocations();

      for (const payroll of payrollRecords) {
        // Skip if already allocated
        const alreadyAllocated = existingAllocations.some(a => 
          a.referenceId === payroll.id && a.referenceType === 'payroll'
        );

        if (!alreadyAllocated) {
          const costCenterId = this.determineCostCenterForPayroll(payroll);
          
          if (costCenterId) {
            this.addCostAllocation({
              costCenterId,
              amount: payroll.totalAmount,
              description: `تخصيص تلقائي للراتب: ${payroll.employeeName}`,
              date: payroll.date,
              referenceId: payroll.id,
              referenceType: 'payroll'
            });
          }
        }
      }
    } catch (error) {
      console.error('Error allocating payroll to cost centers:', error);
    }
  }

  // Helper methods
  private calculateDirectLaborCost(productId: string): number {
    // This would require more sophisticated tracking of labor hours per product
    // For now, return a simplified calculation
    const payrollRecords = payrollManager.getPayrollRecords();
    const totalPayroll = payrollRecords.reduce((sum, pr) => sum + pr.totalAmount, 0);
    const products = inventoryManager.getProducts();
    
    // Simple allocation based on number of products
    return products.length > 0 ? totalPayroll / products.length / 12 : 0; // Monthly average
  }

  private calculateManufacturingOverhead(productId: string): number {
    // Calculate overhead based on allocated manufacturing costs
    const allocations = this.getCostAllocations();
    const productionCenter = this.getCostCenters().find(c => c.category === 'production');
    
    if (!productionCenter) return 0;

    const productionAllocations = allocations.filter(a => a.costCenterId === productionCenter.id);
    const totalOverhead = productionAllocations.reduce((sum, a) => sum + a.amount, 0);
    const products = inventoryManager.getProducts();

    // Simple allocation based on number of products
    return products.length > 0 ? totalOverhead / products.length : 0;
  }

  private calculateAllocatedIndirectCosts(productId: string): number {
    // Calculate indirect costs allocated to this product
    const allocations = this.getCostAllocations();
    const adminCenter = this.getCostCenters().find(c => c.category === 'admin');
    
    if (!adminCenter) return 0;

    const adminAllocations = allocations.filter(a => a.costCenterId === adminCenter.id);
    const totalIndirect = adminAllocations.reduce((sum, a) => sum + a.amount, 0);
    const products = inventoryManager.getProducts();

    // Simple allocation based on number of products
    return products.length > 0 ? totalIndirect / products.length : 0;
  }

  private calculateDirectMaterialsCost(startDate: string, endDate: string): number {
    const movements = inventoryManager.getMovementsByDateRange(startDate, endDate);
    return movements
      .filter(m => m.type === 'in' && m.referenceType === 'purchase')
      .reduce((sum, m) => sum + m.value, 0);
  }

  private determineCostCenterForExpense(expense: any): string | null {
    // Map expense categories to cost centers
    const categoryMapping: { [key: string]: string } = {
      'manufacturing': 'production',
      'production': 'production',
      'sales': 'sales',
      'marketing': 'marketing',
      'advertising': 'marketing',
      'administrative': 'admin',
      'office': 'admin',
      'hr': 'hr',
      'training': 'hr'
    };

    return categoryMapping[expense.category] || 'admin';
  }

  private determineCostCenterForPayroll(payroll: any): string | null {
    // This would require employee department information
    // For now, allocate to HR center
    return 'hr';
  }

  private getSalesInvoicesByDateRange(startDate: string, endDate: string): any[] {
    const salesInvoices = storage.getItem('sales_invoices', []);
    return salesInvoices.filter((inv: any) => {
      const invDate = new Date(inv.date).getTime();
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      return invDate >= start && invDate <= end;
    });
  }

  // Cost Reports
  generateCostReport(type: 'product_costing' | 'cost_center' | 'profitability' | 'variance', startDate: string, endDate: string): CostReport {
    try {
      let data: any;
      let title: string;

      switch (type) {
        case 'product_costing':
          data = this.calculateProductCosts();
          title = `تقرير تكاليف المنتجات - ${startDate} إلى ${endDate}`;
          break;
        case 'cost_center':
          data = this.generateCostCenterReport(startDate, endDate);
          title = `تقرير مراكز التكلفة - ${startDate} إلى ${endDate}`;
          break;
        case 'profitability':
          data = this.generateProfitabilityReport(startDate, endDate);
          title = `تقرير الربحية - ${startDate} إلى ${endDate}`;
          break;
        case 'variance':
          data = this.generateVarianceReport(startDate, endDate);
          title = `تقرير انحرافات التكلفة - ${startDate} إلى ${endDate}`;
          break;
        default:
          throw new Error('Invalid report type');
      }

      const report: CostReport = {
        id: `cost_report_${Date.now()}`,
        title,
        type,
        period: { start: startDate, end: endDate },
        data,
        generatedAt: new Date().toISOString()
      };

      // Save report
      const reports = storage.getItem('cost_reports', []);
      reports.push(report);
      
      // Keep only last 50 reports
      if (reports.length > 50) {
        reports.splice(0, reports.length - 50);
      }
      
      storage.setItem('cost_reports', reports);

      return report;
    } catch (error) {
      console.error('Error generating cost report:', error);
      throw error;
    }
  }

  private generateCostCenterReport(startDate: string, endDate: string): any {
    const centers = this.getCostCenters();
    const allocations = this.getAllocationsByDateRange(startDate, endDate);

    return centers.map(center => {
      const centerAllocations = allocations.filter(a => a.costCenterId === center.id);
      const totalCost = centerAllocations.reduce((sum, a) => sum + a.amount, 0);
      
      return {
        id: center.id,
        name: center.name,
        category: center.category,
        totalCost,
        allocationsCount: centerAllocations.length,
        allocations: centerAllocations
      };
    });
  }

  private generateProfitabilityReport(startDate: string, endDate: string): any {
    const analysis = this.generateCostAnalysis(startDate, endDate);
    const productCosts = this.getProductCosts();
    const salesInvoices = this.getSalesInvoicesByDateRange(startDate, endDate);

    // Calculate profitability by product
    const productProfitability = productCosts.map(cost => {
      const productSales = salesInvoices
        .flatMap(inv => inv.itemsDetails || [])
        .filter((item: any) => item.productName === cost.productName);
      
      const totalSalesRevenue = productSales.reduce((sum: number, item: any) => sum + item.total, 0);
      const totalQuantitySold = productSales.reduce((sum: number, item: any) => sum + item.quantity, 0);
      const totalCostOfSales = totalQuantitySold * cost.totalCost;
      const grossProfit = totalSalesRevenue - totalCostOfSales;

      return {
        ...cost,
        salesRevenue: totalSalesRevenue,
        quantitySold: totalQuantitySold,
        costOfSales: totalCostOfSales,
        grossProfit,
        grossProfitMargin: totalSalesRevenue > 0 ? (grossProfit / totalSalesRevenue) * 100 : 0
      };
    });

    return {
      overall: analysis.profitabilityAnalysis,
      byProduct: productProfitability
    };
  }

  private generateVarianceReport(startDate: string, endDate: string): any {
    // This would require standard costs vs actual costs comparison
    // For now, return a simplified variance analysis
    const analysis = this.generateCostAnalysis(startDate, endDate);
    
    return {
      message: 'تحليل الانحرافات يتطلب تحديد التكاليف المعيارية',
      actualCosts: analysis.costsByCategory,
      recommendations: [
        'تحديد التكاليف المعيارية لكل منتج',
        'مراقبة انحرافات المواد المباشرة',
        'تتبع انحرافات العمالة المباشرة',
        'مراجعة انحرافات التكاليف الصناعية غير المباشرة'
      ]
    };
  }

  getCostReports(): CostReport[] {
    return storage.getItem('cost_reports', []);
  }
}

// Export singleton instance
export const costTrackingManager = CostTrackingManager.getInstance();
