import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

export interface StockMovement {
  id: string;
  user_id: string;
  product_id: string;
  product_name: string;
  movement_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  cost_per_unit?: number;
  total_cost?: number;
  reason: string;
  reference_type?: string;
  reference_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface StockAlert {
  id: string;
  product_id: string;
  product_name: string;
  current_stock: number;
  min_stock: number;
  max_stock?: number;
  alert_type: 'low_stock' | 'out_of_stock' | 'overstock';
  severity: 'low' | 'medium' | 'high';
  created_at: string;
}

export interface StockSummary {
  total_products: number;
  total_value: number;
  low_stock_count: number;
  out_of_stock_count: number;
  overstock_count: number;
  movements_today: number;
}

export function useStockManagement() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useSupabaseAuth();

  // جلب حركات المخزون
  const fetchStockMovements = useCallback(async (limit = 50) => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      setMovements((data || []).map(d => ({
        ...d,
        movement_type: (d.movement_type === 'in' || d.movement_type === 'out' || d.movement_type === 'adjustment')
          ? (d.movement_type as 'in' | 'out' | 'adjustment')
          : 'adjustment'
      })) as StockMovement[]);
      logger.info('تم جلب حركات المخزون بنجاح', { count: data?.length }, 'useStockManagement');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
      setError(errorMessage);
      logger.error('خطأ في جلب حركات المخزون', error, 'useStockManagement');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // جلب تنبيهات المخزون
  const fetchStockAlerts = useCallback(async () => {
    if (!user?.id) return;

    try {
      // الحصول على المنتجات ذات المخزون المنخفض أو المنتهي
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, stock, min_stock, max_stock')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;

      const stockAlerts: StockAlert[] = [];

      products?.forEach((product) => {
        const currentStock = product.stock || 0;
        const minStock = product.min_stock || 5;
        const maxStock = product.max_stock || 100;

        if (currentStock === 0) {
          stockAlerts.push({
            id: `alert_${product.id}`,
            product_id: product.id,
            product_name: product.name,
            current_stock: currentStock,
            min_stock: minStock,
            max_stock: maxStock,
            alert_type: 'out_of_stock',
            severity: 'high',
            created_at: new Date().toISOString()
          });
        } else if (currentStock <= minStock) {
          stockAlerts.push({
            id: `alert_${product.id}`,
            product_id: product.id,
            product_name: product.name,
            current_stock: currentStock,
            min_stock: minStock,
            max_stock: maxStock,
            alert_type: 'low_stock',
            severity: 'medium',
            created_at: new Date().toISOString()
          });
        } else if (maxStock && currentStock >= maxStock) {
          stockAlerts.push({
            id: `alert_${product.id}`,
            product_id: product.id,
            product_name: product.name,
            current_stock: currentStock,
            min_stock: minStock,
            max_stock: maxStock,
            alert_type: 'overstock',
            severity: 'low',
            created_at: new Date().toISOString()
          });
        }
      });

      setAlerts(stockAlerts);
      logger.info('تم جلب تنبيهات المخزون بنجاح', { count: stockAlerts.length }, 'useStockManagement');
    } catch (error) {
      logger.error('خطأ في جلب تنبيهات المخزون', error, 'useStockManagement');
    }
  }, [user?.id]);

  // حساب ملخص المخزون
  const calculateStockSummary = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('id, stock, min_stock, max_stock, cost')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;

      const totalProducts = products?.length || 0;
      const totalValue = products?.reduce((sum, p) => sum + (p.stock * p.cost), 0) || 0;
      const lowStockCount = products?.filter(p => (p.stock || 0) <= (p.min_stock || 5) && (p.stock || 0) > 0).length || 0;
      const outOfStockCount = products?.filter(p => (p.stock || 0) === 0).length || 0;
      const overstockCount = products?.filter(p => (p.max_stock && (p.stock || 0) >= p.max_stock)).length || 0;

      // حساب حركات اليوم
      const today = new Date().toISOString().split('T')[0];
      const { data: todayMovements, error: movementsError } = await supabase
        .from('stock_movements')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);

      if (movementsError) {
        logger.warn('خطأ في جلب حركات اليوم', movementsError, 'useStockManagement');
      }

      const summary: StockSummary = {
        total_products: totalProducts,
        total_value: totalValue,
        low_stock_count: lowStockCount,
        out_of_stock_count: outOfStockCount,
        overstock_count: overstockCount,
        movements_today: todayMovements?.length || 0
      };

