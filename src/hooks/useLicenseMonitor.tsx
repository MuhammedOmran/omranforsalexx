import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LicenseManager } from '@/utils/licenseManager';
import { toast } from 'sonner';

export function useLicenseMonitor() {
  const [isLicenseValid, setIsLicenseValid] = useState<boolean>(true);
  const [daysRemaining, setDaysRemaining] = useState<number>(0);
  const [licenseType, setLicenseType] = useState<string>('');
  const { logout, user } = useAuth();

  useEffect(() => {
    // تجاهل فحص التراخيص للمستخدم المطور
    if (user?.id === 'developer-omrani') {
      setIsLicenseValid(true);
      return;
    }

    const checkLicense = async () => {
      try {
        const validation = await LicenseManager.validateLicense();
        
        if (!validation.isValid) {
          setIsLicenseValid(false);
          toast.error(validation.error || 'انتهت صلاحية الترخيص');
          
          // تسجيل خروج فوري عند انتهاء الترخيص
          setTimeout(() => {
            logout();
            // مسح جميع البيانات المحلية
            localStorage.clear();
          }, 2000);
          
          return;
        }

        setIsLicenseValid(true);
        setDaysRemaining(validation.daysRemaining || 0);
        setLicenseType(validation.license?.type || '');

        // تحذير عند اقتراب انتهاء الترخيص
        if (validation.daysRemaining && validation.daysRemaining <= 7) {
          if (validation.daysRemaining <= 3) {
            toast.error(`تبقى ${validation.daysRemaining} أيام على انتهاء الترخيص!`);
          } else {
            toast.warning(`تبقى ${validation.daysRemaining} أيام على انتهاء الترخيص`);
          }
        }

      } catch (error) {
        console.error('خطأ في فحص الترخيص:', error);
        setIsLicenseValid(false);
      }
    };

    // فحص فوري عند بدء التطبيق
    checkLicense();

    // فحص دوري كل 5 دقائق
    const interval = setInterval(() => {
      checkLicense();
    }, 5 * 60 * 1000);

    // فحص يومي في الساعة 9 صباحاً
    const now = new Date();
    const nextCheck = new Date();
    nextCheck.setHours(9, 0, 0, 0);
    
    if (nextCheck <= now) {
      nextCheck.setDate(nextCheck.getDate() + 1);
    }
    
    const timeUntilNextCheck = nextCheck.getTime() - now.getTime();
    
    const dailyTimeout = setTimeout(() => {
      checkLicense();
      
      // تعيين فحص يومي
      const dailyInterval = setInterval(() => {
        checkLicense();
      }, 24 * 60 * 60 * 1000);
      
      return () => clearInterval(dailyInterval);
    }, timeUntilNextCheck);

    return () => {
      clearInterval(interval);
      clearTimeout(dailyTimeout);
    };
  }, [user, logout]);

  return {
    isLicenseValid,
    daysRemaining,
    licenseType
  };
}