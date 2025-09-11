import React, { useState, useEffect } from 'react';
import { Info, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { logger } from '@/utils/logger';

interface DefaultErrorFallbackProps {
  error: Error;
  retry: () => void;
}

/**
 * واجهة خطأ افتراضية محسنة
 */
export function DefaultErrorFallback({ error, retry }: DefaultErrorFallbackProps) {
  const isDevelopment = import.meta.env.MODE === 'development';
  const [countdown, setCountdown] = useState(5);
  const [userCancelled, setUserCancelled] = useState(false);

  logger.error('Error caught by ErrorBoundary', error, 'DefaultErrorFallback');

  // Check if it's a dynamic import error
  const isDynamicImportError = error.message.includes('Failed to fetch dynamically imported module') ||
                               error.message.includes('Loading chunk') ||
                               error.message.includes('Loading CSS chunk');

  useEffect(() => {
    if (countdown > 0 && !userCancelled) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !userCancelled) {
      window.location.reload();
    }
  }, [countdown, userCancelled]);

  const handleCancelAutoReload = () => {
    setUserCancelled(true);
  };

  const handleClearCacheAndReload = () => {
    // Clear various caches before reloading
    if ('caches' in window && window.caches) {
      window.caches.keys().then((names: string[]) => {
        Promise.all(names.map((name: string) => window.caches.delete(name)))
          .then(() => {
            window.location.reload();
          })
          .catch(() => {
            // If cache clearing fails, just reload
            window.location.reload();
          });
      }).catch(() => {
        // If cache clearing fails, just reload
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full space-y-4">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>حدث خطأ غير متوقع</AlertTitle>
          <AlertDescription>
            {isDynamicImportError ? (
              <>نعتذر، فشل في تحميل جزء من التطبيق. قد يكون هذا بسبب مشكلة في الشبكة أو تحديث التطبيق.</>
            ) : (
              <>نعتذر، حدث خطأ في التطبيق.</>
            )}
            {!userCancelled && countdown > 0 && (
              <> سيتم تحديث الصفحة تلقائياً خلال {countdown} ثانية.</>
            )}
          </AlertDescription>
        </Alert>

        {isDevelopment && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>تفاصيل الخطأ (بيئة التطوير)</AlertTitle>
            <AlertDescription className="font-mono text-xs mt-2 whitespace-pre-wrap">
              {error.message}
              {error.stack && (
                <details className="mt-2">
                  <summary className="cursor-pointer">عرض Stack Trace</summary>
                  <pre className="mt-2 text-xs overflow-auto max-h-32">
                    {error.stack}
                  </pre>
                </details>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex gap-2 justify-center">
            <Button onClick={retry} variant="default">
              إعادة المحاولة
            </Button>
            {isDynamicImportError ? (
              <Button 
                onClick={handleClearCacheAndReload} 
                variant="outline"
              >
                مسح الذاكرة المؤقتة وإعادة التحميل
              </Button>
            ) : (
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
              >
                إعادة تحميل الصفحة
              </Button>
            )}
          </div>
          {!userCancelled && countdown > 0 && (
            <Button 
              onClick={handleCancelAutoReload} 
              variant="ghost" 
              size="sm"
              className="text-xs"
            >
              إلغاء إعادة التحميل التلقائي
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}