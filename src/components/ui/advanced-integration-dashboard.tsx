import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertTriangle, 
  Zap, 
  TrendingUp, 
  Database, 
  RefreshCw,
  Settings,
  BarChart3,
  Link,
  Target,
  PlayCircle,
  CheckSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { advancedSystemIntegrationManager, SystemIntegrationResult } from '@/utils/advancedSystemIntegrationManager';

export function AdvancedIntegrationDashboard() {
  const { toast } = useToast();
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [lastResult, setLastResult] = useState<SystemIntegrationResult | null>(null);
  const [integrationProgress, setIntegrationProgress] = useState(0);

  // تشغيل التحسين الشامل
  const runAdvancedEnhancement = async () => {
    try {
      setIsEnhancing(true);
      setIntegrationProgress(10);
      
      toast({
        title: "بدء التحسين المتقدم",
        description: "جاري تحليل وتحسين جميع روابط الأنظمة...",
        variant: "default"
      });

      // محاكاة التقدم
      const progressInterval = setInterval(() => {
        setIntegrationProgress(prev => {
          if (prev < 90) return prev + 10;
          return prev;
        });
      }, 500);

      const result = await advancedSystemIntegrationManager.enhanceAllSystemIntegrations();
      
      clearInterval(progressInterval);
      setIntegrationProgress(100);
      setLastResult(result);

      toast({
        title: "اكتمل التحسين بنجاح ✅",
        description: `تم إصلاح ${result.totalIssuesFixed} مشكلة وإنشاء ${result.newLinksCreated} رابط جديد`,
        variant: "default"
      });

      setIsEnhancing(false);
      
    } catch (error) {
      console.error('خطأ في التحسين المتقدم:', error);
      toast({
        title: "خطأ في التحسين",
        description: "حدث خطأ أثناء عملية التحسين المتقدم",
        variant: "destructive"
      });
      setIsEnhancing(false);
      setIntegrationProgress(0);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* العنوان والأزرار */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">نظام التحسين المتقدم</h2>
          <p className="text-muted-foreground mt-2">
            تحسين شامل لترابط جميع أنظمة البرنامج وحل جميع مشاكل التكامل
          </p>
        </div>
        <Button 
          onClick={runAdvancedEnhancement}
          disabled={isEnhancing}
          size="lg"
          className="bg-gradient-to-r from-primary to-primary-foreground hover:from-primary/90 hover:to-primary-foreground/90"
        >
          <PlayCircle className="h-5 w-5 ml-2" />
          {isEnhancing ? 'جاري التحسين...' : 'تشغيل التحسين الشامل'}
        </Button>
      </div>

      {/* شريط التقدم أثناء التحسين */}
      {isEnhancing && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              <h3 className="text-lg font-semibold">جاري تحسين الأنظمة...</h3>
            </div>
            <Progress value={integrationProgress} className="h-3 mb-2" />
            <p className="text-sm text-muted-foreground">
              التقدم: {integrationProgress}% - تحليل وإصلاح روابط الأنظمة
            </p>
          </CardContent>
        </Card>
      )}

      {/* نتائج التحسين الأخير */}
      {lastResult && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-8 w-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-700">
                    {lastResult.totalIssuesFixed}
                  </div>
                  <div className="text-sm text-green-600">مشكلة تم إصلاحها</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Link className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-700">
                    {lastResult.newLinksCreated}
                  </div>
                  <div className="text-sm text-blue-600">رابط جديد</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Database className="h-8 w-8 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold text-purple-700">
                    {lastResult.dataIntegrityIssuesFixed}
                  </div>
                  <div className="text-sm text-purple-600">مشكلة بيانات</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Zap className="h-8 w-8 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold text-orange-700">
                    {lastResult.automationRulesEnabled}
                  </div>
                  <div className="text-sm text-orange-600">قاعدة تلقائية</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* التفاصيل والتحسينات */}
      <Tabs defaultValue="improvements" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="improvements">التحسينات المطبقة</TabsTrigger>
          <TabsTrigger value="categories">التصنيفات</TabsTrigger>
          <TabsTrigger value="errors">الأخطاء</TabsTrigger>
        </TabsList>

        <TabsContent value="improvements" className="space-y-4">
          {lastResult && lastResult.performanceImprovements.length > 0 ? (
            <div className="grid gap-3">
              {lastResult.performanceImprovements.map((improvement, index) => (
                <Alert key={index} className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    {improvement}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  لم يتم تشغيل أي تحسينات بعد. اضغط على "تشغيل التحسين الشامل" للبدء.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          {lastResult && Object.keys(lastResult.issuesFixedByCategory).length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(lastResult.issuesFixedByCategory).map(([category, count]) => (
                <Card key={category} className="border-r-4 border-r-primary">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">{category}</h4>
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        {count} إصلاح
                      </Badge>
                    </div>
                    <Progress value={(count / lastResult.totalIssuesFixed) * 100} className="h-2 mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  لا توجد بيانات التصنيفات متاحة حتى الآن.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          {lastResult && lastResult.errors.length > 0 ? (
            <div className="grid gap-3">
              {lastResult.errors.map((error, index) => (
                <Alert key={index} variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {lastResult ? 'لا توجد أخطاء! تم تشغيل التحسين بنجاح ✅' : 'لم يتم تشغيل التحسين بعد.'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* أنظمة الربط المتاحة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            أنظمة الربط المتاحة
          </CardTitle>
          <CardDescription>
            الأنظمة التي يمكن تحسين ترابطها مع بعضها البعض
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">💰 المصروفات ↔ الصندوق</h4>
              <p className="text-sm text-muted-foreground">
                ربط المصروفات المدفوعة بسجلات الصندوق تلقائياً
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">👥 الموظفين ↔ المرتبات</h4>
              <p className="text-sm text-muted-foreground">
                ربط بيانات الموظفين مع كشوف المرتبات والصندوق
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">🔄 المرتجعات ↔ المخزون</h4>
              <p className="text-sm text-muted-foreground">
                إرجاع المنتجات للمخزون ومعالجة الاستردادات
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">📊 الباركود ↔ المنتجات</h4>
              <p className="text-sm text-muted-foreground">
                إنشاء باركود تلقائي لجميع المنتجات
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">💳 الشيكات ↔ العملاء</h4>
              <p className="text-sm text-muted-foreground">
                ربط الشيكات والأقساط بأصحابها
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">👤 المستخدمين ↔ الموظفين</h4>
              <p className="text-sm text-muted-foreground">
                ربط حسابات المستخدمين ببيانات الموظفين
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* معلومات إضافية */}
      <Alert className="border-blue-200 bg-blue-50">
        <Settings className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>نصيحة:</strong> يُنصح بتشغيل التحسين الشامل بشكل دوري للحفاظ على أفضل أداء للنظام وضمان ترابط جميع البيانات.
        </AlertDescription>
      </Alert>
    </div>
  );
}