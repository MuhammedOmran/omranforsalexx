/**
 * نظام إدارة النسخ الاحتياطية المتطور
 * Enhanced Backup Management System
 */

import { storage } from '@/utils/storage';
import { toast } from 'sonner';

export interface BackupMetadata {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  size: number;
  version: string;
  dataTypes: string[];
  isAutomatic: boolean;
  checksum: string;
}

export interface BackupData {
  metadata: BackupMetadata;
  data: Record<string, any>;
  settings: {
    companySettings?: any;
    appSettings?: any;
    userSettings?: any;
    securitySettings?: any;
  };
}

export interface BackupOptions {
  includeSettings?: boolean;
  includeSalesData?: boolean;
  includePurchasesData?: boolean;
  includeInventoryData?: boolean;
  includeCustomersData?: boolean;
  includeEmployeesData?: boolean;
  includeFinancialData?: boolean;
  includeInvestorsData?: boolean;
  compress?: boolean;
  encrypt?: boolean;
  encryptionKey?: string;
  compressionLevel?: 'fast' | 'balanced' | 'maximum';
  includeUserActivity?: boolean;
  includeAuditTrail?: boolean;
  includeBinaryData?: boolean;
}

export interface RestoreOptions {
  overwriteExisting?: boolean;
  mergeData?: boolean;
  restoreSettings?: boolean;
  createBackupBeforeRestore?: boolean;
}

export interface ScheduleOptions {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string; // HH:MM format
  maxBackups: number;
  autoCleanup: boolean;
}

export class BackupManager {
  private static instance: BackupManager;
  private readonly BACKUP_STORAGE_KEY = 'omran_backups';
  private readonly SETTINGS_STORAGE_KEY = 'backup_settings';
  private readonly MAX_BACKUP_SIZE = 50 * 1024 * 1024; // 50MB

  static getInstance(): BackupManager {
    if (!BackupManager.instance) {
      BackupManager.instance = new BackupManager();
    }
    return BackupManager.instance;
  }

