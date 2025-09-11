import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Database,
  Wifi,
  Shield,
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SystemStatus {
  database: 'connected' | 'disconnected' | 'error' | 'localStorage_fallback';
  auth: 'authenticated' | 'unauthenticated' | 'error';
  storage: 'available' | 'unavailable';
  lastCheck: Date;
}

export function SystemStatusMonitor() {
  const [status, setStatus] = useState<SystemStatus>({
    database: 'disconnected',
    auth: 'unauthenticated', 
    storage: 'available',
    lastCheck: new Date()
  });
  const [isChecking, setIsChecking] = useState(false);

  const checkSystemStatus = async () => {
    setIsChecking(true);
    try {
      // فحص قاعدة البيانات - استخدام localStorage كبديل
      let dbStatus = 'connected';
      try {
        // محاولة فحص Supabase
        const { error: dbError } = await supabase.auth.getSession();
        dbStatus = dbError ? 'error' : 'connected';
      } catch {
        dbStatus = 'localStorage_fallback';
      }

      // فحص المصادقة
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      const authStatus = authError ? 'error' : user ? 'authenticated' : 'unauthenticated';

      // فحص التخزين المحلي
      let storageStatus: 'available' | 'unavailable' = 'available';
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
      } catch {
        storageStatus = 'unavailable';
      }

      setStatus({
        database: dbStatus as 'connected' | 'disconnected' | 'error' | 'localStorage_fallback',
        auth: authStatus,
        storage: storageStatus,
        lastCheck: new Date()
      });
    } catch (error) {
      console.error('خطأ في فحص حالة النظام:', error);
      setStatus(prev => ({
        ...prev,
        database: 'error',
        lastCheck: new Date()
      }));
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkSystemStatus();
    // فحص دوري كل 5 دقائق
    const interval = setInterval(checkSystemStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'authenticated':
      case 'available':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
      case 'disconnected':
      case 'unavailable':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      connected: "default",
      authenticated: "default", 
      available: "default",
      disconnected: "destructive",
      error: "destructive",
      unavailable: "destructive",
      unauthenticated: "secondary",
      localStorage_fallback: "secondary"
    };

    const labels = {
      connected: "متصل",
      authenticated: "مصادق عليه",
      available: "متاح",
      disconnected: "غير متصل", 
      error: "خطأ",
      unavailable: "غير متاح",
      unauthenticated: "غير مصادق عليه",
      localStorage_fallback: "وضع localStorage"
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const hasErrors = status.database === 'error' || status.auth === 'error' || status.storage === 'unavailable';

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          حالة النظام
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={checkSystemStatus}
          disabled={isChecking}
        >
          {isChecking ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          تحديث
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasErrors && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>تحذير</AlertTitle>
            <AlertDescription>
              يوجد مشاكل في النظام تحتاج إلى معالجة
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">قاعدة البيانات</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(status.database)}
              {getStatusBadge(status.database)}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">المصادقة</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(status.auth)}
              {getStatusBadge(status.auth)}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Wifi className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">التخزين المحلي</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(status.storage)}
              {getStatusBadge(status.storage)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          آخر فحص: {status.lastCheck.toLocaleTimeString('ar-SA')}
        </div>
      </CardContent>
    </Card>
  );
}