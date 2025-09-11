import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type CheckRow = Database['public']['Tables']['checks']['Row'];
type CheckInsert = Database['public']['Tables']['checks']['Insert'];
type CheckUpdate = Database['public']['Tables']['checks']['Update'];

export type Check = CheckRow;

export const useChecks = () => {
  const [checks, setChecks] = useState<Check[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useSupabaseAuth();

  // Fetch checks from Supabase
  const fetchChecks = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('checks')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChecks(data || []);
    } catch (err) {
      console.error('Error fetching checks:', err);
      setError('فشل في تحميل الشيكات');
      toast.error('فشل في تحميل الشيكات');
    } finally {
      setLoading(false);
    }
  };

  // Add new check
  const addCheck = async (checkData: {
    check_number: string;
    amount: number;
    customer_name: string;
    bank_name: string;
    due_date: string;
    description?: string;
    date_received: string;
    customer_id?: string;
    supplier_id?: string;
    customer_phone?: string;
    entity_type?: 'customer' | 'supplier';
    related_invoice_id?: string;
    notes?: string;
    created_by?: string;
    check_type?: 'incoming' | 'outgoing';
  }) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('checks')
        .insert([{
          ...checkData,
          user_id: user.id,
          status: 'pending',
        }])
        .select()
        .single();

      if (error) throw error;

      setChecks(prev => [data, ...prev]);
      toast.success('تم إضافة الشيك بنجاح');
      return true;
    } catch (err) {
      console.error('Error adding check:', err);
      toast.error('فشل في إضافة الشيك');
      return false;
    }
  };

  // Update check status
  const updateCheckStatus = async (checkId: string, newStatus: Check['status']) => {
    if (!user) return false;

    try {
      const updateData: any = { 
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      // Set appropriate date based on status
      if (newStatus === 'cashed') {
        updateData.cashed_date = new Date().toISOString();
      } else if (newStatus === 'bounced') {
        updateData.bounced_date = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('checks')
        .update(updateData)
        .eq('id', checkId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setChecks(prev => prev.map(check => 
        check.id === checkId ? data : check
      ));

      toast.success('تم تحديث حالة الشيك بنجاح');
      return true;
    } catch (err) {
      console.error('Error updating check status:', err);
      toast.error('فشل في تحديث حالة الشيك');
      return false;
    }
  };

  // Update check
  const updateCheck = async (checkId: string, updates: Partial<Check>) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('checks')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', checkId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setChecks(prev => prev.map(check => 
        check.id === checkId ? data : check
      ));

      toast.success('تم تحديث الشيك بنجاح');
      return true;
    } catch (err) {
      console.error('Error updating check:', err);
      toast.error('فشل في تحديث الشيك');
      return false;
    }
  };

  // Delete check (soft delete)
  const deleteCheck = async (checkId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('checks')
        .update({ 
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', checkId)
        .eq('user_id', user.id);

      if (error) throw error;

      setChecks(prev => prev.filter(check => check.id !== checkId));
      toast.success('تم حذف الشيك بنجاح');
      return true;
    } catch (err) {
      console.error('Error deleting check:', err);
      toast.error('فشل في حذف الشيك');
      return false;
    }
  };

  // Get checks by status
  const getChecksByStatus = (status: Check['status']) => {
    return checks.filter(check => check.status === status);
  };

  // Get checks by entity
  const getChecksByEntity = (entityId: string, entityType: 'customer' | 'supplier') => {
    return checks.filter(check => 
      (entityType === 'customer' && check.customer_id === entityId) ||
      (entityType === 'supplier' && check.supplier_id === entityId)
    );
  };

  // Get overdue checks
  const getOverdueChecks = () => {
    const today = new Date();
    return checks.filter(check => {
      const dueDate = new Date(check.due_date);
      return check.status === 'pending' && dueDate < today;
    });
  };

  // Get checks due soon (within next 7 days)
  const getChecksDueSoon = () => {
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return checks.filter(check => {
      const dueDate = new Date(check.due_date);
      return check.status === 'pending' && dueDate >= today && dueDate <= weekFromNow;
    });
  };

  // Fetch deleted checks with time filters
  const fetchDeletedChecks = async (daysBack: number = 30) => {
    if (!user) return [];
    
    try {
      const { data, error } = await supabase
        .from('checks')
        .select('*')
        .eq('user_id', user.id)
        .not('deleted_at', 'is', null)
        .gte('deleted_at', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString())
        .order('deleted_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching deleted checks:', err);
      toast.error('فشل في تحميل الشيكات المحذوفة');
      return [];
    }
  };

  // Restore multiple checks
  const restoreMultipleChecks = async (checkIds: string[]) => {
    if (!user) return { success: 0, failed: 0 };
    
    let success = 0;
    let failed = 0;
    
    try {
      for (const checkId of checkIds) {
        const { error } = await supabase
          .from('checks')
          .update({ 
            deleted_at: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', checkId)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error restoring check:', checkId, error);
          failed++;
        } else {
          success++;
        }
      }
      
      // Refresh checks list
      if (success > 0) {
        await fetchChecks();
      }
      
      return { success, failed };
    } catch (err) {
      console.error('Error restoring multiple checks:', err);
      return { success, failed: checkIds.length };
    }
  };

  // Delete multiple checks permanently
  const deleteMultipleChecksPermanently = async (checkIds: string[]) => {
    if (!user) return { success: 0, failed: 0 };
    
    let success = 0;
    let failed = 0;
    
    try {
      for (const checkId of checkIds) {
        const { error } = await supabase
          .from('checks')
          .delete()
          .eq('id', checkId)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error deleting check permanently:', checkId, error);
          failed++;
        } else {
          success++;
        }
      }
      
      return { success, failed };
    } catch (err) {
      console.error('Error deleting multiple checks permanently:', err);
      return { success, failed: checkIds.length };
    }
  };

  // Delete all deleted checks permanently using Supabase function
  const deleteAllDeletedChecksPermanently = async () => {
    if (!user) return { success: 0, failed: 0, message: 'غير مخول' };
    
    try {
      const { data, error } = await supabase.rpc('delete_all_deleted_checks_permanently', {
        p_user_id: user.id
      });

      if (error) throw error;

      const result = data?.[0];
      if (result) {
        return { 
          success: result.deleted_count, 
          failed: 0, 
          message: result.message,
          totalAmount: result.total_amount 
        };
      }

      return { success: 0, failed: 0, message: 'لا توجد نتائج' };
    } catch (err) {
      console.error('Error deleting all deleted checks permanently:', err);
      return { success: 0, failed: 1, message: 'حدث خطأ أثناء الحذف' };
    }
  };

  // Restore all deleted checks using Supabase function
  const restoreAllDeletedChecks = async () => {
    if (!user) return { success: 0, failed: 0, message: 'غير مخول' };
    
    try {
      const { data, error } = await supabase.rpc('restore_all_deleted_checks', {
        p_user_id: user.id
      });

      if (error) throw error;

      const result = data?.[0];
      if (result) {
        // Refresh the checks list after restoration
        await fetchChecks();
        
        return { 
          success: result.restored_count, 
          failed: 0, 
          message: result.message,
          totalAmount: result.total_amount 
        };
      }

      return { success: 0, failed: 0, message: 'لا توجد نتائج' };
    } catch (err) {
      console.error('Error restoring all deleted checks:', err);
      return { success: 0, failed: 1, message: 'حدث خطأ أثناء الاستعادة' };
    }
  };

  // Restore deleted check
  const restoreCheck = async (checkId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('checks')
        .update({ 
          deleted_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', checkId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Refresh the checks list to include the restored check
      await fetchChecks();
      toast.success('تم استعادة الشيك بنجاح');
      return true;
    } catch (err) {
      console.error('Error restoring check:', err);
      toast.error('فشل في استعادة الشيك');
      return false;
    }
  };

  // Delete check permanently
  const deleteCheckPermanently = async (checkId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('checks')
        .delete()
        .eq('id', checkId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('تم حذف الشيك نهائياً');
      return true;
    } catch (err) {
      console.error('Error permanently deleting check:', err);
      toast.error('فشل في حذف الشيك نهائياً');
      return false;
    }
  };

  // Get check statistics
  const getCheckStatistics = () => {
    const pendingChecks = checks.filter(c => c.status === 'pending');
    const cashedChecks = checks.filter(c => c.status === 'cashed');
    const bouncedChecks = checks.filter(c => c.status === 'bounced');
    const paidChecks = checks.filter(c => c.status === 'paid');
    const overdueChecks = getOverdueChecks();

    return {
      totalChecks: checks.length,
      pendingCount: pendingChecks.length,
      cashedCount: cashedChecks.length,
      bouncedCount: bouncedChecks.length,
      paidCount: paidChecks.length,
      overdueCount: overdueChecks.length,
      totalPendingAmount: pendingChecks.reduce((sum, c) => sum + c.amount, 0),
      totalCashedAmount: cashedChecks.reduce((sum, c) => sum + c.amount, 0),
      totalBouncedAmount: bouncedChecks.reduce((sum, c) => sum + c.amount, 0),
      totalPaidAmount: paidChecks.reduce((sum, c) => sum + c.amount, 0),
      overdueAmount: overdueChecks.reduce((sum, c) => sum + c.amount, 0)
    };
  };

  useEffect(() => {
    if (user) {
      fetchChecks();
    }
  }, [user]);

  return {
    checks,
    loading,
    error,
    addCheck,
    updateCheck,
    updateCheckStatus,
    deleteCheck,
    getChecksByStatus,
    getChecksByEntity,
    getOverdueChecks,
    getChecksDueSoon,
    getCheckStatistics,
    fetchDeletedChecks,
    restoreCheck,
    deleteCheckPermanently,
    restoreMultipleChecks,
    deleteMultipleChecksPermanently,
    deleteAllDeletedChecksPermanently,
    restoreAllDeletedChecks,
    refetch: fetchChecks
  };
};