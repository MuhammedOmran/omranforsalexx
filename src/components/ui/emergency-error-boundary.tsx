import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, Settings } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { logger } from '@/utils/logger';

interface EmergencyErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

interface EmergencyErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  retryCount: number;
}

/**
 * Error Boundary طوارئ مع إصلاحات تلقائية
 */
export class EmergencyErrorBoundary extends React.Component<
  EmergencyErrorBoundaryProps,
  EmergencyErrorBoundaryState
> {
  private maxRetries = 3;

  constructor(props: EmergencyErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      retryCount: 0 
    };
  }

  static getDerivedStateFromError(error: Error): Partial<EmergencyErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo });
    
    logger.error('Emergency Error Boundary caught error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    }, 'EmergencyErrorBoundary');

    // محاولة الإصلاح التلقائي
    this.attemptAutoFix(error);
  }

  private attemptAutoFix = (error: Error) => {
    try {
      // إصلاح مشاكل localStorage المعروفة
      if (error.message.includes('localStorage') || error.message.includes('JSON')) {
        this.fixStorageIssues();
      }

      // إصلاح مشاكل التنقل
      if (error.message.includes('router') || error.message.includes('navigation')) {
        this.fixNavigationIssues();
      }

      // مسح cache المكونات
      if (error.message.includes('chunk') || error.message.includes('import')) {
        this.clearComponentCache();
      }

    } catch (fixError) {
      logger.error('Auto-fix failed:', fixError, 'EmergencyErrorBoundary');
    }
  };

  private fixStorageIssues = () => {
    try {
      // مسح البيانات التالفة
      const keysToCheck = ['user_settings', 'app_state', 'cache_data'];
      keysToCheck.forEach(key => {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            JSON.parse(value); // اختبار صحة JSON
          }
        } catch {
          localStorage.removeItem(key);
          logger.info(`Removed corrupted key: ${key}`, undefined, 'EmergencyErrorBoundary');
        }
      });
    } catch (error) {
      logger.error('Failed to fix storage issues:', error, 'EmergencyErrorBoundary');
    }
  };

  private fixNavigationIssues = () => {
    try {
      // إعادة تعيين التنقل للصفحة الرئيسية
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        window.history.pushState({}, '', '/');
      }
    } catch (error) {
      logger.error('Failed to fix navigation issues:', error, 'EmergencyErrorBoundary');
    }
  };

  private clearComponentCache = () => {
    try {
      // مسح service worker cache
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name);
          });
        });
      }
    } catch (error) {
      logger.error('Failed to clear component cache:', error, 'EmergencyErrorBoundary');
    }
  };

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: prevState.retryCount + 1
      }));
      
      logger.info(`Retry attempt ${this.state.retryCount + 1}`, undefined, 'EmergencyErrorBoundary');
    } else {
      // إعادة تحميل الصفحة كحل أخير
      window.location.reload();
    }
  };

  private handleReset = () => {
    // إعادة تعيين شاملة
    try {
      // مسح التخزين المحلي
      localStorage.clear();
      sessionStorage.clear();
      
      // إعادة تحميل الصفحة
      window.location.href = '/';
    } catch (error) {
      logger.error('Failed to reset application:', error, 'EmergencyErrorBoundary');
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      const { error } = this.state;
      const canRetry = this.state.retryCount < this.maxRetries;

      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={error!} reset={this.handleRetry} />;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <CardTitle>خطأ في التطبيق</CardTitle>
              </div>
              <CardDescription>
                حدث خطأ غير متوقع. نحن نعمل على إصلاحه تلقائياً.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>تفاصيل الخطأ</AlertTitle>
                <AlertDescription className="mt-2">
                  {error?.message || 'خطأ غير معروف'}
                </AlertDescription>
              </Alert>

              <div className="flex flex-col gap-2">
                {canRetry ? (
                  <Button onClick={this.handleRetry} className="w-full">
                    <RefreshCw className="ml-2 h-4 w-4" />
                    إعادة المحاولة ({this.maxRetries - this.state.retryCount} محاولات متبقية)
                  </Button>
                ) : (
                  <Button onClick={() => window.location.reload()} className="w-full">
                    <RefreshCw className="ml-2 h-4 w-4" />
                    إعادة تحميل الصفحة
                  </Button>
                )}
                
                <Button onClick={this.handleReset} variant="outline" className="w-full">
                  <Settings className="ml-2 h-4 w-4" />
                  إعادة تعيين التطبيق
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && error?.stack && (
                <details className="text-xs">
                  <summary className="cursor-pointer">عرض تفاصيل المطور</summary>
                  <pre className="mt-2 p-2 bg-muted rounded overflow-auto max-h-32 text-xs">
                    {error.stack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook لمعالجة الأخطاء في المكونات الوظيفية
 */
export function useEmergencyErrorHandler() {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  const captureError = (error: Error) => {
    logger.error('Error captured by hook:', error, 'useEmergencyErrorHandler');
    setError(error);
  };

  const resetError = () => {
    setError(null);
  };

  return { captureError, resetError };
}