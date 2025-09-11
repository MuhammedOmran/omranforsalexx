import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Bell, 
  AlertTriangle, 
  Package, 
  CreditCard, 
  Calendar, 
  TrendingUp,
  CheckCircle,
  X,
  Eye,
  EyeOff,
  Filter,
  RefreshCw,
  Info
} from 'lucide-react';
import { smartAlertsManager, SmartAlert } from '@/utils/smartAlertsManager';
import { useToast } from '@/hooks/use-toast';

export const SmartAlertsDashboard = () => {
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<SmartAlert[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | SmartAlert['type']>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<any>({});
  const { toast } = useToast();

  useEffect(() => {
    loadAlerts();
    loadStats();
    
    // تحديث التنبيهات كل 5 دقائق
    const interval = setInterval(() => {
      generateNewAlerts();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [alerts, filter, typeFilter]);

  const loadAlerts = () => {
    const allAlerts = smartAlertsManager.getAllAlerts();
    setAlerts(allAlerts);
  };

  const loadStats = () => {
    const statistics = smartAlertsManager.getAlertsStatistics();
    setStats(statistics);
  };

  const generateNewAlerts = async () => {
    setIsLoading(true);
    try {
      await smartAlertsManager.generateAllSmartAlerts();
      loadAlerts();
      loadStats();
      
      toast({
        title: "تم تحديث التنبيهات",
        description: "تم فحص وتحديث التنبيهات الذكية",
      });
    } catch (error) {
      toast({
        title: "خطأ في التحديث",
        description: "فشل في تحديث التنبيهات",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...alerts];

    // فلتر حسب الحالة
    if (filter !== 'all') {
      if (filter === 'unread') {
        filtered = filtered.filter(alert => !alert.isRead);
      } else {
        filtered = filtered.filter(alert => alert.priority === filter);
      }
    }

    // فلتر حسب النوع
    if (typeFilter !== 'all') {
      filtered = filtered.filter(alert => alert.type === typeFilter);
    }

    // ترتيب حسب الأولوية والتاريخ
    filtered.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    setFilteredAlerts(filtered);
  };

  const markAsRead = (alertId: string) => {
    smartAlertsManager.markAsRead(alertId);
    loadAlerts();
    loadStats();
    
    toast({
      title: "تم تحديد التنبيه كمقروء",
    });
  };

  const markAllAsRead = () => {
    smartAlertsManager.markAllAsRead();
    loadAlerts();
    loadStats();
    
    toast({
      title: "تم تحديد جميع التنبيهات كمقروءة",
    });
  };

  const deleteAlert = (alertId: string) => {
    smartAlertsManager.deleteAlert(alertId);
    loadAlerts();
    loadStats();
    
    toast({
      title: "تم حذف التنبيه",
    });
  };

  const getSeverityColor = (priority: SmartAlert['priority']) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getSeverityIcon = (priority: SmartAlert['priority']) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'medium': return <Package className="h-4 w-4 text-muted-foreground" />;
      case 'low': return <Bell className="h-4 w-4 text-muted-foreground" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: SmartAlert['type']) => {
    switch (type) {
      case 'warning': return <Package className="h-4 w-4" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      case 'info': return <Info className="h-4 w-4" />;
      case 'success': return <CheckCircle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: SmartAlert['type']) => {
    switch (type) {
      case 'warning': return 'تحذير';
      case 'error': return 'خطأ';
      case 'info': return 'معلومات';
      case 'success': return 'نجح';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* إحصائيات التنبيهات */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">إجمالي التنبيهات</div>
                <div className="text-2xl font-bold">{stats.total || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <EyeOff className="h-5 w-5 text-warning" />
              <div>
                <div className="text-sm text-muted-foreground">غير مقروءة</div>
                <div className="text-2xl font-bold text-warning">{stats.unread || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <div className="text-sm text-muted-foreground">حرجة وعالية</div>
                <div className="text-2xl font-bold text-destructive">
                  {(stats.bySeverity?.critical || 0) + (stats.bySeverity?.high || 0)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <div>
                <div className="text-sm text-muted-foreground">تتطلب إجراء</div>
                <div className="text-2xl font-bold text-success">{stats.actionRequired || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* رأس الصفحة والفلاتر */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-6 w-6" />
                لوحة التنبيهات الذكية
                {stats.unread > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {stats.unread}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                إدارة ومتابعة التنبيهات التلقائية للنظام
              </CardDescription>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={generateNewAlerts}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                تحديث
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                disabled={stats.unread === 0}
              >
                <CheckCircle className="h-4 w-4" />
                تحديد الكل كمقروء
              </Button>
            </div>
          </div>

          {/* الفلاتر */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            <div className="flex gap-1">
              <Badge
                variant={filter === 'all' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setFilter('all')}
              >
                الكل
              </Badge>
              <Badge
                variant={filter === 'unread' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setFilter('unread')}
              >
                غير مقروءة
              </Badge>
              <Badge
                variant={filter === 'critical' ? 'destructive' : 'outline'}
                className="cursor-pointer"
                onClick={() => setFilter('critical')}
              >
                حرجة
              </Badge>
              <Badge
                variant={filter === 'high' ? 'destructive' : 'outline'}
                className="cursor-pointer"
                onClick={() => setFilter('high')}
              >
                عالية
              </Badge>
              <Badge
                variant={filter === 'medium' ? 'secondary' : 'outline'}
                className="cursor-pointer"
                onClick={() => setFilter('medium')}
              >
                متوسطة
              </Badge>
              <Badge
                variant={filter === 'low' ? 'secondary' : 'outline'}
                className="cursor-pointer"
                onClick={() => setFilter('low')}
              >
                منخفضة
              </Badge>
            </div>

            <div className="border-r pr-2 mr-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="text-sm border rounded px-2 py-1 bg-background"
              >
                <option value="all">جميع الأنواع</option>
                <option value="warning">تحذيرات</option>
                <option value="error">أخطاء</option>
                <option value="info">معلومات</option>
                <option value="success">نجح</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {filter === 'all' ? 'لا توجد تنبيهات حالياً' : 'لا توجد تنبيهات مطابقة للفلتر المحدد'}
                </p>
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <Alert
                  key={alert.id}
                  className={`${
                    !alert.isRead ? 'border-l-4 border-l-primary bg-primary/5' : ''
                  } ${
                    alert.priority === 'critical' ? 'border-destructive bg-destructive/10' :
                    alert.priority === 'high' ? 'border-destructive/70 bg-destructive/5' :
                    alert.priority === 'medium' ? 'border-muted bg-muted/5' :
                    'bg-muted/30'
                  }`}
                >
                    <div className="flex items-start justify-between w-full">
                      <div className="flex items-start gap-3 flex-1">
                        {getSeverityIcon(alert.priority)}
                        <div className="flex-1 min-w-0">
                          <AlertTitle className="flex items-center gap-2 mb-1">
                            {getTypeIcon(alert.type)}
                            <span className="truncate">{alert.title}</span>
                            <div className="flex gap-1">
                              <Badge variant={getSeverityColor(alert.priority) as any} className="text-xs">
                                {alert.priority === 'critical' ? 'حرج' :
                                 alert.priority === 'high' ? 'عالي' :
                                 alert.priority === 'medium' ? 'متوسط' : 'منخفض'}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {getTypeLabel(alert.type)}
                              </Badge>
                              {alert.actionRequired && (
                                <Badge variant="destructive" className="text-xs">
                                  يتطلب إجراء
                                </Badge>
                              )}
                            </div>
                          </AlertTitle>
                          
                          <AlertDescription className="mb-2">
                            {alert.message}
                          </AlertDescription>

                          {alert.data && (alert.data.amount || alert.data.daysUntilDue) && (
                            <div className="flex gap-4 text-xs text-muted-foreground mb-2">
                              {alert.data.amount && (
                                <span>المبلغ: {alert.data.amount.toLocaleString()} ر.س</span>
                              )}
                              {alert.data.daysUntilDue !== undefined && (
                                <span>أيام متبقية: {alert.data.daysUntilDue}</span>
                              )}
                            </div>
                          )}

                          <div className="text-xs text-muted-foreground">
                            {new Date(alert.createdAt).toLocaleString('ar-SA')}
                          </div>
                        </div>
                      </div>

                    <div className="flex items-center gap-1 ml-4">
                      {!alert.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(alert.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAlert(alert.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Alert>
              ))
            )}
          </div>

          {filteredAlerts.length > 0 && (
            <div className="text-center pt-4 text-sm text-muted-foreground">
              عرض {filteredAlerts.length} من {alerts.length} تنبيه
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};