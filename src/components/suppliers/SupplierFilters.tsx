import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Filter, X, SortAsc, SortDesc } from 'lucide-react';

interface SupplierFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  riskFilter: string;
  onRiskFilterChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (value: 'asc' | 'desc') => void;
  suppliers: any[];
  onClearFilters: () => void;
  className?: string;
}

export function SupplierFilters({
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  statusFilter,
  onStatusChange,
  riskFilter,
  onRiskFilterChange,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange,
  suppliers,
  onClearFilters,
  className
}: SupplierFiltersProps) {
  
  // استخراج التصنيفات المتاحة من البيانات
  const availableCategories = [...new Set(suppliers.map(s => s.category).filter(Boolean))];
  
  // حساب عدد الفلاتر النشطة
  const activeFilters = [
    searchTerm,
    categoryFilter !== 'all' ? categoryFilter : null,
    statusFilter !== 'all' ? statusFilter : null,
    riskFilter !== 'all' ? riskFilter : null
  ].filter(Boolean).length;

  const sortOptions = [
    { value: 'name', label: 'الاسم' },
    { value: 'totalPurchases', label: 'إجمالي المشتريات' },
    { value: 'rating', label: 'التقييم' },
    { value: 'joinDate', label: 'تاريخ الانضمام' },
    { value: 'lastPurchaseDate', label: 'آخر شراء' }
  ];

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* الصف الأول - البحث والفلاتر الأساسية */}
          <div className="flex flex-wrap gap-4">
            {/* البحث */}
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="البحث في الموردين (الاسم، البريد، الهاتف...)"
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-9 font-cairo"
                />
              </div>
            </div>

            {/* فلتر الحالة */}
            <Select value={statusFilter} onValueChange={onStatusChange}>
              <SelectTrigger className="w-40">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-cairo">جميع الحالات</SelectItem>
                <SelectItem value="active" className="font-cairo">نشط</SelectItem>
                <SelectItem value="inactive" className="font-cairo">غير نشط</SelectItem>
                <SelectItem value="pending" className="font-cairo">معلق</SelectItem>
              </SelectContent>
            </Select>

            {/* فلتر التصنيف */}
            <Select value={categoryFilter} onValueChange={onCategoryChange}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="التصنيف" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-cairo">جميع التصنيفات</SelectItem>
                {availableCategories.map((category) => (
                  <SelectItem key={category} value={category} className="font-cairo">
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* فلتر مستوى المخاطر */}
            <Select value={riskFilter} onValueChange={onRiskFilterChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="المخاطر" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-cairo">جميع المستويات</SelectItem>
                <SelectItem value="low" className="font-cairo">منخفض</SelectItem>
                <SelectItem value="medium" className="font-cairo">متوسط</SelectItem>
                <SelectItem value="high" className="font-cairo">مرتفع</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* الصف الثاني - الترتيب وإزالة الفلاتر */}
          <div className="flex flex-wrap items-center gap-4">
            {/* خيارات الترتيب */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">ترتيب حسب:</span>
              <Select value={sortBy} onValueChange={onSortChange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map(option => (
                    <SelectItem key={option.value} value={option.value} className="font-cairo">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3"
              >
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
            </div>

            {/* عداد الفلاتر النشطة */}
            {activeFilters > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-cairo">
                  {activeFilters} فلتر نشط
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearFilters}
                  className="h-auto p-1 font-cairo"
                >
                  <X className="h-4 w-4 mr-1" />
                  مسح الكل
                </Button>
              </div>
            )}

            <div className="flex-1" /> {/* Spacer */}
            
            {/* إحصائيات النتائج */}
            <div className="text-sm text-muted-foreground font-cairo">
              {suppliers.length} مورد
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}