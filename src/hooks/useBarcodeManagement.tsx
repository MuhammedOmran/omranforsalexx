import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

export interface BarcodeProduct {
  id: string;
  name: string;
  code: string;
  barcode: string;
  price: number;
  cost: number;
  stock: number;
  category?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface BarcodeSettings {
  id: string;
  user_id: string;
  auto_generate: boolean;
  barcode_prefix: string;
  barcode_length: number;
  print_format: 'standard' | 'mini' | 'large';
  include_price: boolean;
  include_name: boolean;
  created_at: string;
  updated_at: string;
}

export function useBarcodeManagement() {
  const [products, setProducts] = useState<BarcodeProduct[]>([]);
  const [settings, setSettings] = useState<BarcodeSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useSupabaseAuth();

  // دالة إنشاء باركود جديد
  const generateBarcode = useCallback((prefix = '20', length = 13) => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const combined = prefix + timestamp.slice(-6) + random;
    return combined.slice(0, length);
  }, []);

  // جلب المنتجات مع الباركود
  const fetchBarcodeProducts = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('products')
        .select('id, name, code, barcode, price, cost, stock, category, image_url, created_at, updated_at')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // التحقق من المنتجات التي لا تحتوي على باركود وإنشاء باركود لها
      const productsWithBarcodes = await Promise.all((data || []).map(async (product) => {
        if (!product.barcode) {
          const newBarcode = generateBarcode();
          
          try {
            const { error: updateError } = await supabase
              .from('products')
              .update({ barcode: newBarcode })
              .eq('id', product.id)
              .eq('user_id', user.id);

            if (updateError) {
              logger.warn('فشل في تحديث الباركود للمنتج', { productId: product.id, error: updateError });
              return { ...product, barcode: newBarcode };
            }

            logger.info('تم إنشاء باركود جديد للمنتج', { productId: product.id, barcode: newBarcode });
            return { ...product, barcode: newBarcode };
          } catch (error) {
            logger.error('خطأ في إنشاء الباركود', error);
            return { ...product, barcode: generateBarcode() };
          }
        }
        return product;
      }));

