import { logger } from '@/utils/logger';
import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { AppLayout } from "@/components/layout/AppLayout";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { autoIntegrationSystem } from "@/utils/autoIntegrationSystem";
import { ErrorBoundary } from "@/components/ui/error-boundary/ErrorBoundary";
import { enhancedSystemIntegration } from "@/utils/enhancedSystemIntegration";
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

const Index = () => {
  const { isAuthenticated, loading } = useSupabaseAuth();

  useEffect(() => {
    try {
      // تطبيق الترابط التلقائي عند تحميل النظام
      const initializeSystem = async () => {
        try {
          if (!autoIntegrationSystem.isSystemInitialized()) {
            await autoIntegrationSystem.initializeSystemIntegration();
          }
          
          // تحديث الترابطات المحسنة
          enhancedSystemIntegration.updateAllIntegrations();
        } catch (error) {
          logger.error('خطأ في تهيئة النظام:', error);
        }
      };

      initializeSystem();
    } catch (error) {
      logger.error('خطأ في تحميل الصفحة الرئيسية:', error);
    }
  }, []);

  // إذا لم يكن المستخدم مصادق عليه، إعادة توجيه إلى صفحة المصادقة
  if (!loading && !isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // إذا كان النظام قيد التحميل، عرض شاشة تحميل
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-cairo">جاري تحميل النظام...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <AppLayout>
        <ErrorBoundary>
          <Dashboard />
        </ErrorBoundary>
      </AppLayout>
    </ErrorBoundary>
  );
};

export default Index;
