/**
 * نظام النسخ الاحتياطي المتقدم مع تشفير وضغط محسن
 */

import { storage } from '@/utils/storage';
import { toast } from 'sonner';

// خوارزميات التشفير المتقدمة
export class AdvancedEncryption {
  /**
   * تشفير البيانات باستخدام AES-GCM
   */
  static async encryptData(data: string, password: string): Promise<{
    encrypted: string;
    salt: string;
    iv: string;
    authTag: string;
  }> {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      
      // إنشاء salt عشوائي
      const salt = crypto.getRandomValues(new Uint8Array(16));
      
      // إنشاء مفتاح من كلمة المرور
      const passwordBuffer = encoder.encode(password);
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );
      
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
      
      // إنشاء IV عشوائي
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // تشفير البيانات
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
          tagLength: 128
        },
        key,
        dataBuffer
      );
      
      // تحويل إلى Base64
      const encryptedArray = new Uint8Array(encryptedBuffer);
      const encrypted = btoa(String.fromCharCode(...encryptedArray));
      const saltBase64 = btoa(String.fromCharCode(...salt));
      const ivBase64 = btoa(String.fromCharCode(...iv));
      
      return {
        encrypted,
        salt: saltBase64,
        iv: ivBase64,
        authTag: '' // مدمج في AES-GCM
      };
    } catch (error) {
      throw new Error(`فشل التشفير: ${error.message}`);
    }
  }

  /**
   * فك تشفير البيانات
   */
  static async decryptData(
    encryptedData: string,
    password: string,
    salt: string,
    iv: string
  ): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      
      // تحويل من Base64
      const saltBuffer = new Uint8Array(atob(salt).split('').map(c => c.charCodeAt(0)));
      const ivBuffer = new Uint8Array(atob(iv).split('').map(c => c.charCodeAt(0)));
      const encryptedBuffer = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));
      
      // إنشاء مفتاح من كلمة المرور
      const passwordBuffer = encoder.encode(password);
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );
      
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: saltBuffer,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
      
      // فك التشفير
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: ivBuffer,
          tagLength: 128
        },
        key,
        encryptedBuffer
      );
      
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      throw new Error(`فشل فك التشفير: ${error.message}`);
    }
  }

  /**
   * توليد كلمة مرور قوية
   */
  static generateSecurePassword(length: number = 32): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => charset[byte % charset.length]).join('');
  }
}

// ضغط البيانات المتقدم
export class AdvancedCompression {
  /**
   * ضغط البيانات باستخدام خوارزميات متعددة
   */
  static async compressData(
    data: string,
    level: 'fast' | 'balanced' | 'maximum' = 'balanced'
  ): Promise<{ compressed: string; originalSize: number; compressedSize: number; ratio: number }> {
    try {
      const originalSize = new Blob([data]).size;
      
      // استخدام CompressionStream إذا متوفر
      if ('CompressionStream' in window) {
        const compressionFormat = this.getCompressionFormat(level);
        const stream = new CompressionStream(compressionFormat);
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();
        
        writer.write(new TextEncoder().encode(data));
        writer.close();
        
        const chunks = [];
        let result;
        while (!(result = await reader.read()).done) {
          chunks.push(result.value);
        }
        
        const compressedBuffer = new Uint8Array(
          chunks.reduce((acc, chunk) => acc + chunk.length, 0)
        );
        let offset = 0;
        for (const chunk of chunks) {
          compressedBuffer.set(chunk, offset);
          offset += chunk.length;
        }
        
        const compressed = btoa(String.fromCharCode(...compressedBuffer));
        const compressedSize = compressedBuffer.length;
        const ratio = ((originalSize - compressedSize) / originalSize) * 100;
        
        return { compressed, originalSize, compressedSize, ratio };
      } else {
        // استخدام ضغط بديل (LZ-string simulation)
        const compressed = this.simpleCompress(data, level);
        const compressedSize = new Blob([compressed]).size;
        const ratio = ((originalSize - compressedSize) / originalSize) * 100;
        
        return { compressed, originalSize, compressedSize, ratio };
      }
    } catch (error) {
      throw new Error(`فشل الضغط: ${error.message}`);
    }
  }

