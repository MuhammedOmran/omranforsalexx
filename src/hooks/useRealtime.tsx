import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { handleError } from '@/utils/unifiedErrorHandler';
import { logger } from '@/utils/logger';

/**
 * نظام التحديثات الفورية
 */
export interface RealtimeUpdate {
  id: string;
  type: 'inventory' | 'sales' | 'customers' | 'financial';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  userId?: string;
}

class RealtimeSystem {
  private subscribers = new Map<string, ((update: RealtimeUpdate) => void)[]>();
  private updateQueue: RealtimeUpdate[] = [];
  private processingQueue = false;

  subscribe(channel: string, callback: (update: RealtimeUpdate) => void) {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, []);
    }
    this.subscribers.get(channel)!.push(callback);

    // إرجاع وظيفة إلغاء الاشتراك
    return () => {
      const callbacks = this.subscribers.get(channel);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  broadcast(update: RealtimeUpdate) {
    // إضافة للقائمة
    this.updateQueue.push(update);
    
    // معالجة فورية للقناة المحددة
    const callbacks = this.subscribers.get(update.type);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(update);
        } catch (error) {
          console.error('Error in realtime callback:', error);
        }
      });
    }

    // معالجة القائمة
    this.processQueue();
  }

  private async processQueue() {
    if (this.processingQueue || this.updateQueue.length === 0) return;
    
    this.processingQueue = true;
    
    while (this.updateQueue.length > 0) {
      const update = this.updateQueue.shift()!;
      
      // حفظ التحديث للسجل
      this.saveUpdate(update);
      
      // تأخير صغير لتجنب الإغراق
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    this.processingQueue = false;
  }

  private saveUpdate(update: RealtimeUpdate) {
    try {
      const updates = JSON.parse(localStorage.getItem('realtime_updates') || '[]');
      updates.push(update);
      
      // الاحتفاظ بآخر 100 تحديث فقط
      if (updates.length > 100) {
        updates.splice(0, updates.length - 100);
      }
      
      localStorage.setItem('realtime_updates', JSON.stringify(updates));
    } catch (error) {
      console.error('Error saving update:', error);
    }
  }

  getRecentUpdates(type?: string, limit = 10): RealtimeUpdate[] {
    try {
      const updates = JSON.parse(localStorage.getItem('realtime_updates') || '[]');
      let filtered = updates;
      
      if (type) {
        filtered = updates.filter((u: RealtimeUpdate) => u.type === type);
      }
      
      return filtered.slice(-limit);
    } catch (error) {
      console.error('Error getting updates:', error);
      return [];
    }
  }
}

export const realtimeSystem = new RealtimeSystem();

/**
 * Hook للتحديثات الفورية
 */
export function useRealtime(channel: string) {
  const [updates, setUpdates] = useState<RealtimeUpdate[]>([]);
  const [lastUpdate, setLastUpdate] = useState<RealtimeUpdate | null>(null);

  useEffect(() => {
    const unsubscribe = realtimeSystem.subscribe(channel, (update) => {
      setLastUpdate(update);
      setUpdates(prev => [...prev.slice(-9), update]); // آخر 10 تحديثات
    });

    return unsubscribe;
  }, [channel]);

  const broadcast = useCallback((type: RealtimeUpdate['type'], action: RealtimeUpdate['action'], data: any) => {
    const update: RealtimeUpdate = {
      id: crypto.randomUUID(),
      type,
      action,
      data,
      timestamp: Date.now()
    };
    
    realtimeSystem.broadcast(update);
  }, []);

  return {
    updates,
    lastUpdate,
    broadcast
  };
}

/**
 * نظام التنبيهات الذكية
 */
export interface SmartAlert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  category: 'inventory' | 'financial' | 'customers' | 'sales' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionRequired: boolean;
  actionUrl?: string;
  actionText?: string;
  createdAt: string;
  readAt?: string;
  resolvedAt?: string;
  autoHide?: boolean;
  duration?: number;
}

class SmartAlertsSystem {
  private alerts: SmartAlert[] = [];
  private callbacks: ((alerts: SmartAlert[]) => void)[] = [];

  subscribe(callback: (alerts: SmartAlert[]) => void) {
    this.callbacks.push(callback);
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  addAlert(alert: Omit<SmartAlert, 'id' | 'createdAt'>) {
    const smartAlert: SmartAlert = {
      ...alert,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };

    this.alerts.push(smartAlert);
    this.notifySubscribers();

    // إخفاء تلقائي
    if (smartAlert.autoHide !== false) {
      const duration = smartAlert.duration || this.getDefaultDuration(smartAlert.type);
      setTimeout(() => {
        this.removeAlert(smartAlert.id);
      }, duration);
    }

    // تسجيل في نظام المراقبة
    logger.info('Smart alert shown', {
      type: alert.type,
      priority: alert.priority,
      title: alert.title
    }, 'SmartAlerts');

    return smartAlert.id;
  }

  removeAlert(id: string) {
    this.alerts = this.alerts.filter(alert => alert.id !== id);
    this.notifySubscribers();
  }

  clearAll() {
    this.alerts = [];
    this.notifySubscribers();
  }

  private getDefaultDuration(type: SmartAlert['type']): number {
    switch (type) {
      case 'error': return 8000;
      case 'warning': return 6000;
      case 'success': return 4000;
      default: return 5000;
    }
  }

  private notifySubscribers() {
    this.callbacks.forEach(callback => {
      try {
        callback([...this.alerts]);
      } catch (error) {
        console.error('Error in alert callback:', error);
      }
    });
  }

  // تنبيهات ذكية للمشاكل الشائعة
  checkInventoryLevels(products: any[]) {
    const lowStock = products.filter(p => p.stock < 5);
    if (lowStock.length > 0) {
      this.addAlert({
        type: 'warning',
        category: 'inventory',
        title: 'تنبيه مخزون منخفض',
        message: `${lowStock.length} منتج بحاجة لإعادة تموين`,
        priority: 'medium',
        actionRequired: true,
        actionUrl: '/inventory/stock',
        actionText: 'عرض المنتجات'
      });
    }
  }

  checkSystemHealth() {
    const errorStats = { today: 0 }; // تبسيط مؤقت
    if (errorStats.today > 10) {
      this.addAlert({
        type: 'error',
        category: 'system',
        title: 'مشاكل في النظام',
        message: `تم رصد ${errorStats.today} خطأ اليوم`,
        priority: 'high',
        actionRequired: true,
        actionUrl: '/monitoring',
        actionText: 'عرض التفاصيل'
      });
    }
  }
}

export const smartAlerts = new SmartAlertsSystem();

/**
 * Hook للتنبيهات الذكية
 */
export function useSmartAlerts() {
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = smartAlerts.subscribe(setAlerts);
    return unsubscribe;
  }, []);

  const addAlert = useCallback((alert: Omit<SmartAlert, 'id' | 'createdAt'>) => {
    const id = smartAlerts.addAlert(alert);
    
    // عرض في toast أيضاً للتنبيهات المهمة
    if (alert.priority === 'high' || alert.priority === 'critical') {
      toast({
        title: alert.title,
        description: alert.message,
        variant: alert.type === 'error' ? 'destructive' : 'default'
      });
    }
    
    return id;
  }, [toast]);

  const removeAlert = useCallback((id: string) => {
    smartAlerts.removeAlert(id);
  }, []);

  return {
    alerts,
    addAlert,
    removeAlert,
    clearAll: smartAlerts.clearAll.bind(smartAlerts)
  };
}