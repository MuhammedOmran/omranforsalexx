import { useEffect, useRef } from "react";
import { Search, Filter, X, Command } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdvancedSearch } from "@/hooks/useAdvancedSearch";

interface AdvancedSearchProps {
  placeholder?: string;
  className?: string;
}

const typeLabels = {
  'customer': 'العملاء',
  'product': 'المنتجات', 
  'invoice': 'الفواتير',
  'supplier': 'المورّدين',
  'employee': 'الموظفين',
  'page': 'الصفحات'
};

const typeColors = {
  'customer': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'product': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'invoice': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  'supplier': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  'employee': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
  'page': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
};

export function AdvancedSearch({ placeholder = "البحث في النظام...", className }: AdvancedSearchProps) {
  const {
    query,
    setQuery,
    filters,
    setFilters,
    filteredResults,
    isOpen,
    setIsOpen,
    selectedIndex,
    handleSelectResult,
  } = useAdvancedSearch();

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim() && filteredResults.length > 0) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [query, filteredResults.length, setIsOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasFilters = Object.keys(filters).some(key => filters[key as keyof typeof filters]);

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          ref={inputRef}
          id="advanced-search-input"
          placeholder={placeholder}
          className="pr-10 pl-12"
          dir="rtl"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.trim() && setIsOpen(true)}
        />
        
        {/* أيقونة الفلترة */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-6 w-6 p-0",
                  hasFilters && "text-primary"
                )}
              >
                <Filter className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="start">
              <div className="space-y-3">
                <div className="font-medium text-sm">تصفية النتائج</div>
                
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">النوع</label>
                  <Select
                    value={filters.type || "all"}
                    onValueChange={(value) => 
                      setFilters(prev => ({ ...prev, type: value === "all" ? undefined : value }))
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="جميع الأنواع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الأنواع</SelectItem>
                      {Object.entries(typeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {hasFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="w-full"
                  >
                    <X className="h-3 w-3 ml-1" />
                    مسح الفلاتر
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* مؤشر اختصار لوحة المفاتيح */}
          <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
            <Command className="h-3 w-3" />
            <span>K</span>
          </div>
        </div>
      </div>

      {/* عرض الفلاتر النشطة */}
      {hasFilters && (
        <div className="flex items-center gap-1 mt-2">
          {filters.type && (
            <Badge variant="secondary" className="text-xs">
              {typeLabels[filters.type as keyof typeof typeLabels]}
              <button
                onClick={() => setFilters(prev => ({ ...prev, type: undefined }))}
                className="mr-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* نتائج البحث */}
      {isOpen && filteredResults.length > 0 && (
        <div 
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 max-h-96 overflow-y-auto"
        >
          <div className="p-2">
            {filteredResults.map((result, index) => (
              <button
                key={result.id}
                onClick={() => handleSelectResult(result)}
                className={cn(
                  "w-full text-right p-3 rounded-md hover:bg-accent transition-colors",
                  "flex items-center gap-3",
                  selectedIndex === index && "bg-accent"
                )}
              >
                <span className="text-lg">{result.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{result.title}</div>
                  {result.subtitle && (
                    <div className="text-xs text-muted-foreground truncate">
                      {result.subtitle}
                    </div>
                  )}
                </div>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs px-2 py-1",
                    typeColors[result.type] || "bg-gray-100 text-gray-800"
                  )}
                >
                  {typeLabels[result.type]}
                </Badge>
              </button>
            ))}
          </div>
          
          {/* تلميح اختصارات لوحة المفاتيح */}
          <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground bg-muted/50">
            <div className="flex items-center justify-between">
              <span>استخدم ↑↓ للتنقل، Enter للاختيار</span>
              <span>Esc للإغلاق</span>
            </div>
          </div>
        </div>
      )}

      {/* لا توجد نتائج */}
      {isOpen && query.trim() && filteredResults.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50">
          <div className="p-4 text-center text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <div className="text-sm">لا توجد نتائج لـ "{query}"</div>
            <div className="text-xs mt-1">جرب كلمات مختلفة أو اضبط الفلاتر</div>
          </div>
        </div>
      )}
    </div>
  );
}