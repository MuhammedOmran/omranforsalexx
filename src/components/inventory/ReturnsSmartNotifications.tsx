import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Bell, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  Settings,
  CheckCircle,
  XCircle
} from "lucide-react";
import { returnsManager } from "@/utils/returnsManager";
import { toast } from "sonner";

interface NotificationRule {
  id: string;
  name: string;
  type: 'pending_time' | 'high_volume' | 'quality_issue' | 'customer_pattern';
  enabled: boolean;
  threshold: number;
  timeUnit?: 'hours' | 'days';
  message: string;
}

interface SmartAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionRequired: boolean;
  relatedData?: any;
}

export function ReturnsSmartNotifications() {
  const [notifications, setNotifications] = useState<SmartAlert[]>([]);
  const [rules, setRules] = useState<NotificationRule[]>([
    {
      id: '1',
      name: 'المرتجعات المعلقة طويلاً',
      type: 'pending_time',
      enabled: true,
      threshold: 24,
      timeUnit: 'hours',
      message: 'يوجد مرتجعات معلقة لأكثر من 24 ساعة'
    },
    {
      id: '2',
      name: 'حجم مرتجعات عالي',
      type: 'high_volume',
      enabled: true,
      threshold: 10,
      message: 'حجم المرتجعات اليومي تجاوز الحد المقبول'
    },
    {
      id: '3',
      name: 'مشكلة جودة محتملة',
      type: 'quality_issue',
      enabled: true,
      threshold: 3,
      message: 'منتج محدد يتم إرجاعه بشكل متكرر'
    },
    {
      id: '4',
      name: 'نمط عميل مشبوه',
      type: 'customer_pattern',
      enabled: true,
      threshold: 5,
      message: 'عميل قام بإرجاعات متعددة خلال فترة قصيرة'
    }
  ]);

  const [showSettings, setShowSettings] = useState(false);

  // إنشاء الإشعارات الذكية
  const generateSmartAlerts = useMemo(() => {
    const alerts: SmartAlert[] = [];
    const returns = returnsManager.getReturns();
    const now = new Date();

    // تحقق من المرتجعات المعلقة طويلاً
    const pendingTimeRule = rules.find(r => r.type === 'pending_time' && r.enabled);
    if (pendingTimeRule) {
      const longPendingReturns = returns.filter(ret => {
        if (ret.status !== 'pending') return false;
        const createdAt = new Date(ret.createdAt);
        const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        return hoursDiff > pendingTimeRule.threshold;
      });

      if (longPendingReturns.length > 0) {
        alerts.push({
          id: `pending-${Date.now()}`,
          type: 'warning',
          title: 'مرتجعات معلقة طويلاً',
          message: `يوجد ${longPendingReturns.length} مرتجع معلق لأكثر من ${pendingTimeRule.threshold} ساعة`,
          timestamp: now,
          isRead: false,
          actionRequired: true,
          relatedData: longPendingReturns
        });
      }
    }

    // تحقق من حجم المرتجعات العالي
    const highVolumeRule = rules.find(r => r.type === 'high_volume' && r.enabled);
    if (highVolumeRule) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayReturns = returns.filter(ret => {
        const returnDate = new Date(ret.createdAt);
        return returnDate >= today;
      });

      if (todayReturns.length > highVolumeRule.threshold) {
        alerts.push({
          id: `volume-${Date.now()}`,
          type: 'error',
          title: 'حجم مرتجعات عالي',
          message: `تم تسجيل ${todayReturns.length} مرتجع اليوم، وهو أعلى من الحد المقبول (${highVolumeRule.threshold})`,
          timestamp: now,
          isRead: false,
          actionRequired: true,
          relatedData: todayReturns
        });
      }
    }

    // تحقق من مشاكل الجودة
    const qualityRule = rules.find(r => r.type === 'quality_issue' && r.enabled);
    if (qualityRule) {
      const productReturns: { [key: string]: number } = {};
      returns.forEach(ret => {
        ret.items.forEach(item => {
          productReturns[item.productName] = (productReturns[item.productName] || 0) + 1;
        });
      });

      Object.entries(productReturns).forEach(([product, count]) => {
        if (count >= qualityRule.threshold) {
          alerts.push({
            id: `quality-${product}-${Date.now()}`,
            type: 'warning',
            title: 'مشكلة جودة محتملة',
            message: `المنتج "${product}" تم إرجاعه ${count} مرات`,
            timestamp: now,
            isRead: false,
            actionRequired: true,
            relatedData: { product, count }
          });
        }
      });
    }

    // تحقق من أنماط العملاء المشبوهة
    const customerRule = rules.find(r => r.type === 'customer_pattern' && r.enabled);
    if (customerRule) {
      const customerReturns: { [key: string]: number } = {};
      returns.forEach(ret => {
        customerReturns[ret.customerName] = (customerReturns[ret.customerName] || 0) + 1;
      });

      Object.entries(customerReturns).forEach(([customer, count]) => {
        if (count >= customerRule.threshold) {
          alerts.push({
            id: `customer-${customer}-${Date.now()}`,
            type: 'info',
            title: 'نمط عميل مشبوه',
            message: `العميل "${customer}" قام بـ ${count} عمليات إرجاع`,
            timestamp: now,
            isRead: false,
            actionRequired: false,
            relatedData: { customer, count }
          });
        }
      });
    }

    return alerts;
  }, [rules]);

  useEffect(() => {
    setNotifications(generateSmartAlerts);
  }, [generateSmartAlerts]);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
    toast.success("تم إخفاء الإشعار");
  };

  const updateRule = (ruleId: string, updates: Partial<NotificationRule>) => {
    setRules(prev => 
      prev.map(rule => 
        rule.id === ruleId ? { ...rule, ...updates } : rule
      )
    );
    toast.success("تم تحديث قاعدة الإشعار");
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const actionRequiredCount = notifications.filter(n => n.actionRequired && !n.isRead).length;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* رأس الإشعارات */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              الإشعارات الذكية
              {unreadCount > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {actionRequiredCount > 0 && (
                <Badge variant="secondary" className="animate-pulse">
                  {actionRequiredCount} يتطلب إجراء
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="hover-scale"
              >
                <Settings className="h-4 w-4 mr-2" />
                إعدادات
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* إعدادات الإشعارات */}
        {showSettings && (
          <CardContent className="border-t animate-fade-in">
            <div className="space-y-4">
              <h3 className="font-medium">قواعد الإشعارات</h3>
              {rules.map(rule => (
                <div key={rule.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(enabled) => updateRule(rule.id, { enabled })}
                    />
                    <div>
                      <p className="font-medium text-sm">{rule.name}</p>
                      <p className="text-xs text-muted-foreground">{rule.message}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Select
                      value={rule.threshold.toString()}
                      onValueChange={(value) => updateRule(rule.id, { threshold: Number(value) })}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                          <SelectItem key={num} value={num.toString()}>
                            {num}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {rule.timeUnit && (
                      <span className="text-xs text-muted-foreground">
                        {rule.timeUnit === 'hours' ? 'ساعة' : 'يوم'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* قائمة الإشعارات */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد إشعارات جديدة</p>
              <p className="text-sm text-muted-foreground">جميع المرتجعات تحت السيطرة</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map(notification => (
            <Alert 
              key={notification.id}
              className={`animate-fade-in transition-all duration-300 hover:shadow-md ${
                !notification.isRead ? 'border-l-4 border-l-primary bg-primary/5' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {notification.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                  {notification.type === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
                  {notification.type === 'info' && <Bell className="h-5 w-5 text-blue-500" />}
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{notification.title}</h4>
                      {notification.actionRequired && (
                        <Badge variant="destructive">
                          إجراء مطلوب
                        </Badge>
                      )}
                      {!notification.isRead && (
                        <Badge variant="secondary">
                          جديد
                        </Badge>
                      )}
                    </div>
                    <AlertDescription className="mb-2">
                      {notification.message}
                    </AlertDescription>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {notification.timestamp.toLocaleString('ar-SA')}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  {!notification.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(notification.id)}
                      className="hover-scale"
                    >
                      تم القراءة
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismissNotification(notification.id)}
                    className="hover-scale"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Alert>
          ))
        )}
      </div>
    </div>
  );
}