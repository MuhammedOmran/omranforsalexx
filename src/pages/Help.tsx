import React, { useState } from 'react';
import { HelpCircle, BookOpen, Keyboard, MessageCircle, ExternalLink, Phone, Mail, FileText, Headphones } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TutorialSystem } from '@/components/ui/tutorial-system';
import { KeyboardShortcutsHelp } from '@/components/ui/keyboard-shortcuts-help';
import { DocumentationViewer } from '@/components/ui/documentation-viewer';
import { SupportDialog } from '@/components/ui/support-dialog';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export default function HelpPage() {
  const [showTutorials, setShowTutorials] = useState(false);
  const [showDocumentation, setShowDocumentation] = useState(false);
  const [showSupportDialog, setShowSupportDialog] = useState(false);
  const { isHelpOpen, setIsHelpOpen } = useKeyboardShortcuts();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <HelpCircle className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold font-cairo">المساعدة والدعم</h1>
          <p className="text-muted-foreground font-tajawal">احصل على المساعدة والدعم الفني</p>
        </div>
      </div>

      {/* Help Options Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Keyboard Shortcuts */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setIsHelpOpen(true)}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-cairo">
              <Keyboard className="h-5 w-5 text-primary" />
              اختصارات المفاتيح
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm font-tajawal">
              تعلم اختصارات المفاتيح لتسريع عملك في النظام
            </p>
          </CardContent>
        </Card>

        {/* User Guide */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setShowDocumentation(true)}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-cairo">
              <FileText className="h-5 w-5 text-primary" />
              دليل المستخدم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm font-tajawal">
              دليل شامل لاستخدام جميع ميزات النظام
            </p>
          </CardContent>
        </Card>

        {/* Technical Support */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setShowSupportDialog(true)}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-cairo">
              <Headphones className="h-5 w-5 text-primary" />
              الدعم الفني
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm font-tajawal">
              تواصل مع فريق الدعم الفني لحل المشاكل
            </p>
          </CardContent>
        </Card>

        {/* Live Chat */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow" 
          onClick={() => window.open('https://wa.me/2001090695336', '_blank')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-cairo">
              <MessageCircle className="h-5 w-5 text-primary" />
              دردشة مباشرة
              <ExternalLink className="h-4 w-4 ml-auto" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              دردشة مباشرة عبر واتساب للحصول على دعم فوري
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="font-cairo">معلومات الاتصال</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium font-cairo">الدعم الفني</p>
              <p className="text-muted-foreground font-tajawal">+2001090695336</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium font-cairo">البريد الإلكتروني</p>
              <p className="text-muted-foreground font-tajawal">xoxobnj@gmail.com</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle className="font-cairo">الأسئلة الشائعة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">كيف أقوم بإنشاء فاتورة جديدة؟</h4>
            <p className="text-muted-foreground text-sm">
              يمكنك إنشاء فاتورة جديدة من قائمة المبيعات {'>'} فواتير البيع، ثم اضغط على "فاتورة جديدة"
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">كيف أقوم بإضافة منتج جديد؟</h4>
            <p className="text-muted-foreground text-sm">
              توجه إلى المخزون {'>'} إدارة المنتجات، ثم اضغط على "إضافة منتج جديد"
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">كيف أعرض التقارير؟</h4>
            <p className="text-muted-foreground text-sm">
              يمكنك الوصول إلى التقارير من القائمة الجانبية {'>'} التقارير، وستجد جميع أنواع التقارير المتاحة
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Components */}
      <TutorialSystem 
        open={showTutorials} 
        onOpenChange={setShowTutorials} 
      />
      
      <KeyboardShortcutsHelp 
        open={isHelpOpen} 
        onOpenChange={setIsHelpOpen} 
      />
      
      <DocumentationViewer 
        isOpen={showDocumentation} 
        onClose={() => setShowDocumentation(false)} 
      />
      
      <SupportDialog 
        open={showSupportDialog} 
        onOpenChange={setShowSupportDialog} 
      />
    </div>
  );
}