  /**
   * إلغاء ضغط البيانات
   */
  static async decompressData(compressedData: string, level: 'fast' | 'balanced' | 'maximum' = 'balanced'): Promise<string> {
    try {
      if ('DecompressionStream' in window) {
        const compressionFormat = this.getCompressionFormat(level);
        const stream = new DecompressionStream(compressionFormat);
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();
        
        const compressedBuffer = new Uint8Array(
          atob(compressedData).split('').map(c => c.charCodeAt(0))
        );
        
        writer.write(compressedBuffer);
        writer.close();
        
        const chunks = [];
        let result;
        while (!(result = await reader.read()).done) {
          chunks.push(result.value);
        }
        
        const decompressedBuffer = new Uint8Array(
          chunks.reduce((acc, chunk) => acc + chunk.length, 0)
        );
        let offset = 0;
        for (const chunk of chunks) {
          decompressedBuffer.set(chunk, offset);
          offset += chunk.length;
        }
        
        return new TextDecoder().decode(decompressedBuffer);
      } else {
        return this.simpleDecompress(compressedData);
      }
    } catch (error) {
      throw new Error(`فشل إلغاء الضغط: ${error.message}`);
    }
  }

  private static getCompressionFormat(level: string): 'gzip' | 'deflate' | 'deflate-raw' {
    switch (level) {
      case 'fast': return 'deflate';
      case 'balanced': return 'gzip';
      case 'maximum': return 'deflate-raw';
      default: return 'gzip';
    }
  }

  private static simpleCompress(data: string, level: string): string {
    // ضغط بسيط باستخدام تكرار الأحرف
    let compressed = '';
    let i = 0;
    
    while (i < data.length) {
      const char = data[i];
      let count = 1;
      
      // عد الأحرف المتكررة
      while (i + count < data.length && data[i + count] === char && count < 255) {
        count++;
      }
      
      if (count > 3 || (level === 'maximum' && count > 2)) {
        compressed += `${count}${char}`;
      } else {
        compressed += char.repeat(count);
      }
      
      i += count;
    }
    
    return btoa(compressed);
  }

  private static simpleDecompress(compressedData: string): string {
    try {
      const data = atob(compressedData);
      let decompressed = '';
      let i = 0;
      
      while (i < data.length) {
        const char = data[i];
        
        if (/\d/.test(char) && i + 1 < data.length) {
          const count = parseInt(char);
          const repeatChar = data[i + 1];
          decompressed += repeatChar.repeat(count);
          i += 2;
        } else {
          decompressed += char;
          i++;
        }
      }
      
      return decompressed;
    } catch {
      return atob(compressedData); // fallback
    }
  }
}

