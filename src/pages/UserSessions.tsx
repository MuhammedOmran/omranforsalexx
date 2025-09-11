import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Monitor, Smartphone, Tablet, Globe, Clock, Shield, Trash2, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserSessions, terminateUserSession, terminateAllOtherSessions, UserSession } from '@/utils/sessionManager';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function UserSessions() {
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
      console.error('خطأ في تحميل الجلسات:', error);
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
      console.error('خطأ في إنهاء الجلسة:', error);
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
      console.error('خطأ في إنهاء الجلسات:', error);
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

  const activeSessions = sessions.filter(session => session.is_active);
  const inactiveSessions = sessions.filter(session => !session.is_active);

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6" />
              جلسات المستخدم
            </CardTitle>
            <CardDescription>
              عرض وإدارة جلسات تسجيل الدخول الخاصة بك
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>جاري تحميل الجلسات...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">جلسات المستخدم</h1>
          <p className="text-muted-foreground mt-2">
            عرض وإدارة جلسات تسجيل الدخول على الأجهزة المختلفة
          </p>
        </div>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="destructive" 
              disabled={terminatingAll || activeSessions.length <= 1}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {terminatingAll ? 'جاري الإنهاء...' : 'تسجيل الخروج من كل الأجهزة'}
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
                تأكيد
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* الجلسات النشطة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            الجلسات النشطة ({activeSessions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeSessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد جلسات نشطة</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الجهاز</TableHead>
                  <TableHead>عنوان IP</TableHead>
                  <TableHead>تاريخ الإنشاء</TableHead>
                  <TableHead>آخر نشاط</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(session.device_name || '')}
                        <span>{session.device_name || 'جهاز غير محدد'}</span>
                        {isCurrentSession(session) && (
                          <Badge variant="secondary" className="text-xs">
                            الجلسة الحالية
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {session.ip_address || 'غير متوفر'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(session.created_at), { 
                        addSuffix: true, 
                        locale: ar 
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(session.last_activity), { 
                          addSuffix: true, 
                          locale: ar 
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className="bg-green-500 text-white">
                        نشطة
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {!isCurrentSession(session) && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              disabled={terminatingSession === session.id}
                            >
                              {terminatingSession === session.id ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Trash2 className="h-4 w-4 mr-2" />
                              )}
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* الجلسات المنتهية */}
      {inactiveSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              الجلسات المنتهية ({inactiveSessions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الجهاز</TableHead>
                  <TableHead>عنوان IP</TableHead>
                  <TableHead>تاريخ الإنشاء</TableHead>
                  <TableHead>تاريخ الانتهاء</TableHead>
                  <TableHead>الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inactiveSessions.slice(0, 10).map((session) => (
                  <TableRow key={session.id} className="opacity-60">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(session.device_name || '')}
                        <span>{session.device_name || 'جهاز غير محدد'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {session.ip_address || 'غير متوفر'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(session.created_at), { 
                        addSuffix: true, 
                        locale: ar 
                      })}
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(session.last_activity), { 
                        addSuffix: true, 
                        locale: ar 
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                        منتهية
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {inactiveSessions.length > 10 && (
              <div className="text-center text-sm text-muted-foreground mt-4">
                و {inactiveSessions.length - 10} جلسة منتهية أخرى...
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}