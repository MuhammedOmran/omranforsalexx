import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  BarChart3, 
  Clock, 
  Database, 
  HardDrive, 
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface PerformanceOptimizedTabsProps {
  integrationData: any;
  systemEvaluation: any[];
  performanceMetrics: any;
  cacheStats: any;
  isLoading: boolean;
  onRefresh: () => void;
  onClearCache: () => void;
}

// مكون محسن للإحصائيات
const PerformanceStatsCard = memo(({ title, value, icon: Icon, color, trend }: any) => (
  <Card className="transition-all duration-200 hover:shadow-md">
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          {trend && (
            <div className="flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-green-500 ml-1" />
              <span className="text-xs text-green-500">{trend}</span>
            </div>
          )}
        </div>
        <Icon className={`h-8 w-8 ${color}`} />
      </div>
    </CardContent>
  </Card>
));

// مكون محسن لقائمة التقييمات
const SystemEvaluationList = memo(({ evaluations }: { evaluations: any[] }) => {
  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'ممتاز': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'جيد': return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'يحتاج تحسين': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'ضعيف': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return null;
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'ممتاز': return 'bg-green-100 text-green-800';
      case 'جيد': return 'bg-blue-100 text-blue-800';
      case 'يحتاج تحسين': return 'bg-yellow-100 text-yellow-800';
      case 'ضعيف': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  return (
    <div className="space-y-4">
      {evaluations.map((module, index) => (
        <Card key={index} className="transition-all duration-200 hover:shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2 text-base">
                {getStatusIcon(module.status)}
                {module.module}
              </CardTitle>
              <Badge className={getStatusColor(module.status)}>
                {module.status}
              </Badge>
            </div>
            <CardDescription>
              مستوى التكامل: {module.integrationLevel}%
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Progress value={module.integrationLevel} className="h-2 mb-4" />
            
            <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-3">
              {module.connectedSystems?.length > 0 && (
                <div>
                  <h5 className="font-medium text-sm mb-2">الأنظمة المترابطة</h5>
                  <div className="flex flex-wrap gap-1">
                    {module.connectedSystems.slice(0, 3).map((system: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {system}
                      </Badge>
                    ))}
                    {module.connectedSystems.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{module.connectedSystems.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              
              {module.missingLinks?.length > 0 && (
                <div>
                  <h5 className="font-medium text-sm mb-2">الروابط المفقودة</h5>
                  <ul className="text-xs text-muted-foreground space-y-1 max-h-16 overflow-y-auto">
                    {module.missingLinks.slice(0, 2).map((link: string, idx: number) => (
                      <li key={idx}>• {link}</li>
                    ))}
                    {module.missingLinks.length > 2 && (
                      <li>• +{module.missingLinks.length - 2} آخرين</li>
                    )}
                  </ul>
                </div>
              )}
              
              {module.recommendations?.length > 0 && (
                <div>
                  <h5 className="font-medium text-sm mb-2">التوصيات</h5>
                  <ul className="text-xs text-muted-foreground space-y-1 max-h-16 overflow-y-auto">
                    {module.recommendations.slice(0, 2).map((rec: string, idx: number) => (
                      <li key={idx}>• {rec}</li>
                    ))}
                    {module.recommendations.length > 2 && (
                      <li>• +{module.recommendations.length - 2} آخرين</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

export const PerformanceOptimizedTabs = memo(({ 
  integrationData, 
  systemEvaluation, 
  performanceMetrics, 
  cacheStats,
  isLoading,
  onRefresh,
  onClearCache
}: PerformanceOptimizedTabsProps) => {
  const [activeTab, setActiveTab] = useState('overview');

  // حساب الإحصائيات المحسنة
  const optimizedStats = useMemo(() => {
    if (!performanceMetrics) return null;

    return {
      averageLoadTime: performanceMetrics.averageDuration?.toFixed(0) || 0,
      cacheHitRate: performanceMetrics.cacheHitRate?.toFixed(1) || 0,
      memoryUsage: performanceMetrics.memoryUsage?.toFixed(1) || 0,
      operationsCount: performanceMetrics.operationsCount || 0
    };
  }, [performanceMetrics]);

  // حساب إحصائيات التكامل
  const integrationStats = useMemo(() => {
    if (!integrationData?.integrationReport) return null;

    const report = integrationData.integrationReport;
    return {
      overallScore: report.overallScore || 0,
      excellentModules: report.summary?.excellentModules || 0,
      goodModules: report.summary?.goodModules || 0,
      improvementNeeded: (report.summary?.needsImprovementModules || 0) + (report.summary?.poorModules || 0)
    };
  }, [integrationData]);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <div className="flex justify-between items-center">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="performance">الأداء</TabsTrigger>
          <TabsTrigger value="modules">الأنظمة</TabsTrigger>
        </TabsList>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ml-1 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          <Button variant="outline" size="sm" onClick={onClearCache}>
            <Database className="h-4 w-4 ml-1" />
            مسح الكاش
          </Button>
        </div>
      </div>

      <TabsContent value="overview" className="space-y-4">
        {integrationStats && (
          <div className="grid gap-4 md:grid-cols-4">
            <PerformanceStatsCard
              title="النقاط الإجمالية"
              value={`${integrationStats.overallScore}%`}
              icon={BarChart3}
              color="text-primary"
            />
            <PerformanceStatsCard
              title="أنظمة ممتازة"
              value={integrationStats.excellentModules}
              icon={CheckCircle}
              color="text-green-600"
            />
            <PerformanceStatsCard
              title="أنظمة جيدة"
              value={integrationStats.goodModules}
              icon={TrendingUp}
              color="text-blue-600"
            />
            <PerformanceStatsCard
              title="تحتاج تحسين"
              value={integrationStats.improvementNeeded}
              icon={AlertTriangle}
              color="text-yellow-600"
            />
          </div>
        )}

        {integrationData?.integrationReport?.topRecommendations?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                التوصيات الرئيسية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {integrationData.integrationReport.topRecommendations.slice(0, 5).map((rec: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-primary font-medium">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="performance" className="space-y-4">
        {optimizedStats && (
          <div className="grid gap-4 md:grid-cols-4">
            <PerformanceStatsCard
              title="متوسط وقت التحميل"
              value={`${optimizedStats.averageLoadTime}ms`}
              icon={Clock}
              color="text-blue-600"
            />
            <PerformanceStatsCard
              title="معدل إصابة الكاش"
              value={`${optimizedStats.cacheHitRate}%`}
              icon={Database}
              color="text-green-600"
            />
            <PerformanceStatsCard
              title="استخدام الذاكرة"
              value={`${optimizedStats.memoryUsage}MB`}
              icon={HardDrive}
              color="text-purple-600"
            />
            <PerformanceStatsCard
              title="العمليات المنفذة"
              value={optimizedStats.operationsCount}
              icon={Activity}
              color="text-orange-600"
            />
          </div>
        )}

        {cacheStats && (
          <Card>
            <CardHeader>
              <CardTitle>إحصائيات الكاش</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <div className="text-sm text-muted-foreground">العناصر المحفوظة</div>
                  <div className="text-2xl font-bold">{cacheStats.totalEntries}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">حجم الكاش</div>
                  <div className="text-2xl font-bold">{cacheStats.totalSizeMB}MB</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">معدل الاستخدام</div>
                  <div className="text-2xl font-bold">{cacheStats.utilizationPercent}%</div>
                </div>
              </div>
              <Progress value={parseFloat(cacheStats.utilizationPercent)} className="mt-4" />
            </CardContent>
          </Card>
        )}

        {performanceMetrics?.slowOperations?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                العمليات البطيئة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {performanceMetrics.slowOperations.slice(0, 5).map((op: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="text-sm">{op.name}</span>
                    <Badge variant="destructive">{op.duration.toFixed(0)}ms</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="modules" className="space-y-4">
        {systemEvaluation?.length > 0 ? (
          <SystemEvaluationList evaluations={systemEvaluation} />
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">
                لا توجد بيانات تقييم للأنظمة
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
});