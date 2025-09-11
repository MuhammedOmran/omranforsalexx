import { createContext, useContext, useEffect, ReactNode } from 'react';
import { businessIntegration } from '@/utils/businessIntegration';
import { inventoryManager } from '@/utils/inventoryUtils';
import { storage } from '@/utils/storage';
import { appInitializer } from '@/utils/appInitializer';
import { toast } from '@/hooks/use-toast';
import { cashFlowManager } from '@/utils/cashFlowManager';
import { dataSyncManager } from '@/utils/dataSync';

interface AppIntegrationContextType {
  initializeApp: () => Promise<void>;
  syncAllData: () => Promise<boolean>;
  validateStockBeforeSale: (productId: string, quantity: number) => { valid: boolean; message: string };
  processSaleWithInventoryUpdate: (saleData: any) => Promise<boolean>;
  generateReports: () => any;
}

const AppIntegrationContext = createContext<AppIntegrationContextType | undefined>(undefined);

export function AppIntegrationProvider({ children }: { children: ReactNode }) {
  

  // Initialize app using comprehensive initializer
  const initializeApp = async () => {
    try {
      const success = await appInitializer.initialize();
      
      if (success) {
        console.log('App initialized successfully');
      } else {
        throw new Error('Initialization failed');
      }
    } catch (error) {
      console.error('App initialization failed:', error);
      toast({
        title: "خطأ في التهيئة",
        description: "حدث خطأ أثناء تهيئة التطبيق. سيتم المحاولة مرة أخرى.",
        variant: "destructive",
      });
      
      // Retry initialization after 3 seconds
      setTimeout(async () => {
        try {
          await appInitializer.reinitialize();
          toast({
            title: "تم إصلاح المشكلة",
            description: "تم تهيئة التطبيق بنجاح",
          });
        } catch (retryError) {
          console.error('Retry initialization failed:', retryError);
        }
      }, 3000);
    }
  };

  // Sync all data across systems using the new comprehensive sync manager
  const syncAllData = async (): Promise<boolean> => {
    try {
      const result = await dataSyncManager.syncAllData();
      
      if (result.success) {
        toast({
          title: "تم التحديث",
          description: "تم مزامنة جميع البيانات والتدفق النقدي بنجاح",
        });
        return true;
      } else {
        console.error('Sync errors:', result.errors);
        toast({
          title: "تحذير في المزامنة",
          description: `تم المزامنة مع بعض التحذيرات: ${result.errors.length} مشكلة`,
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Data sync failed:', error);
      toast({
        title: "خطأ في المزامنة",
        description: "فشل في مزامنة البيانات",
        variant: "destructive",
      });
      return false;
    }
  };

  // Validate stock availability before sale
  const validateStockBeforeSale = (productId: string, quantity: number) => {
    const stockCheck = businessIntegration.checkStockAvailability(productId, quantity);
    return {
      valid: stockCheck.available,
      message: stockCheck.message
    };
  };

  // Process sale with complete inventory update
  const processSaleWithInventoryUpdate = async (saleData: any): Promise<boolean> => {
    try {
      // Validate all items first
      for (const item of saleData.itemsDetails || saleData.items) {
        const stockCheck = validateStockBeforeSale(item.productId, item.quantity);
        if (!stockCheck.valid) {
          toast({
            title: "خطأ في المخزون",
            description: `${item.productName}: ${stockCheck.message}`,
            variant: "destructive",
          });
          return false;
        }
      }

      // Process inventory movements for each item
      const itemsToProcess = saleData.itemsDetails || saleData.items;
      
      for (const item of itemsToProcess) {
        // Add sale movement to inventory
        const movementSuccess = inventoryManager.addSaleMovement(
          item.productId,
          item.quantity,
          item.total,
          saleData.id,
          item.investorCode,
          item.investorCode ? 'investor' : 'company'
        );
        
        if (!movementSuccess) {
          throw new Error(`فشل في تحديث حركة المخزون للمنتج: ${item.productName}`);
        }
      }

      // Process through business integration
      const integratedInvoice = {
        id: saleData.id,
        customerName: saleData.customerName,
        date: saleData.date,
        items: itemsToProcess.map((item: any) => ({
          id: item.id,
          productId: item.productId || item.id,
          productName: item.productName || item.name,
          productCode: item.productCode || item.code,
          quantity: item.quantity,
          price: item.price,
          cost: item.cost,
          total: item.total
        })),
        total: saleData.total,
        status: saleData.paymentStatus === 'paid' ? 'paid' as const : 'pending' as const,
        paymentMethod: saleData.paymentMethod
      };

      const success = businessIntegration.processSalesInvoice(integratedInvoice);
      
      if (success) {
        // Sync data after successful sale
        await syncAllData();
        
        // Sync financial data
        cashFlowManager.syncAllFinancialData();
        
        // Show detailed success message
        const totalItems = itemsToProcess.reduce((sum: number, item: any) => sum + item.quantity, 0);
        toast({
          title: "تم ربط البيع بالمخزون بنجاح",
          description: `تم خصم ${totalItems} قطعة من ${itemsToProcess.length} منتج من المخزون`,
        });
      }

      return success;
    } catch (error) {
      console.error('Sale processing failed:', error);
      toast({
        title: "فشل في العملية",
        description: "حدث خطأ أثناء معالجة البيع",
        variant: "destructive",
      });
      return false;
    }
  };

  // Generate comprehensive reports
  const generateReports = () => {
    try {
      const businessAnalytics = businessIntegration.getBusinessAnalytics();
      const stockAnalysis = inventoryManager.calculateStockAnalysis();
      const lowStock = inventoryManager.getLowStockProducts();
      const outOfStock = inventoryManager.getOutOfStockProducts();

      return {
        business: businessAnalytics,
        stock: stockAnalysis,
        alerts: {
          lowStock: lowStock.length,
          outOfStock: outOfStock.length,
          items: [...lowStock, ...outOfStock]
        },
        summary: {
          totalProducts: businessAnalytics.totalProducts,
          totalRevenue: businessAnalytics.salesRevenue,
          totalProfit: businessAnalytics.grossProfit,
          profitMargin: businessAnalytics.grossProfitMargin
        }
      };
    } catch (error) {
      console.error('Report generation failed:', error);
      return null;
    }
  };

  // Initialize app on mount
  useEffect(() => {
    initializeApp();
  }, []);

  return (
    <AppIntegrationContext.Provider value={{
      initializeApp,
      syncAllData,
      validateStockBeforeSale,
      processSaleWithInventoryUpdate,
      generateReports
    }}>
      {children}
    </AppIntegrationContext.Provider>
  );
}

export function useAppIntegration() {
  const context = useContext(AppIntegrationContext);
  if (context === undefined) {
    throw new Error('useAppIntegration must be used within an AppIntegrationProvider');
  }
  return context;
}