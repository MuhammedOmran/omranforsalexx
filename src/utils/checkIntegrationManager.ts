import { storage } from './storage';
import { Check, checksManager } from './checksManager';

export interface CheckIntegration {
  checkId: string;
  ownerId: string;
  ownerName: string;
  ownerType: 'customer' | 'supplier' | 'employee';
  ownerPhone?: string;
  ownerEmail?: string;
  relationshipType: 'sales' | 'purchases' | 'salary' | 'other';
  relatedTransactionId?: string;
  confidence?: number;
  linkedAt?: string;
  linkedBy?: string;
}

export class CheckIntegrationManager {
  private static instance: CheckIntegrationManager;

  static getInstance(): CheckIntegrationManager {
    if (!CheckIntegrationManager.instance) {
      CheckIntegrationManager.instance = new CheckIntegrationManager();
    }
    return CheckIntegrationManager.instance;
  }

  // تحسين ربط الشيك بصاحبه مع معلومات إضافية

  // ربط محسن للشيك بصاحبه مع إضافة معلومات ذكية
  linkCheckWithOwner(checkId: string, ownerId: string, ownerType: 'customer' | 'supplier' | 'employee', confidence?: number): boolean {
    try {
      const checkIntegrations = storage.getItem('check_integrations', []);
      const checks = checksManager.getChecks();
      const check = checks.find(c => c.id === checkId);
      
      if (!check) return false;
      
      // البحث عن صاحب الشيك
      let owner = null;
      let ownerData: any = {};
      
      switch (ownerType) {
        case 'customer':
          const customers = storage.getItem('customers', []);
          owner = customers.find((c: any) => c.id?.toString() === ownerId.toString());
          if (owner) {
            ownerData = {
              ownerName: owner.name,
              ownerPhone: owner.phone,
              ownerEmail: owner.email
            };
          }
          break;
          
        case 'supplier':
          const suppliers = storage.getItem('suppliers', []);
          owner = suppliers.find((s: any) => s.id?.toString() === ownerId.toString());
          if (owner) {
            ownerData = {
              ownerName: owner.name,
              ownerPhone: owner.phone,
              ownerEmail: owner.email
            };
          }
          break;
          
        case 'employee':
          const employees = storage.getItem('employees', []);
          owner = employees.find((e: any) => e.id?.toString() === ownerId.toString());
          if (owner) {
            ownerData = {
              ownerName: owner.name,
              ownerPhone: owner.phone,
              ownerEmail: owner.email
            };
          }
          break;
      }
      
      if (!owner) return false;
      
      // تحديد نوع العلاقة
      let relationshipType: 'sales' | 'purchases' | 'salary' | 'other' = 'other';
      if (ownerType === 'customer') relationshipType = 'sales';
      else if (ownerType === 'supplier') relationshipType = 'purchases';
      else if (ownerType === 'employee') relationshipType = 'salary';
      
      // إنشاء ربط جديد أو تحديث الموجود
      const existingIntegration = checkIntegrations.find((ci: any) => ci.checkId === checkId);
      
      const integration: CheckIntegration = {
        checkId,
        ownerId,
        ownerName: ownerData.ownerName,
        ownerType,
        ownerPhone: ownerData.ownerPhone,
        ownerEmail: ownerData.ownerEmail,
        relationshipType,
        relatedTransactionId: check.relatedInvoiceId,
        confidence: confidence || 100,
        linkedAt: new Date().toISOString(),
        linkedBy: 'enhanced_system'
      };
      
      if (existingIntegration) {
        const index = checkIntegrations.findIndex((ci: any) => ci.checkId === checkId);
        checkIntegrations[index] = integration;
      } else {
        checkIntegrations.push(integration);
      }
      
      storage.setItem('check_integrations', checkIntegrations);
      
      // تحديث بيانات صاحب الشيك
      this.updateOwnerCheckData(ownerId, ownerType, check);
      
      return true;
    } catch (error) {
      console.error('Error linking check with owner:', error);
      return false;
    }
  }

  // ربط تلقائي للشيكات مع أصحابها بناءً على الاسم
  autoLinkChecks(): { linked: number; errors: string[] } {
    try {
      const checks = checksManager.getChecks();
      const customers = storage.getItem('customers', []);
      const suppliers = storage.getItem('suppliers', []);
      const employees = storage.getItem('employees', []);
      
      let linkedCount = 0;
      const errors: string[] = [];
      
      checks.forEach(check => {
        // البحث في العملاء أولاً
        let owner = customers.find((c: any) => 
          c.name === check.customerName || 
          c.phone === check.customerPhone
        );
        
        if (owner) {
          const success = this.linkCheckWithOwner(check.id, owner.id, 'customer');
          if (success) linkedCount++;
          else errors.push(`فشل في ربط الشيك ${check.checkNumber} مع العميل ${owner.name}`);
          return;
        }
        
        // البحث في الموردين
        owner = suppliers.find((s: any) => 
          s.name === check.customerName || 
          s.phone === check.customerPhone
        );
        
        if (owner) {
          const success = this.linkCheckWithOwner(check.id, owner.id, 'supplier');
          if (success) linkedCount++;
          else errors.push(`فشل في ربط الشيك ${check.checkNumber} مع المورد ${owner.name}`);
          return;
        }
        
        // البحث في الموظفين
        owner = employees.find((e: any) => 
          e.name === check.customerName || 
          e.phone === check.customerPhone
        );
        
        if (owner) {
          const success = this.linkCheckWithOwner(check.id, owner.id, 'employee');
          if (success) linkedCount++;
          else errors.push(`فشل في ربط الشيك ${check.checkNumber} مع الموظف ${owner.name}`);
        }
      });
      
      return { linked: linkedCount, errors };
    } catch (error) {
      console.error('Error auto-linking checks:', error);
      return { linked: 0, errors: [`خطأ في الربط التلقائي: ${error.message}`] };
    }
  }

