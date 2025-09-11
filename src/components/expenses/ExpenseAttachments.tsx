import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileText, Image, Trash2, Download, Eye, Paperclip } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { storage } from "@/utils/storage";

interface ExpenseAttachment {
  id: string;
  expenseId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadDate: string;
  url: string;
}

interface ExpenseAttachmentsProps {
  expenseId: string;
  onAttachmentsChange?: (attachments: ExpenseAttachment[]) => void;
}

export default function ExpenseAttachments({ expenseId, onAttachmentsChange }: ExpenseAttachmentsProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<ExpenseAttachment[]>(() => {
    return storage.getItem('expense_attachments', []).filter((att: ExpenseAttachment) => att.expenseId === expenseId);
  });
  const [isUploading, setIsUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<ExpenseAttachment | null>(null);

  // رفع ملف جديد
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      for (const file of Array.from(files)) {
        // التحقق من نوع الملف
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];
        if (!allowedTypes.includes(file.type)) {
          toast({
            title: "نوع ملف غير مدعوم",
            description: "يُسمح فقط بملفات الصور وPDF والنصوص",
            variant: "destructive"
          });
          continue;
        }

        // التحقق من حجم الملف (5MB حد أقصى)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "حجم ملف كبير",
            description: "حجم الملف يجب أن يكون أقل من 5 ميجابايت",
            variant: "destructive"
          });
          continue;
        }

        // تحويل الملف إلى Base64 للتخزين المحلي
        const base64 = await convertToBase64(file);
        
        const newAttachment: ExpenseAttachment = {
          id: `ATT_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          expenseId,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          uploadDate: new Date().toISOString(),
          url: base64
        };

        const allAttachments = storage.getItem('expense_attachments', []);
        allAttachments.push(newAttachment);
        storage.setItem('expense_attachments', allAttachments);

        setAttachments(prev => [...prev, newAttachment]);
        onAttachmentsChange?.([...attachments, newAttachment]);

        toast({
          title: "تم الرفع",
          description: `تم رفع ${file.name} بنجاح`
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في الرفع",
        description: "حدث خطأ أثناء رفع الملف",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // تحويل الملف إلى Base64
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // حذف المرفق
  const handleDeleteAttachment = (attachmentId: string) => {
    const allAttachments = storage.getItem('expense_attachments', []);
    const updatedAttachments = allAttachments.filter((att: ExpenseAttachment) => att.id !== attachmentId);
    storage.setItem('expense_attachments', updatedAttachments);

    const newExpenseAttachments = attachments.filter(att => att.id !== attachmentId);
    setAttachments(newExpenseAttachments);
    onAttachmentsChange?.(newExpenseAttachments);

    toast({
      title: "تم الحذف",
      description: "تم حذف المرفق بنجاح"
    });
  };

  // تحميل المرفق
  const handleDownloadAttachment = (attachment: ExpenseAttachment) => {
    try {
      const link = document.createElement('a');
      link.href = attachment.url;
      link.download = attachment.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "تم التحميل",
        description: `تم تحميل ${attachment.fileName}`
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل الملف",
        variant: "destructive"
      });
    }
  };

  // معاينة المرفق
  const handlePreviewAttachment = (attachment: ExpenseAttachment) => {
    setPreviewFile(attachment);
  };

  // تنسيق حجم الملف
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // أيقونة نوع الملف
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (fileType === 'application/pdf') return <FileText className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            المرفقات ({attachments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* منطقة الرفع */}
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <div className="space-y-2">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
              <div className="text-sm text-muted-foreground">
                اسحب الملفات هنا أو انقر للتحديد
              </div>
              <div className="text-xs text-muted-foreground">
                الملفات المدعومة: JPG, PNG, GIF, PDF, TXT (حد أقصى 5MB)
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? "جاري الرفع..." : "اختيار الملفات"}
              </Button>
            </div>
          </div>

          {/* قائمة المرفقات */}
          {attachments.length > 0 && (
            <div className="mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>النوع</TableHead>
                    <TableHead>اسم الملف</TableHead>
                    <TableHead>الحجم</TableHead>
                    <TableHead>تاريخ الرفع</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attachments.map((attachment) => (
                    <TableRow key={attachment.id}>
                      <TableCell>{getFileIcon(attachment.fileType)}</TableCell>
                      <TableCell className="font-medium">{attachment.fileName}</TableCell>
                      <TableCell>{formatFileSize(attachment.fileSize)}</TableCell>
                      <TableCell>{new Date(attachment.uploadDate).toLocaleDateString('ar-EG')}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePreviewAttachment(attachment)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadAttachment(attachment)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAttachment(attachment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {attachments.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              لا توجد مرفقات حتى الآن
            </div>
          )}
        </CardContent>
      </Card>

      {/* معاينة الملف */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>معاينة: {previewFile?.fileName}</DialogTitle>
          </DialogHeader>
          <div className="overflow-auto">
            {previewFile && (
              <div className="p-4">
                {previewFile.fileType.startsWith('image/') ? (
                  <img 
                    src={previewFile.url} 
                    alt={previewFile.fileName}
                    className="max-w-full h-auto rounded-lg"
                  />
                ) : previewFile.fileType === 'application/pdf' ? (
                  <iframe
                    src={previewFile.url}
                    className="w-full h-[60vh] border rounded-lg"
                    title={previewFile.fileName}
                  />
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      لا يمكن معاينة هذا النوع من الملفات. يمكنك تحميله لعرضه.
                    </p>
                    <Button 
                      className="mt-4"
                      onClick={() => previewFile && handleDownloadAttachment(previewFile)}
                    >
                      تحميل الملف
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}