/**
 * مدير التقارير الموحد - ربط جميع التقارير بالبيانات الحقيقية
 */

import { inventoryManager } from './inventoryUtils';
import { businessIntegration } from './businessIntegration';
import { cashFlowManager } from './cashFlowManager';

export class UnifiedReportingManager {
  private static instance: UnifiedReportingManager;

  static getInstance(): UnifiedReportingManager {
    if (!UnifiedReportingManager.instance) {
      UnifiedReportingManager.instance = new UnifiedReportingManager();
    }
    return UnifiedReportingManager.instance;
  }

  /**
   * تقرير المبيعات - مربوط بالمبيعات الحقيقية
   */
  getSalesReportData() {
    try {
      const salesInvoices = JSON.parse(localStorage.getItem('sales_invoices') || '[]');
      const customers = JSON.parse(localStorage.getItem('customers') || '[]');
      
      // حساب إجمالي المبيعات
      const totalSales = salesInvoices.reduce((sum: number, invoice: any) => {
        return sum + (invoice.total || 0);
      }, 0);
      
      const totalOrders = salesInvoices.length;
      const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
      
      // تجميع المبيعات حسب الشهر
      const monthlyData: { [key: string]: { revenue: number, orders: number } } = {};
      const dailyData: { [key: string]: number } = {};
      
      salesInvoices.forEach((invoice: any) => {
        if (invoice.date) {
          const date = new Date(invoice.date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const dayKey = date.toLocaleDateString('ar-EG', { weekday: 'long' });
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { revenue: 0, orders: 0 };
          }
          monthlyData[monthKey].revenue += invoice.total || 0;
          monthlyData[monthKey].orders += 1;
          
          dailyData[dayKey] = (dailyData[dayKey] || 0) + (invoice.total || 0);
        }
      });
      
      // تحويل البيانات الشهرية
      const monthlySales = Object.entries(monthlyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([month, data]) => ({
          month: new Date(month + '-01').toLocaleDateString('ar-EG', { month: 'short', year: 'numeric' }),
          revenue: data.revenue,
          orders: data.orders
        }));
      
      // تحويل البيانات اليومية
      const dailySales = Object.entries(dailyData).map(([day, sales]) => ({
        day,
        sales
      }));
      
      // أفضل العملاء
      const topCustomers = this.getTopCustomers(salesInvoices);
      
      // أفضل المنتجات
      const topProducts = this.getTopProducts(salesInvoices);
      
      return {
        totalSales,
        totalRevenue: totalSales,
        totalOrders,
        avgOrderValue,
        monthlySales,
        dailySales,
        topCustomers,
        topProducts
      };
    } catch (error) {
      console.error('خطأ في تحميل بيانات المبيعات:', error);
      return this.getEmptySalesData();
    }
  }

  /**
   * تقرير المشتريات - مربوط بالمشتريات الحقيقية
   */
  getPurchasesReportData() {
    try {
      const purchaseInvoices = JSON.parse(localStorage.getItem('purchase_invoices') || '[]');
      const suppliers = JSON.parse(localStorage.getItem('suppliers') || '[]');
      
      const totalPurchases = purchaseInvoices.length;
      const totalCost = purchaseInvoices.reduce((sum: number, invoice: any) => {
        return sum + (invoice.total || 0);
      }, 0);
      
      const totalOrders = purchaseInvoices.length;
      const avgOrderValue = totalOrders > 0 ? totalCost / totalOrders : 0;
      
      // تجميع البيانات الشهرية
      const monthlyData = this.getMonthlyPurchasesData(purchaseInvoices);
      
      // أفضل الموردين
      const topSuppliers = this.getTopSuppliers(purchaseInvoices);
      
      return {
        totalPurchases,
        totalCost,
        totalOrders,
        avgOrderValue,
        monthlyData,
        topSuppliers
      };
    } catch (error) {
      console.error('خطأ في تحميل بيانات المشتريات:', error);
      return this.getEmptyPurchasesData();
    }
  }

