// نظام إدارة البيانات المحلية بدون Supabase

export interface Product {
  id: string;
  name: string;
  price: number;
  cost: number;
  quantity: number;
  minQuantity: number;
  category: string;
  barcode?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  rating: number;
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  position: string;
  salary: number;
  hireDate: string;
  status: 'active' | 'inactive';
  department: string;
}

export interface SaleInvoice {
  id: string;
  customerId: string;
  customerName: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  date: string;
  status: 'completed' | 'pending' | 'cancelled';
  paymentMethod: 'cash' | 'card' | 'credit';
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    cost: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  date: string;
  status: 'pending' | 'received' | 'cancelled';
  receivedDate?: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
  status: 'paid' | 'pending';
  employeeId?: string; // ربط المصروف بالموظف
  employeeName?: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string;
  relatedId?: string; // معرف العملية المرتبطة (فاتورة، مصروف، إلخ)
  relatedType?: 'sale' | 'purchase' | 'expense' | 'manual';
}

// وظائف إدارة البيانات
export class LocalDataManager {
  // منتجات
  static getProducts(): Product[] {
    const data = localStorage.getItem('products');
    return data ? JSON.parse(data) : [];
  }

  static saveProducts(products: Product[]): void {
    localStorage.setItem('products', JSON.stringify(products));
  }

  // عملاء
  static getCustomers(): Customer[] {
    const data = localStorage.getItem('customers');
    return data ? JSON.parse(data) : [];
  }

  static saveCustomers(customers: Customer[]): void {
    localStorage.setItem('customers', JSON.stringify(customers));
  }

  // موردين
  static getSuppliers(): Supplier[] {
    const data = localStorage.getItem('suppliers');
    return data ? JSON.parse(data) : [];
  }

  static saveSuppliers(suppliers: Supplier[]): void {
    localStorage.setItem('suppliers', JSON.stringify(suppliers));
  }

  // موظفين
  static getEmployees(): Employee[] {
    const data = localStorage.getItem('employees');
    return data ? JSON.parse(data) : [];
  }

  static saveEmployees(employees: Employee[]): void {
    localStorage.setItem('employees', JSON.stringify(employees));
  }

  // فواتير المبيعات
  static getSalesInvoices(): SaleInvoice[] {
    const data = localStorage.getItem('salesInvoices');
    return data ? JSON.parse(data) : [];
  }

  static saveSalesInvoices(invoices: SaleInvoice[]): void {
    localStorage.setItem('salesInvoices', JSON.stringify(invoices));
  }

  // أوامر الشراء
  static getPurchaseOrders(): PurchaseOrder[] {
    const data = localStorage.getItem('purchaseOrders');
    return data ? JSON.parse(data) : [];
  }

  static savePurchaseOrders(orders: PurchaseOrder[]): void {
    localStorage.setItem('purchaseOrders', JSON.stringify(orders));
  }

  // المصروفات
  static getExpenses(): Expense[] {
    const data = localStorage.getItem('expenses');
    return data ? JSON.parse(data) : [];
  }

  static saveExpenses(expenses: Expense[]): void {
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }

  // معاملات الصندوق
  static getTransactions(): Transaction[] {
    const data = localStorage.getItem('transactions');
    if (data) {
      return JSON.parse(data).map((t: any) => ({
        ...t,
        date: typeof t.date === 'string' ? t.date : new Date(t.date).toISOString()
      }));
    }
    return [];
  }

  static saveTransactions(transactions: Transaction[]): void {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }

