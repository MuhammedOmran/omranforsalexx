import { useState, useEffect } from "react";
import { Bell, X, CheckCheck, Clock, AlertCircle, Info, Settings, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useNotifications, SupabaseNotification } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";

function getNotificationIcon(type: SupabaseNotification['type']) {
  switch (type) {
    case "warning":
      return AlertCircle;
    case "success":
      return CheckCheck;
    case "error":
    case "critical":
      return AlertCircle;
    case "info":
      return Info;
    default:
      return Info;
  }
}

function getNotificationColor(type: SupabaseNotification['type']) {
  switch (type) {
    case "warning":
      return "text-yellow-600";
    case "success":
      return "text-green-600";
    case "error":
      return "text-red-600";
    case "critical":
      return "text-red-700";
    case "info":
      return "text-blue-600";
    default:
      return "text-muted-foreground";
  }
}

function getPriorityColor(priority: SupabaseNotification['priority']) {
  switch (priority) {
    case "critical":
      return "text-red-700 bg-red-50 border-red-200";
    case "high":
      return "text-orange-600 bg-orange-50 border-orange-200";
    case "medium":
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    case "low":
      return "text-gray-600 bg-gray-50 border-gray-200";
    default:
      return "text-muted-foreground bg-muted border-border";
  }
}

function getPriorityLabel(priority: SupabaseNotification['priority']) {
  switch (priority) {
    case "critical":
      return "حرج";
    case "high":
      return "عالي";
    case "medium":
      return "متوسط";
    case "low":
      return "منخفض";
    default:
      return "عادي";
  }
}

function getCategoryLabel(category: string) {
  const categoryMap: Record<string, string> = {
    'invoices': 'الفواتير',
    'inventory': 'المخزون',
    'checks': 'الشيكات',
    'cash_flow': 'التدفق النقدي',
    'customers': 'العملاء',
    'suppliers': 'الموردين',
    'security': 'الأمان',
    'financial_performance': 'الأداء المالي',
    'system': 'النظام',
    'general': 'عام'
  };
  return categoryMap[category] || category;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "الآن";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `منذ ${minutes} دقيقة`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `منذ ${hours} ساعة`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `منذ ${days} يوم`;
  }
}

export function NotificationButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("all");
  
  const {
    notifications,
    loading,
    notificationStats,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteReadNotifications,
  } = useNotifications();
  
  const navigate = useNavigate();

  // تصفية الإشعارات
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || notification.category === filterCategory;
    const matchesPriority = filterPriority === "all" || notification.priority === filterPriority;
    const matchesTab = activeTab === "all" || 
                      (activeTab === "unread" && !notification.is_read) ||
                      (activeTab === "action" && notification.action_required && !notification.is_read);
    
    return matchesSearch && matchesCategory && matchesPriority && matchesTab;
  });

  // الحصول على فئات فريدة
  const uniqueCategories = Array.from(new Set(notifications.map(n => n.category)));

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {notificationStats.unread > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs animate-pulse"
            >
              {notificationStats.unread > 9 ? "9+" : notificationStats.unread}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end" sideOffset={5}>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">الإشعارات</h3>
          <div className="flex items-center gap-2">
            {notificationStats.unread > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-xs"
              >
                قراءة الكل
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={deleteReadNotifications}
              className="text-xs"
            >
              حذف المقروءة
            </Button>
          </div>
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-4 gap-1 p-2 bg-muted/20">
          <div className="text-center">
            <div className="text-sm font-medium text-primary">{notificationStats.total}</div>
            <div className="text-xs text-muted-foreground">الكل</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-blue-600">{notificationStats.unread}</div>
            <div className="text-xs text-muted-foreground">غير مقروء</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-red-600">{notificationStats.critical}</div>
            <div className="text-xs text-muted-foreground">حرج</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-orange-600">{notificationStats.actionRequired}</div>
            <div className="text-xs text-muted-foreground">يتطلب إجراء</div>
          </div>
        </div>

        {/* البحث والتصفية */}
        <div className="p-3 border-b space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث في الإشعارات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="الفئة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                {uniqueCategories.map(category => (
                  <SelectItem key={category} value={category}>
                    {getCategoryLabel(category)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="الأولوية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأولويات</SelectItem>
                <SelectItem value="critical">حرج</SelectItem>
                <SelectItem value="high">عالي</SelectItem>
                <SelectItem value="medium">متوسط</SelectItem>
                <SelectItem value="low">منخفض</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* التبويبات */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mx-3 mt-2">
            <TabsTrigger value="all" className="text-xs">الكل</TabsTrigger>
            <TabsTrigger value="unread" className="text-xs">غير مقروء</TabsTrigger>
            <TabsTrigger value="action" className="text-xs">يتطلب إجراء</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            <ScrollArea className="h-[400px]">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm || filterCategory !== "all" || filterPriority !== "all" 
                      ? "لا توجد إشعارات تطابق البحث" 
                      : "لا توجد إشعارات"}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredNotifications.map((notification, index) => {
                    const Icon = getNotificationIcon(notification.type);
                    return (
                      <div key={notification.id}>
                        <div
                          className={cn(
                            "flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors cursor-pointer",
                            !notification.is_read && "bg-primary/5 border-r-2 border-r-primary"
                          )}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className={cn("mt-1 flex-shrink-0", getNotificationColor(notification.type))}>
                            <Icon className="h-4 w-4" />
                          </div>
                          
                          <div className="flex-1 space-y-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className={cn(
                                    "text-sm font-medium leading-none truncate",
                                    !notification.is_read && "font-semibold"
                                  )}>
                                    {notification.title}
                                  </p>
                                  <div className={cn(
                                    "text-xs px-1.5 py-0.5 rounded-full font-medium border",
                                    getPriorityColor(notification.priority)
                                  )}>
                                    {getPriorityLabel(notification.priority)}
                                  </div>
                                </div>
                                <p className="text-xs text-muted-foreground leading-snug mb-1 line-clamp-2">
                                  {notification.message}
                                </p>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">
                                      {getCategoryLabel(notification.category)}
                                    </span>
                                    <span className="text-xs text-muted-foreground">•</span>
                                    <span className="text-xs text-muted-foreground">
                                      {formatRelativeTime(notification.created_at)}
                                    </span>
                                  </div>
                                  {notification.action_required && notification.action_url && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-6 px-2 text-xs"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(notification.action_url!);
                                        setIsOpen(false);
                                      }}
                                    >
                                      {notification.action_text || 'عرض'}
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-1 hover:bg-destructive/10 flex-shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        {index < filteredNotifications.length - 1 && <Separator />}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {notifications.length > 0 && (
          <div className="p-3 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full" 
              onClick={() => {
                navigate('/settings');
                setIsOpen(false);
              }}
            >
              <Settings className="h-4 w-4 mr-2" />
              إعدادات الإشعارات
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}