import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface FastLoaderProps {
  type?: 'page' | 'card' | 'list' | 'form';
  className?: string;
}

/**
 * مكون تحميل سريع محسن للأداء
 */
export function FastLoader({ type = 'page', className = '' }: FastLoaderProps) {
  const baseClasses = `animate-fade-in ${className}`;
  
  switch (type) {
    case 'card':
      return (
        <div className={`${baseClasses} p-4 space-y-2`}>
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      );
      
    case 'list':
      return (
        <div className={`${baseClasses} space-y-2`}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-2 p-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-2 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      );
      
    case 'form':
      return (
        <div className={`${baseClasses} space-y-4 p-4`}>
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-8 w-1/4" />
        </div>
      );
      
    default: // page
      return (
        <div className={`${baseClasses} space-y-4 p-6`}>
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-8 w-24" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      );
  }
}

/**
 * مكون تحميل مخصص للفواتير
 */
export function InvoiceLoader() {
  return (
    <div className="animate-fade-in space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      
      {/* Customer Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      
      {/* Products Table */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="grid grid-cols-5 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
        
        {/* Total */}
        <div className="flex justify-end">
          <div className="space-y-2 w-48">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * HOC لإضافة تحميل سريع للمكونات
 */
export function withFastLoading<P extends Record<string, any>>(
  Component: React.ComponentType<P>,
  loaderType: 'page' | 'card' | 'list' | 'form' = 'page'
) {
  return function FastLoadingComponent(props: P) {
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
      // تحميل فوري للمكونات البسيطة
      const timer = setTimeout(() => setIsLoading(false), 10);
      return () => clearTimeout(timer);
    }, []);
    
    if (isLoading) {
      return <FastLoader type={loaderType} />;
    }
    
    return <Component {...props} />;
  };
}