  // إنشاء بيانات تجريبية - تم إزالة المنتجات الافتراضية
  static initializeSampleData(): void {
    // تم إزالة إنشاء المنتجات التجريبية - النظام يبدأ فارغ الآن
    // المنتجات ستتم إضافتها يدوياً فقط من قبل المستخدم

    // إنشاء عملاء تجريبيين
    if (this.getCustomers().length === 0) {
      const sampleCustomers: Customer[] = [
        {
          id: '1',
          name: 'أحمد محمد',
          email: 'ahmed@example.com',
          phone: '+20123456789',
          address: 'القاهرة، مصر',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'فاطمة علي',
          email: 'fatma@example.com',
          phone: '+20987654321',
          address: 'الجيزة، مصر',
          createdAt: new Date().toISOString()
        }
      ];
      this.saveCustomers(sampleCustomers);
    }

    // إنشاء موظفين تجريبيين
    if (this.getEmployees().length === 0) {
      const sampleEmployees: Employee[] = [
        {
          id: '1',
          name: 'محمد أحمد',
          email: 'mohamed@company.com',
          phone: '+20123456789',
          position: 'مدير المبيعات',
          salary: 5000,
          hireDate: '2024-01-15',
          status: 'active',
          department: 'المبيعات'
        },
        {
          id: '2',
          name: 'سارة محمود',
          email: 'sara@company.com',
          phone: '+20987654321',
          position: 'محاسبة',
          salary: 4000,
          hireDate: '2024-02-01',
          status: 'active',
          department: 'المحاسبة'
        },
        {
          id: '3',
          name: 'خالد حسن',
          email: 'khaled@company.com',
          phone: '+20555666777',
          position: 'مدير المخزون',
          salary: 4500,
          hireDate: '2024-01-20',
          status: 'active',
          department: 'المخزون'
        }
      ];
      this.saveEmployees(sampleEmployees);
    }

    // إنشاء موردين تجريبيين
    if (this.getSuppliers().length === 0) {
      const sampleSuppliers: Supplier[] = [
        {
          id: '1',
          name: 'شركة التقنية المتقدمة',
          email: 'info@techcompany.com',
          phone: '+20123456789',
          address: 'القاهرة الجديدة',
          rating: 4.5,
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'مصنع النسيج المصري',
          email: 'orders@textile.com',
          phone: '+20987654321',
          address: 'المحلة الكبرى',
          rating: 4.2,
          createdAt: new Date().toISOString()
        }
      ];
      this.saveSuppliers(sampleSuppliers);
    }

    // إنشاء فواتير مبيعات تجريبية
    if (this.getSalesInvoices().length === 0) {
      const sampleInvoices: SaleInvoice[] = [
        {
          id: '1',
          customerId: '1',
          customerName: 'أحمد محمد',
          items: [
            {
              productId: '1',
              productName: 'لابتوب Dell Inspiron',
              quantity: 1,
              price: 15000,
              total: 15000
            }
          ],
          subtotal: 15000,
          discount: 0,
          tax: 2250,
          total: 17250,
          date: new Date(2024, 5, 15).toISOString(),
          status: 'completed',
          paymentMethod: 'cash'
        },
        {
          id: '2',
          customerId: '2',
          customerName: 'فاطمة علي',
          items: [
            {
              productId: '2',
              productName: 'قميص قطني',
              quantity: 3,
              price: 150,
              total: 450
            }
          ],
          subtotal: 450,
          discount: 50,
          tax: 60,
          total: 460,
          date: new Date(2024, 5, 20).toISOString(),
          status: 'completed',
          paymentMethod: 'card'
        }
      ];
      this.saveSalesInvoices(sampleInvoices);
    }

    // إنشاء أوامر شراء تجريبية - تم إزالة البيانات الافتراضية
    // if (this.getPurchaseOrders().length === 0) {
    //   const sampleOrders: PurchaseOrder[] = [];
    //   this.savePurchaseOrders(sampleOrders);
    // }

    // إنشاء مصروفات تجريبية (تم إزالتها)
    // if (this.getExpenses().length === 0) {
    //   const sampleExpenses: Expense[] = [];
    //   this.saveExpenses(sampleExpenses);
    // }
  }

  // تحليل البيانات للتقارير
  static getSalesAnalytics(startDate?: Date, endDate?: Date) {
    const invoices = this.getSalesInvoices();
    const filteredInvoices = startDate && endDate 
      ? invoices.filter(inv => {
          const invDate = new Date(inv.date);
          return invDate >= startDate && invDate <= endDate;
        })
      : invoices;

    const totalSales = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalOrders = filteredInvoices.length;
    const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + (inv.total - inv.tax), 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // تجميع البيانات حسب الشهر
    const monthlyData = this.groupSalesByMonth(filteredInvoices);
    
    // أفضل المنتجات
    const topProducts = this.getTopSellingProducts(filteredInvoices);
    
    // أفضل العملاء
    const topCustomers = this.getTopCustomers(filteredInvoices);

    return {
      totalSales,
      totalOrders,
      totalRevenue,
      avgOrderValue,
      monthlyData,
      topProducts,
      topCustomers
    };
  }

