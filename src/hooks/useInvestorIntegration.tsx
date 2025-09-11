import { useState, useEffect, useMemo } from 'react';
import { useInvestor } from '@/contexts/InvestorContext';
import { storage } from '@/utils/storage';
import { businessIntegration } from '@/utils/businessIntegration';
import { inventoryManager } from '@/utils/inventoryUtils';

export interface IntegratedInvestorData {
  investor: any;
  purchases: any[];
  sales: any[];
  inventory: any[];
  totalInvestment: number;
  totalSpent: number;
  totalSales: number;
  totalProfit: number;
  currentStockValue: number;
  profitMargin: number;
  roi: number;
}

export function useInvestorIntegration() {
  const { investors, purchases, sales, getInvestorReport } = useInvestor();
  const [integratedData, setIntegratedData] = useState<IntegratedInvestorData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ربط بيانات المشتريات العامة
  const [generalPurchases, setGeneralPurchases] = useState([]);
  const [generalSales, setGeneralSales] = useState([]);
  const [generalInventory, setGeneralInventory] = useState([]);

  useEffect(() => {
    loadGeneralData();
  }, []);

  useEffect(() => {
    if (investors.length > 0) {
      integrateInvestorData();
    }
  }, [investors, purchases, sales, generalPurchases, generalSales]);

  const loadGeneralData = () => {
    try {
      // ربط مع بيانات المشتريات العامة
      const purchaseInvoices = storage.getItem('purchase_invoices', []);
      const salesInvoices = storage.getItem('invoices', []);
      const products = inventoryManager.getProducts();

      setGeneralPurchases(purchaseInvoices);
      setGeneralSales(salesInvoices);
      setGeneralInventory(products);
    } catch (error) {
      console.error('خطأ في تحميل البيانات العامة:', error);
    }
  };

  const integrateInvestorData = () => {
    setIsLoading(true);
    
    const integrated = investors.map(investor => {
      const report = getInvestorReport(investor.id);
      const investorPurchases = purchases.filter(p => p.investorId === investor.id);
      const investorSales = sales.filter(s => s.investorId === investor.id);
      
      // ربط مع المخزون
      const investorInventory = generalInventory.filter(product => 
        product.ownerId === investor.id && product.ownerType === 'investor'
      );

      // حساب المقاييس المتقدمة
      const totalSalesValue = investorSales.reduce((sum, sale) => 
        sum + (sale.quantitySold * sale.sellingPrice), 0
      );
      
      const totalCosts = investorPurchases.reduce((sum, purchase) => 
        sum + purchase.totalCost, 0
      );

      const profitMargin = totalSalesValue > 0 ? (report.totalProfit / totalSalesValue) * 100 : 0;
      const roi = investor.investedAmount > 0 ? (report.totalProfit / investor.investedAmount) * 100 : 0;

      return {
        investor,
        purchases: investorPurchases,
        sales: investorSales,
        inventory: investorInventory,
        totalInvestment: investor.investedAmount,
        totalSpent: report.totalSpent,
        totalSales: report.totalSales,
        totalProfit: report.totalProfit,
        currentStockValue: inventoryManager.calculateInvestorStockValue(investor.id),
        profitMargin,
        roi
      };
    });

    setIntegratedData(integrated);
    setIsLoading(false);
  };

  // دوال الربط مع الأنظمة الأخرى
  const linkInvestorToPurchase = (investorId: string, purchaseId: string) => {
    try {
      // ربط المستثمر بفاتورة شراء موجودة
      const purchaseInvoices = storage.getItem('purchase_invoices', []);
      const invoice = purchaseInvoices.find((inv: any) => inv.id === purchaseId);
      
      if (!invoice) return false;
      
      // تحديث الفاتورة لتشمل معرف المستثمر
      invoice.investorId = investorId;
      invoice.ownerType = 'investor';
      
      storage.setItem('purchase_invoices', purchaseInvoices);
      
      // إضافة حركة مخزون للمستثمر
      if (invoice.items && Array.isArray(invoice.items)) {
        for (const item of invoice.items) {
          inventoryManager.addInvestorPurchaseMovement(
            item.productId,
            item.quantity,
            item.total,
            investorId,
            purchaseId
          );
        }
      }
      
      return true;
    } catch (error) {
      console.error('خطأ في ربط المستثمر بالمشترى:', error);
      return false;
    }
  };

  const linkInvestorToSale = (investorId: string, saleId: string) => {
    try {
      // ربط المستثمر بفاتورة بيع موجودة
      const salesInvoices = storage.getItem('invoices', []);
      const invoice = salesInvoices.find((inv: any) => inv.id === saleId);
      
      if (!invoice) return false;
      
      // تحديث الفاتورة لتشمل معرف المستثمر
      invoice.investorId = investorId;
      invoice.ownerType = 'investor';
      
      storage.setItem('invoices', salesInvoices);
      
      // إضافة حركة مخزون للمستثمر
      if (invoice.itemsDetails && Array.isArray(invoice.itemsDetails)) {
        for (const item of invoice.itemsDetails) {
          inventoryManager.addInvestorSaleMovement(
            item.productId || item.id,
            item.quantity,
            item.total,
            investorId,
            saleId
          );
        }
      }
      
      return true;
    } catch (error) {
      console.error('خطأ في ربط المستثمر بالمبيعة:', error);
      return false;
    }
  };

  const syncInventoryWithInvestor = (investorId: string) => {
    try {
      // مزامنة مخزون المستثمر مع النظام العام
      const investorProducts = inventoryManager.getInvestorProducts(investorId);
      const investorMovements = inventoryManager.getInvestorMovements(investorId);
      
      // إعادة حساب المخزون بناءً على الحركات
      for (const product of investorProducts) {
        const productMovements = investorMovements.filter(m => m.productId === product.id);
        const inboundQuantity = productMovements
          .filter(m => m.type === 'in')
          .reduce((sum, m) => sum + m.quantity, 0);
        const outboundQuantity = productMovements
          .filter(m => m.type === 'out')
          .reduce((sum, m) => sum + m.quantity, 0);
        
        const calculatedStock = inboundQuantity - outboundQuantity;
        
        if (product.stock !== calculatedStock) {
          // تحديث المخزون في حالة وجود فرق
          inventoryManager.addStockAdjustment(
            product.id,
            Math.abs(product.stock - calculatedStock),
            'مزامنة مخزون المستثمر',
            calculatedStock > product.stock ? 'in' : 'out'
          );
        }
      }
      
      return true;
    } catch (error) {
      console.error('خطأ في مزامنة المخزون:', error);
      return false;
    }
  };

  // إحصائيات شاملة
  const overallStats = useMemo(() => {
    const totalInvestors = investors.length;
    const totalInvestment = integratedData.reduce((sum, data) => sum + data.totalInvestment, 0);
    const totalProfit = integratedData.reduce((sum, data) => sum + data.totalProfit, 0);
    const totalStockValue = integratedData.reduce((sum, data) => sum + data.currentStockValue, 0);
    const avgROI = totalInvestors > 0 ? integratedData.reduce((sum, data) => sum + data.roi, 0) / totalInvestors : 0;

    return {
      totalInvestors,
      totalInvestment,
      totalProfit,
      totalStockValue,
      avgROI,
      profitMargin: totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0
    };
  }, [integratedData, investors]);

  return {
    integratedData,
    isLoading,
    overallStats,
    generalPurchases,
    generalSales,
    generalInventory,
    linkInvestorToPurchase,
    linkInvestorToSale,
    syncInventoryWithInvestor,
    refreshData: integrateInvestorData
  };
}