  // الحصول على شيكات شخص معين
  getChecksByOwner(ownerId: string, ownerType: 'customer' | 'supplier' | 'employee'): Check[] {
    try {
      const checkIntegrations = storage.getItem('check_integrations', []);
      const ownerIntegrations = checkIntegrations.filter((ci: any) => 
        ci.ownerId === ownerId && ci.ownerType === ownerType
      );
      
      const checks = checksManager.getChecks();
      return checks.filter(check => 
        ownerIntegrations.some((oi: any) => oi.checkId === check.id)
      );
    } catch (error) {
      console.error('Error getting checks by owner:', error);
      return [];
    }
  }

  // الحصول على إحصائيات شيكات الشخص
  getOwnerCheckStatistics(ownerId: string, ownerType: 'customer' | 'supplier' | 'employee') {
    try {
      const ownerChecks = this.getChecksByOwner(ownerId, ownerType);
      
      const pendingChecks = ownerChecks.filter(c => c.status === 'pending');
      const cashedChecks = ownerChecks.filter(c => c.status === 'cashed');
      const bouncedChecks = ownerChecks.filter(c => c.status === 'bounced');
      
      const today = new Date();
      const overdueChecks = pendingChecks.filter(c => new Date(c.dueDate) < today);
      
      return {
        totalChecks: ownerChecks.length,
        pendingCount: pendingChecks.length,
        cashedCount: cashedChecks.length,
        bouncedCount: bouncedChecks.length,
        overdueCount: overdueChecks.length,
        totalPendingAmount: pendingChecks.reduce((sum, c) => sum + c.amount, 0),
        totalCashedAmount: cashedChecks.reduce((sum, c) => sum + c.amount, 0),
        totalBouncedAmount: bouncedChecks.reduce((sum, c) => sum + c.amount, 0),
        overdueAmount: overdueChecks.reduce((sum, c) => sum + c.amount, 0),
        bounceRate: ownerChecks.length > 0 ? (bouncedChecks.length / ownerChecks.length) * 100 : 0
      };
    } catch (error) {
      console.error('Error getting owner check statistics:', error);
      return {
        totalChecks: 0,
        pendingCount: 0,
        cashedCount: 0,
        bouncedCount: 0,
        overdueCount: 0,
        totalPendingAmount: 0,
        totalCashedAmount: 0,
        totalBouncedAmount: 0,
        overdueAmount: 0,
        bounceRate: 0
      };
    }
  }

  // تحديث بيانات صاحب الشيك
  private updateOwnerCheckData(ownerId: string, ownerType: 'customer' | 'supplier' | 'employee', check: Check): void {
    try {
      let dataKey = '';
      switch (ownerType) {
        case 'customer':
          dataKey = 'customers';
          break;
        case 'supplier':
          dataKey = 'suppliers';
          break;
        case 'employee':
          dataKey = 'employees';
          break;
      }
      
      const data = storage.getItem(dataKey, []);
      const ownerIndex = data.findIndex((item: any) => item.id?.toString() === ownerId.toString());
      
      if (ownerIndex !== -1) {
        const owner = data[ownerIndex];
        const statistics = this.getOwnerCheckStatistics(ownerId, ownerType);
        
        // تحديث إحصائيات الشيكات في ملف الشخص
        owner.checkStatistics = statistics;
        owner.lastCheckDate = check.dateReceived;
        owner.creditRisk = this.calculateCreditRisk(statistics);
        
        data[ownerIndex] = owner;
        storage.setItem(dataKey, data);
      }
    } catch (error) {
      console.error('Error updating owner check data:', error);
    }
  }

  // حساب مخاطر الائتمان
  private calculateCreditRisk(statistics: any): 'منخفض' | 'متوسط' | 'عالي' {
    const bounceRate = statistics.bounceRate || 0;
    const overdueRate = statistics.pendingCount > 0 ? 
      (statistics.overdueCount / statistics.pendingCount) * 100 : 0;
    
    if (bounceRate > 20 || overdueRate > 50) return 'عالي';
    if (bounceRate > 10 || overdueRate > 25) return 'متوسط';
    return 'منخفض';
  }

