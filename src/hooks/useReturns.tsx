import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type ReturnRow = Database['public']['Tables']['returns']['Row'];
type ReturnInsert = Database['public']['Tables']['returns']['Insert'];
type ReturnUpdate = Database['public']['Tables']['returns']['Update'];
type ReturnItemRow = Database['public']['Tables']['return_items']['Row'];
type ReturnItemInsert = Database['public']['Tables']['return_items']['Insert'];

export type Return = ReturnRow & {
  items?: ReturnItemRow[];
  deleted_at?: string | null;
};

export type ReturnItem = ReturnItemRow;

export const useReturns = () => {
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useSupabaseAuth();

  // Fetch returns from Supabase
  const fetchReturns = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data: returnsData, error: returnsError } = await supabase
        .from('returns')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null) // Only fetch non-deleted returns
        .order('created_at', { ascending: false });

      if (returnsError) {
        console.error('Returns fetch error:', returnsError);
        throw returnsError;
      }
      
      // Fetch return items separately and merge client-side (more reliable when no FK is defined)
      const returnIds = (returnsData || []).map(r => r.id);
      let itemsByReturn: Record<string, ReturnItemRow[]> = {};
      if (returnIds.length > 0) {
        const { data: itemsData, error: itemsError } = await supabase
          .from('return_items')
          .select('*')
          .in('return_id', returnIds);
        if (itemsError) {
          console.error('Return items fetch error:', itemsError);
          throw itemsError;
        }
        itemsByReturn = (itemsData || []).reduce((acc, item) => {
          (acc[item.return_id] = acc[item.return_id] || []).push(item);
          return acc;
        }, {} as Record<string, ReturnItemRow[]>);
      }

      const merged = (returnsData || []).map(r => ({
        ...r,
        items: itemsByReturn[r.id] || []
      }));

      setReturns(merged);
      console.log('Returns loaded successfully:', merged.length);

    } catch (err: any) {
      console.error('Error fetching returns:', err);
      setError(err.message || 'فشل في تحميل المرتجعات');
      toast.error('فشل في تحميل المرتجعات: ' + (err.message || 'خطأ غير معروف'));
    } finally {
      setLoading(false);
    }
  };

  // Add new return
  const addReturn = async (returnData: {
    customer_name: string;
    original_invoice_number: string;
    reason: string;
    notes?: string;
    return_date?: string;
    items: {
      product_name: string;
      quantity: number;
      unit_price: number;
      total_price: number;
      reason: string;
    }[];
  }) => {
    if (!user) return false;

    try {
      const totalAmount = returnData.items.reduce((sum, item) => sum + item.total_price, 0);
      
      // Generate return number
      const returnNumber = `RET-${Date.now()}`;

      // Insert return
      const { data: returnRecord, error: returnError } = await supabase
        .from('returns')
        .insert([{
          user_id: user.id,
          customer_name: returnData.customer_name,
          original_invoice_number: returnData.original_invoice_number,
          return_number: returnNumber,
          reason: returnData.reason,
          notes: returnData.notes,
          return_date: returnData.return_date || new Date().toISOString().split('T')[0],
          total_amount: totalAmount,
          status: 'pending'
        }])
        .select()
        .single();

      if (returnError) throw returnError;

      // Insert return items
      const itemsToInsert = returnData.items.map(item => ({
        return_id: returnRecord.id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        reason: item.reason
      }));

      const { error: itemsError } = await supabase
        .from('return_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // Refresh returns list
      await fetchReturns();
      toast.success('تم إنشاء المرتجع بنجاح');
      return true;
    } catch (err) {
      console.error('Error adding return:', err);
      toast.error('فشل في إنشاء المرتجع');
      return false;
    }
  };

  // Update return status
  const updateReturnStatus = async (returnId: string, newStatus: ReturnRow['status'], processedBy?: string) => {
    if (!user) return false;

    try {
      const updateData: any = { 
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'processed') {
        updateData.processed_date = new Date().toISOString();
        updateData.processed_by = processedBy || 'المستخدم الحالي';
      }

      const { data, error } = await supabase
        .from('returns')
        .update(updateData)
        .eq('id', returnId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setReturns(prev => prev.map(ret => 
        ret.id === returnId ? { ...ret, ...data } : ret
      ));

      toast.success('تم تحديث حالة المرتجع بنجاح');
      return true;
    } catch (err) {
      console.error('Error updating return status:', err);
      toast.error('فشل في تحديث حالة المرتجع');
      return false;
    }
  };

  // Update return
  const updateReturn = async (returnId: string, updates: Partial<ReturnUpdate>) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('returns')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', returnId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setReturns(prev => prev.map(ret => 
        ret.id === returnId ? { ...ret, ...data } : ret
      ));

      toast.success('تم تحديث المرتجع بنجاح');
      return true;
    } catch (err) {
      console.error('Error updating return:', err);
      toast.error('فشل في تحديث المرتجع');
      return false;
    }
  };

  // Delete return (soft delete)
  const deleteReturn = async (returnId: string) => {
    if (!user) return false;

    try {
      // Soft delete - update deleted_at field
      const { error } = await supabase
        .from('returns')
        .update({ 
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', returnId)
        .eq('user_id', user.id);

      if (error) throw error;

      setReturns(prev => prev.filter(ret => ret.id !== returnId));
      toast.success('تم حذف المرتجع بنجاح');
      return true;
    } catch (err) {
      console.error('Error deleting return:', err);
      toast.error('فشل في حذف المرتجع');
      return false;
    }
  };

  // Get deleted returns (for restore functionality)
  const getDeletedReturns = async (daysBack: number = 30) => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('returns')
        .select('*')
        .eq('user_id', user.id)
        .not('deleted_at', 'is', null)
        .gte('deleted_at', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString())
        .order('deleted_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching deleted returns:', err);
      toast.error('فشل في تحميل المرتجعات المحذوفة');
      return [];
    }
  };

  // Restore deleted return
  const restoreReturn = async (returnId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('returns')
        .update({ 
          deleted_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', returnId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Refresh returns list to include restored return
      await fetchReturns();
      toast.success('تم استعادة المرتجع بنجاح');
      return true;
    } catch (err) {
      console.error('Error restoring return:', err);
      toast.error('فشل في استعادة المرتجع');
      return false;
    }
  };

  // Permanently delete return
  const permanentlyDeleteReturn = async (returnId: string) => {
    if (!user) return false;

    try {
      // Delete return items first
      const { error: itemsError } = await supabase
        .from('return_items')
        .delete()
        .eq('return_id', returnId);

      if (itemsError) throw itemsError;

      // Delete return permanently
      const { error } = await supabase
        .from('returns')
        .delete()
        .eq('id', returnId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('تم حذف المرتجع نهائياً');
      return true;
    } catch (err) {
      console.error('Error permanently deleting return:', err);
      toast.error('فشل في حذف المرتجع نهائياً');
      return false;
    }
  };

  // Get returns by status
  const getReturnsByStatus = (status: ReturnRow['status']) => {
    return returns.filter(ret => ret.status === status);
  };

  // Get return statistics
  const getReturnStatistics = () => {
    const pendingReturns = returns.filter(r => r.status === 'pending');
    const approvedReturns = returns.filter(r => r.status === 'approved');
    const processedReturns = returns.filter(r => r.status === 'processed');
    const rejectedReturns = returns.filter(r => r.status === 'rejected');

    return {
      totalReturns: returns.length,
      pendingCount: pendingReturns.length,
      approvedCount: approvedReturns.length,
      processedCount: processedReturns.length,
      rejectedCount: rejectedReturns.length,
      totalAmount: returns.reduce((sum, r) => sum + r.total_amount, 0),
      pendingAmount: pendingReturns.reduce((sum, r) => sum + r.total_amount, 0),
      processedAmount: processedReturns.reduce((sum, r) => sum + r.total_amount, 0)
    };
  };

  // Get return reasons analysis
  const getReturnReasonsAnalysis = () => {
    const reasonCounts: { [key: string]: number } = {};
    
    returns.forEach(ret => {
      reasonCounts[ret.reason] = (reasonCounts[ret.reason] || 0) + 1;
    });

    return Object.entries(reasonCounts).map(([reason, count]) => ({
      reason,
      count,
      percentage: ((count / returns.length) * 100).toFixed(1)
    }));
  };

  // Get monthly returns report
  const getMonthlyReturnsReport = (year: number, month: number) => {
    const monthlyReturns = returns.filter(ret => {
      const returnDate = new Date(ret.return_date);
      return returnDate.getFullYear() === year && returnDate.getMonth() + 1 === month;
    });

    return {
      totalReturns: monthlyReturns.length,
      processedReturns: monthlyReturns.filter(r => r.status === 'processed').length,
      totalAmount: monthlyReturns.reduce((sum, r) => sum + r.total_amount, 0)
    };
  };

  useEffect(() => {
    if (user) {
      console.log('User authenticated, fetching returns...');
      fetchReturns();
    } else {
      console.log('No user authenticated');
      setReturns([]);
      setLoading(false);
    }
  }, [user]);

  // Add realtime subscription for returns
  useEffect(() => {
    if (!user) return;

    console.log('Setting up realtime subscription for returns...');
    
    const channel = supabase
      .channel('returns_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'returns',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Returns change received:', payload);
          // Refresh data when changes occur
          fetchReturns();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'return_items'
        },
        (payload) => {
          console.log('Return items change received:', payload);
          // Refresh data when return items change
          fetchReturns();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up realtime subscription...');
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    returns,
    loading,
    error,
    addReturn,
    updateReturn,
    updateReturnStatus,
    deleteReturn,
    getDeletedReturns,
    restoreReturn,
    permanentlyDeleteReturn,
    getReturnsByStatus,
    getReturnStatistics,
    getReturnReasonsAnalysis,
    getMonthlyReturnsReport,
    refetch: fetchReturns
  };
};