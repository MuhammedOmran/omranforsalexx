import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Calendar as CalendarIcon, X, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export interface FilterState {
  searchTerm: string;
  status: string;
  reason: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  customerName: string;
  productName: string;
  amountRange: { min: number; max: number };
}

interface ReturnsAdvancedFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  totalResults: number;
  isLoading?: boolean;
}

export function ReturnsAdvancedFilters({
  filters,
  onFiltersChange,
  onApplyFilters,
  onClearFilters,
  totalResults,
  isLoading = false
}: ReturnsAdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.status && filters.status !== 'all') count++;
    if (filters.reason && filters.reason !== 'all') count++;
    if (filters.dateFrom || filters.dateTo) count++;
    if (filters.customerName) count++;
    if (filters.productName) count++;
    if (filters.amountRange.min > 0 || filters.amountRange.max > 0) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            المرشحات والبحث المتقدم
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="animate-scale-in">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {totalResults} نتيجة
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="hover-scale"
            >
              {isExpanded ? 'إخفاء' : 'توسيع'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* بحث سريع */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث في المرتجعات (رقم المرتجع، اسم العميل، المنتج...)"
            value={filters.searchTerm}
            onChange={(e) => updateFilter('searchTerm', e.target.value)}
            className="pl-10 animate-fade-in"
            onKeyPress={(e) => e.key === 'Enter' && onApplyFilters()}
          />
        </div>

        {/* مرشحات سريعة */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
            <SelectTrigger className="animate-fade-in">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="pending">معلق</SelectItem>
              <SelectItem value="processed">تمت المعالجة</SelectItem>
              <SelectItem value="rejected">مرفوض</SelectItem>
              <SelectItem value="refunded">مُسترد</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.reason} onValueChange={(value) => updateFilter('reason', value)}>
            <SelectTrigger className="animate-fade-in">
              <SelectValue placeholder="سبب الإرجاع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأسباب</SelectItem>
              <SelectItem value="defective">منتج معيب</SelectItem>
              <SelectItem value="wrong_item">منتج خطأ</SelectItem>
              <SelectItem value="damaged">منتج تالف</SelectItem>
              <SelectItem value="customer_change">تغيير رأي</SelectItem>
              <SelectItem value="other">أخرى</SelectItem>
            </SelectContent>
          </Select>

          {/* فترة زمنية - من */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start animate-fade-in">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateFrom ? format(filters.dateFrom, "PPP", { locale: ar }) : "من تاريخ"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 animate-scale-in">
              <Calendar
                mode="single"
                selected={filters.dateFrom}
                onSelect={(date) => updateFilter('dateFrom', date)}
                locale={ar}
              />
            </PopoverContent>
          </Popover>

          {/* فترة زمنية - إلى */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start animate-fade-in">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateTo ? format(filters.dateTo, "PPP", { locale: ar }) : "إلى تاريخ"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 animate-scale-in">
              <Calendar
                mode="single"
                selected={filters.dateTo}
                onSelect={(date) => updateFilter('dateTo', date)}
                locale={ar}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* مرشحات متقدمة */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">اسم العميل</label>
                <Input
                  placeholder="ابحث بواسطة اسم العميل"
                  value={filters.customerName}
                  onChange={(e) => updateFilter('customerName', e.target.value)}
                  className="animate-fade-in"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">اسم المنتج</label>
                <Input
                  placeholder="ابحث بواسطة اسم المنتج"
                  value={filters.productName}
                  onChange={(e) => updateFilter('productName', e.target.value)}
                  className="animate-fade-in"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">الحد الأدنى للمبلغ (ر.س)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.amountRange.min || ''}
                  onChange={(e) => updateFilter('amountRange', { 
                    ...filters.amountRange, 
                    min: Number(e.target.value) || 0 
                  })}
                  className="animate-fade-in"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">الحد الأقصى للمبلغ (ر.س)</label>
                <Input
                  type="number"
                  placeholder="بدون حد أقصى"
                  value={filters.amountRange.max || ''}
                  onChange={(e) => updateFilter('amountRange', { 
                    ...filters.amountRange, 
                    max: Number(e.target.value) || 0 
                  })}
                  className="animate-fade-in"
                />
              </div>
            </div>
          </div>
        )}

        {/* أزرار التحكم */}
        <div className="flex flex-wrap gap-2 pt-4">
          <Button 
            onClick={onApplyFilters}
            disabled={isLoading}
            className="hover-scale"
          >
            {isLoading ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            تطبيق المرشحات
          </Button>
          
          {activeFiltersCount > 0 && (
            <Button 
              variant="outline" 
              onClick={onClearFilters}
              className="hover-scale"
            >
              <X className="mr-2 h-4 w-4" />
              مسح المرشحات ({activeFiltersCount})
            </Button>
          )}
        </div>

        {/* عرض المرشحات النشطة */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 animate-fade-in">
            {filters.searchTerm && (
              <Badge variant="secondary" className="gap-1">
                بحث: {filters.searchTerm}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('searchTerm', '')}
                />
              </Badge>
            )}
            {filters.status && filters.status !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                الحالة: {filters.status}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('status', 'all')}
                />
              </Badge>
            )}
            {filters.reason && filters.reason !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                السبب: {filters.reason}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('reason', 'all')}
                />
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}