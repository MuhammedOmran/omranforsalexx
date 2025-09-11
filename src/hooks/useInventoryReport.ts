import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface InventoryReportData {
  totalProducts: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  categoryData: {
    category: string;
    total: number;
    value: number;
    color: string;
  }[];
  lowStockProducts: any[];
  products: any[];
}

export function useInventoryReport() {
  const [data, setData] = useState<InventoryReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      if (!products) {
        setData({
          totalProducts: 0,
          totalValue: 0,
          lowStockItems: 0,
          outOfStockItems: 0,
          categoryData: [],
          lowStockProducts: [],
          products: []
        });
        return;
      }

      const totalProducts = products.length;
      const totalValue = products.reduce((sum, product) => sum + (product.stock * (product.cost || 0)), 0);
      
      const lowStockProducts = products.filter(product => 
        product.stock <= (product.min_stock || 5)
      );
      
      const outOfStockProducts = products.filter(product => product.stock === 0);

      // تجميع البيانات حسب الفئة
      const categoryData: { [key: string]: { total: number, value: number } } = {};
      products.forEach(product => {
        const category = product.category || 'غير محدد';
        if (!categoryData[category]) {
          categoryData[category] = { total: 0, value: 0 };
        }
        categoryData[category].total += 1;
        categoryData[category].value += product.stock * (product.cost || 0);
      });

      const categoryDataArray = Object.entries(categoryData).map(([category, data], index) => ({
        category,
        total: data.total,
        value: data.value,
        color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'][index % 6]
      }));

      setData({
        totalProducts,
        totalValue,
        lowStockItems: lowStockProducts.length,
        outOfStockItems: outOfStockProducts.length,
        categoryData: categoryDataArray,
        lowStockProducts: lowStockProducts.slice(0, 10),
        products: products.slice(0, 20)
      });

    } catch (error) {
      console.error('خطأ في تحميل بيانات المخزون:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحميل بيانات المخزون",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  return { data, loading, refetch: fetchInventoryData };
}