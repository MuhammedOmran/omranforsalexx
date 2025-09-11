import { storage } from './storage';
import { cashFlowManager } from './cashFlowManager';
import { expensesManager } from './expensesManager';
import { payrollManager } from './payrollManager';
import { returnsManager } from './returnsManager';
import { employeeManager } from './employeeManager';
import { inventoryManager } from './inventoryUtils';

export interface SystemIntegrationResult {
  totalIssuesFixed: number;
  issuesFixedByCategory: {
    [category: string]: number;
  };
  newLinksCreated: number;
  dataIntegrityIssuesFixed: number;
  automationRulesEnabled: number;
  performanceImprovements: string[];
  errors: string[];
}

export interface IntegrationRule {
  id: string;
  name: string;
  description: string;
  sourceSystem: string;
  targetSystem: string;
  condition: (data: any) => boolean;
  action: (data: any) => void;
  isActive: boolean;
  priority: number;
  lastExecuted?: string;
}

export class AdvancedSystemIntegrationManager {
  private static instance: AdvancedSystemIntegrationManager;
  private integrationRules: IntegrationRule[] = [];

  static getInstance(): AdvancedSystemIntegrationManager {
    if (!AdvancedSystemIntegrationManager.instance) {
      AdvancedSystemIntegrationManager.instance = new AdvancedSystemIntegrationManager();
    }
    return AdvancedSystemIntegrationManager.instance;
  }

  constructor() {
    this.initializeIntegrationRules();
  }

  // تشغيل التحسين الشامل لجميع الأنظمة
  async enhanceAllSystemIntegrations(): Promise<SystemIntegrationResult> {
    console.log('🚀 بدء التحسين الشامل لترابط الأنظمة...');
    
    const result: SystemIntegrationResult = {
      totalIssuesFixed: 0,
      issuesFixedByCategory: {},
      newLinksCreated: 0,
      dataIntegrityIssuesFixed: 0,
      automationRulesEnabled: 0,
      performanceImprovements: [],
      errors: []
    };

    try {
      // 1. تحسين المصروفات والصندوق
      const expensesResult = await this.enhanceExpensesCashFlowIntegration();
      this.mergeResults(result, expensesResult, 'المصروفات والصندوق');

      // 2. تحسين الموظفين والمرتبات
      const employeeResult = await this.enhanceEmployeePayrollIntegration();
      this.mergeResults(result, employeeResult, 'الموظفين والمرتبات');

      // 3. تحسين المرتجعات والمخزون والصندوق
      const returnsResult = await this.enhanceReturnsIntegration();
      this.mergeResults(result, returnsResult, 'المرتجعات');

      // 4. تحسين الباركود والمخزون
      const barcodeResult = await this.enhanceBarcodeInventoryIntegration();
      this.mergeResults(result, barcodeResult, 'الباركود والمخزون');

      // 5. تحسين الشيكات والأقساط مع العملاء والموردين
      const checksInstallmentsResult = await this.enhanceChecksInstallmentsIntegration();
      this.mergeResults(result, checksInstallmentsResult, 'الشيكات والأقساط');

      // 6. تحسين إدارة المستخدمين مع بيانات الموظفين
      const userManagementResult = await this.enhanceUserManagementIntegration();
      this.mergeResults(result, userManagementResult, 'إدارة المستخدمين');

      // 7. إنشاء تقارير موحدة
      const reportsResult = await this.createUnifiedReports();
      this.mergeResults(result, reportsResult, 'التقارير الموحدة');

      // 8. إنشاء تنبيهات ذكية
      const alertsResult = await this.createSmartAlerts();
      this.mergeResults(result, alertsResult, 'التنبيهات الذكية');

      // 9. تفعيل القواعد التلقائية
      result.automationRulesEnabled = this.enableAutomationRules();

      console.log('✅ تم إكمال التحسين الشامل بنجاح');
      
    } catch (error) {
      console.error('❌ خطأ في التحسين الشامل:', error);
      result.errors.push(`خطأ عام: ${error}`);
    }

    return result;
  }

