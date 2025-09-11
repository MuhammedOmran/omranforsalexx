import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UserSession {
  id: string;
  user_id: string;
  device_id: string;
  session_token: string;
  is_active: boolean;
  created_at: string;
  last_activity: string;
  expires_at: string;
  device_name?: string;
  ip_address?: string;
  user_agent?: string;
  location?: string;
}

// إنشاء جلسة جديدة
export const createUserSession = async (userId: string): Promise<boolean> => {
  try {
    // الحصول على معلومات الجهاز والمتصفح
    const deviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    // تحديد نوع الجهاز
    const getDeviceName = () => {
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
        return 'هاتف محمول';
      }
      if (ua.includes('tablet') || ua.includes('ipad')) {
        return 'جهاز لوحي';
      }
      return 'جهاز كمبيوتر';
    };

    // إنشاء معرف فريد للجهاز
    const deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // إنشاء رمز الجلسة
    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
    
    // حفظ رمز الجلسة في localStorage
    localStorage.setItem('session_token', sessionToken);
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 يوم

    const { error } = await supabase
      .from('user_sessions')
      .insert({
        user_id: userId,
        device_id: deviceId,
        session_token: sessionToken,
        device_name: getDeviceName(),
        user_agent: navigator.userAgent,
        is_active: true,
        expires_at: expiresAt.toISOString(),
        device_info: deviceInfo
      } as any); // استخدام any مؤقتاً حتى تحديث types

    if (error) {
      console.error('خطأ في إنشاء الجلسة:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('خطأ في إنشاء الجلسة:', error);
    return false;
  }
};

// جلب جلسات المستخدم
export const getUserSessions = async (userId: string): Promise<UserSession[]> => {
  try {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []) as UserSession[];
  } catch (error) {
    console.error('خطأ في جلب الجلسات:', error);
    toast.error('فشل في تحميل الجلسات');
    return [];
  }
};

// إنهاء جلسة محددة
export const terminateUserSession = async (userId: string, sessionId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_sessions')
      .update({ 
        is_active: false, 
        last_activity: new Date().toISOString() 
      })
      .eq('id', sessionId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('خطأ في إنهاء الجلسة:', error);
    return false;
  }
};

// إنهاء جميع الجلسات الأخرى
export const terminateAllOtherSessions = async (userId: string): Promise<boolean> => {
  try {
    const currentSessionToken = localStorage.getItem('session_token');
    
    const { error } = await supabase
      .from('user_sessions')
      .update({ 
        is_active: false, 
        last_activity: new Date().toISOString() 
      })
      .eq('user_id', userId)
      .neq('session_token', currentSessionToken || '');

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('خطأ في إنهاء الجلسات:', error);
    return false;
  }
};

// تحديث نشاط الجلسة
export const updateUserSessionActivity = async (userId: string): Promise<void> => {
  try {
    const sessionToken = localStorage.getItem('session_token');
    
    if (!sessionToken) return;

    const { error } = await supabase
      .from('user_sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('session_token', sessionToken);

    if (error) {
      console.error('خطأ في تحديث نشاط الجلسة:', error);
    }
  } catch (error) {
    console.error('خطأ في تحديث نشاط الجلسة:', error);
  }
};

// تنظيف الجلسات المنتهية الصلاحية
export const cleanupExpiredSessions = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('user_id', userId)
      .lt('expires_at', new Date().toISOString());

    if (error) {
      console.error('خطأ في تنظيف الجلسات المنتهية:', error);
    }
  } catch (error) {
    console.error('خطأ في تنظيف الجلسات المنتهية:', error);
  }
};