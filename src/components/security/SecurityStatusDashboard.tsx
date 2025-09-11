import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, Activity, Eye, Lock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { supabase } from '@/integrations/supabase/client';

interface SecurityMetrics {
  rls_coverage: number;
  rls_tables_count: number;
  total_tables_count: number;
  recent_high_risk_events: number;
  overall_status: string;
  last_check: string;
}

interface DailyReport {
  date: string;
  high_risk_events: number;
  failed_logins: number;
  blocked_ips: number;
  suspicious_activities: number;
  security_status: string;
}

export function SecurityStatusDashboard() {
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics | null>(null);
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { getSecurityHealthCheck, getDailySecurityReport } = useSecureAuth();

  const loadSecurityData = async () => {
    try {
      setRefreshing(true);
      
      // جلب بيانات فحص الصحة الأمنية
      const healthCheck = await getSecurityHealthCheck();
      if (healthCheck && typeof healthCheck === 'object') {
        setSecurityMetrics(healthCheck as unknown as SecurityMetrics);
      }
      
      // جلب التقرير اليومي
      const report = await getDailySecurityReport();
      if (report && typeof report === 'object') {
        setDailyReport(report as unknown as DailyReport);
      }
    } catch (error) {
      console.error('خطأ في جلب بيانات الأمان:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSecurityData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'جيد':
      case 'آمن':
        return 'text-green-600 bg-green-100';
      case 'تحذير متوسط':
      case 'يحتاج تحسين':
        return 'text-yellow-600 bg-yellow-100';
      case 'تحذير عالي':
      case 'تحذير':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'جيد':
      case 'آمن':
        return CheckCircle;
      case 'تحذير متوسط':
      case 'يحتاج تحسين':
        return AlertTriangle;
      case 'تحذير عالي':
      case 'تحذير':
        return AlertTriangle;
      default:
        return Shield;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-300 rounded w-24"></div>
                <div className="h-4 w-4 bg-gray-300 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-300 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-32"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* عنوان القسم */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold font-cairo">لوحة الأمان</h2>
        </div>
        <Button 
          onClick={loadSecurityData} 
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          {refreshing ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              جاري التحديث...
            </div>
          ) : (
            'تحديث البيانات'
          )}
        </Button>
      </div>

      {/* بطاقات المقاييس الرئيسية */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* حالة النظام الأمني */}
        {securityMetrics && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-cairo">
                حالة النظام
              </CardTitle>
              {(() => {
                const IconComponent = getStatusIcon(securityMetrics.overall_status);
                return <IconComponent className="h-4 w-4 text-muted-foreground" />;
              })()}
            </CardHeader>
            <CardContent>
              <Badge 
                className={`${getStatusColor(securityMetrics.overall_status)} font-tajawal`}
                variant="secondary"
              >
                {securityMetrics.overall_status}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2 font-munada">
                آخر فحص: {new Date(securityMetrics.last_check).toLocaleDateString('ar')}
              </p>
            </CardContent>
          </Card>
        )}

        {/* تغطية RLS */}
        {securityMetrics && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-cairo">
                تغطية الأمان
              </CardTitle>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-arabic-digits">
                {securityMetrics.rls_coverage}%
              </div>
              <Progress 
                value={securityMetrics.rls_coverage} 
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1 font-munada">
                {securityMetrics.rls_tables_count} من {securityMetrics.total_tables_count} جدول محمي
              </p>
            </CardContent>
          </Card>
        )}

        {/* الأحداث عالية المخاطر */}
        {securityMetrics && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-cairo">
                أحداث عالية المخاطر
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-arabic-digits">
                {securityMetrics.recent_high_risk_events}
              </div>
              <p className="text-xs text-muted-foreground font-munada">
                خلال آخر 24 ساعة
              </p>
            </CardContent>
          </Card>
        )}

        {/* حالة اليوم */}
        {dailyReport && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-cairo">
                حالة اليوم
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Badge 
                className={`${getStatusColor(dailyReport.security_status)} font-tajawal`}
                variant="secondary"
              >
                {dailyReport.security_status}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2 font-munada">
                {new Date(dailyReport.date).toLocaleDateString('ar')}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* التفاصيل اليومية */}
      {dailyReport && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-cairo">
                <TrendingUp className="h-5 w-5" />
                إحصائيات اليوم
              </CardTitle>
              <CardDescription className="font-tajawal">
                ملخص الأنشطة الأمنية لليوم الحالي
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-cairo">محاولات تسجيل دخول فاشلة</span>
                <Badge variant="outline" className="font-arabic-digits">
                  {dailyReport.failed_logins}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-cairo">IPs محظورة</span>
                <Badge variant="outline" className="font-arabic-digits">
                  {dailyReport.blocked_ips}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-cairo">أنشطة مشبوهة</span>
                <Badge variant="outline" className="font-arabic-digits">
                  {dailyReport.suspicious_activities}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-cairo">أحداث عالية المخاطر</span>
                <Badge 
                  variant={dailyReport.high_risk_events > 5 ? "destructive" : "outline"}
                  className="font-arabic-digits"
                >
                  {dailyReport.high_risk_events}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-cairo">
                <Eye className="h-5 w-5" />
                توصيات الأمان
              </CardTitle>
              <CardDescription className="font-tajawal">
                إرشادات لتحسين الأمان
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {securityMetrics?.rls_coverage && securityMetrics.rls_coverage < 100 && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold font-cairo text-yellow-800 dark:text-yellow-200">
                      تحسين تغطية الأمان
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-300 font-tajawal">
                      يوجد {securityMetrics.total_tables_count - securityMetrics.rls_tables_count} جدول بدون حماية RLS
                    </p>
                  </div>
                </div>
              )}

              {dailyReport.high_risk_events > 5 && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold font-cairo text-red-800 dark:text-red-200">
                      تحذير أمني
                    </p>
                    <p className="text-red-700 dark:text-red-300 font-tajawal">
                      عدد مرتفع من الأحداث عالية المخاطر اليوم
                    </p>
                  </div>
                </div>
              )}

              {securityMetrics?.overall_status === 'جيد' && dailyReport.high_risk_events <= 2 && (
                <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold font-cairo text-green-800 dark:text-green-200">
                      النظام آمن
                    </p>
                    <p className="text-green-700 dark:text-green-300 font-tajawal">
                      جميع المؤشرات الأمنية في المستوى المطلوب
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}