import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { 
  Upload, 
  File, 
  Image, 
  FileText, 
  Archive, 
  Download, 
  Trash2, 
  Search,
  Filter,
  Grid,
  List,
  FolderPlus,
  Eye,
  Edit3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { storage } from '@/utils/storage';

interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  category: 'image' | 'document' | 'archive' | 'other';
  uploadDate: string;
  lastModified: string;
  url?: string;
  thumbnail?: string;
  tags: string[];
  description?: string;
}

const mockFiles: FileItem[] = [
  {
    id: '1',
    name: 'فاتورة_العميل_أحمد.pdf',
    type: 'application/pdf',
    size: 245760,
    category: 'document',
    uploadDate: '2024-01-15',
    lastModified: '2024-01-15',
    tags: ['فواتير', 'عملاء'],
    description: 'فاتورة مبيعات للعميل أحمد محمد'
  },
  {
    id: '2',
    name: 'شعار_الشركة.png',
    type: 'image/png',
    size: 89124,
    category: 'image',
    uploadDate: '2024-01-10',
    lastModified: '2024-01-12',
    tags: ['شعارات', 'تصميم'],
    description: 'الشعار الرسمي للشركة'
  },
  {
    id: '3',
    name: 'تقرير_المبيعات_ديسمبر.xlsx',
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 156789,
    category: 'document',
    uploadDate: '2024-01-05',
    lastModified: '2024-01-08',
    tags: ['تقارير', 'مبيعات'],
    description: 'تقرير مبيعات شهر ديسمبر 2023'
  }
];

export default function FileManagement() {
  const [files, setFiles] = useState<FileItem[]>(mockFiles);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 بايت';
    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string, category: string) => {
    if (category === 'image') return Image;
    if (type.includes('pdf')) return FileText;
    if (type.includes('excel') || type.includes('spreadsheet')) return FileText;
    if (category === 'archive') return Archive;
    return File;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        // محاكاة رفع الملف
        for (let progress = 0; progress <= 100; progress += 10) {
          setUploadProgress(progress);
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        const newFile: FileItem = {
          id: Date.now().toString() + i,
          name: file.name,
          type: file.type,
          size: file.size,
          category: file.type.startsWith('image/') ? 'image' : 'document',
          uploadDate: new Date().toISOString().split('T')[0],
          lastModified: new Date().toISOString().split('T')[0],
          tags: [],
          url: URL.createObjectURL(file)
        };

        setFiles(prev => [newFile, ...prev]);
      }

      // حفظ في التخزين المحلي
      storage.setItem('uploaded_files', files);

      toast({
        title: "تم رفع الملفات بنجاح",
        description: `تم رفع ${selectedFiles.length} ملف`,
      });
    } catch (error) {
      toast({
        title: "خطأ في رفع الملفات",
        description: "حدث خطأ أثناء رفع الملفات",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteFiles = () => {
    setFiles(prev => prev.filter(file => !selectedFiles.includes(file.id)));
    setSelectedFiles([]);
    toast({
      title: "تم حذف الملفات",
      description: `تم حذف ${selectedFiles.length} ملف`,
    });
  };

  const handleDownloadFile = (file: FileItem) => {
    // محاكاة تحميل الملف
    const link = document.createElement('a');
    link.href = file.url || '#';
    link.download = file.name;
    link.click();
    
    toast({
      title: "تم تحميل الملف",
      description: file.name,
    });
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.tags.some(tag => tag.includes(searchTerm));
    const matchesCategory = selectedCategory === 'all' || file.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: files.length,
    images: files.filter(f => f.category === 'image').length,
    documents: files.filter(f => f.category === 'document').length,
    archives: files.filter(f => f.category === 'archive').length,
    totalSize: files.reduce((sum, file) => sum + file.size, 0)
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Archive className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-arabic-elegant text-card-foreground">إدارة الملفات والمرفقات</h1>
          <p className="text-lg text-muted-foreground mt-2">
            تنظيم وإدارة جميع ملفاتك ومستنداتك في مكان واحد
          </p>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.total}</div>
              <div className="text-sm text-muted-foreground">إجمالي الملفات</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.images}</div>
              <div className="text-sm text-muted-foreground">الصور</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.documents}</div>
              <div className="text-sm text-muted-foreground">المستندات</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.archives}</div>
              <div className="text-sm text-muted-foreground">الأرشيف</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{formatFileSize(stats.totalSize)}</div>
              <div className="text-sm text-muted-foreground">الحجم الإجمالي</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="files" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="files">الملفات</TabsTrigger>
          <TabsTrigger value="upload">رفع الملفات</TabsTrigger>
          <TabsTrigger value="archive">الأرشيف</TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="space-y-6">
          {/* شريط البحث والفلترة */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="البحث في الملفات..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="all">جميع الفئات</option>
                    <option value="image">الصور</option>
                    <option value="document">المستندات</option>
                    <option value="archive">الأرشيف</option>
                  </select>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteFiles}
                    >
                      <Trash2 className="h-4 w-4 ml-2" />
                      حذف ({selectedFiles.length})
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* عرض الملفات */}
          <div className={cn(
            "grid gap-4",
            viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
          )}>
            {filteredFiles.map((file) => {
              const FileIcon = getFileIcon(file.type, file.category);
              const isSelected = selectedFiles.includes(file.id);
              
              return (
                <Card key={file.id} className={cn(
                  "hover:shadow-lg transition-shadow cursor-pointer",
                  isSelected && "ring-2 ring-primary"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFiles(prev => [...prev, file.id]);
                          } else {
                            setSelectedFiles(prev => prev.filter(id => id !== file.id));
                          }
                        }}
                        className="mt-1"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <FileIcon className="h-5 w-5 text-primary flex-shrink-0" />
                          <span className="font-medium text-sm truncate">{file.name}</span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)} • {file.uploadDate}
                          </div>
                          
                          {file.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {file.description}
                            </p>
                          )}
                          
                          {file.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {file.tags.slice(0, 2).map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {file.tags.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{file.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-1 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadFile(file)}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit3 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredFiles.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <File className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-arabic-elegant mb-2">لا توجد ملفات</h3>
                <p className="text-muted-foreground text-center">
                  لم يتم العثور على ملفات تطابق معايير البحث
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-arabic-elegant">رفع ملفات جديدة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">اسحب الملفات هنا أو انقر للاختيار</h3>
                <p className="text-sm text-muted-foreground">
                  يدعم النظام جميع أنواع الملفات (الحد الأقصى: 10 ميجابايت لكل ملف)
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.zip,.rar"
              />

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>جاري الرفع...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="file-category">فئة الملف</Label>
                  <select id="file-category" className="w-full mt-1 px-3 py-2 border rounded-md">
                    <option value="document">مستندات</option>
                    <option value="image">صور</option>
                    <option value="archive">أرشيف</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="file-tags">العلامات (مفصولة بفواصل)</Label>
                  <Input id="file-tags" placeholder="فواتير, عملاء, مهم" />
                </div>
              </div>

              <div>
                <Label htmlFor="file-description">وصف الملف</Label>
                <Input id="file-description" placeholder="وصف مختصر للملف..." />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archive" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-arabic-elegant">نظام الأرشفة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Archive className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-arabic-elegant mb-2">الأرشيف فارغ</h3>
                <p className="text-muted-foreground">
                  الملفات المؤرشفة ستظهر هنا
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}