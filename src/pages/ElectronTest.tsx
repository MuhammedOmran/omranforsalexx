import { ElectronTestDashboard } from '@/components/ui/electron-test-dashboard';
import { SEOManager } from '@/components/SEO/SEOManager';

export default function ElectronTest() {
  return (
    <>
      <SEOManager
        title="اختبار Electron - عمران للمبيعات"
        description="لوحة اختبار قاعدة البيانات المحلية وميزات Electron"
        keywords="Electron, SQLite, اختبار, قاعدة بيانات محلية, تطبيق سطح المكتب"
      />
      <div className="container mx-auto p-6">
        <ElectronTestDashboard />
      </div>
    </>
  );
}