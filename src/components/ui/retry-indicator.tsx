import React from 'react';
import { Loader2, AlertCircle, CheckCircle, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface RetryIndicatorProps {
  isRetrying: boolean;
  retryCount: number;
  maxRetries?: number;
  operation?: string;
  className?: string;
  showProgress?: boolean;
  onCancel?: () => void;
}

/**
 * مكون لعرض حالة إعادة المحاولة
 */
export function RetryIndicator({
  isRetrying,
  retryCount,
  maxRetries = 3,
  operation = 'العملية',
  className,
  showProgress = true,
  onCancel
}: RetryIndicatorProps) {
  if (!isRetrying && retryCount === 0) return null;

  const progressPercentage = (retryCount / maxRetries) * 100;

  return (
    <Alert 
      className={cn(
        "border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/20",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {isRetrying ? (
          <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
        ) : retryCount > 0 ? (
          <RotateCcw className="h-4 w-4 text-amber-600" />
        ) : (
          <CheckCircle className="h-4 w-4 text-green-600" />
        )}
        
        <div className="flex-1">
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            {isRetrying ? (
              <>جاري إعادة المحاولة لـ {operation}... (المحاولة {retryCount + 1} من {maxRetries})</>
            ) : retryCount > 0 ? (
              <>تمت إعادة المحاولة {retryCount} مرة لـ {operation}</>
            ) : (
              <>تم تنفيذ {operation} بنجاح</>
            )}
          </AlertDescription>
          
          {showProgress && retryCount > 0 && (
            <Progress 
              value={progressPercentage} 
              className="mt-2 h-2"
            />
          )}
        </div>

        {onCancel && isRetrying && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-amber-700 hover:text-amber-800 hover:bg-amber-100"
          >
            إلغاء
          </Button>
        )}
      </div>
    </Alert>
  );
}

/**
 * مكون مبسط لحالة التحميل مع retry
 */
interface LoadingWithRetryProps {
  isLoading: boolean;
  isRetrying: boolean;
  retryCount: number;
  error?: string | null;
  onRetry?: () => void;
  children?: React.ReactNode;
}

export function LoadingWithRetry({
  isLoading,
  isRetrying,
  retryCount,
  error,
  onRetry,
  children
}: LoadingWithRetryProps) {
  if (error && !isRetrying) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RotateCcw className="h-3 w-3 ml-1" />
              إعادة المحاولة
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading || isRetrying) {
    return (
      <div className="flex items-center gap-3 p-4">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>
          {isRetrying 
            ? `جاري إعادة المحاولة... (${retryCount})` 
            : 'جاري التحميل...'
          }
        </span>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Hook لإدارة حالة retry في المكونات
 */
export function useRetryState() {
  const [isRetrying, setIsRetrying] = React.useState(false);
  const [retryCount, setRetryCount] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  const resetState = React.useCallback(() => {
    setIsRetrying(false);
    setRetryCount(0);
    setError(null);
  }, []);

  const startRetry = React.useCallback((attempt: number) => {
    setIsRetrying(true);
    setRetryCount(attempt);
    setError(null);
  }, []);

  const endRetry = React.useCallback((success: boolean, errorMessage?: string) => {
    setIsRetrying(false);
    if (!success && errorMessage) {
      setError(errorMessage);
    }
  }, []);

  return {
    isRetrying,
    retryCount,
    error,
    resetState,
    startRetry,
    endRetry
  };
}