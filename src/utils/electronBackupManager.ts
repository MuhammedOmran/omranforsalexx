import { saveUserData, getUserData, exportUserData, importUserData } from './userDataManager';
import { toast } from '@/hooks/use-toast';

/**
 * مدير النسخ الاحتياطي الخاص ببيئة Electron
 */
export class ElectronBackupManager {
  private static isElectron(): boolean {
    return typeof window !== 'undefined' && !!window.electronAPI;
  }

  private static async getMachineId(): Promise<string> {
    if (this.isElectron() && window.electronAPI?.getMachineId) {
      try {
        return await window.electronAPI.getMachineId();
      } catch (error) {
        console.warn('Failed to get machine ID:', error);
      }
    }
    return 'web-browser';
  }

  private static async getDefaultBackupDir(): Promise<string> {
    if (this.isElectron() && window.electronAPI?.getDefaultBackupDir) {
      try {
        return await window.electronAPI.getDefaultBackupDir();
      } catch (error) {
        console.warn('Failed to get backup directory:', error);
      }
    }
    return '';
  }

  /**
   * إنشاء نسخة احتياطية كاملة
   */
  static async createFullBackup(): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      const userData = exportUserData();
      const machineId = await this.getMachineId();
      const timestamp = new Date().toISOString();
      
      const backupData = {
        metadata: {
          version: '1.0',
          created: timestamp,
          machineId,
          type: 'full',
          checksum: ''
        },
        data: userData
      };

      // حساب checksum للبيانات
      const dataString = JSON.stringify(backupData.data);
      const encoder = new TextEncoder();
      const data = encoder.encode(dataString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      backupData.metadata.checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const backupId = `omran-backup-${timestamp.replace(/[:.]/g, '-')}`;
      const json = JSON.stringify(backupData, null, 2);

      if (this.isElectron() && window.electronAPI?.saveBackup) {
        // حفظ في بيئة Electron
        const result = await window.electronAPI.saveBackup(backupId, json);
        
        if (result.success) {
          toast({
            title: "تم إنشاء النسخة الاحتياطية",
            description: `تم حفظ النسخة في: ${result.path}`,
          });
        } else {
          toast({
            title: "خطأ في النسخة الاحتياطية",
            description: result.error || "فشل في إنشاء النسخة الاحتياطية",
            variant: "destructive"
          });
        }
        
        return result;
      } else {
        // حفظ في المتصفح (تحميل ملف)
        this.downloadBackupFile(backupId + '.json', json);
        
        toast({
          title: "تم إنشاء النسخة الاحتياطية",
          description: "تم تحميل الملف إلى مجلد التحميلات",
        });
        
        return { success: true };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
      
      toast({
        title: "خطأ في النسخة الاحتياطية",
        description: errorMessage,
        variant: "destructive"
      });
      
      return { success: false, error: errorMessage };
    }
  }

  /**
   * تحميل ملف النسخة الاحتياطية في المتصفح
   */
  private static downloadBackupFile(filename: string, content: string): void {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * استيراد نسخة احتياطية من ملف
   */
  static async importBackup(file: File): Promise<{ success: boolean; error?: string }> {
    try {
      const content = await file.text();
      const backupData = JSON.parse(content);

      // التحقق من صحة الهيكل
      if (!backupData.metadata || !backupData.data) {
        throw new Error('هيكل الملف غير صحيح');
      }

      // التحقق من checksum
      if (backupData.metadata.checksum) {
        const dataString = JSON.stringify(backupData.data);
        const encoder = new TextEncoder();
        const data = encoder.encode(dataString);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const calculatedChecksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        if (calculatedChecksum !== backupData.metadata.checksum) {
          throw new Error('الملف تالف أو تم تعديله');
        }
      }

      // استيراد البيانات
      importUserData(backupData.data);

      toast({
        title: "تم استيراد النسخة الاحتياطية",
        description: "تم استيراد البيانات بنجاح",
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطأ في قراءة الملف';
      
      toast({
        title: "خطأ في الاستيراد",
        description: errorMessage,
        variant: "destructive"
      });
      
      return { success: false, error: errorMessage };
    }
  }

  /**
   * نسخة احتياطية تلقائية
   */
  static async autoBackup(): Promise<void> {
    try {
      // تنفيذ النسخ الاحتياطي فقط في بيئة Electron
      if (!this.isElectron()) {
        return;
      }

      const lastAutoBackup = localStorage.getItem('last_auto_backup');
      const now = Date.now();
      
      // نسخة احتياطية كل ساعة
      if (!lastAutoBackup || (now - parseInt(lastAutoBackup)) > 60 * 60 * 1000) {
        await this.createFullBackup();
        localStorage.setItem('last_auto_backup', now.toString());
      }
    } catch (error) {
      console.warn('Auto backup failed:', error);
    }
  }

  /**
   * تنظيف النسخ الاحتياطية القديمة
   */
  static async cleanupOldBackups(): Promise<void> {
    // TODO: تنفيذ تنظيف النسخ القديمة عبر IPC
    console.log('Cleanup old backups - to be implemented');
  }

  /**
   * الحصول على معلومات النسخ الاحتياطية
   */
  static async getBackupInfo(): Promise<{
    isElectron: boolean;
    machineId: string;
    backupDir: string;
  }> {
    return {
      isElectron: this.isElectron(),
      machineId: await this.getMachineId(),
      backupDir: await this.getDefaultBackupDir()
    };
  }
}

// بدء النسخ الاحتياطي التلقائي
if (typeof window !== 'undefined') {
  // نسخة احتياطية عند بدء التطبيق
  setTimeout(() => {
    ElectronBackupManager.autoBackup();
  }, 5000);

  // نسخة احتياطية كل ساعة
  setInterval(() => {
    ElectronBackupManager.autoBackup();
  }, 60 * 60 * 1000);

  // نسخة احتياطية عند إغلاق التطبيق
  window.addEventListener('beforeunload', () => {
    ElectronBackupManager.autoBackup();
  });
}