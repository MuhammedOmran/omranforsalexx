import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

interface PerformanceIndicatorProps {
  showDetails?: boolean;
}

/**
 * مؤشر الأداء في الوقت الفعلي
 */
export function PerformanceIndicator({ showDetails = false }: PerformanceIndicatorProps) {
  const { metrics } = usePerformanceMonitor({ 
    trackMemory: true, 
    componentName: 'PerformanceIndicator' 
  });
  
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>('online');
  const [connectionSpeed, setConnectionSpeed] = useState<'fast' | 'slow' | 'unknown'>('unknown');

  useEffect(() => {
    // مراقبة حالة الشبكة
    const updateNetworkStatus = () => {
      setNetworkStatus(navigator.onLine ? 'online' : 'offline');
    };

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    // مراقبة سرعة الاتصال
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const updateConnectionSpeed = () => {
        const effectiveType = connection.effectiveType;
        setConnectionSpeed(effectiveType === '4g' ? 'fast' : 'slow');
      };

      updateConnectionSpeed();
      connection.addEventListener('change', updateConnectionSpeed);

      return () => {
        window.removeEventListener('online', updateNetworkStatus);
        window.removeEventListener('offline', updateNetworkStatus);
        connection.removeEventListener('change', updateConnectionSpeed);
      };
    }

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
    };
  }, []);

  const getPerformanceLevel = () => {
    if (metrics.renderTime > 16) return 'slow';
    if (metrics.renderTime > 8) return 'medium';
    return 'fast';
  };

  const performanceLevel = getPerformanceLevel();
  const memoryPercent = Math.min((metrics.memoryUsage / 100) * 100, 100);

  if (!showDetails) {
    return (
      <div className="flex items-center gap-2">
        <Badge 
          variant={performanceLevel === 'fast' ? 'default' : 
                   performanceLevel === 'medium' ? 'secondary' : 'destructive'}
          className="text-xs"
        >
          {performanceLevel === 'fast' ? 'سريع' : 
           performanceLevel === 'medium' ? 'متوسط' : 'بطيء'}
        </Badge>
        
        <Badge 
          variant={networkStatus === 'online' ? 'default' : 'secondary'}
          className="text-xs"
        >
          {networkStatus === 'online' ? 'متصل' : 'غير متصل'}
        </Badge>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">مؤشر الأداء</h3>
          <Badge 
            variant={performanceLevel === 'fast' ? 'default' : 
                     performanceLevel === 'medium' ? 'secondary' : 'destructive'}
          >
            {performanceLevel === 'fast' ? 'ممتاز' : 
             performanceLevel === 'medium' ? 'جيد' : 'يحتاج تحسين'}
          </Badge>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>وقت الرندر</span>
              <span>{metrics.renderTime.toFixed(1)}ms</span>
            </div>
            <Progress 
              value={Math.min((metrics.renderTime / 16) * 100, 100)} 
              className="h-2"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>استخدام الذاكرة</span>
              <span>{metrics.memoryUsage.toFixed(1)}MB</span>
            </div>
            <Progress 
              value={memoryPercent} 
              className="h-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between">
              <span>المكونات:</span>
              <Badge variant="outline" className="text-xs">
                {metrics.componentMounts}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>إعادة رندر:</span>
              <Badge variant="outline" className="text-xs">
                {metrics.rerenders}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-xs">حالة الشبكة:</span>
            <div className="flex gap-1">
              <Badge 
                variant={networkStatus === 'online' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {networkStatus === 'online' ? 'متصل' : 'غير متصل'}
              </Badge>
              
              {connectionSpeed !== 'unknown' && (
                <Badge 
                  variant={connectionSpeed === 'fast' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {connectionSpeed === 'fast' ? 'سريع' : 'بطيء'}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}