  /**
   * تقرير المخزون - مربوط بالمخزون الحقيقي
   */
  getInventoryReportData() {
    try {
      const products = inventoryManager.getProducts();
      const movements = inventoryManager.getMovements();
      const lowStockProducts = inventoryManager.getLowStockProducts();
      const outOfStockProducts = inventoryManager.getOutOfStockProducts();
      
      const totalProducts = products.length;
      const totalValue = products.reduce((sum, product) => sum + (product.stock * product.cost), 0);
      const lowStockItems = lowStockProducts.length;
      const outOfStockItems = outOfStockProducts.length;
      
      // تجميع البيانات حسب الفئة
      const categoryData = this.getCategoryData(products);
      
      // بيانات حركة المخزون
      const movementData = this.getMovementData(movements);
      
      return {
        totalProducts,
        totalValue,
        lowStockItems,
        outOfStockItems,
        categoryData,
        lowStockProducts,
        movementData,
        products
      };
    } catch (error) {
      console.error('خطأ في تحميل بيانات المخزون:', error);
      return this.getEmptyInventoryData();
    }
  }

  /**
   * تقرير الأرباح - مربوط بالمبيعات والمشتريات والمخزون
   */
  getProfitReportData() {
    try {
      const salesInvoices = JSON.parse(localStorage.getItem('sales_invoices') || '[]');
      const purchaseInvoices = JSON.parse(localStorage.getItem('purchase_invoices') || '[]');
      const products = inventoryManager.getProducts();
      
      // حساب الإيرادات من المبيعات المدفوعة
      const totalRevenue = salesInvoices
        .filter((invoice: any) => invoice.paymentStatus === 'paid')
        .reduce((sum: number, invoice: any) => sum + (invoice.total || 0), 0);
      
      // حساب تكلفة البضاعة المباعة الفعلية
      const cogsSales = salesInvoices
        .filter((invoice: any) => invoice.paymentStatus === 'paid')
        .reduce((sum: number, invoice: any) => {
          if (Array.isArray(invoice.itemsDetails)) {
            return sum + invoice.itemsDetails.reduce((itemSum: number, item: any) => {
              return itemSum + ((item.cost || 0) * (item.quantity || 0));
            }, 0);
          }
          return sum;
        }, 0);
      
      // حساب إجمالي تكاليف المشتريات
      const totalPurchaseCosts = purchaseInvoices
        .filter((purchase: any) => purchase.status === 'paid')
        .reduce((sum: number, purchase: any) => sum + (purchase.total || 0), 0);
      
      const netProfit = totalRevenue - cogsSales;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
      
      // البيانات الشهرية للأرباح
      const monthlyData = this.getMonthlyProfitData(salesInvoices, purchaseInvoices);
      
      // الأرباح حسب الفئة
      const categoryData = this.getProfitByCategory(salesInvoices, products);
      
      // أفضل المنتجات ربحاً
      const topProductsData = this.getTopProfitableProducts(salesInvoices, products);
      
      return {
        totalRevenue,
        totalCosts: cogsSales,
        totalPurchaseCosts,
        netProfit,
        profitMargin,
        monthlyData,
        categoryData,
        topProductsData
      };
    } catch (error) {
      console.error('خطأ في تحميل بيانات الأرباح:', error);
      return this.getEmptyProfitData();
    }
  }

  // Helper methods
  private getTopCustomers(salesInvoices: any[]) {
    const customerData: { [key: string]: { orders: number, totalSpent: number, lastOrder: string } } = {};
    
    salesInvoices.forEach((invoice: any) => {
      const customerName = invoice.customerName || 'عميل غير محدد';
      if (!customerData[customerName]) {
        customerData[customerName] = { orders: 0, totalSpent: 0, lastOrder: invoice.date };
      }
      customerData[customerName].orders++;
      customerData[customerName].totalSpent += invoice.total || 0;
      if (new Date(invoice.date) > new Date(customerData[customerName].lastOrder)) {
        customerData[customerName].lastOrder = invoice.date;
      }
    });
    
    return Object.entries(customerData)
      .sort(([,a], [,b]) => b.totalSpent - a.totalSpent)
      .slice(0, 10)
      .map(([name, data]) => ({
        name,
        orders: data.orders,
        totalSpent: data.totalSpent,
        lastOrder: data.lastOrder
      }));
  }

