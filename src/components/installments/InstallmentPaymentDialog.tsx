import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { CreditCard, DollarSign } from 'lucide-react';
import { Installment, installmentsManager } from '@/utils/installmentsManager';
import { useToast } from '@/hooks/use-toast';

interface InstallmentPaymentDialogProps {
  installment: Installment;
  onPaymentAdded: () => void;
}

export const InstallmentPaymentDialog = ({ installment, onPaymentAdded }: InstallmentPaymentDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | 'check'>('cash');
  const [notes, setNotes] = useState('');
  const [receivedBy, setReceivedBy] = useState('');
  const { toast } = useToast();

  const handlePayment = () => {
    const paymentAmount = parseFloat(amount);
    
    if (!paymentAmount || paymentAmount <= 0) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال مبلغ صحيح',
        variant: 'destructive'
      });
      return;
    }

    if (paymentAmount > installment.remaining_amount) {
      toast({
        title: 'خطأ',
        description: 'لا يمكن أن يكون المبلغ أكبر من المبلغ المتبقي',
        variant: 'destructive'
      });
      return;
    }

    const success = installmentsManager.addPayment(installment.id, {
      amount: paymentAmount,
      date: new Date().toISOString(),
      notes,
      paymentMethod
    });

    if (success) {
      toast({
        title: 'تم بنجاح',
        description: 'تم إضافة الدفعة بنجاح'
      });
      
      setAmount('');
      setNotes('');
      setReceivedBy('');
      setIsOpen(false);
      onPaymentAdded();
    } else {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في إضافة الدفعة',
        variant: 'destructive'
      });
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'نقداً';
      case 'bank': return 'تحويل بنكي';
      case 'check': return 'شيك';
      default: return method;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <DollarSign className="h-4 w-4" />
          إضافة دفعة
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            إضافة دفعة جديدة
          </DialogTitle>
          <DialogDescription>
            القسط رقم {installment.id.slice(-8)} - المبلغ المتبقي: {installment.remaining_amount.toLocaleString()} ر.س
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* معلومات القسط */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">العميل:</span>
              <span className="text-sm">{installment.customer_name}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">إجمالي القسط:</span>
              <span className="text-sm">{installment.total_amount.toLocaleString()} ر.س</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">المدفوع:</span>
              <span className="text-sm text-success">{installment.paid_amount.toLocaleString()} ر.س</span>
            </div>
          </div>

          {/* مبلغ الدفعة */}
          <div className="space-y-2">
            <Label htmlFor="amount">مبلغ الدفعة *</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              max={installment.remaining_amount}
            />
          </div>

          {/* طريقة الدفع */}
          <div className="space-y-2">
            <Label>طريقة الدفع</Label>
            <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cash" id="cash" />
                <Label htmlFor="cash">نقداً</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bank" id="bank" />
                <Label htmlFor="bank">تحويل بنكي</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="check" id="check" />
                <Label htmlFor="check">شيك</Label>
              </div>
            </RadioGroup>
          </div>

          {/* استلمها */}
          <div className="space-y-2">
            <Label htmlFor="receivedBy">استلمها</Label>
            <Input
              id="receivedBy"
              placeholder="اسم من استلم الدفعة"
              value={receivedBy}
              onChange={(e) => setReceivedBy(e.target.value)}
            />
          </div>

          {/* ملاحظات */}
          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              placeholder="أي ملاحظات إضافية..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* أزرار العمل */}
          <div className="flex gap-2">
            <Button onClick={handlePayment} className="flex-1">
              تأكيد الدفعة
            </Button>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              إلغاء
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};