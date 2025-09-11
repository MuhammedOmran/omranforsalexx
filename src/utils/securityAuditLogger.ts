// DEPRECATED: This file contains insecure localStorage-based audit logging
// Use src/utils/secureAuditLogger.ts instead for secure database-based logging

// Stub implementation for backward compatibility
const storage = {
  getItem: (key: string, defaultValue: any = []) => defaultValue,
  setItem: (key: string, value: any) => {}
};

export interface SecurityEvent {
  id: string;
  eventType: 'optimization_run' | 'system_access' | 'data_export' | 'settings_change' | 'admin_action' | 'sensitive_operation';
  userId: string;
  userEmail: string;
  operation: string;
  module: string;
  beforeState?: any;
  afterState?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: any;
  requiresApproval?: boolean;
  approvedBy?: string;
  approvalTimestamp?: string;
}

export interface AuditTrail {
  entityType: string;
  entityId: string;
  changes: Array<{
    field: string;
    oldValue: any;
    newValue: any;
    timestamp: string;
    changedBy: string;
  }>;
}

export class SecurityAuditLogger {
  private static instance: SecurityAuditLogger;

  static getInstance(): SecurityAuditLogger {
    if (!SecurityAuditLogger.instance) {
      SecurityAuditLogger.instance = new SecurityAuditLogger();
    }
    return SecurityAuditLogger.instance;
  }

