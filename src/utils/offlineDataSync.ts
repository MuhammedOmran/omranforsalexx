/**
 * نظام مزامنة البيانات للعمل الأوف لاين
 * يضمن استمرارية العمل بدون إنترنت ومزامنة البيانات عند العودة
 */

import { storage } from './storage';
import { toast } from '@/hooks/use-toast';

export interface SyncableData {
  id: string;
  type: 'invoice' | 'customer' | 'product' | 'purchase' | 'expense';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  accountId?: string;
}

export interface OfflineChange {
  id: string;
  entityType: string;
  entityId: string;
  changeType: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  synced: boolean;
  retryCount: number;
}

class OfflineDataSyncManager {
  private static instance: OfflineDataSyncManager;
  private syncInProgress = false;
  private maxRetries = 3;
  private retryDelay = 1000; // 1 ثانية

  static getInstance(): OfflineDataSyncManager {
    if (!OfflineDataSyncManager.instance) {
      OfflineDataSyncManager.instance = new OfflineDataSyncManager();
    }
    return OfflineDataSyncManager.instance;
  }

  /**
   * تسجيل تغيير للمزامنة لاحقاً
   */
  recordChange(
    entityType: string,
    entityId: string,
    changeType: 'create' | 'update' | 'delete',
    data: any,
    accountId?: string
  ): void {
    const change: OfflineChange = {
      id: `${entityType}_${entityId}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      entityType,
      entityId,
      changeType,
      data: { ...data, accountId },
      timestamp: Date.now(),
      synced: false,
      retryCount: 0
    };

    const existingChanges = this.getPendingChanges();
    const updatedChanges = [...existingChanges, change];
    
    storage.setItem('pending_sync_changes', updatedChanges);

    // إذا كان الاتصال متاحاً، جرب المزامنة فوراً
    if (navigator.onLine && !this.syncInProgress) {
      this.syncPendingChanges();
    }
  }

  /**
   * الحصول على التغييرات المعلقة
   */
  getPendingChanges(): OfflineChange[] {
    return storage.getItem<OfflineChange[]>('pending_sync_changes', []);
  }

  /**
   * عدد التغييرات المعلقة
   */
  getPendingChangesCount(): number {
    return this.getPendingChanges().length;
  }

  /**
   * مزامنة التغييرات المعلقة
   */
  async syncPendingChanges(): Promise<{ success: number; failed: number }> {
    if (this.syncInProgress || !navigator.onLine) {
      return { success: 0, failed: 0 };
    }

    this.syncInProgress = true;
    const pendingChanges = this.getPendingChanges();
    
    if (pendingChanges.length === 0) {
      this.syncInProgress = false;
      return { success: 0, failed: 0 };
    }

    let successCount = 0;
    let failedCount = 0;
    const remainingChanges: OfflineChange[] = [];

    console.log(`بدء مزامنة ${pendingChanges.length} تغيير...`);

    for (const change of pendingChanges) {
      try {
        await this.syncSingleChange(change);
        successCount++;
        console.log(`تم مزامنة: ${change.entityType} ${change.entityId}`);
      } catch (error) {
        console.error(`فشل في مزامنة ${change.entityType} ${change.entityId}:`, error);
        
        change.retryCount++;
        if (change.retryCount < this.maxRetries) {
          remainingChanges.push(change);
        } else {
          console.error(`تم تجاوز الحد الأقصى للمحاولات لـ ${change.entityType} ${change.entityId}`);
          failedCount++;
        }
      }
    }

    // حفظ التغييرات المتبقية
    storage.setItem('pending_sync_changes', remainingChanges);
    this.syncInProgress = false;

    // إشعار المستخدم بالنتائج
    if (successCount > 0) {
      toast({
        title: "تمت المزامنة",
        description: `تم مزامنة ${successCount} عنصر بنجاح`,
      });
    }

    if (failedCount > 0) {
      toast({
        title: "فشل في بعض العمليات",
        description: `فشل في مزامنة ${failedCount} عنصر`,
        variant: "destructive",
      });
    }

    return { success: successCount, failed: failedCount };
  }

  /**
   * مزامنة تغيير واحد
   */
  private async syncSingleChange(change: OfflineChange): Promise<void> {
    // استخدام Supabase للمزامنة الفعلية
    const { supabase } = await import('@/integrations/supabase/client');

    switch (change.entityType) {
      case 'invoice':
        await this.syncInvoice(change, supabase);
        break;
      case 'customer':
        await this.syncCustomer(change, supabase);
        break;
      case 'product':
        await this.syncProduct(change, supabase);
        break;
      case 'purchase':
        await this.syncPurchase(change, supabase);
        break;
      case 'expense':
        await this.syncExpense(change, supabase);
        break;
      default:
        console.warn(`نوع غير معروف للمزامنة: ${change.entityType}`);
    }
  }

  /**
   * مزامنة فاتورة
   */
  private async syncInvoice(change: OfflineChange, supabase: any): Promise<void> {
    console.log(`مزامنة فاتورة: ${change.changeType}`, change.data);
    
    try {
      if (change.changeType === 'create') {
        const { error } = await supabase.from('invoices').insert(change.data);
        if (error) throw error;
      } else if (change.changeType === 'update') {
        const { error } = await supabase
          .from('invoices')
          .update(change.data)
          .eq('id', change.entityId);
        if (error) throw error;
      } else if (change.changeType === 'delete') {
        const { error } = await supabase
          .from('invoices')
          .delete()
          .eq('id', change.entityId);
        if (error) throw error;
      }
    } catch (error) {
      console.error('خطأ في مزامنة الفاتورة:', error);
      throw error;
    }
  }

  /**
   * مزامنة عميل
   */
  private async syncCustomer(change: OfflineChange, supabase: any): Promise<void> {
    console.log(`مزامنة عميل: ${change.changeType}`, change.data);
    
    try {
      if (change.changeType === 'create') {
        const { error } = await supabase.from('customers').insert(change.data);
        if (error) throw error;
      } else if (change.changeType === 'update') {
        const { error } = await supabase
          .from('customers')
          .update(change.data)
          .eq('id', change.entityId);
        if (error) throw error;
      } else if (change.changeType === 'delete') {
        const { error } = await supabase
          .from('customers')
          .delete()
          .eq('id', change.entityId);
        if (error) throw error;
      }
    } catch (error) {
      console.error('خطأ في مزامنة العميل:', error);
      throw error;
    }
  }

  /**
   * مزامنة منتج
   */
  private async syncProduct(change: OfflineChange, supabase: any): Promise<void> {
    console.log(`مزامنة منتج: ${change.changeType}`, change.data);
    
    try {
      if (change.changeType === 'create') {
        const { error } = await supabase.from('products').insert(change.data);
        if (error) throw error;
      } else if (change.changeType === 'update') {
        const { error } = await supabase
          .from('products')
          .update(change.data)
          .eq('id', change.entityId);
        if (error) throw error;
      } else if (change.changeType === 'delete') {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', change.entityId);
        if (error) throw error;
      }
    } catch (error) {
      console.error('خطأ في مزامنة المنتج:', error);
      throw error;
    }
  }

  /**
   * مزامنة مشتريات
   */
  private async syncPurchase(change: OfflineChange, supabase: any): Promise<void> {
    console.log(`مزامنة مشتريات: ${change.changeType}`, change.data);
    
    try {
      if (change.changeType === 'create') {
        const { error } = await supabase.from('purchase_invoices').insert(change.data);
        if (error) throw error;
      } else if (change.changeType === 'update') {
        const { error } = await supabase
          .from('purchase_invoices')
          .update(change.data)
          .eq('id', change.entityId);
        if (error) throw error;
      } else if (change.changeType === 'delete') {
        const { error } = await supabase
          .from('purchase_invoices')
          .delete()
          .eq('id', change.entityId);
        if (error) throw error;
      }
    } catch (error) {
      console.error('خطأ في مزامنة المشتريات:', error);
      throw error;
    }
  }

  /**
   * مزامنة مصاريف
   */
  private async syncExpense(change: OfflineChange, supabase: any): Promise<void> {
    console.log(`مزامنة مصاريف: ${change.changeType}`, change.data);
    
    try {
      if (change.changeType === 'create') {
        const { error } = await supabase.from('cash_transactions').insert(change.data);
        if (error) throw error;
      } else if (change.changeType === 'update') {
        const { error } = await supabase
          .from('cash_transactions')
          .update(change.data)
          .eq('id', change.entityId);
        if (error) throw error;
      } else if (change.changeType === 'delete') {
        const { error } = await supabase
          .from('cash_transactions')
          .delete()
          .eq('id', change.entityId);
        if (error) throw error;
      }
    } catch (error) {
      console.error('خطأ في مزامنة المصاريف:', error);
      throw error;
    }
  }

  /**
   * حل تضارب البيانات
   */
  private resolveConflict(localData: any, serverData: any): any {
    // استراتيجية بسيطة: آخر تحديث يفوز
    const localTimestamp = localData.updated_at || localData.timestamp || 0;
    const serverTimestamp = serverData.updated_at || serverData.timestamp || 0;
    
    return localTimestamp > serverTimestamp ? localData : serverData;
  }

  /**
   * مسح التغييرات المتزامنة
   */
  clearSyncedChanges(): void {
    const pendingChanges = this.getPendingChanges();
    const unsyncedChanges = pendingChanges.filter(change => !change.synced);
    
    storage.setItem('pending_sync_changes', unsyncedChanges);
    
    toast({
      title: "تم مسح البيانات المتزامنة",
      description: "تم حذف التغييرات التي تمت مزامنتها",
    });
  }

  /**
   * مسح جميع التغييرات المعلقة
   */
  clearAllPendingChanges(): void {
    storage.removeItem('pending_sync_changes');
    
    toast({
      title: "تم مسح جميع التغييرات",
      description: "تم حذف جميع التغييرات المعلقة",
    });
  }

  /**
   * فحص حالة المزامنة
   */
  getSyncStatus(): {
    inProgress: boolean;
    pendingCount: number;
    lastSyncTime: string | null;
  } {
    const lastSyncTime = storage.getItem<string>('last_sync_time', null);
    
    return {
      inProgress: this.syncInProgress,
      pendingCount: this.getPendingChangesCount(),
      lastSyncTime
    };
  }

  /**
   * تحديث وقت آخر مزامنة
   */
  private updateLastSyncTime(): void {
    storage.setItem('last_sync_time', new Date().toISOString());
  }

  /**
   * بدء المزامنة التلقائية
   */
  startAutoSync(): void {
    // مزامنة عند عودة الاتصال
    window.addEventListener('online', () => {
      console.log('عاد الاتصال - بدء المزامنة التلقائية');
      setTimeout(() => this.syncPendingChanges(), 2000);
    });

    // مزامنة دورية كل 5 دقائق إذا كان هناك اتصال
    setInterval(() => {
      if (navigator.onLine && this.getPendingChangesCount() > 0) {
        this.syncPendingChanges();
      }
    }, 5 * 60 * 1000);
  }
}

// إنشاء مثيل واحد
export const offlineSync = OfflineDataSyncManager.getInstance();

// بدء المزامنة التلقائية
if (typeof window !== 'undefined') {
  offlineSync.startAutoSync();
}

// دوال مساعدة للاستخدام السهل
export const recordOfflineChange = (
  entityType: string,
  entityId: string,
  changeType: 'create' | 'update' | 'delete',
  data: any,
  accountId?: string
) => offlineSync.recordChange(entityType, entityId, changeType, data, accountId);

export const getPendingSyncCount = () => offlineSync.getPendingChangesCount();
export const syncNow = () => offlineSync.syncPendingChanges();
export const getSyncStatus = () => offlineSync.getSyncStatus();