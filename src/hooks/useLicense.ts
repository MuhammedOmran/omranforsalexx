import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';

interface LicenseInfo {
  has_active_license: boolean;
  license_type: string | null;
  end_date: string | null;
  days_remaining: number;
}

export const useLicense = () => {
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo>({
    has_active_license: false,
    license_type: null,
    end_date: null,
    days_remaining: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useSupabaseAuth();

  const checkLicense = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // استدعاء دالة فحص الترخيص
      const { data, error: licenseError } = await supabase
        .rpc('check_user_license', {
          p_user_id: user.id
        });

      if (licenseError) {
        console.error('خطأ في فحص الترخيص:', licenseError);
        setError('فشل في فحص الترخيص');
        return;
      }

      // إذا لم توجد بيانات، قم بإنشاء ترخيص افتراضي
      if (!data || data.length === 0) {
        console.log('لا يوجد ترخيص، استخدام الترخيص الافتراضي');
        setLicenseInfo({
          has_active_license: false,
          license_type: 'free',
          end_date: null,
          days_remaining: 30
        });
      } else {
        const license = data[0];
        setLicenseInfo({
          has_active_license: license.has_active_license || false,
          license_type: license.license_type || 'free',
          end_date: license.end_date,
          days_remaining: Math.max(0, license.days_remaining || 0)
        });
      }
    } catch (err) {
      console.error('خطأ غير متوقع في فحص الترخيص:', err);
      setError('خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const addLicense = async (durationDays: number, licenseType: string = 'yearly') => {
    if (!user?.id) {
      throw new Error('المستخدم غير مسجل الدخول');
    }

    try {
      const { data, error } = await supabase
        .rpc('add_user_license', {
          p_user_id: user.id,
          p_duration_days: durationDays,
          p_license_type: licenseType
        } as any);

      if (error) {
        throw new Error(`فشل في إضافة الترخيص: ${error.message}`);
      }

      // إعادة فحص الترخيص بعد الإضافة
      await checkLicense();
      return data;
    } catch (err) {
      console.error('خطأ في إضافة الترخيص:', err);
      throw err;
    }
  };

  const extendLicense = async (additionalDays: number) => {
    if (!user?.id) {
      throw new Error('المستخدم غير مسجل الدخول');
    }

    try {
      const { data, error } = await supabase
        .rpc('extend_user_license', {
          p_user_id: user.id,
          p_additional_days: additionalDays
        });

      if (error) {
        throw new Error(`فشل في تمديد الترخيص: ${error.message}`);
      }

      // إعادة فحص الترخيص بعد التمديد
      await checkLicense();
      return data;
    } catch (err) {
      console.error('خطأ في تمديد الترخيص:', err);
      throw err;
    }
  };

  useEffect(() => {
    checkLicense();
  }, [user?.id]);

  return {
    licenseInfo,
    loading,
    error,
    checkLicense,
    addLicense,
    extendLicense,
    refreshLicense: checkLicense
  };
};