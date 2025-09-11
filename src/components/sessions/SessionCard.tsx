import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Monitor, Tablet, LogOut, MapPin, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { SecureUserSession } from '@/hooks/useSecureSessionManager';

interface SessionCardProps {
  session: SecureUserSession;
  onTerminate: (sessionId: string) => void;
  isCurrentSession?: boolean;
}

export function SessionCard({ session, onTerminate, isCurrentSession }: SessionCardProps) {
  const getDeviceIcon = (deviceName: string) => {
    const device = deviceName.toLowerCase();
    if (device.includes('mobile') || device.includes('android') || device.includes('iphone')) {
      return <Smartphone className="h-4 w-4" />;
    }
    if (device.includes('tablet') || device.includes('ipad')) {
      return <Tablet className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
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

  return (
    <Card className={`${isCurrentSession ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {getDeviceIcon(session.device_name || '')}
          {session.device_name || 'جهاز غير محدد'}
          {isCurrentSession && (
            <Badge variant="outline" className="text-xs">
              الجلسة الحالية
            </Badge>
          )}
        </CardTitle>
        <Badge variant={session.is_active ? "default" : "secondary"}>
          {session.is_active ? 'نشطة' : 'منتهية'}
        </Badge>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>عنوان IP: {session.ip_address || 'غير متوفر'}</span>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>تسجيل الدخول: {formatTime(session.created_at)}</span>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>آخر نشاط: {formatTime(session.last_activity)}</span>
          </div>
        </div>

        {session.is_active && !isCurrentSession && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onTerminate(session.id)}
            className="w-full"
          >
            <LogOut className="h-4 w-4 mr-2" />
            إنهاء الجلسة
          </Button>
        )}
      </CardContent>
    </Card>
  );
}