  private getTopProducts(salesInvoices: any[]) {
    const productData: { [key: string]: { quantity: number, revenue: number } } = {};
    
    salesInvoices.forEach((invoice: any) => {
      if (Array.isArray(invoice.itemsDetails)) {
        invoice.itemsDetails.forEach((item: any) => {
          const productName = item.productName || 'منتج غير محدد';
          if (!productData[productName]) {
            productData[productName] = { quantity: 0, revenue: 0 };
          }
          productData[productName].quantity += item.quantity || 0;
          productData[productName].revenue += (item.price * item.quantity) || 0;
        });
      }
    });
    
    return Object.entries(productData)
      .sort(([,a], [,b]) => b.revenue - a.revenue)
      .slice(0, 10)
      .map(([name, data]) => ({
        name,
        quantity: data.quantity,
        revenue: data.revenue
      }));
  }

  private getTopSuppliers(purchaseInvoices: any[]) {
    const supplierData: { [key: string]: { orders: number, totalSpent: number, lastOrder: string, rating: number } } = {};
    
    purchaseInvoices.forEach((invoice: any) => {
      const supplierName = invoice.supplierName || 'مورد غير محدد';
      if (!supplierData[supplierName]) {
        supplierData[supplierName] = { orders: 0, totalSpent: 0, lastOrder: invoice.date, rating: 4.5 };
      }
      supplierData[supplierName].orders++;
      supplierData[supplierName].totalSpent += invoice.total || 0;
      if (new Date(invoice.date) > new Date(supplierData[supplierName].lastOrder)) {
        supplierData[supplierName].lastOrder = invoice.date;
      }
    });
    
    return Object.entries(supplierData)
      .sort(([,a], [,b]) => b.totalSpent - a.totalSpent)
      .slice(0, 10)
      .map(([name, data]) => ({
        name,
        orders: data.orders,
        totalSpent: data.totalSpent,
        lastOrder: data.lastOrder,
        rating: data.rating
      }));
  }

