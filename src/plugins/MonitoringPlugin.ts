/**
 * Monitoring & Maintenance Plugin - نظام المراقبة والصيانة
 */

import { Plugin } from '@/core/PluginSystem';
import { healthMonitoring } from '@/core/HealthMonitoring';
import { usageAnalytics } from '@/core/UsageAnalytics';
import { backupRestoreSystem } from '@/core/BackupRestoreSystem';

export interface MonitoringPluginConfig {
  healthChecksEnabled: boolean;
  usageTrackingEnabled: boolean;
  autoBackupEnabled: boolean;
  alertsEnabled: boolean;
  reportingEnabled: boolean;
}

class MonitoringPluginManager {
  private config: MonitoringPluginConfig = {
    healthChecksEnabled: true,
    usageTrackingEnabled: true,
    autoBackupEnabled: false,
    alertsEnabled: true,
    reportingEnabled: true
  };

  async onInit(): Promise<void> {
    console.log('Monitoring & Maintenance Plugin initialized');
    this.loadConfig();
    
    // بدء الأنظمة حسب الإعدادات
    if (this.config.healthChecksEnabled) {
      healthMonitoring.startMonitoring();
    }

    if (this.config.usageTrackingEnabled) {
      usageAnalytics.loadSavedMetrics();
      usageAnalytics.startTracking();
    }

    if (this.config.autoBackupEnabled) {
      backupRestoreSystem.startScheduledBackup();
    }

    // تتبع بدء النظام
    if (this.config.usageTrackingEnabled) {
      usageAnalytics.trackEvent('system_event', 'monitoring_plugin_started');
    }
  }

  async onDestroy(): Promise<void> {
    console.log('Monitoring & Maintenance Plugin destroyed');
    
    // إيقاف الأنظمة
    healthMonitoring.stopMonitoring();
    usageAnalytics.stopTracking();
    backupRestoreSystem.stopScheduledBackup();

    // تتبع إيقاف النظام
    if (this.config.usageTrackingEnabled) {
      usageAnalytics.trackEvent('system_event', 'monitoring_plugin_stopped');
    }
  }

  // تتبع أحداث النظام
  async onDataSync(data: any): Promise<any> {
    try {
      // تتبع عمليات مزامنة البيانات
      if (this.config.usageTrackingEnabled) {
        usageAnalytics.trackEvent('system_event', 'data_sync', {
          dataType: data.type,
          recordCount: data.records?.length || 0
        });
      }

      // التحقق من الحاجة لنسخة احتياطية تلقائية
      if (this.config.autoBackupEnabled && data.type === 'critical_update') {
        await this.createAutoBackup('critical_update');
      }

      return {
        success: true,
        monitoringData: {
          tracked: this.config.usageTrackingEnabled,
          healthChecked: this.config.healthChecksEnabled,
          backedUp: this.config.autoBackupEnabled
        }
      };
    } catch (error) {
      console.error('Monitoring plugin data sync error:', error);
      return {
        success: false,
        error: 'خطأ في مراقبة مزامنة البيانات'
      };
    }
  }

  // إنشاء نسخة احتياطية تلقائية
  private async createAutoBackup(reason: string): Promise<void> {
    try {
      const backup = await backupRestoreSystem.createBackup('auto', `نسخة تلقائية - ${reason}`, `تم إنشاؤها بسبب: ${reason}`);
      
      if (backup && this.config.usageTrackingEnabled) {
        usageAnalytics.trackEvent('system_event', 'auto_backup_created', {
          reason,
          backupId: backup.metadata.id,
          backupSize: backup.metadata.size
        });
      }
    } catch (error) {
      console.error('Auto backup failed:', error);
      
      if (this.config.usageTrackingEnabled) {
        usageAnalytics.trackEvent('system_event', 'auto_backup_failed', {
          reason,
          error: error instanceof Error ? error.message : 'unknown'
        });
      }
    }
  }

  // تحديث الإعدادات
  updateConfig(newConfig: Partial<MonitoringPluginConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();

    // تطبيق التغييرات
    if (oldConfig.healthChecksEnabled !== this.config.healthChecksEnabled) {
      if (this.config.healthChecksEnabled) {
        healthMonitoring.startMonitoring();
      } else {
        healthMonitoring.stopMonitoring();
      }
    }

    if (oldConfig.usageTrackingEnabled !== this.config.usageTrackingEnabled) {
      if (this.config.usageTrackingEnabled) {
        usageAnalytics.startTracking();
      } else {
        usageAnalytics.stopTracking();
      }
    }

    if (oldConfig.autoBackupEnabled !== this.config.autoBackupEnabled) {
      if (this.config.autoBackupEnabled) {
        backupRestoreSystem.startScheduledBackup();
      } else {
        backupRestoreSystem.stopScheduledBackup();
      }
    }

    console.log('Monitoring plugin config updated:', this.config);
  }

