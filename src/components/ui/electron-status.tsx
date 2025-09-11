import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Monitor, Globe } from 'lucide-react';

export function ElectronStatus() {
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    // التحقق من بيئة Electron
    const checkElectron = () => {
      return typeof window !== 'undefined' && !!window.electronAPI;
    };

    setIsElectron(checkElectron());
  }, []);

  if (isElectron) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Monitor className="h-3 w-3" />
        إصدار سطح المكتب
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="flex items-center gap-1">
      <Globe className="h-3 w-3" />
      إصدار الويب
    </Badge>
  );
}