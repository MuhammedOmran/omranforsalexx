import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CompanyLogo {
  id: string;
  user_id: string;
  company_name: string;
  logo_url: string;
  logo_filename: string;
  file_size?: number;
  mime_type?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useCompanyLogos = () => {
  const [logos, setLogos] = useState<CompanyLogo[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  // جلب شعارات الشركة
  const fetchLogos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('company_logos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogos(data || []);
    } catch (error: any) {
      console.error('خطأ في جلب الشعارات:', error);
      toast({
        title: "خطأ في تحميل الشعارات",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // رفع شعار جديد
  const uploadLogo = async (file: File, companyName: string) => {
    try {
      setUploading(true);
      
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('يجب تسجيل الدخول أولاً');

      // التحقق من نوع الملف
      if (!file.type.startsWith('image/')) {
        throw new Error('يجب أن يكون الملف صورة');
      }

      // التحقق من حجم الملف (5MB كحد أقصى)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('حجم الملف يجب أن يكون أقل من 5 ميجابايت');
      }

      // إنشاء اسم ملف فريد
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // رفع الملف إلى Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // الحصول على URL الشعار
      const { data: publicUrlData } = supabase.storage
        .from('company-logos')
        .getPublicUrl(fileName);

      // حفظ معلومات الشعار في قاعدة البيانات
      const { data, error } = await supabase
        .from('company_logos')
        .insert({
          user_id: user.id,
          company_name: companyName,
          logo_url: publicUrlData.publicUrl,
          logo_filename: file.name,
          file_size: file.size,
          mime_type: file.type,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      // تحديث القائمة المحلية
      setLogos(prev => [data, ...prev]);

      toast({
        title: "تم رفع الشعار بنجاح",
        description: `تم رفع شعار ${companyName} بنجاح`,
      });

      return data;
    } catch (error: any) {
      console.error('خطأ في رفع الشعار:', error);
      toast({
        title: "خطأ في رفع الشعار",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  // حذف شعار
  const deleteLogo = async (logoId: string) => {
    try {
      const logo = logos.find(l => l.id === logoId);
      if (!logo) return;

      // حذف من Storage
      const fileName = logo.logo_url.split('/').pop();
      if (fileName) {
        const user = (await supabase.auth.getUser()).data.user;
        if (user) {
          await supabase.storage
            .from('company-logos')
            .remove([`${user.id}/${fileName}`]);
        }
      }

      // حذف من قاعدة البيانات
      const { error } = await supabase
        .from('company_logos')
        .delete()
        .eq('id', logoId);

      if (error) throw error;

      // تحديث القائمة المحلية
      setLogos(prev => prev.filter(l => l.id !== logoId));

      toast({
        title: "تم حذف الشعار",
        description: "تم حذف الشعار بنجاح",
      });
    } catch (error: any) {
      console.error('خطأ في حذف الشعار:', error);
      toast({
        title: "خطأ في حذف الشعار",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // تفعيل/إلغاء تفعيل شعار
  const toggleLogoStatus = async (logoId: string) => {
    try {
      const logo = logos.find(l => l.id === logoId);
      if (!logo) return;

      const { data, error } = await supabase
        .from('company_logos')
        .update({ is_active: !logo.is_active })
        .eq('id', logoId)
        .select()
        .single();

      if (error) throw error;

      // تحديث القائمة المحلية
      setLogos(prev => prev.map(l => l.id === logoId ? data : l));

      toast({
        title: logo.is_active ? "تم إلغاء تفعيل الشعار" : "تم تفعيل الشعار",
        description: `تم ${logo.is_active ? 'إلغاء تفعيل' : 'تفعيل'} شعار ${logo.company_name}`,
      });
    } catch (error: any) {
      console.error('خطأ في تحديث حالة الشعار:', error);
      toast({
        title: "خطأ في تحديث الشعار",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // الحصول على الشعار النشط
  const getActiveLogo = () => {
    return logos.find(logo => logo.is_active);
  };

  useEffect(() => {
    fetchLogos();
  }, []);

  return {
    logos,
    loading,
    uploading,
    fetchLogos,
    uploadLogo,
    deleteLogo,
    toggleLogoStatus,
    getActiveLogo
  };
};