  // الحصول على تقرير شامل للنظام
  async getSystemReport(): Promise<any> {
    try {
      const report = {
        timestamp: new Date().toISOString(),
        health: {},
        usage: {},
        backups: {},
        summary: {}
      };

      // تقرير الصحة
      if (this.config.healthChecksEnabled) {
        report.health = healthMonitoring.getSystemHealth();
      }

      // تقرير الاستخدام
      if (this.config.usageTrackingEnabled) {
        report.usage = {
          realTime: usageAnalytics.getRealTimeStats(),
          weekly: usageAnalytics.generateUsageReport()
        };
      }

      // تقرير النسخ الاحتياطية
      report.backups = {
        stats: backupRestoreSystem.getBackupStats(),
        list: backupRestoreSystem.getBackupList().slice(0, 5) // أحدث 5 نسخ
      };

      // ملخص عام
      report.summary = {
        systemHealth: report.health && typeof report.health === 'object' && 'overall' in report.health ? report.health.overall : 'unknown',
        todayEvents: report.usage && typeof report.usage === 'object' && 'realTime' in report.usage && report.usage.realTime && typeof report.usage.realTime === 'object' && 'today' in report.usage.realTime && report.usage.realTime.today && typeof report.usage.realTime.today === 'object' && 'events' in report.usage.realTime.today ? report.usage.realTime.today.events : 0,
        lastBackup: report.backups && typeof report.backups === 'object' && 'list' in report.backups && Array.isArray(report.backups.list) && report.backups.list.length > 0 ? report.backups.list[0]?.createdAt || null : null,
        totalBackups: report.backups && typeof report.backups === 'object' && 'stats' in report.backups && report.backups.stats && typeof report.backups.stats === 'object' && 'total' in report.backups.stats ? report.backups.stats.total : 0
      };

      return report;
    } catch (error) {
      console.error('Failed to generate system report:', error);
      return {
        error: 'فشل في إنشاء تقرير النظام',
        timestamp: new Date().toISOString()
      };
    }
  }

  // تشغيل صيانة دورية
  async performMaintenance(): Promise<any> {
    try {
      console.log('Starting system maintenance...');
      
      const results = {
        started: new Date().toISOString(),
        tasks: [] as any[],
        completed: new Date().toISOString(),
        success: true
      };

      // تنظيف البيانات القديمة
      try {
        usageAnalytics.clearOldData(30); // الاحتفاظ بآخر 30 يوم
        results.tasks.push({
          name: 'cleanup_old_analytics',
          status: 'success',
          message: 'تم تنظيف البيانات القديمة'
        });
      } catch (error) {
        results.tasks.push({
          name: 'cleanup_old_analytics',
          status: 'error',
          message: `فشل في تنظيف البيانات: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
        });
      }

      // إنشاء نسخة احتياطية للصيانة
      if (this.config.autoBackupEnabled) {
        try {
          const backup = await backupRestoreSystem.createBackup('auto', 'نسخة صيانة دورية', 'تم إنشاؤها أثناء الصيانة الدورية');
          results.tasks.push({
            name: 'maintenance_backup',
            status: 'success',
            message: `تم إنشاء نسخة احتياطية: ${backup?.metadata.id}`,
            backupId: backup?.metadata.id
          });
        } catch (error) {
          results.tasks.push({
            name: 'maintenance_backup',
            status: 'error',
            message: `فشل في إنشاء النسخة الاحتياطية: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
          });
        }
      }

      // فحص صحة النظام
      if (this.config.healthChecksEnabled) {
        try {
          const checks = healthMonitoring.getAllChecks();
          let passedChecks = 0;
          
          for (const check of checks) {
            if (check.enabled) {
              await healthMonitoring.runManualCheck(check.name);
              if (check.lastResult?.status === 'healthy') {
                passedChecks++;
              }
            }
          }

          results.tasks.push({
            name: 'health_checks',
            status: 'success',
            message: `تم فحص الصحة: ${passedChecks}/${checks.length} فحص نجح`,
            passedChecks,
            totalChecks: checks.length
          });
        } catch (error) {
          results.tasks.push({
            name: 'health_checks',
            status: 'error',
            message: `فشل في فحص الصحة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
          });
        }
      }

      // تتبع الصيانة
      if (this.config.usageTrackingEnabled) {
        usageAnalytics.trackEvent('system_event', 'maintenance_completed', {
          tasksCount: results.tasks.length,
          successTasks: results.tasks.filter(t => t.status === 'success').length,
          duration: new Date().getTime() - new Date(results.started).getTime()
        });
      }

      results.completed = new Date().toISOString();
      console.log('System maintenance completed:', results);
      
      return results;
    } catch (error) {
      console.error('Maintenance failed:', error);
      return {
        success: false,
        error: `فشل في الصيانة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`,
        started: new Date().toISOString(),
        completed: new Date().toISOString()
      };
    }
  }

  // تحميل الإعدادات
  private loadConfig(): void {
    try {
      const saved = localStorage.getItem('monitoringPluginConfig');
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Failed to load monitoring config:', error);
    }
  }

  // حفظ الإعدادات
  private saveConfig(): void {
    try {
      localStorage.setItem('monitoringPluginConfig', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save monitoring config:', error);
    }
  }

  getConfig(): MonitoringPluginConfig {
    return { ...this.config };
  }

  // API للوصول للأنظمة الفرعية
  getHealthMonitoring() {
    return healthMonitoring;
  }

  getUsageAnalytics() {
    return usageAnalytics;
  }

  getBackupSystem() {
    return backupRestoreSystem;
  }
}

const monitoringPluginManager = new MonitoringPluginManager();

export const monitoringPlugin: Plugin = {
  metadata: {
    name: 'monitoring-maintenance-plugin',
    version: '1.0.0',
    description: 'نظام المراقبة والصيانة الشامل',
    author: 'System'
  },
  hooks: {
    onInit: () => monitoringPluginManager.onInit(),
    onDestroy: () => monitoringPluginManager.onDestroy(),
    onDataSync: (data) => monitoringPluginManager.onDataSync(data)
  },
  config: monitoringPluginManager.getConfig()
};

export { monitoringPluginManager };