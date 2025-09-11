import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';

interface SettingValue {
  [key: string]: any;
}

export const useAppSettings = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useSupabaseAuth();

  // جلب إعداد محدد
  const getSetting = useCallback(async (category: string, settingKey: string): Promise<any> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('user_id', user.id)
        .eq('category', category)
        .eq('setting_key', settingKey)
        .maybeSingle();

      if (error) throw error;
      return data?.setting_value || null;
    } catch (err: any) {
      console.error('Error getting setting:', err);
      setError(err.message);
      return null;
    }
  }, [user]);

  // جلب جميع إعدادات فئة معينة
  const getCategorySettings = useCallback(async (category: string): Promise<SettingValue> => {
    if (!user) return {};

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_key, setting_value')
        .eq('user_id', user.id)
        .eq('category', category);

      if (error) throw error;

      const settings: SettingValue = {};
      data?.forEach((item) => {
        settings[item.setting_key] = item.setting_value;
      });

      return settings;
    } catch (err: any) {
      console.error('Error getting category settings:', err);
      setError(err.message);
      return {};
    } finally {
      setLoading(false);
    }
  }, [user]);

  // حفظ إعداد واحد
  const setSetting = useCallback(async (
    category: string, 
    settingKey: string, 
    value: any, 
    isEncrypted: boolean = false
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      setLoading(true);
      setError(null);

      // التأكد من أن القيمة ليست null أو undefined
      let sanitizedValue = value;
      if (value === null || value === undefined) {
        sanitizedValue = {};
      }

      const { error } = await supabase
        .from('app_settings')
        .upsert({
          user_id: user.id,
          category,
          setting_key: settingKey,
          setting_value: sanitizedValue,
          is_encrypted: isEncrypted,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,category,setting_key'
        });

      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error('Error setting:', err);
      setError(err.message);
      toast.error('فشل في حفظ الإعداد: ' + err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // حفظ عدة إعدادات في فئة واحدة
  const setCategorySettings = useCallback(async (
    category: string, 
    settings: SettingValue, 
    isEncrypted: boolean = false
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      setLoading(true);
      setError(null);

      const settingsToUpsert = Object.entries(settings).map(([key, value]) => {
        // التأكد من أن القيمة ليست null أو undefined
        let sanitizedValue = value;
        if (value === null || value === undefined) {
          sanitizedValue = {};
        }
        
        return {
          user_id: user.id,
          category,
          setting_key: key,
          setting_value: sanitizedValue,
          is_encrypted: isEncrypted,
          updated_at: new Date().toISOString()
        };
      });

      const { error } = await supabase
        .from('app_settings')
        .upsert(settingsToUpsert, {
          onConflict: 'user_id,category,setting_key'
        });

      if (error) throw error;
      
      toast.success('تم حفظ الإعدادات بنجاح');
      return true;
    } catch (err: any) {
      console.error('Error setting category:', err);
      setError(err.message);
      toast.error('فشل في حفظ الإعدادات: ' + err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // حذف إعداد
  const deleteSetting = useCallback(async (category: string, settingKey: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('app_settings')
        .delete()
        .eq('user_id', user.id)
        .eq('category', category)
        .eq('setting_key', settingKey);

      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error('Error deleting setting:', err);
      setError(err.message);
      return false;
    }
  }, [user]);

  // حذف جميع إعدادات فئة
  const deleteCategorySettings = useCallback(async (category: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('app_settings')
        .delete()
        .eq('user_id', user.id)
        .eq('category', category);

      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error('Error deleting category:', err);
      setError(err.message);
      return false;
    }
  }, [user]);

  // جلب جميع الإعدادات
  const getAllSettings = useCallback(async (): Promise<Record<string, SettingValue>> => {
    if (!user) return {};

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('app_settings')
        .select('category, setting_key, setting_value')
        .eq('user_id', user.id);

      if (error) throw error;

      const categorizedSettings: Record<string, SettingValue> = {};
      data?.forEach((item) => {
        if (!categorizedSettings[item.category]) {
          categorizedSettings[item.category] = {};
        }
        categorizedSettings[item.category][item.setting_key] = item.setting_value;
      });

      return categorizedSettings;
    } catch (err: any) {
      console.error('Error getting all settings:', err);
      setError(err.message);
      return {};
    } finally {
      setLoading(false);
    }
  }, [user]);

  // تصدير جميع الإعدادات
  const exportAllSettings = useCallback(async (): Promise<string | null> => {
    const allSettings = await getAllSettings();
    if (Object.keys(allSettings).length === 0) return null;

    try {
      return JSON.stringify(allSettings, null, 2);
    } catch (err) {
      console.error('Error exporting settings:', err);
      return null;
    }
  }, [getAllSettings]);

  // استيراد الإعدادات
  const importSettings = useCallback(async (settingsJson: string): Promise<boolean> => {
    if (!user) return false;

    try {
      setLoading(true);
      const settings = JSON.parse(settingsJson);
      
      const settingsToUpsert: any[] = [];
      
      Object.entries(settings).forEach(([category, categorySettings]) => {
        if (typeof categorySettings === 'object' && categorySettings !== null) {
          Object.entries(categorySettings as SettingValue).forEach(([key, value]) => {
            // التأكد من أن القيمة ليست null أو undefined
            let sanitizedValue = value;
            if (value === null || value === undefined) {
              sanitizedValue = {};
            }
            
            settingsToUpsert.push({
              user_id: user.id,
              category,
              setting_key: key,
              setting_value: sanitizedValue,
              is_encrypted: false,
              updated_at: new Date().toISOString()
            });
          });
        }
      });

      if (settingsToUpsert.length > 0) {
        const { error } = await supabase
          .from('app_settings')
          .upsert(settingsToUpsert, {
            onConflict: 'user_id,category,setting_key'
          });

        if (error) throw error;
      }

      toast.success('تم استيراد الإعدادات بنجاح');
      return true;
    } catch (err: any) {
      console.error('Error importing settings:', err);
      setError(err.message);
      toast.error('فشل في استيراد الإعدادات: ' + err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    loading,
    error,
    getSetting,
    getCategorySettings,
    setSetting,
    setCategorySettings,
    deleteSetting,
    deleteCategorySettings,
    getAllSettings,
    exportAllSettings,
    importSettings
  };
};