      setSummary(summary);
      logger.info('تم حساب ملخص المخزون بنجاح', summary, 'useStockManagement');
    } catch (error) {
      logger.error('خطأ في حساب ملخص المخزون', error, 'useStockManagement');
    }
  }, [user?.id]);

  // إضافة حركة مخزون
  const addStockMovement = async (movement: Omit<StockMovement, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user?.id) {
      throw new Error('المستخدم غير مسجل الدخول');
    }

    try {
      // إدراج حركة المخزون
      const { data: movementData, error: movementError } = await supabase
        .from('stock_movements')
        .insert([{
          ...movement,
          user_id: user.id
        }])
        .select()
        .single();

      if (movementError) throw movementError;

      // تحديث مخزون المنتج
      const { error: updateError } = await supabase
        .from('products')
        .update({ 
          stock: movement.new_stock,
          updated_at: new Date().toISOString()
        })
        .eq('id', movement.product_id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // إضافة المعاملة المالية للمخزون
      await addInventoryCashTransaction(movement);

      setMovements(prev => [
        {
          ...movementData,
          movement_type: (movementData.movement_type === 'in' || movementData.movement_type === 'out' || movementData.movement_type === 'adjustment')
            ? (movementData.movement_type as 'in' | 'out' | 'adjustment')
            : 'adjustment'
        } as StockMovement,
        ...prev
      ]);
      
      // تحديث الملخص والتنبيهات
      await Promise.all([
        calculateStockSummary(),
        fetchStockAlerts()
      ]);

      toast({
        title: "نجح",
        description: "تم تسجيل حركة المخزون وإضافتها للصندوق بنجاح"
      });

      logger.info('تم إضافة حركة مخزون جديدة', { productId: movement.product_id }, 'useStockManagement');
      return movementData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
      setError(errorMessage);
      logger.error('خطأ في إضافة حركة المخزون', error, 'useStockManagement');
      throw error;
    }
  };

  // إضافة معاملة مالية للمخزون في الصندوق
  const addInventoryCashTransaction = async (movement: Omit<StockMovement, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const totalValue = (movement.total_cost || 0);
      if (totalValue === 0) return;

      const transactionType = movement.movement_type === 'in' ? 'expense' : 'income';
      const description = movement.movement_type === 'in' 
        ? `شراء مخزون - ${movement.product_name}` 
        : movement.movement_type === 'out'
        ? `بيع مخزون - ${movement.product_name}`
        : `تعديل مخزون - ${movement.product_name}`;

      await supabase
        .from('cash_transactions')
        .insert({
          user_id: user?.id,
          transaction_type: transactionType,
          amount: totalValue,
          description: description,
          category: 'مخزون',
          subcategory: movement.movement_type === 'in' ? 'شراء' : movement.movement_type === 'out' ? 'بيع' : 'تعديل',
          payment_method: 'cash',
          reference_type: 'stock_movement',
          reference_id: movement.product_id,
          notes: `${movement.reason} - كمية: ${movement.quantity} - ${movement.notes || ''}`,
          metadata: {
            product_id: movement.product_id,
            product_name: movement.product_name,
            movement_type: movement.movement_type,
            quantity: movement.quantity,
            cost_per_unit: movement.cost_per_unit,
            previous_stock: movement.previous_stock,
            new_stock: movement.new_stock
          }
        });

      logger.info('تم إضافة معاملة مالية للمخزون', { 
        productId: movement.product_id, 
        amount: totalValue, 
        type: transactionType 
      }, 'useStockManagement');
    } catch (error) {
      logger.error('خطأ في إضافة المعاملة المالية للمخزون', error, 'useStockManagement');
      // لا نرمي الخطأ هنا حتى لا نوقف عملية المخزون الأساسية
    }
  };

  // تعديل مخزون منتج
  const adjustStock = async (productId: string, newStock: number, reason: string, notes?: string) => {
    if (!user?.id) return;

    try {
      // الحصول على بيانات المنتج الحالية
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('name, stock, cost')
        .eq('id', productId)
        .eq('user_id', user.id)
        .single();

      if (productError) throw productError;

      const previousStock = product.stock || 0;
      const quantity = newStock - previousStock;

      await addStockMovement({
        product_id: productId,
        product_name: product.name,
        movement_type: 'adjustment',
        quantity: Math.abs(quantity),
        previous_stock: previousStock,
        new_stock: newStock,
        cost_per_unit: product.cost,
        total_cost: Math.abs(quantity) * product.cost,
        reason,
        notes
      });

      logger.info('تم تعديل مخزون المنتج', { productId, previousStock, newStock }, 'useStockManagement');
    } catch (error) {
      logger.error('خطأ في تعديل المخزون', error, 'useStockManagement');
      throw error;
    }
  };

  // إعادة تحميل جميع البيانات
  const refreshStockData = useCallback(async () => {
    await Promise.all([
      fetchStockMovements(),
      fetchStockAlerts(),
      calculateStockSummary()
    ]);
  }, [fetchStockMovements, fetchStockAlerts, calculateStockSummary]);

  useEffect(() => {
    if (user?.id) {
      refreshStockData();
    }
  }, [user?.id, refreshStockData]);

  return {
    movements,
    alerts,
    summary,
    loading,
    error,
    fetchStockMovements,
    fetchStockAlerts,
    calculateStockSummary,
    addStockMovement,
    adjustStock,
    refreshStockData
  };
}