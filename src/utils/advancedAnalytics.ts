import { LocalDataManager } from './localData';
import { storage } from './storage';

export interface PredictiveAnalytics {
  salesForecast: {
    nextMonthPrediction: number;
    confidence: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    seasonalPattern: any[];
  };
  inventoryPrediction: {
    lowStockAlerts: Array<{
      productId: string;
      productName: string;
      currentStock: number;
      daysUntilEmpty: number;
      suggestedReorder: number;
    }>;
    fastMovingItems: Array<{
      productId: string;
      productName: string;
      velocity: number;
      turnoverRate: number;
    }>;
  };
  customerInsights: {
    segmentation: Array<{
      segment: string;
      count: number;
      avgOrderValue: number;
      frequency: number;
    }>;
    churnRisk: Array<{
      customerId: string;
      customerName: string;
      riskScore: number;
      lastPurchase: string;
    }>;
  };
  financialProjections: {
    profitProjection: number;
    cashFlowForecast: Array<{
      period: string;
      projected: number;
      confidence: number;
    }>;
    breakEvenAnalysis: {
      breakEvenPoint: number;
      marginOfSafety: number;
    };
  };
}

export interface AdvancedMetrics {
  kpis: {
    salesGrowthRate: number;
    customerRetentionRate: number;
    inventoryTurnover: number;
    grossMarginTrend: number;
    operationalEfficiency: number;
  };
  trends: {
    salesTrend: Array<{
      period: string;
      value: number;
      change: number;
      changePercent: number;
    }>;
    profitTrend: Array<{
      period: string;
      value: number;
      margin: number;
    }>;
    customerTrend: Array<{
      period: string;
      newCustomers: number;
      returningCustomers: number;
      churnRate: number;
    }>;
  };
  benchmarks: {
    industryAverage: number;
    performanceRating: 'excellent' | 'good' | 'average' | 'below_average';
    improvementAreas: string[];
  };
}

export class AdvancedAnalyticsEngine {
  private static instance: AdvancedAnalyticsEngine;

  static getInstance(): AdvancedAnalyticsEngine {
    if (!AdvancedAnalyticsEngine.instance) {
      AdvancedAnalyticsEngine.instance = new AdvancedAnalyticsEngine();
    }
    return AdvancedAnalyticsEngine.instance;
  }

  // التحليلات التنبؤية
  generatePredictiveAnalytics(): PredictiveAnalytics {
    const salesData = this.getSalesHistoricalData();
    const inventoryData = LocalDataManager.getProducts();
    const customerData = this.getCustomerHistoricalData();

    return {
      salesForecast: this.predictSales(salesData),
      inventoryPrediction: this.predictInventoryNeeds(inventoryData),
      customerInsights: this.analyzeCustomerBehavior(customerData),
      financialProjections: this.projectFinancials(salesData)
    };
  }

  // المقاييس المتقدمة
  generateAdvancedMetrics(): AdvancedMetrics {
    const salesData = this.getSalesHistoricalData();
    const customerData = this.getCustomerHistoricalData();

    return {
      kpis: this.calculateKPIs(),
      trends: this.analyzeTrends(salesData, customerData),
      benchmarks: this.calculateBenchmarks()
    };
  }

  // تنبؤ المبيعات باستخدام خوارزميات متقدمة
  private predictSales(salesData: any[]): PredictiveAnalytics['salesForecast'] {
    if (salesData.length < 3) {
      return {
        nextMonthPrediction: 0,
        confidence: 0,
        trend: 'stable',
        seasonalPattern: []
      };
    }

    // حساب الاتجاه باستخدام الانحدار الخطي
    const trend = this.calculateLinearTrend(salesData);
    
    // تحليل النمط الموسمي
    const seasonalPattern = this.analyzeSeasonalPattern(salesData);
    
    // التنبؤ للشهر القادم
    const lastMonthValue = salesData[salesData.length - 1]?.total || 0;
    const trendAdjustment = trend.slope;
    const seasonalAdjustment = this.getSeasonalAdjustment(seasonalPattern);
    
    const nextMonthPrediction = lastMonthValue + trendAdjustment + seasonalAdjustment;
    const confidence = this.calculatePredictionConfidence(salesData);

    return {
      nextMonthPrediction: Math.max(0, nextMonthPrediction),
      confidence,
      trend: trend.slope > 0 ? 'increasing' : trend.slope < 0 ? 'decreasing' : 'stable',
      seasonalPattern
    };
  }

