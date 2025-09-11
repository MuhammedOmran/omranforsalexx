import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface LoginAttempt {
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  email?: string;
}

interface AccountLockInfo {
  isLocked: boolean;
  lockedUntil?: string;
  attemptCount: number;
  lockReason?: string;
}

export function useLoginSecurity() {
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 دقيقة
  const SUSPICIOUS_THRESHOLD = 10;

  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [accountLocks, setAccountLocks] = useState<Map<string, AccountLockInfo>>(new Map());

  // تسجيل محاولة تسجيل دخول
  const logLoginAttempt = useCallback((email: string, success: boolean, additionalInfo?: any) => {
    const attempt: LoginAttempt = {
      timestamp: new Date().toISOString(),
      ipAddress: getClientIP(),
      userAgent: navigator.userAgent,
      success,
      email: email.toLowerCase()
    };

    // إضافة المحاولة للسجل
    const storedAttempts = getStoredAttempts();
    storedAttempts.push(attempt);
    
    // الاحتفاظ بآخر 1000 محاولة فقط
    const limitedAttempts = storedAttempts.slice(-1000);
    localStorage.setItem('login_attempts', JSON.stringify(limitedAttempts));
    
    setLoginAttempts(limitedAttempts);

    // فحص المحاولات المشبوهة
    if (!success) {
      checkSuspiciousActivity(email, limitedAttempts);
    }

    // تنظيف المحاولات القديمة (أكثر من 24 ساعة)
    cleanupOldAttempts();
  }, []);

  // فحص النشاط المشبوه
  const checkSuspiciousActivity = (email: string, attempts: LoginAttempt[]) => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    // فحص المحاولات الفاشلة خلال الساعة الأخيرة
    const recentFailedAttempts = attempts.filter(attempt => 
      attempt.email === email.toLowerCase() &&
      !attempt.success &&
      new Date(attempt.timestamp) > oneHourAgo
    );

    if (recentFailedAttempts.length >= MAX_ATTEMPTS) {
      lockAccount(email, 'تجاوز الحد الأقصى لمحاولات تسجيل الدخول الفاشلة');
    }

    // فحص محاولات من IP مختلفة
    const uniqueIPs = new Set(recentFailedAttempts.map(a => a.ipAddress));
    if (uniqueIPs.size >= 3) {
      lockAccount(email, 'محاولات تسجيل دخول من عدة عناوين IP');
    }

    // فحص السرعة غير الطبيعية
    if (recentFailedAttempts.length >= 3) {
      const timeSpan = new Date(recentFailedAttempts[recentFailedAttempts.length - 1].timestamp).getTime() - 
                      new Date(recentFailedAttempts[0].timestamp).getTime();
      
      if (timeSpan < 2 * 60 * 1000) { // أقل من دقيقتين
        lockAccount(email, 'محاولات سريعة متتالية - نشاط مشبوه');
      }
    }
  };

  // قفل الحساب
  const lockAccount = (email: string, reason: string) => {
    const lockInfo: AccountLockInfo = {
      isLocked: true,
      lockedUntil: new Date(Date.now() + LOCKOUT_DURATION).toISOString(),
      attemptCount: getFailedAttemptCount(email),
      lockReason: reason
    };

    const locks = getStoredLocks();
    locks[email.toLowerCase()] = lockInfo;
    localStorage.setItem('account_locks', JSON.stringify(locks));

    setAccountLocks(new Map(Object.entries(locks)));

    toast.error(`تم قفل الحساب لمدة 15 دقيقة: ${reason}`);
    
    // إشعار المدير
    notifyAdminOfSuspiciousActivity(email, reason);
  };

  // التحقق من حالة قفل الحساب
  const checkAccountLock = (email: string): AccountLockInfo => {
    const locks = getStoredLocks();
    const lockInfo = locks[email.toLowerCase()];

    if (!lockInfo || !lockInfo.isLocked) {
      return { isLocked: false, attemptCount: 0 };
    }

    // التحقق من انتهاء مدة القفل
    if (lockInfo.lockedUntil && new Date() > new Date(lockInfo.lockedUntil)) {
      // إلغاء القفل
      delete locks[email.toLowerCase()];
      localStorage.setItem('account_locks', JSON.stringify(locks));
      setAccountLocks(new Map(Object.entries(locks)));
      
      return { isLocked: false, attemptCount: 0 };
    }

    return lockInfo;
  };

  // إلغاء قفل الحساب (للمدراء)
  const unlockAccount = (email: string): boolean => {
    try {
      const locks = getStoredLocks();
      delete locks[email.toLowerCase()];
      localStorage.setItem('account_locks', JSON.stringify(locks));
      setAccountLocks(new Map(Object.entries(locks)));
      
      toast.success(`تم إلغاء قفل الحساب: ${email}`);
      return true;
    } catch (error) {
      toast.error('فشل في إلغاء قفل الحساب');
      return false;
    }
  };

  // التحقق من قوة كلمة المرور
  const validatePasswordStrength = (password: string): {
    isStrong: boolean;
    score: number;
    feedback: string[];
  } => {
    const feedback: string[] = [];
    let score = 0;

    // الحد الأدنى للطول
    if (password.length < 8) {
      feedback.push('يجب أن تكون كلمة المرور 8 أحرف على الأقل');
    } else {
      score += 10;
    }

    // أحرف كبيرة وصغيرة
    if (!/[a-z]/.test(password)) {
      feedback.push('يجب أن تحتوي على أحرف صغيرة');
    } else {
      score += 10;
    }

    if (!/[A-Z]/.test(password)) {
      feedback.push('يجب أن تحتوي على أحرف كبيرة');
    } else {
      score += 10;
    }

    // أرقام
    if (!/\d/.test(password)) {
      feedback.push('يجب أن تحتوي على أرقام');
    } else {
      score += 10;
    }

    // رموز خاصة
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      feedback.push('يجب أن تحتوي على رموز خاصة');
    } else {
      score += 15;
    }

    // التنوع
    const uniqueChars = new Set(password).size;
    if (uniqueChars < password.length * 0.7) {
      feedback.push('تجنب تكرار الأحرف كثيراً');
    } else {
      score += 15;
    }

    // الأنماط الشائعة
    const commonPatterns = [
      /123/,
      /abc/i,
      /qwe/i,
      /password/i,
      /admin/i,
      /user/i
    ];

    if (commonPatterns.some(pattern => pattern.test(password))) {
      feedback.push('تجنب الأنماط الشائعة');
      score -= 20;
    }

    // الطول الإضافي
    if (password.length >= 12) {
      score += 10;
    }

    if (password.length >= 16) {
      score += 10;
    }

    const isStrong = score >= 60 && feedback.length === 0;

    return { isStrong, score: Math.max(0, Math.min(100, score)), feedback };
  };

  // فحص كلمات المرور المسربة (محاكاة)
  const checkBreachedPassword = async (password: string): Promise<boolean> => {
    // في التطبيق الحقيقي، يمكن استخدام خدمة مثل HaveIBeenPwned
    const commonPasswords = [
      '123456', 'password', '123456789', '12345678', '12345',
      '1234567', '1234567890', 'qwerty', 'abc123', '111111',
      'password123', 'admin', 'user', '123123', '1234'
    ];

    return commonPasswords.includes(password.toLowerCase());
  };

  // الحصول على إحصائيات الأمان
  const getSecurityStats = () => {
    const attempts = getStoredAttempts();
    const locks = getStoredLocks();
    
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentAttempts = attempts.filter(a => new Date(a.timestamp) > last24Hours);
    const failedAttempts = recentAttempts.filter(a => !a.success);
    const successfulAttempts = recentAttempts.filter(a => a.success);
    
    return {
      totalAttempts: recentAttempts.length,
      failedAttempts: failedAttempts.length,
      successfulAttempts: successfulAttempts.length,
      lockedAccounts: Object.keys(locks).length,
      suspiciousIPs: new Set(failedAttempts.map(a => a.ipAddress)).size,
      securityScore: calculateSecurityScore(recentAttempts, locks)
    };
  };

  // وظائف مساعدة
  const getStoredAttempts = (): LoginAttempt[] => {
    try {
      return JSON.parse(localStorage.getItem('login_attempts') || '[]');
    } catch {
      return [];
    }
  };

  const getStoredLocks = (): Record<string, AccountLockInfo> => {
    try {
      return JSON.parse(localStorage.getItem('account_locks') || '{}');
    } catch {
      return {};
    }
  };

  const getFailedAttemptCount = (email: string): number => {
    const attempts = getStoredAttempts();
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    return attempts.filter(a => 
      a.email === email.toLowerCase() &&
      !a.success &&
      new Date(a.timestamp) > oneHourAgo
    ).length;
  };

  const cleanupOldAttempts = () => {
    const attempts = getStoredAttempts();
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentAttempts = attempts.filter(a => new Date(a.timestamp) > oneDayAgo);
    localStorage.setItem('login_attempts', JSON.stringify(recentAttempts));
  };

  const getClientIP = (): string => {
    // في بيئة الإنتاج، يمكن الحصول على IP الحقيقي من API
    return 'localhost';
  };

  const notifyAdminOfSuspiciousActivity = (email: string, reason: string) => {
    console.warn(`نشاط مشبوه: ${email} - ${reason}`);
    // يمكن إرسال إشعار للمدراء هنا
  };

  const calculateSecurityScore = (attempts: LoginAttempt[], locks: Record<string, AccountLockInfo>): number => {
    let score = 100;
    
    const failedAttempts = attempts.filter(a => !a.success).length;
    const lockedAccounts = Object.keys(locks).length;
    
    score -= failedAttempts * 2;
    score -= lockedAccounts * 10;
    
    return Math.max(0, score);
  };

  return {
    logLoginAttempt,
    checkAccountLock,
    unlockAccount,
    validatePasswordStrength,
    checkBreachedPassword,
    getSecurityStats,
    loginAttempts,
    accountLocks
  };
}