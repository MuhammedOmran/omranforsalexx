import { logger } from '@/utils/logger';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Monitor, Smartphone, Tablet, Globe, Clock, Shield, Trash2, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserSessions, terminateUserSession, terminateAllOtherSessions, UserSession } from '@/utils/sessionManager';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

export function SessionManagement() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [terminatingSession, setTerminatingSession] = useState<string | null>(null);
  const [terminatingAll, setTerminatingAll] = useState(false);

  useEffect(() => {
    loadSessions();
  }, [user]);

  const loadSessions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userSessions = await getUserSessions(user.id);
      setSessions(userSessions);
    } catch (error) {
      logger.error('خطأ في تحميل الجلسات:', error);
      toast.error('فشل في تحميل الجلسات');
    } finally {
      setLoading(false);
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    if (!user) return;
    
    setTerminatingSession(sessionId);
    try {
      const success = await terminateUserSession(user.id, sessionId);
      if (success) {
        toast.success('تم إنهاء الجلسة بنجاح');
        await loadSessions();
      } else {
        toast.error('فشل في إنهاء الجلسة');
      }
    } catch (error) {
      logger.error('خطأ في إنهاء الجلسة:', error);
      toast.error('حدث خطأ أثناء إنهاء الجلسة');
    } finally {
      setTerminatingSession(null);
    }
  };

  const handleTerminateAllOtherSessions = async () => {
    if (!user) return;
    
    setTerminatingAll(true);
    try {
      const success = await terminateAllOtherSessions(user.id);
      if (success) {
        toast.success('تم إنهاء جميع الجلسات الأخرى بنجاح');
        await loadSessions();
      } else {
        toast.error('فشل في إنهاء الجلسات');
      }
    } catch (error) {
      logger.error('خطأ في إنهاء الجلسات:', error);
      toast.error('حدث خطأ أثناء إنهاء الجلسات');
    } finally {
      setTerminatingAll(false);
    }
  };

  const getDeviceIcon = (deviceName: string) => {
    const name = deviceName.toLowerCase();
    if (name.includes('mobile') || name.includes('android') || name.includes('iphone')) {
      return <Smartphone className="h-4 w-4" />;
    }
    if (name.includes('tablet') || name.includes('ipad')) {
      return <Tablet className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  const getCurrentSessionToken = () => {
    return localStorage.getItem('session_token');
  };

  const isCurrentSession = (session: UserSession) => {
    return session.session_token === getCurrentSessionToken();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            إدارة الجلسات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeSessions = sessions.filter(session => session.is_active);
  const inactiveSessions = sessions.filter(session => !session.is_active);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                إدارة الجلسات
              </CardTitle>
              <CardDescription>
                إدارة جلسات تسجيل الدخول الخاصة بك على الأجهزة المختلفة
              </CardDescription>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  size="sm"
                  disabled={terminatingAll || activeSessions.length <= 1}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  تسجيل الخروج من كل الأجهزة
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>تأكيد تسجيل الخروج من كل الأجهزة</AlertDialogTitle>
                  <AlertDialogDescription>
                    هذا الإجراء سيقوم بتسجيل الخروج من جميع الأجهزة الأخرى عدا الجهاز الحالي. 
                    ستحتاج إلى تسجيل الدخول مرة أخرى على تلك الأجهزة.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleTerminateAllOtherSessions}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {terminatingAll ? 'جاري الإنهاء...' : 'تأكيد'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeSessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد جلسات نشطة</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                الجلسات النشطة ({activeSessions.length})
              </div>
              
              {activeSessions.map((session) => (
                <div key={session.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getDeviceIcon(session.device_name || '')}
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {session.device_name || 'جهاز غير محدد'}
                          {isCurrentSession(session) && (
                            <Badge variant="secondary" className="text-xs">
                              الجلسة الحالية
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {session.ip_address || 'غير متوفر'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            آخر نشاط: {formatDistanceToNow(new Date(session.last_activity), { 
                              addSuffix: true, 
                              locale: ar 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {!isCurrentSession(session) && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={terminatingSession === session.id}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            إنهاء الجلسة
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>تأكيد إنهاء الجلسة</AlertDialogTitle>
                            <AlertDialogDescription>
                              هل أنت متأكد من إنهاء جلسة "{session.device_name}"؟ 
                              ستحتاج إلى تسجيل الدخول مرة أخرى على هذا الجهاز.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleTerminateSession(session.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              إنهاء الجلسة
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    تم إنشاؤها: {formatDistanceToNow(new Date(session.created_at), { 
                      addSuffix: true, 
                      locale: ar 
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {inactiveSessions.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  الجلسات المنتهية ({inactiveSessions.length})
                </div>
                
                {inactiveSessions.slice(0, 5).map((session) => (
                  <div key={session.id} className="border rounded-lg p-3 opacity-60">
                    <div className="flex items-center gap-3">
                      {getDeviceIcon(session.device_name || '')}
                      <div>
                        <div className="font-medium text-sm">
                          {session.device_name || 'جهاز غير محدد'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          انتهت: {formatDistanceToNow(new Date(session.last_activity), { 
                            addSuffix: true, 
                            locale: ar 
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {inactiveSessions.length > 5 && (
                  <div className="text-center text-sm text-muted-foreground">
                    و {inactiveSessions.length - 5} جلسة منتهية أخرى...
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}