  // تنبؤ احتياجات المخزون
  private predictInventoryNeeds(products: any[]): PredictiveAnalytics['inventoryPrediction'] {
    const salesHistory = LocalDataManager.getSalesInvoices();
    
    const lowStockAlerts = products
      .filter(product => product.quantity <= product.minQuantity * 1.5)
      .map(product => {
        const velocity = this.calculateProductVelocity(product.id, salesHistory);
        const daysUntilEmpty = velocity > 0 ? Math.round(product.quantity / velocity) : 999;
        
        return {
          productId: product.id,
          productName: product.name,
          currentStock: product.quantity,
          daysUntilEmpty,
          suggestedReorder: Math.ceil(velocity * 30) // شهر واحد من المبيعات
        };
      })
      .sort((a, b) => a.daysUntilEmpty - b.daysUntilEmpty);

    const fastMovingItems = products
      .map(product => {
        const velocity = this.calculateProductVelocity(product.id, salesHistory);
        const turnoverRate = velocity > 0 ? (velocity * 365) / product.quantity : 0;
        
        return {
          productId: product.id,
          productName: product.name,
          velocity,
          turnoverRate
        };
      })
      .filter(item => item.velocity > 0)
      .sort((a, b) => b.velocity - a.velocity)
      .slice(0, 10);

    return {
      lowStockAlerts,
      fastMovingItems
    };
  }

  // تحليل سلوك العملاء
  private analyzeCustomerBehavior(customerData: any[]): PredictiveAnalytics['customerInsights'] {
    const customers = LocalDataManager.getCustomers();
    const salesHistory = LocalDataManager.getSalesInvoices();

    // تقسيم العملاء
    const segmentation = this.segmentCustomers(customers, salesHistory);
    
    // تحديد العملاء المعرضين لخطر المغادرة
    const churnRisk = this.calculateChurnRisk(customers, salesHistory);

    return {
      segmentation,
      churnRisk
    };
  }

  // توقعات مالية
  private projectFinancials(salesData: any[]): PredictiveAnalytics['financialProjections'] {
    const expenses = LocalDataManager.getExpenses();
    const purchaseOrders = LocalDataManager.getPurchaseOrders();

    // حساب معدل الربح
    const avgProfitMargin = this.calculateAverageProfitMargin(salesData, purchaseOrders, expenses);
    
    // توقع الربح للشهر القادم
    const salesForecast = this.predictSales(salesData);
    const profitProjection = salesForecast.nextMonthPrediction * (avgProfitMargin / 100);

    // توقع التدفق النقدي
    const cashFlowForecast = this.projectCashFlow(salesData, expenses);

    // تحليل نقطة التعادل
    const breakEvenAnalysis = this.calculateBreakEvenAnalysis(salesData, expenses);

    return {
      profitProjection,
      cashFlowForecast,
      breakEvenAnalysis
    };
  }

  // حساب KPIs
  private calculateKPIs(): AdvancedMetrics['kpis'] {
    const currentMonth = new Date();
    const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    const twoMonthsAgo = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 2, 1);

    const currentSales = this.getSalesForPeriod(lastMonth, currentMonth);
    const previousSales = this.getSalesForPeriod(twoMonthsAgo, lastMonth);
    
    const salesGrowthRate = previousSales > 0 ? 
      ((currentSales - previousSales) / previousSales) * 100 : 0;

    const customerRetentionRate = this.calculateCustomerRetentionRate();
    const inventoryTurnover = this.calculateInventoryTurnover();
    const grossMarginTrend = this.calculateGrossMarginTrend();
    const operationalEfficiency = this.calculateOperationalEfficiency();

