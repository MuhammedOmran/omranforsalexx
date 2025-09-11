import { useEffect, useRef, useState, useCallback } from 'react';
import { storage } from '@/utils/storage';

interface AutoSyncOptions {
  interval?: number; // بالثواني
  enabled?: boolean;
  onSync?: (data: any) => void;
  onError?: (error: Error) => void;
  syncOnVisibilityChange?: boolean;
  syncOnNetworkReconnect?: boolean;
}

interface SyncResult {
  success: boolean;
  timestamp: number;
  itemsUpdated: number;
  error?: string;
}

/**
 * Hook للتحديث التلقائي للبيانات
 */
export function useAutoSync(options: AutoSyncOptions = {}) {
  const {
    interval = 300, // 5 دقائق افتراضياً
    enabled = true,
    onSync,
    onError,
    syncOnVisibilityChange = true,
    syncOnNetworkReconnect = true
  } = options;

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState<number>(0);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [syncHistory, setSyncHistory] = useState<SyncResult[]>([]);
  
  const intervalRef = useRef<NodeJS.Timeout>();
  const syncInProgressRef = useRef(false);

  /**
   * تنفيذ عملية المزامنة
   */
  const performSync = useCallback(async (): Promise<SyncResult> => {
    if (syncInProgressRef.current || !isOnline) {
      return { success: false, timestamp: Date.now(), itemsUpdated: 0, error: 'Sync already in progress or offline' };
    }

    syncInProgressRef.current = true;
    setSyncStatus('syncing');

    try {
      // محاكاة عملية المزامنة مع الخادم
      const localData = storage.getAllItems();
      let itemsUpdated = 0;

      // فحص التحديثات لكل عنصر
      const dataTypes = ['products', 'customers', 'invoices', 'purchases', 'suppliers'];
      
      for (const dataType of dataTypes) {
        const localItems = storage.getItem(dataType, []);
        const lastSyncTime = storage.getItem(`${dataType}_last_sync`, 0);
        
        // محاكاة فحص التحديثات من الخادم
        const updatedItems = await simulateServerSync(dataType, localItems, lastSyncTime);
        
        if (updatedItems.length > 0) {
          storage.setItem(dataType, updatedItems);
          itemsUpdated += updatedItems.length;
        }
        
        storage.setItem(`${dataType}_last_sync`, Date.now());
      }

      const result: SyncResult = {
        success: true,
        timestamp: Date.now(),
        itemsUpdated
      };

      setLastSync(Date.now());
      setSyncStatus('idle');
      setSyncHistory(prev => [...prev.slice(-9), result]); // الاحتفاظ بآخر 10 عمليات

      onSync?.(localData);
      return result;

    } catch (error) {
      const errorResult: SyncResult = {
        success: false,
        timestamp: Date.now(),
        itemsUpdated: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      setSyncStatus('error');
      setSyncHistory(prev => [...prev.slice(-9), errorResult]);
      onError?.(error instanceof Error ? error : new Error('Sync failed'));
      
      return errorResult;
    } finally {
      syncInProgressRef.current = false;
    }
  }, [isOnline, onSync, onError]);

  /**
   * بدء المزامنة التلقائية
   */
  const startAutoSync = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (enabled && interval > 0) {
      intervalRef.current = setInterval(() => {
        performSync();
      }, interval * 1000);

      // مزامنة فورية عند البدء
      performSync();
    }
  }, [enabled, interval, performSync]);

  /**
   * إيقاف المزامنة التلقائية
   */
  const stopAutoSync = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  }, []);

  /**
   * مزامنة يدوية
   */
  const manualSync = useCallback(async (): Promise<SyncResult> => {
    return performSync();
  }, [performSync]);

  // مراقبة حالة الاتصال
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (syncOnNetworkReconnect && enabled) {
        performSync();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncOnNetworkReconnect, enabled, performSync]);

  // مراقبة تغيير visibility
  useEffect(() => {
    if (!syncOnVisibilityChange) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabled && isOnline) {
        // مزامنة عند العودة للتطبيق إذا مر أكثر من دقيقة
        const timeSinceLastSync = Date.now() - lastSync;
        if (timeSinceLastSync > 60000) { // دقيقة واحدة
          performSync();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [syncOnVisibilityChange, enabled, isOnline, lastSync, performSync]);

  // بدء/إيقاف المزامنة حسب الحالة
  useEffect(() => {
    if (enabled) {
      startAutoSync();
    } else {
      stopAutoSync();
    }

    return () => stopAutoSync();
  }, [enabled, startAutoSync, stopAutoSync]);

  return {
    isOnline,
    lastSync,
    syncStatus,
    syncHistory,
    manualSync,
    startAutoSync,
    stopAutoSync,
    isEnabled: enabled,
    nextSyncIn: intervalRef.current ? Math.max(0, interval - Math.floor((Date.now() - lastSync) / 1000)) : 0
  };
}

/**
 * محاكاة عملية المزامنة مع الخادم
 */
async function simulateServerSync(
  dataType: string,
  localItems: any[],
  lastSyncTime: number
): Promise<any[]> {
  // محاكاة تأخير الشبكة
  await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

  // في التطبيق الحقيقي، هنا ستكون استدعاءات API
  // الآن سنحاكي بعض التحديثات العشوائية
  
  const shouldUpdate = Math.random() < 0.1; // 10% احتمال وجود تحديثات
  
  if (shouldUpdate && localItems.length > 0) {
    // إضافة timestamp للعناصر المحدثة
    return localItems.map(item => ({
      ...item,
      lastServerSync: Date.now(),
      syncVersion: (item.syncVersion || 0) + 1
    }));
  }

  return localItems;
}

/**
 * Hook مبسط للمزامنة الأساسية
 */
export function useBasicSync(dataType: string) {
  const [data, setData] = useState(() => storage.getItem(dataType, []));
  const [lastSync, setLastSync] = useState(() => storage.getItem(`${dataType}_last_sync`, 0));

  const sync = useCallback(async () => {
    try {
      const currentData = storage.getItem(dataType, []);
      const updatedData = await simulateServerSync(dataType, currentData, lastSync);
      
      storage.setItem(dataType, updatedData);
      storage.setItem(`${dataType}_last_sync`, Date.now());
      
      setData(updatedData);
      setLastSync(Date.now());
      
      return { success: true, data: updatedData };
    } catch (error) {
      console.error(`فشل في مزامنة ${dataType}:`, error);
      return { success: false, error };
    }
  }, [dataType, lastSync]);

  return { data, lastSync, sync };
}