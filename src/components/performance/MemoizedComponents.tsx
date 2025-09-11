import { memo, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// تحسين إعادة الرندر للمكونات المتكررة

// Button محسن
export const MemoButton = memo(Button, (prevProps, nextProps) => {
  return (
    prevProps.children === nextProps.children &&
    prevProps.variant === nextProps.variant &&
    prevProps.size === nextProps.size &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.className === nextProps.className
  );
});

// Card محسن
export const MemoCard = memo(({ children, ...props }: React.ComponentProps<typeof Card>) => {
  return <Card {...props}>{children}</Card>;
});

// Badge محسن  
export const MemoBadge = memo(Badge, (prevProps, nextProps) => {
  return (
    prevProps.children === nextProps.children &&
    prevProps.variant === nextProps.variant &&
    prevProps.className === nextProps.className
  );
});

// مكون لعرض عنصر في القائمة محسن
interface ListItemProps {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  onClick?: (id: string) => void;
  isSelected?: boolean;
}

export const MemoListItem = memo<ListItemProps>(({
  id,
  title,
  subtitle,
  badge,
  onClick,
  isSelected
}) => {
  const handleClick = useCallback(() => {
    onClick?.(id);
  }, [onClick, id]);

  const itemClass = useMemo(() => {
    return `p-3 rounded-lg border transition-colors cursor-pointer ${
      isSelected 
        ? 'bg-primary/10 border-primary' 
        : 'bg-card border-border hover:bg-accent'
    }`;
  }, [isSelected]);

  return (
    <div className={itemClass} onClick={handleClick}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{title}</h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {badge && (
          <MemoBadge variant="secondary" className="text-xs">
            {badge}
          </MemoBadge>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.id === nextProps.id &&
    prevProps.title === nextProps.title &&
    prevProps.subtitle === nextProps.subtitle &&
    prevProps.badge === nextProps.badge &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.onClick === nextProps.onClick
  );
});

// مكون للإحصائيات محسن
interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
}

export const MemoStatsCard = memo<StatsCardProps>(({
  title,
  value,
  change,
  icon
}) => {
  const changeColor = useMemo(() => {
    if (!change) return 'text-muted-foreground';
    return change > 0 ? 'text-green-600' : 'text-red-600';
  }, [change]);

  const changeText = useMemo(() => {
    if (!change) return '';
    const sign = change > 0 ? '+' : '';
    return `${sign}${change}%`;
  }, [change]);

  return (
    <MemoCard>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <p className={`text-xs ${changeColor}`}>
            {changeText} من الشهر الماضي
          </p>
        )}
      </CardContent>
    </MemoCard>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.title === nextProps.title &&
    prevProps.value === nextProps.value &&
    prevProps.change === nextProps.change &&
    prevProps.icon === nextProps.icon
  );
});

MemoButton.displayName = 'MemoButton';
MemoCard.displayName = 'MemoCard';
MemoBadge.displayName = 'MemoBadge';
MemoListItem.displayName = 'MemoListItem';
MemoStatsCard.displayName = 'MemoStatsCard';