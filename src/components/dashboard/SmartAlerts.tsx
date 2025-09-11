import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { smartAlertsManager, SmartAlert } from '@/utils/smartAlertsManager';
import { 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  XCircle, 
  Package, 
  DollarSign, 
  Users, 
  Truck,
  Bell,
  Eye,
  Filter
} from 'lucide-react';

const alertIcons = {
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
  success: CheckCircle
};

const alertColors = {
  warning: 'text-amber-500 bg-amber-50 border-amber-200',
  error: 'text-red-500 bg-red-50 border-red-200',
  info: 'text-blue-500 bg-blue-50 border-blue-200',
  success: 'text-green-500 bg-green-50 border-green-200'
};

const categoryIcons = {
  inventory: Package,
  financial: DollarSign,
  customer: Users,
  supplier: Truck,
  system: Bell
};

export function SmartAlerts() {
  const [alerts] = useState<SmartAlert[]>(smartAlertsManager.getAllAlerts());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  const stats = smartAlertsManager.getAlertsStatistics();

  const filteredAlerts = alerts.filter(alert => {
    if (selectedCategory !== 'all' && alert.category !== selectedCategory) return false;
    if (selectedPriority !== 'all' && alert.priority !== selectedPriority) return false;
    return true;
  });

  const highPriorityAlerts = alerts.filter(alert => alert.priority === 'high').slice(0, 5);

  const AlertCard = ({ alert }: { alert: SmartAlert }) => {
    const AlertIcon = alertIcons[alert.type];
    const CategoryIcon = categoryIcons[alert.category];

    return (
      <Card className={`border-l-4 ${alertColors[alert.type]}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 space-x-reverse">
              <div className={`p-2 rounded-full ${alertColors[alert.type]}`}>
                <AlertIcon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 space-x-reverse mb-1">
                  <h4 className="text-sm font-semibold text-foreground">
                    {alert.title}
                  </h4>
                  <CategoryIcon className="h-3 w-3 text-muted-foreground" />
                  <Badge 
                    variant={alert.priority === 'high' ? 'destructive' : 
                            alert.priority === 'medium' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {alert.priority === 'high' ? 'عالي' :
                     alert.priority === 'medium' ? 'متوسط' : 'منخفض'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {alert.message}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {new Date(alert.createdAt).toLocaleString('ar-EG', { numberingSystem: 'latn' })}
                  </span>
                  {alert.action && (
                    <Button asChild size="sm" variant="outline">
                      <Link to={alert.action.href}>
                        <Eye className="h-3 w-3 me-1" />
                        {alert.action.label}
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Bell className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">إجمالي التنبيهات</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">عالية الأولوية</p>
                <p className="text-xl font-bold">{stats.byPriority.high || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">متوسطة الأولوية</p>
                <p className="text-xl font-bold">{stats.byPriority.medium || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Info className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">منخفضة الأولوية</p>
                <p className="text-xl font-bold">{stats.byPriority.low || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* التنبيهات عالية الأولوية */}
      {highPriorityAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <XCircle className="h-5 w-5 text-red-500" />
              <span>تنبيهات عالية الأولوية</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {highPriorityAlerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* جميع التنبيهات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>جميع التنبيهات</span>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Filter className="h-4 w-4" />
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="all">كل الفئات</option>
                <option value="inventory">المخزون</option>
                <option value="financial">مالي</option>
                <option value="customer">العملاء</option>
                <option value="supplier">الموردين</option>
              </select>
              <select 
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="all">كل الأولويات</option>
                <option value="high">عالي</option>
                <option value="medium">متوسط</option>
                <option value="low">منخفض</option>
              </select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">الكل ({filteredAlerts.length})</TabsTrigger>
              <TabsTrigger value="inventory">
                المخزون ({filteredAlerts.filter(a => a.category === 'inventory').length})
              </TabsTrigger>
              <TabsTrigger value="financial">
                مالي ({filteredAlerts.filter(a => a.category === 'financial').length})
              </TabsTrigger>
              <TabsTrigger value="customers">
                العملاء ({filteredAlerts.filter(a => a.category === 'customers').length})
              </TabsTrigger>
              <TabsTrigger value="system">
                النظام ({filteredAlerts.filter(a => a.category === 'system').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <div className="space-y-3">
                {filteredAlerts.length > 0 ? (
                  filteredAlerts.map((alert) => (
                    <AlertCard key={alert.id} alert={alert} />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد تنبيهات حالياً
                  </div>
                )}
              </div>
            </TabsContent>

            {['inventory', 'financial', 'customers', 'system'].map(category => (
              <TabsContent key={category} value={category} className="mt-4">
                <div className="space-y-3">
                  {filteredAlerts.filter(alert => alert.category === category).map((alert) => (
                    <AlertCard key={alert.id} alert={alert} />
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}