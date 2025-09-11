import { useState, useEffect } from "react";
import { storage } from "@/utils/storage";
import { useAppSettings } from "@/hooks/useAppSettings";

interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'ar' | 'en';
  rtlDirection: boolean;
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
  animations: boolean;
  primaryColor: string;
  accentColor: string;
  borderRadius: 'none' | 'small' | 'medium' | 'large';
  density: 'comfortable' | 'compact' | 'spacious';
  fontFamily: 'default' | 'cairo' | 'amiri' | 'tajawal' | 'rubik';
  highContrast: boolean;
  reducedMotion: boolean;
}

const defaultSettings: AppearanceSettings = {
  theme: 'system',
  language: 'ar',
  rtlDirection: true,
  fontSize: 'medium',
  compactMode: false,
  animations: true,
  primaryColor: '#0ea5e9',
  accentColor: '#64748b',
  borderRadius: 'medium',
  density: 'comfortable',
  fontFamily: 'default',
  highContrast: false,
  reducedMotion: false,
};

export function useAppearanceSettings() {
  const [settings, setSettings] = useState<AppearanceSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const { getCategorySettings, setCategorySettings } = useAppSettings();

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    applySettings(settings);
  }, [settings]);

  const loadSettings = async () => {
    try {
      // تحميل من Supabase أولاً
      const supabaseSettings = await getCategorySettings('appearance');
      let mergedSettings = { ...defaultSettings };
      
      if (Object.keys(supabaseSettings).length > 0) {
        mergedSettings = { ...defaultSettings, ...supabaseSettings };
      } else {
        // إذا لم توجد إعدادات في Supabase، تحميل من localStorage للمرة الأولى
        const saved = storage.getItem('appearance_settings', {});
        if (Object.keys(saved).length > 0) {
          mergedSettings = { ...defaultSettings, ...saved };
          // حفظ في Supabase للمرة الأولى
          await setCategorySettings('appearance', mergedSettings);
        }
        
        // تحديث الثيم من localStorage القديم
        const darkMode = storage.getItem('dark_mode', null);
        if (darkMode !== null) {
          mergedSettings.theme = darkMode === 'true' ? 'dark' : 'light';
          await setCategorySettings('appearance', mergedSettings);
        }
      }
      
      setSettings(mergedSettings);
    } catch (error) {
      console.error('خطأ في تحميل إعدادات المظهر:', error);
      // fallback إلى localStorage في حالة الخطأ
      const saved = storage.getItem('appearance_settings', {});
      setSettings({ ...defaultSettings, ...saved });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<AppearanceSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    
    try {
      // حفظ في Supabase
      await setCategorySettings('appearance', newSettings);
      // حفظ في localStorage كـ backup
      storage.setItem('appearance_settings', newSettings);
    } catch (error) {
      console.error('خطأ في حفظ إعدادات المظهر:', error);
      // في حالة الخطأ، احفظ في localStorage فقط
      storage.setItem('appearance_settings', newSettings);
    }
    
    applySettings(newSettings);
  };

  const applySettings = (settingsToApply: AppearanceSettings) => {
    const root = document.documentElement;
    
    // تطبيق الثيم
    applyTheme(settingsToApply.theme);
    
    // تطبيق اتجاه النص
    root.dir = settingsToApply.rtlDirection ? 'rtl' : 'ltr';
    root.lang = settingsToApply.language;
    
    // تطبيق حجم الخط
    root.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
    root.classList.add(`font-size-${settingsToApply.fontSize}`);
    
    // تطبيق كثافة المحتوى
    root.classList.remove('density-compact', 'density-comfortable', 'density-spacious');
    root.classList.add(`density-${settingsToApply.density}`);
    
    // تطبيق استدارة الحواف
    root.classList.remove('radius-none', 'radius-small', 'radius-medium', 'radius-large');
    root.classList.add(`radius-${settingsToApply.borderRadius}`);
    
    // تطبيق الخطوط
    root.classList.remove('font-default', 'font-cairo', 'font-amiri', 'font-tajawal', 'font-rubik');
    root.classList.add(`font-${settingsToApply.fontFamily}`);
    
    // تطبيق الحركات
    root.classList.toggle('no-animations', !settingsToApply.animations || settingsToApply.reducedMotion);
    
    // تطبيق الوضع المضغوط
    root.classList.toggle('compact-mode', settingsToApply.compactMode);
    
    // تطبيق التباين العالي
    root.classList.toggle('high-contrast', settingsToApply.highContrast);
    
    // تطبيق الألوان المخصصة
    root.style.setProperty('--primary', settingsToApply.primaryColor);
    root.style.setProperty('--accent', settingsToApply.accentColor);
  };

  const applyTheme = (theme: 'light' | 'dark' | 'system') => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
      storage.setItem('dark_mode', 'true');
    } else if (theme === 'light') {
      root.classList.remove('dark');
      storage.setItem('dark_mode', 'false');
    } else {
      // نمط النظام
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
      storage.setItem('dark_mode', prefersDark.toString());
    }
  };

  const resetToDefaults = async () => {
    setSettings(defaultSettings);
    try {
      await setCategorySettings('appearance', defaultSettings);
    } catch (error) {
      console.error('خطأ في إعادة تعيين إعدادات المظهر:', error);
    }
    storage.setItem('appearance_settings', defaultSettings);
    applySettings(defaultSettings);
  };

  const getColorPalettes = () => {
    return {
      blue: { primary: '#3b82f6', accent: '#64748b', name: 'أزرق' },
      green: { primary: '#10b981', accent: '#6b7280', name: 'أخضر' },
      purple: { primary: '#8b5cf6', accent: '#6b7280', name: 'بنفسجي' },
      red: { primary: '#ef4444', accent: '#6b7280', name: 'أحمر' },
      orange: { primary: '#f59e0b', accent: '#6b7280', name: 'برتقالي' },
      pink: { primary: '#ec4899', accent: '#6b7280', name: 'وردي' },
      indigo: { primary: '#6366f1', accent: '#6b7280', name: 'نيلي' },
      teal: { primary: '#14b8a6', accent: '#6b7280', name: 'أزرق مخضر' },
    };
  };

  const getFontOptions = () => {
    return {
      default: { name: 'الخط الافتراضي', class: 'font-default' },
      cairo: { name: 'Cairo', class: 'font-cairo' },
      amiri: { name: 'Amiri', class: 'font-amiri' },
      tajawal: { name: 'Tajawal', class: 'font-tajawal' },
      rubik: { name: 'Rubik', class: 'font-rubik' }
    };
  };

  return {
    settings,
    isLoading,
    updateSettings,
    resetToDefaults,
    applyTheme,
    getColorPalettes,
    getFontOptions,
  };
}