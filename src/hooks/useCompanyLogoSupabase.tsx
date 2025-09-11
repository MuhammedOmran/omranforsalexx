import { useState, useEffect } from 'react';
import { useCompanyLogos } from '@/hooks/useCompanyLogos';
import { useToast } from '@/hooks/use-toast';

export interface SupabaseCompanyLogo {
  id: string;
  company_name: string;
  logo_url: string;
  is_active: boolean;
}

export const useCompanyLogoSupabase = () => {
  const { logos, loading, uploadLogo, toggleLogoStatus, getActiveLogo } = useCompanyLogos();
  const [currentLogo, setCurrentLogo] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    const activeLogo = getActiveLogo();
    if (activeLogo) {
      setCurrentLogo(activeLogo.logo_url);
      // حفظ في localStorage للمزامنة مع النظام الحالي
      const companySettings = JSON.parse(localStorage.getItem('company_settings') || '{}');
      companySettings.logo = activeLogo.logo_url;
      localStorage.setItem('company_settings', JSON.stringify(companySettings));
    }
  }, [logos, getActiveLogo]);

  const uploadCompanyLogo = async (file: File, companyName: string = 'الشركة') => {
    try {
      const result = await uploadLogo(file, companyName);
      if (result) {
        setCurrentLogo(result.logo_url);
        // تحديث localStorage
        const companySettings = JSON.parse(localStorage.getItem('company_settings') || '{}');
        companySettings.logo = result.logo_url;
        companySettings.name = companyName;
        localStorage.setItem('company_settings', JSON.stringify(companySettings));
        
        toast({
          title: "تم رفع الشعار بنجاح",
          description: "تم حفظ الشعار في Supabase وسيظهر في جميع الفواتير",
        });
        
        return result;
      }
    } catch (error) {
      console.error('خطأ في رفع الشعار:', error);
      toast({
        title: "خطأ في رفع الشعار",
        description: "فشل في رفع الشعار إلى السحابة",
        variant: "destructive",
      });
    }
  };

  const setLogoFromUrl = (logoUrl: string, companyName: string = 'الشركة') => {
    setCurrentLogo(logoUrl);
    // تحديث localStorage
    const companySettings = JSON.parse(localStorage.getItem('company_settings') || '{}');
    companySettings.logo = logoUrl;
    companySettings.name = companyName;
    localStorage.setItem('company_settings', JSON.stringify(companySettings));
    
    toast({
      title: "تم تحديث الشعار",
      description: "تم حفظ رابط الشعار وسيظهر في جميع الفواتير",
    });
  };

  const getCurrentLogo = () => {
    // أولوية للشعار النشط من Supabase
    const activeLogo = getActiveLogo();
    if (activeLogo) {
      return activeLogo.logo_url;
    }
    
    // fallback إلى localStorage
    try {
      const companySettings = JSON.parse(localStorage.getItem('company_settings') || '{}');
      return companySettings.logo || '';
    } catch {
      return '';
    }
  };

  return {
    currentLogo: getCurrentLogo(),
    logos,
    loading,
    uploadCompanyLogo,
    setLogoFromUrl,
    toggleLogoStatus,
    getActiveLogo
  };
};