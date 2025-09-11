import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Customer {
  id: string;
  name: string;
  phone?: string;
}

interface CustomerStats {
  total: number;
  active: number;
  completed: number;
  overdue: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
}

interface CustomerInstallmentsCardProps {
  customer: Customer;
  stats: CustomerStats;
  isSelected: boolean;
  onClick: () => void;
}

export const CustomerInstallmentsCard = ({ 
  customer, 
  stats, 
  isSelected, 
  onClick 
}: CustomerInstallmentsCardProps) => {
  const paymentProgress = stats.totalAmount > 0 ? (stats.paidAmount / stats.totalAmount) * 100 : 0;

  return (
    <Card 
      className={`cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-primary' : 'hover:shadow-md'
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span>{customer.name}</span>
          {stats.total > 0 && (
            <Badge variant="secondary">{stats.total}</Badge>
          )}
        </CardTitle>
        {customer.phone && (
          <CardDescription>{customer.phone}</CardDescription>
        )}
      </CardHeader>
      
      {stats.total > 0 && (
        <CardContent>
          <div className="space-y-4">
            {/* نسبة السداد */}
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span>نسبة السداد</span>
                <span>{Math.round(paymentProgress)}%</span>
              </div>
              <Progress value={paymentProgress} className="h-2" />
            </div>

            {/* الإحصائيات */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">نشط:</span>
                  <span className="text-primary">{stats.active}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">مكتمل:</span>
                  <span className="text-success">{stats.completed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">متأخر:</span>
                  <span className="text-destructive">{stats.overdue}</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">إجمالي</div>
                  <div className="font-semibold text-xs">{stats.totalAmount.toLocaleString()} ر.س</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">مدفوع</div>
                  <div className="font-semibold text-xs text-success">{stats.paidAmount.toLocaleString()} ر.س</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">متبقي</div>
                  <div className="font-semibold text-xs text-warning">{stats.remainingAmount.toLocaleString()} ر.س</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};