import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LicenseActivation } from '@/components/ui/license-activation';
import { LicenseKeyGenerator } from '@/components/admin/LicenseKeyGenerator';
import { SalesDistributionGuide } from '@/components/admin/SalesDistributionGuide';
import { LicenseAnalyticsDashboard } from '@/components/analytics/LicenseAnalyticsDashboard';
import { 
  Shield, 
  Key, 
  Package, 
  BarChart3,
  Users,
  Calendar,
  DollarSign,
  Lock,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';


export default function LicenseManagement() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('activation');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showError, setShowError] = useState(false);

  const handlePasswordSubmit = () => {
    if (password === 'ahmed01122329724K') {
      setIsAuthenticated(true);
      setShowError(false);
    } else {
      setShowError(true);
    }
  };

  // إحصائيات فارغة (سيتم ملؤها من قاعدة البيانات)
  const stats = [
    {
      title: "التراخيص النشطة",
      value: "0",
      icon: <Shield className="h-5 w-5" />,
      change: "0%"
    },
    {
      title: "العملاء الجدد",
      value: "0",
      icon: <Users className="h-5 w-5" />,
      change: "0%"
    },
    {
      title: "التراخيص منتهية الصلاحية",
      value: "0",
      icon: <Calendar className="h-5 w-5" />,
      change: "0%"
    },
    {
      title: "الإيرادات الشهرية",
      value: "0 جنية مصري",
      icon: <DollarSign className="h-5 w-5" />,
      change: "0%"
    }
  ];

  if (!isAuthenticated) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                صفحة محمية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-password">كلمة مرور المدير</Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="أدخل كلمة المرور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                />
              </div>
              
              {showError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    كلمة المرور غير صحيحة
                  </AlertDescription>
                </Alert>
              )}

              <Button onClick={handlePasswordSubmit} className="w-full">
                دخول
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* العنوان والإحصائيات */}
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold">إدارة التراخيص</h1>
            <p className="text-muted-foreground">
              إدارة شاملة لتراخيص النظام والعملاء
            </p>
          </div>

          {/* الإحصائيات السريعة */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </p>
                      <div className="flex items-center gap-2">
                        <h3 className="text-2xl font-bold">{stat.value}</h3>
                        <span className="text-sm text-green-600">{stat.change}</span>
                      </div>
                    </div>
                    <div className="text-primary">
                      {stat.icon}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* علامات التبويب الرئيسية */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="activation" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              تفعيل الترخيص
            </TabsTrigger>
            
            <TabsTrigger value="generator" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              مولد المفاتيح
            </TabsTrigger>
            
            <TabsTrigger value="sales" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              دليل البيع
            </TabsTrigger>
            
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              التحليلات
            </TabsTrigger>
          </TabsList>

          {/* تفعيل الترخيص */}
          <TabsContent value="activation" className="space-y-6">
            <LicenseActivation />
          </TabsContent>

          {/* مولد مفاتيح التراخيص */}
          <TabsContent value="generator" className="space-y-6">
            {(user?.role?.name === 'admin' || user?.role?.name === 'developer' || user?.role?.name === 'super-admin') ? (
              <LicenseKeyGenerator />
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">يمكن للمطورين والمدراء فقط الوصول إلى هذا القسم</p>
              </div>
            )}
          </TabsContent>

          {/* دليل البيع والتوزيع */}
          <TabsContent value="sales" className="space-y-6">
            {(user?.role?.name === 'admin' || user?.role?.name === 'developer' || user?.role?.name === 'super-admin') ? (
              <SalesDistributionGuide />
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">يمكن للمطورين والمدراء فقط الوصول إلى هذا القسم</p>
              </div>
            )}
          </TabsContent>

          {/* التحليلات والتقارير */}
          <TabsContent value="analytics" className="space-y-6">
            {(user?.role?.name === 'admin' || user?.role?.name === 'developer' || user?.role?.name === 'super-admin') ? (
              <LicenseAnalyticsDashboard />
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">يمكن للمطورين والمدراء فقط الوصول إلى هذا القسم</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}