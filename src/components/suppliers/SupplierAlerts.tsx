import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  X, 
  CheckCheck, 
  DollarSign,
  Star,
  Clock,
  Truck,
  Shield,
  FileText,
  Eye,
  Trash2
} from 'lucide-react';
import { supplierAlertsManager, SupplierAlert } from '@/utils/supplierAlertsManager';
import { formatCurrency } from '@/lib/utils';

interface SupplierAlertsProps {
  supplierId?: string;
  compact?: boolean;
  className?: string;
}

export function SupplierAlerts({ supplierId, compact = false, className }: SupplierAlertsProps) {
  const [alerts, setAlerts] = useState<SupplierAlert[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [stats, setStats] = useState(supplierAlertsManager.getAlertStats());

  useEffect(() => {
    loadAlerts();
    // تحديث التنبيهات كل 5 دقائق
    const interval = setInterval(loadAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [supplierId]);

  const loadAlerts = () => {
    let loadedAlerts: SupplierAlert[];
    
    if (supplierId) {
      loadedAlerts = supplierAlertsManager.getSupplierAlerts(supplierId);
    } else {
      loadedAlerts = supplierAlertsManager.getAllAlerts();
    }
    
    setAlerts(loadedAlerts);
    setStats(supplierAlertsManager.getAlertStats());
  };

  const handleMarkAsRead = (alertId: string) => {
    supplierAlertsManager.markAsRead(alertId);
    loadAlerts();
  };

  const handleDeleteAlert = (alertId: string) => {
    supplierAlertsManager.deleteAlert(alertId);
    loadAlerts();
  };

  const handleClearReadAlerts = () => {
    supplierAlertsManager.clearReadAlerts();
    loadAlerts();
  };

  const getAlertIcon = (type: SupplierAlert['type']) => {
    const icons = {
      debt: DollarSign,
      rating: Star,
      contract: FileText,
      payment: Clock,
      delivery: Truck,
      quality: Shield,
      risk: AlertTriangle
    };
    
    return icons[type] || Info;
  };

  const getSeverityColor = (severity: SupplierAlert['severity']) => {
    const colors = {
      low: 'text-blue-600 bg-blue-50 border-blue-200',
      medium: 'text-amber-600 bg-amber-50 border-amber-200',
      high: 'text-orange-600 bg-orange-50 border-orange-200',
      critical: 'text-red-600 bg-red-50 border-red-200'
    };
    
    return colors[severity];
  };

  const getSeverityIcon = (severity: SupplierAlert['severity']) => {
    if (severity === 'critical' || severity === 'high') return AlertTriangle;
    if (severity === 'medium') return AlertCircle;
    return Info;
  };

  const filteredAlerts = alerts.filter(alert => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !alert.isRead;
    if (activeTab === 'critical') return alert.severity === 'critical' || alert.severity === 'high';
    return alert.type === activeTab;
  });

  const formatAlertTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    return `منذ ${diffDays} يوم`;
  };

  if (compact) {
    const unreadCount = stats.unread;
    const criticalCount = stats.critical;
    
    if (unreadCount === 0) return null;

    return (
      <Alert className={`${className} ${criticalCount > 0 ? 'border-red-200 bg-red-50' : ''}`}>
        <Bell className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>
            {unreadCount} تنبيه جديد {criticalCount > 0 && `(${criticalCount} حرج)`}
          </span>
          <Button variant="ghost" size="sm" onClick={() => window.location.hash = '#alerts'}>
            عرض الكل
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            تنبيهات الموردين
            {stats.unread > 0 && (
              <Badge variant="destructive" className="ml-2">
                {stats.unread}
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearReadAlerts}
              disabled={alerts.filter(a => a.isRead).length === 0}
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              مسح المقروء
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="all" className="font-cairo">
              الكل ({alerts.length})
            </TabsTrigger>
            <TabsTrigger value="unread" className="font-cairo">
              غير مقروء ({stats.unread})
            </TabsTrigger>
            <TabsTrigger value="critical" className="font-cairo">
              حرج ({stats.critical + stats.high})
            </TabsTrigger>
            <TabsTrigger value="debt" className="font-cairo">
              مديونيات ({stats.byType.debt})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <ScrollArea className="h-[400px]">
              {filteredAlerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد تنبيهات في هذا القسم
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAlerts.map((alert) => {
                    const AlertIcon = getAlertIcon(alert.type);
                    const SeverityIcon = getSeverityIcon(alert.severity);
                    
                    return (
                      <div
                        key={alert.id}
                        className={`p-4 border rounded-lg transition-all ${
                          alert.isRead 
                            ? 'bg-muted/30 border-muted' 
                            : `${getSeverityColor(alert.severity)} shadow-sm`
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            <SeverityIcon className={`h-5 w-5 ${
                              alert.severity === 'critical' || alert.severity === 'high' 
                                ? 'text-red-600' 
                                : alert.severity === 'medium'
                                ? 'text-amber-600'
                                : 'text-blue-600'
                            }`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertIcon className="h-4 w-4" />
                              <h4 className="font-medium text-sm">{alert.title}</h4>
                              <Badge variant="outline" className="text-xs">
                                {alert.severity === 'critical' ? 'حرج' :
                                 alert.severity === 'high' ? 'مرتفع' :
                                 alert.severity === 'medium' ? 'متوسط' : 'منخفض'}
                              </Badge>
                              {!alert.isRead && (
                                <Badge variant="default" className="text-xs">جديد</Badge>
                              )}
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-2">
                              {alert.message}
                            </p>
                            
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                {alert.supplierName} • {formatAlertTime(alert.createdAt)}
                              </span>
                              
                              <div className="flex gap-1">
                                {!alert.isRead && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleMarkAsRead(alert.id)}
                                    className="h-6 px-2"
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteAlert(alert.id)}
                                  className="h-6 px-2 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            
                            {alert.actionRequired && !alert.isRead && (
                              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                                هذا التنبيه يتطلب إجراءً فورياً
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}