/**
 * نظام النسخ الاحتياطي والاستعادة الشامل
 */

export interface BackupConfig {
  includeData: boolean;
  includeSettings: boolean;
  includeIntegrations: boolean;
  includePlugins: boolean;
  includeAnalytics: boolean;
  compression: 'none' | 'basic' | 'high';
  encryption: boolean;
  scheduleEnabled: boolean;
  scheduleInterval: number; // minutes
}

export interface BackupMetadata {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  version: string;
  size: number; // bytes
  type: 'manual' | 'scheduled' | 'auto';
  config: BackupConfig;
  checksum: string;
}

export interface BackupData {
  metadata: BackupMetadata;
  data: {
    products?: any[];
    salesInvoices?: any[];
    purchaseInvoices?: any[];
    customers?: any[];
    suppliers?: any[];
    employees?: any[];
    cashFlowTransactions?: any[];
    inventoryMovements?: any[];
    settings?: any;
    plugins?: any[];
    analytics?: any;
    healthChecks?: any;
  };
}

export interface RestoreResult {
  success: boolean;
  message: string;
  restored: string[];
  skipped: string[];
  errors: string[];
}

class BackupRestoreSystem {
  private config: BackupConfig = {
    includeData: true,
    includeSettings: true,
    includeIntegrations: true,
    includePlugins: true,
    includeAnalytics: false,
    compression: 'basic',
    encryption: false,
    scheduleEnabled: true,
    scheduleInterval: 5 // كل 5 دقائق
  };

  private scheduleTimer?: NodeJS.Timeout;
  private backupHistory: BackupMetadata[] = [];

  constructor() {
    this.loadConfig();
    this.loadBackupHistory();

    if (this.config.scheduleEnabled) {
      this.startScheduledBackup();
    }
  }

  // تحميل الإعدادات
  private loadConfig(): void {
    try {
      const saved = localStorage.getItem('backup_config');
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Failed to load backup config:', error);
    }
  }

