import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Shield, Users, Activity, LogOut, Smartphone, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

interface AdminSessionData {
  id: string;
  user_id: string;
  device_id: string;
  session_token: string;
  is_active: boolean;
  created_at: string;
  last_activity: string;
  expires_at: string;
  user_name?: string;
  device_name?: string;
  ip_address?: string;
  platform?: string;
  browser_info?: string;
}

interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  inactiveSessions: number;
  uniqueUsers: number;
  uniqueDevices: number;
}

export default function AdminSessions() {
  const [sessions, setSessions] = useState<AdminSessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSessions, setFilteredSessions] = useState<AdminSessionData[]>([]);
  const { user } = useSupabaseAuth();

  const fetchAllSessions = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_sessions')
        .select(`
          *,
          profiles:user_id (
            full_name,
            username
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const sessionsWithUserData = (data || []).map((session: any) => ({
        ...session,
        user_name: session.profiles?.full_name || session.profiles?.username || 'مستخدم غير محدد',
        device_name: session.device_name || 'جهاز غير محدد',
        ip_address: session.ip_address || 'غير متوفر',
        platform: session.device_info?.platform || 'غير محدد',
        browser_info: session.user_agent || 'غير متوفر'
      }));

      setSessions(sessionsWithUserData);
    } catch (error) {
      console.error('خطأ في جلب الجلسات:', error);
      toast.error('حدث خطأ في جلب الجلسات');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const terminateSession = async (sessionId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ 
          is_active: false, 
          last_activity: new Date().toISOString() 
        })
        .eq('id', sessionId);

      if (error) throw error;
      
      toast.success('تم إنهاء الجلسة بنجاح');
      await fetchAllSessions();
    } catch (error) {
      console.error('خطأ في إنهاء الجلسة:', error);
      toast.error('حدث خطأ في إنهاء الجلسة');
    }
  };

  const terminateAllUserSessions = async (userId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ 
          is_active: false, 
          last_activity: new Date().toISOString() 
        })
        .eq('user_id', userId);

      if (error) throw error;
      
      toast.success('تم إنهاء جميع جلسات المستخدم');
      await fetchAllSessions();
    } catch (error) {
      console.error('خطأ في إنهاء جلسات المستخدم:', error);
      toast.error('حدث خطأ في إنهاء جلسات المستخدم');
    }
  };

  // فلترة الجلسات بناءً على البحث
  useEffect(() => {
    if (!searchQuery) {
      setFilteredSessions(sessions);
    } else {
      const filtered = sessions.filter(session =>
        session.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.device_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.ip_address?.includes(searchQuery) ||
        session.platform?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSessions(filtered);
    }
  }, [sessions, searchQuery]);

  useEffect(() => {
    fetchAllSessions();
  }, []);

  // حساب الإحصائيات
  const stats: SessionStats = {
    totalSessions: sessions.length,
    activeSessions: sessions.filter(s => s.is_active).length,
    inactiveSessions: sessions.filter(s => !s.is_active).length,
    uniqueUsers: new Set(sessions.map(s => s.user_id)).size,
    uniqueDevices: new Set(sessions.map(s => s.device_id)).size
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeSince = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `منذ ${diffInMinutes} دقيقة`;
    } else if (diffInMinutes < 1440) {
      return `منذ ${Math.floor(diffInMinutes / 60)} ساعة`;
    } else {
      return `منذ ${Math.floor(diffInMinutes / 1440)} يوم`;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">إدارة الجلسات</h1>
            <p className="text-muted-foreground">مراقبة وإدارة جلسات المستخدمين النشطة</p>
          </div>
        </div>
      </div>

      {/* إحصائيات الجلسات */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الجلسات</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSessions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الجلسات النشطة</CardTitle>
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeSessions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الجلسات المنتهية</CardTitle>
            <div className="h-2 w-2 bg-red-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.inactiveSessions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المستخدمون الفريدون</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الأجهزة الفريدة</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueDevices}</div>
          </CardContent>
        </Card>
      </div>

      {/* شريط البحث */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="البحث في الجلسات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* قائمة الجلسات */}
      <Card>
        <CardHeader>
          <CardTitle>الجلسات النشطة والأخيرة</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">جاري التحميل...</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">لا توجد جلسات</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchQuery ? 'لا توجد نتائج للبحث المحدد' : 'لا توجد جلسات مسجلة'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className="flex-shrink-0">
                      <div className={`w-3 h-3 rounded-full ${
                        session.is_active ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {session.user_name}
                        </p>
                        <Badge variant={session.is_active ? "default" : "secondary"}>
                          {session.is_active ? "نشط" : "منتهي"}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Smartphone className="h-3 w-3" />
                          <span>{session.device_name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{getTimeSince(session.last_activity)}</span>
                        </div>
                        <span>{session.ip_address}</span>
                        <span>{session.platform}</span>
                      </div>
                      
                      <div className="text-xs text-muted-foreground mt-1">
                        آخر نشاط: {formatDate(session.last_activity)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse">
                    {session.is_active && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => terminateSession(session.id)}
                        >
                          <LogOut className="h-4 w-4 ml-1" />
                          إنهاء الجلسة
                        </Button>
                        
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => terminateAllUserSessions(session.user_id)}
                        >
                          إنهاء جميع الجلسات
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}