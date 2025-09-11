/**
 * نظام الـ Plugins المرن لتوسع التطبيق
 */

export interface PluginMetadata {
  name: string;
  version: string;
  description: string;
  author: string;
  dependencies?: string[];
}

export interface PluginHooks {
  onInit?: () => Promise<void> | void;
  onDestroy?: () => Promise<void> | void;
  onDataSync?: (data: any) => Promise<any> | any;
  onSaleProcess?: (saleData: any) => Promise<any> | any;
  onInventoryUpdate?: (inventoryData: any) => Promise<any> | any;
  onReportGenerate?: (reportData: any) => Promise<any> | any;
}

export interface Plugin {
  metadata: PluginMetadata;
  hooks: PluginHooks;
  config?: Record<string, any>;
}

export interface PluginManagerConfig {
  autoInit?: boolean;
  loadOrder?: string[];
}

class PluginSystemManager {
  private plugins: Map<string, Plugin> = new Map();
  private loadOrder: string[] = [];
  private initialized: boolean = false;

  /**
   * تسجيل plugin جديد
   */
  register(plugin: Plugin): void {
    const { name } = plugin.metadata;
    
    if (this.plugins.has(name)) {
      console.warn(`Plugin ${name} already registered, replacing...`);
    }

    this.plugins.set(name, plugin);
    
    if (!this.loadOrder.includes(name)) {
      this.loadOrder.push(name);
    }

    console.log(`Plugin ${name} registered successfully`);
  }

  /**
   * إلغاء تسجيل plugin
   */
  unregister(name: string): boolean {
    if (!this.plugins.has(name)) {
      console.warn(`Plugin ${name} not found`);
      return false;
    }

    const plugin = this.plugins.get(name)!;
    
    // تشغيل hook الإلغاء
    if (plugin.hooks.onDestroy) {
      try {
        plugin.hooks.onDestroy();
      } catch (error) {
        console.error(`Error destroying plugin ${name}:`, error);
      }
    }

    this.plugins.delete(name);
    this.loadOrder = this.loadOrder.filter(p => p !== name);
    
    console.log(`Plugin ${name} unregistered successfully`);
    return true;
  }

  /**
   * تهيئة جميع الـ plugins
   */
  async initialize(config?: PluginManagerConfig): Promise<void> {
    if (this.initialized) {
      console.warn('Plugin system already initialized');
      return;
    }

    const loadOrder = config?.loadOrder || this.loadOrder;

    for (const pluginName of loadOrder) {
      const plugin = this.plugins.get(pluginName);
      if (!plugin) {
        console.warn(`Plugin ${pluginName} not found in load order`);
        continue;
      }

      try {
        if (plugin.hooks.onInit) {
          await plugin.hooks.onInit();
        }
        console.log(`Plugin ${pluginName} initialized successfully`);
      } catch (error) {
        console.error(`Failed to initialize plugin ${pluginName}:`, error);
      }
    }

    this.initialized = true;
    console.log('Plugin system initialized successfully');
  }

  /**
   * تشغيل hook معين في جميع الـ plugins
   */
  async executeHook<T>(hookName: keyof PluginHooks, data?: any): Promise<T[]> {
    const results: T[] = [];

    for (const pluginName of this.loadOrder) {
      const plugin = this.plugins.get(pluginName);
      if (!plugin || !plugin.hooks[hookName]) {
        continue;
      }

      try {
        const hook = plugin.hooks[hookName] as Function;
        const result = await hook(data);
        if (result !== undefined) {
          results.push(result);
        }
      } catch (error) {
        console.error(`Error executing ${hookName} in plugin ${pluginName}:`, error);
      }
    }

    return results;
  }

  /**
   * الحصول على plugin معين
   */
  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * الحصول على جميع الـ plugins المسجلة
   */
  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * الحصول على معلومات الـ plugins
   */
  getPluginInfo(): Array<{ name: string; version: string; description: string }> {
    return Array.from(this.plugins.values()).map(plugin => ({
      name: plugin.metadata.name,
      version: plugin.metadata.version,
      description: plugin.metadata.description
    }));
  }

  /**
   * تحديث إعدادات plugin
   */
  updatePluginConfig(name: string, config: Record<string, any>): boolean {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      console.warn(`Plugin ${name} not found`);
      return false;
    }

    plugin.config = { ...plugin.config, ...config };
    console.log(`Plugin ${name} config updated`);
    return true;
  }

  /**
   * إعادة تشغيل plugin معين
   */
  async reloadPlugin(name: string): Promise<boolean> {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      console.warn(`Plugin ${name} not found`);
      return false;
    }

    try {
      // إيقاف الـ plugin
      if (plugin.hooks.onDestroy) {
        await plugin.hooks.onDestroy();
      }

      // إعادة تشغيل الـ plugin
      if (plugin.hooks.onInit) {
        await plugin.hooks.onInit();
      }

      console.log(`Plugin ${name} reloaded successfully`);
      return true;
    } catch (error) {
      console.error(`Failed to reload plugin ${name}:`, error);
      return false;
    }
  }

  /**
   * تنظيف جميع الـ plugins
   */
  async cleanup(): Promise<void> {
    for (const pluginName of [...this.loadOrder].reverse()) {
      const plugin = this.plugins.get(pluginName);
      if (plugin?.hooks.onDestroy) {
        try {
          await plugin.hooks.onDestroy();
        } catch (error) {
          console.error(`Error cleaning up plugin ${pluginName}:`, error);
        }
      }
    }

    this.plugins.clear();
    this.loadOrder = [];
    this.initialized = false;
    
    console.log('Plugin system cleaned up');
  }
}

// إنشاء instance وحيد
export const pluginSystem = new PluginSystemManager();