// نظام التحقق من سلامة البيانات
export class DataIntegrity {
  /**
   * حساب checksum متقدم للبيانات
   */
  static async calculateAdvancedChecksum(data: any): Promise<{
    sha256: string;
    md5: string;
    crc32: string;
    size: number;
    timestamp: string;
  }> {
    const dataString = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(dataString);
    
    // SHA-256
    const sha256Buffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const sha256 = Array.from(new Uint8Array(sha256Buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // MD5 (simulation - not cryptographically secure)
    const md5 = await this.calculateMD5(dataString);
    
    // CRC32 (simulation)
    const crc32 = this.calculateCRC32(dataString);
    
    return {
      sha256,
      md5,
      crc32,
      size: dataBuffer.length,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * التحقق من سلامة البيانات
   */
  static async verifyDataIntegrity(
    data: any,
    expectedChecksum: {
      sha256: string;
      md5: string;
      crc32: string;
      size: number;
    }
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      const actualChecksum = await this.calculateAdvancedChecksum(data);
      
      if (actualChecksum.sha256 !== expectedChecksum.sha256) {
        errors.push('SHA-256 checksum mismatch');
      }
      
      if (actualChecksum.md5 !== expectedChecksum.md5) {
        errors.push('MD5 checksum mismatch');
      }
      
      if (actualChecksum.crc32 !== expectedChecksum.crc32) {
        errors.push('CRC32 checksum mismatch');
      }
      
      if (actualChecksum.size !== expectedChecksum.size) {
        errors.push('Size mismatch');
      }
      
      return {
        isValid: errors.length === 0,
        errors
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`فشل التحقق: ${error.message}`]
      };
    }
  }

  private static async calculateMD5(data: string): Promise<string> {
    // تنفيذ مبسط لـ MD5 (للعرض فقط)
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-1', dataBuffer); // استخدام SHA-1 كبديل
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .substring(0, 32); // اقتطاع ل 32 حرف مثل MD5
  }

  private static calculateCRC32(data: string): string {
    // تنفيذ مبسط لـ CRC32
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < data.length; i++) {
      crc = crc ^ data.charCodeAt(i);
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (0xEDB88320 & (-(crc & 1)));
      }
    }
    return ((crc ^ 0xFFFFFFFF) >>> 0).toString(16).padStart(8, '0');
  }
}

// نظام تقسيم الملفات الكبيرة
export class FileSplitter {
  /**
   * تقسيم ملف كبير إلى أجزاء صغيرة
   */
  static splitLargeFile(
    data: string,
    maxChunkSize: number = 5 * 1024 * 1024 // 5MB
  ): {
    chunks: string[];
    metadata: {
      totalChunks: number;
      totalSize: number;
      chunkSize: number;
      checksum: string;
    };
  } {
    const chunks: string[] = [];
    const totalSize = data.length;
    const totalChunks = Math.ceil(totalSize / maxChunkSize);
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * maxChunkSize;
      const end = Math.min(start + maxChunkSize, totalSize);
      const chunk = data.substring(start, end);
      chunks.push(btoa(chunk)); // تشفير Base64
    }
    
    // حساب checksum للملف الكامل
    const checksum = this.calculateSimpleChecksum(data);
    
    return {
      chunks,
      metadata: {
        totalChunks,
        totalSize,
        chunkSize: maxChunkSize,
        checksum
      }
    };
  }

  /**
   * دمج الأجزاء المقسمة
   */
  static mergeSplitFile(
    chunks: string[],
    metadata: {
      totalChunks: number;
      totalSize: number;
      checksum: string;
    }
  ): { success: boolean; data?: string; error?: string } {
    try {
      if (chunks.length !== metadata.totalChunks) {
        return { success: false, error: 'عدد الأجزاء غير مطابق' };
      }
      
      let mergedData = '';
      for (const chunk of chunks) {
        mergedData += atob(chunk); // فك تشفير Base64
      }
      
      // التحقق من checksum
      const actualChecksum = this.calculateSimpleChecksum(mergedData);
      if (actualChecksum !== metadata.checksum) {
        return { success: false, error: 'checksum غير مطابق - الملف تالف' };
      }
      
      return { success: true, data: mergedData };
    } catch (error) {
      return { success: false, error: `فشل في دمج الأجزاء: ${error.message}` };
    }
  }

  private static calculateSimpleChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // تحويل إلى 32bit integer
    }
    return Math.abs(hash).toString(16);
  }
}

