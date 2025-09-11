import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';
import { Installment } from '@/utils/installmentsManager';
import { InstallmentItem } from './InstallmentItem';

interface InstallmentDetailsViewProps {
  installments: Installment[];
  customerName: string;
}

export const InstallmentDetailsView = ({ installments, customerName }: InstallmentDetailsViewProps) => {
  const totalAmount = installments.reduce((sum, i) => sum + i.total_amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          أقساط {customerName}
        </CardTitle>
        <CardDescription>
          عدد الأقساط: {installments.length} - 
          إجمالي المبلغ: {totalAmount.toLocaleString()} ر.س
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {installments.map((installment) => (
            <InstallmentItem key={installment.id} installment={installment} />
          ))}

          {installments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد أقساط لهذا العميل
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};