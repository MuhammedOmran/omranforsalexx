import { useState, useEffect } from 'react';
import { getErrorReport } from '@/utils/unifiedErrorHandler';

export function useMonitoring() {
  const [isMonitoring, setIsMonitoring] = useState(true);

  const getStats = () => {
    try {
      const errorReport = getErrorReport();
      return {
        totalErrors: errorReport.totalErrors,
        recentErrors: errorReport.recentErrors,
        systemHealth: errorReport.systemHealth
      };
    } catch (error) {
      return {
        totalErrors: 0,
        recentErrors: [],
        systemHealth: 'healthy' as const
      };
    }
  };

  const toggleMonitoring = (enabled: boolean) => {
    setIsMonitoring(enabled);
  };

  return {
    isMonitoring,
    getStats,
    toggleMonitoring
  };
}