import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { SupabaseProduct } from "@/types/supabase-types";
import { useSupabaseProducts } from "@/hooks/useSupabaseProducts";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";

export type DisplayOption = "selling" | "purchase" | "stock";

interface ProductDisplayContextType {
  products: SupabaseProduct[];
  filteredProducts: SupabaseProduct[];
  loading: boolean;
  searchTerm: string;
  selectedCategory: string;
  displayOption: DisplayOption;
  isExporting: boolean;
  isPrintMode: boolean;
  priceRange: { min: number; max: number };
  stockRange: { min: number; max: number };
  showOutOfStock: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  setSearchTerm: (term: string) => void;
  setSelectedCategory: (category: string) => void;
  setDisplayOption: (option: DisplayOption) => void;
  setIsExporting: (isExporting: boolean) => void;
  setIsPrintMode: (isPrintMode: boolean) => void;
  setPriceRange: (range: { min: number; max: number }) => void;
  setStockRange: (range: { min: number; max: number }) => void;
  setShowOutOfStock: (show: boolean) => void;
  setSortBy: (sortBy: string) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  getCategories: () => string[];
  getStats: () => {
    totalProducts: number;
    totalValue: number;
    outOfStock: number;
  };
}

const ProductDisplayContext = createContext<ProductDisplayContextType | undefined>(undefined);

export function ProductDisplayProvider({ children }: { children: ReactNode }) {
  const { products, loading } = useSupabaseProducts();
  const { isAuthenticated } = useSupabaseAuth();
  const [filteredProducts, setFilteredProducts] = useState<SupabaseProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [displayOption, setDisplayOption] = useState<DisplayOption>("selling");
  const [isExporting, setIsExporting] = useState(false);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 100000 });
  const [stockRange, setStockRange] = useState<{ min: number; max: number }>({ min: 0, max: 1000 });
  const [showOutOfStock, setShowOutOfStock] = useState(true);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // تصفية المنتجات
  useEffect(() => {
    if (!isAuthenticated || loading) {
      setFilteredProducts([]);
      return;
    }

    let filtered = products;
    
    // البحث بالنص
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode?.includes(searchTerm) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // تصفية بالفئة
    if (selectedCategory !== "all") {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // تصفية بنطاق الأسعار
    filtered = filtered.filter(product => {
      const price = displayOption === "selling" ? product.price : product.cost;
      return price >= priceRange.min && price <= priceRange.max;
    });

    // تصفية بنطاق الكمية
    filtered = filtered.filter(product => 
      product.stock >= stockRange.min && product.stock <= stockRange.max
    );

    // إخفاء/إظهار المنتجات المنتهية من المخزن
    if (!showOutOfStock) {
      filtered = filtered.filter(product => product.stock > 0);
    }

    // الترتيب
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case "name":
          aValue = a.name;
          bValue = b.name;
          break;
        case "price":
          aValue = displayOption === "selling" ? a.price : a.cost;
          bValue = displayOption === "selling" ? b.price : b.cost;
          break;
        case "stock":
          aValue = a.stock;
          bValue = b.stock;
          break;
        case "category":
          aValue = a.category || "";
          bValue = b.category || "";
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue, 'ar')
          : bValue.localeCompare(aValue, 'ar');
      } else {
        return sortOrder === 'asc' 
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }
    });
    
    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedCategory, priceRange, stockRange, showOutOfStock, sortBy, sortOrder, displayOption, isAuthenticated, loading]);

  // الحصول على الفئات المتاحة
  const getCategories = () => {
    const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
    return categories;
  };

  // حساب الإحصائيات
  const getStats = () => {
    const totalProducts = filteredProducts.length;
    const totalValue = filteredProducts.reduce((sum, product) => {
      switch (displayOption) {
        case "selling": return sum + (product.price * product.stock);
        case "purchase": return sum + (product.cost * product.stock);
        case "stock": return sum + product.stock;
        default: return sum;
      }
    }, 0);
    
    const outOfStock = filteredProducts.filter(p => p.stock === 0).length;
    
    return { totalProducts, totalValue, outOfStock };
  };

  return (
    <ProductDisplayContext.Provider value={{ 
      products,
      filteredProducts,
      loading,
      searchTerm,
      selectedCategory,
      displayOption,
      isExporting,
      isPrintMode,
      priceRange,
      stockRange,
      showOutOfStock,
      sortBy,
      sortOrder,
      setSearchTerm,
      setSelectedCategory,
      setDisplayOption,
      setIsExporting,
      setIsPrintMode,
      setPriceRange,
      setStockRange,
      setShowOutOfStock,
      setSortBy,
      setSortOrder,
      getCategories,
      getStats
    }}>
      {children}
    </ProductDisplayContext.Provider>
  );
}

export function useProductDisplay() {
  const context = useContext(ProductDisplayContext);
  if (context === undefined) {
    throw new Error('useProductDisplay must be used within a ProductDisplayProvider');
  }
  return context;
}