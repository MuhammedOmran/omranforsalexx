/**
 * نظام مزامنة البيانات المحسن مع Supabase
 * يحفظ البيانات في جدول offline_data عند انقطاع الاتصال
 */

import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface OfflineRecord {
  id: string;
  user_id: string;
  data_type: string;
  data_id: string;
  data_content: any;
  sync_status: 'pending' | 'synced' | 'failed';
  created_at: string;
  updated_at: string;
  last_sync_at?: string;
}

class SupabaseOfflineSync {
  private static instance: SupabaseOfflineSync;
  private syncInProgress = false;

  static getInstance(): SupabaseOfflineSync {
    if (!SupabaseOfflineSync.instance) {
      SupabaseOfflineSync.instance = new SupabaseOfflineSync();
    }
    return SupabaseOfflineSync.instance;
  }

  /**
   * حفظ البيانات في الوضع الأوف لاين
   */
  async saveOfflineData(
    dataType: string,
    dataId: string,
    dataContent: any,
    userId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('offline_data')
        .upsert({
          user_id: userId,
          data_type: dataType,
          data_id: dataId,
          data_content: dataContent,
          sync_status: 'pending',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,data_type,data_id'
        });

      if (error) {
        console.error('خطأ في حفظ البيانات الأوف لاين:', error);
        return false;
      }

      console.log(`تم حفظ ${dataType} في الوضع الأوف لاين:`, dataId);
      return true;
    } catch (error) {
      console.error('خطأ في العملية:', error);
      return false;
    }
  }

  /**
   * استرجاع البيانات المحفوظة أوف لاين
   */
  async getOfflineData(userId: string, dataType?: string): Promise<OfflineRecord[]> {
    try {
      let query = supabase
        .from('offline_data')
        .select('*')
        .eq('user_id', userId)
        .eq('sync_status', 'pending');

      if (dataType) {
        query = query.eq('data_type', dataType);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('خطأ في استرجاع البيانات الأوف لاين:', error);
        return [];
      }

      return (data || []) as OfflineRecord[];
    } catch (error) {
      console.error('خطأ في العملية:', error);
      return [];
    }
  }

  /**
   * مزامنة البيانات المحفوظة أوف لاين
   */
  async syncOfflineData(userId: string): Promise<{ success: number; failed: number }> {
    if (this.syncInProgress || !navigator.onLine) {
      return { success: 0, failed: 0 };
    }

    this.syncInProgress = true;
    
    try {
      const offlineRecords = await this.getOfflineData(userId);
      
      if (offlineRecords.length === 0) {
        this.syncInProgress = false;
        return { success: 0, failed: 0 };
      }

      let successCount = 0;
      let failedCount = 0;

      console.log(`بدء مزامنة ${offlineRecords.length} سجل...`);

      for (const record of offlineRecords) {
        try {
          await this.syncSingleRecord(record);
          
          // تحديث حالة المزامنة
          await supabase
            .from('offline_data')
            .update({
              sync_status: 'synced',
              last_sync_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', record.id);

          successCount++;
          console.log(`تم مزامنة: ${record.data_type} ${record.data_id}`);
        } catch (error) {
          console.error(`فشل في مزامنة ${record.data_type} ${record.data_id}:`, error);
          
          // تحديث حالة الفشل
          await supabase
            .from('offline_data')
            .update({
              sync_status: 'failed',
              updated_at: new Date().toISOString()
            })
            .eq('id', record.id);

          failedCount++;
        }
      }

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
    } catch (error) {
      console.error('خطأ في المزامنة:', error);
      this.syncInProgress = false;
      return { success: 0, failed: 0 };
    }
  }

  /**
   * مزامنة سجل واحد
   */
  private async syncSingleRecord(record: OfflineRecord): Promise<void> {
    const { data_type, data_content } = record;

    switch (data_type) {
      case 'invoices':
        await this.syncToTable('invoices', data_content);
        break;
      case 'customers':
        await this.syncToTable('customers', data_content);
        break;
      case 'products':
        await this.syncToTable('products', data_content);
        break;
      case 'purchase_invoices':
        await this.syncToTable('purchase_invoices', data_content);
        break;
      case 'cash_transactions':
        await this.syncToTable('cash_transactions', data_content);
        break;
      case 'suppliers':
        await this.syncToTable('suppliers', data_content);
        break;
      case 'employees':
        await this.syncToTable('employees', data_content);
        break;
      default:
        console.warn(`نوع بيانات غير معروف: ${data_type}`);
    }
  }

  /**
   * مزامنة البيانات إلى جدول محدد
   */
  private async syncToTable(tableName: string, data: any): Promise<void> {
    // استخدام any للتعامل مع الجداول المختلفة
    const { error } = await (supabase as any)
      .from(tableName)
      .upsert(data, { onConflict: 'id' });

    if (error) {
      throw new Error(`فشل في مزامنة ${tableName}: ${error.message}`);
    }
  }

  /**
   * حذف البيانات المتزامنة
   */
  async clearSyncedData(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('offline_data')
        .delete()
        .eq('user_id', userId)
        .eq('sync_status', 'synced');

      if (error) {
        console.error('خطأ في حذف البيانات المتزامنة:', error);
        return false;
      }

      toast({
        title: "تم مسح البيانات",
        description: "تم حذف البيانات المتزامنة بنجاح",
      });

      return true;
    } catch (error) {
      console.error('خطأ في العملية:', error);
      return false;
    }
  }

  /**
   * إحصائيات المزامنة
   */
  async getSyncStats(userId: string): Promise<{
    pending: number;
    synced: number;
    failed: number;
    total: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('offline_data')
        .select('sync_status')
        .eq('user_id', userId);

      if (error) {
        console.error('خطأ في جلب إحصائيات المزامنة:', error);
        return { pending: 0, synced: 0, failed: 0, total: 0 };
      }

      const stats = {
        pending: 0,
        synced: 0,
        failed: 0,
        total: data?.length || 0
      };

      data?.forEach(record => {
        stats[record.sync_status as keyof typeof stats]++;
      });

      return stats;
    } catch (error) {
      console.error('خطأ في العملية:', error);
      return { pending: 0, synced: 0, failed: 0, total: 0 };
    }
  }

  /**
   * فحص حالة الاتصال وبدء المزامنة التلقائية
   */
  startAutoSync(userId: string): void {
    // مزامنة عند عودة الاتصال
    window.addEventListener('online', () => {
      console.log('عاد الاتصال - بدء المزامنة التلقائية');
      setTimeout(() => this.syncOfflineData(userId), 2000);
    });

    // مزامنة دورية كل 5 دقائق
    setInterval(async () => {
      if (navigator.onLine) {
        const stats = await this.getSyncStats(userId);
        if (stats.pending > 0) {
          this.syncOfflineData(userId);
        }
      }
    }, 5 * 60 * 1000);
  }
}

// إنشاء مثيل واحد
export const supabaseOfflineSync = SupabaseOfflineSync.getInstance();

// دوال مساعدة للاستخدام السهل
export const saveOfflineData = (
  dataType: string,
  dataId: string,
  dataContent: any,
  userId: string
) => supabaseOfflineSync.saveOfflineData(dataType, dataId, dataContent, userId);

export const syncOfflineData = (userId: string) => supabaseOfflineSync.syncOfflineData(userId);

export const getOfflineStats = (userId: string) => supabaseOfflineSync.getSyncStats(userId);

export const clearSyncedData = (userId: string) => supabaseOfflineSync.clearSyncedData(userId);

export const startAutoSync = (userId: string) => supabaseOfflineSync.startAutoSync(userId);