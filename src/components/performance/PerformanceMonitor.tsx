import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Zap, Database, Wifi, RefreshCw } from 'lucide-react';
import { getPerformanceInfo } from '@/utils/performanceEnhancer';
import { logger } from '@/utils/logger';

interface PerformanceMetrics {
  memoryUsage?: {
    used: number;
    total: number;
    limit: number;
  };
  resourceCount: number;
  loadTime: number;
  storageUsage: {
    localStorage: number;
    optimizedStorage: number;
  };
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateMetrics = () => {
    try {
      const perfInfo = getPerformanceInfo();
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      setMetrics({
        memoryUsage: perfInfo.memoryUsage,
        resourceCount: perfInfo.resourceCount,
        loadTime: navigationEntry ? navigationEntry.loadEventEnd - navigationEntry.startTime : 0,
        storageUsage: perfInfo.storageUsage
      });
    } catch (error) {
      logger.error('خطأ في قياس الأداء', error, 'PerformanceMonitor');
    }
  };

  const getPerformanceScore = (): { score: number; level: 'excellent' | 'good' | 'poor' } => {
    if (!metrics) return { score: 0, level: 'poor' };

    let score = 100;
    
    // خصم نقاط حسب وقت التحميل
    if (metrics.loadTime > 3000) score -= 30;
    else if (metrics.loadTime > 1500) score -= 15;
    
    // خصم نقاط حسب عدد الموارد
    if (metrics.resourceCount > 100) score -= 20;
    else if (metrics.resourceCount > 50) score -= 10;
    
    // خصم نقاط حسب استخدام الذاكرة
    if (metrics.memoryUsage && metrics.memoryUsage.used > 100) score -= 25;
    else if (metrics.memoryUsage && metrics.memoryUsage.used > 50) score -= 10;

    const level = score >= 80 ? 'excellent' : score >= 60 ? 'good' : 'poor';
    return { score: Math.max(0, score), level };
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleOptimize = () => {
    // تنظيف الذاكرة
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
    
    // إعادة تحميل المقاييس
    setTimeout(updateMetrics, 1000);
  };

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50"
      >
        <Activity className="w-4 h-4 mr-2" />
        مراقب الأداء
      </Button>
    );
  }

  if (!metrics) {
    return (
      <Card className="fixed bottom-4 right-4 w-80 z-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>جاري قياس الأداء...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { score, level } = getPerformanceScore();

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5" />
            مراقب الأداء
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleOptimize}>
              <Zap className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsVisible(false)}>
              ✕
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* نقاط الأداء */}
        <div className="text-center">
          <div className={`text-2xl font-bold ${
            level === 'excellent' ? 'text-green-600' :
            level === 'good' ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {score}/100
          </div>
          <Badge variant={
            level === 'excellent' ? 'default' :
            level === 'good' ? 'secondary' : 'destructive'
          }>
            {level === 'excellent' ? 'ممتاز' :
             level === 'good' ? 'جيد' : 'يحتاج تحسين'}
          </Badge>
        </div>

        {/* وقت التحميل */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>وقت التحميل</span>
            <span>{(metrics.loadTime / 1000).toFixed(2)}s</span>
          </div>
          <Progress 
            value={Math.min((metrics.loadTime / 5000) * 100, 100)} 
            className="h-2"
          />
        </div>

        {/* استخدام الذاكرة */}
        {metrics.memoryUsage && (
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>الذاكرة</span>
              <span>{metrics.memoryUsage.used}MB / {metrics.memoryUsage.limit}MB</span>
            </div>
            <Progress 
              value={(metrics.memoryUsage.used / metrics.memoryUsage.limit) * 100} 
              className="h-2"
            />
          </div>
        )}

        {/* عدد الموارد */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>الموارد المحملة</span>
            <span>{metrics.resourceCount}</span>
          </div>
          <Progress 
            value={Math.min((metrics.resourceCount / 150) * 100, 100)} 
            className="h-2"
          />
        </div>

        {/* استخدام التخزين */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-center">
            <Database className="w-4 h-4 mx-auto mb-1" />
            <div>التخزين القديم</div>
            <div className="font-mono">
              {formatBytes(metrics.storageUsage.localStorage)}
            </div>
          </div>
          <div className="text-center">
            <Zap className="w-4 h-4 mx-auto mb-1" />
            <div>التخزين المحسن</div>
            <div className="font-mono">
              {formatBytes(metrics.storageUsage.optimizedStorage)}
            </div>
          </div>
        </div>

        {/* إجراءات سريعة */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={updateMetrics} className="flex-1">
            <RefreshCw className="w-3 h-3 mr-1" />
            تحديث
          </Button>
          <Button variant="outline" size="sm" onClick={handleOptimize} className="flex-1">
            <Zap className="w-3 h-3 mr-1" />
            تحسين
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}