import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar,
  DollarSign,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Target,
  Zap
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';

// بيانات فارغة - سيتم ملؤها من قاعدة البيانات الحقيقية
const mockData = {
  totalLicenses: 0,
  activeLicenses: 0,
  expiredLicenses: 0,
  trialLicenses: 0,
  monthlyRevenue: 0,
  newCustomers: 0,
  renewalRate: 0,
  avgLicenseDuration: 0
};

const licenseTypeData = [
  { name: 'تجريبي', value: 0, color: '#94a3b8' },
  { name: 'أساسي', value: 0, color: '#3b82f6' },
  { name: 'احترافي', value: 0, color: '#10b981' },
  { name: 'المؤسسات', value: 0, color: '#f59e0b' }
];

const monthlyRevenueData = [
  { month: 'يناير', revenue: 0, licenses: 0 },
  { month: 'فبراير', revenue: 0, licenses: 0 },
  { month: 'مارس', revenue: 0, licenses: 0 },
  { month: 'أبريل', revenue: 0, licenses: 0 },
  { month: 'مايو', revenue: 0, licenses: 0 },
  { month: 'يونيو', revenue: 0, licenses: 0 }
];

const customerActivityData = [
  { date: '2024-08-01', logins: 0, activations: 0, renewals: 0 },
  { date: '2024-08-02', logins: 0, activations: 0, renewals: 0 },
  { date: '2024-08-03', logins: 0, activations: 0, renewals: 0 },
  { date: '2024-08-04', logins: 0, activations: 0, renewals: 0 },
  { date: '2024-08-05', logins: 0, activations: 0, renewals: 0 },
  { date: '2024-08-06', logins: 0, activations: 0, renewals: 0 },
  { date: '2024-08-07', logins: 0, activations: 0, renewals: 0 }
];

const expiringLicenses: any[] = [];
// سيتم ملء هذه البيانات من قاعدة البيانات الحقيقية

export function LicenseAnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getBadgeVariant = (type: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      'تجريبي': 'secondary',
      'أساسي': 'default',
      'احترافي': 'default',
      'المؤسسات': 'default'
    };
    return variants[type] || 'default';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getDaysLeftColor = (days: number) => {
    if (days <= 7) return 'text-red-600 bg-red-50';
    if (days <= 30) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  return (
    <div className="space-y-6">
      {/* الإحصائيات السريعة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي التراخيص</p>
                <h3 className="text-2xl font-bold">{mockData.totalLicenses}</h3>
                <p className="text-sm text-muted-foreground">لا توجد بيانات حتى الآن</p>
              </div>
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">التراخيص النشطة</p>
                <h3 className="text-2xl font-bold">{mockData.activeLicenses}</h3>
                <p className="text-sm text-muted-foreground">لا توجد تراخيص نشطة</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">الإيرادات الشهرية</p>
                <h3 className="text-2xl font-bold">{formatCurrency(mockData.monthlyRevenue)}</h3>
                <p className="text-sm text-muted-foreground">لا توجد إيرادات حتى الآن</p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">معدل التجديد</p>
                <h3 className="text-2xl font-bold">{mockData.renewalRate}%</h3>
                <p className="text-sm text-muted-foreground">لا توجد بيانات تجديد</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* علامات التبويب للتحليلات المفصلة */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="revenue">الإيرادات</TabsTrigger>
          <TabsTrigger value="customers">العملاء</TabsTrigger>
          <TabsTrigger value="expiring">منتهية الصلاحية</TabsTrigger>
        </TabsList>

        {/* نظرة عامة */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* توزيع أنواع التراخيص */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  توزيع أنواع التراخيص
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">لا توجد بيانات</h3>
                  <p>لا توجد تراخيص مفعلة حتى الآن لعرض التوزيع</p>
                </div>
                <div className="mt-4 space-y-2">
                  {licenseTypeData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* نشاط العملاء */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  نشاط العملاء (آخر 7 أيام)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">لا توجد بيانات نشاط</h3>
                  <p>لا توجد أنشطة عملاء مسجلة حتى الآن</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* تحليلات الإيرادات */}
        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                نمو الإيرادات الشهرية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <DollarSign className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">لا توجد بيانات إيرادات</h3>
                <p>لا توجد إيرادات مسجلة حتى الآن</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <DollarSign className="h-8 w-8 mx-auto text-green-500 mb-2" />
                  <h3 className="text-lg font-semibold">متوسط قيمة الترخيص</h3>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(0)}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Target className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                  <h3 className="text-lg font-semibold">الهدف الشهري</h3>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(0)}</p>
                  <Progress value={0} className="mt-2" />
                  <p className="text-sm text-muted-foreground mt-1">0% مكتمل</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Zap className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                  <h3 className="text-lg font-semibold">النمو السنوي</h3>
                  <p className="text-2xl font-bold text-yellow-600">+0%</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* تحليلات العملاء */}
        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                نمو قاعدة العملاء
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">لا توجد بيانات عملاء</h3>
                <p>لا توجد بيانات نمو عملاء مسجلة حتى الآن</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                <h3 className="text-lg font-semibold">عملاء جدد</h3>
                <p className="text-2xl font-bold">{mockData.newCustomers}</p>
                <p className="text-sm text-muted-foreground">لا يوجد عملاء جدد</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <h3 className="text-lg font-semibold">معدل الاحتفاظ</h3>
                <p className="text-2xl font-bold">0%</p>
                <p className="text-sm text-muted-foreground">لا توجد بيانات احتفاظ</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Clock className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                <h3 className="text-lg font-semibold">متوسط مدة الترخيص</h3>
                <p className="text-2xl font-bold">{mockData.avgLicenseDuration}</p>
                <p className="text-sm text-muted-foreground">لا توجد بيانات</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                <h3 className="text-lg font-semibold">معدل التحويل</h3>
                <p className="text-2xl font-bold">0%</p>
                <p className="text-sm text-muted-foreground">لا توجد تحويلات</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* التراخيص منتهية الصلاحية */}
        <TabsContent value="expiring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                التراخيص المنتهية أو المنتهية قريباً
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <AlertTriangle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">لا توجد تراخيص منتهية</h3>
                <p>لا توجد تراخيص منتهية الصلاحية أو قريبة من الانتهاء</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <AlertTriangle className="h-8 w-8 mx-auto text-red-500 mb-2" />
                <h3 className="text-lg font-semibold">منتهية الصلاحية</h3>
                <p className="text-2xl font-bold text-red-600">{mockData.expiredLicenses}</p>
                <p className="text-sm text-muted-foreground">لا توجد تراخيص منتهية</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Clock className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                <h3 className="text-lg font-semibold">تنتهي خلال 30 يوم</h3>
                <p className="text-2xl font-bold text-yellow-600">0</p>
                <p className="text-sm text-muted-foreground">لا توجد تراخيص</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <DollarSign className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <h3 className="text-lg font-semibold">إيرادات معرضة للخطر</h3>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(0)}</p>
                <p className="text-sm text-muted-foreground">لا توجد إيرادات معرضة للخطر</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}