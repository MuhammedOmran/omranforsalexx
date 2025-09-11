import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  Lock, 
  Eye, 
  Users, 
  FileText, 
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import { useSecurityAudit } from '@/hooks/useSecurityAudit';
import { useLoginSecurity } from '@/hooks/useLoginSecurity';
import { useSecureTwoFactor } from '@/hooks/useSecureTwoFactor';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

export function SecurityDashboard() {
  const { user } = useAuth();
  const { getSecurityEvents, getSecurityStatistics } = useSecurityAudit();
  const { getSecurityStats } = useLoginSecurity();
  const { isEnabled: is2FAEnabled } = useSecureTwoFactor();
  
  const [securityStats, setSecurityStats] = useState<any>(null);
  const [loginStats, setLoginStats] = useState<any>(null);
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      const stats = getSecurityStatistics(); // آخر 7 أيام
      const loginData = getSecurityStats();
      const events = getSecurityEvents();

      setSecurityStats(stats);
      setLoginStats(loginData);
      setSecurityEvents(events.slice(0, 20)); // آخر 20 حدث
    } catch (error) {
      console.error('خطأ في تحميل بيانات الأمان:', error);
    }
  };

  const calculateOverallSecurityScore = (): number => {
    let score = 0;
    let maxScore = 100;

    // التحقق من المصادقة الثنائية
    if (is2FAEnabled) {
      score += 25;
    }

    // إحصائيات تسجيل الدخول
    if (loginStats) {
      score += Math.max(0, 25 - (loginStats.failedAttempts * 2));
      score += Math.max(0, 15 - (loginStats.lockedAccounts * 5));
    }

    // الأحداث الأمنية
    if (securityStats) {
      score += Math.max(0, 20 - (securityStats.criticalEvents * 5));
      score += Math.max(0, 15 - (securityStats.pendingApprovals * 3));
    }

    return Math.min(Math.max(score, 0), maxScore);
  };

  const getSecurityLevel = (score: number): { level: string; color: string; icon: any } => {
    if (score >= 90) {
      return { level: 'ممتاز', color: 'text-green-600', icon: Shield };
    } else if (score >= 75) {
      return { level: 'جيد', color: 'text-blue-600', icon: CheckCircle };
    } else if (score >= 50) {
      return { level: 'متوسط', color: 'text-yellow-600', icon: AlertTriangle };
    } else {
      return { level: 'ضعيف', color: 'text-red-600', icon: XCircle };
    }
  };

  const overallScore = calculateOverallSecurityScore();
  const securityLevel = getSecurityLevel(overallScore);
  const SecurityIcon = securityLevel.icon;

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">يرجى تسجيل الدخول لعرض لوحة الأمان</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* نظرة عامة على الأمان */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مستوى الأمان العام</CardTitle>
            <SecurityIcon className={`h-4 w-4 ${securityLevel.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{overallScore}%</div>
            <Progress value={overallScore} className="mb-2" />
            <Badge variant="outline" className={securityLevel.color}>
              {securityLevel.level}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الأحداث الحرجة</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {securityStats?.criticalEvents || 0}
            </div>
            <p className="text-xs text-muted-foreground">آخر 7 أيام</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">محاولات الدخول الفاشلة</CardTitle>
            <Lock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {loginStats?.failedAttempts || 0}
            </div>
            <p className="text-xs text-muted-foreground">آخر 24 ساعة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المصادقة الثنائية</CardTitle>
            <Shield className={`h-4 w-4 ${is2FAEnabled ? 'text-green-600' : 'text-gray-400'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {is2FAEnabled ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : (
                <XCircle className="h-8 w-8 text-red-600" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {is2FAEnabled ? 'مفعلة' : 'غير مفعلة'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* تفاصيل الأمان */}
      <Tabs defaultValue="events" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="events">الأحداث الأمنية</TabsTrigger>
          <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
          <TabsTrigger value="recommendations">التوصيات</TabsTrigger>
          <TabsTrigger value="reports">التقارير</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                الأحداث الأمنية الأخيرة
              </CardTitle>
              <CardDescription>
                آخر الأحداث والأنشطة الأمنية في النظام
              </CardDescription>
            </CardHeader>
            <CardContent>
              {securityEvents.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  لا توجد أحداث أمنية حديثة
                </p>
              ) : (
                <div className="space-y-3">
                  {securityEvents.map((event, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-1 rounded-full ${getSeverityColor(event.severity)}`}>
                        {(() => {
                          const IconComponent = getSeverityIcon(event.severity);
                          return <IconComponent className="h-4 w-4" />;
                        })()}
                        </div>
                        <div>
                          <p className="font-medium">{event.operation}</p>
                          <p className="text-sm text-muted-foreground">
                            {event.userEmail} - {event.module}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className={getSeverityTextColor(event.severity)}>
                          {getSeverityLabel(event.severity)}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(event.timestamp).toLocaleString('ar-EG')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="login" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>إحصائيات تسجيل الدخول</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>المحاولات الناجحة:</span>
                  <span className="font-bold text-green-600">
                    {loginStats?.successfulAttempts || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>المحاولات الفاشلة:</span>
                  <span className="font-bold text-red-600">
                    {loginStats?.failedAttempts || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>الحسابات المقفلة:</span>
                  <span className="font-bold text-orange-600">
                    {loginStats?.lockedAccounts || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>عناوين IP المشبوهة:</span>
                  <span className="font-bold text-purple-600">
                    {loginStats?.suspiciousIPs || 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>نقاط الأمان</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">درجة تسجيل الدخول</span>
                      <span className="text-sm font-bold">
                        {loginStats?.securityScore || 0}%
                      </span>
                    </div>
                    <Progress value={loginStats?.securityScore || 0} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>توصيات الأمان</CardTitle>
              <CardDescription>
                اتبع هذه التوصيات لتحسين مستوى الأمان
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {generateSecurityRecommendations().map((recommendation, index) => (
                <Alert key={index} className={recommendation.urgent ? 'border-red-200' : 'border-blue-200'}>
                  <recommendation.icon className="h-4 w-4" />
                  <AlertTitle>{recommendation.title}</AlertTitle>
                  <AlertDescription className="mt-2">
                    {recommendation.description}
                    {recommendation.action && (
                      <Button variant="outline" size="sm" className="mt-2">
                        {recommendation.action}
                      </Button>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>التقارير الأمنية</CardTitle>
              <CardDescription>
                تقارير تفصيلية عن حالة الأمان في النظام
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <FileText className="h-6 w-6" />
                  <span>تقرير الأحداث الأمنية</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Users className="h-6 w-6" />
                  <span>تقرير نشاط المستخدمين</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <TrendingUp className="h-6 w-6" />
                  <span>تقرير الاتجاهات الأمنية</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Settings className="h-6 w-6" />
                  <span>تقرير إعدادات الأمان</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  // وظائف مساعدة
  function getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return 'bg-red-100';
      case 'high': return 'bg-orange-100';
      case 'medium': return 'bg-yellow-100';
      default: return 'bg-blue-100';
    }
  }

  function getSeverityTextColor(severity: string): string {
    switch (severity) {
      case 'critical': return 'text-red-600 border-red-600';
      case 'high': return 'text-orange-600 border-orange-600';
      case 'medium': return 'text-yellow-600 border-yellow-600';
      default: return 'text-blue-600 border-blue-600';
    }
  }

  function getSeverityIcon(severity: string) {
    switch (severity) {
      case 'critical': return AlertTriangle;
      case 'high': return AlertTriangle;
      case 'medium': return Eye;
      default: return Activity;
    }
  }

  function getSeverityLabel(severity: string): string {
    switch (severity) {
      case 'critical': return 'حرج';
      case 'high': return 'عالي';
      case 'medium': return 'متوسط';
      default: return 'منخفض';
    }
  }

  function generateSecurityRecommendations() {
    const recommendations = [];

    if (!is2FAEnabled) {
      recommendations.push({
        title: 'تفعيل المصادقة الثنائية',
        description: 'لم يتم تفعيل المصادقة الثنائية. يُنصح بشدة بتفعيلها لحماية إضافية.',
        icon: Shield,
        urgent: true,
        action: 'تفعيل الآن'
      });
    }

    if (loginStats?.failedAttempts > 5) {
      recommendations.push({
        title: 'مراجعة محاولات تسجيل الدخول الفاشلة',
        description: 'تم رصد عدد كبير من محاولات تسجيل الدخول الفاشلة. يرجى مراجعة الأنشطة المشبوهة.',
        icon: AlertTriangle,
        urgent: true,
        action: 'مراجعة السجلات'
      });
    }

    if (securityStats?.pendingApprovals > 0) {
      recommendations.push({
        title: 'موافقات معلقة',
        description: `يوجد ${securityStats.pendingApprovals} عملية تحتاج إلى موافقة إدارية.`,
        icon: Clock,
        urgent: false,
        action: 'مراجعة العمليات'
      });
    }

    if (overallScore < 75) {
      recommendations.push({
        title: 'تحسين مستوى الأمان العام',
        description: 'مستوى الأمان الحالي أقل من المطلوب. يرجى اتباع التوصيات لتحسينه.',
        icon: TrendingUp,
        urgent: false,
        action: 'عرض التفاصيل'
      });
    }

    return recommendations;
  }
}