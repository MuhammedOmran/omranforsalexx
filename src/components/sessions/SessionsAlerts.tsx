import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  Shield, 
  MapPin, 
  Clock,
  X,
  Eye,
  Ban
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import { useToast } from "@/hooks/use-toast";
import { formatNumberEnglish } from '@/utils/numberLocalization';

interface SecurityAlert {
  id: string;
  type: 'suspicious_location' | 'multiple_sessions' | 'unusual_activity' | 'failed_attempts';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  session_id?: string;
  location?: string;
  ip_address?: string;
  resolved: boolean;
}

export function SessionsAlerts() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSecurityAlerts();
    
    // تحديث التنبيهات كل دقيقة
    const interval = setInterval(loadSecurityAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadSecurityAlerts = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        logger.warn('User not authenticated', {}, 'SessionsAlerts');
        return;
      }

      // بيانات تجريبية للتنبيهات الأمنية
      const mockAlerts: SecurityAlert[] = [
        {
          id: '1',
          type: 'suspicious_location',
          severity: 'medium',
          title: 'تسجيل دخول من موقع جديد',
          description: 'تم تسجيل دخول من الرياض، السعودية - موقع لم يتم استخدامه من قبل',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          session_id: '3',
          location: 'الرياض, السعودية',
          ip_address: '203.0.113.1',
          resolved: false
        }
      ];

      setAlerts(mockAlerts);
    } catch (error) {
      logger.error('خطأ في تحميل التنبيهات الأمنية:', error, 'SessionsAlerts');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'حرج';
      case 'high':
        return 'عالي';
      case 'medium':
        return 'متوسط';
      case 'low':
        return 'منخفض';
      default:
        return severity;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'suspicious_location':
        return <MapPin className="h-4 w-4" />;
      case 'multiple_sessions':
        return <Shield className="h-4 w-4" />;
      case 'unusual_activity':
        return <AlertTriangle className="h-4 w-4" />;
      case 'failed_attempts':
        return <Ban className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `منذ ${formatNumberEnglish(diffInMinutes)} دقيقة`;
    } else if (diffInMinutes < 1440) {
      return `منذ ${formatNumberEnglish(Math.floor(diffInMinutes / 60))} ساعة`;
    } else {
      return date.toLocaleDateString('ar-SA', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        numberingSystem: 'latn'
      });
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, resolved: true } : alert
      ));
      
      toast({
        title: "تم حل التنبيه",
        description: "تم وضع علامة حل على التنبيه الأمني"
      });
    } catch (error) {
      logger.error('خطأ في حل التنبيه:', error, 'SessionsAlerts');
      toast({
        title: "خطأ",
        description: "فشل في حل التنبيه",
        variant: "destructive"
      });
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      
      toast({
        title: "تم تجاهل التنبيه",
        description: "تم تجاهل التنبيه الأمني"
      });
    } catch (error) {
      logger.error('خطأ في تجاهل التنبيه:', error, 'SessionsAlerts');
      toast({
        title: "خطأ",
        description: "فشل في تجاهل التنبيه",
        variant: "destructive"
      });
    }
  };

  const activeAlerts = alerts.filter(alert => !alert.resolved);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>التنبيهات الأمنية</CardTitle>
          <CardDescription>جاري التحميل...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 space-x-reverse animate-pulse">
                <div className="w-10 h-10 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
                <div className="w-20 h-8 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activeAlerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <Shield className="h-5 w-5" />
            التنبيهات الأمنية
          </CardTitle>
          <CardDescription>
            حالة الأمان الحالية للجلسات
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Shield className="h-12 w-12 mx-auto text-green-500 mb-3" />
            <h3 className="text-lg font-semibold text-green-600 mb-2">لا توجد تنبيهات أمنية</h3>
            <p className="text-sm text-muted-foreground">
              جميع الجلسات آمنة ولا توجد أنشطة مشبوهة
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-600">
          <AlertTriangle className="h-5 w-5" />
          التنبيهات الأمنية ({formatNumberEnglish(activeAlerts.length)})
        </CardTitle>
        <CardDescription>
          تنبيهات أمنية تحتاج إلى مراجعة
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activeAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 border rounded-lg ${getSeverityColor(alert.severity)} transition-colors`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white/50 rounded-full">
                    {getAlertIcon(alert.type)}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{alert.title}</h4>
                      <Badge className={getSeverityColor(alert.severity)}>
                        {getSeverityText(alert.severity)}
                      </Badge>
                    </div>
                    
                    <p className="text-sm opacity-90">
                      {alert.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs opacity-75">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(alert.timestamp)}
                      </span>
                      {alert.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {alert.location}
                        </span>
                      )}
                      {alert.ip_address && (
                        <span>{alert.ip_address}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => resolveAlert(alert.id)}
                    className="bg-white/50 hover:bg-white/75"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    مراجعة
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => dismissAlert(alert.id)}
                    className="bg-white/50 hover:bg-white/75"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {activeAlerts.length > 0 && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              💡 <strong>نصيحة:</strong> راجع التنبيهات الأمنية بانتظام وتأكد من أن جميع عمليات تسجيل الدخول شرعية.
              يمكنك إنهاء الجلسات المشبوهة من تبويب "الجلسات النشطة".
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}