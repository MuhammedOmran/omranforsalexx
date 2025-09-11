import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Eye,
  Lock,
  Users,
  Activity,
  Database,
  Wifi,
  Settings
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AdvancedSecurityDashboard } from '@/components/security/AdvancedSecurityDashboard';
import { SecurityAlertsPanel } from '@/components/security/SecurityAlertsPanel';
import { SystemStatusMonitor } from '@/components/ui/system-status';

export default function ComprehensiveSecurity() {
  const { user, hasRole } = useAuth();
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    const checkAdminAccess = async () => {
      if (user) {
        const adminAccess = await hasRole('admin');
        setIsAdmin(adminAccess);
      }
    };

    checkAdminAccess();
  }, [user, hasRole]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>غير مصرح</AlertTitle>
          <AlertDescription>يجب تسجيل الدخول أولاً للوصول إلى هذه الصفحة</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertTitle>صلاحيات محدودة</AlertTitle>
          <AlertDescription>
            هذه الصفحة متاحة للمدراء فقط. يرجى التواصل مع مدير النظام للحصول على الصلاحيات المطلوبة.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const securityFeatures = [
    {
      icon: <Shield className="h-5 w-5 text-green-500" />,
      title: "نظام تسجيل الأحداث المتقدم",
      description: "تسجيل شامل لجميع الأحداث الأمنية مع تصنيف درجات المخاطرة",
      status: "نشط",
      color: "text-green-500"
    },
    {
      icon: <Eye className="h-5 w-5 text-blue-500" />,
      title: "كشف الأنشطة المشبوهة",
      description: "مراقبة تلقائية لمحاولات تسجيل الدخول المشبوهة والحظر التلقائي",
      status: "نشط",
      color: "text-blue-500"
    },
    {
      icon: <Users className="h-5 w-5 text-purple-500" />,
      title: "إدارة الجلسات المتقدمة",
      description: "تتبع الجلسات النشطة مع إمكانية الإنهاء الفوري للجلسات المشبوهة",
      status: "نشط",
      color: "text-purple-500"
    },
    {
      icon: <Database className="h-5 w-5 text-orange-500" />,
      title: "حماية قاعدة البيانات",
      description: "Row Level Security مفعل على جميع الجداول مع سياسات أمان صارمة",
      status: "نشط",
      color: "text-orange-500"
    },
    {
      icon: <Activity className="h-5 w-5 text-red-500" />,
      title: "مراقبة الأداء في الوقت الفعلي",
      description: "تنبيهات فورية للأحداث الحرجة مع إحصائيات تفصيلية",
      status: "نشط",
      color: "text-red-500"
    },
    {
      icon: <Lock className="h-5 w-5 text-indigo-500" />,
      title: "التشفير والحماية",
      description: "تشفير البيانات الحساسة وحماية متعددة الطبقات",
      status: "نشط",
      color: "text-indigo-500"
    }
  ];

  const pendingIssues = [
    {
      title: "انتهاء صلاحية OTP طويل",
      description: "يُنصح بتقليل مدة انتهاء صلاحية OTP لتحسين الأمان",
      severity: "متوسط",
      action: "تعديل إعدادات المصادقة في لوحة تحكم Supabase"
    },
    {
      title: "حماية كلمة المرور المسربة معطلة",
      description: "تفعيل فحص كلمات المرور المسربة لحماية إضافية",
      severity: "متوسط", 
      action: "تفعيل الخاصية في إعدادات المصادقة"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* رأس الصفحة */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Shield className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold">نظام الأمان الشامل</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          لوحة تحكم متكاملة لمراقبة وإدارة أمان النظام بالكامل مع حماية متعددة الطبقات
        </p>
      </div>

      {/* حالة الأمان العامة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            حالة الأمان العامة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {securityFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                <div className="flex-shrink-0">
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{feature.description}</p>
                  <Badge variant="outline" className={feature.color}>
                    {feature.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* المشاكل المعلقة */}
      {pendingIssues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-6 w-6 text-yellow-500" />
              إعدادات تحتاج تحديث
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingIssues.map((issue, index) => (
                <Alert key={index}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>{issue.title}</AlertTitle>
                  <AlertDescription className="mt-2">
                    <p className="mb-2">{issue.description}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">الخطورة: {issue.severity}</Badge>
                      <span className="text-sm text-muted-foreground">• {issue.action}</span>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* التبويبات الرئيسية */}
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">لوحة التحكم</TabsTrigger>
          <TabsTrigger value="alerts">التنبيهات</TabsTrigger>
          <TabsTrigger value="status">حالة النظام</TabsTrigger>
          <TabsTrigger value="reports">التقارير</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <AdvancedSecurityDashboard />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <SecurityAlertsPanel />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="h-5 w-5" />
                  إرشادات الأمان
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">✅ تم تفعيلها</h4>
                    <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                      <li>• نظام تسجيل الأحداث الأمنية</li>
                      <li>• كشف الأنشطة المشبوهة والحظر التلقائي</li>
                      <li>• إدارة الجلسات المتقدمة</li>
                      <li>• حماية قاعدة البيانات RLS</li>
                      <li>• تشفير البيانات الحساسة</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">⚠️ يحتاج إعداد يدوي</h4>
                    <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                      <li>• تقليل مدة انتهاء صلاحية OTP</li>
                      <li>• تفعيل فحص كلمات المرور المسربة</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="status" className="space-y-6">
          <SystemStatusMonitor />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>تقارير الأمان</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">قريباً</h3>
                <p>تقارير أمان تفصيلية وتحليلات متقدمة</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}