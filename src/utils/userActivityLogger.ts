import { storage } from './storage';
import { User } from '@/types/auth';

export interface UserActivity {
  id: string;
  userId: string;
  userEmail: string;
  action: 'login' | 'logout' | 'created' | 'updated' | 'deleted' | 'role_changed' | 'status_changed' | 'access_denied';
  module?: string; // Which module was accessed
  details: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: any;
}

export interface ActivityFilter {
  userId?: string;
  action?: string;
  module?: string;
  severity?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export class UserActivityLogger {
  private static instance: UserActivityLogger;

  static getInstance(): UserActivityLogger {
    if (!UserActivityLogger.instance) {
      UserActivityLogger.instance = new UserActivityLogger();
    }
    return UserActivityLogger.instance;
  }

  // Log user activity
  logActivity(activity: Omit<UserActivity, 'id' | 'timestamp'>): void {
    try {
      const activities = this.getActivities();
      const newActivity: UserActivity = {
        ...activity,
        id: `ACT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString()
      };

      activities.push(newActivity);
      
      // Keep only last 1000 activities to prevent storage overflow
      const limitedActivities = activities.slice(-1000);
      storage.setItem('user_activities', limitedActivities);

      // Log critical activities to console for debugging
      if (activity.severity === 'critical') {
        console.warn('Critical user activity:', newActivity);
      }
    } catch (error) {
      console.error('Error logging user activity:', error);
    }
  }

  // Get all activities with optional filtering
  getActivities(filter?: ActivityFilter): UserActivity[] {
    try {
      let activities = storage.getItem('user_activities', []);

      if (filter) {
        if (filter.userId) {
          activities = activities.filter(a => a.userId === filter.userId);
        }
        if (filter.action) {
          activities = activities.filter(a => a.action === filter.action);
        }
        if (filter.module) {
          activities = activities.filter(a => a.module === filter.module);
        }
        if (filter.severity) {
          activities = activities.filter(a => a.severity === filter.severity);
        }
        if (filter.startDate) {
          activities = activities.filter(a => 
            new Date(a.timestamp) >= new Date(filter.startDate!)
          );
        }
        if (filter.endDate) {
          activities = activities.filter(a => 
            new Date(a.timestamp) <= new Date(filter.endDate!)
          );
        }
        if (filter.limit) {
          activities = activities.slice(-filter.limit);
        }
      }

      return activities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error) {
      console.error('Error getting activities:', error);
      return [];
    }
  }

  // Log user login
  logLogin(user: User, success: boolean = true): void {
    this.logActivity({
      userId: user.id,
      userEmail: user.email,
      action: 'login',
      details: success ? 
        `تم تسجيل الدخول بنجاح - ${user.name}` : 
        `فشل في تسجيل الدخول - ${user.email}`,
      severity: success ? 'low' : 'medium',
      metadata: { 
        role: user.role.nameAr,
        loginSuccess: success 
      }
    });
  }

  // Log user logout
  logLogout(user: User): void {
    this.logActivity({
      userId: user.id,
      userEmail: user.email,
      action: 'logout',
      details: `تم تسجيل الخروج - ${user.name}`,
      severity: 'low'
    });
  }

  // Log user creation
  logUserCreation(newUser: User, createdBy: User): void {
    this.logActivity({
      userId: createdBy.id,
      userEmail: createdBy.email,
      action: 'created',
      module: 'users',
      details: `تم إنشاء مستخدم جديد: ${newUser.name} (${newUser.email}) بدور ${newUser.role.nameAr}`,
      severity: 'medium',
      metadata: {
        newUserId: newUser.id,
        newUserRole: newUser.role.nameAr
      }
    });
  }

  // Log user update
  logUserUpdate(updatedUser: User, updatedBy: User, changes: any): void {
    this.logActivity({
      userId: updatedBy.id,
      userEmail: updatedBy.email,
      action: 'updated',
      module: 'users',
      details: `تم تحديث بيانات المستخدم: ${updatedUser.name}`,
      severity: 'medium',
      metadata: {
        updatedUserId: updatedUser.id,
        changes
      }
    });
  }

  // Log user deletion
  logUserDeletion(deletedUser: User, deletedBy: User): void {
    this.logActivity({
      userId: deletedBy.id,
      userEmail: deletedBy.email,
      action: 'deleted',
      module: 'users',
      details: `تم حذف المستخدم: ${deletedUser.name} (${deletedUser.email})`,
      severity: 'high',
      metadata: {
        deletedUserId: deletedUser.id,
        deletedUserRole: deletedUser.role.nameAr
      }
    });
  }

  // Log role change
  logRoleChange(user: User, oldRole: string, newRole: string, changedBy: User): void {
    this.logActivity({
      userId: changedBy.id,
      userEmail: changedBy.email,
      action: 'role_changed',
      module: 'users',
      details: `تم تغيير دور المستخدم ${user.name} من ${oldRole} إلى ${newRole}`,
      severity: 'high',
      metadata: {
        targetUserId: user.id,
        oldRole,
        newRole
      }
    });
  }

  // Log status change
  logStatusChange(user: User, oldStatus: boolean, newStatus: boolean, changedBy: User): void {
    this.logActivity({
      userId: changedBy.id,
      userEmail: changedBy.email,
      action: 'status_changed',
      module: 'users',
      details: `تم ${newStatus ? 'تفعيل' : 'إلغاء تفعيل'} المستخدم ${user.name}`,
      severity: 'medium',
      metadata: {
        targetUserId: user.id,
        oldStatus,
        newStatus
      }
    });
  }

  // Log access denied
  logAccessDenied(user: User, module: string, action: string): void {
    this.logActivity({
      userId: user.id,
      userEmail: user.email,
      action: 'access_denied',
      module,
      details: `تم رفض الوصول إلى ${module} - ${action} للمستخدم ${user.name}`,
      severity: 'medium',
      metadata: {
        deniedModule: module,
        deniedAction: action,
        userRole: user.role.nameAr
      }
    });
  }

  // Get activity statistics
  getActivityStatistics(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const activities = this.getActivities({
      startDate: startDate.toISOString()
    });

    const totalActivities = activities.length;
    const loginActivities = activities.filter(a => a.action === 'login').length;
    const criticalActivities = activities.filter(a => a.severity === 'critical').length;
    const highSeverityActivities = activities.filter(a => a.severity === 'high').length;

    // Group by day
    const dailyActivities: { [key: string]: number } = {};
    activities.forEach(activity => {
      const day = new Date(activity.timestamp).toISOString().split('T')[0];
      dailyActivities[day] = (dailyActivities[day] || 0) + 1;
    });

    // Group by user
    const userActivities: { [key: string]: number } = {};
    activities.forEach(activity => {
      userActivities[activity.userEmail] = (userActivities[activity.userEmail] || 0) + 1;
    });

    // Group by action
    const actionBreakdown: { [key: string]: number } = {};
    activities.forEach(activity => {
      actionBreakdown[activity.action] = (actionBreakdown[activity.action] || 0) + 1;
    });

    return {
      totalActivities,
      loginActivities,
      criticalActivities,
      highSeverityActivities,
      dailyActivities,
      userActivities,
      actionBreakdown,
      mostActiveUsers: Object.entries(userActivities)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5),
      recentCriticalActivities: activities
        .filter(a => a.severity === 'critical' || a.severity === 'high')
        .slice(0, 10)
    };
  }

  // Clear old activities (older than specified days)
  clearOldActivities(olderThanDays: number = 90): number {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      
      const activities = this.getActivities();
      const filteredActivities = activities.filter(activity => 
        new Date(activity.timestamp) >= cutoffDate
      );
      
      const removedCount = activities.length - filteredActivities.length;
      storage.setItem('user_activities', filteredActivities);
      
      return removedCount;
    } catch (error) {
      console.error('Error clearing old activities:', error);
      return 0;
    }
  }

  // Export activities as CSV
  exportActivities(filter?: ActivityFilter): string {
    const activities = this.getActivities(filter);
    
    const headers = [
      'التاريخ والوقت',
      'المستخدم',
      'البريد الإلكتروني',
      'الإجراء',
      'الوحدة',
      'التفاصيل',
      'الخطورة'
    ];
    
    const csvRows = activities.map(activity => [
      new Date(activity.timestamp).toLocaleString('ar-SA'),
      activity.userEmail,
      activity.userEmail,
      activity.action,
      activity.module || '',
      activity.details,
      activity.severity
    ]);
    
    const csvContent = [headers, ...csvRows]
      .map(row => row.map(cell => `\"${cell}\"`).join(','))
      .join('\n');
    
    return csvContent;
  }
}

// Export singleton instance
export const userActivityLogger = UserActivityLogger.getInstance();
