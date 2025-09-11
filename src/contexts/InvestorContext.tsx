import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { businessIntegration } from '@/utils/businessIntegration';
import { inventoryManager } from '@/utils/inventoryUtils';
import { storage } from '@/utils/storage';

// Types
export interface Investor {
  id: string;
  name: string;
  phone: string;
  investedAmount: number;
  depositDate: string;
  profitPercentage?: number;
  notes?: string;
  remainingAmount: number;
}

export interface InvestorPurchase {
  id: string;
  investorId: string;
  date: string;
  productType: string;
  quantity: number;
  price: number;
  supplier: string;
  totalCost: number;
  invoiceNumber?: string;
}

export interface InvestorSale {
  id: string;
  investorId: string;
  purchaseId: string;
  date: string;
  quantitySold: number;
  sellingPrice: number;
  profit: number;
  customerName?: string;
}

interface InvestorContextType {
  investors: Investor[];
  purchases: InvestorPurchase[];
  sales: InvestorSale[];
  addInvestor: (investor: Omit<Investor, 'id' | 'remainingAmount'>) => void;
  updateInvestor: (id: string, investor: Partial<Investor>) => void;
  addPurchase: (purchase: Omit<InvestorPurchase, 'id'>) => void;
  addSale: (sale: Omit<InvestorSale, 'id'>) => void;
  getInvestorPurchases: (investorId: string) => InvestorPurchase[];
  getInvestorSales: (investorId: string) => InvestorSale[];
  getInvestorReport: (investorId: string) => {
    totalInvested: number;
    totalSpent: number;
    totalSales: number;
    totalProfit: number;
    remainingAmount: number;
  };
}

const InvestorContext = createContext<InvestorContextType | undefined>(undefined);

// Initialize data using unified storage system
const getStoredData = (key: string, defaultValue: any) => {
  return storage.getItem(key, defaultValue);
};

