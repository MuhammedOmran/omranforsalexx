import { AppLayout } from '@/components/layout/AppLayout';
import { SecurityDashboard } from '@/components/security/SecurityDashboard';

export default function Security() {
  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">إدارة الأمان</h1>
            <p className="text-muted-foreground">
              مراقبة وإدارة الأمان والحماية في النظام
            </p>
          </div>
          
          <SecurityDashboard />
        </div>
      </div>
    </AppLayout>
  );
}