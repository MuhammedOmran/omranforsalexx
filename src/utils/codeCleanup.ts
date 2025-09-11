/**
 * أدوات تنظيف الكود وإزالة TODO items
 */

interface TodoItem {
  file: string;
  line: number;
  type: 'TODO' | 'FIXME' | 'HACK' | 'XXX';
  description: string;
  priority: 'low' | 'medium' | 'high';
}

interface CodeIssue {
  file: string;
  line: number;
  type: 'console.log' | 'console.warn' | 'console.error' | 'hardcoded-password' | 'security-issue';
  description: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

class CodeCleanupManager {
  private todos: TodoItem[] = [];
  private issues: CodeIssue[] = [];

  /**
   * تتبع TODO items في الكود
   */
  trackTodo(file: string, line: number, type: TodoItem['type'], description: string) {
    const priority = this.determinePriority(type, description);
    
    this.todos.push({
      file,
      line,
      type,
      description,
      priority
    });
  }

  /**
   * تتبع مشاكل الكود
   */
  trackIssue(file: string, line: number, type: CodeIssue['type'], description: string) {
    const severity = this.determineSeverity(type);
    
    this.issues.push({
      file,
      line,
      type,
      description,
      severity
    });
  }

  /**
   * تحديد أولوية المهمة
   */
  private determinePriority(type: TodoItem['type'], description: string): TodoItem['priority'] {
    if (type === 'FIXME' || type === 'XXX') return 'high';
    if (type === 'HACK') return 'medium';
    if (description.toLowerCase().includes('security') || 
        description.toLowerCase().includes('password') ||
        description.toLowerCase().includes('auth')) return 'high';
    return 'low';
  }

  /**
   * تحديد شدة المشكلة
   */
  private determineSeverity(type: CodeIssue['type']): CodeIssue['severity'] {
    switch (type) {
      case 'hardcoded-password':
      case 'security-issue':
        return 'critical';
      case 'console.error':
        return 'error';
      case 'console.warn':
        return 'warning';
      case 'console.log':
        return 'info';
      default:
        return 'info';
    }
  }

  /**
   * الحصول على تقرير شامل
   */
  getCleanupReport() {
    const todosByPriority = this.groupBy(this.todos, 'priority');
    const issuesBySeverity = this.groupBy(this.issues, 'severity');

    return {
      summary: {
        totalTodos: this.todos.length,
        totalIssues: this.issues.length,
        highPriorityTodos: todosByPriority.high?.length || 0,
        criticalIssues: issuesBySeverity.critical?.length || 0
      },
      todos: {
        all: this.todos,
        byPriority: todosByPriority
      },
      issues: {
        all: this.issues,
        bySeverity: issuesBySeverity
      },
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * توليد توصيات التنظيف
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    // التحقق من المشاكل الحرجة
    const criticalIssues = this.issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      recommendations.push(`🚨 إصلاح فوري: يوجد ${criticalIssues.length} مشكلة أمنية حرجة`);
    }

    // التحقق من console.log
    const consoleIssues = this.issues.filter(i => i.type === 'console.log');
    if (consoleIssues.length > 50) {
      recommendations.push(`🧹 تنظيف: إزالة ${consoleIssues.length} استدعاء console.log`);
    }

    // التحقق من TODO items
    const highPriorityTodos = this.todos.filter(t => t.priority === 'high');
    if (highPriorityTodos.length > 5) {
      recommendations.push(`⚡ إكمال: ${highPriorityTodos.length} مهام عالية الأولوية`);
    }

    // توصيات عامة
    if (this.todos.length > 20) {
      recommendations.push('📋 إنشاء خطة عمل لإكمال المهام المؤجلة');
    }

    if (this.issues.length > 100) {
      recommendations.push('🔧 تحسين نظام CI/CD لاكتشاف المشاكل مبكراً');
    }

    return recommendations;
  }

  /**
   * تجميع العناصر حسب خاصية معينة
   */
  private groupBy<T, K extends keyof T>(array: T[], key: K): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const group = String(item[key]);
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }

  /**
   * مسح جميع البيانات
   */
  clear() {
    this.todos = [];
    this.issues = [];
  }

  /**
   * تصدير البيانات للمراجعة
   */
  exportData() {
    return {
      todos: this.todos,
      issues: this.issues,
      report: this.getCleanupReport(),
      exportedAt: new Date().toISOString()
    };
  }
}

// إنشاء مدير واحد للتطبيق
export const codeCleanup = new CodeCleanupManager();

// دوال مساعدة للاستخدام السريع
export const trackTodo = (file: string, line: number, type: TodoItem['type'], description: string) =>
  codeCleanup.trackTodo(file, line, type, description);

export const trackCodeIssue = (file: string, line: number, type: CodeIssue['type'], description: string) =>
  codeCleanup.trackIssue(file, line, type, description);

// تحديد المشاكل الشائعة في التطوير
export const COMMON_ISSUES = {
  CONSOLE_LOG_IN_PRODUCTION: 'استخدام console.log في الإنتاج يؤثر على الأداء',
  HARDCODED_CREDENTIALS: 'كلمات المرور المدمجة في الكود تشكل خطراً أمنياً',
  MISSING_ERROR_HANDLING: 'عدم وجود معالجة مناسبة للأخطاء',
  LARGE_FILE_SIZE: 'حجم الملف كبير جداً ويحتاج تقسيم',
  DUPLICATE_CODE: 'تكرار في الكود يمكن تحسينه',
  PERFORMANCE_ISSUE: 'مشكلة في الأداء قد تؤثر على تجربة المستخدم'
} as const;