export function InvestorProvider({ children }: { children: ReactNode }) {
  const [investors, setInvestors] = useState<Investor[]>(() => 
    getStoredData('investors', [])
  );
  const [purchases, setPurchases] = useState<InvestorPurchase[]>(() => 
    getStoredData('investor_purchases', [])
  );
  const [sales, setSales] = useState<InvestorSale[]>(() => 
    getStoredData('investor_sales', [])
  );

  // Save using unified storage system when data changes
  useEffect(() => {
    storage.setItem('investors', investors);
  }, [investors]);

  useEffect(() => {
    storage.setItem('investor_purchases', purchases);
  }, [purchases]);

  useEffect(() => {
    storage.setItem('investor_sales', sales);
  }, [sales]);

  const addInvestor = (newInvestor: Omit<Investor, 'id' | 'remainingAmount'>) => {
    const investor: Investor = {
      ...newInvestor,
      id: `INV${String(investors.length + 1).padStart(3, '0')}`,
      remainingAmount: newInvestor.investedAmount
    };
    setInvestors([...investors, investor]);
  };

  const updateInvestor = (id: string, updatedData: Partial<Investor>) => {
    setInvestors(investors.map(inv => 
      inv.id === id ? { ...inv, ...updatedData } : inv
    ));
  };

  const addPurchase = (newPurchase: Omit<InvestorPurchase, 'id'>) => {
    const purchase: InvestorPurchase = {
      ...newPurchase,
      id: `PUR${String(purchases.length + 1).padStart(3, '0')}`
    };
    
    // Create or find product
    const products = inventoryManager.getProducts();
    let product = products.find(p => p.name === purchase.productType || p.id === purchase.productType);
    
    if (!product) {
      // Create new product for investor
      const newProduct = {
        id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: purchase.productType,
        code: `INV_${newPurchase.investorId}_${String(products.length + 1).padStart(3, '0')}`,
        category: 'استثمار',
        cost: purchase.totalCost / purchase.quantity,
        price: purchase.totalCost / purchase.quantity * 1.2, // 20% markup default
        stock: 0,
        minStock: 5,
        status: 'active' as const,
        description: `منتج من استثمار ${purchase.investorId}`,
        ownerId: purchase.investorId,
        ownerType: 'investor' as const
      };
      
      const updatedProducts = [...products, newProduct];
      storage.setItem('products', updatedProducts);
      product = newProduct;
    }

    // Add inventory movement
    const success = inventoryManager.addInvestorPurchaseMovement(
      product.id,
      purchase.quantity,
      purchase.totalCost,
      purchase.investorId,
      purchase.id
    );
    
    if (!success) {
      throw new Error('فشل في تحديث المخزون');
    }
    
    setPurchases([...purchases, purchase]);
    
    // Process purchase through business integration system
    businessIntegration.processInvestorPurchase(purchase);
    
    // Update investor's remaining amount
    const currentInvestor = investors.find(inv => inv.id === newPurchase.investorId);
    if (currentInvestor) {
      updateInvestor(newPurchase.investorId, {
        remainingAmount: currentInvestor.remainingAmount - newPurchase.totalCost
      });
    }
  };

  const addSale = (newSale: Omit<InvestorSale, 'id'>) => {
    const sale: InvestorSale = {
      ...newSale,
      id: `SALE${String(sales.length + 1).padStart(3, '0')}`
    };
    
    // Validate stock availability for the sale
    const originalPurchase = purchases.find(p => p.id === newSale.purchaseId);
    if (!originalPurchase) {
      throw new Error('لم يتم العثور على المشترى الأصلي');
    }
    
    const products = inventoryManager.getProducts();
    const product = products.find(p => p.name === originalPurchase.productType || p.id === originalPurchase.productType);
    
    if (!product) {
      throw new Error('لم يتم العثور على المنتج');
    }
    
    const stockCheck = businessIntegration.checkStockAvailability(product.id, newSale.quantitySold);
    if (!stockCheck.available) {
      throw new Error(stockCheck.message);
    }
    
    // Process sale through inventory system
    const success = inventoryManager.addInvestorSaleMovement(
      product.id,
      newSale.quantitySold,
      newSale.quantitySold * newSale.sellingPrice,
      newSale.investorId,
      sale.id
    );
    
    if (!success) {
      throw new Error('فشل في تحديث المخزون');
    }
    
    setSales([...sales, sale]);
    
    // Process sale through business integration system
    businessIntegration.processInvestorSale(sale);
    
    // Update investor's remaining amount with sale proceeds
    const currentInvestor = investors.find(inv => inv.id === newSale.investorId);
    if (currentInvestor) {
      updateInvestor(newSale.investorId, {
        remainingAmount: currentInvestor.remainingAmount + (newSale.quantitySold * newSale.sellingPrice)
      });
    }
  };

  const getInvestorPurchases = (investorId: string) => {
    return purchases.filter(purchase => purchase.investorId === investorId);
  };

  const getInvestorSales = (investorId: string) => {
    return sales.filter(sale => sale.investorId === investorId);
  };

  const getInvestorReport = (investorId: string) => {
    const investor = investors.find(inv => inv.id === investorId);
    const investorPurchases = getInvestorPurchases(investorId);
    const investorSales = getInvestorSales(investorId);

    const totalInvested = investor?.investedAmount || 0;
    const totalSpent = investorPurchases.reduce((sum, purchase) => sum + purchase.totalCost, 0);
    const totalSales = investorSales.reduce((sum, sale) => sum + (sale.quantitySold * sale.sellingPrice), 0);
    const totalProfit = investorSales.reduce((sum, sale) => sum + sale.profit, 0);
    
    // Get current remaining amount from investor data (updated by transactions)
    const remainingAmount = investor?.remainingAmount || (totalInvested - totalSpent);
    
    // Get current stock value for this investor from inventory system
    const currentStockValue = inventoryManager.calculateInvestorStockValue(investorId);

    return {
      totalInvested,
      totalSpent,
      totalSales,
      totalProfit,
      remainingAmount,
      currentStockValue
    };
  };

  return (
    <InvestorContext.Provider value={{
      investors,
      purchases,
      sales,
      addInvestor,
      updateInvestor,
      addPurchase,
      addSale,
      getInvestorPurchases,
      getInvestorSales,
      getInvestorReport
    }}>
      {children}
    </InvestorContext.Provider>
  );
}

export function useInvestor() {
  const context = useContext(InvestorContext);
  if (context === undefined) {
    throw new Error('useInvestor must be used within an InvestorProvider');
  }
  return context;
}