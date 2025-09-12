import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/hooks/use-toast';

export interface AutoBackupSettings {
  id?: string;
  enabled: boolean;
  backup_interval: 'daily' | 'weekly' | 'monthly';
  backup_time: string;
  retention_days: number;
  include_tables: string[];
  backup_location: 'local' | 'google_drive';
  next_backup_date?: string;
  last_backup_date?: string;
}

const defaultSettings: AutoBackupSettings = {
  enabled: false,
  backup_interval: 'daily',
  backup_time: '02:00:00',
  retention_days: 30,
  include_tables: ['invoices', 'customers', 'products', 'cash_transactions'],
  backup_location: 'local'
};

export function useAutoBackupSettings() {
  const [settings, setSettings] = useState<AutoBackupSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const { user } = useSupabaseAuth();

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('auto_backup_settings')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({
          id: data.id,
          enabled: data.enabled,
          backup_interval: data.backup_interval as 'daily' | 'weekly' | 'monthly',
          backup_time: data.backup_time,
          retention_days: data.retention_days,
          include_tables: data.include_tables || defaultSettings.include_tables,
          backup_location: (data.backup_location as 'local' | 'google_drive') || 'local',
          next_backup_date: data.next_backup_date,
          last_backup_date: data.last_backup_date
        });
      } else {
        // إنشاء إعدادات افتراضية
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('خطأ في تحميل إعدادات النسخ الاحتياطي:', error);
      toast({
        title: "خطأ في التحميل",
        description: "حدث خطأ أثناء تحميل إعدادات النسخ الاحتياطي",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: Partial<AutoBackupSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      
      const { data, error } = await supabase
        .from('auto_backup_settings')
        .upsert({
          user_id: user?.id,
          enabled: updatedSettings.enabled,
          backup_interval: updatedSettings.backup_interval,
          backup_time: updatedSettings.backup_time,
          retention_days: updatedSettings.retention_days,
          include_tables: updatedSettings.include_tables,
          backup_location: updatedSettings.backup_location
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) throw error;

      setSettings({
        ...updatedSettings,
        id: data.id,
        next_backup_date: data.next_backup_date,
        last_backup_date: data.last_backup_date
      });

      toast({
        title: "تم حفظ الإعدادات",
        description: "تم حفظ إعدادات النسخ الاحتياطي التلقائي بنجاح",
      });

      return true;
    } catch (error) {
      console.error('خطأ في حفظ إعدادات النسخ الاحتياطي:', error);
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ إعدادات النسخ الاحتياطي",
        variant: "destructive"
      });
      return false;
    }
  };

  const getBackupLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('auto_backup_logs')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('خطأ في جلب سجلات النسخ الاحتياطي:', error);
      return [];
    }
  };

  const triggerManualBackup = async () => {
    try {
      // استدعاء Edge Function للنسخ الاحتياطي اليدوي
      const { data, error } = await supabase.functions.invoke('auto-backup', {
        body: { type: 'manual', user_id: user?.id }
      });

      if (error) throw error;

      toast({
        title: "تم بدء النسخ الاحتياطي",
        description: "تم بدء عملية النسخ الاحتياطي اليدوي",
      });

      return data;
    } catch (error) {
      console.error('خطأ في تشغيل النسخ الاحتياطي اليدوي:', error);
      toast({
        title: "خطأ في النسخ الاحتياطي",
        description: "حدث خطأ أثناء بدء النسخ الاحتياطي",
        variant: "destructive"
      });
      return null;
    }
  };

  return {
    settings,
    loading,
    saveSettings,
    getBackupLogs,
    triggerManualBackup,
    refetchSettings: loadSettings
  };
}