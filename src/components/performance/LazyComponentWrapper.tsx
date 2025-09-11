import { Suspense, ComponentType, useState, useEffect, lazy, ReactNode } from 'react';

interface LazyComponentWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  minLoadingTime?: number;
}

/**
 * مكون لتحسين تحميل المكونات البطيئة
 */
export function LazyComponentWrapper({ 
  children, 
  fallback, 
  minLoadingTime = 50
}: LazyComponentWrapperProps) {
  
  const defaultFallback = (
    <div className="animate-fade-in space-y-2 p-4 bg-background">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-muted-foreground">جاري التحميل...</span>
      </div>
    </div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
}

/**
 * مكون لتأخير إظهار fallback
 */
function DelayedFallback({ 
  children, 
  delay 
}: { 
  children: ReactNode; 
  delay: number; 
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return show ? <>{children}</> : null;
}

/**
 * HOC لتحويل مكون إلى lazy component محسن
 */
export function withLazyLoading<P extends Record<string, any>>(
  Component: ComponentType<P>,
  fallback?: ReactNode
) {
  const LazyComponent = lazy(() => Promise.resolve({ default: Component }));
  
  return function WrappedComponent(props: P) {
    return (
      <LazyComponentWrapper fallback={fallback}>
        <LazyComponent {...(props as any)} />
      </LazyComponentWrapper>
    );
  };
}