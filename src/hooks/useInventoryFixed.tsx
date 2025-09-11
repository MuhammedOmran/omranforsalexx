import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/hooks/use-toast';

// تعريف بسيط للمنتج يتطابق مع قاعدة البيانات
export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  user_id: string;
  created_at: string;
}

export const useInventoryFixed = () => {
  const [products, setProducts] = useState<Product[]>([]);
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
        return;
      }

      setProducts(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addProduct = async (productData: { name: string; price: number; stock?: number }) => {
    if (!user) return false;

    try {
      // Find last code for this user and increment
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
      const productCode = `PRD${nextNumber.toString().padStart(3, '0')}`;

      const { data, error } = await supabase
        .from('products')
        .insert({
          user_id: user.id,
          name: productData.name,
          code: productCode,
          price: productData.price,
          stock: productData.stock || 0
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding product:', error);
        return false;
      }

      toast({
        title: "نجح",
        description: "تم إضافة المنتج بنجاح"
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
    addProduct
  };
};