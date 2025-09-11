import { useState } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface AuditEvent {
  event_type: string;
  event_description: string;
  metadata?: any;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  risk_score?: number;
}

export const useSecureAuditLogger = () => {
  const { user } = useSupabaseAuth();
  const [isLogging, setIsLogging] = useState(false);

  const logSecurityEvent = async (event: AuditEvent) => {
    if (!user) return;

    try {
      setIsLogging(true);
      
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          event_type: event.event_type,
          event_description: event.event_description,
          severity: event.severity || 'low',
          risk_score: event.risk_score || 0,
          metadata: event.metadata || {}
        });

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Failed to log security event:', error);
      return false;
    } finally {
      setIsLogging(false);
    }
  };

  const logLoginAttempt = async (success: boolean, metadata?: any) => {
    return await logSecurityEvent({
      event_type: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
      event_description: success ? 'تسجيل دخول ناجح' : 'فشل في تسجيل الدخول',
      metadata,
      severity: success ? 'low' : 'medium'
    });
  };

  const logSuspiciousActivity = async (description: string, metadata?: any) => {
    return await logSecurityEvent({
      event_type: 'SUSPICIOUS_ACTIVITY',
      event_description: description,
      metadata,
      severity: 'high'
    });
  };

  const logDataAccess = async (resource: string, action: string, metadata?: any) => {
    return await logSecurityEvent({
      event_type: 'DATA_ACCESS',
      event_description: `الوصول إلى ${resource} - ${action}`,
      metadata: { resource, action, ...metadata },
      severity: 'low'
    });
  };

  const logSecurityIncident = async (description: string, metadata?: any) => {
    return await logSecurityEvent({
      event_type: 'SECURITY_INCIDENT',
      event_description: description,
      metadata,
      severity: 'critical'
    });
  };

  const logOptimization = async (description: string, metadata?: any) => {
    return await logSecurityEvent({
      event_type: 'OPTIMIZATION',
      event_description: description,
      metadata,
      severity: 'low'
    });
  };

  const logSensitiveAccess = async (description: string, metadata?: any) => {
    return await logSecurityEvent({
      event_type: 'SENSITIVE_ACCESS',
      event_description: description,
      metadata,
      severity: 'medium'
    });
  };

  const logDataExport = async (description: string, metadata?: any) => {
    return await logSecurityEvent({
      event_type: 'DATA_EXPORT',
      event_description: description,
      metadata,
      severity: 'medium'
    });
  };

  const logAdminAction = async (description: string, metadata?: any) => {
    return await logSecurityEvent({
      event_type: 'ADMIN_ACTION',
      event_description: description,
      metadata,
      severity: 'high'
    });
  };

  return {
    logSecurityEvent,
    logLoginAttempt,
    logSuspiciousActivity,
    logDataAccess,
    logSecurityIncident,
    logOptimization,
    logSensitiveAccess,
    logDataExport,
    logAdminAction,
    isLogging
  };
};