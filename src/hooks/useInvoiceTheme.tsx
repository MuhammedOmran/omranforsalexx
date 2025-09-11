import { useEffect } from 'react';
import { useInvoiceSettings } from '@/contexts/InvoiceSettingsContext';

interface ThemeVariables {
  '--invoice-primary': string;
  '--invoice-secondary': string;
  '--invoice-accent': string;
  '--invoice-bg': string;
  '--invoice-text': string;
  '--invoice-font-size': string;
  '--invoice-font-family': string;
  '--invoice-border-style': string;
  '--invoice-border-radius': string;
}

export function useInvoiceTheme() {
  const { settings } = useInvoiceSettings();

  useEffect(() => {
    const root = document.documentElement;

    // تحويل الألوان إلى HSL
    const hexToHsl = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }

      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    };

    // تطبيق الألوان
    root.style.setProperty('--invoice-primary', hexToHsl(settings.primaryColor));
    root.style.setProperty('--invoice-secondary', hexToHsl(settings.secondaryColor));
    root.style.setProperty('--invoice-accent', hexToHsl(settings.accentColor));
    root.style.setProperty('--invoice-bg', hexToHsl(settings.backgroundColor));
    root.style.setProperty('--invoice-text', hexToHsl(settings.textColor));

    // تطبيق حجم الخط
    const fontSizes = {
      'extra-small': '12px',
      'small': '14px',
      'medium': '16px',
      'large': '18px',
      'extra-large': '20px'
    };
    root.style.setProperty('--invoice-font-size', fontSizes[settings.fontSize]);

    // تطبيق عائلة الخط
    const fontFamilies = {
      'cairo': 'Cairo, sans-serif',
      'tajawal': 'Tajawal, sans-serif',
      'amiri': 'Amiri, serif',
      'noto-arabic': 'Noto Sans Arabic, sans-serif',
      'rubik': 'Rubik, sans-serif'
    };
    root.style.setProperty('--invoice-font-family', fontFamilies[settings.fontFamily]);

    // تطبيق نمط الحدود
    const borderStyles = {
      'none': 'none',
      'simple': '1px solid hsl(var(--invoice-primary))',
      'elegant': '2px solid hsl(var(--invoice-accent))',
      'double': '3px double hsl(var(--invoice-primary))',
      'rounded': '1px solid hsl(var(--invoice-primary))'
    };
    root.style.setProperty('--invoice-border-style', borderStyles[settings.borderStyle]);

    // تطبيق نصف القطر للحدود
    const borderRadius = settings.borderStyle === 'rounded' ? '8px' : '0px';
    root.style.setProperty('--invoice-border-radius', borderRadius);

    // تطبيق CSS classes للقوالب
    document.body.className = document.body.className.replace(/invoice-template-\w+/g, '');
    document.body.classList.add(`invoice-template-${settings.template}`);

    // تطبيق CSS classes لحجم الخط
    document.body.className = document.body.className.replace(/invoice-font-size-\w+/g, '');
    document.body.classList.add(`invoice-font-size-${settings.fontSize}`);

    // تطبيق CSS classes لعائلة الخط
    document.body.className = document.body.className.replace(/invoice-font-family-\w+/g, '');
    document.body.classList.add(`invoice-font-family-${settings.fontFamily}`);

    return () => {
      // تنظيف عند إلغاء التركيب
      const properties = [
        '--invoice-primary',
        '--invoice-secondary', 
        '--invoice-accent',
        '--invoice-bg',
        '--invoice-text',
        '--invoice-font-size',
        '--invoice-font-family',
        '--invoice-border-style',
        '--invoice-border-radius'
      ];
      
      properties.forEach(prop => {
        root.style.removeProperty(prop);
      });

      // إزالة classes
      document.body.className = document.body.className.replace(/invoice-\w+-\w+/g, '');
    };
  }, [settings]);

  // دالة لتطبيق الثيم على عنصر محدد
  const applyThemeToElement = (element: HTMLElement) => {
    element.style.setProperty('--primary', `hsl(${hexToHsl(settings.primaryColor)})`);
    element.style.setProperty('--secondary', `hsl(${hexToHsl(settings.secondaryColor)})`);
    element.style.setProperty('--accent', `hsl(${hexToHsl(settings.accentColor)})`);
    element.style.backgroundColor = settings.backgroundColor;
    element.style.color = settings.textColor;
    element.style.fontFamily = `var(--invoice-font-family)`;
    element.style.fontSize = `var(--invoice-font-size)`;
  };

  // تحويل hex إلى hsl
  const hexToHsl = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  return {
    applyThemeToElement,
    themeVars: {
      '--invoice-primary': `hsl(${hexToHsl(settings.primaryColor)})`,
      '--invoice-secondary': `hsl(${hexToHsl(settings.secondaryColor)})`,
      '--invoice-accent': `hsl(${hexToHsl(settings.accentColor)})`,
      '--invoice-bg': settings.backgroundColor,
      '--invoice-text': settings.textColor,
      '--invoice-font-size': `var(--invoice-font-size)`,
      '--invoice-font-family': `var(--invoice-font-family)`,
    }
  };
}