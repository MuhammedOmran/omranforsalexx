// محول للتنقل بين أنواع البيانات المختلفة للمنتجات
import { Product } from "@/types/inventory";
import { SupabaseProduct } from "@/types/supabase-types";

/**
 * تحويل منتج Supabase إلى منتج محلي للتوافق مع المكونات القديمة
 */
export function supabaseProductToLocal(supabaseProduct: SupabaseProduct): Product {
  return {
    id: supabaseProduct.id,
    name: supabaseProduct.name,
    code: supabaseProduct.code,
    category: supabaseProduct.category || "",
    stock: supabaseProduct.stock,
    minStock: supabaseProduct.min_stock || 5,
    price: supabaseProduct.price,
    cost: supabaseProduct.cost,
    description: supabaseProduct.description || "",
    status: supabaseProduct.is_active ? "active" : "inactive",
    profit: supabaseProduct.price - supabaseProduct.cost,
    profitPercentage: supabaseProduct.price > 0 ? ((supabaseProduct.price - supabaseProduct.cost) / supabaseProduct.price) * 100 : 0,
    barcode: supabaseProduct.barcode || undefined,
    ownerId: supabaseProduct.user_id,
    ownerType: "company" as const, // قيمة ثابتة للتوافق
  };
}

/**
 * تحويل منتج محلي إلى منتج Supabase
 */
export function localProductToSupabase(
  localProduct: Product,
  userId: string
): Omit<SupabaseProduct, 'id' | 'created_at' | 'updated_at'> {
  return {
    user_id: userId,
    name: localProduct.name,
    code: localProduct.code,
    barcode: localProduct.barcode || undefined,
    description: localProduct.description || undefined,
    category: localProduct.category || undefined,
    price: localProduct.price,
    cost: localProduct.cost,
    stock: localProduct.stock,
    min_stock: localProduct.minStock || 5,
    max_stock: 1000, // قيمة افتراضية
    unit: "قطعة", // قيمة افتراضية
    location: undefined,
    supplier: undefined,
    image_url: undefined,
    is_active: localProduct.status === "active",
  };
}

/**
 * تحويل مصفوفة منتجات Supabase إلى منتجات محلية
 */
export function supabaseProductsToLocal(supabaseProducts: SupabaseProduct[]): Product[] {
  return supabaseProducts.map(supabaseProductToLocal);
}