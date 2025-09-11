import React, { useState } from 'react';
import { Button } from './button';
import { TutorialSystem } from './tutorial-system';
import { KeyboardShortcutsHelp } from './keyboard-shortcuts-help';
import { DocumentationViewer } from './documentation-viewer';
import { SupportDialog } from './support-dialog';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { 
  HelpCircle, 
  BookOpen, 
  Keyboard, 
  MessageCircle, 
  ExternalLink,
  Phone,
  Mail,
  FileText,
  Headphones
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

export function HelpCenter() {
  const [showTutorials, setShowTutorials] = useState(false);
  const [showDocumentation, setShowDocumentation] = useState(false);
  const [showSupportDialog, setShowSupportDialog] = useState(false);
  const { isHelpOpen, setIsHelpOpen } = useKeyboardShortcuts();

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 font-cairo">
            <HelpCircle className="h-4 w-4" />
            المساعدة
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">مركز المساعدة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 font-cairo"
                onClick={() => setIsHelpOpen(true)}
              >
                <Keyboard className="h-4 w-4" />
                اختصارات المفاتيح
              </Button>
              
              <hr className="my-3" />
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground px-2 font-tajawal">
                  <Phone className="h-3 w-3" />
                  الدعم الفني: +2001090695336
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground px-2 font-tajawal">
                  <Mail className="h-3 w-3" />
                  xoxobnj@gmail.com
                </div>
              </div>
              
              <hr className="my-3" />
              
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 font-cairo"
                onClick={() => setShowDocumentation(true)}
              >
                <FileText className="h-4 w-4" />
                دليل المستخدم
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 font-cairo"
                onClick={() => setShowSupportDialog(true)}
              >
                <Headphones className="h-4 w-4" />
                الدعم الفني
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 font-cairo"
                onClick={() => window.open('https://wa.me/2001090695336', '_blank')}
              >
                <MessageCircle className="h-4 w-4" />
                دردشة مباشرة
                <ExternalLink className="h-3 w-3 ml-auto" />
              </Button>
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>

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
    </>
  );
}