import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { bundleAnalyzer } from '@/utils/bundleAnalyzer';
import { Gauge, Clock, MemoryStick, Wifi, RefreshCw } from 'lucide-react';

export function PerformanceDashboard() {
  const [performanceReport, setPerformanceReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshReport = async () => {
    setIsLoading(true);
    try {
      const report = bundleAnalyzer.generatePerformanceReport();
      setPerformanceReport(report);
    } catch (error) {
      console.error('خطأ في تحديث تقرير الأداء:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshReport();
    
    // تحديث تلقائي كل 30 ثانية
    const interval = setInterval(refreshReport, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!performanceReport) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-40">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { text: 'ممتاز', variant: 'default' as const };
    if (score >= 70) return { text: 'جيد', variant: 'secondary' as const };
    return { text: 'يحتاج تحسين', variant: 'destructive' as const };
  };

  return (
    <div className="space-y-6">
      {/* نقاط الأداء العامة */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            نقاط الأداء العامة
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshReport}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className={`text-4xl font-bold ${getScoreColor(performanceReport.score)}`}>
                {performanceReport.score}
              </div>
              <Badge variant={getScoreBadge(performanceReport.score).variant}>
                {getScoreBadge(performanceReport.score).text}
              </Badge>
            </div>
            <Progress value={performanceReport.score} className="w-32" />
          </div>
          
          {performanceReport.recommendations.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">التوصيات:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {performanceReport.recommendations.slice(0, 3).map((rec: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-0.5">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* تفاصيل الأداء */}
      <Tabs defaultValue="load" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="load">التحميل</TabsTrigger>
          <TabsTrigger value="memory">الذاكرة</TabsTrigger>
          <TabsTrigger value="network">الشبكة</TabsTrigger>
        </TabsList>
        
        <TabsContent value="load" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                أداء التحميل
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">وقت التحميل</div>
                  <div className="text-2xl font-bold">
                    {Math.round(performanceReport.details.load.averageLoadTime)}ms
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">التقييم</div>
                  <Badge variant={performanceReport.details.load.averageLoadTime < 2000 ? 'default' : 'destructive'}>
                    {performanceReport.details.load.averageLoadTime < 2000 ? 'سريع' : 'بطيء'}
                  </Badge>
                </div>
              </div>
              
              {performanceReport.details.load.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2">توصيات التحسين:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {performanceReport.details.load.recommendations.map((rec: string, index: number) => (
                      <li key={index}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="memory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MemoryStick className="h-5 w-5" />
                استخدام الذاكرة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">الاستخدام الحالي</div>
                  <div className="text-2xl font-bold">
                    {Math.round(performanceReport.details.memory.current)}MB
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">الذروة</div>
                  <div className="text-2xl font-bold">
                    {Math.round(performanceReport.details.memory.peak)}MB
                  </div>
                </div>
              </div>
              
              <Progress 
                value={(performanceReport.details.memory.current / 200) * 100} 
                className="w-full"
              />
              
              {performanceReport.details.memory.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2">توصيات التحسين:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {performanceReport.details.memory.recommendations.map((rec: string, index: number) => (
                      <li key={index}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="network" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                أداء الشبكة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">إجمالي الموارد</div>
                  <div className="text-2xl font-bold">
                    {performanceReport.details.network.totalResources}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">الموارد البطيئة</div>
                  <div className="text-2xl font-bold">
                    {performanceReport.details.network.slowResources.length}
                  </div>
                </div>
              </div>
              
              {performanceReport.details.network.slowResources.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2">الموارد التي تحتاج تحسين:</h4>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {performanceReport.details.network.slowResources.slice(0, 5).map((resource: any, index: number) => (
                      <div key={index} className="text-sm text-muted-foreground">
                        • {resource.name} ({Math.round(resource.duration)}ms)
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {performanceReport.details.network.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2">توصيات التحسين:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {performanceReport.details.network.recommendations.map((rec: string, index: number) => (
                      <li key={index}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}