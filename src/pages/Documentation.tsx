import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { DocumentationViewer } from '@/components/ui/documentation-viewer';
import { Download, FileText, Book, Settings, HelpCircle } from 'lucide-react';

export default function Documentation() {
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);

  const documentationSections = [
    {
      id: 'user-guide',
      title: 'دليل المستخدم',
      description: 'دليل شامل لاستخدام نظام عُمران',
      icon: Book,
      file: '/docs/user-guide.md'
    },
    {
      id: 'api-docs',
      title: 'توثيق API',
      description: 'مرجع شامل لجميع APIs المتاحة',
      icon: FileText,
      file: '/docs/api-documentation.md'
    },
    {
      id: 'maintenance',
      title: 'دليل التشغيل والصيانة',
      description: 'إرشادات التشغيل والصيانة الدورية',
      icon: Settings,
      file: '/docs/maintenance-guide.md'
    }
  ];

  const downloadFile = async (file: string, title: string) => {
    try {
      const response = await fetch(file);
      const content = await response.text();
      
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('خطأ في تحميل الملف:', error);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <HelpCircle className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-arabic-elegant text-card-foreground">مركز الوثائق</h1>
          <p className="text-lg text-muted-foreground mt-2">
            جميع الوثائق والأدلة اللازمة لاستخدام نظام عُمران بكفاءة
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="viewer">عارض الوثائق</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documentationSections.map((section) => (
              <Card key={section.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <section.icon className="h-6 w-6 text-primary" />
                    <CardTitle className="font-arabic-elegant">{section.title}</CardTitle>
                  </div>
                  <CardDescription className="text-right">
                    {section.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={() => setSelectedDoc(section.file)}
                    className="w-full"
                    variant="outline"
                  >
                    <FileText className="h-4 w-4 ml-2" />
                    عرض الوثيقة
                  </Button>
                  <Button
                    onClick={() => downloadFile(section.file, section.title)}
                    className="w-full"
                    variant="secondary"
                  >
                    <Download className="h-4 w-4 ml-2" />
                    تحميل PDF
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Help Section */}
          <Card>
            <CardHeader>
              <CardTitle className="font-arabic-elegant">مساعدة سريعة</CardTitle>
              <CardDescription>
                الموضوعات الأكثر طلباً في نظام عُمران
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">البدء السريع</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• كيفية إنشاء فاتورة مبيعات</li>
                    <li>• إضافة منتج جديد للمخزون</li>
                    <li>• إدارة العملاء والموردين</li>
                    <li>• إعداد النظام للمرة الأولى</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">المشاكل الشائعة</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• حل مشاكل الطباعة</li>
                    <li>• استعادة النسخ الاحتياطية</li>
                    <li>• مشاكل المزامنة</li>
                    <li>• تحسين الأداء</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="viewer" className="space-y-6">
          {selectedDoc ? (
            <Card>
              <CardHeader>
                <CardTitle>عارض الوثائق</CardTitle>
                <CardDescription>
                  عذراً، عارض الوثائق قيد التطوير. يمكنك تحميل الوثائق من القسم السابق.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  يمكنك الوصول للوثائق الكاملة من مجلد docs في المشروع.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-arabic-elegant mb-2">اختر وثيقة للعرض</h3>
                <p className="text-muted-foreground text-center mb-6">
                  اختر إحدى الوثائق من القائمة أعلاه لعرضها هنا
                </p>
                <div className="flex gap-4">
                  {documentationSections.map((section) => (
                    <Button
                      key={section.id}
                      onClick={() => setSelectedDoc(section.file)}
                      variant="outline"
                    >
                      <section.icon className="h-4 w-4 ml-2" />
                      {section.title}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}