  // الحصول على تفاصيل ربط الشيك
  getCheckIntegration(checkId: string): CheckIntegration | null {
    try {
      const checkIntegrations = storage.getItem('check_integrations', []);
      return checkIntegrations.find((ci: any) => ci.checkId === checkId) || null;
    } catch (error) {
      console.error('Error getting check integration:', error);
      return null;
    }
  }

  // الحصول على تقرير شامل للشيكات حسب النوع
  getCheckIntegrationReport() {
    try {
      const checkIntegrations = storage.getItem('check_integrations', []);
      const checks = checksManager.getChecks();
      
      const customerChecks = checkIntegrations.filter((ci: any) => ci.ownerType === 'customer');
      const supplierChecks = checkIntegrations.filter((ci: any) => ci.ownerType === 'supplier');
      const employeeChecks = checkIntegrations.filter((ci: any) => ci.ownerType === 'employee');
      
      const totalLinked = checkIntegrations.length;
      const totalUnlinked = checks.length - totalLinked;
      
      return {
        summary: {
          totalChecks: checks.length,
          linkedChecks: totalLinked,
          unlinkedChecks: totalUnlinked,
          linkingRate: checks.length > 0 ? (totalLinked / checks.length) * 100 : 0
        },
        byOwnerType: {
          customers: {
            count: customerChecks.length,
            totalAmount: this.calculateTotalAmountByIntegrations(customerChecks)
          },
          suppliers: {
            count: supplierChecks.length,
            totalAmount: this.calculateTotalAmountByIntegrations(supplierChecks)
          },
          employees: {
            count: employeeChecks.length,
            totalAmount: this.calculateTotalAmountByIntegrations(employeeChecks)
          }
        },
        riskAnalysis: this.analyzeCheckRisks(),
        topCheckHolders: this.getTopCheckHolders()
      };
    } catch (error) {
      console.error('Error generating check integration report:', error);
      return null;
    }
  }

  // حساب إجمالي مبلغ الشيكات حسب الربط
  private calculateTotalAmountByIntegrations(integrations: any[]): number {
    const checks = checksManager.getChecks();
    return integrations.reduce((sum, integration) => {
      const check = checks.find(c => c.id === integration.checkId);
      return sum + (check?.amount || 0);
    }, 0);
  }

  // تحليل مخاطر الشيكات
  private analyzeCheckRisks() {
    try {
      const checkIntegrations = storage.getItem('check_integrations', []);
      const checks = checksManager.getChecks();
      
      const riskLevels = {
        منخفض: 0,
        متوسط: 0,
        عالي: 0
      };
      
      checkIntegrations.forEach((integration: any) => {
        const ownerStats = this.getOwnerCheckStatistics(integration.ownerId, integration.ownerType);
        const risk = this.calculateCreditRisk(ownerStats);
        riskLevels[risk]++;
      });
      
      return riskLevels;
    } catch (error) {
      console.error('Error analyzing check risks:', error);
      return { منخفض: 0, متوسط: 0, عالي: 0 };
    }
  }

  // الحصول على أكبر حاملي الشيكات
  private getTopCheckHolders(limit: number = 10) {
    try {
      const checkIntegrations = storage.getItem('check_integrations', []);
      
      // تجميع الشيكات حسب صاحبها
      const ownerGroups: { [key: string]: any } = {};
      
      checkIntegrations.forEach((integration: any) => {
        const key = `${integration.ownerId}_${integration.ownerType}`;
        if (!ownerGroups[key]) {
          ownerGroups[key] = {
            ownerId: integration.ownerId,
            ownerName: integration.ownerName,
            ownerType: integration.ownerType,
            checkCount: 0,
            totalAmount: 0
          };
        }
        ownerGroups[key].checkCount++;
        
        // حساب المبلغ الإجمالي
        const checks = checksManager.getChecks();
        const check = checks.find(c => c.id === integration.checkId);
        if (check) {
          ownerGroups[key].totalAmount += check.amount;
        }
      });
      
      // تحويل إلى مصفوفة وترتيب حسب المبلغ الإجمالي
      return Object.values(ownerGroups)
        .sort((a: any, b: any) => b.totalAmount - a.totalAmount)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting top check holders:', error);
      return [];
    }
  }

  // مزامنة جميع الشيكات مع أصحابها
  syncAllCheckIntegrations(): { synced: number; errors: string[] } {
    try {
      // إزالة الروابط القديمة
      storage.setItem('check_integrations', []);
      
      // إعادة ربط تلقائي
      const result = this.autoLinkChecks();
      
      console.log(`Synced ${result.linked} check integrations`);
      return { synced: result.linked, errors: result.errors };
    } catch (error) {
      console.error('Error syncing check integrations:', error);
      return { synced: 0, errors: [`خطأ في المزامنة: ${error.message}`] };
    }
  }
}

// Export singleton instance
export const checkIntegrationManager = CheckIntegrationManager.getInstance();