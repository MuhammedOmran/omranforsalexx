import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  user_id: string;
  created_at: string;
  sku?: string;
  unit_price?: number;
  cost_price?: number;
  min_stock_level?: number;
  is_active?: boolean;
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  movement_type: string;
  quantity: number;
  user_id: string;
  created_at: string;
  created_by: string;
  notes?: string;
  unit_price?: number;
  total_amount?: number;
  reference_id?: string;
  reference_type?: string;
}

export interface Invoice {
  id: string;
  customer_id: string;
  total_amount: number;
  status: string;
  user_id: string;
  created_at: string;
  invoice_number?: string;
  invoice_type?: string;
  discount_amount?: number;
  tax_amount?: number;
  due_date?: string;
  notes?: string;
  payment_method?: string;
}

export const useInventory = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSupabaseAuth();

  const fetchProducts = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id);
      
      const normalized = (data || []).map((p: any) => ({
        ...p,
        unit_price: p.unit_price ?? p.price
      }));
      setProducts(normalized);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addProduct = async (productData: any) => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('products')
        .insert({
          user_id: user.id,
          name: productData.name,
          code: productData.code || `P${Date.now()}`,
          price: productData.price || productData.unit_price || 0,
          stock: productData.stock || productData.quantity || 0
        });
      
      if (!error) {
        await fetchProducts();
        return true;
      }
    } catch (error) {
      console.error('Error:', error);
    }
    return false;
  };

  useEffect(() => {
    fetchProducts();
  }, [user]);

  const [isAddingInvoice, setIsAddingInvoice] = useState(false);

  const addInvoice = async (data: any) => {
    if (!user) {
      toast.error('يجب تسجيل الدخول لحفظ الفاتورة');
      return false;
    }
    
    setIsAddingInvoice(true);
    try {
      const totalAmount = Number(data?.invoice?.net_amount ?? data?.invoice?.total_amount ?? 0) || 0;

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          user_id: user.id,
          customer_id: data?.invoice?.customer_id ?? null,
          invoice_number: `INV-${Date.now()}`,
          total_amount: totalAmount,
          status: data?.invoice?.status ?? 'unpaid'
        })
        .select()
        .single();

      if (invoiceError) {
        throw invoiceError;
      }

      if (Array.isArray(data?.items) && data.items.length > 0) {
        const itemsToInsert = data.items.map((item: any) => ({
          user_id: user.id,
          invoice_id: invoice.id,
          product_id: item.product_id,
          quantity: Number(item.quantity) || 0,
          unit_price: Number(item.unit_price) || 0,
          total_price: Number(item.total_price) || ((Number(item.quantity) || 0) * (Number(item.unit_price) || 0))
        }));

        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(itemsToInsert);

        if (itemsError) {
          throw itemsError;
        }
      }

      toast.success('تم حفظ الفاتورة بنجاح');
      return true;
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error('فشل حفظ الفاتورة، يرجى المحاولة مرة أخرى');
      return false;
    } finally {
      setIsAddingInvoice(false);
    }
  };

  return {
    products,
    loading,
    addProduct,
    fetchProducts,
    updateProduct: async () => true,
    deleteProduct: async () => true,
    addMovement: async (data: any) => true,
    addInvoice,
    isAddingProduct: false,
    isAddingMovement: false,
    isAddingInvoice,
    inventory: [],
    movements: [],
    invoices: [],
    productsLoading: loading,
    inventoryLoading: loading,
    movementsLoading: loading,
    invoicesLoading: loading
  };
};