import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { cn } from '@/lib/utils';

interface VirtualScrollItem {
  id: string;
  [key: string]: any;
}

interface VirtualScrollProps<T extends VirtualScrollItem> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number, isVisible?: boolean) => React.ReactNode;
  searchQuery?: string;
  filterFn?: (item: T, query: string) => boolean;
  sortFn?: (a: T, b: T) => number;
  className?: string;
  emptyMessage?: string;
  loadingMessage?: string;
  isLoading?: boolean;
  onItemClick?: (item: T, index: number) => void;
  overscan?: number;
}

// Default filter function
const defaultFilterFn = <T extends VirtualScrollItem>(item: T, query: string): boolean => {
  const searchableFields = Object.values(item).filter(
    value => typeof value === 'string' || typeof value === 'number'
  );
  
  return searchableFields.some(field => 
    String(field).toLowerCase().includes(query.toLowerCase())
  );
};

function VirtualScrollOptimized<T extends VirtualScrollItem>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  searchQuery = '',
  filterFn = defaultFilterFn,
  sortFn,
  className,
  emptyMessage = 'لا توجد عناصر',
  loadingMessage = 'جاري التحميل...',
  isLoading = false,
  onItemClick,
  overscan = 5,
}: VirtualScrollProps<T>) {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });
  const listRef = useRef<List>(null);

  // تصفية وترتيب العناصر
  const processedItems = useMemo(() => {
    let filtered = items;

    // تطبيق البحث
    if (searchQuery.trim()) {
      filtered = items.filter(item => filterFn(item, searchQuery));
    }

    // تطبيق الترتيب
    if (sortFn) {
      filtered = [...filtered].sort(sortFn);
    }

    return filtered;
  }, [items, searchQuery, filterFn, sortFn]);

  // تتبع العناصر المرئية
  const handleItemsRendered = useCallback(({ visibleStartIndex, visibleStopIndex }: {
    visibleStartIndex: number;
    visibleStopIndex: number;
  }) => {
    setVisibleRange({ start: visibleStartIndex, end: visibleStopIndex });
  }, []);

  // مكون العنصر المحسن
  const ItemComponent = memo(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = processedItems[index];
    const isVisible = index >= visibleRange.start && index <= visibleRange.end;

    const handleClick = useCallback(() => {
      onItemClick?.(item, index);
    }, [item, index]);

    return (
      <div 
        style={style} 
        className={cn(
          "flex items-center px-4",
          onItemClick && "cursor-pointer hover:bg-accent"
        )}
        onClick={onItemClick ? handleClick : undefined}
      >
        {renderItem(item, index, isVisible)}
      </div>
    );
  }, (prevProps, nextProps) => {
    return prevProps.index === nextProps.index && 
           JSON.stringify(prevProps.style) === JSON.stringify(nextProps.style);
  });

  // التمرير إلى عنصر محدد
  const scrollToItem = useCallback((index: number, align: 'start' | 'center' | 'end' = 'center') => {
    listRef.current?.scrollToItem(index, align);
  }, []);

  // التمرير إلى أعلى
  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToItem(0, 'start');
  }, []);

  if (isLoading) {
    return (
      <div 
        className={cn("flex items-center justify-center", className)}
        style={{ height: containerHeight }}
      >
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-muted-foreground">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  if (processedItems.length === 0) {
    return (
      <div 
        className={cn("flex items-center justify-center", className)}
        style={{ height: containerHeight }}
      >
        <div className="text-center text-muted-foreground">
          <div className="text-4xl mb-2">📭</div>
          <p>{emptyMessage}</p>
          {searchQuery && (
            <p className="text-sm mt-1">
              لا توجد نتائج لـ "{searchQuery}"
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <List
        ref={listRef}
        height={containerHeight}
        width="100%"
        itemCount={processedItems.length}
        itemSize={itemHeight}
        onItemsRendered={handleItemsRendered}
        overscanCount={overscan}
        className="scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
      >
        {ItemComponent}
      </List>
      
      {/* معلومات إضافية */}
      <div className="flex items-center justify-between px-4 py-2 text-xs text-muted-foreground border-t">
        <span>
          عرض {visibleRange.start + 1}-{Math.min(visibleRange.end + 1, processedItems.length)} من {processedItems.length}
        </span>
        {searchQuery && (
          <span>
            نتائج البحث: "{searchQuery}"
          </span>
        )}
      </div>
    </div>
  );
}

// HOC لتبسيط الاستخدام مع الجداول
export const withVirtualScroll = <T extends VirtualScrollItem>(
  Component: React.ComponentType<{ items: T[]; onItemClick?: (item: T, index: number) => void }>
) => {
  return memo((props: any) => {
    const { items, itemHeight = 60, containerHeight = 400, ...rest } = props;
    
    return (
      <VirtualScrollOptimized
        items={items}
        itemHeight={itemHeight}
        containerHeight={containerHeight}
        renderItem={(item, index) => (
          <Component items={[item]} {...rest} />
        )}
        {...rest}
      />
    );
  });
};

export default VirtualScrollOptimized;