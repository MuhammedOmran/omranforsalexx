import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { createUserSession, updateUserSessionActivity, cleanupExpiredSessions } from '@/utils/sessionManager';

export interface SecureUserSession {
  id: string;
  user_id: string;
  device_id: string;
  device_name?: string;
  session_token: string;
  is_active: boolean;
  created_at: string;
  last_activity: string;
  ip_address?: string | null;
  user_agent?: string | null;
  location?: string | null;
  expires_at?: string;
  device_info?: any;
}

export const useSecureSessionManager = () => {
  const { user } = useSupabaseAuth();
  const [sessions, setSessions] = useState<SecureUserSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // جلب جميع الجلسات النشطة للمستخدم
  const fetchActiveSessions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      // تنظيف الجلسات المنتهية أولاً
      await cleanupExpiredSessions(user.id);
      
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const sessionsData = (data || []) as SecureUserSession[];
      
      // إذا لم توجد جلسات، قم بإنشاء جلسة للمستخدم الحالي
      if (sessionsData.length === 0) {
        const created = await createUserSession(user.id);
        if (created) {
          // جلب الجلسات مرة أخرى بعد الإنشاء
          const { data: newData, error: newError } = await supabase
            .from('user_sessions')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .order('created_at', { ascending: false });
            
          if (!newError && newData) {
            setSessions(newData as SecureUserSession[]);
          }
        }
      } else {
        setSessions(sessionsData);
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError('فشل في جلب الجلسات النشطة');
    } finally {
      setLoading(false);
    }
  };

  // إنهاء جلسة محددة
  const terminateSession = async (sessionId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false, last_activity: new Date().toISOString() })
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('تم إنهاء الجلسة بنجاح');
      await fetchActiveSessions(); // إعادة تحميل القائمة
      return true;
    } catch (error) {
      console.error('Error terminating session:', error);
      setError('فشل في إنهاء الجلسة');
      toast.error('فشل في إنهاء الجلسة');
      return false;
    }
  };

  // إنهاء جميع الجلسات عدا الحالية
  const terminateAllOtherSessions = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      // الحصول على معرف الجلسة الحالية
      const currentSessionToken = localStorage.getItem('session_token');
      
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false, last_activity: new Date().toISOString() })
        .eq('user_id', user.id)
        .neq('session_token', currentSessionToken || '');

      if (error) throw error;

      toast.success('تم إنهاء جميع الجلسات الأخرى');
      await fetchActiveSessions(); // إعادة تحميل القائمة
      return true;
    } catch (error) {
      console.error('Error terminating other sessions:', error);
      setError('فشل في إنهاء الجلسات الأخرى');
      toast.error('فشل في إنهاء الجلسات الأخرى');
      return false;
    }
  };

  // تحديث نشاط الجلسة الحالية
  const updateCurrentSessionActivity = async (): Promise<void> => {
    if (!user) return;
    await updateUserSessionActivity(user.id);
  };

  // فحص الجلسات المشبوهة
  const detectSuspiciousSessions = (): SecureUserSession[] => {
    const now = new Date();
    const suspiciousSessions = sessions.filter(session => {
      const lastActivity = new Date(session.last_activity);
      const hoursSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);
      
      // جلسة مشبوهة إذا لم يكن هناك نشاط لأكثر من 24 ساعة ولكنها لا تزال نشطة
      return hoursSinceActivity > 24 && session.is_active;
    });

    return suspiciousSessions;
  };

  // إعداد تحديث دوري لنشاط الجلسة
  useEffect(() => {
    if (!user) return;

    // تحديث النشاط كل 5 دقائق
    const interval = setInterval(updateCurrentSessionActivity, 5 * 60 * 1000);

    // تحديث فوري عند تحميل المكون
    updateCurrentSessionActivity();

    return () => clearInterval(interval);
  }, [user]);

  // جلب الجلسات عند تحميل المكون
  useEffect(() => {
    fetchActiveSessions();
  }, [user]);

  return {
    sessions,
    loading,
    error,
    stats: { activeSessions: sessions.length, suspiciousSessions: detectSuspiciousSessions().length },
    fetchActiveSessions,
    fetchSessions: fetchActiveSessions,
    terminateSession,
    terminateAllOtherSessions,
    updateSessionActivity: updateCurrentSessionActivity,
    detectSuspiciousSessions
  };
};