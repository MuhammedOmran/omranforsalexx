import { useState, useEffect, useCallback } from "react";
import { DisplayOption } from "@/contexts/ProductDisplayContext";

interface ProductDisplayPreferences {
  displayOption: DisplayOption;
  searchTerm: string;
  selectedCategory: string;
  priceRange: { min: number; max: number };
  stockRange: { min: number; max: number };
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  itemsPerPage: number;
  showOutOfStock: boolean;
  autoRefresh: boolean;
}

const defaultPreferences: ProductDisplayPreferences = {
  displayOption: "selling",
  searchTerm: "",
  selectedCategory: "all",
  priceRange: { min: 0, max: 100000 },
  stockRange: { min: 0, max: 1000 },
  sortBy: "name",
  sortOrder: 'asc',
  itemsPerPage: 50,
  showOutOfStock: true,
  autoRefresh: false
};

export const useProductDisplayPreferences = () => {
  const [preferences, setPreferences] = useState<ProductDisplayPreferences>(defaultPreferences);
  const [savedPresets, setSavedPresets] = useState<{ [key: string]: ProductDisplayPreferences }>({});

  // تحميل التفضيلات من التخزين المحلي
  useEffect(() => {
    const savedPrefs = localStorage.getItem('productDisplayPreferences');
    if (savedPrefs) {
      try {
        setPreferences(JSON.parse(savedPrefs));
      } catch (error) {
        console.error('Error parsing preferences:', error);
      }
    }

    const savedPresets = localStorage.getItem('productDisplayPresets');
    if (savedPresets) {
      try {
        setSavedPresets(JSON.parse(savedPresets));
      } catch (error) {
        console.error('Error parsing presets:', error);
      }
    }
  }, []);

  // حفظ التفضيلات
  const savePreferences = useCallback((newPreferences: Partial<ProductDisplayPreferences>) => {
    const updatedPreferences = { ...preferences, ...newPreferences };
    setPreferences(updatedPreferences);
    localStorage.setItem('productDisplayPreferences', JSON.stringify(updatedPreferences));
  }, [preferences]);

  // حفظ تفضيلات كإعداد مسبق
  const saveAsPreset = useCallback((name: string, preferencesToSave?: Partial<ProductDisplayPreferences>) => {
    const presetData = { ...preferences, ...preferencesToSave };
    const newPresets = { ...savedPresets, [name]: presetData };
    setSavedPresets(newPresets);
    localStorage.setItem('productDisplayPresets', JSON.stringify(newPresets));
  }, [preferences, savedPresets]);

  // تحميل إعداد مسبق
  const loadPreset = useCallback((name: string) => {
    const preset = savedPresets[name];
    if (preset) {
      setPreferences(preset);
      localStorage.setItem('productDisplayPreferences', JSON.stringify(preset));
    }
  }, [savedPresets]);

  // حذف إعداد مسبق
  const deletePreset = useCallback((name: string) => {
    const newPresets = { ...savedPresets };
    delete newPresets[name];
    setSavedPresets(newPresets);
    localStorage.setItem('productDisplayPresets', JSON.stringify(newPresets));
  }, [savedPresets]);

  // إعادة تعيين للافتراضي
  const resetToDefault = useCallback(() => {
    setPreferences(defaultPreferences);
    localStorage.setItem('productDisplayPreferences', JSON.stringify(defaultPreferences));
  }, []);

  // تصدير التفضيلات
  const exportPreferences = useCallback(() => {
    const dataStr = JSON.stringify({ preferences, presets: savedPresets }, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `product-display-preferences-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [preferences, savedPresets]);

  // استيراد التفضيلات
  const importPreferences = useCallback((file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (data.preferences) {
            setPreferences(data.preferences);
            localStorage.setItem('productDisplayPreferences', JSON.stringify(data.preferences));
          }
          if (data.presets) {
            setSavedPresets(data.presets);
            localStorage.setItem('productDisplayPresets', JSON.stringify(data.presets));
          }
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsText(file);
    });
  }, []);

  return {
    preferences,
    savedPresets,
    savePreferences,
    saveAsPreset,
    loadPreset,
    deletePreset,
    resetToDefault,
    exportPreferences,
    importPreferences
  };
};