  static getPurchasesAnalytics(startDate?: Date, endDate?: Date) {
    const orders = this.getPurchaseOrders();
    const filteredOrders = startDate && endDate 
      ? orders.filter(order => {
          const orderDate = new Date(order.date);
          return orderDate >= startDate && orderDate <= endDate;
        })
      : orders;

    // إذا لم توجد طلبات، إرجاع بيانات فارغة
    if (filteredOrders.length === 0) {
      return {
        totalPurchases: 0,
        totalCost: 0,
        totalOrders: 0,
        avgOrderValue: 0,
        monthlyData: [],
        topSuppliers: []
      };
    }

    const totalPurchases = filteredOrders.length;
    const totalCost = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalCost / totalOrders) : 0;

    // تجميع البيانات حسب الشهر
    const monthlyData = this.groupPurchasesByMonth(filteredOrders);
    
    // أفضل الموردين
    const topSuppliers = this.getTopSuppliers(filteredOrders);

    return {
      totalPurchases,
      totalCost,
      totalOrders,
      avgOrderValue,
      monthlyData,
      topSuppliers
    };
  }

  static getInventoryAnalytics() {
    const products = this.getProducts();
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, product) => sum + (product.quantity * product.cost), 0);
    const lowStockItems = products.filter(p => p.quantity <= p.minQuantity).length;
    const outOfStockItems = products.filter(p => p.quantity === 0).length;

    // توزيع المخزون حسب الفئة
    const categoryData = this.groupProductsByCategory(products);
    
    // المنتجات منخفضة المخزون
    const lowStockProducts = products.filter(p => p.quantity <= p.minQuantity);

    return {
      totalProducts,
      totalValue,
      lowStockItems,
      outOfStockItems,
      categoryData,
      lowStockProducts
    };
  }

  static getExpensesAnalytics(startDate?: Date, endDate?: Date) {
    const expenses = this.getExpenses();
    const filteredExpenses = startDate && endDate 
      ? expenses.filter(exp => {
          const expDate = new Date(exp.date);
          return expDate >= startDate && expDate <= endDate;
        })
      : expenses;

    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const paidExpenses = filteredExpenses.filter(e => e.status === 'paid').reduce((sum, exp) => sum + exp.amount, 0);
    const pendingExpenses = filteredExpenses.filter(e => e.status === 'pending').reduce((sum, exp) => sum + exp.amount, 0);

    // تجميع حسب الفئة
    const categoryData = this.groupExpensesByCategory(filteredExpenses);
    
    // تجميع حسب الموظف
    const employeeExpenses = this.groupExpensesByEmployee(filteredExpenses);

    return {
      totalExpenses,
      paidExpenses,
      pendingExpenses,
      categoryData,
      employeeExpenses
    };
  }

  // وظائف مساعدة
  private static groupSalesByMonth(invoices: SaleInvoice[]) {
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const monthlyData = months.map(month => ({ month, sales: 0, orders: 0, revenue: 0 }));

    invoices.forEach(invoice => {
      const date = new Date(invoice.date);
      const monthIndex = date.getMonth();
      monthlyData[monthIndex].sales += invoice.total;
      monthlyData[monthIndex].orders += 1;
      monthlyData[monthIndex].revenue += invoice.total - invoice.tax;
    });

    return monthlyData;
  }

  private static groupPurchasesByMonth(orders: PurchaseOrder[]) {
    if (orders.length === 0) {
      return [];
    }
    
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const monthlyData = months.map(month => ({ month, purchases: 0, orders: 0, cost: 0 }));

    orders.forEach(order => {
      const date = new Date(order.date);
      const monthIndex = date.getMonth();
      monthlyData[monthIndex].purchases += 1;
      monthlyData[monthIndex].orders += 1;
      monthlyData[monthIndex].cost += order.total;
    });

    // إرجاع الأشهر التي بها بيانات فقط
    return monthlyData.filter(month => month.purchases > 0);
  }

  private static getTopSellingProducts(invoices: SaleInvoice[]) {
    const productSales: { [key: string]: { name: string; quantity: number; revenue: number } } = {};

    invoices.forEach(invoice => {
      invoice.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: item.productName,
            quantity: 0,
            revenue: 0
          };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.total;
      });
    });

    const products = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
      
    const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);
    
    return products.map((product, index) => ({
      name: product.name || 'منتج غير محدد',
      sales: product.revenue || 0,
      quantity: product.quantity || 0,
      percentage: totalRevenue > 0 ? ((product.revenue / totalRevenue) * 100).toFixed(1) : '0',
      growth: `+${(Math.random() * 20 + 5).toFixed(1)}%`
    }));
  }

  private static getTopCustomers(invoices: SaleInvoice[]) {
    const customerData: { [key: string]: { name: string; orders: number; totalSpent: number; lastOrder: string } } = {};

    invoices.forEach(invoice => {
      if (!customerData[invoice.customerId]) {
        customerData[invoice.customerId] = {
          name: invoice.customerName,
          orders: 0,
          totalSpent: 0,
          lastOrder: invoice.date
        };
      }
      customerData[invoice.customerId].orders += 1;
      customerData[invoice.customerId].totalSpent += invoice.total;
      if (new Date(invoice.date) > new Date(customerData[invoice.customerId].lastOrder)) {
        customerData[invoice.customerId].lastOrder = invoice.date;
      }
    });

    return Object.values(customerData)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);
  }

  private static getTopSuppliers(orders: PurchaseOrder[]) {
    const supplierData: { [key: string]: { name: string; orders: number; totalSpent: number; lastOrder: string; rating: number } } = {};

    orders.forEach(order => {
      if (!supplierData[order.supplierId]) {
        const supplier = this.getSuppliers().find(s => s.id === order.supplierId);
        supplierData[order.supplierId] = {
          name: order.supplierName,
          orders: 0,
          totalSpent: 0,
          lastOrder: order.date,
          rating: supplier?.rating || 4.0
        };
      }
      supplierData[order.supplierId].orders += 1;
      supplierData[order.supplierId].totalSpent += order.total;
      if (new Date(order.date) > new Date(supplierData[order.supplierId].lastOrder)) {
        supplierData[order.supplierId].lastOrder = order.date;
      }
    });

    return Object.values(supplierData)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);
  }

  private static groupProductsByCategory(products: Product[]) {
    const categoryData: { [key: string]: { total: number; value: number } } = {};

    products.forEach(product => {
      if (!categoryData[product.category]) {
        categoryData[product.category] = { total: 0, value: 0 };
      }
      categoryData[product.category].total += product.quantity;
      categoryData[product.category].value += product.quantity * product.cost;
    });

    return Object.entries(categoryData).map(([category, data]) => ({
      category,
      ...data
    }));
  }

  private static groupExpensesByCategory(expenses: Expense[]) {
    const categoryData: { [key: string]: number } = {};

    expenses.forEach(expense => {
      if (!categoryData[expense.category]) {
        categoryData[expense.category] = 0;
      }
      categoryData[expense.category] += expense.amount;
    });

    return Object.entries(categoryData).map(([category, amount]) => ({
      category,
      amount
    }));
  }

  private static groupExpensesByEmployee(expenses: Expense[]) {
    const employeeData: { [key: string]: { name: string; totalExpenses: number; expenseCount: number } } = {};

    expenses.filter(e => e.employeeId).forEach(expense => {
      if (!employeeData[expense.employeeId!]) {
        employeeData[expense.employeeId!] = {
          name: expense.employeeName!,
          totalExpenses: 0,
          expenseCount: 0
        };
      }
      employeeData[expense.employeeId!].totalExpenses += expense.amount;
      employeeData[expense.employeeId!].expenseCount += 1;
    });

    return Object.values(employeeData);
  }
}