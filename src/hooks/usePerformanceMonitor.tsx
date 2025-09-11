import { useEffect, useRef, useState } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  componentMounts: number;
  rerenders: number;
}

interface UsePerformanceMonitorOptions {
  trackMemory?: boolean;
  logMetrics?: boolean;
  componentName?: string;
}

/**
 * Hook لمراقبة أداء المكونات
 */
export function usePerformanceMonitor(
  options: UsePerformanceMonitorOptions = {}
) {
  const { trackMemory = false, logMetrics = false, componentName = 'Component' } = options;
  
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    componentMounts: 0,
    rerenders: 0
  });
  
  const renderCountRef = useRef(0);
  const mountTimeRef = useRef<number>(0);
  const renderStartRef = useRef<number>(0);

  // تتبع عدد الـ renders
  renderCountRef.current += 1;

  useEffect(() => {
    // تسجيل وقت mount
    mountTimeRef.current = performance.now();
    
    setMetrics(prev => ({
      ...prev,
      componentMounts: prev.componentMounts + 1
    }));

    return () => {
      if (logMetrics) {
        console.log(`Performance Metrics for ${componentName}:`, metrics);
      }
    };
  }, []);

  useEffect(() => {
    // تتبع الـ rerenders
    if (renderCountRef.current > 1) {
      setMetrics(prev => ({
        ...prev,
        rerenders: prev.rerenders + 1
      }));
    }
  });

  useEffect(() => {
    // قياس وقت الـ render
    renderStartRef.current = performance.now();
    
    return () => {
      const renderTime = performance.now() - renderStartRef.current;
      setMetrics(prev => ({
        ...prev,
        renderTime
      }));
    };
  });

  useEffect(() => {
    if (!trackMemory) return;

    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memory.usedJSHeapSize / 1024 / 1024 // MB
        }));
      }
    };

    updateMemoryUsage();
    const interval = setInterval(updateMemoryUsage, 5000);

    return () => clearInterval(interval);
  }, [trackMemory]);

  return {
    metrics,
    renderCount: renderCountRef.current
  };
}

/**
 * مراقب الأداء العام للتطبيق
 */
export function useAppPerformanceMonitor() {
  const [isSlowDevice, setIsSlowDevice] = useState(false);
  const [networkQuality, setNetworkQuality] = useState<'slow' | 'fast' | 'unknown'>('unknown');

  useEffect(() => {
    // تحديد سرعة الجهاز
    const detectDeviceSpeed = () => {
      const start = performance.now();
      const iterations = 100000;
      
      for (let i = 0; i < iterations; i++) {
        Math.random();
      }
      
      const duration = performance.now() - start;
      setIsSlowDevice(duration > 10); // أكثر من 10ms يعتبر بطيء
    };

    detectDeviceSpeed();

    // مراقبة جودة الشبكة
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const updateNetworkQuality = () => {
        if (connection.effectiveType === '4g') {
          setNetworkQuality('fast');
        } else if (['3g', '2g', 'slow-2g'].includes(connection.effectiveType)) {
          setNetworkQuality('slow');
        }
      };

      updateNetworkQuality();
      connection.addEventListener('change', updateNetworkQuality);

      return () => {
        connection.removeEventListener('change', updateNetworkQuality);
      };
    }
  }, []);

  return {
    isSlowDevice,
    networkQuality,
    shouldOptimizeForPerformance: isSlowDevice || networkQuality === 'slow'
  };
}