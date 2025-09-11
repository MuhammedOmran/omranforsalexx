import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSecureAuditLogger } from './useSecureAuditLogger';
import { toast } from 'sonner';

export function useSecurityAudit() {
  const { user } = useAuth();
  const secureLogger = useSecureAuditLogger();

  // تسجيل عملية تحسين
  const logOptimization = useCallback((
    operation: string,
    beforeState: any,
    afterState: any,
    requiresApproval: boolean = false
  ) => {
    if (!user) return;
    
    secureLogger.logOptimization(`${operation}: ${beforeState} -> ${afterState}`);
  }, [user, secureLogger]);

  // تسجيل الوصول للإعدادات الحساسة
  const logSensitiveAccess = useCallback((
    settingName: string,
    action: 'view' | 'modify',
    oldValue?: any,
    newValue?: any
  ) => {
    if (!user) return;
    
    secureLogger.logSensitiveAccess(`${action} ${settingName}`, { oldValue, newValue });
  }, [user, secureLogger]);

  // تسجيل تصدير البيانات
  const logDataExport = useCallback((
    dataType: string,
    recordCount: number,
    filters?: any
  ) => {
    if (!user) return;
    
    secureLogger.logDataExport(`Export ${dataType}`, { recordCount, filters });
  }, [user, secureLogger]);

  // تسجيل العمليات الإدارية
  const logAdminAction = useCallback((
    action: string,
    targetUserId?: string,
    details?: any
  ) => {
    if (!user) return;
    
    secureLogger.logAdminAction(`Admin ${action}`, { targetUserId, details });
  }, [user, secureLogger]);

  // تسجيل مسار التدقيق
  const logAuditTrail = useCallback((
    entityType: string,
    entityId: string,
    field: string,
    oldValue: any,
    newValue: any
  ) => {
    if (!user) return;
    
    secureLogger.logSecurityEvent({
      event_type: 'audit_trail',
      event_description: `تغيير في ${entityType}: ${field}`,
      metadata: {
        entityType,
        entityId,
        field,
        oldValue,
        newValue,
        changedBy: user.email
      },
      severity: 'medium'
    });
  }, [user, secureLogger]);

  // Deprecated functions - will be removed in future versions
  const getSecurityEvents = useCallback(() => {
    console.warn('getSecurityEvents is deprecated. Use Supabase dashboard to view audit logs.');
    return [];
  }, []);

  const getAuditTrails = useCallback(() => {
    console.warn('getAuditTrails is deprecated. Use Supabase dashboard to view audit logs.');
    return [];
  }, []);

  const approveSecurityEvent = useCallback(() => {
    console.warn('approveSecurityEvent is deprecated.');
    return false;
  }, []);

  const getSecurityStatistics = useCallback(() => {
    console.warn('getSecurityStatistics is deprecated.');
    return {};
  }, []);

  return {
    logOptimization,
    logSensitiveAccess,
    logDataExport,
    logAdminAction,
    logAuditTrail,
    getSecurityEvents,
    getAuditTrails,
    approveSecurityEvent,
    getSecurityStatistics
  };
}