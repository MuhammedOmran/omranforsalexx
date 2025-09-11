/**
 * Storage utilities for offline functionality
 * Ensures data persistence and reliability
 */

export class OfflineStorage {
  private static instance: OfflineStorage;
  private syncQueue: Array<{ key: string; data: any; timestamp: number }> = [];

  static getInstance(): OfflineStorage {
    if (!OfflineStorage.instance) {
      OfflineStorage.instance = new OfflineStorage();
    }
    return OfflineStorage.instance;
  }

  /**
   * Enhanced localStorage with retry mechanism
   */
  setItem(key: string, data: any): boolean {
    try {
      const serializedData = JSON.stringify({
        data,
        timestamp: Date.now(),
        version: '1.0'
      });
      
      localStorage.setItem(key, serializedData);
      
      // Add to sync queue for backup
      this.addToSyncQueue(key, data);
      
      return true;
    } catch (error) {
      console.error(`Error saving to localStorage (${key}):`, error);
      return this.fallbackSave(key, data);
    }
  }

  /**
   * Enhanced localStorage retrieval
   */
  getItem<T>(key: string, defaultValue: T | null = null): T | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;

      // Try to parse as JSON first
      try {
        const parsed = JSON.parse(item);
        
        // Handle new format (with metadata)
        if (parsed && typeof parsed === 'object' && parsed.timestamp) {
          return parsed.data as T;
        }
        
        // Handle old format (direct data as JSON)
        return parsed as T;
      } catch (parseError) {
        // If JSON parsing fails, return the raw string value
        // This handles cases where strings are stored directly without JSON encoding
        return item as T;
      }
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return this.fallbackGet(key, defaultValue);
    }
  }

  /**
   * Remove item from localStorage
   */
  removeItem(key: string): boolean {
    try {
      localStorage.removeItem(key);
      this.removeFromSyncQueue(key);
      return true;
    } catch (error) {
      console.error(`Error removing from localStorage (${key}):`, error);
      return false;
    }
  }

  /**
   * Clear all data
   */
  clear(): boolean {
    try {
      localStorage.clear();
      this.syncQueue = [];
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }

  /**
   * Get all stored keys
   */
  getAllKeys(): string[] {
    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.error('Error getting localStorage keys:', error);
      return [];
    }
  }

  /**
   * Get all items as object
   */
  getAllItems(): Record<string, any> {
    try {
      const allData: Record<string, any> = {};
      
      for (const key of this.getAllKeys()) {
        try {
          allData[key] = this.getItem(key);
        } catch (error) {
          console.warn(`Skipping corrupted key ${key}:`, error);
          // Skip corrupted keys instead of failing completely
          continue;
        }
      }
      
      return allData;
    } catch (error) {
      console.error('Error getting all items:', error);
      return {};
    }
  }

  /**
   * Export all data for backup
   */
  exportData(): string {
    try {
      const allData = this.getAllItems();
      
      return JSON.stringify({
        data: allData,
        exportDate: new Date().toISOString(),
        version: '1.0'
      }, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      return '';
    }
  }

  /**
   * Import data from backup
   */
  importData(jsonData: string): boolean {
    try {
      const imported = JSON.parse(jsonData);
      
      if (!imported.data) {
        throw new Error('Invalid backup format');
      }
      
      for (const [key, value] of Object.entries(imported.data)) {
        this.setItem(key, value);
      }
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  /**
   * Check storage health
   */
  checkStorageHealth(): { isHealthy: boolean; errors: string[] } {
    const errors: string[] = [];
    
    try {
      // Test basic functionality
      const testKey = '__test_storage__';
      const testData = { test: true, timestamp: Date.now() };
      
      this.setItem(testKey, testData);
      const retrieved = this.getItem<{ test: boolean; timestamp: number }>(testKey);
      
      if (!retrieved || retrieved.test !== testData.test) {
        errors.push('Storage read/write test failed');
      }
      
      this.removeItem(testKey);
      
      // Check storage space
      const usage = this.getStorageUsage();
      if (usage.usedPercentage > 90) {
        errors.push('Storage is nearly full (> 90%)');
      }
      
    } catch (error) {
      errors.push(`Storage health check failed: ${error.message}`);
    }
    
    return {
      isHealthy: errors.length === 0,
      errors
    };
  }

  /**
   * Get storage usage information
   */
  getStorageUsage(): { used: number; total: number; usedPercentage: number } {
    try {
      let used = 0;
      for (const key of this.getAllKeys()) {
        used += localStorage.getItem(key)?.length || 0;
      }
      
      // Estimate total available (usually 5-10MB)
      const total = 5 * 1024 * 1024; // 5MB estimate
      
      return {
        used,
        total,
        usedPercentage: (used / total) * 100
      };
    } catch (error) {
      return { used: 0, total: 0, usedPercentage: 0 };
    }
  }

  /**
   * Fallback save using sessionStorage
   */
private fallbackSave(key: string, data: any): boolean {
  try {
    // Avoid attempting to store huge backups in sessionStorage
    if (key === '__auto_backup__') {
      const size = typeof data === 'string' ? data.length : JSON.stringify(data).length;
      if (size > 256 * 1024) { // 256KB limit for session storage
        console.warn('Skipping sessionStorage fallback for large auto backup');
        return false;
      }
    }

    sessionStorage.setItem(key, JSON.stringify(data));
    console.warn(`Saved to sessionStorage as fallback: ${key}`);
    return true;
  } catch (error) {
    console.error(`Fallback save failed for ${key}:`, error);
    return false;
  }
}

  /**
   * Fallback get using sessionStorage
   */
  private fallbackGet<T>(key: string, defaultValue: T | null): T | null {
    try {
      const item = sessionStorage.getItem(key);
      if (!item) return defaultValue;
      
      try {
        return JSON.parse(item);
      } catch (parseError) {
        // Return raw string if JSON parsing fails
        return item as T;
      }
    } catch (error) {
      console.error(`Fallback get failed for ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Add to sync queue for later synchronization
   */
  private addToSyncQueue(key: string, data: any): void {
    const existingIndex = this.syncQueue.findIndex(item => item.key === key);
    const queueItem = { key, data, timestamp: Date.now() };
    
    if (existingIndex !== -1) {
      this.syncQueue[existingIndex] = queueItem;
    } else {
      this.syncQueue.push(queueItem);
    }
    
    // Keep only last 100 items
    if (this.syncQueue.length > 100) {
      this.syncQueue = this.syncQueue.slice(-100);
    }
  }

  /**
   * Remove from sync queue
   */
  private removeFromSyncQueue(key: string): void {
    this.syncQueue = this.syncQueue.filter(item => item.key !== key);
  }
}

// Create singleton instance
export const storage = OfflineStorage.getInstance();

// Helper functions for common operations
export const saveData = (key: string, data: any): boolean => storage.setItem(key, data);
export const loadData = <T>(key: string, defaultValue: T | null = null): T | null => storage.getItem(key, defaultValue);
export const removeData = (key: string): boolean => storage.removeItem(key);
export const clearAllData = (): boolean => storage.clear();

// Data validation helpers
export const validateData = (data: any): boolean => {
  try {
    JSON.stringify(data);
    return true;
  } catch {
    return false;
  }
};

// Auto-backup functionality محسن
export const createAutoBackup = (): void => {
  try {
    const backupData = storage.exportData();
    if (!backupData) return;

    // Skip oversized backups to avoid QuotaExceededError
    const maxBytes = 512 * 1024; // 512KB safety limit
    if (backupData.length > maxBytes) {
      try {
        // Store a lightweight status instead
        localStorage.setItem('__auto_backup_status__', JSON.stringify({
          skipped: true,
          reason: 'backup_too_large',
          size: backupData.length,
          timestamp: new Date().toISOString(),
        }));
      } catch {}
      return; // do not attempt large backup
    }

    storage.setItem('__auto_backup__', {
      data: backupData,
      created: new Date().toISOString(),
    });
  } catch (err) {
    // swallow to avoid crashing the app on backup issues
  }
};

// تحسين Auto-backup للأداء
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    try {
      // Only attempt small backups on unload
      const data = storage.exportData();
      if (data && data.length <= 256 * 1024) {
        storage.setItem('__auto_backup__', { data, created: new Date().toISOString() });
      }
    } catch {}
  });
  
  // إنشاء backup كل 60 دقيقة وبشرط قيود الحجم والمساحة
  let lastBackupHash = '';
  setInterval(() => {
    try {
      const usage = storage.getStorageUsage();
      if (usage.usedPercentage > 85) return; // avoid when nearly full

      const currentData = storage.exportData();
      if (!currentData || currentData.length > 512 * 1024) return; // skip large

      const currentHash = btoa(unescape(encodeURIComponent(currentData))).slice(0, 100);
      if (currentHash !== lastBackupHash) {
        storage.setItem('__auto_backup__', { data: currentData, created: new Date().toISOString() });
        lastBackupHash = currentHash;
      }
    } catch {
      // ignore
    }
  }, 60 * 60 * 1000); // كل 60 دقيقة
}
