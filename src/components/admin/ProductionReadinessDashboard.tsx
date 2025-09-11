import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw,
  FileText,
  Download,
  AlertCircle,
  Clock,
  Truck
} from 'lucide-react';
import { productionReadinessManager, SystemReadinessReport } from '@/utils/productionReadinessManager';
import { toast } from '@/hooks/use-toast';

export function ProductionReadinessDashboard() {
  const [report, setReport] = useState<SystemReadinessReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    runCheck();
  }, []);

  const runCheck = async () => {
    setIsLoading(true);
    try {
      const newReport = await productionReadinessManager.checkSystemReadiness();
      setReport(newReport);
    } catch (error) {
      console.error('خطأ في فحص جاهزية النظام:', error);
      toast({
        title: "خطأ في الفحص",
        description: "حدث خطأ أثناء فحص جاهزية النظام",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadReport = () => {
    if (!report) return;
    
    const reportText = productionReadinessManager.generateDetailedReport(report);
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omran-readiness-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "تم تنزيل التقرير",
      description: "تم حفظ تقرير الجاهزية بنجاح",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
      case 'ready':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'warning':
      case 'needs_attention':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'error':
      case 'not_ready':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
      case 'ready':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
      case 'needs_attention':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
      case 'not_ready':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="mr-2 text-lg">جاري فحص جاهزية النظام...</span>
      </div>
    );
  }

  if (!report) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          لم يتم إجراء فحص للنظام بعد. انقر على "بدء الفحص" لتشغيل التقييم.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* العنوان الرئيسي */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">تقرير جاهزية النظام للتسليم</h1>
          <p className="text-muted-foreground mt-2">
            فحص شامل لاكتمال النظام وجاهزيته للعميل
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={runCheck} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            إعادة الفحص
          </Button>
          <Button onClick={downloadReport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            تنزيل التقرير
          </Button>
        </div>
      </div>

      {/* الملخص الإجمالي */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              {getStatusIcon(report.overallStatus)}
              <div>
                <p className="text-sm font-medium text-muted-foreground">الحالة الإجمالية</p>
                <Badge className={getStatusColor(report.overallStatus)}>
                  {report.overallStatus === 'ready' ? 'جاهز للتسليم' : 
                   report.overallStatus === 'needs_attention' ? 'يحتاج انتباه' : 'غير جاهز'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">نسبة الاكتمال</p>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{report.overallCompletion}%</p>
                  <Progress value={report.overallCompletion} className="w-16" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">المشاكل الحرجة</p>
                <p className="text-2xl font-bold">{report.criticalIssues}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">وقت الإصلاح</p>
                <p className="text-lg font-semibold">{report.estimatedFixTime}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* معوقات التسليم */}
      {report.deliveryBlockers.length > 0 && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold mb-2">معوقات التسليم:</div>
            <ul className="list-disc list-inside space-y-1">
              {report.deliveryBlockers.map((blocker, index) => (
                <li key={index} className="text-sm">{blocker}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* حالة التسليم */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full ${
                report.readyForDelivery ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <Truck className={`h-6 w-6 ${
                  report.readyForDelivery ? 'text-green-600' : 'text-red-600'
                }`} />
              </div>
              <div>
                <h3 className="text-xl font-semibold">
                  {report.readyForDelivery ? 'النظام جاهز للتسليم ✅' : 'النظام غير جاهز للتسليم ❌'}
                </h3>
                <p className="text-muted-foreground">
                  {report.readyForDelivery 
                    ? 'يمكن تسليم النظام للعميل الآن' 
                    : 'يجب إصلاح المشاكل الحرجة قبل التسليم'
                  }
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* تفاصيل الفئات */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {report.categories.map((category, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(category.status)}
                  {category.category}
                </div>
                <Badge variant="outline">
                  {category.completionPercentage}%
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={category.completionPercentage} className="mb-4" />
              
              {category.issues.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">المشاكل:</h4>
                  <div className="space-y-2">
                    {category.issues.map((issue, issueIndex) => (
                      <div key={issueIndex} className="p-3 rounded-lg border border-gray-200">
                        <div className="flex items-start gap-2">
                          <Badge className={getSeverityColor(issue.severity)} variant="outline">
                            {issue.severity === 'critical' ? 'حرج' :
                             issue.severity === 'high' ? 'عالي' :
                             issue.severity === 'medium' ? 'متوسط' : 'منخفض'}
                          </Badge>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{issue.message}</p>
                            {issue.solution && (
                              <p className="text-xs text-muted-foreground mt-1">
                                💡 <strong>الحل:</strong> {issue.solution}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {category.recommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">التوصيات:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {category.recommendations.map((rec, recIndex) => (
                      <li key={recIndex}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}