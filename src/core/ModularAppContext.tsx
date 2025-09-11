/**
 * نظام Context المعاد هيكلته باستخدام نظام الـ Plugins
 */

import { createContext, useContext, useEffect, ReactNode, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { pluginSystem } from './PluginSystem';
import { salesPlugin } from '@/plugins/SalesPlugin';
import { inventoryPlugin } from '@/plugins/InventoryPlugin';
import { reportsPlugin } from '@/plugins/ReportsPlugin';

interface ModularAppContextType {
  isInitialized: boolean;
  pluginsLoaded: boolean;
  reloadPlugins: () => Promise<void>;
  processSale: (saleData: any) => Promise<any>;
  updateInventory: (inventoryData: any) => Promise<any>;
  generateReport: (reportType: string, params?: any) => Promise<any>;
  getSystemStatus: () => Promise<any>;
}

const ModularAppContext = createContext<ModularAppContextType | undefined>(undefined);

export function ModularAppProvider({ children }: { children: ReactNode }) {
  // Remove useToast to prevent circular dependency - will be added back later when needed
  // const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);
  const [pluginsLoaded, setPluginsLoaded] = useState(false);

  // تهيئة النظام والـ plugins
  const initializeSystem = async () => {
    try {
      console.log('Initializing modular app system...');

      // تسجيل الـ plugins الأساسية
      pluginSystem.register(salesPlugin);
      pluginSystem.register(inventoryPlugin);
      pluginSystem.register(reportsPlugin);

      // تهيئة نظام الـ plugins
      await pluginSystem.initialize({
        autoInit: true,
        loadOrder: ['inventory-plugin', 'sales-plugin', 'reports-plugin']
      });

      setPluginsLoaded(true);
      setIsInitialized(true);
      
      console.log('Modular app system initialized successfully');

    } catch (error) {
      console.error('System initialization failed:', error);

      // إعادة المحاولة بعد 5 ثوانٍ
      setTimeout(initializeSystem, 5000);
    }
  };

  // إعادة تحميل الـ plugins
  const reloadPlugins = async (): Promise<void> => {
    try {
      setPluginsLoaded(false);
      
      // إعادة تهيئة النظام
      await pluginSystem.cleanup();
      await initializeSystem();
      
      console.log('Plugins reloaded successfully');
    } catch (error) {
      console.error('Plugin reload failed:', error);
    }
  };

  // معالجة المبيعات عبر نظام الـ plugins
  const processSale = async (saleData: any): Promise<any> => {
    try {
      const results = await pluginSystem.executeHook('onSaleProcess', saleData);
      
      if (results.length > 0) {
        const mainResult = results[0] as any;
        
        if (mainResult.success) {
          console.log('Sale processed successfully');
        }
        
        return mainResult;
      }
      
      return { success: false, error: 'لا توجد معالجات للمبيعات' };
    } catch (error) {
      console.error('Sale processing failed:', error);
      return { success: false, error: 'حدث خطأ في معالجة البيع' };
    }
  };

  // تحديث المخزون عبر نظام الـ plugins
  const updateInventory = async (inventoryData: any): Promise<any> => {
    try {
      const results = await pluginSystem.executeHook('onInventoryUpdate', inventoryData);
      
      if (results.length > 0) {
        return results[0];
      }
      
      return { success: false, error: 'لا توجد معالجات للمخزون' };
    } catch (error) {
      console.error('Inventory update failed:', error);
      return { success: false, error: 'حدث خطأ في تحديث المخزون' };
    }
  };

  // إنشاء التقارير عبر نظام الـ plugins
  const generateReport = async (reportType: string, params?: any): Promise<any> => {
    try {
      const results = await pluginSystem.executeHook('onReportGenerate', {
        reportType,
        ...params
      });
      
      if (results.length > 0) {
        return results[0];
      }
      
      return { success: false, error: 'لا توجد معالجات للتقارير' };
    } catch (error) {
      console.error('Report generation failed:', error);
      return { success: false, error: 'حدث خطأ في إنشاء التقرير' };
    }
  };

  // الحصول على حالة النظام
  const getSystemStatus = async (): Promise<any> => {
    try {
      const pluginInfo = pluginSystem.getPluginInfo();
      const allPlugins = pluginSystem.getAllPlugins();
      
      return {
        initialized: isInitialized,
        pluginsLoaded,
        totalPlugins: allPlugins.length,
        loadedPlugins: pluginInfo,
        systemHealth: 'healthy' // يمكن تطوير هذا أكثر
      };
    } catch (error) {
      console.error('Failed to get system status:', error);
      return {
        initialized: false,
        pluginsLoaded: false,
        error: 'فشل في الحصول على حالة النظام'
      };
    }
  };

  // تهيئة النظام عند تحميل المكون
  useEffect(() => {
    initializeSystem();
    
    // تنظيف عند إلغاء تحميل المكون
    return () => {
      pluginSystem.cleanup();
    };
  }, []);

  return (
    <ModularAppContext.Provider value={{
      isInitialized,
      pluginsLoaded,
      reloadPlugins,
      processSale,
      updateInventory,
      generateReport,
      getSystemStatus
    }}>
      {children}
    </ModularAppContext.Provider>
  );
}

export function useModularApp() {
  const context = useContext(ModularAppContext);
  if (context === undefined) {
    throw new Error('useModularApp must be used within a ModularAppProvider');
  }
  return context;
}