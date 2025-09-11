/**
 * نظام إدارة المستخدمين المتعددين والشركات المتعددة
 * Multi-User & Multi-Company Management System
 */

import { storage } from './storage';
import { advancedBackupManager } from './advancedBackupManager';
import CryptoJS from 'crypto-js';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'owner' | 'admin' | 'manager' | 'employee' | 'viewer';
  companyId: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  profilePicture?: string;
  phoneNumber?: string;
  department?: string;
  salary?: number;
  hireDate?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
}

export interface Company {
  id: string;
  name: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxNumber?: string;
  licenseNumber?: string;
  currency: string;
  country: string;
  timezone: string;
  settings: {
    language: string;
    dateFormat: string;
    numberFormat: string;
    fiscalYearStart: string;
    autoBackup: boolean;
    maxUsers: number;
    features: string[];
  };
  subscription: {
    plan: 'free' | 'basic' | 'premium' | 'enterprise';
    status: 'active' | 'suspended' | 'cancelled';
    startDate: string;
    endDate?: string;
    maxUsers: number;
    maxStorage: number; // MB
  };
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface UserSession {
  id: string;
  userId: string;
  companyId: string;
  deviceInfo: {
    browser: string;
    os: string;
    ip: string;
    deviceId: string;
  };
  loginTime: string;
  lastActivity: string;
  isActive: boolean;
  permissions: string[];
}

/**
 * مدير الأنظمة متعددة المستخدمين
 */
export class MultiUserManager {
  private static instance: MultiUserManager;
  private currentUser: User | null = null;
  private currentCompany: Company | null = null;
  private currentSession: UserSession | null = null;
  private encryptionKey = 'OmranSalesSystem2024!@#$';

  static getInstance(): MultiUserManager {
    if (!MultiUserManager.instance) {
      MultiUserManager.instance = new MultiUserManager();
    }
    return MultiUserManager.instance;
  }

  /**
   * إنشاء شركة جديدة مع المالك الأول
   */
  async createCompany(companyData: Partial<Company>, ownerData: Partial<User>): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const companyId = this.generateId('COMP');
      const ownerId = this.generateId('USER');

      // إنشاء الشركة
      const company: Company = {
        id: companyId,
        name: companyData.name!,
        logo: companyData.logo,
        address: companyData.address,
        phone: companyData.phone,
        email: companyData.email,
        website: companyData.website,
        taxNumber: companyData.taxNumber,
        licenseNumber: companyData.licenseNumber,
        currency: companyData.currency || 'EGP',
        country: companyData.country || 'Egypt',
        timezone: companyData.timezone || 'Africa/Cairo',
        settings: {
          language: 'ar',
          dateFormat: 'dd/MM/yyyy',
          numberFormat: 'ar-EG',
          fiscalYearStart: '01/01',
          autoBackup: true,
          maxUsers: 10,
          features: ['sales', 'inventory', 'purchases', 'cash', 'reports']
        },
        subscription: {
          plan: 'basic',
          status: 'active',
          startDate: new Date().toISOString(),
          maxUsers: 10,
          maxStorage: 1024 // 1GB
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true
      };

      // إنشاء المالك
      const owner: User = {
        id: ownerId,
        username: ownerData.username!,
        email: ownerData.email!,
        fullName: ownerData.fullName!,
        role: 'owner',
        companyId: companyId,
        permissions: this.getFullPermissions(),
        isActive: true,
        createdAt: new Date().toISOString(),
        phoneNumber: ownerData.phoneNumber,
        department: 'الإدارة العليا'
      };

      // حفظ البيانات مع التشفير
      await this.saveEncryptedData(`company_${companyId}`, company);
      await this.saveEncryptedData(`user_${ownerId}`, owner);
      
      // إضافة للفهارس
      this.addToIndex('companies', company);
      this.addToIndex('users', owner);

      // إنشاء جلسة للمالك
      const session = await this.createUserSession(owner, this.getDeviceInfo());
      
      // إعداد البيانات الحالية
      this.currentUser = owner;
      this.currentCompany = company;
      this.currentSession = session;

      // إنشاء نسخة احتياطية أولية
      await advancedBackupManager.createInitialBackup(companyId);

      return { 
        success: true, 
        data: { 
          company, 
          user: owner, 
          session 
        } 
      };

    } catch (error) {
      console.error('خطأ في إنشاء الشركة:', error);
      return { 
        success: false, 
        error: `فشل في إنشاء الشركة: ${error.message}` 
      };
    }
  }

