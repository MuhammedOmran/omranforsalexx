import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  variant?: 'default' | 'card' | 'list' | 'table' | 'chart';
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

/**
 * حالات loading محسنة ومتجاوبة
 */
export function LoadingState({ 
  variant = 'default', 
  size = 'md', 
  message = 'جاري التحميل...', 
  className 
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const containerClasses = {
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-8'
  };

  if (variant === 'card') {
    return (
      <div className={cn("space-y-4 p-4", className)}>
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
          <div className="h-32 bg-muted rounded mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-8 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={cn("space-y-3 p-4", className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse flex items-center space-x-4 rtl:space-x-reverse">
            <div className="w-10 h-10 bg-muted rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={cn("space-y-3 p-4", className)}>
        <div className="animate-pulse">
          {/* Table header */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-6 bg-muted rounded"></div>
            ))}
          </div>
          {/* Table rows */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="grid grid-cols-4 gap-4 mb-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="h-4 bg-muted rounded"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'chart') {
    return (
      <div className={cn("space-y-4 p-4", className)}>
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-muted rounded mb-4"></div>
          <div className="flex justify-center space-x-4 rtl:space-x-reverse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-2 rtl:space-x-reverse">
                <div className="w-3 h-3 bg-muted rounded-full"></div>
                <div className="h-3 bg-muted rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Default spinner
  return (
    <div className={cn(
      "flex flex-col items-center justify-center",
      containerClasses[size],
      className
    )}>
      <div className={cn(
        "border-2 border-muted border-t-primary rounded-full animate-spin",
        sizeClasses[size]
      )}></div>
      {message && (
        <p className="mt-4 text-sm text-muted-foreground text-center">
          {message}
        </p>
      )}
    </div>
  );
}

/**
 * HOC للف المكونات بـ loading state
 */
export function withLoadingState<P extends object>(
  Component: React.ComponentType<P>,
  loadingProps?: Partial<LoadingStateProps>
) {
  return ({ isLoading, ...props }: P & { isLoading: boolean }) => {
    if (isLoading) {
      return <LoadingState {...loadingProps} />;
    }
    
    return <Component {...(props as P)} />;
  };
}