// واجهات النسخ الاحتياطي المتقدم
export interface BackupConfig {
  id: string;
  name: string;
  companyId: string;
  schedule: 'manual' | 'daily' | 'weekly' | 'monthly';
  time?: string; // HH:MM
  enabled: boolean;
  compression: 'fast' | 'balanced' | 'maximum';
  encryption: boolean;
  password?: string;
  includeSettings: boolean;
  includeTables: string[];
  maxBackups: number;
  autoCleanup: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BackupRecord {
  id: string;
  name: string;
  companyId: string;
  configId?: string;
  type: 'manual' | 'scheduled' | 'auto';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  size: number;
  originalSize: number;
  compressionRatio: number;
  encrypted: boolean;
  tables: string[];
  checksum: any;
  createdAt: string;
  completedAt?: string;
  error?: string;
  metadata: {
    version: string;
    appVersion: string;
    userAgent: string;
    deviceInfo: any;
  };
}

export interface BackupStatus {
  totalBackups: number;
  lastBackup?: string;
  nextScheduledBackup?: string;
  totalSize: number;
  avgCompressionRatio: number;
  isConfigured: boolean;
  autoBackupEnabled: boolean;
  errors: string[];
}

export interface RestoreOptions {
  selectiveRestore: boolean;
  tables: string[];
  preserveExisting: boolean;
  createBackupBeforeRestore: boolean;
  validateData: boolean;
}

/**
 * مدير النسخ الاحتياطي المتقدم
 */
export class AdvancedBackupManager {
  private static instance: AdvancedBackupManager;
  
  static getInstance(): AdvancedBackupManager {
    if (!AdvancedBackupManager.instance) {
      AdvancedBackupManager.instance = new AdvancedBackupManager();
    }
    return AdvancedBackupManager.instance;
  }

