import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { advancedNotificationService } from '@/services/AdvancedNotificationService';
import { logger } from '@/utils/logger';

export function InventoryNotificationMonitor() {
  const { user } = useSupabaseAuth();

  useEffect(() => {
    if (!user) return;

    // مراقبة تغييرات المنتجات في الوقت الفعلي
    const channel = supabase
      .channel('products_stock_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          const updatedProduct = payload.new;
          const oldProduct = payload.old;
          
          // التحقق من تغيير الكمية
          if (updatedProduct.stock !== oldProduct.stock && updatedProduct.is_active) {
            await checkProductStockLevel(updatedProduct);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'products',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          const newProduct = payload.new;
          
          if (newProduct.is_active) {
            await checkProductStockLevel(newProduct);
          }
        }
      )
      .subscribe();

    // فحص المخزون عند بدء التشغيل
    checkAllProductsStock();

    // فحص دوري كل 10 دقائق
    const interval = setInterval(checkAllProductsStock, 10 * 60 * 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [user]);

  // فحص جميع المنتجات
  const checkAllProductsStock = async () => {
    if (!user) return;

    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, code, stock, min_stock, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) {
        logger.error('خطأ في جلب المنتجات للفحص:', error, 'InventoryNotificationMonitor');
        return;
      }

      if (!products || products.length === 0) {
        logger.info('لا توجد منتجات نشطة للفحص', {}, 'InventoryNotificationMonitor');
        return;
      }

      logger.info(`فحص ${products.length} منتج للمخزون`, {}, 'InventoryNotificationMonitor');

      for (const product of products) {
        await checkProductStockLevel(product);
      }
    } catch (error) {
      logger.error('خطأ في فحص المخزون:', error, 'InventoryNotificationMonitor');
    }
  };

  // فحص مستوى المخزون لمنتج واحد
  const checkProductStockLevel = async (product: any) => {
    if (!user) return;

    try {
      const currentStock = product.stock || 0;
      const minStock = product.min_stock || 5;

      logger.debug(`فحص المنتج: ${product.name}, المخزون: ${currentStock}, الحد الأدنى: ${minStock}`, 
        { productId: product.id, stock: currentStock, minStock }, 'InventoryNotificationMonitor');

      // مخزون منتهي تماماً
      if (currentStock === 0) {
        logger.warn(`المنتج ${product.name} نفد من المخزون`, { productId: product.id }, 'InventoryNotificationMonitor');
        
        await advancedNotificationService.notifyLowStock({
          id: product.id,
          product_id: product.id,
          product_name: product.name,
          product_code: product.code,
          stock: currentStock,
          min_stock: minStock
        }, user.id);
      }
      
      // مخزون منخفض (أقل من أو يساوي الحد الأدنى)
      else if (currentStock <= minStock && currentStock > 0) {
        logger.warn(`المنتج ${product.name} مخزونه منخفض: ${currentStock}/${minStock}`, 
          { productId: product.id, currentStock, minStock }, 'InventoryNotificationMonitor');
          
        await advancedNotificationService.notifyLowStock({
          id: product.id,
          product_id: product.id,
          product_name: product.name,
          product_code: product.code,
          stock: currentStock,
          min_stock: minStock
        }, user.id);
      }
      
      // مخزون آمن
      else if (currentStock > minStock) {
        logger.debug(`المنتج ${product.name} مخزونه آمن: ${currentStock}/${minStock}`, 
          { productId: product.id, currentStock, minStock }, 'InventoryNotificationMonitor');
      }
    } catch (error) {
      logger.error(`خطأ في فحص مخزون المنتج ${product.name}:`, error, 'InventoryNotificationMonitor');
    }
  };

  // هذا المكون لا يعرض واجهة مستخدم، فقط يعمل في الخلفية
  return null;
}