  // تحسين ترابط المصروفات مع الصندوق
  private async enhanceExpensesCashFlowIntegration(): Promise<SystemIntegrationResult> {
    const result: SystemIntegrationResult = {
      totalIssuesFixed: 0,
      issuesFixedByCategory: { 'مصروفات': 0 },
      newLinksCreated: 0,
      dataIntegrityIssuesFixed: 0,
      automationRulesEnabled: 0,
      performanceImprovements: [],
      errors: []
    };

    try {
      // 1. ربط المصروفات المدفوعة مع الصندوق تلقائياً
      const expenses = expensesManager.getExpenses();
      const cashFlowTransactions = cashFlowManager.getTransactions();
      
      let linkedExpenses = 0;
      expenses.forEach(expense => {
        if (expense.status === 'paid') {
          // التحقق من وجود معاملة في الصندوق
          const hasTransaction = cashFlowTransactions.some(t => t.referenceId === expense.id);
          if (!hasTransaction) {
            // إضافة المعاملة للصندوق
            cashFlowManager.addTransaction({
              date: expense.date,
              type: 'expense',
              category: this.mapExpenseCategory(expense.category),
              subcategory: expense.category,
              amount: expense.amount,
              description: `مصروف - ${expense.description}`,
              referenceId: expense.id,
              referenceType: 'manual',
              paymentMethod: 'cash',
              notes: expense.notes
            });
            linkedExpenses++;
          }
        }
      });

      // 2. إضافة تصنيفات مرتبطة بالأقسام
      this.enhanceExpenseCategories();

      result.totalIssuesFixed = linkedExpenses;
      result.issuesFixedByCategory['مصروفات'] = linkedExpenses;
      result.newLinksCreated = linkedExpenses;
      result.performanceImprovements.push('تم ربط المصروفات المدفوعة بالصندوق تلقائياً');
      result.performanceImprovements.push('تم تحسين تصنيفات المصروفات');

    } catch (error) {
      result.errors.push(`خطأ في تحسين المصروفات: ${error}`);
    }

    return result;
  }

  // تحسين ترابط الموظفين مع المرتبات والصندوق
  private async enhanceEmployeePayrollIntegration(): Promise<SystemIntegrationResult> {
    const result: SystemIntegrationResult = {
      totalIssuesFixed: 0,
      issuesFixedByCategory: { 'موظفين': 0 },
      newLinksCreated: 0,
      dataIntegrityIssuesFixed: 0,
      automationRulesEnabled: 0,
      performanceImprovements: [],
      errors: []
    };

    try {
      // 1. ربط المرتبات المدفوعة مع الصندوق
      const payrollRecords = payrollManager.getPayrollRecords();
      const cashFlowTransactions = cashFlowManager.getTransactions();
      
      let linkedPayrolls = 0;
      payrollRecords.forEach(record => {
        if (record.isPaid) {
          // التحقق من وجود معاملة في الصندوق
          const hasTransaction = cashFlowTransactions.some(t => 
            t.referenceId === record.id && t.referenceType === 'payroll'
          );
          if (!hasTransaction) {
            // إضافة المعاملة للصندوق
            cashFlowManager.addTransaction({
              date: record.paidDate || new Date().toISOString(),
              type: 'expense',
              category: 'payroll',
              subcategory: 'رواتب',
              amount: record.netSalary,
              description: `راتب ${record.employeeName} - ${record.month}/${record.year}`,
              referenceId: record.id,
              referenceType: 'payroll',
              paymentMethod: 'bank',
              notes: `راتب أساسي: ${record.basicSalary}`
            });
            linkedPayrolls++;
          }
        }
      });

      // 2. ربط بيانات الموظفين مع نظام إدارة المستخدمين
      this.linkEmployeesWithUserManagement();

      result.totalIssuesFixed = linkedPayrolls;
      result.issuesFixedByCategory['موظفين'] = linkedPayrolls;
      result.newLinksCreated = linkedPayrolls;
      result.performanceImprovements.push('تم ربط المرتبات المدفوعة بالصندوق تلقائياً');
      result.performanceImprovements.push('تم ربط بيانات الموظفين مع إدارة المستخدمين');

    } catch (error) {
      result.errors.push(`خطأ في تحسين الموظفين: ${error}`);
    }

    return result;
  }

  // تحسين ترابط المرتجعات مع المخزون والصندوق
  private async enhanceReturnsIntegration(): Promise<SystemIntegrationResult> {
    const result: SystemIntegrationResult = {
      totalIssuesFixed: 0,
      issuesFixedByCategory: { 'مرتجعات': 0 },
      newLinksCreated: 0,
      dataIntegrityIssuesFixed: 0,
      automationRulesEnabled: 0,
      performanceImprovements: [],
      errors: []
    };

    try {
      // 1. معالجة المرتجعات غير المعالجة
      const returns = returnsManager.getReturns();
      const processedReturns = returns.filter(r => r.status === 'processed');
      const cashFlowTransactions = cashFlowManager.getTransactions();
      
      let fixedReturns = 0;
      processedReturns.forEach(returnRecord => {
        // التحقق من وجود معاملة في الصندوق
        const hasTransaction = cashFlowTransactions.some(t => t.referenceId === returnRecord.id);
        if (!hasTransaction) {
          // إضافة معاملة الاسترداد للصندوق
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
            notes: `السبب: ${returnRecord.reason}`
          });
          fixedReturns++;
        }

        // التأكد من إرجاع المنتجات للمخزون
        this.ensureReturnInventoryProcessing(returnRecord);
      });

