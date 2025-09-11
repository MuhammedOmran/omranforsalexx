import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { secureAuditLogger } from '@/utils/secureAuditLogger';
import { toast } from 'sonner';

interface TwoFactorData {
  id: string;
  user_id: string;
  secret_encrypted: string;
  backup_codes_encrypted: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export function useSecureTwoFactor() {
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkTwoFactorStatus();
  }, [user]);

  const checkTwoFactorStatus = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await (supabase as any)
        .from('user_two_factor')
        .select('is_enabled')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking 2FA status:', error);
        return;
      }
      
      setIsEnabled(data?.is_enabled || false);
    } catch (error) {
      console.error('Error checking 2FA status:', error);
    }
  }, [user]);

  const setupTwoFactor = useCallback(async (): Promise<{
    secret: string;
    qrCode: string;
    backupCodes: string[];
  } | null> => {
    if (!user) return null;

    setLoading(true);
    try {
      // Generate secret
      const secret = generateSecret();
      const backupCodes = generateBackupCodes();
      const qrCode = generateQRCode(secret, user.email);

      await secureAuditLogger.logSecurityEvent({
        user_id: user.id,
        event_type: '2fa_setup_initiated',
        event_description: 'بدء إعداد المصادقة الثنائية',
        severity: 'medium'
      });

      return { secret, qrCode, backupCodes };
    } catch (error) {
      await secureAuditLogger.logSecurityError(user.id, '2fa_setup_error', String(error));
      toast.error('فشل في إعداد المصادقة الثنائية');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const enableTwoFactor = useCallback(async (
    secret: string,
    verificationCode: string,
    backupCodes: string[]
  ): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);
    try {
      // Verify the code first
      const isValid = verifyTOTP(secret, verificationCode);
      if (!isValid) {
        toast.error('الرمز غير صحيح');
        return false;
      }

      // Store encrypted data in database
      const { error } = await (supabase as any)
        .from('user_two_factor')
        .upsert({
          user_id: user.id,
          secret_encrypted: await encryptData(secret),
          backup_codes_encrypted: await encryptData(backupCodes),
          is_enabled: true
        });

      if (error) {
        throw new Error(error.message);
      }

      setIsEnabled(true);
      
      await secureAuditLogger.logSecurityEvent({
        user_id: user.id,
        event_type: '2fa_enabled',
        event_description: 'تم تفعيل المصادقة الثنائية',
        severity: 'high'
      });

      toast.success('تم تفعيل المصادقة الثنائية بنجاح');
      return true;
    } catch (error) {
      await secureAuditLogger.logSecurityError(user.id, '2fa_enable_error', String(error));
      toast.error('فشل في تفعيل المصادقة الثنائية');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const verifyTwoFactor = useCallback(async (code: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await (supabase as any)
        .from('user_two_factor')
        .select('secret_encrypted, backup_codes_encrypted')
        .eq('user_id', user.id)
        .eq('is_enabled', true)
        .single();

      if (error || !data) {
        return true; // 2FA not enabled
      }

      const secret = await decryptData(data.secret_encrypted);
      const backupCodes = await decryptData(data.backup_codes_encrypted);

      // Verify TOTP code
      if (verifyTOTP(secret, code)) {
        await secureAuditLogger.logSecurityEvent({
          user_id: user.id,
          event_type: '2fa_verification_success',
          event_description: 'تحقق ناجح من المصادقة الثنائية',
          severity: 'low'
        });
        return true;
      }

      // Check backup codes
      if (backupCodes.includes(code.toUpperCase())) {
        // Remove used backup code
        const updatedCodes = backupCodes.filter((c: string) => c !== code.toUpperCase());
        
        await (supabase as any)
          .from('user_two_factor')
          .update({ backup_codes_encrypted: await encryptData(updatedCodes) })
          .eq('user_id', user.id);

        await secureAuditLogger.logSecurityEvent({
          user_id: user.id,
          event_type: '2fa_backup_code_used',
          event_description: 'تم استخدام رمز احتياطي للمصادقة الثنائية',
          severity: 'medium'
        });

        toast.warning('تم استخدام رمز احتياطي - يرجى إنشاء رموز جديدة');
        return true;
      }

      await secureAuditLogger.logSecurityEvent({
        user_id: user.id,
        event_type: '2fa_verification_failed',
        event_description: 'فشل في التحقق من المصادقة الثنائية',
        severity: 'high'
      });

      return false;
    } catch (error) {
      await secureAuditLogger.logSecurityError(user.id, '2fa_verify_error', String(error));
      return false;
    }
  }, [user]);

  const disableTwoFactor = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);
    try {
      const { error } = await (supabase as any)
        .from('user_two_factor')
        .update({ is_enabled: false })
        .eq('user_id', user.id);

      if (error) {
        throw new Error(error.message);
      }

      setIsEnabled(false);
      
      await secureAuditLogger.logSecurityEvent({
        user_id: user.id,
        event_type: '2fa_disabled',
        event_description: 'تم إلغاء تفعيل المصادقة الثنائية',
        severity: 'high'
      });

      toast.success('تم إلغاء تفعيل المصادقة الثنائية');
      return true;
    } catch (error) {
      await secureAuditLogger.logSecurityError(user.id, '2fa_disable_error', String(error));
      toast.error('فشل في إلغاء تفعيل المصادقة الثنائية');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);
  // Regenerate backup codes
  const regenerateBackupCodes = useCallback(async (): Promise<string[] | null> => {
    if (!user) return null;
    try {
      const newCodes = generateBackupCodes();
      await (supabase as any)
        .from('user_two_factor')
        .update({ backup_codes_encrypted: await encryptData(newCodes) })
        .eq('user_id', user.id);
      toast.success('تم إنشاء رموز احتياطية جديدة');
      return newCodes;
    } catch (error) {
      await secureAuditLogger.logSecurityError(user.id, '2fa_regenerate_backup', String(error));
      toast.error('فشل في إنشاء الرموز الاحتياطية');
      return null;
    }
  }, [user]);

  // Helper functions
  const generateSecret = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const generateBackupCodes = (): string[] => {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substr(2, 8).toUpperCase());
    }
    return codes;
  };

  const generateQRCode = (secret: string, email: string): string => {
    const issuer = 'نظام عمران';
    const otpAuth = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpAuth)}`;
  };

  const verifyTOTP = (secret: string, token: string): boolean => {
    // Simplified TOTP verification - in production use proper TOTP library
    const timeStep = 30;
    const currentTime = Math.floor(Date.now() / 1000 / timeStep);
    
    const validTokens = [
      generateTOTPToken(secret, currentTime - 1),
      generateTOTPToken(secret, currentTime),
      generateTOTPToken(secret, currentTime + 1)
    ];

    return validTokens.includes(token);
  };

  const generateTOTPToken = (secret: string, time: number): string => {
    // Simplified token generation - in production use proper TOTP library
    const hash = btoa(secret + time).slice(0, 6).replace(/[^0-9]/g, '0');
    return hash.padStart(6, '0');
  };

  const encryptData = async (data: any): Promise<string> => {
    // Simple encryption for demo - in production use proper encryption
    return btoa(JSON.stringify(data));
  };

  const decryptData = async (encryptedData: string): Promise<any> => {
    // Simple decryption for demo - in production use proper decryption
    return JSON.parse(atob(encryptedData));
  };

  return {
    isEnabled,
    loading,
    setupTwoFactor,
    enableTwoFactor,
    verifyTwoFactor,
    disableTwoFactor,
    regenerateBackupCodes
  };
}