import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  FileCode, 
  Settings,
  RefreshCw,
  Award,
  Zap
} from 'lucide-react';
import { finalCleanup } from '@/utils/finalCleanup';
import { productionCleanup } from '@/utils/productionCleanup';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

function CodeCleanupDashboard() {
  const { toast } = useToast();
  const [cleanupStatus, setCleanupStatus] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cleanupStats, setCleanupStats] = useState<any>(null);
  const [productionReadiness, setProductionReadiness] = useState<any>(null);

  useEffect(() => {
    loadCleanupStatus();
    checkProductionReadiness();
  }, []);

  const loadCleanupStatus = () => {
    try {
      const status = finalCleanup.getCleanupStatus();
      const stats = finalCleanup.getStats();
      setCleanupStatus(status);
      setCleanupStats(stats);
    } catch (error) {
      logger.error('خطأ في تحميل حالة التنظيف:', error);
    }
  };

  const checkProductionReadiness = () => {
    try {
      const readiness = productionCleanup.checkProductionReadiness();
      setProductionReadiness(readiness);
    } catch (error) {
      logger.error('خطأ في فحص جاهزية الإنتاج:', error);
    }
  };

  const handleFinalCleanup = async () => {
    setIsProcessing(true);
    try {
      await finalCleanup.performFinalCleanup();
      await productionCleanup.performProductionCleanup();
      
      loadCleanupStatus();
      checkProductionReadiness();
      
      toast({
        title: "تم التنظيف بنجاح! 🎉",
        description: "تم تنظيف النظام وتحسينه للإنتاج",
      });
    } catch (error) {
      toast({
        title: "خطأ في التنظيف",
        description: "حدث خطأ أثناء عملية التنظيف",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (score: number) => {
    if (score >= 90) return { variant: 'default' as const, label: 'ممتاز', icon: Award };
    if (score >= 70) return { variant: 'secondary' as const, label: 'جيد', icon: CheckCircle };
    return { variant: 'destructive' as const, label: 'يحتاج تحسين', icon: AlertTriangle };
  };

  return (
    <div className="space-y-6">
      {/* العنوان الرئيسي */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">تنظيف الكود للإنتاج</h1>
          <p className="text-muted-foreground mt-1">
            تنظيف شامل وتحسين النظام للإنتاج النهائي
          </p>
        </div>
        <Button 
          onClick={handleFinalCleanup}
          disabled={isProcessing}
          size="lg"
          className="flex items-center gap-2"
        >
          {isProcessing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Zap className="h-4 w-4" />
          )}
          {isProcessing ? 'جاري التنظيف...' : 'تنظيف شامل'}
        </Button>
      </div>

      {/* نظرة عامة على الحالة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">نظافة الكود</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-2xl font-bold ${getStatusColor(cleanupStatus?.score || 0)}`}>
                  {cleanupStatus?.score || 0}%
                </div>
                <div className="text-xs text-muted-foreground">معدل النظافة</div>
              </div>
              <CheckCircle className={`h-8 w-8 ${getStatusColor(cleanupStatus?.score || 0)}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Console Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {cleanupStats?.totalConsoleLogsRemoved || 0}
                </div>
                <div className="text-xs text-muted-foreground">تم الحذف</div>
              </div>
              <FileCode className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">البيانات التطويرية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {cleanupStats?.totalDevCommentsRemoved || 0}
                </div>
                <div className="text-xs text-muted-foreground">تم التنظيف</div>
              </div>
              <Trash2 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">جاهزية الإنتاج</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                {productionReadiness?.isReady ? (
                  <Badge variant="default" className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    جاهز
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    غير جاهز
                  </Badge>
                )}
              </div>
              <Settings className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* تفاصيل الحالة */}
      {cleanupStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              حالة نظافة الكود
            </CardTitle>
            <CardDescription>
              تقييم شامل لنظافة الكود وجاهزيته للإنتاج
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* شريط التقدم */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">معدل النظافة</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${getStatusColor(cleanupStatus.score)}`}>
                    {cleanupStatus.score}%
                  </span>
                  {(() => {
                    const badge = getStatusBadge(cleanupStatus.score);
                    const Icon = badge.icon;
                    return (
                      <Badge variant={badge.variant} className="flex items-center gap-1">
                        <Icon className="h-3 w-3" />
                        {badge.label}
                      </Badge>
                    );
                  })()}
                </div>
              </div>
              <Progress value={cleanupStatus.score} className="h-2" />
            </div>

            {/* المشاكل المكتشفة */}
            {cleanupStatus.issues && cleanupStatus.issues.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <strong>مشاكل تحتاج حل:</strong>
                    <ul className="list-disc list-inside space-y-1">
                      {cleanupStatus.issues.map((issue: string, index: number) => (
                        <li key={index} className="text-sm">{issue}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* التوصيات */}
            {cleanupStatus.recommendations && cleanupStatus.recommendations.length > 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <strong>توصيات للتحسين:</strong>
                    <ul className="list-disc list-inside space-y-1">
                      {cleanupStatus.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="text-sm">{rec}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* إحصائيات التنظيف */}
      {cleanupStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCode className="h-5 w-5" />
              إحصائيات التنظيف
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {cleanupStats.totalConsoleLogsRemoved}
                </div>
                <div className="text-sm text-blue-700">Console Logs محذوفة</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {cleanupStats.totalDevCommentsRemoved}
                </div>
                <div className="text-sm text-purple-700">تعليقات تطويرية</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {cleanupStats.totalErrorHandlingImprovements}
                </div>
                <div className="text-sm text-green-700">تحسينات الأخطاء</div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {cleanupStats.totalUnusedImportsRemoved}
                </div>
                <div className="text-sm text-orange-700">استيراد غير مستخدم</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* جاهزية الإنتاج */}
      {productionReadiness && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              جاهزية الإنتاج
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {productionReadiness.isReady ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>🎉 النظام جاهز للإنتاج!</strong>
                  <br />
                  تم التحقق من جميع المتطلبات وحل جميع المشاكل.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>النظام غير جاهز للإنتاج</strong>
                  <br />
                  يوجد {productionReadiness.issues?.length || 0} مشكلة تحتاج حل.
                </AlertDescription>
              </Alert>
            )}

            {productionReadiness.issues && productionReadiness.issues.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-red-600">المشاكل:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {productionReadiness.issues.map((issue: string, index: number) => (
                    <li key={index} className="text-sm text-red-700">{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {productionReadiness.suggestions && productionReadiness.suggestions.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-blue-600">الاقتراحات:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {productionReadiness.suggestions.map((suggestion: string, index: number) => (
                    <li key={index} className="text-sm text-blue-700">{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* أزرار الإجراءات */}
      <Card>
        <CardHeader>
          <CardTitle>إجراءات التنظيف</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button 
            onClick={loadCleanupStatus}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            تحديث الحالة
          </Button>
          
          <Button 
            onClick={checkProductionReadiness}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            فحص الجاهزية
          </Button>
          
          <Button 
            onClick={() => finalCleanup.resetStats()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            إعادة تعيين الإحصائيات
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CodeCleanupDashboard;