      setProducts(productsWithBarcodes as BarcodeProduct[]);
      logger.info('تم جلب منتجات الباركود بنجاح', { count: productsWithBarcodes.length }, 'useBarcodeManagement');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
      setError(errorMessage);
      logger.error('خطأ في جلب منتجات الباركود', error, 'useBarcodeManagement');
    } finally {
      setLoading(false);
    }
  }, [user?.id, generateBarcode]);

  // جلب إعدادات الباركود
  const fetchBarcodeSettings = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('barcode_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        // إنشاء إعدادات افتراضية
        const defaultSettings: Omit<BarcodeSettings, 'id' | 'created_at' | 'updated_at'> = {
          user_id: user.id,
          auto_generate: true,
          barcode_prefix: '20',
          barcode_length: 13,
          print_format: 'standard',
          include_price: true,
          include_name: true
        };

        const { data: newSettings, error: insertError } = await supabase
          .from('barcode_settings')
          .insert(defaultSettings)
          .select()
          .single();

        if (insertError) throw insertError;
         setSettings({
           ...newSettings,
           print_format: (newSettings?.print_format === 'standard' || newSettings?.print_format === 'mini' || newSettings?.print_format === 'large')
             ? (newSettings.print_format as BarcodeSettings['print_format'])
             : 'standard'
         });
      } else {
         setSettings({
           ...data,
           print_format: (data?.print_format === 'standard' || data?.print_format === 'mini' || data?.print_format === 'large')
             ? (data.print_format as BarcodeSettings['print_format'])
             : 'standard'
         });
      }
    } catch (error) {
      logger.error('خطأ في جلب إعدادات الباركود', error, 'useBarcodeManagement');
    }
  }, [user?.id]);

  // تحديث إعدادات الباركود
  const updateBarcodeSettings = async (updates: Partial<BarcodeSettings>) => {
    if (!user?.id || !settings) return;

    try {
      const { data, error } = await supabase
        .from('barcode_settings')
        .update(updates)
        .eq('id', settings.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

       setSettings({
         ...data,
         print_format: (data?.print_format === 'standard' || data?.print_format === 'mini' || data?.print_format === 'large')
           ? (data.print_format as BarcodeSettings['print_format'])
           : 'standard'
       });
      toast({
        title: "نجح",
        description: "تم تحديث إعدادات الباركود بنجاح"
      });

      logger.info('تم تحديث إعدادات الباركود', updates, 'useBarcodeManagement');
    } catch (error) {
      logger.error('خطأ في تحديث إعدادات الباركود', error, 'useBarcodeManagement');
      throw error;
    }
  };

  // إنشاء باركود جديد لمنتج
  const generateProductBarcode = async (productId: string) => {
    if (!user?.id) return;

    try {
      const newBarcode = generateBarcode(settings?.barcode_prefix, settings?.barcode_length);

      const { error } = await supabase
        .from('products')
        .update({ barcode: newBarcode })
        .eq('id', productId)
        .eq('user_id', user.id);

      if (error) throw error;

      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, barcode: newBarcode } : p
      ));

      toast({
        title: "نجح",
        description: "تم إنشاء باركود جديد للمنتج"
      });

      logger.info('تم إنشاء باركود جديد', { productId, barcode: newBarcode }, 'useBarcodeManagement');
      return newBarcode;
    } catch (error) {
      logger.error('خطأ في إنشاء الباركود', error, 'useBarcodeManagement');
      throw error;
    }
  };

  // البحث عن منتج بالباركود
  const findProductByBarcode = useCallback((barcode: string): BarcodeProduct | null => {
    return products.find(p => p.barcode === barcode) || null;
  }, [products]);

  // تحديث بيانات منتج
  const updateProduct = async (productId: string, updates: Partial<BarcodeProduct>) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', productId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, ...data } : p
      ));

      toast({
        title: "نجح",
        description: "تم تحديث بيانات المنتج بنجاح"
      });

      logger.info('تم تحديث بيانات المنتج', { productId, updates }, 'useBarcodeManagement');
      return data;
    } catch (error) {
      logger.error('خطأ في تحديث المنتج', error, 'useBarcodeManagement');
      throw error;
    }
  };

  // إنشاء منتج جديد مع باركود
  const createProductWithBarcode = async (productData: Omit<BarcodeProduct, 'id' | 'barcode' | 'created_at' | 'updated_at'>) => {
    if (!user?.id) return;

    try {
      const barcode = generateBarcode(settings?.barcode_prefix, settings?.barcode_length);

      const { data, error } = await supabase
        .from('products')
        .insert([{
          ...productData,
          user_id: user.id,
          barcode,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      setProducts(prev => [data as BarcodeProduct, ...prev]);

      toast({
        title: "نجح",
        description: "تم إنشاء المنتج مع باركود جديد بنجاح"
      });

      logger.info('تم إنشاء منتج جديد مع باركود', { productId: data.id, barcode }, 'useBarcodeManagement');
      return data as BarcodeProduct;
    } catch (error) {
      logger.error('خطأ في إنشاء المنتج', error, 'useBarcodeManagement');
      throw error;
    }
  };

  // تصدير بيانات الباركود
  const exportBarcodeData = useCallback((selectedProducts: string[]) => {
    const selectedData = products.filter(p => selectedProducts.includes(p.id));
    
    const csvHeader = "اسم المنتج,الكود,الباركود,السعر,التكلفة,المخزون,الفئة\n";
    const csvContent = selectedData.map(product => 
      `"${product.name}","${product.code}","${product.barcode}","${product.price}","${product.cost}","${product.stock}","${product.category || ''}"`
    ).join('\n');

    const fullCsvContent = csvHeader + csvContent;
    
    const blob = new Blob(['\uFEFF' + fullCsvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `بيانات_الباركود_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logger.info('تم تصدير بيانات الباركود', { count: selectedData.length }, 'useBarcodeManagement');
  }, [products]);

  // إعادة تحميل البيانات
  const refreshData = useCallback(async () => {
    await Promise.all([
      fetchBarcodeProducts(),
      fetchBarcodeSettings()
    ]);
  }, [fetchBarcodeProducts, fetchBarcodeSettings]);

  useEffect(() => {
    if (user?.id) {
      refreshData();
    }
  }, [user?.id, refreshData]);

  return {
    products,
    settings,
    loading,
    error,
    generateBarcode,
    generateProductBarcode,
    findProductByBarcode,
    updateProduct,
    createProductWithBarcode,
    updateBarcodeSettings,
    exportBarcodeData,
    refreshData
  };
}