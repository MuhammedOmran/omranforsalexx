import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface DuplicateWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DuplicateWarningDialog({
  open,
  onOpenChange,
  message,
  onConfirm,
  onCancel
}: DuplicateWarningDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600 font-cairo">
            <AlertTriangle className="h-5 w-5" />
            تحذير: مورد مشابه موجود
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground font-cairo mb-4">
            {message}
          </p>
          
          <p className="text-sm font-cairo">
            هل تريد المتابعة رغم ذلك؟ قد يؤدي هذا إلى مشاكل في التتبع والفواتير.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="font-cairo"
          >
            إلغاء
          </Button>
          <Button
            variant="default"
            onClick={onConfirm}
            className="font-cairo bg-orange-600 hover:bg-orange-700"
          >
            متابعة رغم ذلك
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}