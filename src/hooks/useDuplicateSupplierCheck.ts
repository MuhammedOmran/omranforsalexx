import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DuplicateCheckResult {
  duplicate_type: string;
  existing_supplier_id: string;
  existing_supplier_name: string;
}

export function useDuplicateSupplierCheck() {
  const [isChecking, setIsChecking] = useState(false);

  const checkForDuplicate = async (
    name: string,
    email?: string,
    phone?: string,
    excludeId?: string
  ): Promise<DuplicateCheckResult | null> => {
    setIsChecking(true);
    try {
      const { data, error } = await supabase.rpc('check_duplicate_supplier', {
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        p_name: name.trim(),
        p_email: email?.trim() || null,
        p_phone: phone?.trim() || null,
        p_exclude_id: excludeId || null
      });

      if (error) {
        console.error('خطأ في فحص الازدواجية:', error);
        return null;
      }

      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('خطأ في فحص الازدواجية:', error);
      return null;
    } finally {
      setIsChecking(false);
    }
  };

  const getDuplicateMessage = (duplicateType: string, existingName: string): string => {
    switch (duplicateType) {
      case 'name':
        return `يوجد مورد بنفس الاسم: "${existingName}"`;
      case 'email':
        return `يوجد مورد بنفس البريد الإلكتروني: "${existingName}"`;
      case 'phone':
        return `يوجد مورد بنفس رقم الهاتف: "${existingName}"`;
      default:
        return `يوجد مورد مشابه: "${existingName}"`;
    }
  };

  return {
    checkForDuplicate,
    getDuplicateMessage,
    isChecking
  };
}