  /**
   * تسجيل دخول مستخدم
   */
  async loginUser(username: string, password: string, companyId?: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // البحث عن المستخدم
      const users = this.getAllUsers();
      let user = users.find(u => 
        u.username === username && u.isActive &&
        (!companyId || u.companyId === companyId)
      );

      if (!user) {
        return { success: false, error: 'اسم المستخدم غير صحيح' };
      }

      // التحقق من كلمة المرور (في بيئة الإنتاج، استخدم bcrypt)
      const storedPassword = await this.getEncryptedData(`password_${user.id}`);
      if (!storedPassword || storedPassword !== this.hashPassword(password)) {
        return { success: false, error: 'كلمة المرور غير صحيحة' };
      }

      // جلب بيانات الشركة
      const company = await this.getEncryptedData(`company_${user.companyId}`);
      if (!company || !company.isActive) {
        return { success: false, error: 'الشركة غير نشطة أو غير موجودة' };
      }

      // التحقق من حدود الاشتراك
      const activeSessions = this.getActiveUserSessions(user.companyId);
      if (activeSessions.length >= company.subscription.maxUsers) {
        return { success: false, error: 'تم الوصول للحد الأقصى للمستخدمين المتزامنين' };
      }

      // إنشاء جلسة جديدة
      const session = await this.createUserSession(user, this.getDeviceInfo());
      
      // تحديث آخر تسجيل دخول
      user.lastLogin = new Date().toISOString();
      await this.saveEncryptedData(`user_${user.id}`, user);

      // إعداد البيانات الحالية
      this.currentUser = user;
      this.currentCompany = company;
      this.currentSession = session;

      // إشعار تسجيل الدخول
      this.notifyUserLogin(user, session);

      return { 
        success: true, 
        data: { user, company, session } 
      };

    } catch (error) {
      console.error('خطأ في تسجيل الدخول:', error);
      return { 
        success: false, 
        error: `فشل في تسجيل الدخول: ${error.message}` 
      };
    }
  }

  /**
   * إنشاء مستخدم جديد
   */
  async createUser(userData: Partial<User>, password: string, createdBy: string): Promise<{ success: boolean; data?: User; error?: string }> {
    try {
      // التحقق من الصلاحيات
      if (!this.hasPermission('manage_users')) {
        return { success: false, error: 'ليس لديك صلاحية لإنشاء مستخدمين' };
      }

      // التحقق من حدود الاشتراك
      const companyUsers = this.getCompanyUsers(this.currentCompany!.id);
      if (companyUsers.length >= this.currentCompany!.subscription.maxUsers) {
        return { success: false, error: 'تم الوصول للحد الأقصى للمستخدمين' };
      }

      // التحقق من عدم تكرار اسم المستخدم
      const existingUser = this.getAllUsers().find(u => u.username === userData.username);
      if (existingUser) {
        return { success: false, error: 'اسم المستخدم موجود مسبقاً' };
      }

      const userId = this.generateId('USER');
      
      const user: User = {
        id: userId,
        username: userData.username!,
        email: userData.email!,
        fullName: userData.fullName!,
        role: userData.role || 'employee',
        companyId: this.currentCompany!.id,
        permissions: this.getRolePermissions(userData.role || 'employee'),
        isActive: true,
        createdAt: new Date().toISOString(),
        phoneNumber: userData.phoneNumber,
        department: userData.department,
        salary: userData.salary,
        hireDate: userData.hireDate,
        emergencyContact: userData.emergencyContact
      };

      // حفظ المستخدم وكلمة المرور
      await this.saveEncryptedData(`user_${userId}`, user);
      await this.saveEncryptedData(`password_${userId}`, this.hashPassword(password));
      
      // إضافة للفهرس
      this.addToIndex('users', user);

      // تسجيل النشاط
      this.logActivity('user_created', `تم إنشاء مستخدم جديد: ${user.fullName}`, createdBy);

      return { success: true, data: user };

    } catch (error) {
      console.error('خطأ في إنشاء المستخدم:', error);
      return { success: false, error: `فشل في إنشاء المستخدم: ${error.message}` };
    }
  }

  /**
   * إنهاء جلسة مستخدم
   */
  async logoutUser(): Promise<boolean> {
    try {
      if (this.currentSession) {
        // تحديث الجلسة
        this.currentSession.isActive = false;
        this.currentSession.lastActivity = new Date().toISOString();
        
        await this.saveEncryptedData(`session_${this.currentSession.id}`, this.currentSession);
        
        // تسجيل النشاط
        this.logActivity('user_logout', 'تسجيل خروج', this.currentUser?.id || '');
      }

      // إزالة البيانات الحالية
      this.currentUser = null;
      this.currentCompany = null;
      this.currentSession = null;

      return true;
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
      return false;
    }
  }

  /**
   * الحصول على البيانات المخصصة للشركة الحالية
   */
  getCompanyData<T>(key: string, defaultValue: T[] = []): T[] {
    if (!this.currentCompany) return defaultValue;
    
    const companyKey = `${this.currentCompany.id}_${key}`;
    return storage.getItem(companyKey, defaultValue);
  }

  /**
   * حفظ البيانات مخصصة للشركة الحالية
   */
  saveCompanyData<T>(key: string, data: T[]): boolean {
    if (!this.currentCompany) return false;
    
    const companyKey = `${this.currentCompany.id}_${key}`;
    return storage.setItem(companyKey, data);
  }

  /**
   * التحقق من الصلاحيات
   */
  hasPermission(permission: string): boolean {
    return this.currentUser?.permissions.includes(permission) || 
           this.currentUser?.role === 'owner';
  }

  /**
   * الحصول على المستخدم الحالي
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * الحصول على الشركة الحالية
   */
  getCurrentCompany(): Company | null {
    return this.currentCompany;
  }

  /**
   * الحصول على الجلسة الحالية
   */
  getCurrentSession(): UserSession | null {
    return this.currentSession;
  }

  // المنطق المساعد
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async saveEncryptedData(key: string, data: any): Promise<void> {
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), this.encryptionKey).toString();
    storage.setItem(key, encrypted);
  }

  private async getEncryptedData(key: string): Promise<any> {
    try {
      const encrypted = storage.getItem(key, null);
      if (!encrypted) return null;
      
      const decrypted = CryptoJS.AES.decrypt(encrypted, this.encryptionKey).toString(CryptoJS.enc.Utf8);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('خطأ في فك التشفير:', error);
      return null;
    }
  }

  private addToIndex(type: 'companies' | 'users', item: Company | User): void {
    const index = storage.getItem(`${type}_index`, []);
    index.push({ id: item.id, name: type === 'companies' ? (item as Company).name : (item as User).fullName });
    storage.setItem(`${type}_index`, index);
  }

  private getAllUsers(): User[] {
    const index = storage.getItem('users_index', []);
    return index.map((item: any) => {
      const userData = storage.getItem(`user_${item.id}`, null);
      if (userData) {
        try {
          const decrypted = CryptoJS.AES.decrypt(userData, this.encryptionKey).toString(CryptoJS.enc.Utf8);
          return JSON.parse(decrypted);
        } catch {
          return null;
        }
      }
      return null;
    }).filter(Boolean);
  }

  private getCompanyUsers(companyId: string): User[] {
    return this.getAllUsers().filter(u => u.companyId === companyId);
  }

  private async createUserSession(user: User, deviceInfo: any): Promise<UserSession> {
    const sessionId = this.generateId('SESSION');
    const session: UserSession = {
      id: sessionId,
      userId: user.id,
      companyId: user.companyId,
      deviceInfo,
      loginTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      isActive: true,
      permissions: user.permissions
    };

    await this.saveEncryptedData(`session_${sessionId}`, session);
    return session;
  }

  private getActiveUserSessions(companyId: string): UserSession[] {
    // منطق الحصول على الجلسات النشطة
    return [];
  }

  private getDeviceInfo(): any {
    return {
      browser: navigator.userAgent.split(')')[0].split('(')[1] || 'Unknown',
      os: navigator.platform || 'Unknown',
      ip: 'Unknown', // يتطلب خدمة خارجية
      deviceId: this.generateId('DEVICE')
    };
  }

  private hashPassword(password: string): string {
    return CryptoJS.SHA256(password + this.encryptionKey).toString();
  }

  private getFullPermissions(): string[] {
    return [
      'manage_users', 'manage_company', 'manage_settings',
      'view_sales', 'create_sales', 'edit_sales', 'delete_sales',
      'view_purchases', 'create_purchases', 'edit_purchases', 'delete_purchases',
      'view_inventory', 'manage_inventory',
      'view_cash', 'manage_cash',
      'view_reports', 'export_reports',
      'view_customers', 'manage_customers',
      'view_suppliers', 'manage_suppliers'
    ];
  }

  private getRolePermissions(role: string): string[] {
    const permissions = {
      owner: this.getFullPermissions(),
      admin: this.getFullPermissions().filter(p => p !== 'manage_company'),
      manager: ['view_sales', 'create_sales', 'edit_sales', 'view_inventory', 'view_reports', 'view_customers', 'manage_customers'],
      employee: ['view_sales', 'create_sales', 'view_inventory', 'view_customers'],
      viewer: ['view_sales', 'view_inventory', 'view_reports', 'view_customers']
    };
    
    return permissions[role as keyof typeof permissions] || permissions.viewer;
  }

  private notifyUserLogin(user: User, session: UserSession): void {
    // منطق إرسال إشعارات
    console.log(`تم تسجيل دخول المستخدم: ${user.fullName}`);
  }

  private logActivity(type: string, description: string, userId: string): void {
    const activity = {
      id: this.generateId('ACTIVITY'),
      type,
      description,
      userId,
      companyId: this.currentCompany?.id,
      timestamp: new Date().toISOString(),
      ip: 'Unknown',
      userAgent: navigator.userAgent
    };

    const activities = storage.getItem('activities', []);
    activities.unshift(activity);
    
    // الاحتفاظ بآخر 1000 نشاط فقط
    if (activities.length > 1000) {
      activities.splice(1000);
    }
    
    storage.setItem('activities', activities);
  }
}

// إنشاء instance عامة
export const multiUserManager = MultiUserManager.getInstance();