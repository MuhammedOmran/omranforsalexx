import { storage } from './storage';
import { employeeManager, Employee } from './employeeManager';
import { User } from '@/types/auth';

export interface UserEmployeeLink {
  id: string;
  userId: string;
  employeeId: string;
  linkedAt: string;
  linkedBy: string;
  isActive: boolean;
  syncedData?: {
    lastSync: string;
    syncedFields: string[];
  };
}

export interface UserEmployeeIntegrationResult {
  success: boolean;
  message: string;
  linksCreated: number;
  dataUpdated: number;
  errors: string[];
}

export class UserEmployeeIntegrationManager {
  private static instance: UserEmployeeIntegrationManager;

  static getInstance(): UserEmployeeIntegrationManager {
    if (!UserEmployeeIntegrationManager.instance) {
      UserEmployeeIntegrationManager.instance = new UserEmployeeIntegrationManager();
    }
    return UserEmployeeIntegrationManager.instance;
  }

  // ربط مستخدم بموظف
  linkUserToEmployee(userId: string, employeeId: string, linkedBy: string): UserEmployeeIntegrationResult {
    try {
      const links = this.getAllLinks();
      
      // التحقق من وجود ربط سابق
      const existingLink = links.find(link => 
        link.userId === userId || link.employeeId === employeeId
      );

      if (existingLink) {
        return {
          success: false,
          message: 'المستخدم أو الموظف مرتبط بالفعل',
          linksCreated: 0,
          dataUpdated: 0,
          errors: ['الربط موجود مسبقاً']
        };
      }

      // إنشاء ربط جديد
      const newLink: UserEmployeeLink = {
        id: `link-${Date.now()}`,
        userId,
        employeeId,
        linkedAt: new Date().toISOString(),
        linkedBy,
        isActive: true,
        syncedData: {
          lastSync: new Date().toISOString(),
          syncedFields: []
        }
      };

      links.push(newLink);
      storage.setItem('user_employee_links', links);

      // مزامنة البيانات
      this.syncUserEmployeeData(userId, employeeId);

      return {
        success: true,
        message: 'تم ربط المستخدم بالموظف بنجاح',
        linksCreated: 1,
        dataUpdated: 1,
        errors: []
      };

    } catch (error) {
      return {
        success: false,
        message: 'فشل في ربط المستخدم بالموظف',
        linksCreated: 0,
        dataUpdated: 0,
        errors: [error instanceof Error ? error.message : 'خطأ غير معروف']
      };
    }
  }

  // إلغاء ربط مستخدم بموظف
  unlinkUserFromEmployee(userId: string): UserEmployeeIntegrationResult {
    try {
      const links = this.getAllLinks();
      const linkIndex = links.findIndex(link => link.userId === userId);

      if (linkIndex === -1) {
        return {
          success: false,
          message: 'لا يوجد ربط للمستخدم',
          linksCreated: 0,
          dataUpdated: 0,
          errors: ['الربط غير موجود']
        };
      }

      // تعطيل الربط بدلاً من حذفه
      links[linkIndex].isActive = false;
      storage.setItem('user_employee_links', links);

      return {
        success: true,
        message: 'تم إلغاء ربط المستخدم بنجاح',
        linksCreated: 0,
        dataUpdated: 1,
        errors: []
      };

    } catch (error) {
      return {
        success: false,
        message: 'فشل في إلغاء الربط',
        linksCreated: 0,
        dataUpdated: 0,
        errors: [error instanceof Error ? error.message : 'خطأ غير معروف']
      };
    }
  }

  // مزامنة بيانات المستخدم مع الموظف
  syncUserEmployeeData(userId: string, employeeId: string): boolean {
    try {
      const users = storage.getItem('system_users', []);
      const employee = employeeManager.getEmployeeById(employeeId);
      
      if (!employee) return false;

      const userIndex = users.findIndex((u: User) => u.id === userId);
      if (userIndex === -1) return false;

      // تحديث بيانات المستخدم من الموظف
      const updatedUser = {
        ...users[userIndex],
        department: employee.department,
        phone: employee.phoneNumber,
        email: employee.email || users[userIndex].email
      };

      users[userIndex] = updatedUser;
      storage.setItem('system_users', users);

      // تحديث معلومات المزامنة
      this.updateSyncInfo(userId, employeeId, ['department', 'phone', 'email']);

      return true;
    } catch (error) {
      console.error('خطأ في مزامنة البيانات:', error);
      return false;
    }
  }

  // الحصول على جميع الروابط
  getAllLinks(): UserEmployeeLink[] {
    return storage.getItem('user_employee_links', []);
  }

  // الحصول على الروابط النشطة فقط
  getActiveLinks(): UserEmployeeLink[] {
    return this.getAllLinks().filter(link => link.isActive);
  }

  // الحصول على الموظف المرتبط بالمستخدم
  getLinkedEmployee(userId: string): Employee | null {
    const link = this.getActiveLinks().find(link => link.userId === userId);
    if (!link) return null;
    
    return employeeManager.getEmployeeById(link.employeeId);
  }

  // الحصول على المستخدم المرتبط بالموظف
  getLinkedUser(employeeId: string): User | null {
    const link = this.getActiveLinks().find(link => link.employeeId === employeeId);
    if (!link) return null;
    
    const users = storage.getItem('system_users', []);
    return users.find((u: User) => u.id === link.userId) || null;
  }

