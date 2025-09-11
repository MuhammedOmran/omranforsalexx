import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from '@/hooks/use-toast';
import { storage } from '@/utils/storage';
import { supabaseOfflineSync, saveOfflineData, syncOfflineData, getOfflineStats, clearSyncedData } from '@/utils/supabaseOfflineSync';
import { useAuth } from '@/contexts/AuthContext';

interface OfflineQueue {
  id: string;
  action: string;
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

interface OfflineCapabilities {
  isOnline: boolean;
  isInstalled: boolean;
  pendingSync: number;
  storage: {
    used: number;
    available: number;
    percentage: number;
  };
  canSync: boolean;
}

export function useOfflineCapabilities() {
  const { user } = useAuth();
  const [capabilities, setCapabilities] = useState<OfflineCapabilities>({
    isOnline: navigator.onLine,
    isInstalled: false,
    pendingSync: 0,
    storage: { used: 0, available: 0, percentage: 0 },
    canSync: false
  });

  const syncQueueRef = useRef<OfflineQueue[]>([]);
  const syncInProgressRef = useRef(false);

  // تحديث حالة الاتصال
  useEffect(() => {
    const updateOnlineStatus = () => {
      setCapabilities(prev => ({
        ...prev,
        isOnline: navigator.onLine,
        canSync: navigator.onLine && !syncInProgressRef.current
      }));
    };

    const handleOnline = () => {
      updateOnlineStatus();
      toast({
        title: "عاد الاتصال بالإنترنت",
        description: "جاري مزامنة البيانات...",
      });
      syncPendingData();
    };

    const handleOffline = () => {
      updateOnlineStatus();
      toast({
        title: "تم قطع الاتصال",
        description: "التطبيق يعمل في الوضع الأوف لاين",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // تحقق من تثبيت PWA
  useEffect(() => {
    const checkInstallation = () => {
      const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                   (window.navigator as any).standalone ||
                   document.referrer.includes('android-app://');
      
      setCapabilities(prev => ({ ...prev, isInstalled: isPWA }));
    };

    checkInstallation();
  }, []);

  // مراقبة استخدام التخزين
  useEffect(() => {
    const updateStorageInfo = () => {
      const storageInfo = storage.getStorageUsage();
      setCapabilities(prev => ({
        ...prev,
        storage: {
          used: storageInfo.used,
          available: storageInfo.total - storageInfo.used,
          percentage: storageInfo.usedPercentage
        }
      }));
    };

    updateStorageInfo();
    const interval = setInterval(updateStorageInfo, 60000); // كل دقيقة

    return () => clearInterval(interval);
  }, []);

  // إضافة عملية للقائمة المؤجلة - تستخدم Supabase الآن
  const addToOfflineQueue = useCallback((action: string, data: any, maxRetries = 3) => {
    if (!user?.id) return;

    const queueItem: OfflineQueue = {
      id: `${action}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      action,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries
    };

    // حفظ في Supabase offline_data
    saveOfflineData(action, queueItem.id, data, user.id);
    
    syncQueueRef.current.push(queueItem);
    
    // حفظ القائمة في التخزين المحلي كنسخة احتياطية
    storage.setItem('offline_sync_queue', syncQueueRef.current);
    
    setCapabilities(prev => ({
      ...prev,
      pendingSync: syncQueueRef.current.length
    }));

    toast({
      title: "تم حفظ العملية",
      description: "سيتم المزامنة عند توفر الاتصال",
    });
  }, [user?.id]);

  // مزامنة البيانات المؤجلة - تستخدم Supabase الآن
  const syncPendingData = useCallback(async () => {
    if (!navigator.onLine || syncInProgressRef.current || !user?.id) return;

    syncInProgressRef.current = true;
    
    try {
      // استخدام نظام Supabase للمزامنة
      const result = await syncOfflineData(user.id);
      
      // تحديث الإحصائيات من Supabase
      const stats = await getOfflineStats(user.id);
      setCapabilities(prev => ({
        ...prev,
        pendingSync: stats.pending
      }));

      if (result.success > 0) {
        toast({
          title: "تمت المزامنة",
          description: `تم مزامنة ${result.success} عملية`,
        });
      }

      if (result.failed > 0) {
        toast({
          title: "فشل في بعض العمليات",
          description: `فشل في مزامنة ${result.failed} عملية`,
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('خطأ في مزامنة البيانات:', error);
      toast({
        title: "خطأ في المزامنة",
        description: "حدث خطأ أثناء مزامنة البيانات",
        variant: "destructive",
      });
    } finally {
      syncInProgressRef.current = false;
      setCapabilities(prev => ({ ...prev, canSync: true }));
    }
  }, [user?.id]);

  // تنفيذ العمليات المؤجلة
  const executeOfflineAction = async (item: OfflineQueue): Promise<void> => {
    // هنا يمكن إضافة منطق مزامنة مع الخادم
    // في الوقت الحالي، نحدث البيانات المحلية فقط
    
    switch (item.action) {
      case 'create_invoice':
        // مزامنة فاتورة جديدة
        console.log('مزامنة فاتورة:', item.data);
        break;
      
      case 'update_customer':
        // مزامنة تحديث عميل
        console.log('مزامنة عميل:', item.data);
        break;
      
      case 'create_product':
        // مزامنة منتج جديد
        console.log('مزامنة منتج:', item.data);
        break;
      
      default:
        console.log('مزامنة عملية:', item.action, item.data);
    }

    // محاكاة تأخير الشبكة
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  // مسح قائمة المزامنة - تستخدم Supabase الآن
  const clearSyncQueue = useCallback(async () => {
    if (!user?.id) return;

    try {
      await clearSyncedData(user.id);
      syncQueueRef.current = [];
      storage.removeItem('offline_sync_queue');
      setCapabilities(prev => ({ ...prev, pendingSync: 0 }));
      
      toast({
        title: "تم مسح قائمة المزامنة",
        description: "تم حذف جميع العمليات المؤجلة",
      });
    } catch (error) {
      console.error('خطأ في مسح البيانات:', error);
      toast({
        title: "خطأ في المسح",
        description: "فشل في مسح قائمة المزامنة",
        variant: "destructive",
      });
    }
  }, [user?.id]);

  // فحص صحة التخزين
  const checkStorageHealth = useCallback(() => {
    const health = storage.checkStorageHealth();
    
    if (health.isHealthy) {
      toast({
        title: "فحص التخزين",
        description: "نظام التخزين يعمل بشكل مثالي",
      });
    } else {
      toast({
        title: "مشاكل في التخزين",
        description: health.errors.join(', '),
        variant: "destructive",
      });
    }

    return health;
  }, []);

  // تصدير البيانات للنسخ الاحتياطي
  const exportOfflineData = useCallback(() => {
    const data = storage.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `omran-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "تم تصدير البيانات",
      description: "تم تحميل ملف النسخة الاحتياطية",
    });
  }, []);

  // استيراد البيانات من النسخة الاحتياطية
  const importOfflineData = useCallback((file: File): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result as string;
          const success = storage.importData(data);
          
          if (success) {
            toast({
              title: "تم استيراد البيانات",
              description: "تم استيراد النسخة الاحتياطية بنجاح",
            });
            resolve(true);
          } else {
            throw new Error('فشل في استيراد البيانات');
          }
        } catch (error) {
          toast({
            title: "خطأ في الاستيراد",
            description: "تعذر استيراد البيانات",
            variant: "destructive",
          });
          reject(error);
        }
      };
      reader.readAsText(file);
    });
  }, []);

  // إعادة تحميل البيانات المحلية عند بدء التطبيق
  useEffect(() => {
    const loadSyncQueue = async () => {
      if (!user?.id) return;

      // تحميل من Supabase
      const stats = await getOfflineStats(user.id);
      setCapabilities(prev => ({ ...prev, pendingSync: stats.pending }));

      // تحميل من التخزين المحلي كنسخة احتياطية
      const savedQueue = storage.getItem<OfflineQueue[]>('offline_sync_queue', []);
      syncQueueRef.current = savedQueue;
    };

    loadSyncQueue();
  }, [user?.id]);

  return {
    capabilities,
    addToOfflineQueue,
    syncPendingData,
    clearSyncQueue,
    checkStorageHealth,
    exportOfflineData,
    importOfflineData,
    isSyncInProgress: syncInProgressRef.current
  };
}