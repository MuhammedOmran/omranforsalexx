import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle,
  X,
  ExternalLink,
  Bell,
  BellOff
} from 'lucide-react';
import { enhancedSystemIntegration, SmartAlert } from '@/utils/enhancedSystemIntegration';
import { useNavigate } from 'react-router-dom';

const alertIcons = {
  warning: AlertTriangle,
  error: AlertCircle,
  info: Info,
  success: CheckCircle
};

const alertColors = {
  warning: 'text-orange-600 bg-orange-50 border-orange-200',
  error: 'text-red-600 bg-red-50 border-red-200',
  info: 'text-blue-600 bg-blue-50 border-blue-200',
  success: 'text-green-600 bg-green-50 border-green-200'
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

export function SmartAlertsPanel() {
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadAlerts();
    // تحديث التنبيهات كل دقيقتين
    const interval = setInterval(loadAlerts, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadAlerts = () => {
    try {
      // إنشاء تنبيهات جديدة
      enhancedSystemIntegration.generateSmartAlerts();
      
      // تحميل جميع التنبيهات
      const alertsData = localStorage.getItem('smart_alerts') || '[]';
      const parsedAlerts = JSON.parse(alertsData);
      
      // التأكد من أن البيانات عبارة عن مصفوفة
      const allAlerts = Array.isArray(parsedAlerts) ? parsedAlerts : [];
      
      const sortedAlerts = allAlerts.sort((a: SmartAlert, b: SmartAlert) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      const unreadAlerts = sortedAlerts.filter((alert: SmartAlert) => !alert.readAt);
      
      setAlerts(sortedAlerts);
      setUnreadCount(unreadAlerts.length);
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  const markAsRead = (alertId: string) => {
    enhancedSystemIntegration.markAlertAsRead(alertId);
    loadAlerts();
  };

  const resolveAlert = (alertId: string) => {
    enhancedSystemIntegration.resolveAlert(alertId);
    loadAlerts();
  };

  const handleAlertAction = (alert: SmartAlert) => {
    if (alert.actionUrl) {
      navigate(alert.actionUrl);
    }
    if (!alert.readAt) {
      markAsRead(alert.id);
    }
  };

  const displayedAlerts = showAll ? alerts : alerts.slice(0, 5);
  const activeAlerts = alerts.filter(alert => !alert.resolvedAt);

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            التنبيهات الذكية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <BellOff className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>لا توجد تنبيهات حالياً</p>
            <p className="text-sm">جميع الأنظمة تعمل بشكل طبيعي</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            التنبيهات الذكية
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {activeAlerts.length} نشط
            </Badge>
            {alerts.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? 'عرض أقل' : `عرض الكل (${alerts.length})`}
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayedAlerts.map((alert) => {
          const Icon = alertIcons[alert.type];
          const isUnread = !alert.readAt;
          const isResolved = !!alert.resolvedAt;
          
          return (
            <Alert 
              key={alert.id} 
              className={`${alertColors[alert.type]} ${isUnread ? 'border-l-4' : ''} ${isResolved ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm">{alert.title}</h4>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${priorityColors[alert.priority]}`}
                      >
                        {alert.priority === 'low' && 'منخفض'}
                        {alert.priority === 'medium' && 'متوسط'}
                        {alert.priority === 'high' && 'عالي'}
                        {alert.priority === 'critical' && 'حرج'}
                      </Badge>
                      {isUnread && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full" />
                      )}
                      {isResolved && (
                        <Badge variant="outline" className="text-green-600 text-xs">
                          تم الحل
                        </Badge>
                      )}
                    </div>
                    <AlertDescription className="text-sm mb-2">
                      {alert.message}
                    </AlertDescription>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {new Date(alert.createdAt).toLocaleDateString('ar-SA', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          numberingSystem: 'latn'
                        })}
                      </span>
                      <div className="flex gap-2">
                        {alert.actionRequired && alert.actionUrl && !isResolved && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAlertAction(alert)}
                            className="h-7 text-xs"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            {alert.actionText || 'اتخاذ إجراء'}
                          </Button>
                        )}
                        {!isResolved && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => resolveAlert(alert.id)}
                            className="h-7 text-xs"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            حل
                          </Button>
                        )}
                        {!alert.readAt && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markAsRead(alert.id)}
                            className="h-7 text-xs"
                          >
                            تعليم كمقروء
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Alert>
          );
        })}

        {activeAlerts.length === 0 && alerts.length > 0 && (
          <div className="text-center py-4 text-green-600">
            <CheckCircle className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm font-medium">تم حل جميع التنبيهات!</p>
            <p className="text-xs text-muted-foreground">جميع الأنظمة تعمل بشكل طبيعي</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}