import React, { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  Search, 
  Filter, 
  Check, 
  X, 
  AlertTriangle, 
  DollarSign, 
  Package, 
  Users, 
  TrendingUp,
  Settings,
  CheckCheck
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const categoryIcons = {
  financial: DollarSign,
  inventory: Package,
  customer: Users,
  reports: TrendingUp,
  security: AlertTriangle,
  system: Settings,
  general: Bell
};

const priorityColors = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-blue-100 text-blue-800 border-blue-200',
  low: 'bg-gray-100 text-gray-800 border-gray-200'
};

export function NotificationCenter() {
  const {
    notifications,
    loading,
    notificationStats,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');

  // تصفية الإشعارات
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || notification.category === selectedCategory;
    const matchesPriority = selectedPriority === 'all' || notification.priority === selectedPriority;
    
    return matchesSearch && matchesCategory && matchesPriority;
  });

  const unreadNotifications = filteredNotifications.filter(n => !n.is_read);
  const readNotifications = filteredNotifications.filter(n => n.is_read);

  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">جاري تحميل الإشعارات...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* عنوان ومعلومات إحصائية */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6" />
          <h1 className="text-2xl font-bold">مركز الإشعارات</h1>
          {notificationStats.unread > 0 && (
            <Badge variant="destructive" className="text-xs">
              {notificationStats.unread} جديد
            </Badge>
          )}
        </div>
        
        {notificationStats.unread > 0 && (
          <Button onClick={markAllAsRead} variant="outline" size="sm">
            <CheckCheck className="h-4 w-4 ml-1" />
            تمييز الكل كمقروء
          </Button>
        )}
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{notificationStats.total}</p>
                <p className="text-sm text-muted-foreground">إجمالي الإشعارات</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{notificationStats.critical}</p>
                <p className="text-sm text-muted-foreground">حرجة</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{notificationStats.actionRequired}</p>
                <p className="text-sm text-muted-foreground">تتطلب إجراء</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{Object.keys(notificationStats.byCategory).length}</p>
                <p className="text-sm text-muted-foreground">فئات نشطة</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* أدوات البحث والتصفية */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث في الإشعارات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">جميع الفئات</option>
                <option value="financial">مالية</option>
                <option value="inventory">مخزون</option>
                <option value="customer">عملاء</option>
                <option value="reports">تقارير</option>
                <option value="security">أمان</option>
                <option value="system">نظام</option>
              </select>

              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">جميع الأولويات</option>
                <option value="critical">حرجة</option>
                <option value="high">عالية</option>
                <option value="medium">متوسطة</option>
                <option value="low">منخفضة</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* قائمة الإشعارات */}
      <Tabs defaultValue="unread" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="unread">
            غير مقروءة ({unreadNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="read">
            مقروءة ({readNotifications.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unread">
          <Card>
            <CardHeader>
              <CardTitle>الإشعارات غير المقروءة</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {unreadNotifications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>لا توجد إشعارات غير مقروءة</p>
                    </div>
                  ) : (
                    unreadNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onClick={() => handleNotificationClick(notification)}
                        onMarkAsRead={() => markAsRead(notification.id)}
                        onDelete={() => deleteNotification(notification.id)}
                        isUnread
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="read">
          <Card>
            <CardHeader>
              <CardTitle>الإشعارات المقروءة</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {readNotifications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Check className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>لا توجد إشعارات مقروءة</p>
                    </div>
                  ) : (
                    readNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onClick={() => handleNotificationClick(notification)}
                        onDelete={() => deleteNotification(notification.id)}
                        isUnread={false}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface NotificationItemProps {
  notification: any;
  onClick: () => void;
  onMarkAsRead?: () => void;
  onDelete: () => void;
  isUnread: boolean;
}

function NotificationItem({ notification, onClick, onMarkAsRead, onDelete, isUnread }: NotificationItemProps) {
  const CategoryIcon = categoryIcons[notification.category as keyof typeof categoryIcons] || Bell;
  
  return (
    <div 
      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
        isUnread ? 'bg-blue-50 border-blue-200 border-l-4 border-l-blue-500' : 'bg-white'
      } hover:bg-gray-50`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <CategoryIcon className="h-5 w-5 mt-0.5 text-muted-foreground" />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className={`font-semibold text-sm ${isUnread ? 'text-blue-900' : 'text-gray-900'}`}>
                {notification.title}
              </h4>
              
              <Badge 
                variant="outline" 
                className={`text-xs ${priorityColors[notification.priority as keyof typeof priorityColors]}`}
              >
                {notification.priority === 'critical' && 'حرج'}
                {notification.priority === 'high' && 'عالي'}
                {notification.priority === 'medium' && 'متوسط'}
                {notification.priority === 'low' && 'منخفض'}
              </Badge>
              
              {notification.action_required && (
                <Badge variant="secondary" className="text-xs">
                  يتطلب إجراء
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mb-2">
              {notification.message}
            </p>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(notification.created_at), { 
                  addSuffix: true, 
                  locale: ar 
                })}
              </span>
              
              <div className="flex gap-1">
                {isUnread && onMarkAsRead && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkAsRead();
                    }}
                    className="h-7 text-xs"
                  >
                    <Check className="h-3 w-3 ml-1" />
                    تمييز كمقروء
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="h-7 text-xs text-red-600 hover:text-red-700"
                >
                  <X className="h-3 w-3 ml-1" />
                  حذف
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}