  /**
   * إنشاء نسخة احتياطية أولية للشركة
   */
  async createInitialBackup(companyId: string): Promise<{ success: boolean; backup?: BackupRecord; error?: string }> {
    try {
      return await this.createFullBackup(
        companyId,
        undefined,
        'نسخة احتياطية أولية عند إنشاء الشركة'
      );
    } catch (error) {
      console.error('فشل في إنشاء النسخة الاحتياطية الأولية:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * إنشاء نسخة احتياطية كاملة
   */
  async createFullBackup(
    companyId: string,
    configId?: string,
    description?: string
  ): Promise<{ success: boolean; backup?: BackupRecord; error?: string }> {
    try {
      const config = configId ? this.getBackupConfig(companyId, configId) : this.getDefaultConfig(companyId);
      
      const backupId = this.generateId('BACKUP');
      const backup: BackupRecord = {
        id: backupId,
        name: description || `نسخة احتياطية - ${new Date().toLocaleDateString('ar-SA')}`,
        companyId,
        configId,
        type: configId ? 'scheduled' : 'manual',
        status: 'in_progress',
        progress: 0,
        size: 0,
        originalSize: 0,
        compressionRatio: 0,
        encrypted: config?.encryption || false,
        tables: config?.includeTables || ['all'],
        checksum: {},
        createdAt: new Date().toISOString(),
        metadata: {
          version: '2.0',
          appVersion: '1.0.0',
          userAgent: navigator.userAgent,
          deviceInfo: this.getDeviceInfo()
        }
      };

      // حفظ سجل النسخة الاحتياطية
      this.saveBackupRecord(backup);

      // جمع البيانات
      const data = await this.collectCompanyData(companyId, config?.includeTables || ['all']);
      backup.originalSize = JSON.stringify(data).length;
      backup.progress = 25;
      this.updateBackupRecord(backup);

      // ضغط البيانات
      const compressionResult = await AdvancedCompression.compressData(
        JSON.stringify(data),
        config?.compression || 'balanced'
      );
      backup.size = compressionResult.compressedSize;
      backup.compressionRatio = compressionResult.ratio;
      backup.progress = 50;
      this.updateBackupRecord(backup);

      // تشفير البيانات إذا مطلوب
      let finalData = compressionResult.compressed;
      if (config?.encryption && config.password) {
        const encryptionResult = await AdvancedEncryption.encryptData(finalData, config.password);
        finalData = JSON.stringify(encryptionResult);
        backup.encrypted = true;
      }
      backup.progress = 75;
      this.updateBackupRecord(backup);

      // حساب checksum
      backup.checksum = await DataIntegrity.calculateAdvancedChecksum(data);
      backup.progress = 90;
      this.updateBackupRecord(backup);

      // حفظ النسخة الاحتياطية
      storage.setItem(`backup_data_${backupId}`, finalData);
      
      backup.status = 'completed';
      backup.progress = 100;
      backup.completedAt = new Date().toISOString();
      this.updateBackupRecord(backup);

      // تنظيف النسخ القديمة إذا مطلوب
      if (config?.autoCleanup) {
        this.cleanupOldBackups(companyId, config.maxBackups || 10);
      }

      return { success: true, backup };

    } catch (error) {
      console.error('فشل في إنشاء النسخة الاحتياطية:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * استعادة نسخة احتياطية
   */
  async restoreBackup(
    companyId: string,
    backupId: string,
    options: RestoreOptions
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const backup = this.getBackupRecord(companyId, backupId);
      if (!backup) {
        return { success: false, error: 'النسخة الاحتياطية غير موجودة' };
      }

      if (options.createBackupBeforeRestore) {
        await this.createFullBackup(companyId, undefined, 'نسخة احتياطية قبل الاستعادة');
      }

      // جلب بيانات النسخة الاحتياطية
      let backupData = storage.getItem(`backup_data_${backupId}`, null);
      if (!backupData) {
        return { success: false, error: 'بيانات النسخة الاحتياطية غير موجودة' };
      }

      // فك التشفير إذا مطلوب
      if (backup.encrypted) {
        // سيطلب كلمة المرور من المستخدم
        const password = prompt('أدخل كلمة مرور النسخة الاحتياطية:');
        if (!password) {
          return { success: false, error: 'كلمة المرور مطلوبة' };
        }

        try {
          const encryptedData = JSON.parse(backupData);
          backupData = await AdvancedEncryption.decryptData(
            encryptedData.encrypted,
            password,
            encryptedData.salt,
            encryptedData.iv
          );
        } catch {
          return { success: false, error: 'كلمة مرور خاطئة أو بيانات تالفة' };
        }
      }

      // إلغاء ضغط البيانات
      const decompressedData = await AdvancedCompression.decompressData(backupData);
      const data = JSON.parse(decompressedData);

      // التحقق من سلامة البيانات
      if (options.validateData) {
        const verificationResult = await DataIntegrity.verifyDataIntegrity(data, backup.checksum);
        if (!verificationResult.isValid) {
          return { success: false, error: `البيانات تالفة: ${verificationResult.errors.join(', ')}` };
        }
      }

      // استعادة البيانات
      if (options.selectiveRestore) {
        this.restoreSelectedTables(companyId, data, options.tables, options.preserveExisting);
      } else {
        this.restoreAllData(companyId, data, options.preserveExisting);
      }

      return { success: true };

    } catch (error) {
      console.error('فشل في استعادة النسخة الاحتياطية:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * إنشاء تكوين نسخ احتياطي
   */
  async createBackupConfig(config: Partial<BackupConfig>): Promise<{ success: boolean; config?: BackupConfig; error?: string }> {
    try {
      const newConfig: BackupConfig = {
        id: this.generateId('CONFIG'),
        name: config.name || 'تكوين افتراضي',
        companyId: config.companyId!,
        schedule: config.schedule || 'weekly',
        time: config.time || '02:00',
        enabled: config.enabled ?? true,
        compression: config.compression || 'balanced',
        encryption: config.encryption ?? false,
        password: config.password,
        includeSettings: config.includeSettings ?? true,
        includeTables: config.includeTables || ['all'],
        maxBackups: config.maxBackups || 10,
        autoCleanup: config.autoCleanup ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.saveBackupConfig(newConfig);
      return { success: true, config: newConfig };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * تصدير نسخة احتياطية
   */
  async exportBackup(companyId: string, backupId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const backup = this.getBackupRecord(companyId, backupId);
      if (!backup) {
        return { success: false, error: 'النسخة الاحتياطية غير موجودة' };
      }

      const backupData = storage.getItem(`backup_data_${backupId}`, null);
      if (!backupData) {
        return { success: false, error: 'بيانات النسخة الاحتياطية غير موجودة' };
      }

      const exportData = {
        metadata: backup,
        data: backupData
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `omran-backup-${backup.name}-${backup.createdAt.split('T')[0]}.oab`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return { success: true };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * حذف نسخة احتياطية
   */
  async deleteBackup(companyId: string, backupId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // حذف بيانات النسخة الاحتياطية
      storage.removeItem(`backup_data_${backupId}`);
      
      // حذف السجل
      const records = this.getBackupRecords(companyId);
      const filteredRecords = records.filter(r => r.id !== backupId);
      storage.setItem(`company_${companyId}_backups`, filteredRecords);

      return { success: true };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * الحصول على حالة النسخ الاحتياطي
   */
  getBackupStatus(companyId: string): BackupStatus {
    const records = this.getBackupRecords(companyId);
    const configs = this.getBackupConfigs(companyId);
    
    const completedBackups = records.filter(r => r.status === 'completed');
    const totalSize = completedBackups.reduce((sum, r) => sum + r.size, 0);
    const avgCompressionRatio = completedBackups.length > 0 
      ? completedBackups.reduce((sum, r) => sum + r.compressionRatio, 0) / completedBackups.length 
      : 0;

    const lastBackup = completedBackups.length > 0 
      ? completedBackups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt
      : undefined;

    const autoConfig = configs.find(c => c.enabled && c.schedule !== 'manual');
    const nextScheduledBackup = autoConfig ? this.calculateNextBackupTime(autoConfig) : undefined;

    return {
      totalBackups: completedBackups.length,
      lastBackup,
      nextScheduledBackup,
      totalSize,
      avgCompressionRatio,
      isConfigured: configs.length > 0,
      autoBackupEnabled: !!autoConfig,
      errors: records.filter(r => r.status === 'failed').map(r => r.error || 'خطأ غير محدد')
    };
  }

  // طرق مساعدة
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDeviceInfo(): any {
    return {
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      language: navigator.language,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth
      }
    };
  }

  private async collectCompanyData(companyId: string, tables: string[]): Promise<any> {
    const data: any = {};
    
    if (tables.includes('all') || tables.includes('settings')) {
      data.settings = storage.getItem(`company_${companyId}_settings`, {});
    }
    
    if (tables.includes('all') || tables.includes('products')) {
      data.products = storage.getItem(`${companyId}_products`, []);
    }
    
    if (tables.includes('all') || tables.includes('customers')) {
      data.customers = storage.getItem(`${companyId}_customers`, []);
    }
    
    if (tables.includes('all') || tables.includes('invoices')) {
      data.invoices = storage.getItem(`${companyId}_invoices`, []);
    }
    
    if (tables.includes('all') || tables.includes('cash')) {
      data.cash = storage.getItem(`${companyId}_cash_transactions`, []);
    }

    return data;
  }

  private saveBackupRecord(backup: BackupRecord): void {
    const records = this.getBackupRecords(backup.companyId);
    records.push(backup);
    storage.setItem(`company_${backup.companyId}_backups`, records);
  }

  private updateBackupRecord(backup: BackupRecord): void {
    const records = this.getBackupRecords(backup.companyId);
    const index = records.findIndex(r => r.id === backup.id);
    if (index !== -1) {
      records[index] = backup;
      storage.setItem(`company_${backup.companyId}_backups`, records);
    }
  }

  private getBackupRecord(companyId: string, backupId: string): BackupRecord | null {
    const records = this.getBackupRecords(companyId);
    return records.find(r => r.id === backupId) || null;
  }

  private getBackupRecords(companyId: string): BackupRecord[] {
    return storage.getItem(`company_${companyId}_backups`, []);
  }

  private saveBackupConfig(config: BackupConfig): void {
    const configs = this.getBackupConfigs(config.companyId);
    configs.push(config);
    storage.setItem(`company_${config.companyId}_backup_configs`, configs);
  }

  private getBackupConfig(companyId: string, configId: string): BackupConfig | null {
    const configs = this.getBackupConfigs(companyId);
    return configs.find(c => c.id === configId) || null;
  }

  private getBackupConfigs(companyId: string): BackupConfig[] {
    return storage.getItem(`company_${companyId}_backup_configs`, []);
  }

  private getDefaultConfig(companyId: string): BackupConfig {
    return {
      id: 'default',
      name: 'تكوين افتراضي',
      companyId,
      schedule: 'manual',
      enabled: true,
      compression: 'balanced',
      encryption: false,
      includeSettings: true,
      includeTables: ['all'],
      maxBackups: 10,
      autoCleanup: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  private cleanupOldBackups(companyId: string, maxBackups: number): void {
    const records = this.getBackupRecords(companyId);
    const completedBackups = records
      .filter(r => r.status === 'completed')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (completedBackups.length > maxBackups) {
      const toDelete = completedBackups.slice(maxBackups);
      toDelete.forEach(backup => {
        storage.removeItem(`backup_data_${backup.id}`);
      });

      const remainingRecords = records.filter(r => 
        r.status !== 'completed' || !toDelete.find(d => d.id === r.id)
      );
      storage.setItem(`company_${companyId}_backups`, remainingRecords);
    }
  }

  private calculateNextBackupTime(config: BackupConfig): string {
    const now = new Date();
    const [hours, minutes] = (config.time || '02:00').split(':').map(Number);
    
    let nextBackup = new Date(now);
    nextBackup.setHours(hours, minutes, 0, 0);

    switch (config.schedule) {
      case 'daily':
        if (nextBackup <= now) {
          nextBackup.setDate(nextBackup.getDate() + 1);
        }
        break;
      case 'weekly':
        nextBackup.setDate(nextBackup.getDate() + (7 - nextBackup.getDay()));
        if (nextBackup <= now) {
          nextBackup.setDate(nextBackup.getDate() + 7);
        }
        break;
      case 'monthly':
        nextBackup.setMonth(nextBackup.getMonth() + 1, 1);
        if (nextBackup <= now) {
          nextBackup.setMonth(nextBackup.getMonth() + 1);
        }
        break;
    }

    return nextBackup.toISOString();
  }

  private restoreSelectedTables(companyId: string, data: any, tables: string[], preserveExisting: boolean): void {
    tables.forEach(table => {
      if (data[table]) {
        const key = table === 'settings' ? `company_${companyId}_settings` : `${companyId}_${table}`;
        
        if (preserveExisting) {
          const existing = storage.getItem(key, []);
          const merged = Array.isArray(existing) ? [...existing, ...data[table]] : data[table];
          storage.setItem(key, merged);
        } else {
          storage.setItem(key, data[table]);
        }
      }
    });
  }

  private restoreAllData(companyId: string, data: any, preserveExisting: boolean): void {
    Object.keys(data).forEach(table => {
      const key = table === 'settings' ? `company_${companyId}_settings` : `${companyId}_${table}`;
      
      if (preserveExisting && Array.isArray(data[table])) {
        const existing = storage.getItem(key, []);
        const merged = Array.isArray(existing) ? [...existing, ...data[table]] : data[table];
        storage.setItem(key, merged);
      } else {
        storage.setItem(key, data[table]);
      }
    });
  }
}

// إنشاء المثيل الوحيد
export const advancedBackupManager = AdvancedBackupManager.getInstance();