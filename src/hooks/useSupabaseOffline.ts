/**
 * Hook مخصص للتعامل مع البيانات الأوف لاين في Supabase
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  supabaseOfflineSync, 
  saveOfflineData, 
  syncOfflineData,
  getOfflineStats,
  clearSyncedData,
  startAutoSync
} from '@/utils/supabaseOfflineSync';
import { toast } from '@/hooks/use-toast';

interface UseSupabaseOfflineReturn {
  // حالة الاتصال والمزامنة
  isOnline: boolean;
  isSyncing: boolean;
  
  // إحصائيات المزامنة
  syncStats: {
    pending: number;
    synced: number;
    failed: number;
    total: number;
  };
  
  // دوال العمليات
  saveData: (dataType: string, dataId: string, dataContent: any) => Promise<boolean>;
  syncNow: () => Promise<{ success: number; failed: number }>;
  clearSynced: () => Promise<boolean>;
  
  // آخر وقت مزامنة
  lastSyncTime: string | null;
}

export function useSupabaseOffline(): UseSupabaseOfflineReturn {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStats, setSyncStats] = useState({
    pending: 0,
    synced: 0,
    failed: 0,
    total: 0
  });
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // تحديث حالة الاتصال
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('عاد الاتصال - سيتم بدء المزامنة التلقائية');
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('انقطع الاتصال - العمل في الوضع الأوف لاين');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // تحديث الإحصائيات
  const updateStats = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const stats = await getOfflineStats(user.id);
      setSyncStats(stats);
    } catch (error) {
      console.error('خطأ في تحديث الإحصائيات:', error);
    }
  }, [user?.id]);

  // تحديث الإحصائيات دورياً
  useEffect(() => {
    updateStats();
    
    const interval = setInterval(updateStats, 30000); // كل 30 ثانية
    return () => clearInterval(interval);
  }, [updateStats]);

  // بدء المزامنة التلقائية
  useEffect(() => {
    if (user?.id) {
      startAutoSync(user.id);
    }
  }, [user?.id]);

  // حفظ البيانات
  const saveData = useCallback(async (
    dataType: string, 
    dataId: string, 
    dataContent: any
  ): Promise<boolean> => {
    if (!user?.id) {
      console.error('لا يوجد مستخدم مسجل');
      return false;
    }

    try {
      const success = await saveOfflineData(dataType, dataId, dataContent, user.id);
      
      if (success) {
        await updateStats();
        console.log(`تم حفظ ${dataType} بنجاح:`, dataId);
      }
      
      return success;
    } catch (error) {
      console.error('خطأ في حفظ البيانات:', error);
      return false;
    }
  }, [user?.id, updateStats]);

  // مزامنة فورية
  const syncNow = useCallback(async (): Promise<{ success: number; failed: number }> => {
    if (!user?.id || isSyncing || !isOnline) {
      return { success: 0, failed: 0 };
    }

    setIsSyncing(true);
    
    try {
      console.log('بدء المزامنة اليدوية...');
      const result = await syncOfflineData(user.id);
      
      if (result.success > 0) {
        setLastSyncTime(new Date().toLocaleString('ar-EG', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }));
      }
      
      await updateStats();
      return result;
    } catch (error) {
      console.error('خطأ في المزامنة:', error);
      toast({
        title: "خطأ في المزامنة",
        description: "فشل في مزامنة البيانات",
        variant: "destructive",
      });
      return { success: 0, failed: 0 };
    } finally {
      setIsSyncing(false);
    }
  }, [user?.id, isSyncing, isOnline, updateStats]);

  // مسح البيانات المتزامنة
  const clearSynced = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const success = await clearSyncedData(user.id);
      
      if (success) {
        await updateStats();
      }
      
      return success;
    } catch (error) {
      console.error('خطأ في مسح البيانات:', error);
      return false;
    }
  }, [user?.id, updateStats]);

  return {
    isOnline,
    isSyncing,
    syncStats,
    saveData,
    syncNow,
    clearSynced,
    lastSyncTime
  };
}