  // حفظ الإعدادات
  private saveConfig(): void {
    try {
      localStorage.setItem('backup_config', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save backup config:', error);
    }
  }

  // تحميل تاريخ النسخ الاحتياطية
  private loadBackupHistory(): void {
    try {
      const saved = localStorage.getItem('backup_history');
      if (saved) {
        this.backupHistory = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load backup history:', error);
    }
  }

  // حفظ تاريخ النسخ الاحتياطية
  private saveBackupHistory(): void {
    try {
      localStorage.setItem('backup_history', JSON.stringify(this.backupHistory));
    } catch (error) {
      console.error('Failed to save backup history:', error);
    }
  }

  // تحديث الإعدادات
  updateConfig(newConfig: Partial<BackupConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();

    // إعادة جدولة النسخ الاحتياطي إذا لزم الأمر
    if (this.config.scheduleEnabled) {
      this.startScheduledBackup();
    } else {
      this.stopScheduledBackup();
    }

    console.log('Backup config updated:', this.config);
  }

  // بدء النسخ الاحتياطي المجدول
  startScheduledBackup(): void {
    this.stopScheduledBackup();

    if (!this.config.scheduleEnabled) {
      return;
    }

    const interval = this.config.scheduleInterval * 60 * 1000; // تحويل إلى milliseconds
    
    this.scheduleTimer = setInterval(() => {
      this.createBackup('scheduled', `نسخة احتياطية مجدولة - ${new Date().toLocaleString('ar')}`);
    }, interval);

    console.log(`Scheduled backup started with ${this.config.scheduleInterval} minute interval`);
  }

  // إيقاف النسخ الاحتياطي المجدول
  stopScheduledBackup(): void {
    if (this.scheduleTimer) {
      clearInterval(this.scheduleTimer);
      this.scheduleTimer = undefined;
      console.log('Scheduled backup stopped');
    }
  }

  // إنشاء نسخة احتياطية
  async createBackup(type: 'manual' | 'scheduled' | 'auto' = 'manual', name?: string, description?: string): Promise<BackupData | null> {
    try {
      console.log('Creating backup...');
      
      const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const backupName = name || `نسخة احتياطية - ${new Date().toLocaleString('ar')}`;

      // جمع البيانات حسب الإعدادات
      const data: BackupData['data'] = {};

      if (this.config.includeData) {
        data.products = this.getStorageData('products');
        data.salesInvoices = this.getStorageData('salesInvoices');
        data.purchaseInvoices = this.getStorageData('purchaseInvoices');
        data.customers = this.getStorageData('customers');
        data.suppliers = this.getStorageData('suppliers');
        data.employees = this.getStorageData('employees');
        data.cashFlowTransactions = this.getStorageData('cashFlowTransactions');
        data.inventoryMovements = this.getStorageData('inventoryMovements');
      }

      if (this.config.includeSettings) {
        data.settings = {
          appSettings: this.getStorageData('appSettings'),
          userPreferences: this.getStorageData('userPreferences'),
          systemConfig: this.getStorageData('systemConfig')
        };
      }

      if (this.config.includePlugins) {
        const { pluginSystem } = await import('@/core/PluginSystem');
        data.plugins = pluginSystem.getAllPlugins().map(plugin => ({
          metadata: plugin.metadata,
          config: plugin.config
        }));
      }

      if (this.config.includeAnalytics) {
        const { usageAnalytics } = await import('@/core/UsageAnalytics');
        data.analytics = usageAnalytics.exportData();
      }

      if (this.config.includeIntegrations) {
        data.healthChecks = this.getStorageData('health_checks');
      }

      // إنشاء البيانات الوصفية
      const dataString = JSON.stringify(data);
      const size = new Blob([dataString]).size;
      const checksum = await this.calculateChecksum(dataString);

      const metadata: BackupMetadata = {
        id: backupId,
        name: backupName,
        description,
        createdAt: new Date().toISOString(),
        version: '1.0.0',
        size,
        type,
        config: { ...this.config },
        checksum
      };

      const backup: BackupData = {
        metadata,
        data
      };

      // حفظ النسخة الاحتياطية
      await this.saveBackup(backup);

      // إضافة إلى التاريخ
      this.backupHistory.push(metadata);
      this.saveBackupHistory();

      // تنظيف النسخ الاحتياطية القديمة
      this.cleanupOldBackups();

      console.log('Backup created successfully:', backupId);
      return backup;

    } catch (error) {
      console.error('Failed to create backup:', error);
      return null;
    }
  }

  // حفظ النسخة الاحتياطية
  private async saveBackup(backup: BackupData): Promise<void> {
    try {
      // Prepare raw JSON for disk save
      const rawJson = JSON.stringify(backup);

      // Validate integrity before any save (JSON + checksum)
      const parsed = JSON.parse(rawJson) as BackupData;
      const dataStringForCheck = JSON.stringify(parsed.data);
      const checksumForCheck = await this.calculateChecksum(dataStringForCheck);
      if (checksumForCheck !== parsed.metadata.checksum) {
        throw new Error('Checksum mismatch - backup not saved');
      }

      // Optionally compress/encrypt for localStorage persistence
      let storageString = rawJson;
      if (this.config.compression !== 'none') {
        storageString = await this.compressData(storageString);
      }
      if (this.config.encryption) {
        storageString = await this.encryptData(storageString);
      }

      // Save to localStorage
      localStorage.setItem(`backup_${backup.metadata.id}`, storageString);

      // Also try to persist to disk via Electron (if available)
      try {
        // @ts-ignore - window type provided by electron.d.ts
        const api = typeof window !== 'undefined' ? (window as any).electronAPI : undefined;
        if (api && typeof api.saveBackup === 'function') {
          await api.saveBackup(backup.metadata.id, JSON.stringify(backup, null, 2));
        }
      } catch (diskErr) {
        console.warn('Disk backup save failed (non-fatal):', diskErr);
      }

    } catch (error) {
      console.error('Failed to save backup:', error);
      throw error;
    }
  }

  // استعادة نسخة احتياطية
  async restoreBackup(backupId: string, options?: {
    includeData?: boolean;
    includeSettings?: boolean;
    includePlugins?: boolean;
    overwrite?: boolean;
  }): Promise<RestoreResult> {
    try {
      console.log('Restoring backup:', backupId);

      // تحميل النسخة الاحتياطية
      const backup = await this.loadBackup(backupId);
      if (!backup) {
        return {
          success: false,
          message: 'لم يتم العثور على النسخة الاحتياطية',
          restored: [],
          skipped: [],
          errors: ['backup_not_found']
        };
      }

      // التحقق من صحة البيانات
      const isValid = await this.validateBackup(backup);
      if (!isValid) {
        return {
          success: false,
          message: 'النسخة الاحتياطية تالفة أو غير صحيحة',
          restored: [],
          skipped: [],
          errors: ['invalid_backup']
        };
      }

      const result: RestoreResult = {
        success: true,
        message: 'تم الاستعادة بنجاح',
        restored: [],
        skipped: [],
        errors: []
      };

      const opts = {
        includeData: true,
        includeSettings: true,
        includePlugins: true,
        overwrite: false,
        ...options
      };

      // استعادة البيانات
      if (opts.includeData && backup.data.products) {
        await this.restoreData('products', backup.data.products, opts.overwrite);
        result.restored.push('products');
      }

      if (opts.includeData && backup.data.salesInvoices) {
        await this.restoreData('salesInvoices', backup.data.salesInvoices, opts.overwrite);
        result.restored.push('salesInvoices');
      }

      if (opts.includeData && backup.data.purchaseInvoices) {
        await this.restoreData('purchaseInvoices', backup.data.purchaseInvoices, opts.overwrite);
        result.restored.push('purchaseInvoices');
      }

      if (opts.includeData && backup.data.customers) {
        await this.restoreData('customers', backup.data.customers, opts.overwrite);
        result.restored.push('customers');
      }

      if (opts.includeData && backup.data.suppliers) {
        await this.restoreData('suppliers', backup.data.suppliers, opts.overwrite);
        result.restored.push('suppliers');
      }

      if (opts.includeData && backup.data.employees) {
        await this.restoreData('employees', backup.data.employees, opts.overwrite);
        result.restored.push('employees');
      }

      if (opts.includeData && backup.data.cashFlowTransactions) {
        await this.restoreData('cashFlowTransactions', backup.data.cashFlowTransactions, opts.overwrite);
        result.restored.push('cashFlowTransactions');
      }

      if (opts.includeData && backup.data.inventoryMovements) {
        await this.restoreData('inventoryMovements', backup.data.inventoryMovements, opts.overwrite);
        result.restored.push('inventoryMovements');
      }

      // استعادة الإعدادات
      if (opts.includeSettings && backup.data.settings) {
        if (backup.data.settings.appSettings) {
          await this.restoreData('appSettings', backup.data.settings.appSettings, opts.overwrite);
          result.restored.push('appSettings');
        }
        if (backup.data.settings.userPreferences) {
          await this.restoreData('userPreferences', backup.data.settings.userPreferences, opts.overwrite);
          result.restored.push('userPreferences');
        }
        if (backup.data.settings.systemConfig) {
          await this.restoreData('systemConfig', backup.data.settings.systemConfig, opts.overwrite);
          result.restored.push('systemConfig');
        }
      }

      // استعادة الـ plugins
      if (opts.includePlugins && backup.data.plugins) {
        await this.restorePlugins(backup.data.plugins);
        result.restored.push('plugins');
      }

      console.log('Backup restored successfully:', result);
      return result;

    } catch (error) {
      console.error('Failed to restore backup:', error);
      return {
        success: false,
        message: `فشل في الاستعادة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`,
        restored: [],
        skipped: [],
        errors: ['restore_failed']
      };
    }
  }

  // تحميل نسخة احتياطية
  private async loadBackup(backupId: string): Promise<BackupData | null> {
    try {
      let backupString = localStorage.getItem(`backup_${backupId}`);
      if (!backupString) {
        return null;
      }

      // فك التشفير إذا لزم الأمر
      if (this.config.encryption) {
        backupString = await this.decryptData(backupString);
      }

      // إلغاء ضغط البيانات
      if (this.config.compression !== 'none') {
        backupString = await this.decompressData(backupString);
      }

      return JSON.parse(backupString);
    } catch (error) {
      console.error('Failed to load backup:', error);
      return null;
    }
  }

  // التحقق من صحة النسخة الاحتياطية
  private async validateBackup(backup: BackupData): Promise<boolean> {
    try {
      // التحقق من البنية الأساسية
      if (!backup.metadata || !backup.data) {
        return false;
      }

      // التحقق من الـ checksum
      const dataString = JSON.stringify(backup.data);
      const currentChecksum = await this.calculateChecksum(dataString);
      
      return currentChecksum === backup.metadata.checksum;
    } catch (error) {
      console.error('Backup validation failed:', error);
      return false;
    }
  }

  // استعادة البيانات
  private async restoreData(key: string, data: any, overwrite: boolean): Promise<void> {
    try {
      if (!overwrite) {
        const existing = localStorage.getItem(key);
        if (existing) {
          console.log(`Skipping ${key} - already exists and overwrite is false`);
          return;
        }
      }

      localStorage.setItem(key, JSON.stringify(data));
      console.log(`Restored ${key}`);
    } catch (error) {
      console.error(`Failed to restore ${key}:`, error);
      throw error;
    }
  }

  // استعادة الـ plugins
  private async restorePlugins(pluginsData: any[]): Promise<void> {
    try {
      const { pluginSystem } = await import('@/core/PluginSystem');
      
      for (const pluginData of pluginsData) {
        if (pluginData.config) {
          pluginSystem.updatePluginConfig(pluginData.metadata.name, pluginData.config);
        }
      }

      console.log('Plugins restored');
    } catch (error) {
      console.error('Failed to restore plugins:', error);
      throw error;
    }
  }

  // الحصول على البيانات من التخزين
  private getStorageData(key: string): any {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Failed to get storage data for ${key}:`, error);
      return null;
    }
  }

  // حساب checksum
  private async calculateChecksum(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // ضغط البيانات - دعم Unicode/العربية
  private async compressData(data: string): Promise<string> {
    try {
      // تحويل إلى Base64 مع دعم Unicode
      const encoded = encodeURIComponent(data);
      const compressed = btoa(encoded);
      return compressed;
    } catch (error) {
      console.warn('Compression failed, returning original data:', error);
      return data;
    }
  }

  // إلغاء ضغط البيانات
  private async decompressData(data: string): Promise<string> {
    try {
      const decoded = atob(data);
      return decodeURIComponent(decoded);
    } catch (error) {
      console.warn('Decompression failed, returning original data:', error);
      return data;
    }
  }

  // تشفير البيانات - دعم Unicode/العربية
  private async encryptData(data: string): Promise<string> {
    try {
      // تشفير مبسط مع دعم Unicode
      const encoded = encodeURIComponent(data);
      const encrypted = btoa(encoded);
      return encrypted;
    } catch (error) {
      console.warn('Encryption failed, returning original data:', error);
      return data;
    }
  }

  // فك تشفير البيانات
  private async decryptData(data: string): Promise<string> {
    try {
      const decoded = atob(data);
      return decodeURIComponent(decoded);
    } catch (error) {
      console.warn('Decryption failed, returning original data:', error);
      return data;
    }
  }

  // تنظيف النسخ الاحتياطية القديمة
  private cleanupOldBackups(): void {
    const maxBackups = 20; // الاحتفاظ بأحدث 20 نسخة
    
    if (this.backupHistory.length > maxBackups) {
      // ترتيب حسب التاريخ
      this.backupHistory.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // حذف النسخ الزائدة
      const toDelete = this.backupHistory.slice(maxBackups);
      
      toDelete.forEach(backup => {
        localStorage.removeItem(`backup_${backup.id}`);
      });
      
      this.backupHistory = this.backupHistory.slice(0, maxBackups);
      this.saveBackupHistory();
      
      console.log(`Cleaned up ${toDelete.length} old backups`);
    }
  }

  // حذف نسخة احتياطية
  deleteBackup(backupId: string): boolean {
    try {
      localStorage.removeItem(`backup_${backupId}`);
      this.backupHistory = this.backupHistory.filter(b => b.id !== backupId);
      this.saveBackupHistory();
      
      console.log('Backup deleted:', backupId);
      return true;
    } catch (error) {
      console.error('Failed to delete backup:', error);
      return false;
    }
  }

  // الحصول على قائمة النسخ الاحتياطية
  getBackupList(): BackupMetadata[] {
    return [...this.backupHistory].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // الحصول على معلومات نسخة احتياطية
  getBackupInfo(backupId: string): BackupMetadata | null {
    return this.backupHistory.find(b => b.id === backupId) || null;
  }

  // تصدير نسخة احتياطية
  async exportBackup(backupId: string): Promise<string | null> {
    try {
      const backup = await this.loadBackup(backupId);
      if (!backup) {
        return null;
      }

      const blob = new Blob([JSON.stringify(backup, null, 2)], { 
        type: 'application/json' 
      });
      
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Failed to export backup:', error);
      return null;
    }
  }

  // استيراد نسخة احتياطية
  async importBackup(file: File): Promise<BackupData | null> {
    try {
      const text = await file.text();
      const backup: BackupData = JSON.parse(text);
      
      // التحقق من صحة البيانات
      const isValid = await this.validateBackup(backup);
      if (!isValid) {
        throw new Error('Invalid backup file');
      }

      // إنشاء ID جديد للنسخة المستوردة
      backup.metadata.id = `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      backup.metadata.type = 'manual';
      
      // حفظ النسخة المستوردة
      await this.saveBackup(backup);
      this.backupHistory.push(backup.metadata);
      this.saveBackupHistory();

      console.log('Backup imported successfully:', backup.metadata.id);
      return backup;
    } catch (error) {
      console.error('Failed to import backup:', error);
      return null;
    }
  }

  // الحصول على الإعدادات الحالية
  getConfig(): BackupConfig {
    return { ...this.config };
  }

  // إحصائيات النسخ الاحتياطية
  getBackupStats(): any {
    const totalSize = this.backupHistory.reduce((sum, backup) => sum + backup.size, 0);
    const typeCount = this.backupHistory.reduce((acc, backup) => {
      acc[backup.type] = (acc[backup.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: this.backupHistory.length,
      totalSize,
      averageSize: this.backupHistory.length > 0 ? totalSize / this.backupHistory.length : 0,
      byType: typeCount,
      latest: this.backupHistory[0]?.createdAt,
      oldest: this.backupHistory[this.backupHistory.length - 1]?.createdAt
    };
  }
}

// إنشاء instance وحيد
export const backupRestoreSystem = new BackupRestoreSystem();