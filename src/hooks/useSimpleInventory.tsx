import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/hooks/use-toast';

export interface SimpleProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  user_id: string;
  created_at: string;
}

export const useSimpleInventory = () => {
  const [products, setProducts] = useState<SimpleProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSupabaseAuth();

  const fetchProducts = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        toast({
          title: "خطأ",
          description: "فشل في جلب المنتجات",
          variant: "destructive"
        });
        return;
      }

      setProducts(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addProduct = async (productData: { name: string; price: number; stock?: number; cost?: number }) => {
    if (!user) return false;

    try {
      const cost = productData.cost || productData.price * 0.7; // تكلفة افتراضية 70% من السعر
      const stock = productData.stock || 0;

      const { data, error } = await supabase
        .from('products')
        .insert({
          user_id: user.id,
          name: productData.name,
          code: `P${Date.now()}`,
          price: productData.price,
          cost: cost,
          stock: stock
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding product:', error);
        toast({
          title: "خطأ",
          description: "فشل في إضافة المنتج",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "نجح",
        description: "تم إضافة المنتج بنجاح - تم ربط المخزون بالصندوق تلقائياً"
      });
      
      await fetchProducts();
      return true;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  const updateProduct = async (id: string, updates: Partial<SimpleProduct>) => {
    if (!user) return false;

    try {
      // تحديث المنتج مباشرة - التريجر سيتولى باقي العمل تلقائياً
      const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating product:', error);
        toast({
          title: "خطأ",
          description: "فشل في تحديث المنتج",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "نجح",
        description: "تم تحديث المنتج بنجاح - تم تحديث الصندوق تلقائياً"
      });
      
      await fetchProducts();
      return true;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  // دالة لمزامنة مخزون منتج محدد بناءً على المشتريات والمبيعات
  const syncProductStock = async (productId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase.rpc('sync_product_stock_correct', {
        p_product_id: productId
      });

      if (error) {
        console.error('Error syncing product stock:', error);
        toast({
          title: "خطأ",
          description: "فشل في مزامنة المخزون",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "نجح",
        description: "تم تصحيح المخزون بناءً على المشتريات والمبيعات"
      });
      
      await fetchProducts();
      return true;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  const deleteProduct = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting product:', error);
        toast({
          title: "خطأ",
          description: "فشل في حذف المنتج",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "نجح",
        description: "تم حذف المنتج - تم حذف المعاملات المرتبطة تلقائياً"
      });
      
      await fetchProducts();
      return true;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [user]);

  return {
    products,
    loading,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    syncProductStock
  };
};