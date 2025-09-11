import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Menu, User, Search, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AppSidebar } from "./AppSidebar";
import { NotificationButton } from "@/components/ui/notifications";
import { UserProfile } from "@/components/ui/user-profile";
import { LogoManager } from "@/components/ui/logo-manager";
import { AdvancedSearch } from "@/components/ui/advanced-search";
import { HelpCenter } from "@/components/ui/help-center";
import { OperationFeedback, useOperationProgress } from "@/components/ui/operation-feedback";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { AccountSwitcher } from "@/components/auth/AccountSwitcher";
import { NotificationMonitor } from "@/components/monitoring/NotificationMonitor";
import { InventoryNotificationMonitor } from "@/components/inventory/InventoryNotificationMonitor";

import { ElectronStatus } from "@/components/ui/electron-status";

interface AppLayoutProps {
  children?: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const { operations } = useOperationProgress();
  
  // تفعيل اختصارات المفاتيح
  useKeyboardShortcuts();
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    // Default to false on mobile, true on desktop
    return window.innerWidth >= 1024;
  });
  const [logo, setLogo] = useState<string>(() => {
    const saved = localStorage.getItem("app_logo");
    return saved || "text:SPADEX";
  });
  const [programName] = useState(() => {
    const saved = localStorage.getItem("program_name");
    return saved || "OMRAN FOR SALE";
  });
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("dark_mode");
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    // Apply dark mode on mount
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("dark_mode", JSON.stringify(newDarkMode));
    if (newDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleLogoChange = (newLogo: string) => {
    setLogo(newLogo);
    localStorage.setItem("app_logo", newLogo);
  };

  return (
    <div className="min-h-screen bg-background rtl:text-right">
      {/* Top Header */}
      <header className="h-16 bg-card border-b border-border sticky top-0 z-50 shadow-custom-sm">
        <div className="flex items-center justify-between h-full px-4 lg:px-6">
          {/* Left side - Menu and Logo */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-muted-foreground hover:text-foreground"
              title={sidebarOpen ? "إخفاء القائمة الرئيسية" : "إظهار القائمة الرئيسية"}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                {logo.startsWith('text:') ? (
                  <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-sm">
                      {logo.replace('text:', '').slice(0, 2)}
                    </span>
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-gradient-primary flex items-center justify-center">
                    <img 
                      src={logo} 
                      alt="Logo" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.setAttribute('style', 'display: flex');
                      }}
                    />
                    <span className="text-primary-foreground font-bold text-sm hidden">
                      SP
                    </span>
                  </div>
                )}
              </div>
              <h1 className="font-arabic-elegant text-xl hidden sm:block">SPADEX</h1>
            </div>
          </div>

          {/* Center - Advanced Search */}
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <AdvancedSearch placeholder="البحث في النظام... (Ctrl+K)" />
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-2">
            <ElectronStatus />
            <Button variant="ghost" size="sm" onClick={toggleDarkMode}>
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <NotificationButton />
            {/* Auth account switcher */}
            <AccountSwitcher />
            <UserProfile darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* النظام المراقب للإشعارات */}
        <NotificationMonitor />
        {/* مراقب إشعارات المخزون المخصص */}
        <InventoryNotificationMonitor />
        
        {/* Sidebar */}
        <AppSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        
        {/* Main Content */}
        <main className={cn(
          "flex-1 transition-all duration-300 ease-in-out",
          sidebarOpen ? "lg:mr-64" : "mr-0"
        )}>
          <div className="p-4 lg:p-6">
            {children || <Outlet />}
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Operation Progress Feedback */}
      {operations.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md">
          <OperationFeedback operations={operations} />
        </div>
      )}
    </div>
  );
}