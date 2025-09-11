import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Download, Activity, Clock, Monitor } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import jsPDF from 'jspdf';

interface ActivityLogData {
  id: string;
  action: string;
  details: any;
  ip_address: string;
  device_info: string;
  status: string;
  created_at: string;
}

export default function ActivityLog() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityLogData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivityLog = async () => {
    if (!user) return;

    try {
      setLoading(true);
      // بيانات تجريبية لسجل النشاط (سيتم استبدالها بالبيانات الحقيقية لاحقاً)
      const mockActivities: ActivityLogData[] = [
        {
          id: '1',
          action: 'login',
          details: { device: 'Chrome Browser', version: '120.0' },
          ip_address: '192.168.1.1',
          device_info: 'Chrome على Windows 11',
          status: 'success',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          action: 'new_device_login',
          details: { device: 'Mobile Safari', new_device: true },
          ip_address: '192.168.1.15',
          device_info: 'Safari على iPhone',
          status: 'success',
          created_at: new Date(Date.now() - 86400000).toISOString() // يوم واحد مضى
        },
        {
          id: '3',
          action: 'profile_update',
          details: { fields_updated: ['display_name'] },
          ip_address: '192.168.1.1',
          device_info: 'Chrome على Windows 11',
          status: 'success',
          created_at: new Date(Date.now() - 172800000).toISOString() // يومان مضوا
        },
        {
          id: '4',
          action: 'session_terminated',
          details: { reason: 'user_action' },
          ip_address: '192.168.1.8',
          device_info: 'Firefox على Ubuntu',
          status: 'success',
          created_at: new Date(Date.now() - 259200000).toISOString() // ثلاثة أيام مضت
        }
      ];

      // محاكاة تأخير التحميل
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setActivities(mockActivities);
      toast.success('تم تحميل سجل النشاط بنجاح');
    } catch (error) {
      console.error('خطأ في جلب سجل النشاط:', error);
      toast.error('حدث خطأ في جلب سجل النشاط');
    } finally {
      setLoading(false);
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'login': 'تسجيل دخول',
      'logout': 'تسجيل خروج',
      'new_device_login': 'تسجيل دخول من جهاز جديد',
      'session_terminated': 'إنهاء جلسة',
      'password_change': 'تغيير كلمة المرور',
      'profile_update': 'تحديث الملف الشخصي'
    };
    return labels[action] || action;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'success') {
      return <Badge className="bg-green-100 text-green-800 border-green-200">نجح</Badge>;
    }
    if (status === 'failed') {
      return <Badge variant="destructive">فشل</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true, 
        locale: ar 
      });
    } catch {
      return 'غير محدد';
    }
  };

  const formatFullTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return 'غير محدد';
    }
  };

  const downloadPDF = () => {
    try {
      const doc = new jsPDF();
      
      // إعداد الخط العربي (مبسط)
      doc.setFont('helvetica');
      doc.setFontSize(16);
      doc.text('Activity Log Report', 20, 20);
      
      doc.setFontSize(12);
      doc.text(`User: ${user?.name || 'Unknown'}`, 20, 35);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 45);
      
      let yPosition = 65;
      doc.setFontSize(10);
      
      activities.forEach((activity, index) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        
        const actionText = `${index + 1}. ${getActionLabel(activity.action)}`;
        const timeText = `Time: ${formatFullTime(activity.created_at)}`;
        const statusText = `Status: ${activity.status}`;
        const deviceText = `Device: ${activity.device_info || 'Unknown'}`;
        const ipText = `IP: ${activity.ip_address || 'Unknown'}`;
        
        doc.text(actionText, 20, yPosition);
        doc.text(timeText, 30, yPosition + 10);
        doc.text(statusText, 30, yPosition + 20);
        doc.text(deviceText, 30, yPosition + 30);
        doc.text(ipText, 30, yPosition + 40);
        
        yPosition += 55;
      });
      
      doc.save(`activity-log-${user?.name || 'user'}.pdf`);
      toast.success('تم تنزيل سجل النشاط بنجاح');
    } catch (error) {
      console.error('خطأ في تنزيل PDF:', error);
      toast.error('حدث خطأ في تنزيل السجل');
    }
  };

  useEffect(() => {
    fetchActivityLog();
  }, [user]);

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Activity className="h-8 w-8" />
              سجل النشاط
            </h1>
            <p className="text-muted-foreground mt-1">
              تاريخ جميع الأنشطة والعمليات الخاصة بحسابك
            </p>
          </div>
          <Button onClick={downloadPDF} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            تنزيل PDF
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الأنشطة</p>
                <p className="text-2xl font-bold">{activities.length}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-muted-foreground">العمليات الناجحة</p>
                <p className="text-2xl font-bold text-green-600">
                  {activities.filter(a => a.status === 'success').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-muted-foreground">الأجهزة المختلفة</p>
                <p className="text-2xl font-bold text-purple-600">
                  {new Set(activities.map(a => a.device_info).filter(Boolean)).size}
                </p>
              </div>
              <Monitor className="h-8 w-8 text-purple-600" />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>سجل الأنشطة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>النشاط</TableHead>
                    <TableHead>الوقت</TableHead>
                    <TableHead>الجهاز</TableHead>
                    <TableHead>عنوان IP</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>التفاصيل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        لا توجد أنشطة مسجلة
                      </TableCell>
                    </TableRow>
                  ) : (
                    activities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell className="font-medium">
                          {getActionLabel(activity.action)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">{formatTime(activity.created_at)}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatFullTime(activity.created_at)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{activity.device_info || 'غير محدد'}</TableCell>
                        <TableCell>{activity.ip_address || 'غير متوفر'}</TableCell>
                        <TableCell>{getStatusBadge(activity.status)}</TableCell>
                        <TableCell>
                          {activity.details && (
                            <details className="cursor-pointer">
                              <summary className="text-xs text-blue-600">عرض التفاصيل</summary>
                              <pre className="text-xs mt-1 p-2 bg-muted rounded">
                                {JSON.stringify(activity.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}