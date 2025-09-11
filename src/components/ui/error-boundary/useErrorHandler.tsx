import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/utils/logger';

/**
 * Hook لمعالجة الأخطاء في المكونات الوظيفية
 */
export function useErrorHandler() {
  const [error, setError] = useState<Error | null>(null);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((error: Error) => {
    setError(error);
    logger.error('Error caught by useErrorHandler', error, 'useErrorHandler');
  }, []);

  useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { handleError, resetError };
}