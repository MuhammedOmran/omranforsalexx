import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { SupabaseProduct } from '@/types/supabase-types';
import { logger } from '@/utils/logger';

export function useSupabaseProducts() {
  const [products, setProducts] = useState<SupabaseProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useSupabaseAuth();

  useEffect(() => {
    if (user) {
      fetchProducts();
    } else {
      setProducts([]);
      setLoading(false);
    }
  }, [user]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // جلب المنتجات النشطة للمستخدم
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const productsData = data || [];

      // Auto-fix invalid product codes like PRDNaN or missing codes
      const codePattern = /^PRD\d+$/;
      let maxNumber = productsData
        .map(p => (typeof p.code === 'string' && codePattern.test(p.code) ? parseInt(p.code.replace(/\D/g, ''), 10) : 0))
        .reduce((a, b) => Math.max(a, b), 0);

      const invalids = productsData.filter(p => !p.code || p.code === 'PRDNaN' || !codePattern.test(String(p.code)));
      if (invalids.length > 0 && user?.id) {
        const updates = invalids.map(p => ({ id: p.id, code: `PRD${(++maxNumber).toString().padStart(3, '0')}` }));
        await Promise.all(
          updates.map(u =>
            supabase
              .from('products')
              .update({ code: u.code })
              .eq('id', u.id)
              .eq('user_id', user.id)
          )
        );
        // Apply updated codes locally without a second fetch
        updates.forEach(u => {
          const idx = productsData.findIndex(p => p.id === u.id);
          if (idx !== -1) productsData[idx].code = u.code;
        });
      }

      setProducts(productsData);
      logger.info('تم جلب المنتجات من Supabase بنجاح', { count: productsData.length }, 'useSupabaseProducts');
    } catch (error) {
      logger.error('خطأ في جلب المنتجات من Supabase', error, 'useSupabaseProducts');
      setError(error instanceof Error ? error.message : 'خطأ غير معروف');
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (productData: Omit<SupabaseProduct, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      throw new Error('المستخدم غير مسجل الدخول');
    }

    try {
      // Check for existing active product with same name
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', productData.name)
        .eq('is_active', true);

      if (existingProduct && existingProduct.length > 0) {
        throw new Error('يوجد منتج بنفس الاسم بالفعل');
      }

      // Generate sequential product code if not provided
      let finalProductData = { ...productData };
      if (!productData.code) {
        const { data: lastCodeRow } = await supabase
          .from('products')
          .select('code')
          .eq('user_id', user.id)
          .ilike('code', 'PRD%')
          .order('code', { ascending: false })
          .limit(1)
          .maybeSingle();

        const lastNum = lastCodeRow?.code ? parseInt(String(lastCodeRow.code).replace(/\D/g, ''), 10) : 0;
        const nextNumber = isNaN(lastNum) ? 1 : lastNum + 1;
        finalProductData.code = `PRD${nextNumber.toString().padStart(3, '0')}`;
      }

      const { data, error } = await supabase
        .from('products')
        .insert([
          {
            ...finalProductData,
            user_id: user.id,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setProducts(prev => [...prev, data]);
      logger.info('تم إنشاء منتج جديد في Supabase', { productId: data.id }, 'useSupabaseProducts');
      return data;
    } catch (error) {
      logger.error('خطأ في إنشاء منتج في Supabase', error, 'useSupabaseProducts');
      throw error;
    }
  };

  const updateProduct = async (id: string, updates: Partial<SupabaseProduct>) => {
    if (!user) {
      throw new Error('المستخدم غير مسجل الدخول');
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProducts(prev => prev.map(p => p.id === id ? data : p));
      logger.info('تم تحديث منتج في Supabase', { productId: id }, 'useSupabaseProducts');
      return data;
    } catch (error) {
      logger.error('خطأ في تحديث منتج في Supabase', error, 'useSupabaseProducts');
      throw error;
    }
  };

  const deleteProduct = async (id: string) => {
    if (!user) {
      throw new Error('المستخدم غير مسجل الدخول');
    }

    try {
      // First get the product to check if there are duplicates
      const { data: productToDelete } = await supabase
        .from('products')
        .select('name')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (productToDelete) {
        // Check if there's already an inactive product with the same name
        const { data: existingInactive } = await supabase
          .from('products')
          .select('id')
          .eq('user_id', user.id)
          .eq('name', productToDelete.name)
          .eq('is_active', false)
          .neq('id', id);

        // If there's already an inactive product with the same name, do permanent delete
        if (existingInactive && existingInactive.length > 0) {
          const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

          if (error) throw error;
        } else {
          // Otherwise do soft delete
          const { error } = await supabase
            .from('products')
            .update({ is_active: false })
            .eq('id', id)
            .eq('user_id', user.id);

          if (error) throw error;
        }
      }

      // حذف المعاملات المالية المرتبطة بهذا المنتج من الصندوق
      try {
        const { error: cashError } = await supabase
          .from('cash_transactions')
          .update({ deleted_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('reference_id', id)
          .eq('reference_type', 'product_inventory');

        if (cashError) {
          console.error('خطأ في حذف معاملات الصندوق:', cashError);
        }
      } catch (error) {
        console.error('خطأ في ربط حذف المنتج بالصندوق:', error);
      }

      setProducts(prev => prev.filter(p => p.id !== id));
      logger.info('تم حذف منتج من Supabase', { productId: id }, 'useSupabaseProducts');
    } catch (error) {
      logger.error('خطأ في حذف منتج من Supabase', error, 'useSupabaseProducts');
      throw error;
    }
  };

  const fetchDeletedProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', false)
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      logger.info('تم جلب المنتجات المحذوفة من Supabase بنجاح', { count: data?.length }, 'useSupabaseProducts');
      return data || [];
    } catch (error) {
      logger.error('خطأ في جلب المنتجات المحذوفة من Supabase', error, 'useSupabaseProducts');
      setError(error instanceof Error ? error.message : 'خطأ غير معروف');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const restoreProduct = async (id: string) => {
    if (!user) {
      throw new Error('المستخدم غير مسجل الدخول');
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .update({ is_active: true })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProducts(prev => [...prev, data]);
      logger.info('تم استعادة منتج في Supabase', { productId: id }, 'useSupabaseProducts');
      return data;
    } catch (error) {
      logger.error('خطأ في استعادة منتج في Supabase', error, 'useSupabaseProducts');
      throw error;
    }
  };

  const permanentDeleteProduct = async (id: string) => {
    if (!user) {
      throw new Error('المستخدم غير مسجل الدخول');
    }

    try {
      // حذف المعاملات المالية المرتبطة بهذا المنتج من الصندوق نهائياً
      try {
        const { error: cashError } = await supabase
          .from('cash_transactions')
          .delete()
          .eq('user_id', user.id)
          .eq('reference_id', id)
          .eq('reference_type', 'product_inventory');

        if (cashError) {
          console.error('خطأ في حذف معاملات الصندوق نهائياً:', cashError);
        }
      } catch (error) {
        console.error('خطأ في ربط الحذف النهائي للمنتج بالصندوق:', error);
      }

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        .eq('is_active', false); // فقط حذف المنتجات المحذوفة مسبقاً

      if (error) throw error;

      logger.info('تم الحذف النهائي للمنتج من Supabase', { productId: id }, 'useSupabaseProducts');
    } catch (error) {
      logger.error('خطأ في الحذف النهائي للمنتج من Supabase', error, 'useSupabaseProducts');
      throw error;
    }
  };

  const permanentDeleteAllProducts = async () => {
    if (!user) {
      logger.warn('محاولة حذف نهائي لجميع المنتجات بدون تسجيل دخول', {}, 'useSupabaseProducts');
      throw new Error('يجب تسجيل الدخول');
    }

    try {
      setLoading(true);

      // حذف جميع المنتجات غير النشطة (المحذوفة) نهائياً
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('user_id', user.id)
        .eq('is_active', false);

      if (error) throw error;

      logger.info('تم الحذف النهائي لجميع المنتجات المحذوفة من Supabase', {}, 'useSupabaseProducts');
    } catch (error) {
      logger.error('خطأ في الحذف النهائي لجميع المنتجات من Supabase', error, 'useSupabaseProducts');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshProducts = () => {
    if (user) {
      fetchProducts();
    }
  };

  return {
    products,
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    refreshProducts,
    fetchDeletedProducts,
    restoreProduct,
    permanentDeleteProduct,
    permanentDeleteAllProducts,
  };
}