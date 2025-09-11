/**
 * مكون لبدء المزامنة التلقائية للبيانات الأوف لاين
 */

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { startAutoSync } from '@/utils/supabaseOfflineSync';

export function OfflineAutoSync() {
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      // بدء المزامنة التلقائية
      startAutoSync(user.id);
    }
  }, [user?.id]);

  // هذا المكون لا يعرض أي شيء - يعمل في الخلفية فقط
  return null;
}