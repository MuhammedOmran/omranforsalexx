import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

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
}

export interface SessionStats {
  active: number;
  inactive: number;
  total: number;
}

export function useSessionManager() {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [stats, setStats] = useState<SessionStats>({ active: 0, inactive: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const { user } = useSupabaseAuth();

  const fetchSessions = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // جلب الجلسات من Supabase
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const userSessions = (data || []).map(session => ({
        ...session,
        ip_address: session.ip_address?.toString() || ''
      }));
      setSessions(userSessions);

      // حساب الإحصائيات
      const activeSessions = userSessions.filter(s => s.is_active);
      const inactiveSessions = userSessions.filter(s => !s.is_active);
      
      setStats({
        active: activeSessions.length,
        inactive: inactiveSessions.length,
        total: userSessions.length
      });

    } catch (error) {
      console.error('خطأ في جلب الجلسات:', error);
      toast.error('حدث خطأ في جلب الجلسات');
    } finally {
      setLoading(false);
    }
  };

  const terminateSession = async (sessionId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ 
          is_active: false, 
          last_activity: new Date().toISOString() 
        })
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast.success('تم إنهاء الجلسة بنجاح');
      await fetchSessions();
      return true;
    } catch (error) {
      console.error('خطأ في إنهاء الجلسة:', error);
      toast.error('حدث خطأ في إنهاء الجلسة');
      return false;
    }
  };

  const terminateAllOtherSessions = async () => {
    if (!user) return false;

    try {
      const currentSessionToken = localStorage.getItem('session_token');
      
      const { error } = await supabase
        .from('user_sessions')
        .update({ 
          is_active: false, 
          last_activity: new Date().toISOString() 
        })
        .eq('user_id', user.id)
        .neq('session_token', currentSessionToken || '');

      if (error) throw error;
      
      toast.success('تم تسجيل الخروج من جميع الأجهزة الأخرى');
      await fetchSessions();
      return true;
    } catch (error) {
      console.error('خطأ في إنهاء الجلسات:', error);
      toast.error('حدث خطأ في إنهاء الجلسات');
      return false;
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return {
    sessions,
    stats,
    loading,
    fetchSessions,
    terminateSession,
    terminateAllOtherSessions
  };
}