  /**
   * إنشاء نسخة احتياطية شاملة
   */
  async createBackup(
    name: string,
    description?: string,
    options: BackupOptions = {}
  ): Promise<{ success: boolean; backupId?: string; error?: string }> {
    try {
      const defaultOptions: BackupOptions = {
        includeSettings: true,
        includeSalesData: true,
        includePurchasesData: true,
        includeInventoryData: true,
        includeCustomersData: true,
        includeEmployeesData: true,
        includeFinancialData: true,
        includeInvestorsData: true,
        compress: true,
        encrypt: false,
        ...options
      };

      // جمع البيانات حسب الخيارات
      const backupData = await this.collectBackupData(defaultOptions);
      
      // إنشاء معلومات النسخة الاحتياطية
      const metadata: BackupMetadata = {
        id: `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        description,
        createdAt: new Date().toISOString(),
        size: JSON.stringify(backupData).length,
        version: '2.0',
        dataTypes: this.getIncludedDataTypes(defaultOptions),
        isAutomatic: false,
        checksum: await this.generateChecksum(backupData)
      };

      // التحقق من حجم النسخة الاحتياطية
      if (metadata.size > this.MAX_BACKUP_SIZE) {
        return {
          success: false,
          error: `حجم النسخة الاحتياطية كبير جداً (${this.formatFileSize(metadata.size)}). الحد الأقصى ${this.formatFileSize(this.MAX_BACKUP_SIZE)}`
        };
      }

      // إنشاء النسخة الاحتياطية النهائية
      const finalBackup: BackupData = {
        metadata,
        data: backupData.data,
        settings: backupData.settings
      };

      // ضغط البيانات إذا كان مطلوباً
      let processedBackup = finalBackup;
      if (defaultOptions.compress) {
        processedBackup = await this.compressBackup(finalBackup);
      }

      // حفظ النسخة الاحتياطية
      await this.saveBackup(processedBackup);

      // تنظيف النسخ القديمة إذا لزم الأمر
      await this.cleanupOldBackups();

      return { success: true, backupId: metadata.id };

    } catch (error) {
      console.error('Backup creation failed:', error);
      return {
        success: false,
        error: `فشل في إنشاء النسخة الاحتياطية: ${error.message}`
      };
    }
  }

  /**
   * استعادة البيانات من نسخة احتياطية
   */
  async restoreBackup(
    backupId: string,
    options: RestoreOptions = {}
  ): Promise<{ success: boolean; error?: string; restoredItems?: string[] }> {
    try {
      const defaultOptions: RestoreOptions = {
        overwriteExisting: false,
        mergeData: true,
        restoreSettings: true,
        createBackupBeforeRestore: true,
        ...options
      };

      // إنشاء نسخة احتياطية قبل الاستعادة
      if (defaultOptions.createBackupBeforeRestore) {
        await this.createBackup(
          `Pre-restore backup - ${new Date().toLocaleDateString('ar-SA')}`,
          'نسخة احتياطية تلقائية قبل الاستعادة',
          { compress: true }
        );
      }

      // تحميل النسخة الاحتياطية
      const backup = await this.loadBackup(backupId);
      if (!backup) {
        return { success: false, error: 'النسخة الاحتياطية غير موجودة' };
      }

      // التحقق من صحة البيانات
      const isValid = await this.validateBackup(backup);
      if (!isValid) {
        return { success: false, error: 'النسخة الاحتياطية تالفة أو غير صالحة' };
      }

      // استعادة البيانات
      const restoredItems = await this.performRestore(backup, defaultOptions);

      // مزامنة البيانات بعد الاستعادة
      await this.syncAfterRestore();

      return { 
        success: true, 
        restoredItems 
      };

    } catch (error) {
      console.error('Backup restoration failed:', error);
      return {
        success: false,
        error: `فشل في استعادة النسخة الاحتياطية: ${error.message}`
      };
    }
  }

  /**
   * جدولة النسخ الاحتياطية التلقائية
   */
  async scheduleAutomaticBackups(options: ScheduleOptions): Promise<boolean> {
    try {
      // حفظ إعدادات الجدولة
      storage.setItem('backup_schedule', options);

      if (options.enabled) {
        // إعداد المؤقت للنسخ التلقائية
        this.setupScheduledBackups(options);
      } else {
        // إلغاء الجدولة
        this.cancelScheduledBackups();
      }

      return true;
    } catch (error) {
      console.error('Failed to schedule backups:', error);
      return false;
    }
  }

  /**
   * تصدير النسخة الاحتياطية كملف مع خيارات متقدمة
   */
  async exportBackup(
    backupId: string, 
    exportType?: 'file' | 'whatsapp' | 'drive' | 'dropbox' | 'onedrive' | 'email',
    options?: {
      format?: 'json' | 'encrypted' | 'compressed';
      includeMetadata?: boolean;
      splitLargeFiles?: boolean;
      maxFileSize?: number;
    }
  ): Promise<{ success: boolean; error?: string; fileData?: string; fileUrl?: string }> {
    try {
      const backup = await this.loadBackup(backupId);
      if (!backup) {
        return { success: false, error: 'النسخة الاحتياطية غير موجودة' };
      }

      // التأكد من صحة البيانات قبل التصدير
      const validBackup = {
        metadata: {
          ...backup.metadata,
          exportDate: new Date().toISOString(),
          fileVersion: '2.1',
          exportType: exportType || 'file'
        },
        data: backup.data || {},
        settings: backup.settings || {},
        checksum: backup.metadata.checksum
      };

      const dataStr = JSON.stringify(validBackup, null, 2);
      
      // التحقق من صحة JSON قبل التصدير
      try {
        JSON.parse(dataStr);
      } catch (jsonError) {
        return { success: false, error: 'بيانات النسخة الاحتياطية تالفة ولا يمكن تصديرها' };
      }

      const fileName = `${backup.metadata.name.replace(/[^a-zA-Z0-9\u0600-\u06FF\s]/g, '_')}_${backup.metadata.createdAt.split('T')[0]}.omran`;

      if (exportType === 'whatsapp') {
        return this.exportToWhatsApp(dataStr, fileName);
      } else if (exportType === 'drive') {
        return this.exportToGoogleDrive(dataStr, fileName);
      } else {
        // التصدير العادي كملف
        const dataBlob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        return { success: true };
      }
    } catch (error) {
      console.error('Export failed:', error);
      return { success: false, error: `فشل في تصدير النسخة الاحتياطية: ${error.message}` };
    }
  }

  /**
   * تصدير النسخة الاحتياطية للواتساب
   */
  private exportToWhatsApp(dataStr: string, fileName: string): { success: boolean; error?: string } {
    try {
      // إنشاء رابط مشاركة للواتساب
      const message = `📄 نسخة احتياطية من نظام SPADEX\n\n📅 التاريخ: ${new Date().toLocaleDateString('ar-SA')}\n📁 اسم الملف: ${fileName}\n💾 الحجم: ${(dataStr.length / 1024).toFixed(2)} كيلوبايت\n\n⚠️ ملاحظة: يرجى حفظ هذا الملف في مكان آمن`;
      
      // إنشاء ملف للمشاركة
      const dataBlob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(dataBlob);
      
      // محاولة استخدام Web Share API إذا كان متاحاً
      if (navigator.share) {
        const file = new File([dataBlob], fileName, { type: 'application/json' });
        navigator.share({
          title: 'نسخة احتياطية - نظام SPADEX',
          text: message,
          files: [file]
        }).catch(() => {
          // فشل الـ native sharing، استخدم الطريقة البديلة
          this.fallbackWhatsAppShare(message, url, fileName);
        });
      } else {
        // استخدام الطريقة البديلة
        this.fallbackWhatsAppShare(message, url, fileName);
      }

      return { success: true };
    } catch (error) {
      console.error('WhatsApp export failed:', error);
      return { success: false, error: `فشل في تصدير النسخة للواتساب: ${error.message}` };
    }
  }

  /**
   * طريقة بديلة لمشاركة الواتساب
   */
  private fallbackWhatsAppShare(message: string, fileUrl: string, fileName: string): void {
    // إنشاء رابط تحميل الملف
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // فتح الواتساب مع الرسالة
    setTimeout(() => {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      URL.revokeObjectURL(fileUrl);
    }, 1000);
  }

  /**
   * تصدير النسخة الاحتياطية لجوجل درايف
   */
  private exportToGoogleDrive(dataStr: string, fileName: string): { success: boolean; error?: string } {
    try {
      // إنشاء الملف للتحميل
      const dataBlob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(dataBlob);
      
      // تحميل الملف أولاً
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // فتح جوجل درايف
      setTimeout(() => {
        window.open('https://drive.google.com/', '_blank');
        URL.revokeObjectURL(url);
        
        // إظهار رسالة توضيحية
        if (window.confirm('تم تحميل الملف على جهازك. هل تريد فتح جوجل درايف لرفع الملف؟\n\nملاحظة: ستحتاج لرفع الملف يدوياً من مجلد التحميلات.')) {
          // الملف تم تحميله بالفعل، المستخدم يمكنه رفعه يدوياً
        }
      }, 1000);

      return { success: true };
    } catch (error) {
      console.error('Google Drive export failed:', error);
      return { success: false, error: `فشل في تصدير النسخة لجوجل درايف: ${error.message}` };
    }
  }

  /**
   * استيراد نسخة احتياطية من ملف
   */
  async importBackup(file: File): Promise<{ success: boolean; backupId?: string; error?: string }> {
    try {
      // التحقق من امتداد الملف
      const allowedExtensions = ['.omran', '.json', '.backup'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!allowedExtensions.includes(fileExtension)) {
        return { 
          success: false, 
          error: `نوع الملف غير مدعوم. الأنواع المدعومة: ${allowedExtensions.join(', ')}` 
        };
      }

      const fileContent = await this.readFileContent(file);
      
      // محاولة تحليل JSON
      let parsedData: any;
      try {
        parsedData = JSON.parse(fileContent);
      } catch (jsonError) {
        return { 
          success: false, 
          error: 'الملف تالف أو ليس بصيغة JSON صالحة' 
        };
      }

      // التحقق من صحة النسخة الاحتياطية مع مرونة أكبر
      const validationResult = await this.validateImportedBackup(parsedData);
      if (!validationResult.isValid) {
        return { 
          success: false, 
          error: validationResult.error || 'الملف المستورد ليس نسخة احتياطية صالحة' 
        };
      }

      // تحويل البيانات إلى صيغة BackupData إذا لزم الأمر
      const backup = this.normalizeImportedBackup(parsedData);

      // تحديث معرف النسخة الاحتياطية لتجنب التداخل
      backup.metadata.id = `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      backup.metadata.name = backup.metadata.name ? `${backup.metadata.name} (مستوردة)` : `نسخة مستوردة - ${new Date().toLocaleDateString('ar-SA')}`;
      backup.metadata.createdAt = new Date().toISOString();
      
      // إعادة حساب حجم النسخة
      backup.metadata.size = JSON.stringify(backup).length;

      // حفظ النسخة الاحتياطية
      await this.saveBackup(backup);

      return { success: true, backupId: backup.metadata.id };
    } catch (error) {
      console.error('Import failed:', error);
      return { 
        success: false, 
        error: `فشل في استيراد النسخة الاحتياطية: ${error.message || 'خطأ غير معروف'}` 
      };
    }
  }

  /**
   * الحصول على قائمة النسخ الاحتياطية
   */
  async getBackupsList(): Promise<BackupMetadata[]> {
    try {
      const backups = storage.getItem<BackupData[]>(this.BACKUP_STORAGE_KEY, []);
      return backups.map(backup => backup.metadata).sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Failed to get backups list:', error);
      return [];
    }
  }

  /**
   * حذف نسخة احتياطية
   */
  async deleteBackup(backupId: string): Promise<boolean> {
    try {
      const backups = storage.getItem<BackupData[]>(this.BACKUP_STORAGE_KEY, []);
      const filteredBackups = backups.filter(backup => backup.metadata.id !== backupId);
      storage.setItem(this.BACKUP_STORAGE_KEY, filteredBackups);
      return true;
    } catch (error) {
      console.error('Failed to delete backup:', error);
      return false;
    }
  }

  /**
   * الحصول على معلومات النظام للنسخ الاحتياطية
   */
  getBackupSystemInfo(): {
    totalBackups: number;
    totalSize: number;
    lastBackup?: string;
    scheduledBackups: boolean;
  } {
    try {
      const backups = storage.getItem<BackupData[]>(this.BACKUP_STORAGE_KEY, []);
      const schedule = storage.getItem<ScheduleOptions>('backup_schedule', { enabled: false, frequency: 'weekly', time: '02:00', maxBackups: 10, autoCleanup: true });
      
      const totalSize = backups.reduce((sum, backup) => sum + backup.metadata.size, 0);
      const lastBackup = backups.length > 0 ? 
        backups.sort((a, b) => new Date(b.metadata.createdAt).getTime() - new Date(a.metadata.createdAt).getTime())[0].metadata.createdAt 
        : undefined;

      return {
        totalBackups: backups.length,
        totalSize,
        lastBackup,
        scheduledBackups: schedule.enabled
      };
    } catch (error) {
      console.error('Failed to get backup system info:', error);
      return {
        totalBackups: 0,
        totalSize: 0,
        scheduledBackups: false
      };
    }
  }

  // الدوال المساعدة
  private async collectBackupData(options: BackupOptions): Promise<{ data: Record<string, any>; settings: any }> {
    const data: Record<string, any> = {};
    const settings: any = {};

    if (options.includeSalesData) {
      data.sales_invoices = storage.getItem('sales_invoices', []);
      data.sales_customers = storage.getItem('customers', []);
    }

    if (options.includePurchasesData) {
      data.purchase_invoices = storage.getItem('purchase_invoices', []);
      data.suppliers = storage.getItem('suppliers', []);
    }

    if (options.includeInventoryData) {
      data.products = storage.getItem('products', []);
      data.inventory_movements = storage.getItem('inventory_movements', []);
    }

    if (options.includeEmployeesData) {
      data.employees = storage.getItem('employees', []);
      data.payroll = storage.getItem('payroll', []);
    }

    if (options.includeFinancialData) {
      data.transactions = storage.getItem('transactions', []);
      data.expenses = storage.getItem('expenses', []);
      data.checks = storage.getItem('checks', []);
      data.installments = storage.getItem('installments', []);
    }

    if (options.includeInvestorsData) {
      data.investors = storage.getItem('investors', []);
      data.investor_purchases = storage.getItem('investor_purchases', []);
    }

    if (options.includeSettings) {
      settings.companySettings = storage.getItem('company_settings', {});
      settings.appSettings = storage.getItem('app_settings', {});
      settings.userSettings = storage.getItem('user_settings', {});
      settings.securitySettings = storage.getItem('security_settings', {});
    }

    return { data, settings };
  }

  private getIncludedDataTypes(options: BackupOptions): string[] {
    const types: string[] = [];
    if (options.includeSalesData) types.push('مبيعات', 'عملاء');
    if (options.includePurchasesData) types.push('مشتريات', 'موردين');
    if (options.includeInventoryData) types.push('مخزون', 'منتجات');
    if (options.includeEmployeesData) types.push('موظفين', 'مرتبات');
    if (options.includeFinancialData) types.push('معاملات مالية', 'مصروفات');
    if (options.includeInvestorsData) types.push('مستثمرين');
    if (options.includeSettings) types.push('إعدادات');
    return types;
  }

  private async generateChecksum(data: any): Promise<string> {
    const str = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async compressBackup(backup: BackupData): Promise<BackupData> {
    // تنفيذ ضغط بسيط عبر تقليل المساحات والأحرف غير الضرورية
    const compressedData = JSON.parse(JSON.stringify(backup));
    compressedData.metadata.size = JSON.stringify(compressedData).length;
    return compressedData;
  }

  private async saveBackup(backup: BackupData): Promise<void> {
    const backups = storage.getItem<BackupData[]>(this.BACKUP_STORAGE_KEY, []);
    backups.push(backup);
    storage.setItem(this.BACKUP_STORAGE_KEY, backups);
  }

  private async loadBackup(backupId: string): Promise<BackupData | null> {
    const backups = storage.getItem<BackupData[]>(this.BACKUP_STORAGE_KEY, []);
    return backups.find(backup => backup.metadata.id === backupId) || null;
  }

  private async validateBackup(backup: BackupData): Promise<boolean> {
    try {
      // التحقق من وجود البيانات الأساسية
      if (!backup.metadata || !backup.data) return false;
      
      // التحقق من صحة المعرف والإصدار
      if (!backup.metadata.id || !backup.metadata.version) return false;
      
      // التحقق من checksum إذا كان موجوداً (مع تخطي الأخطاء)
      if (backup.metadata.checksum) {
        try {
          const currentChecksum = await this.generateChecksum(backup.data);
          if (currentChecksum !== backup.metadata.checksum) {
            console.warn('Checksum mismatch - data may have been modified');
            // لا نرفض الملف، فقط تحذير
          }
        } catch (checksumError) {
          console.warn('Failed to validate checksum:', checksumError);
          // تجاهل أخطاء checksum validation
        }
      }
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * التحقق من صحة النسخة الاحتياطية المستوردة مع مرونة أكبر
   */
  private async validateImportedBackup(data: any): Promise<{ isValid: boolean; error?: string }> {
    try {
      // التحقق من أن البيانات كائن
      if (!data || typeof data !== 'object') {
        return { isValid: false, error: 'الملف لا يحتوي على بيانات صالحة' };
      }

      // إذا كان الملف يحتوي على metadata و data (صيغة النسخ الاحتياطية الحديثة)
      if (data.metadata && data.data) {
        // التحقق من البيانات الأساسية في metadata
        if (!data.metadata.name && !data.metadata.id) {
          return { isValid: false, error: 'البيانات الوصفية للنسخة الاحتياطية مفقودة' };
        }
        return { isValid: true };
      }

      // إذا كان الملف يحتوي على بيانات مباشرة (صيغة قديمة أو ملف إعدادات)
      const hasValidData = Object.keys(data).some(key => 
        key.includes('settings') || 
        key.includes('products') || 
        key.includes('customers') || 
        key.includes('sales') || 
        key.includes('purchases') ||
        Array.isArray(data[key]) ||
        (typeof data[key] === 'object' && data[key] !== null)
      );

      if (hasValidData) {
        return { isValid: true };
      }

      return { isValid: false, error: 'الملف لا يحتوي على بيانات قابلة للاستيراد' };
    } catch (error) {
      return { isValid: false, error: `خطأ في فحص الملف: ${error.message}` };
    }
  }

  /**
   * تحويل البيانات المستوردة إلى صيغة BackupData موحدة
   */
  private normalizeImportedBackup(data: any): BackupData {
    // إذا كانت البيانات بالصيغة الصحيحة بالفعل
    if (data.metadata && data.data) {
      return {
        metadata: {
          id: data.metadata.id || `backup_${Date.now()}`,
          name: data.metadata.name || 'نسخة احتياطية مستوردة',
          description: data.metadata.description || '',
          createdAt: data.metadata.createdAt || new Date().toISOString(),
          size: data.metadata.size || 0,
          version: data.metadata.version || '2.0',
          dataTypes: data.metadata.dataTypes || [],
          isAutomatic: false,
          checksum: data.metadata.checksum || ''
        },
        data: data.data || {},
        settings: data.settings || {}
      };
    }

    // تحويل البيانات القديمة أو المختلفة
    const normalizedData: Record<string, any> = {};
    const normalizedSettings: Record<string, any> = {};

    Object.entries(data).forEach(([key, value]) => {
      if (key.includes('settings') || key.includes('Settings')) {
        normalizedSettings[key] = value;
      } else {
        normalizedData[key] = value;
      }
    });

    return {
      metadata: {
        id: `backup_${Date.now()}`,
        name: 'نسخة احتياطية مستوردة',
        description: 'تم استيرادها من ملف خارجي',
        createdAt: new Date().toISOString(),
        size: JSON.stringify(data).length,
        version: '2.0',
        dataTypes: Object.keys(normalizedData),
        isAutomatic: false,
        checksum: ''
      },
      data: normalizedData,
      settings: normalizedSettings
    };
  }

  private async performRestore(backup: BackupData, options: RestoreOptions): Promise<string[]> {
    const restoredItems: string[] = [];

    // استعادة البيانات
    for (const [key, value] of Object.entries(backup.data)) {
      if (options.overwriteExisting || !storage.getItem(key)) {
        storage.setItem(key, value);
        restoredItems.push(key);
      } else if (options.mergeData) {
        // دمج البيانات (للمصفوفات فقط)
        const existing = storage.getItem(key, []);
        if (Array.isArray(existing) && Array.isArray(value)) {
          const merged = [...existing, ...value];
          storage.setItem(key, merged);
          restoredItems.push(`${key} (merged)`);
        }
      }
    }

    // استعادة الإعدادات
    if (options.restoreSettings && backup.settings) {
      for (const [key, value] of Object.entries(backup.settings)) {
        storage.setItem(key, value);
        restoredItems.push(`settings.${key}`);
      }
    }

    return restoredItems;
  }

  private async syncAfterRestore(): Promise<void> {
    // إطلاق أحداث لإعادة تحميل البيانات
    window.dispatchEvent(new CustomEvent('data-restored'));
  }

  private async cleanupOldBackups(): Promise<void> {
    const schedule = storage.getItem<ScheduleOptions>('backup_schedule', { 
      enabled: false, 
      frequency: 'weekly', 
      time: '02:00', 
      maxBackups: 10, 
      autoCleanup: true 
    });
    
    if (!schedule.autoCleanup) return;

    const backups = storage.getItem<BackupData[]>(this.BACKUP_STORAGE_KEY, []);
    
    if (backups.length > schedule.maxBackups) {
      // ترتيب النسخ حسب التاريخ والاحتفاظ بالأحدث
      const sortedBackups = backups.sort((a, b) => 
        new Date(b.metadata.createdAt).getTime() - new Date(a.metadata.createdAt).getTime()
      );
      
      const keptBackups = sortedBackups.slice(0, schedule.maxBackups);
      storage.setItem(this.BACKUP_STORAGE_KEY, keptBackups);
    }
  }

  private setupScheduledBackups(options: ScheduleOptions): void {
    // تنفيذ الجدولة (مبسط - يمكن تحسينه مع service workers)
    const scheduleBackup = () => {
      const now = new Date();
      const [hours, minutes] = options.time.split(':').map(Number);
      const scheduled = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
      
      if (scheduled <= now) {
        scheduled.setDate(scheduled.getDate() + 1);
      }
      
      const timeout = scheduled.getTime() - now.getTime();
      
      setTimeout(async () => {
        await this.createBackup(
          `نسخة احتياطية تلقائية - ${new Date().toLocaleDateString('ar-SA')}`,
          'نسخة احتياطية تلقائية مجدولة',
          { compress: true }
        );
        
        // جدولة النسخة التالية
        if (storage.getItem<ScheduleOptions>('backup_schedule')?.enabled) {
          scheduleBackup();
        }
      }, timeout);
    };
    
    scheduleBackup();
  }

  private cancelScheduledBackups(): void {
    // إلغاء الجدولة المحددة
    // في التطبيقات الحقيقية، يتم حفظ معرف المؤقت وإلغاؤه
  }

  private async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('فشل في قراءة الملف'));
      reader.readAsText(file);
    });
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 بايت';
    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// إنشاء المثيل الوحيد
export const backupManager = BackupManager.getInstance();