  // DEPRECATED: Use secureAuditLogger instead
  logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): void {
    console.warn('DEPRECATED: Use secureAuditLogger.logSecurityEvent instead');
    // This is now a no-op for security
  }

  // تسجيل مسار التدقيق للتغييرات
  logAuditTrail(trail: AuditTrail): void {
    try {
      const trails = this.getAuditTrails();
      const existingTrailIndex = trails.findIndex(
        t => t.entityType === trail.entityType && t.entityId === trail.entityId
      );

      if (existingTrailIndex >= 0) {
        trails[existingTrailIndex].changes.push(...trail.changes);
        // الاحتفاظ بآخر 100 تغيير لكل كيان
        trails[existingTrailIndex].changes = trails[existingTrailIndex].changes.slice(-100);
      } else {
        trails.push(trail);
      }

      // الاحتفاظ بآخر 1000 مسار تدقيق
      const limitedTrails = trails.slice(-1000);
      storage.setItem('audit_trails', limitedTrails);

    } catch (error) {
      console.error('Error logging audit trail:', error);
    }
  }

  // تسجيل عمليات التحسين
  logOptimizationOperation(
    userId: string,
    userEmail: string,
    operation: string,
    beforeState: any,
    afterState: any,
    requiresApproval: boolean = false
  ): void {
    this.logSecurityEvent({
      eventType: 'optimization_run',
      userId,
      userEmail,
      operation,
      module: 'performance',
      beforeState,
      afterState,
      severity: requiresApproval ? 'high' : 'medium',
      requiresApproval,
      metadata: {
        performanceImpact: this.calculatePerformanceImpact(beforeState, afterState),
        affectedComponents: this.extractAffectedComponents(beforeState, afterState)
      }
    });
  }

  // تسجيل الوصول للإعدادات الحساسة
  logSensitiveSettingsAccess(
    userId: string,
    userEmail: string,
    settingName: string,
    action: 'view' | 'modify',
    oldValue?: any,
    newValue?: any
  ): void {
    this.logSecurityEvent({
      eventType: 'settings_change',
      userId,
      userEmail,
      operation: `${action}_${settingName}`,
      module: 'settings',
      beforeState: oldValue,
      afterState: newValue,
      severity: action === 'modify' ? 'high' : 'medium',
      requiresApproval: action === 'modify' && this.isCriticalSetting(settingName)
    });
  }

  // تسجيل عمليات تصدير البيانات
  logDataExport(
    userId: string,
    userEmail: string,
    dataType: string,
    recordCount: number,
    filters?: any
  ): void {
    this.logSecurityEvent({
      eventType: 'data_export',
      userId,
      userEmail,
      operation: `export_${dataType}`,
      module: 'reports',
      severity: recordCount > 1000 ? 'high' : 'medium',
      metadata: {
        recordCount,
        filters,
        exportSize: this.estimateExportSize(dataType, recordCount)
      }
    });
  }

  // تسجيل العمليات الإدارية
  logAdminAction(
    userId: string,
    userEmail: string,
    action: string,
    targetUserId?: string,
    details?: any
  ): void {
    this.logSecurityEvent({
      eventType: 'admin_action',
      userId,
      userEmail,
      operation: action,
      module: 'admin',
      severity: 'high',
      requiresApproval: this.requiresApproval(action),
      metadata: {
        targetUserId,
        details
      }
    });
  }

  // الحصول على الأحداث الأمنية
  getSecurityEvents(filter?: {
    eventType?: string;
    userId?: string;
    severity?: string;
    startDate?: string;
    endDate?: string;
    requiresApproval?: boolean;
  }): SecurityEvent[] {
    try {
      let events = storage.getItem('security_events', []);

      if (filter) {
        if (filter.eventType) {
          events = events.filter(e => e.eventType === filter.eventType);
        }
        if (filter.userId) {
          events = events.filter(e => e.userId === filter.userId);
        }
        if (filter.severity) {
          events = events.filter(e => e.severity === filter.severity);
        }
        if (filter.requiresApproval !== undefined) {
          events = events.filter(e => e.requiresApproval === filter.requiresApproval);
        }
        if (filter.startDate) {
          events = events.filter(e => 
            new Date(e.timestamp) >= new Date(filter.startDate!)
          );
        }
        if (filter.endDate) {
          events = events.filter(e => 
            new Date(e.timestamp) <= new Date(filter.endDate!)
          );
        }
      }

      return events.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error) {
      console.error('Error getting security events:', error);
      return [];
    }
  }

  // الحصول على مسارات التدقيق
  getAuditTrails(entityType?: string, entityId?: string): AuditTrail[] {
    try {
      let trails = storage.getItem('audit_trails', []);

      if (entityType) {
        trails = trails.filter(t => t.entityType === entityType);
      }
      if (entityId) {
        trails = trails.filter(t => t.entityId === entityId);
      }

      return trails;
    } catch (error) {
      console.error('Error getting audit trails:', error);
      return [];
    }
  }

  // الموافقة على العمليات المعلقة
  approveSecurityEvent(eventId: string, approvedBy: string): boolean {
    try {
      const events = this.getSecurityEvents();
      const eventIndex = events.findIndex(e => e.id === eventId);
      
      if (eventIndex >= 0 && events[eventIndex].requiresApproval) {
        events[eventIndex].approvedBy = approvedBy;
        events[eventIndex].approvalTimestamp = new Date().toISOString();
        storage.setItem('security_events', events);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error approving security event:', error);
      return false;
    }
  }

  // إحصائيات الأمان
  getSecurityStatistics(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const events = this.getSecurityEvents({
      startDate: startDate.toISOString()
    });

    const totalEvents = events.length;
    const criticalEvents = events.filter(e => e.severity === 'critical').length;
    const highSeverityEvents = events.filter(e => e.severity === 'high').length;
    const pendingApprovals = events.filter(e => e.requiresApproval && !e.approvedBy).length;

    // تجميع حسب نوع الحدث
    const eventTypeBreakdown: { [key: string]: number } = {};
    events.forEach(event => {
      eventTypeBreakdown[event.eventType] = (eventTypeBreakdown[event.eventType] || 0) + 1;
    });

    // تجميع حسب المستخدم
    const userActivityBreakdown: { [key: string]: number } = {};
    events.forEach(event => {
      userActivityBreakdown[event.userEmail] = (userActivityBreakdown[event.userEmail] || 0) + 1;
    });

    return {
      totalEvents,
      criticalEvents,
      highSeverityEvents,
      pendingApprovals,
      eventTypeBreakdown,
      userActivityBreakdown,
      securityScore: this.calculateSecurityScore(events),
      recentCriticalEvents: events
        .filter(e => e.severity === 'critical')
        .slice(0, 10)
    };
  }

  // وظائف مساعدة خاصة
  private getCurrentIP(): string {
    // في بيئة الإنتاج، يمكن الحصول على IP من API
    return 'localhost';
  }

  private triggerCriticalAlert(event: SecurityEvent): void {
    console.error('تحذير أمني حرج:', event);
    // يمكن إرسال إشعارات للمدراء هنا
  }

  private calculatePerformanceImpact(before: any, after: any): string {
    // حساب تأثير الأداء
    return 'متوسط';
  }

  private extractAffectedComponents(before: any, after: any): string[] {
    // استخراج المكونات المتأثرة
    return ['UI', 'Database'];
  }

  private isCriticalSetting(settingName: string): boolean {
    const criticalSettings = [
      'system_backup',
      'user_permissions',
      'data_retention',
      'security_settings'
    ];
    return criticalSettings.includes(settingName);
  }

  private estimateExportSize(dataType: string, recordCount: number): string {
    const avgSizePerRecord = 1024; // KB
    const totalSize = (recordCount * avgSizePerRecord) / 1024; // MB
    return `${totalSize.toFixed(2)} MB`;
  }

  private requiresApproval(action: string): boolean {
    const approvalRequiredActions = [
      'delete_user',
      'change_permissions',
      'system_reset',
      'data_purge'
    ];
    return approvalRequiredActions.includes(action);
  }

  private calculateSecurityScore(events: SecurityEvent[]): number {
    if (events.length === 0) return 100;
    
    const criticalCount = events.filter(e => e.severity === 'critical').length;
    const highCount = events.filter(e => e.severity === 'high').length;
    const pendingCount = events.filter(e => e.requiresApproval && !e.approvedBy).length;
    
    let score = 100;
    score -= criticalCount * 20;
    score -= highCount * 10;
    score -= pendingCount * 5;
    
    return Math.max(score, 0);
  }
}

// تصدير المثيل الوحيد
export const securityAuditLogger = SecurityAuditLogger.getInstance();