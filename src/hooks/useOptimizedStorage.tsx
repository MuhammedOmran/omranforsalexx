import { useState, useEffect, useCallback, useRef } from 'react';
import { storage } from '@/utils/storage';

interface UseOptimizedStorageOptions {
  debounceMs?: number;
  syncOnUnmount?: boolean;
}

/**
 * Hook محسن للتخزين المحلي مع debouncing وتحسين الأداء
 */
export function useOptimizedStorage<T>(
  key: string,
  defaultValue: T,
  options: UseOptimizedStorageOptions = {}
) {
  const { debounceMs = 300, syncOnUnmount = true } = options;
  const [data, setData] = useState<T>(() => {
    return storage.getItem<T>(key, defaultValue);
  });
  
  const timeoutRef = useRef<NodeJS.Timeout>();
  const pendingDataRef = useRef<T | null>(null);

  // دالة محسنة للحفظ مع debouncing
  const debouncedSave = useCallback((newData: T) => {
    pendingDataRef.current = newData;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      if (pendingDataRef.current !== null) {
        storage.setItem(key, pendingDataRef.current);
        pendingDataRef.current = null;
      }
    }, debounceMs);
  }, [key, debounceMs]);

  // دالة تحديث البيانات
  const updateData = useCallback((newData: T | ((prev: T) => T)) => {
    setData(prev => {
      const updatedData = typeof newData === 'function' 
        ? (newData as (prev: T) => T)(prev) 
        : newData;
      
      debouncedSave(updatedData);
      return updatedData;
    });
  }, [debouncedSave]);

  // دالة الحفظ الفوري
  const saveImmediately = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    storage.setItem(key, data);
  }, [key, data]);

  // تنظيف عند إلغاء المكون
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      if (syncOnUnmount && pendingDataRef.current !== null) {
        storage.setItem(key, pendingDataRef.current);
      }
    };
  }, [key, syncOnUnmount]);

  return {
    data,
    updateData,
    saveImmediately
  };
}