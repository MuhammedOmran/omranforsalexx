/**
 * مؤشر حالة الاتصال والمزامنة
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wifi, 
  WifiOff, 
  RotateCcw, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  RefreshCw,
  Database
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabaseOfflineSync, getOfflineStats, syncOfflineData, startAutoSync } from '@/utils/supabaseOfflineSync';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface SyncStats {
  pending: number;
  synced: number;
  failed: number;
  total: number;
}

export function OfflineStatusIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [stats, setStats] = useState<SyncStats>({
    pending: 0,
    synced: 0,
    failed: 0,
    total: 0
  });
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  
  const { user } = useAuth();

  // مراقبة حالة الاتصال
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "عاد الاتصال",
        description: "تم استعادة الاتصال بالإنترنت",
      });
      
      // بدء المزامنة التلقائية
      if (user?.id && stats.pending > 0) {
        handleSync();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "انقطع الاتصال",
        description: "سيتم حفظ التغييرات محلياً ومزامنتها لاحقاً",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user?.id, stats.pending]);

  // بدء المزامنة التلقائية عند تسجيل الدخول
  useEffect(() => {
    if (user?.id) {
      startAutoSync(user.id);
    }
  }, [user?.id]);

  // تحديث الإحصائيات
  useEffect(() => {
    const updateStats = async () => {
      if (user?.id) {
        const newStats = await getOfflineStats(user.id);
        setStats(newStats);
      }
    };

    updateStats();
    
    // تحديث كل دقيقة
    const interval = setInterval(updateStats, 60000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // بدء المزامنة
  const handleSync = async () => {
    if (!user?.id || isSyncing) return;

    setIsSyncing(true);
    try {
      const result = await syncOfflineData(user.id);
      
      if (result.success > 0) {
        setLastSyncTime(new Date().toLocaleString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit'
        }));
      }
      
      // تحديث الإحصائيات
      const newStats = await getOfflineStats(user.id);
      setStats(newStats);
    } catch (error) {
      console.error('خطأ في المزامنة:', error);
      toast({
        title: "خطأ في المزامنة",
        description: "فشل في مزامنة البيانات",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const getConnectionStatus = () => {
    if (!isOnline) {
      return {
        icon: WifiOff,
        text: 'أوف لاين',
        color: 'destructive' as const,
        bgColor: 'bg-destructive/10',
        textColor: 'text-destructive'
      };
    }
    
    if (stats.pending > 0) {
      return {
        icon: Clock,
        text: 'في انتظار المزامنة',
        color: 'warning' as const,
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
        textColor: 'text-yellow-700 dark:text-yellow-300'
      };
    }
    
    if (stats.failed > 0) {
      return {
        icon: AlertCircle,
        text: 'خطأ في المزامنة',
        color: 'destructive' as const,
        bgColor: 'bg-destructive/10',
        textColor: 'text-destructive'
      };
    }
    
    return {
      icon: Wifi,
      text: 'متصل ومتزامن',
      color: 'default' as const,
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      textColor: 'text-green-700 dark:text-green-300'
    };
  };

  const status = getConnectionStatus();
  const StatusIcon = status.icon;

  return (
    <Card className={cn("p-4", status.bgColor)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <StatusIcon className={cn("h-5 w-5", status.textColor)} />
          <span className={cn("font-medium", status.textColor)}>
            {status.text}
          </span>
        </div>
        
        {isOnline && stats.pending > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleSync}
            disabled={isSyncing}
            className="h-8"
          >
            {isSyncing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            <span className="mr-2">مزامنة</span>
          </Button>
        )}
      </div>

      {/* إحصائيات المزامنة */}
      {stats.total > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {stats.pending > 0 && (
            <Badge variant="secondary" className="text-xs">
              <Clock className="h-3 w-3 ml-1" />
              {stats.pending} في الانتظار
            </Badge>
          )}
          
          {stats.synced > 0 && (
            <Badge variant="default" className="text-xs bg-green-500">
              <CheckCircle className="h-3 w-3 ml-1" />
              {stats.synced} متزامن
            </Badge>
          )}
          
          {stats.failed > 0 && (
            <Badge variant="destructive" className="text-xs">
              <AlertCircle className="h-3 w-3 ml-1" />
              {stats.failed} فشل
            </Badge>
          )}
        </div>
      )}

      {/* معلومات إضافية */}
      <div className="text-xs text-muted-foreground space-y-1">
        {lastSyncTime && (
          <div className="flex items-center gap-1">
            <Database className="h-3 w-3" />
            آخر مزامنة: {lastSyncTime}
          </div>
        )}
        
        {!isOnline && (
          <div className="text-destructive">
            ⚠️ يتم العمل في الوضع الأوف لاين
          </div>
        )}
      </div>
    </Card>
  );
}