    return {
      salesGrowthRate,
      customerRetentionRate,
      inventoryTurnover,
      grossMarginTrend,
      operationalEfficiency
    };
  }

  // تحليل الاتجاهات
  private analyzeTrends(salesData: any[], customerData: any[]): AdvancedMetrics['trends'] {
    const salesTrend = this.calculateSalesTrend();
    const profitTrend = this.calculateProfitTrend();
    const customerTrend = this.calculateCustomerTrend();

    return {
      salesTrend,
      profitTrend,
      customerTrend
    };
  }

  // حساب المقاييس المرجعية
  private calculateBenchmarks(): AdvancedMetrics['benchmarks'] {
    const efficiency = this.calculateOperationalEfficiency();
    const profitMargin = this.calculateAverageProfitMargin([], [], []);

    let performanceRating: 'excellent' | 'good' | 'average' | 'below_average';
    if (efficiency >= 90) performanceRating = 'excellent';
    else if (efficiency >= 75) performanceRating = 'good';
    else if (efficiency >= 60) performanceRating = 'average';
    else performanceRating = 'below_average';

    const improvementAreas = [];
    if (efficiency < 80) improvementAreas.push('تحسين الكفاءة التشغيلية');
    if (profitMargin < 20) improvementAreas.push('زيادة هامش الربح');

    return {
      industryAverage: 75, // متوسط الصناعة
      performanceRating,
      improvementAreas
    };
  }

  // وظائف مساعدة
  private getSalesHistoricalData(): any[] {
    const invoices = LocalDataManager.getSalesInvoices();
    const monthlyData: { [key: string]: { total: number, count: number } } = {};

    invoices.forEach(invoice => {
      const date = new Date(invoice.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { total: 0, count: 0 };
      }
      
      monthlyData[monthKey].total += invoice.total;
      monthlyData[monthKey].count += 1;
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      total: data.total,
      count: data.count
    })).sort((a, b) => a.month.localeCompare(b.month));
  }

  private getCustomerHistoricalData(): any[] {
    const customers = LocalDataManager.getCustomers();
    const invoices = LocalDataManager.getSalesInvoices();

    return customers.map(customer => {
      const customerInvoices = invoices.filter(inv => inv.customerId === customer.id);
      const totalSpent = customerInvoices.reduce((sum, inv) => sum + inv.total, 0);
      const avgOrderValue = customerInvoices.length > 0 ? totalSpent / customerInvoices.length : 0;
      const lastPurchase = customerInvoices.length > 0 ? 
        new Date(Math.max(...customerInvoices.map(inv => new Date(inv.date).getTime()))) : null;

      return {
        ...customer,
        totalSpent,
        avgOrderValue,
        orderCount: customerInvoices.length,
        lastPurchase
      };
    });
  }

  private calculateLinearTrend(data: any[]): { slope: number, intercept: number } {
    if (data.length < 2) return { slope: 0, intercept: 0 };

    const n = data.length;
    const sumX = data.reduce((sum, _, i) => sum + i, 0);
    const sumY = data.reduce((sum, item) => sum + item.total, 0);
    const sumXY = data.reduce((sum, item, i) => sum + (i * item.total), 0);
    const sumXX = data.reduce((sum, _, i) => sum + (i * i), 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  private analyzeSeasonalPattern(data: any[]): any[] {
    // تحليل بسيط للنمط الموسمي
    const monthlyPattern: { [month: number]: number[] } = {};
    
    data.forEach(item => {
      const month = new Date(item.month + '-01').getMonth();
      if (!monthlyPattern[month]) monthlyPattern[month] = [];
      monthlyPattern[month].push(item.total);
    });

    return Object.entries(monthlyPattern).map(([month, values]) => ({
      month: parseInt(month),
      average: values.reduce((sum, val) => sum + val, 0) / values.length,
      variance: this.calculateVariance(values)
    }));
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }

  private getSeasonalAdjustment(pattern: any[]): number {
    if (pattern.length === 0) return 0;
    const currentMonth = new Date().getMonth();
    const monthPattern = pattern.find(p => p.month === currentMonth);
    return monthPattern ? monthPattern.average * 0.1 : 0; // تعديل بسيط 10%
  }

  private calculatePredictionConfidence(data: any[]): number {
    if (data.length < 3) return 50;
    
    // حساب الثقة بناءً على استقرار البيانات
    const values = data.map(d => d.total);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = this.calculateVariance(values);
    const coefficientOfVariation = mean > 0 ? (Math.sqrt(variance) / mean) : 1;
    
    // كلما قل معامل التباين، زادت الثقة
    return Math.max(50, Math.min(95, 100 - (coefficientOfVariation * 50)));
  }

  private calculateProductVelocity(productId: string, salesHistory: any[]): number {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const recentSales = salesHistory
      .filter(invoice => new Date(invoice.date) >= last30Days)
      .reduce((total, invoice) => {
        const productSales = invoice.items
          .filter((item: any) => item.productId === productId)
          .reduce((sum: number, item: any) => sum + item.quantity, 0);
        return total + productSales;
      }, 0);

    return recentSales / 30; // متوسط المبيعات اليومية
  }

  private segmentCustomers(customers: any[], salesHistory: any[]): any[] {
    const customerStats = customers.map(customer => {
      const customerInvoices = salesHistory.filter(inv => inv.customerId === customer.id);
      const totalSpent = customerInvoices.reduce((sum, inv) => sum + inv.total, 0);
      const frequency = customerInvoices.length;
      const avgOrderValue = frequency > 0 ? totalSpent / frequency : 0;

      let segment = 'منخفض القيمة';
      if (totalSpent > 10000 && frequency > 5) segment = 'عالي القيمة';
      else if (totalSpent > 5000 || frequency > 3) segment = 'متوسط القيمة';

      return { customer, segment, totalSpent, frequency, avgOrderValue };
    });

    // تجميع النتائج حسب الشريحة
    const segments: { [key: string]: any } = {};
    customerStats.forEach(stat => {
      if (!segments[stat.segment]) {
        segments[stat.segment] = {
          segment: stat.segment,
          count: 0,
          totalSpent: 0,
          totalFrequency: 0
        };
      }
      segments[stat.segment].count++;
      segments[stat.segment].totalSpent += stat.totalSpent;
      segments[stat.segment].totalFrequency += stat.frequency;
    });

    return Object.values(segments).map((seg: any) => ({
      segment: seg.segment,
      count: seg.count,
      avgOrderValue: seg.count > 0 ? seg.totalSpent / seg.totalFrequency : 0,
      frequency: seg.count > 0 ? seg.totalFrequency / seg.count : 0
    }));
  }

  private calculateChurnRisk(customers: any[], salesHistory: any[]): any[] {
    const now = new Date();
    
    return customers.map(customer => {
      const customerInvoices = salesHistory.filter(inv => inv.customerId === customer.id);
      
      if (customerInvoices.length === 0) {
        return {
          customerId: customer.id,
          customerName: customer.name,
          riskScore: 100,
          lastPurchase: 'لم يشتري مطلقاً'
        };
      }

      const lastPurchaseDate = new Date(Math.max(...customerInvoices.map(inv => new Date(inv.date).getTime())));
      const daysSinceLastPurchase = Math.floor((now.getTime() - lastPurchaseDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // حساب درجة المخاطرة بناءً على آخر شراء وتكرار الشراء
      const frequency = customerInvoices.length;
      const avgDaysBetweenPurchases = frequency > 1 ? daysSinceLastPurchase / frequency : daysSinceLastPurchase;
      
      let riskScore = Math.min(100, (daysSinceLastPurchase / avgDaysBetweenPurchases) * 25);
      if (daysSinceLastPurchase > 90) riskScore = Math.max(riskScore, 75);
      if (daysSinceLastPurchase > 180) riskScore = 100;

      return {
        customerId: customer.id,
        customerName: customer.name,
        riskScore: Math.round(riskScore),
        lastPurchase: lastPurchaseDate.toLocaleDateString('ar-EG')
      };
    })
    .filter(customer => customer.riskScore > 50)
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 10);
  }

  private calculateAverageProfitMargin(salesData: any[], purchaseOrders: any[], expenses: any[]): number {
    const sales = LocalDataManager.getSalesInvoices();
    const purchases = LocalDataManager.getPurchaseOrders();
    const allExpenses = LocalDataManager.getExpenses();

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalCosts = purchases.reduce((sum, purchase) => sum + purchase.total, 0);
    const totalExpenses = allExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    const grossProfit = totalRevenue - totalCosts - totalExpenses;
    return totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  }

  private projectCashFlow(salesData: any[], expenses: any[]): any[] {
    const nextThreeMonths = [];
    const currentDate = new Date();

    for (let i = 1; i <= 3; i++) {
      const projectionMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const salesForecast = this.predictSales(salesData);
      const avgExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0) / 12; // متوسط شهري

      nextThreeMonths.push({
        period: projectionMonth.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' }),
        projected: salesForecast.nextMonthPrediction - avgExpenses,
        confidence: salesForecast.confidence
      });
    }

    return nextThreeMonths;
  }

  private calculateBreakEvenAnalysis(salesData: any[], expenses: any[]): any {
    const avgMonthlySales = salesData.reduce((sum, data) => sum + data.total, 0) / Math.max(salesData.length, 1);
    const avgMonthlyExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0) / 12;
    
    const breakEvenPoint = avgMonthlyExpenses;
    const marginOfSafety = avgMonthlySales > 0 ? ((avgMonthlySales - breakEvenPoint) / avgMonthlySales) * 100 : 0;

    return {
      breakEvenPoint,
      marginOfSafety
    };
  }

  private getSalesForPeriod(startDate: Date, endDate: Date): number {
    const invoices = LocalDataManager.getSalesInvoices();
    return invoices
      .filter(inv => {
        const invDate = new Date(inv.date);
        return invDate >= startDate && invDate < endDate;
      })
      .reduce((sum, inv) => sum + inv.total, 0);
  }

  private calculateCustomerRetentionRate(): number {
    const customers = LocalDataManager.getCustomers();
    const invoices = LocalDataManager.getSalesInvoices();
    
    const currentMonth = new Date();
    const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    const twoMonthsAgo = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 2, 1);

    const customersLastMonth = new Set(
      invoices
        .filter(inv => {
          const invDate = new Date(inv.date);
          return invDate >= twoMonthsAgo && invDate < lastMonth;
        })
        .map(inv => inv.customerId)
    );

    const customersThisMonth = new Set(
      invoices
        .filter(inv => {
          const invDate = new Date(inv.date);
          return invDate >= lastMonth && invDate < currentMonth;
        })
        .map(inv => inv.customerId)
    );

    const retainedCustomers = Array.from(customersLastMonth).filter(id => customersThisMonth.has(id));
    return customersLastMonth.size > 0 ? (retainedCustomers.length / customersLastMonth.size) * 100 : 0;
  }

  private calculateInventoryTurnover(): number {
    const products = LocalDataManager.getProducts();
    const salesHistory = LocalDataManager.getSalesInvoices();
    
    // حساب تكلفة البضائع المباعة (COGS)
    const cogs = salesHistory.reduce((total, invoice) => {
      return total + invoice.items.reduce((sum, item) => {
        const product = products.find(p => p.id === item.productId);
        return sum + (product ? product.cost * item.quantity : 0);
      }, 0);
    }, 0);

    // حساب متوسط قيمة المخزون
    const avgInventoryValue = products.reduce((sum, product) => sum + (product.quantity * product.cost), 0);
    
    return avgInventoryValue > 0 ? cogs / avgInventoryValue : 0;
  }

  private calculateGrossMarginTrend(): number {
    const salesData = this.getSalesHistoricalData();
    if (salesData.length < 2) return 0;

    const recent = salesData.slice(-2);
    const currentMargin = this.calculateAverageProfitMargin([], [], []);
    
    // هذا تبسيط - في التطبيق الحقيقي نحتاج بيانات أكثر تفصيلاً
    return currentMargin;
  }

  private calculateOperationalEfficiency(): number {
    const products = LocalDataManager.getProducts();
    const invoices = LocalDataManager.getSalesInvoices();
    const expenses = LocalDataManager.getExpenses();

    // مقياس بسيط للكفاءة التشغيلية
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const inventoryValue = products.reduce((sum, product) => sum + (product.quantity * product.cost), 0);

    const efficiency = totalRevenue > 0 ? 
      ((totalRevenue - totalExpenses) / (totalRevenue + inventoryValue)) * 100 : 0;

    return Math.max(0, Math.min(100, efficiency));
  }

  private calculateSalesTrend(): any[] {
    const salesData = this.getSalesHistoricalData();
    
    return salesData.map((current, index) => {
      const previous = index > 0 ? salesData[index - 1] : null;
      const change = previous ? current.total - previous.total : 0;
      const changePercent = previous && previous.total > 0 ? (change / previous.total) * 100 : 0;

      return {
        period: current.month,
        value: current.total,
        change,
        changePercent
      };
    });
  }

  private calculateProfitTrend(): any[] {
    const salesData = this.getSalesHistoricalData();
    const avgMargin = this.calculateAverageProfitMargin([], [], []);

    return salesData.map(data => ({
      period: data.month,
      value: data.total * (avgMargin / 100),
      margin: avgMargin
    }));
  }

  private calculateCustomerTrend(): any[] {
    const invoices = LocalDataManager.getSalesInvoices();
    const monthlyCustomers: { [key: string]: Set<string> } = {};

    invoices.forEach(invoice => {
      const date = new Date(invoice.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyCustomers[monthKey]) {
        monthlyCustomers[monthKey] = new Set();
      }
      monthlyCustomers[monthKey].add(invoice.customerId);
    });

    return Object.entries(monthlyCustomers).map(([month, customers]) => ({
      period: month,
      newCustomers: customers.size, // تبسيط - في الواقع نحتاج تتبع العملاء الجدد
      returningCustomers: 0, // يحتاج حساب أكثر تعقيداً
      churnRate: 0 // يحتاج حساب أكثر تعقيداً
    }));
  }
}

export const advancedAnalytics = AdvancedAnalyticsEngine.getInstance();