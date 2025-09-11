import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface OfflineDataItem {
  id: string;
  user_id: string;
  data_type: string;
  data_id: string;
  data_content: any;
  sync_status: 'pending' | 'synced' | 'error';
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

export const useOfflineData = () => {
  const { user } = useSupabaseAuth();
  const [offlineData, setOfflineData] = useState<OfflineDataItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // جلب البيانات الأوف لاين
  const fetchOfflineData = async (dataType?: string) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('offline_data')
        .select('*')
        .eq('user_id', user.id);

      if (dataType) {
        query = query.eq('data_type', dataType);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setOfflineData((data || []) as OfflineDataItem[]);
    } catch (err) {
      console.error('Error fetching offline data:', err);
      setError('فشل في جلب البيانات الأوف لاين');
    } finally {
      setLoading(false);
    }
  };

  // حفظ بيانات أوف لاين
  const saveOfflineData = async (
    dataType: string,
    dataId: string,
    dataContent: any
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('offline_data')
        .upsert({
          user_id: user.id,
          data_type: dataType,
          data_id: dataId,
          data_content: dataContent,
          sync_status: 'pending'
        }, {
          onConflict: 'user_id,data_type,data_id'
        });

      if (error) throw error;

      await fetchOfflineData();
      return true;
    } catch (error) {
      console.error('Error saving offline data:', error);
      setError('فشل في حفظ البيانات الأوف لاين');
      return false;
    }
  };

  // تحديث حالة المزامنة
  const updateSyncStatus = async (
    id: string,
    syncStatus: 'pending' | 'synced' | 'error'
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('offline_data')
        .update({
          sync_status: syncStatus,
          last_sync_at: syncStatus === 'synced' ? new Date().toISOString() : undefined
        })
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      await fetchOfflineData();
      return true;
    } catch (error) {
      console.error('Error updating sync status:', error);
      setError('فشل في تحديث حالة المزامنة');
      return false;
    }
  };

  // حذف بيانات أوف لاين
  const deleteOfflineData = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('offline_data')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      await fetchOfflineData();
      return true;
    } catch (error) {
      console.error('Error deleting offline data:', error);
      setError('فشل في حذف البيانات الأوف لاين');
      return false;
    }
  };

  // مزامنة جميع البيانات المعلقة
  const syncPendingData = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const pendingData = offlineData.filter(item => item.sync_status === 'pending');
      
      for (const item of pendingData) {
        // هنا يمكن إضافة منطق المزامنة حسب نوع البيانات
        await updateSyncStatus(item.id, 'synced');
      }

      return true;
    } catch (error) {
      console.error('Error syncing data:', error);
      setError('فشل في مزامنة البيانات');
      return false;
    }
  };

  // إحصائيات البيانات الأوف لاين
  const getStats = () => {
    return {
      total: offlineData.length,
      pending: offlineData.filter(item => item.sync_status === 'pending').length,
      synced: offlineData.filter(item => item.sync_status === 'synced').length,
      errors: offlineData.filter(item => item.sync_status === 'error').length
    };
  };

  // جلب البيانات عند تحميل المكون
  useEffect(() => {
    fetchOfflineData();
  }, [user]);

  return {
    offlineData,
    loading,
    error,
    stats: getStats(),
    fetchOfflineData,
    saveOfflineData,
    updateSyncStatus,
    deleteOfflineData,
    syncPendingData
  };
};