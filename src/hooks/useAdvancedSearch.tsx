import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: 'customer' | 'product' | 'invoice' | 'supplier' | 'employee' | 'page';
  path: string;
  icon?: string;
  data?: any;
}

interface SearchFilters {
  type?: string;
  category?: string;
}

// Fuzzy search algorithm
const fuzzySearch = (query: string, text: string): number => {
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  
  if (textLower.includes(queryLower)) return 100;
  
  let score = 0;
  let queryIndex = 0;
  
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      score += 1;
      queryIndex++;
    }
  }
  
  return queryIndex === queryLower.length ? score / query.length * 50 : 0;
};

// Sample data - في التطبيق الحقيقي، ستأتي من قاعدة البيانات
const getSampleData = (): SearchResult[] => [
  // صفحات النظام فقط
  { id: '1', title: 'العملاء', type: 'page', path: '/sales/customers', icon: '👥' },
  { id: '2', title: 'المنتجات', type: 'page', path: '/inventory/products', icon: '📦' },
  { id: '3', title: 'فواتير المبيعات', type: 'page', path: '/sales/invoices', icon: '🧾' },
  { id: '4', title: 'فواتير المشتريات', type: 'page', path: '/purchases/invoices', icon: '📑' },
  { id: '5', title: 'المورّدين', type: 'page', path: '/purchases/suppliers', icon: '🏢' },
  { id: '6', title: 'المصروفات', type: 'page', path: '/expenses', icon: '💸' },
  { id: '7', title: 'الأقساط', type: 'page', path: '/installments', icon: '💳' },
  { id: '8', title: 'الشيكات', type: 'page', path: '/checks', icon: '📋' },
  { id: '9', title: 'الصندوق', type: 'page', path: '/cash-register', icon: '💰' },
  { id: '10', title: 'تقارير المبيعات', type: 'page', path: '/reports/sales', icon: '📊' },
  { id: '11', title: 'تقارير المشتريات', type: 'page', path: '/reports/purchases', icon: '📈' },
  { id: '12', title: 'تقارير المخزون', type: 'page', path: '/reports/inventory', icon: '📉' },
  { id: '13', title: 'الموظفين', type: 'page', path: '/employees', icon: '👨‍💼' },
  { id: '14', title: 'المرتبات', type: 'page', path: '/payroll', icon: '💵' },
  { id: '15', title: 'الباركود', type: 'page', path: '/inventory/barcode', icon: '📱' },
  { id: '16', title: 'الإعدادات', type: 'page', path: '/settings', icon: '⚙️' },
];

export const useAdvancedSearch = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({});
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const sampleData = useMemo(() => getSampleData(), []);

  const filteredResults = useMemo(() => {
    if (!query.trim()) return [];

    let results = sampleData;

    // تطبيق فلاتر النوع
    if (filters.type) {
      results = results.filter(item => item.type === filters.type);
    }

    // البحث الضبابي
    const searchResults = results
      .map(item => ({
        ...item,
        score: Math.max(
          fuzzySearch(query, item.title),
          fuzzySearch(query, item.subtitle || "")
        )
      }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8); // أقصى 8 نتائج

    return searchResults;
  }, [query, filters, sampleData]);

  const handleSelectResult = (result: SearchResult) => {
    navigate(result.path);
    setQuery("");
    setIsOpen(false);
    setSelectedIndex(0);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredResults[selectedIndex]) {
          handleSelectResult(filteredResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setQuery("");
        setSelectedIndex(0);
        break;
    }
  };

  // اختصار لوحة المفاتيح
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        // التركيز على حقل البحث
        setTimeout(() => {
          const searchInput = document.getElementById('advanced-search-input');
          if (searchInput) {
            searchInput.focus();
          }
        }, 100);
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, filteredResults, selectedIndex]);

  return {
    query,
    setQuery,
    filters,
    setFilters,
    filteredResults,
    isOpen,
    setIsOpen,
    selectedIndex,
    setSelectedIndex,
    handleSelectResult,
  };
};