import React from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Moon, Sun, Monitor } from "lucide-react";
import { useAppearanceSettings } from "@/hooks/useAppearanceSettings";

export function ThemeSwitcher() {
  const { settings, updateSettings, applyTheme } = useAppearanceSettings();

  const themes = [
    {
      value: 'light' as const,
      label: 'فاتح',
      icon: Sun,
      description: 'مظهر نهاري'
    },
    {
      value: 'dark' as const,
      label: 'داكن',
      icon: Moon,
      description: 'مظهر ليلي'
    },
    {
      value: 'system' as const,
      label: 'النظام',
      icon: Monitor,
      description: 'حسب الجهاز'
    }
  ];

  const currentTheme = themes.find(theme => theme.value === settings.theme);
  const CurrentIcon = currentTheme?.icon || Sun;

  const handleThemeChange = (themeValue: 'light' | 'dark' | 'system') => {
    updateSettings({ theme: themeValue });
    applyTheme(themeValue);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <CurrentIcon className="h-4 w-4" />
          <span className="sr-only">تبديل المظهر</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {themes.map((theme) => {
          const Icon = theme.icon;
          const isSelected = settings.theme === theme.value;
          
          return (
            <DropdownMenuItem
              key={theme.value}
              onClick={() => handleThemeChange(theme.value)}
              className={`flex items-center gap-3 cursor-pointer ${
                isSelected ? 'bg-accent' : ''
              }`}
            >
              <Icon className="h-4 w-4" />
              <div className="flex-1">
                <p className="font-medium">{theme.label}</p>
                <p className="text-xs text-muted-foreground">{theme.description}</p>
              </div>
              {isSelected && (
                <div className="w-2 h-2 rounded-full bg-primary"></div>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}