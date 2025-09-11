import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './use-toast';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  description: string;
  action: () => void;
  category: string;
}

interface ShortcutCategory {
  name: string;
  shortcuts: KeyboardShortcut[];
}

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const shortcuts: KeyboardShortcut[] = [
    // التنقل العام
    {
      key: 'h',
      ctrlKey: true,
      description: 'الصفحة الرئيسية',
      action: () => navigate('/'),
      category: 'التنقل'
    },
    {
      key: 'd',
      ctrlKey: true,
      description: 'لوحة المعلومات',
      action: () => navigate('/sales/dashboard'),
      category: 'التنقل'
    },
    {
      key: 's',
      ctrlKey: true,
      description: 'المبيعات',
      action: () => navigate('/sales'),
      category: 'التنقل'
    },
    {
      key: 'i',
      ctrlKey: true,
      description: 'المخزون',
      action: () => navigate('/inventory'),
      category: 'التنقل'
    },
    {
      key: 'r',
      ctrlKey: true,
      description: 'التقارير',
      action: () => navigate('/reports'),
      category: 'التنقل'
    },
    {
      key: 'p',
      ctrlKey: true,
      description: 'المشتريات',
      action: () => navigate('/purchases'),
      category: 'التنقل'
    },

    // العمليات السريعة
    {
      key: 'n',
      ctrlKey: true,
      shiftKey: true,
      description: 'فاتورة مبيعات جديدة',
      action: () => navigate('/sales/new-invoice'),
      category: 'عمليات سريعة'
    },
    {
      key: 'c',
      ctrlKey: true,
      shiftKey: true,
      description: 'عميل جديد',
      action: () => navigate('/sales/new-customer'),
      category: 'عمليات سريعة'
    },
    {
      key: 'p',
      ctrlKey: true,
      shiftKey: true,
      description: 'منتج جديد',
      action: () => navigate('/inventory/new-product'),
      category: 'عمليات سريعة'
    },
    {
      key: 'b',
      ctrlKey: true,
      shiftKey: true,
      description: 'مشتريات جديدة',
      action: () => navigate('/purchases/new-purchase'),
      category: 'عمليات سريعة'
    },

    // البحث والتصفية
    {
      key: 'k',
      ctrlKey: true,
      description: 'البحث السريع',
      action: () => {
        // فتح مربع البحث
        const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        } else {
          toast({
            title: 'البحث السريع',
            description: 'Ctrl+K للبحث في البيانات',
          });
        }
      },
      category: 'البحث'
    },
    {
      key: 'f',
      ctrlKey: true,
      description: 'تصفية البيانات',
      action: () => {
        const filterButton = document.querySelector('[data-filter-button]') as HTMLButtonElement;
        if (filterButton) {
          filterButton.click();
        }
      },
      category: 'البحث'
    },

    // الإعدادات والمساعدة
    {
      key: ',',
      ctrlKey: true,
      description: 'الإعدادات',
      action: () => navigate('/settings'),
      category: 'النظام'
    },
    {
      key: '?',
      shiftKey: true,
      description: 'عرض اختصارات المفاتيح',
      action: () => setIsHelpOpen(true),
      category: 'النظام'
    },
    {
      key: 'Escape',
      description: 'إغلاق النوافذ المنبثقة',
      action: () => {
        // إغلاق أي نافذة مفتوحة
        const closeButtons = document.querySelectorAll('[data-dialog-close]');
        if (closeButtons.length > 0) {
          (closeButtons[0] as HTMLButtonElement).click();
        }
        setIsHelpOpen(false);
      },
      category: 'النظام'
    },

    // تحديث البيانات
    {
      key: 'F5',
      description: 'تحديث البيانات',
      action: () => {
        window.location.reload();
      },
      category: 'البيانات'
    },
    {
      key: 'r',
      ctrlKey: true,
      shiftKey: true,
      description: 'تحديث البيانات بدون إعادة تحميل',
      action: () => {
        // إرسال حدث تحديث مخصص
        window.dispatchEvent(new CustomEvent('refresh-data'));
        toast({
          title: 'تم تحديث البيانات',
          description: 'تم تحديث جميع البيانات بنجاح',
        });
      },
      category: 'البيانات'
    }
  ];

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    // تجاهل الاختصارات عند الكتابة في حقول النص
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      // السماح ببعض الاختصارات المهمة حتى في حقول النص
      if (!(event.key === 'Escape' || (event.ctrlKey && event.key === '?'))) {
        return;
      }
    }

    const matchingShortcut = shortcuts.find(shortcut => {
      return (
        shortcut.key.toLowerCase() === event.key.toLowerCase() &&
        !!shortcut.ctrlKey === event.ctrlKey &&
        !!shortcut.shiftKey === event.shiftKey &&
        !!shortcut.altKey === event.altKey
      );
    });

    if (matchingShortcut) {
      event.preventDefault();
      event.stopPropagation();
      matchingShortcut.action();
    }
  }, [shortcuts, navigate, toast]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  const getShortcutsByCategory = (): ShortcutCategory[] => {
    const categories = [...new Set(shortcuts.map(s => s.category))];
    return categories.map(category => ({
      name: category,
      shortcuts: shortcuts.filter(s => s.category === category)
    }));
  };

  const formatShortcut = (shortcut: KeyboardShortcut): string => {
    const parts = [];
    if (shortcut.ctrlKey) parts.push('Ctrl');
    if (shortcut.shiftKey) parts.push('Shift');
    if (shortcut.altKey) parts.push('Alt');
    parts.push(shortcut.key.toUpperCase());
    return parts.join(' + ');
  };

  return {
    shortcuts,
    isHelpOpen,
    setIsHelpOpen,
    getShortcutsByCategory,
    formatShortcut
  };
}