import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Clock, TrendingUp } from 'lucide-react';
import { Installment } from '@/utils/installmentsManager';

interface InstallmentStatsCardsProps {
  installments: Installment[];
}

export const InstallmentStatsCards = ({ installments }: InstallmentStatsCardsProps) => {
  const activeCount = installments.filter(i => i.status === 'active').length;
  const completedCount = installments.filter(i => i.status === 'completed').length;
  const overdueCount = installments.filter(i => i.status === 'overdue').length;
  const totalAmount = installments.reduce((sum, i) => sum + i.total_amount, 0);

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <div className="text-sm text-muted-foreground">أقساط نشطة</div>
              <div className="text-2xl font-bold">{activeCount}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            <div>
              <div className="text-sm text-muted-foreground">أقساط مكتملة</div>
              <div className="text-2xl font-bold">{completedCount}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <div className="text-sm text-muted-foreground">أقساط متأخرة</div>
              <div className="text-2xl font-bold">{overdueCount}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <div>
              <div className="text-sm text-muted-foreground">إجمالي المبلغ</div>
              <div className="text-2xl font-bold">{totalAmount.toLocaleString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};