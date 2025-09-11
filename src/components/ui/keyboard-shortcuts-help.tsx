import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Badge } from './badge';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Keyboard, Command } from 'lucide-react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsHelp({ open, onOpenChange }: KeyboardShortcutsHelpProps) {
  const { getShortcutsByCategory, formatShortcut } = useKeyboardShortcuts();
  const categories = getShortcutsByCategory();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            اختصارات المفاتيح
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Command className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">
                  نصائح لاستخدام اختصارات المفاتيح
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• اضغط على المفاتيح معاً في نفس الوقت</li>
                  <li>• Ctrl تعني مفتاح التحكم، Shift تعني مفتاح الإزاحة</li>
                  <li>• اختصارات المفاتيح تعمل في جميع أنحاء النظام</li>
                  <li>• اضغط Escape لإغلاق أي نافذة مفتوحة</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {categories.map((category) => (
              <Card key={category.name}>
                <CardHeader>
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {category.shortcuts.map((shortcut, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
                      >
                        <span className="text-sm">{shortcut.description}</span>
                        <Badge variant="outline" className="font-mono text-xs">
                          {formatShortcut(shortcut)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">اختصارات إضافية</h3>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm">نسخ</span>
                  <Badge variant="outline" className="font-mono text-xs">Ctrl + C</Badge>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm">لصق</span>
                  <Badge variant="outline" className="font-mono text-xs">Ctrl + V</Badge>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm">تراجع</span>
                  <Badge variant="outline" className="font-mono text-xs">Ctrl + Z</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}