  // تحديث معلومات المزامنة
  private updateSyncInfo(userId: string, employeeId: string, syncedFields: string[]): void {
    const links = this.getAllLinks();
    const linkIndex = links.findIndex(link => 
      link.userId === userId && link.employeeId === employeeId
    );

    if (linkIndex !== -1) {
      links[linkIndex].syncedData = {
        lastSync: new Date().toISOString(),
        syncedFields
      };
      storage.setItem('user_employee_links', links);
    }
  }

  // مزامنة جميع الروابط
  syncAllLinks(): UserEmployeeIntegrationResult {
    const activeLinks = this.getActiveLinks();
    let successCount = 0;
    const errors: string[] = [];

    activeLinks.forEach(link => {
      try {
        const success = this.syncUserEmployeeData(link.userId, link.employeeId);
        if (success) {
          successCount++;
        } else {
          errors.push(`فشل في مزامنة الربط ${link.id}`);
        }
      } catch (error) {
        errors.push(`خطأ في مزامنة الربط ${link.id}: ${error}`);
      }
    });

    return {
      success: errors.length === 0,
      message: `تم مزامنة ${successCount} من أصل ${activeLinks.length} ربط`,
      linksCreated: 0,
      dataUpdated: successCount,
      errors
    };
  }

  // البحث عن المستخدمين غير المرتبطين
  getUnlinkedUsers(): User[] {
    const users = storage.getItem('system_users', []);
    const linkedUserIds = this.getActiveLinks().map(link => link.userId);
    
    return users.filter((user: User) => !linkedUserIds.includes(user.id));
  }

  // البحث عن الموظفين غير المرتبطين
  getUnlinkedEmployees(): Employee[] {
    const employees = employeeManager.getEmployees();
    const linkedEmployeeIds = this.getActiveLinks().map(link => link.employeeId);
    
    return employees.filter(employee => !linkedEmployeeIds.includes(employee.id));
  }

  // اقتراحات الربط التلقائي
  suggestAutoLinks(): { userId: string; employeeId: string; confidence: number; reason: string }[] {
    const unlinkedUsers = this.getUnlinkedUsers();
    const unlinkedEmployees = this.getUnlinkedEmployees();
    const suggestions: { userId: string; employeeId: string; confidence: number; reason: string }[] = [];

    unlinkedUsers.forEach(user => {
      unlinkedEmployees.forEach(employee => {
        let confidence = 0;
        const reasons: string[] = [];

        // مطابقة الاسم
        if (user.name.toLowerCase() === employee.name.toLowerCase()) {
          confidence += 50;
          reasons.push('مطابقة الاسم');
        }

        // مطابقة البريد الإلكتروني
        if (user.email && employee.email && user.email.toLowerCase() === employee.email.toLowerCase()) {
          confidence += 40;
          reasons.push('مطابقة البريد الإلكتروني');
        }

        // مطابقة رقم الهاتف
        if (user.phone && employee.phoneNumber && user.phone === employee.phoneNumber) {
          confidence += 30;
          reasons.push('مطابقة رقم الهاتف');
        }

        // مطابقة القسم
        if (user.department && employee.department && user.department === employee.department) {
          confidence += 20;
          reasons.push('مطابقة القسم');
        }

        // إضافة الاقتراح إذا كان مستوى الثقة مقبول
        if (confidence >= 30) {
          suggestions.push({
            userId: user.id,
            employeeId: employee.id,
            confidence,
            reason: reasons.join(', ')
          });
        }
      });
    });

    // ترتيب الاقتراحات حسب مستوى الثقة
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  // تطبيق الربط التلقائي
  applyAutoLinks(suggestions: { userId: string; employeeId: string; confidence: number }[]): UserEmployeeIntegrationResult {
    let successCount = 0;
    const errors: string[] = [];

    suggestions.forEach(suggestion => {
      if (suggestion.confidence >= 50) { // ربط فقط الاقتراحات عالية الثقة
        const result = this.linkUserToEmployee(suggestion.userId, suggestion.employeeId, 'auto-link');
        if (result.success) {
          successCount++;
        } else {
          errors.push(...result.errors);
        }
      }
    });

    return {
      success: errors.length === 0,
      message: `تم ربط ${successCount} مستخدم تلقائياً`,
      linksCreated: successCount,
      dataUpdated: successCount,
      errors
    };
  }

  // إحصائيات الربط
  getLinkingStatistics() {
    const allLinks = this.getAllLinks();
    const activeLinks = this.getActiveLinks();
    const users = storage.getItem('system_users', []);
    const employees = employeeManager.getEmployees();

    return {
      totalLinks: allLinks.length,
      activeLinks: activeLinks.length,
      inactiveLinks: allLinks.length - activeLinks.length,
      totalUsers: users.length,
      totalEmployees: employees.length,
      linkedUsers: activeLinks.length,
      unlinkedUsers: users.length - activeLinks.length,
      linkedEmployees: activeLinks.length,
      unlinkedEmployees: employees.length - activeLinks.length,
      linkingRate: users.length > 0 ? ((activeLinks.length / users.length) * 100).toFixed(1) : '0'
    };
  }
}

// تصدير نسخة واحدة
export const userEmployeeIntegration = UserEmployeeIntegrationManager.getInstance();