import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, Edit, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

interface SupabaseInvoiceActionsProps {
  invoice: any;
  onUpdate: () => void;
  onEdit: (invoice: any) => void;
}

export function SupabaseInvoiceActions({ invoice, onUpdate, onEdit }: SupabaseInvoiceActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "خطأ",
          description: "المستخدم غير مصادق عليه",
          variant: "destructive",
        });
        return;
      }

      // حذف آمن للفاتورة (soft delete) - تحديث deleted_at بدلاً من الحذف النهائي
      if (invoice.supabaseId) {
        const { error } = await supabase
          .from('invoices')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', invoice.supabaseId)
          .eq('user_id', user.id);

        if (error) {
          logger.error('خطأ في حذف الفاتورة من Supabase', error, 'SupabaseInvoiceActions');
          throw error;
        }
      }

      toast({
        title: "تم الحذف",
        description: `تم حذف الفاتورة ${invoice.id} بنجاح`,
      });

      onUpdate();
    } catch (error) {
      logger.error('خطأ في حذف الفاتورة', error, 'SupabaseInvoiceActions');
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء حذف الفاتورة",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => onEdit(invoice)}
        className="flex items-center gap-1"
      >
        <Edit className="h-4 w-4" />
        تعديل
      </Button>
      
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button 
            variant="destructive" 
            size="sm" 
            disabled={isDeleting}
            className="flex items-center gap-1"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            حذف
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف الفاتورة رقم {invoice.id}؟ 
              هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  جاري الحذف...
                </>
              ) : (
                'تأكيد الحذف'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}