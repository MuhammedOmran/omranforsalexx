import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { secureAuditLogger } from '@/utils/secureAuditLogger';

interface EncryptionOptions {
  algorithm?: string;
  keyDerivation?: 'pbkdf2';
  iterations?: number;
}

export function useSecureStorage() {
  const { user } = useAuth();

  // تشفير البيانات بشكل آمن
  const encryptData = useCallback(async (
    data: any, 
    options: EncryptionOptions = {}
  ): Promise<string> => {
    try {
      const {
        algorithm = 'AES-GCM',
        keyDerivation = 'pbkdf2',
        iterations = 100000
      } = options;

      if (!user) {
        throw new Error('المستخدم غير مصادق عليه');
      }

      // تحويل البيانات إلى نص
      const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
      const encoder = new TextEncoder();
      const plainData = encoder.encode(plaintext);

      // إنشاء مفتاح التشفير الآمن
      const encryptionKey = await deriveSecureKey(user.id, keyDerivation, iterations);

      // توليد IV عشوائي
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // تشفير البيانات
      const encryptedData = await crypto.subtle.encrypt(
        { name: algorithm, iv },
        encryptionKey,
        plainData
      );

      // دمج IV مع البيانات المشفرة
      const combined = new Uint8Array(iv.length + encryptedData.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedData), iv.length);

      // تحويل إلى Base64
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      await secureAuditLogger.logSecurityError(user?.id || '', 'encryption_error', String(error));
      throw new Error('فشل في تشفير البيانات');
    }
  }, [user]);

  // فك تشفير البيانات
  const decryptData = useCallback(async (
    encryptedData: string,
    options: EncryptionOptions = {}
  ): Promise<any> => {
    try {
      const {
        algorithm = 'AES-GCM',
        keyDerivation = 'pbkdf2',
        iterations = 100000
      } = options;

      if (!user) {
        throw new Error('المستخدم غير مصادق عليه');
      }

      // تحويل من Base64
      const combined = new Uint8Array(
        atob(encryptedData)
          .split('')
          .map(char => char.charCodeAt(0))
      );

      // استخراج IV والبيانات المشفرة
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      // إنشاء مفتاح فك التشفير
      const decryptionKey = await deriveSecureKey(user.id, keyDerivation, iterations);

      // فك التشفير
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: algorithm, iv },
        decryptionKey,
        encrypted
      );

      // تحويل إلى نص
      const decoder = new TextDecoder();
      const plaintext = decoder.decode(decryptedBuffer);

      // محاولة تحويل من JSON
      try {
        return JSON.parse(plaintext);
      } catch {
        return plaintext;
      }
    } catch (error) {
      await secureAuditLogger.logSecurityError(user?.id || '', 'decryption_error', String(error));
      throw new Error('فشل في فك تشفير البيانات');
    }
  }, [user]);

  // تخزين آمن في localStorage
  const setSecureItem = useCallback(async (key: string, value: any): Promise<void> => {
    try {
      const encryptedValue = await encryptData(value);
      localStorage.setItem(`secure_${key}`, encryptedValue);
      
      await secureAuditLogger.logSecurityEvent({
        user_id: user?.id,
        event_type: 'secure_storage_write',
        event_description: `تم حفظ البيانات بشكل آمن: ${key}`,
        metadata: { key },
        severity: 'low'
      });
    } catch (error) {
      await secureAuditLogger.logSecurityError(user?.id || '', 'secure_storage_error', String(error));
      throw error;
    }
  }, [user, encryptData]);

  // قراءة آمنة من localStorage
  const getSecureItem = useCallback(async (key: string): Promise<any> => {
    try {
      const encryptedValue = localStorage.getItem(`secure_${key}`);
      if (!encryptedValue) {
        return null;
      }
      
      const decryptedValue = await decryptData(encryptedValue);
      
      await secureAuditLogger.logSecurityEvent({
        user_id: user?.id,
        event_type: 'secure_storage_read',
        event_description: `تم قراءة البيانات الآمنة: ${key}`,
        metadata: { key },
        severity: 'low'
      });
      
      return decryptedValue;
    } catch (error) {
      await secureAuditLogger.logSecurityError(user?.id || '', 'secure_storage_error', String(error));
      return null;
    }
  }, [user, decryptData]);

  // حذف البيانات الآمنة
  const removeSecureItem = useCallback(async (key: string): Promise<void> => {
    try {
      localStorage.removeItem(`secure_${key}`);
      
      await secureAuditLogger.logSecurityEvent({
        user_id: user?.id,
        event_type: 'secure_storage_delete',
        event_description: `تم حذف البيانات الآمنة: ${key}`,
        metadata: { key },
        severity: 'low'
      });
    } catch (error) {
      await secureAuditLogger.logSecurityError(user?.id || '', 'secure_storage_error', String(error));
    }
  }, [user]);

  // إنشاء مفتاح تشفير آمن
  const deriveSecureKey = async (
    userId: string,
    method: 'pbkdf2',
    iterations: number
  ): Promise<CryptoKey> => {
    const encoder = new TextEncoder();
    
    // استخدام معرف المستخدم + ملح ثابت آمن
    const password = `${userId}-omran-security-2024`;
    const passwordBuffer = encoder.encode(password);
    const salt = encoder.encode('omran-sales-secure-salt-v2');

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  };

  // تنظيف البيانات الحساسة
  const clearAllSecureData = useCallback(async (): Promise<void> => {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('secure_'));
      keys.forEach(key => localStorage.removeItem(key));
      
      await secureAuditLogger.logSecurityEvent({
        user_id: user?.id,
        event_type: 'secure_storage_clear',
        event_description: 'تم مسح جميع البيانات الآمنة',
        metadata: { clearedCount: keys.length },
        severity: 'medium'
      });
    } catch (error) {
      await secureAuditLogger.logSecurityError(user?.id || '', 'secure_storage_error', String(error));
    }
  }, [user]);

  return {
    encryptData,
    decryptData,
    setSecureItem,
    getSecureItem,
    removeSecureItem,
    clearAllSecureData
  };
}