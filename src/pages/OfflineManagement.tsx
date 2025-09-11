import { EnhancedOfflineManager } from '@/components/ui/enhanced-offline-manager';
import { SEOManager } from '@/components/SEO/SEOManager';

export default function OfflineManagement() {
  return (
    <>
      <SEOManager
        title="إدارة الوضع الأوف لاين المتقدم - عمران للمبيعات"
        description="مراقبة وإدارة قدرات التطبيق في العمل بدون إنترنت مع دعم قاعدة البيانات المحلية والنسخ الاحتياطي المتقدم"
        keywords="أوف لاين, Electron, SQLite, مزامنة البيانات, نسخ احتياطي, تخزين محلي, PWA"
      />
      <EnhancedOfflineManager />
    </>
  );
}