  private getMonthlyPurchasesData(purchaseInvoices: any[]) {
    const monthlyData: { [key: string]: { purchases: number, cost: number, orders: number } } = {};
    
    purchaseInvoices.forEach((invoice: any) => {
      if (invoice.date) {
        const date = new Date(invoice.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { purchases: 0, cost: 0, orders: 0 };
        }
        
        monthlyData[monthKey].purchases += 1;
        monthlyData[monthKey].cost += invoice.total || 0;
        monthlyData[monthKey].orders += 1;
      }
    });
    
    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('ar-EG', { month: 'short', year: 'numeric' }),
        purchases: data.purchases,
        cost: data.cost,
        orders: data.orders
      }));
  }

  private getCategoryData(products: any[]) {
    const categoryData: { [key: string]: { total: number, value: number } } = {};
    
    products.forEach(product => {
      const category = product.category || 'غير محدد';
      if (!categoryData[category]) {
        categoryData[category] = { total: 0, value: 0 };
      }
      categoryData[category].total += 1;
      categoryData[category].value += product.stock * product.cost;
    });
    
    return Object.entries(categoryData).map(([category, data]) => ({
      category,
      total: data.total,
      value: data.value
    }));
  }

  private getMovementData(movements: any[]) {
    const monthlyMovements: { [key: string]: { inbound: number, outbound: number } } = {};
    
    movements.forEach(movement => {
      if (movement.date) {
        const date = new Date(movement.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyMovements[monthKey]) {
          monthlyMovements[monthKey] = { inbound: 0, outbound: 0 };
        }
        
        if (movement.type === 'in') {
          monthlyMovements[monthKey].inbound += movement.quantity;
        } else if (movement.type === 'out') {
          monthlyMovements[monthKey].outbound += movement.quantity;
        }
      }
    });
    
    return Object.entries(monthlyMovements)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => ({
        date: new Date(month + '-01').toLocaleDateString('ar-EG', { month: 'short', year: 'numeric' }),
        inbound: data.inbound,
        outbound: data.outbound,
        net: data.inbound - data.outbound
      }));
  }

  private getMonthlyProfitData(salesInvoices: any[], purchaseInvoices: any[]) {
    const monthlyData: { [key: string]: { revenue: number, costs: number, profit: number } } = {};
    
    // معالجة المبيعات
    salesInvoices
      .filter((invoice: any) => invoice.paymentStatus === 'paid')
      .forEach((invoice: any) => {
        if (invoice.date) {
          const date = new Date(invoice.date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { revenue: 0, costs: 0, profit: 0 };
          }
          
          monthlyData[monthKey].revenue += invoice.total || 0;
          
          // حساب تكلفة البضاعة المباعة
          if (Array.isArray(invoice.itemsDetails)) {
            const itemCosts = invoice.itemsDetails.reduce((sum: number, item: any) => {
              return sum + ((item.cost || 0) * (item.quantity || 0));
            }, 0);
            monthlyData[monthKey].costs += itemCosts;
          }
        }
      });
    
    // حساب الربح لكل شهر
    Object.keys(monthlyData).forEach(month => {
      monthlyData[month].profit = monthlyData[month].revenue - monthlyData[month].costs;
    });
    
    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('ar-EG', { month: 'short', year: 'numeric' }),
        revenue: data.revenue,
        costs: data.costs,
        profit: data.profit
      }));
  }

  private getProfitByCategory(salesInvoices: any[], products: any[]) {
    const categoryProfit: { [key: string]: number } = {};
    
    salesInvoices
      .filter((invoice: any) => invoice.paymentStatus === 'paid')
      .forEach((invoice: any) => {
        if (Array.isArray(invoice.itemsDetails)) {
          invoice.itemsDetails.forEach((item: any) => {
            if (item.productName) {
              const product = products.find(p => p.name === item.productName);
              const category = product?.category || 'غير محدد';
              const profit = ((item.price || 0) - (item.cost || 0)) * (item.quantity || 0);
              
              categoryProfit[category] = (categoryProfit[category] || 0) + profit;
            }
          });
        }
      });
    
    return Object.entries(categoryProfit).map(([category, profit]) => ({
      category,
      profit
    }));
  }

  private getTopProfitableProducts(salesInvoices: any[], products: any[]) {
    const productProfit: { [key: string]: { revenue: number, cost: number, profit: number, quantity: number } } = {};
    
    salesInvoices
      .filter((invoice: any) => invoice.paymentStatus === 'paid')
      .forEach((invoice: any) => {
        if (Array.isArray(invoice.itemsDetails)) {
          invoice.itemsDetails.forEach((item: any) => {
            if (item.productName) {
              const productName = item.productName;
              if (!productProfit[productName]) {
                productProfit[productName] = { revenue: 0, cost: 0, profit: 0, quantity: 0 };
              }
              
              const revenue = (item.price || 0) * (item.quantity || 0);
              const cost = (item.cost || 0) * (item.quantity || 0);
              
              productProfit[productName].revenue += revenue;
              productProfit[productName].cost += cost;
              productProfit[productName].profit += revenue - cost;
              productProfit[productName].quantity += item.quantity || 0;
            }
          });
        }
      });
    
    return Object.entries(productProfit)
      .sort(([,a], [,b]) => b.profit - a.profit)
      .slice(0, 10)
      .map(([name, data]) => ({
        name,
        revenue: data.revenue,
        cost: data.cost,
        profit: data.profit,
        quantity: data.quantity,
        margin: data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0
      }));
  }

  // Empty data fallbacks
  private getEmptySalesData() {
    return {
      totalSales: 0,
      totalRevenue: 0,
      totalOrders: 0,
      avgOrderValue: 0,
      monthlySales: [],
      dailySales: [],
      topCustomers: [],
      topProducts: []
    };
  }

  private getEmptyPurchasesData() {
    return {
      totalPurchases: 0,
      totalCost: 0,
      totalOrders: 0,
      avgOrderValue: 0,
      monthlyData: [],
      topSuppliers: []
    };
  }

  private getEmptyInventoryData() {
    return {
      totalProducts: 0,
      totalValue: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
      categoryData: [],
      lowStockProducts: [],
      movementData: [],
      products: []
    };
  }

  private getEmptyProfitData() {
    return {
      totalRevenue: 0,
      totalCosts: 0,
      totalPurchaseCosts: 0,
      netProfit: 0,
      profitMargin: 0,
      monthlyData: [],
      categoryData: [],
      topProductsData: []
    };
  }
}

export const unifiedReportingManager = UnifiedReportingManager.getInstance();