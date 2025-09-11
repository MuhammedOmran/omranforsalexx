import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { useCompanyLogos } from '@/hooks/useCompanyLogos';
import { useToast } from '@/hooks/use-toast';

interface CompanyLogoManagerProps {
  children?: React.ReactNode;
}

export const CompanyLogoManager: React.FC<CompanyLogoManagerProps> = ({ children }) => {
  const { logos, loading, uploading, uploadLogo, deleteLogo, toggleLogoStatus, getActiveLogo } = useCompanyLogos();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !companyName.trim()) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى اختيار ملف الشعار وإدخال اسم الشركة",
        variant: "destructive",
      });
      return;
    }

    try {
      await uploadLogo(selectedFile, companyName);
      setSelectedFile(null);
      setCompanyName('');
      // إعادة تعيين input الملف
      const fileInput = document.getElementById('logo-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      // الخطأ سيتم عرضه من hook
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const defaultTrigger = (
    <Button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white">
      <Building className="h-4 w-4" />
      شعار الشركة
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-cairo">
            <Building className="h-5 w-5 text-orange-500" />
            إدارة شعارات الشركة
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* قسم رفع شعار جديد */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold font-cairo mb-4">رفع شعار جديد</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name" className="font-tajawal">اسم الشركة</Label>
                  <Input
                    id="company-name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="أدخل اسم الشركة"
                    className="font-tajawal"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo-file" className="font-tajawal">ملف الشعار</Label>
                  <Input
                    id="logo-file"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="font-tajawal"
                  />
                </div>
              </div>
              
              {selectedFile && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <ImageIcon className="h-8 w-8 text-blue-500" />
                    <div className="flex-1">
                      <p className="font-medium font-tajawal">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(selectedFile.size)} • {selectedFile.type}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleUpload}
                disabled={uploading || !selectedFile || !companyName.trim()}
                className="w-full mt-4 font-cairo"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    جاري الرفع...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 ml-2" />
                    رفع الشعار
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* قائمة الشعارات الموجودة */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold font-cairo mb-4">الشعارات المحفوظة</h3>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  <span className="mr-2 font-tajawal">جاري التحميل...</span>
                </div>
              ) : logos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-tajawal">لا توجد شعارات محفوظة</p>
                  <p className="text-sm font-tajawal">قم برفع شعار الشركة أولاً</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {logos.map((logo) => (
                    <Card key={logo.id} className={`relative ${logo.is_active ? 'ring-2 ring-green-500' : ''}`}>
                      <CardContent className="p-4">
                        <div className="aspect-square relative mb-3 bg-muted rounded-lg overflow-hidden">
                          <img
                            src={logo.logo_url}
                            alt={logo.company_name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder.svg';
                            }}
                          />
                          {logo.is_active && (
                            <Badge className="absolute top-2 right-2 bg-green-500">
                              نشط
                            </Badge>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-medium font-cairo truncate" title={logo.company_name}>
                            {logo.company_name}
                          </h4>
                          <p className="text-xs text-muted-foreground font-tajawal">
                            {logo.logo_filename}
                          </p>
                          {logo.file_size && (
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(logo.file_size)}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleLogoStatus(logo.id)}
                            className="flex-1"
                          >
                            {logo.is_active ? (
                              <>
                                <EyeOff className="h-4 w-4 mr-1" />
                                إلغاء تفعيل
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-1" />
                                تفعيل
                              </>
                            )}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteLogo(logo.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* معلومات إضافية */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 font-cairo mb-2">💡 معلومات مهمة:</h4>
            <ul className="text-sm text-blue-800 space-y-1 font-tajawal">
              <li>• يمكن رفع ملفات الصور بصيغ: PNG, JPG, JPEG, GIF</li>
              <li>• الحد الأقصى لحجم الملف: 5 ميجابايت</li>
              <li>• سيتم استخدام الشعار النشط في الفواتير والتقارير</li>
              <li>• يمكنك تفعيل شعار واحد فقط في كل مرة</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};