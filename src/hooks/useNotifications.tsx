import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';

export interface SupabaseNotification {
  id: string;
  user_id: string;
  company_id?: string;
  type: string; // تغيير من union type إلى string عام
  category: string;
  priority: string; // تغيير من union type إلى string عام
  title: string;
  message: string;
  action_required: boolean;
  action_url?: string;
  action_text?: string;
  related_entity_id?: string;
  related_entity_type?: string;
  auto_resolve: boolean;
  is_read: boolean;
  resolved_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationInput {
  type: string;
  category: string;
  priority: string;
  title: string;
  message: string;
  action_required?: boolean;
  action_url?: string;
  action_text?: string;
  related_entity_id?: string;
  related_entity_type?: string;
  auto_resolve?: boolean;
  expires_at?: string;
  company_id?: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<SupabaseNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useSupabaseAuth();

  // جلب الإشعارات من Supabase
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // إنشاء إشعار جديد
  const createNotification = useCallback(async (notificationData: CreateNotificationInput) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([
          {
            ...notificationData,
            user_id: user.id,
            is_read: false,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // إضافة الإشعار الجديد إلى القائمة المحلية
      setNotifications(prev => [data, ...prev]);

      // عرض تنبيه فوري للإشعارات الحرجة
      if (notificationData.priority === 'critical') {
        toast.error(notificationData.title, {
          description: notificationData.message,
        });
      } else if (notificationData.priority === 'high') {
        toast.warning(notificationData.title, {
          description: notificationData.message,
        });
      }

      return data;
    } catch (err: any) {
      console.error('Error creating notification:', err);
      toast.error('خطأ في إنشاء الإشعار');
      return null;
    }
  }, [user]);

  // تمييز إشعار كمقروء
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      toast.error('خطأ في تحديث الإشعار');
    }
  }, []);

  // تمييز جميع الإشعارات كمقروءة
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notification => ({ ...notification, is_read: true }))
      );

      toast.success('تم تمييز جميع الإشعارات كمقروءة');
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err);
      toast.error('خطأ في تحديث الإشعارات');
    }
  }, [user]);

  // حذف إشعار
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success('تم حذف الإشعار');
    } catch (err: any) {
      console.error('Error deleting notification:', err);
      toast.error('خطأ في حذف الإشعار');
    }
  }, []);

  // حذف جميع الإشعارات المقروءة
  const deleteReadNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .eq('is_read', true);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => !n.is_read));
      toast.success('تم حذف الإشعارات المقروءة');
    } catch (err: any) {
      console.error('Error deleting read notifications:', err);
      toast.error('خطأ في حذف الإشعارات');
    }
  }, [user]);

  // الاستماع للتحديثات الفورية
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New notification received:', payload);
          const newNotification = payload.new as SupabaseNotification;
          setNotifications(prev => [newNotification, ...prev]);

          // عرض تنبيه فوري
          if (newNotification.priority === 'critical') {
            toast.error(newNotification.title, {
              description: newNotification.message,
            });
          } else if (newNotification.priority === 'high') {
            toast.warning(newNotification.title, {
              description: newNotification.message,
            });
          } else {
            toast.info(newNotification.title, {
              description: newNotification.message,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Notification updated:', payload);
          const updatedNotification = payload.new as SupabaseNotification;
          setNotifications(prev =>
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Notification deleted:', payload);
          const deletedNotification = payload.old as SupabaseNotification;
          setNotifications(prev => prev.filter(n => n.id !== deletedNotification.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // جلب الإشعارات عند تحميل المكون
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // إحصائيات الإشعارات
  const notificationStats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.is_read).length,
    critical: notifications.filter(n => n.priority === 'critical' && !n.is_read).length,
    high: notifications.filter(n => n.priority === 'high' && !n.is_read).length,
    actionRequired: notifications.filter(n => n.action_required && !n.is_read).length,
    byCategory: notifications.reduce((acc, notification) => {
      if (!notification.is_read) {
        acc[notification.category] = (acc[notification.category] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>),
  };

  return {
    notifications,
    loading,
    error,
    notificationStats,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteReadNotifications,
    refreshNotifications: fetchNotifications,
  };
};