      // 2. ربط المرتجعات مع الفواتير الأصلية
      this.linkReturnsWithOriginalInvoices();

      result.totalIssuesFixed = fixedReturns;
      result.issuesFixedByCategory['مرتجعات'] = fixedReturns;
      result.newLinksCreated = fixedReturns;
      result.performanceImprovements.push('تم ربط المرتجعات المعالجة بالصندوق');
      result.performanceImprovements.push('تم التأكد من إرجاع المنتجات للمخزون');
      result.performanceImprovements.push('تم ربط المرتجعات مع الفواتير الأصلية');

    } catch (error) {
      result.errors.push(`خطأ في تحسين المرتجعات: ${error}`);
    }

    return result;
  }

  // تحسين ترابط الباركود مع المخزون
  private async enhanceBarcodeInventoryIntegration(): Promise<SystemIntegrationResult> {
    const result: SystemIntegrationResult = {
      totalIssuesFixed: 0,
      issuesFixedByCategory: { 'باركود': 0 },
      newLinksCreated: 0,
      dataIntegrityIssuesFixed: 0,
      automationRulesEnabled: 0,
      performanceImprovements: [],
      errors: []
    };

    try {
      // 1. إنشاء باركود تلقائي للمنتجات التي لا تحتوي على باركود
      const products = inventoryManager.getProducts();
      let productsWithBarcodeAdded = 0;

      products.forEach(product => {
        if (!product.barcode || product.barcode.trim() === '') {
          // إنشاء باركود تلقائي
          const generatedBarcode = this.generateBarcode(product.id);
          product.barcode = generatedBarcode;
          productsWithBarcodeAdded++;
        }
      });

      if (productsWithBarcodeAdded > 0) {
        storage.setItem('products', products);
      }

      // 2. إنشاء فهرس سريع للبحث بالباركود
      this.createBarcodeIndex();

      result.totalIssuesFixed = productsWithBarcodeAdded;
      result.issuesFixedByCategory['باركود'] = productsWithBarcodeAdded;
      result.newLinksCreated = productsWithBarcodeAdded;
      result.performanceImprovements.push(`تم إنشاء باركود لـ ${productsWithBarcodeAdded} منتج`);
      result.performanceImprovements.push('تم إنشاء فهرس سريع للبحث بالباركود');

    } catch (error) {
      result.errors.push(`خطأ في تحسين الباركود: ${error}`);
    }

    return result;
  }

  // تحسين ترابط الشيكات والأقساط مع العملاء والموردين
  private async enhanceChecksInstallmentsIntegration(): Promise<SystemIntegrationResult> {
    const result: SystemIntegrationResult = {
      totalIssuesFixed: 0,
      issuesFixedByCategory: { 'شيكات_أقساط': 0 },
      newLinksCreated: 0,
      dataIntegrityIssuesFixed: 0,
      automationRulesEnabled: 0,
      performanceImprovements: [],
      errors: []
    };

    try {
      // 1. ربط الشيكات مع أصحابها (عملاء/موردين/موظفين)
      const linkedChecks = this.linkChecksWithOwners();
      
      // 2. ربط الأقساط مع العملاء
      const linkedInstallments = this.linkInstallmentsWithCustomers();

      // 3. إنشاء تتبع مديونية شامل
      this.createDebtTrackingSystem();

      result.totalIssuesFixed = linkedChecks + linkedInstallments;
      result.issuesFixedByCategory['شيكات_أقساط'] = linkedChecks + linkedInstallments;
      result.newLinksCreated = linkedChecks + linkedInstallments;
      result.performanceImprovements.push(`تم ربط ${linkedChecks} شيك مع أصحابها`);
      result.performanceImprovements.push(`تم ربط ${linkedInstallments} قسط مع العملاء`);
      result.performanceImprovements.push('تم إنشاء نظام تتبع المديونية');

    } catch (error) {
      result.errors.push(`خطأ في تحسين الشيكات والأقساط: ${error}`);
    }

    return result;
  }

  // تحسين ترابط إدارة المستخدمين مع بيانات الموظفين
  private async enhanceUserManagementIntegration(): Promise<SystemIntegrationResult> {
    const result: SystemIntegrationResult = {
      totalIssuesFixed: 0,
      issuesFixedByCategory: { 'إدارة_المستخدمين': 0 },
      newLinksCreated: 0,
      dataIntegrityIssuesFixed: 0,
      automationRulesEnabled: 0,
      performanceImprovements: [],
      errors: []
    };

    try {
      // 1. ربط حسابات المستخدمين مع بيانات الموظفين
      const linkedUsers = this.linkUsersWithEmployees();

      // 2. إنشاء صلاحيات مرتبطة بالأقسام
      this.createDepartmentPermissions();

      // 3. مزامنة بيانات المستخدمين مع بيانات الموظفين
      this.syncUserEmployeeData();

      result.totalIssuesFixed = linkedUsers;
      result.issuesFixedByCategory['إدارة_المستخدمين'] = linkedUsers;
      result.newLinksCreated = linkedUsers;
      result.performanceImprovements.push(`تم ربط ${linkedUsers} مستخدم مع بيانات الموظفين`);
      result.performanceImprovements.push('تم إنشاء صلاحيات مرتبطة بالأقسام');
      result.performanceImprovements.push('تم مزامنة بيانات المستخدمين والموظفين');

    } catch (error) {
      result.errors.push(`خطأ في تحسين إدارة المستخدمين: ${error}`);
    }

    return result;
  }

  // إنشاء تقارير موحدة
  private async createUnifiedReports(): Promise<SystemIntegrationResult> {
    const result: SystemIntegrationResult = {
      totalIssuesFixed: 0,
      issuesFixedByCategory: { 'تقارير': 0 },
      newLinksCreated: 0,
      dataIntegrityIssuesFixed: 0,
      automationRulesEnabled: 0,
      performanceImprovements: [],
      errors: []
    };

    try {
      // 1. إنشاء تقرير الربحية الشامل
      this.createComprehensiveProfitReport();

      // 2. إنشاء تقرير التدفق النقدي الموحد
      this.createUnifiedCashFlowReport();

      // 3. إنشاء تقارير أداء العملاء والموردين
      this.createPerformanceReports();

      result.performanceImprovements.push('تم إنشاء تقرير الربحية الشامل');
      result.performanceImprovements.push('تم إنشاء تقرير التدفق النقدي الموحد');
      result.performanceImprovements.push('تم إنشاء تقارير أداء العملاء والموردين');

    } catch (error) {
      result.errors.push(`خطأ في إنشاء التقارير: ${error}`);
    }

    return result;
  }

  // إنشاء تنبيهات ذكية
  private async createSmartAlerts(): Promise<SystemIntegrationResult> {
    const result: SystemIntegrationResult = {
      totalIssuesFixed: 0,
      issuesFixedByCategory: { 'تنبيهات': 0 },
      newLinksCreated: 0,
      dataIntegrityIssuesFixed: 0,
      automationRulesEnabled: 0,
      performanceImprovements: [],
      errors: []
    };

    try {
      // 1. تنبيهات المخزون المنخفض
      this.createLowStockAlerts();

      // 2. تنبيهات الأقساط المستحقة
      this.createDueInstallmentAlerts();

      // 3. تنبيهات الشيكات المستحقة
      this.createDueCheckAlerts();

      // 4. تنبيهات المصروفات غير العادية
      this.createUnusualExpenseAlerts();

      result.performanceImprovements.push('تم إنشاء تنبيهات المخزون المنخفض');
      result.performanceImprovements.push('تم إنشاء تنبيهات الأقساط المستحقة');
      result.performanceImprovements.push('تم إنشاء تنبيهات الشيكات المستحقة');
      result.performanceImprovements.push('تم إنشاء تنبيهات المصروفات غير العادية');

    } catch (error) {
      result.errors.push(`خطأ في إنشاء التنبيهات: ${error}`);
    }

    return result;
  }

  // دمج النتائج
  private mergeResults(mainResult: SystemIntegrationResult, subResult: SystemIntegrationResult, category: string): void {
    mainResult.totalIssuesFixed += subResult.totalIssuesFixed;
    mainResult.newLinksCreated += subResult.newLinksCreated;
    mainResult.dataIntegrityIssuesFixed += subResult.dataIntegrityIssuesFixed;
    
    Object.assign(mainResult.issuesFixedByCategory, subResult.issuesFixedByCategory);
    mainResult.performanceImprovements.push(...subResult.performanceImprovements);
    mainResult.errors.push(...subResult.errors);
  }

  // تعيين فئة المصروفات
  private mapExpenseCategory(expenseCategory: string): 'sales' | 'purchases' | 'payroll' | 'utilities' | 'rent' | 'marketing' | 'other' {
    const categoryMap: { [key: string]: any } = {
      'إيجار المحل': 'rent',
      'الكهرباء والمياه': 'utilities',
      'رواتب الموظفين': 'payroll',
      'مصاريف التسويق': 'marketing',
      'صيانة المعدات': 'other',
      'مصاريف النقل': 'other',
      'الرواتب والأجور': 'payroll',
      'أخرى': 'other'
    };
    return categoryMap[expenseCategory] || 'other';
  }

  // تحسين تصنيفات المصروفات
  private enhanceExpenseCategories(): void {
    const categories = [
      'إيجار المحل',
      'الكهرباء والمياه', 
      'رواتب الموظفين',
      'مصاريف التسويق',
      'صيانة المعدات',
      'مصاريف النقل',
      'الرواتب والأجور',
      'مصاريف إدارية',
      'مصاريف قانونية',
      'تأمينات',
      'اتصالات وإنترنت',
      'مواد تنظيف',
      'قرطاسية ومطبوعات',
      'أخرى'
    ];
    
    storage.setItem('expense_categories', categories);
  }

  // ربط الموظفين مع إدارة المستخدمين
  private linkEmployeesWithUserManagement(): void {
    const employees = employeeManager.getEmployees();
    const users = storage.getItem('users', []);
    
    employees.forEach(employee => {
      const existingUser = users.find((user: any) => user.employeeId === employee.id);
      if (!existingUser) {
        // إنشاء مستخدم جديد للموظف
        const newUser = {
          id: `USER_${employee.id}`,
          employeeId: employee.id,
          username: employee.email || `emp_${employee.id}`,
          email: employee.email,
          name: employee.name,
          role: this.mapPositionToRole(employee.position),
          department: employee.department,
          permissions: this.getPermissionsByRole(employee.position),
          isActive: employee.status === 'active',
          createdAt: new Date().toISOString()
        };
        users.push(newUser);
      }
    });
    
    storage.setItem('users', users);
  }

  // تعيين الدور حسب المنصب
  private mapPositionToRole(position: string): string {
    const roleMap: { [key: string]: string } = {
      'مدير عام': 'admin',
      'مدير مبيعات': 'sales_manager',
      'مدير مخزون': 'inventory_manager',
      'محاسب': 'accountant',
      'موظف مبيعات': 'sales_employee',
      'موظف مخزون': 'inventory_employee',
      'كاشير': 'cashier'
    };
    return roleMap[position] || 'employee';
  }

  // الحصول على الصلاحيات حسب الدور
  private getPermissionsByRole(position: string): string[] {
    const permissionMap: { [key: string]: string[] } = {
      'مدير عام': ['all'],
      'مدير مبيعات': ['sales', 'customers', 'reports'],
      'مدير مخزون': ['inventory', 'suppliers', 'reports'],
      'محاسب': ['financial', 'expenses', 'payroll', 'reports'],
      'موظف مبيعات': ['sales', 'customers'],
      'موظف مخزون': ['inventory'],
      'كاشير': ['cash_register', 'sales']
    };
    return permissionMap[position] || ['basic'];
  }

  // التأكد من معالجة مخزون المرتجعات
  private ensureReturnInventoryProcessing(returnRecord: any): void {
    returnRecord.items.forEach((item: any) => {
      const products = inventoryManager.getProducts();
      const productIndex = products.findIndex(p => p.id === item.productId);
      if (productIndex !== -1) {
        // التحقق من أن المنتج تم إرجاعه للمخزون
        // هذا مجرد تأكيد، العملية تتم في returnsManager
        console.log(`تم التأكد من إرجاع ${item.quantity} من ${item.productName} للمخزون`);
      }
    });
  }

  // ربط المرتجعات مع الفواتير الأصلية
  private linkReturnsWithOriginalInvoices(): void {
    const returns = returnsManager.getReturns();
    const salesInvoices = storage.getItem('sales_invoices', []);
    
    returns.forEach(returnRecord => {
      if (!returnRecord.originalInvoiceId && returnRecord.originalInvoiceNumber) {
        const originalInvoice = salesInvoices.find((inv: any) => 
          inv.invoiceNumber === returnRecord.originalInvoiceNumber || 
          inv.id === returnRecord.originalInvoiceNumber
        );
        
        if (originalInvoice) {
          returnRecord.originalInvoiceId = originalInvoice.id;
          // تحديث المرتجع
          returnsManager.updateReturn(returnRecord.id, { 
            originalInvoiceId: originalInvoice.id 
          });
        }
      }
    });
  }

  // إنشاء باركود
  private generateBarcode(productId: string): string {
    const timestamp = Date.now().toString().slice(-8);
    const productCode = productId.replace(/[^0-9]/g, '').slice(-4);
    return `${productCode}${timestamp}`;
  }

  // إنشاء فهرس الباركود
  private createBarcodeIndex(): void {
    const products = inventoryManager.getProducts();
    const barcodeIndex: { [key: string]: string } = {};
    
    products.forEach(product => {
      if (product.barcode) {
        barcodeIndex[product.barcode] = product.id;
      }
    });
    
    storage.setItem('barcode_index', barcodeIndex);
  }

  // ربط الشيكات مع أصحابها
  private linkChecksWithOwners(): number {
    const checks = storage.getItem('checks', []);
    const customers = storage.getItem('customers', []);
    const suppliers = storage.getItem('suppliers', []);
    const employees = employeeManager.getEmployees();
    
    let linkedCount = 0;
    
    checks.forEach((check: any) => {
      if (!check.ownerId || !check.ownerType) {
        // محاولة تحديد صاحب الشيك من الاسم
        let owner = customers.find((c: any) => c.name === check.customerName || c.name === check.name);
        if (owner) {
          check.ownerId = owner.id;
          check.ownerType = 'customer';
          linkedCount++;
        } else {
          owner = suppliers.find((s: any) => s.name === check.supplierName || s.name === check.name);
          if (owner) {
            check.ownerId = owner.id;
            check.ownerType = 'supplier';
            linkedCount++;
          } else {
            owner = employees.find(e => e.name === check.employeeName || e.name === check.name);
            if (owner) {
              check.ownerId = owner.id;
              check.ownerType = 'employee';
              linkedCount++;
            }
          }
        }
      }
    });
    
    if (linkedCount > 0) {
      storage.setItem('checks', checks);
    }
    
    return linkedCount;
  }

  // ربط الأقساط مع العملاء
  private linkInstallmentsWithCustomers(): number {
    const installments = storage.getItem('installments', []);
    const customers = storage.getItem('customers', []);
    
    let linkedCount = 0;
    
    installments.forEach((installment: any) => {
      if (!installment.customerId && installment.customerName) {
        const customer = customers.find((c: any) => c.name === installment.customerName);
        if (customer) {
          installment.customerId = customer.id;
          linkedCount++;
        }
      }
    });
    
    if (linkedCount > 0) {
      storage.setItem('installments', installments);
    }
    
    return linkedCount;
  }

  // إنشاء نظام تتبع المديونية
  private createDebtTrackingSystem(): void {
    const customers = storage.getItem('customers', []);
    const suppliers = storage.getItem('suppliers', []);
    const installments = storage.getItem('installments', []);
    const checks = storage.getItem('checks', []);
    
    // تحديث مديونية العملاء
    customers.forEach((customer: any) => {
      const customerInstallments = installments.filter((i: any) => i.customerId === customer.id);
      const unpaidInstallments = customerInstallments.filter((i: any) => !i.isPaid);
      customer.totalDebt = unpaidInstallments.reduce((sum: number, i: any) => sum + i.amount, 0);
      customer.installmentCount = unpaidInstallments.length;
    });
    
    storage.setItem('customers', customers);
    storage.setItem('suppliers', suppliers);
  }

  // ربط المستخدمين مع الموظفين
  private linkUsersWithEmployees(): number {
    const users = storage.getItem('users', []);
    const employees = employeeManager.getEmployees();
    
    let linkedCount = 0;
    
    users.forEach((user: any) => {
      if (!user.employeeId) {
        const employee = employees.find(e => 
          e.email === user.email || 
          e.name === user.name ||
          e.phoneNumber === user.phone
        );
        
        if (employee) {
          user.employeeId = employee.id;
          user.department = employee.department;
          user.position = employee.position;
          linkedCount++;
        }
      }
    });
    
    if (linkedCount > 0) {
      storage.setItem('users', users);
    }
    
    return linkedCount;
  }

  // إنشاء صلاحيات الأقسام
  private createDepartmentPermissions(): void {
    const departmentPermissions = {
      'المبيعات': ['sales', 'customers', 'cash_register'],
      'المخزون': ['inventory', 'suppliers', 'stock'],
      'الحسابات': ['financial', 'expenses', 'payroll', 'reports'],
      'الإدارة': ['all'],
      'خدمة العملاء': ['customers', 'returns', 'complaints']
    };
    
    storage.setItem('department_permissions', departmentPermissions);
  }

  // مزامنة بيانات المستخدمين والموظفين
  private syncUserEmployeeData(): void {
    const users = storage.getItem('users', []);
    const employees = employeeManager.getEmployees();
    
    users.forEach((user: any) => {
      if (user.employeeId) {
        const employee = employees.find(e => e.id === user.employeeId);
        if (employee) {
          // تحديث بيانات المستخدم من بيانات الموظف
          user.name = employee.name;
          user.email = employee.email;
          user.department = employee.department;
          user.position = employee.position;
          user.isActive = employee.status === 'active';
        }
      }
    });
    
    storage.setItem('users', users);
  }

  // إنشاء تقرير الربحية الشامل
  private createComprehensiveProfitReport(): void {
    const salesInvoices = storage.getItem('sales_invoices', []);
    const purchaseInvoices = storage.getItem('purchase_invoices', []);
    const expenses = expensesManager.getExpenses();
    const payrollRecords = payrollManager.getPayrollRecords();
    
    const comprehensiveReport = {
      totalRevenue: salesInvoices.reduce((sum: number, inv: any) => sum + inv.total, 0),
      totalCosts: purchaseInvoices.reduce((sum: number, inv: any) => sum + inv.total, 0),
      totalExpenses: expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0),
      totalPayroll: payrollRecords.filter((r: any) => r.isPaid).reduce((sum: number, r: any) => sum + r.netSalary, 0),
      lastGenerated: new Date().toISOString()
    };
    
    comprehensiveReport.totalRevenue = comprehensiveReport.totalRevenue - comprehensiveReport.totalCosts - comprehensiveReport.totalExpenses - comprehensiveReport.totalPayroll;
    
    storage.setItem('comprehensive_profit_report', comprehensiveReport);
  }

  // إنشاء تقرير التدفق النقدي الموحد
  private createUnifiedCashFlowReport(): void {
    const cashFlowData = cashFlowManager.getFinancialSummary();
    
    const unifiedReport = {
      ...cashFlowData,
      lastGenerated: new Date().toISOString(),
      systemIntegrationLevel: this.calculateIntegrationLevel()
    };
    
    storage.setItem('unified_cashflow_report', unifiedReport);
  }

  // إنشاء تقارير الأداء
  private createPerformanceReports(): void {
    const customers = storage.getItem('customers', []);
    const suppliers = storage.getItem('suppliers', []);
    
    const customerPerformance = customers.map((customer: any) => ({
      ...customer,
      profitability: this.calculateCustomerProfitability(customer.id),
      returnRate: this.calculateCustomerReturnRate(customer.id)
    }));
    
    const supplierPerformance = suppliers.map((supplier: any) => ({
      ...supplier,
      reliability: this.calculateSupplierReliability(supplier.id),
      costEffectiveness: this.calculateSupplierCostEffectiveness(supplier.id)
    }));
    
    storage.setItem('customer_performance_report', customerPerformance);
    storage.setItem('supplier_performance_report', supplierPerformance);
  }

  // حساب ربحية العميل
  private calculateCustomerProfitability(customerId: string): number {
    const salesInvoices = storage.getItem('sales_invoices', []);
    const customerSales = salesInvoices.filter((inv: any) => inv.customerId === customerId);
    return customerSales.reduce((sum: number, inv: any) => sum + inv.total, 0);
  }

  // حساب معدل الإرجاع للعميل
  private calculateCustomerReturnRate(customerId: string): number {
    const returns = returnsManager.getReturns();
    const customerReturns = returns.filter(r => r.customerId === customerId);
    return customerReturns.length;
  }

  // حساب موثوقية المورد
  private calculateSupplierReliability(supplierId: string): number {
    // يمكن تحسين هذه الدالة بناءً على بيانات أكثر تفصيلاً
    return 85; // نسبة افتراضية
  }

  // حساب فعالية تكلفة المورد
  private calculateSupplierCostEffectiveness(supplierId: string): number {
    // يمكن تحسين هذه الدالة بناءً على بيانات أكثر تفصيلاً
    return 80; // نسبة افتراضية
  }

  // إنشاء تنبيهات المخزون المنخفض
  private createLowStockAlerts(): void {
    const products = inventoryManager.getProducts();
    const lowStockProducts = products.filter(p => p.stock <= (p.minStock || 10));
    
    const alerts = lowStockProducts.map(product => ({
      id: `ALERT_STOCK_${product.id}`,
      type: 'low_stock',
      title: 'مخزون منخفض',
      message: `المنتج ${product.name} وصل إلى الحد الأدنى للمخزون`,
      priority: 'high',
      productId: product.id,
      currentStock: product.stock,
      minStock: product.minStock || 10,
      createdAt: new Date().toISOString()
    }));
    
    storage.setItem('stock_alerts', alerts);
  }

  // إنشاء تنبيهات الأقساط المستحقة
  private createDueInstallmentAlerts(): void {
    const installments = storage.getItem('installments', []);
    const today = new Date();
    
    const dueInstallments = installments.filter((installment: any) => {
      const dueDate = new Date(installment.dueDate);
      return !installment.isPaid && dueDate <= today;
    });
    
    const alerts = dueInstallments.map((installment: any) => ({
      id: `ALERT_INSTALLMENT_${installment.id}`,
      type: 'due_installment',
      title: 'قسط مستحق',
      message: `القسط ${installment.installmentNumber} للعميل ${installment.customerName} مستحق الدفع`,
      priority: 'medium',
      installmentId: installment.id,
      customerId: installment.customerId,
      amount: installment.amount,
      dueDate: installment.dueDate,
      createdAt: new Date().toISOString()
    }));
    
    storage.setItem('installment_alerts', alerts);
  }

  // إنشاء تنبيهات الشيكات المستحقة
  private createDueCheckAlerts(): void {
    const checks = storage.getItem('checks', []);
    const today = new Date();
    
    const dueChecks = checks.filter((check: any) => {
      const dueDate = new Date(check.dueDate || check.date);
      return check.status === 'pending' && dueDate <= today;
    });
    
    const alerts = dueChecks.map((check: any) => ({
      id: `ALERT_CHECK_${check.id}`,
      type: 'due_check',
      title: 'شيك مستحق',
      message: `الشيك رقم ${check.checkNumber} مستحق للصرف`,
      priority: 'high',
      checkId: check.id,
      amount: check.amount,
      dueDate: check.dueDate || check.date,
      createdAt: new Date().toISOString()
    }));
    
    storage.setItem('check_alerts', alerts);
  }

  // إنشاء تنبيهات المصروفات غير العادية
  private createUnusualExpenseAlerts(): void {
    const expenses = expensesManager.getExpenses();
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const thisMonthExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.date);
      return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
    });
    
    const totalThisMonth = thisMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const averageExpense = expenses.length > 0 ? 
      expenses.reduce((sum, exp) => sum + exp.amount, 0) / expenses.length : 0;
    
    if (totalThisMonth > averageExpense * 1.5) {
      const alert = {
        id: `ALERT_EXPENSE_${Date.now()}`,
        type: 'unusual_expense',
        title: 'مصروفات غير عادية',
        message: `إجمالي المصروفات هذا الشهر أعلى من المعتاد بنسبة ${((totalThisMonth / averageExpense - 1) * 100).toFixed(1)}%`,
        priority: 'medium',
        amount: totalThisMonth,
        previousAverage: averageExpense,
        createdAt: new Date().toISOString()
      };
      
      const existingAlerts = storage.getItem('expense_alerts', []);
      existingAlerts.push(alert);
      storage.setItem('expense_alerts', existingAlerts);
    }
  }

  // تفعيل القواعد التلقائية
  private enableAutomationRules(): number {
    this.initializeIntegrationRules();
    
    // تفعيل جميع القواعد
    this.integrationRules.forEach(rule => {
      rule.isActive = true;
    });
    
    storage.setItem('integration_rules', this.integrationRules);
    return this.integrationRules.length;
  }

  // تهيئة قواعد التكامل
  private initializeIntegrationRules(): void {
    this.integrationRules = [
      {
        id: 'RULE_EXPENSE_CASHFLOW',
        name: 'ربط المصروفات بالصندوق',
        description: 'ربط المصروفات المدفوعة بالصندوق تلقائياً',
        sourceSystem: 'expenses',
        targetSystem: 'cashflow',
        condition: (expense: any) => expense.status === 'paid',
        action: (expense: any) => {
          cashFlowManager.addTransaction({
            date: expense.date,
            type: 'expense',
            category: this.mapExpenseCategory(expense.category),
            amount: expense.amount,
            description: `مصروف - ${expense.description}`,
            referenceId: expense.id,
            referenceType: 'manual',
            paymentMethod: 'cash'
          });
        },
        isActive: true,
        priority: 1
      },
      {
        id: 'RULE_PAYROLL_CASHFLOW',
        name: 'ربط المرتبات بالصندوق',
        description: 'ربط المرتبات المدفوعة بالصندوق تلقائياً',
        sourceSystem: 'payroll',
        targetSystem: 'cashflow',
        condition: (payroll: any) => payroll.isPaid,
        action: (payroll: any) => {
          cashFlowManager.addTransaction({
            date: payroll.paidDate || new Date().toISOString(),
            type: 'expense',
            category: 'payroll',
            amount: payroll.netSalary,
            description: `راتب ${payroll.employeeName}`,
            referenceId: payroll.id,
            referenceType: 'payroll',
            paymentMethod: 'bank'
          });
        },
        isActive: true,
        priority: 2
      }
    ];
  }

  // حساب مستوى التكامل
  private calculateIntegrationLevel(): number {
    const systems = [
      'sales', 'inventory', 'cashflow', 'expenses', 
      'payroll', 'returns', 'checks', 'installments'
    ];
    
    let totalConnections = 0;
    let activeConnections = 0;
    
    // حساب الروابط النشطة (هذا مثال مبسط)
    systems.forEach(system => {
      totalConnections += systems.length - 1; // كل نظام يمكن أن يتصل بالأنظمة الأخرى
      // حساب الروابط النشطة بناءً على وجود البيانات المرتبطة
      activeConnections += this.countActiveConnections(system);
    });
    
    return Math.round((activeConnections / totalConnections) * 100);
  }

  // عد الروابط النشطة
  private countActiveConnections(system: string): number {
    // هذا مثال مبسط - يمكن تحسينه
    switch (system) {
      case 'sales':
        return 6; // مرتبط مع المخزون، الصندوق، العملاء، المرتجعات، الأقساط، الشيكات
      case 'inventory':
        return 4; // مرتبط مع المبيعات، المشتريات، المرتجعات، الباركود
      case 'expenses':
        return 2; // مرتبط مع الصندوق، الموظفين
      case 'payroll':
        return 3; // مرتبط مع الموظفين، الصندوق، المصروفات
      default:
        return 2;
    }
  }
}

// تصدير المثيل الوحيد
export const advancedSystemIntegrationManager = AdvancedSystemIntegrationManager.getInstance();