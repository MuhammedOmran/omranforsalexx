import { supabase } from '@/integrations/supabase/client';

export interface InstallmentData {
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  installmentAmount: number;
  installmentPeriod: number;
  startDate: string;
  dueDate: string;
  notes?: string;
}

export interface PaymentData {
  amount: number;
  date: string;
  notes?: string;
  paymentMethod: string;
}

export interface Installment {
  id: string;
  user_id: string;
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  installment_amount: number;
  installment_period: number;
  start_date: string;
  due_date: string;
  status: 'active' | 'completed' | 'overdue' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DeletedInstallment {
  id: string;
  user_id: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  installment_amount: number;
  start_date: string;
  deleted_at: string;
  created_at: string;
}

export interface InstallmentPayment {
  id: string;
  installment_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  notes?: string;
  created_at: string;
}

class InstallmentsManager {
  async getInstallments(): Promise<Installment[]> {
    try {
      const { data, error } = await supabase
        .from('installments')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Installment[] || [];
    } catch (error) {
      console.error('Error fetching installments:', error);
      return [];
    }
  }

  async addInstallment(installmentData: InstallmentData): Promise<boolean> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const remainingAmount = installmentData.totalAmount;
      
      const { error } = await supabase
        .from('installments')
        .insert({
          user_id: user.user.id,
          customer_name: installmentData.customerName,
          customer_phone: installmentData.customerPhone,
          total_amount: installmentData.totalAmount,
          paid_amount: 0,
          remaining_amount: remainingAmount,
          installment_amount: installmentData.installmentAmount,
          installment_period: installmentData.installmentPeriod,
          start_date: installmentData.startDate,
          due_date: installmentData.dueDate,
          status: 'active',
          notes: installmentData.notes
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error adding installment:', error);
      return false;
    }
  }

  async updateInstallment(id: string, installmentData: Partial<InstallmentData>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('installments')
        .update({
          customer_name: installmentData.customerName,
          customer_phone: installmentData.customerPhone,
          total_amount: installmentData.totalAmount,
          installment_amount: installmentData.installmentAmount,
          start_date: installmentData.startDate,
          due_date: installmentData.dueDate,
          notes: installmentData.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating installment:', error);
      return false;
    }
  }

  async deleteInstallment(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('installments')
        .update({ 
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting installment:', error);
      return false;
    }
  }

  async addPayment(installmentId: string, paymentData: PaymentData): Promise<boolean> {
    try {
      // إضافة الدفعة
      const { error: paymentError } = await supabase
        .from('installment_payments')
        .insert({
          installment_id: installmentId,
          amount: paymentData.amount,
          payment_date: paymentData.date,
          payment_method: paymentData.paymentMethod,
          notes: paymentData.notes
        });

      if (paymentError) throw paymentError;

      // تحديث مبلغ القسط المدفوع والمتبقي
      const { data: installment, error: getError } = await supabase
        .from('installments')
        .select('paid_amount, total_amount')
        .eq('id', installmentId)
        .single();

      if (getError) throw getError;

      const newPaidAmount = installment.paid_amount + paymentData.amount;
      const newRemainingAmount = installment.total_amount - newPaidAmount;
      const newStatus = newRemainingAmount <= 0 ? 'completed' : 'active';

      const { error: updateError } = await supabase
        .from('installments')
        .update({
          paid_amount: newPaidAmount,
          remaining_amount: newRemainingAmount,
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', installmentId);

      if (updateError) throw updateError;
      return true;
    } catch (error) {
      console.error('Error adding payment:', error);
      return false;
    }
  }

  async getInstallmentPayments(installmentId: string): Promise<InstallmentPayment[]> {
    try {
      const { data, error } = await supabase
        .from('installment_payments')
        .select('*')
        .eq('installment_id', installmentId)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payments:', error);
      return [];
    }
  }

  async getOverdueInstallments(): Promise<Installment[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('installments')
        .select('*')
        .lt('due_date', today)
        .eq('status', 'active')
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data as Installment[] || [];
    } catch (error) {
      console.error('Error fetching overdue installments:', error);
      return [];
    }
  }

  async getInstallmentsDueSoon(days: number = 7): Promise<Installment[]> {
    try {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + days);
      
      const todayStr = today.toISOString().split('T')[0];
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('installments')
        .select('*')
        .gte('due_date', todayStr)
        .lte('due_date', futureDateStr)
        .eq('status', 'active')
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data as Installment[] || [];
    } catch (error) {
      console.error('Error fetching installments due soon:', error);
      return [];
    }
  }

  async getInstallmentsByCustomer(customerId: string): Promise<Installment[]> {
    try {
      const { data, error } = await supabase
        .from('installments')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Installment[] || [];
    } catch (error) {
      console.error('Error fetching customer installments:', error);
      return [];
    }
  }

  async getInstallmentStatistics() {
    try {
      const installments = await this.getInstallments();
      const overdue = await this.getOverdueInstallments();
      const dueSoon = await this.getInstallmentsDueSoon();

      const totalAmount = installments.reduce((sum, inst) => sum + inst.total_amount, 0);
      const paidAmount = installments.reduce((sum, inst) => sum + inst.paid_amount, 0);
      const remainingAmount = installments.reduce((sum, inst) => sum + inst.remaining_amount, 0);

      return {
        total: installments.length,
        active: installments.filter(i => i.status === 'active').length,
        completed: installments.filter(i => i.status === 'completed').length,
        overdue: overdue.length,
        dueSoon: dueSoon.length,
        totalAmount,
        paidAmount,
        remainingAmount,
        overdueAmount: overdue.reduce((sum, inst) => sum + inst.remaining_amount, 0)
      };
    } catch (error) {
      console.error('Error calculating installment statistics:', error);
      return {
        total: 0,
        active: 0,
        completed: 0,
        overdue: 0,
        dueSoon: 0,
        totalAmount: 0,
        paidAmount: 0,
        remainingAmount: 0,
        overdueAmount: 0
      };
    }
  }

  async getDeletedInstallments(): Promise<DeletedInstallment[]> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .rpc('get_deleted_installments', { 
          p_user_id: user.user.id,
          p_days_back: 30
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching deleted installments:', error);
      return [];
    }
  }

  async restoreAllDeletedInstallments(): Promise<boolean> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .rpc('restore_deleted_installments', { 
          p_user_id: user.user.id,
          p_days_back: 30
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error restoring deleted installments:', error);
      return false;
    }
  }

  async restoreInstallment(id: string): Promise<boolean> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .rpc('restore_single_installment', { 
          p_user_id: user.user.id,
          p_installment_id: id
        });

      if (error) throw error;
      return data?.[0]?.success || false;
    } catch (error) {
      console.error('Error restoring installment:', error);
      return false;
    }
  }

  async permanentlyDeleteInstallment(id: string): Promise<boolean> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .rpc('permanently_delete_installment', { 
          p_user_id: user.user.id,
          p_installment_id: id
        });

      if (error) throw error;
      return data?.[0]?.success || false;
    } catch (error) {
      console.error('Error permanently deleting installment:', error);
      return false;
    }
  }

  syncWithCashFlow() {
    // مزامنة مع نظام التدفق النقدي
    console.log('Syncing installments with cash flow...');
  }
}

export const installmentsManager = new InstallmentsManager();