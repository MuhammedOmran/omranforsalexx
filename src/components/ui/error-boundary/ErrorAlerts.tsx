import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * مكون تنبيه الأخطاء القابل للإعادة الاستخدام
 */
interface ErrorAlertProps {
  error: string | Error | null;
  onDismiss?: () => void;
  variant?: 'destructive' | 'default';
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function ErrorAlert({ 
  error, 
  onDismiss, 
  variant = 'destructive', 
  action,
  className 
}: ErrorAlertProps) {
  if (!error) return null;

  const errorMessage = error instanceof Error ? error.message : error;

  return (
    <Alert variant={variant} className={cn("relative", className)}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>خطأ</AlertTitle>
      <AlertDescription className="mt-2">
        {errorMessage}
      </AlertDescription>
      
      <div className="flex gap-2 mt-3">
        {action && (
          <Button size="sm" variant="outline" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
        {onDismiss && (
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            إغلاق
          </Button>
        )}
      </div>
    </Alert>
  );
}

/**
 * مكون تنبيه النجاح
 */
interface SuccessAlertProps {
  message: string;
  onDismiss?: () => void;
  autoHide?: boolean;
  duration?: number;
  className?: string;
}

export function SuccessAlert({ 
  message, 
  onDismiss, 
  autoHide = true, 
  duration = 5000,
  className 
}: SuccessAlertProps) {
  useEffect(() => {
    if (autoHide && onDismiss) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [autoHide, onDismiss, duration]);

  return (
    <Alert variant="default" className={cn("border-green-200 bg-green-50", className)}>
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertTitle className="text-green-800">نجح</AlertTitle>
      <AlertDescription className="text-green-700">
        {message}
      </AlertDescription>
      {onDismiss && (
        <Button 
          size="sm" 
          variant="ghost" 
          className="absolute top-2 left-2 h-6 w-6 p-0 text-green-600 hover:bg-green-100"
          onClick={onDismiss}
        >
          ✕
        </Button>
      )}
    </Alert>
  );
}