declare global {
  interface Window {
    electronAPI?: {
      // النسخ الاحتياطي
      getMachineId: () => Promise<string>;
      getDefaultBackupDir: () => Promise<string>;
      saveBackup: (
        backupId: string,
        json: string,
        dir?: string
      ) => Promise<{ success: boolean; path?: string; error?: string }>;
      
      // قاعدة البيانات المحلية
      getCustomers: (accountId: string) => Promise<any[]>;
      createCustomer: (customer: any) => Promise<{ success: boolean; id: string }>;
      updateCustomer: (id: string, customer: any) => Promise<{ success: boolean }>;
      deleteCustomer: (id: string) => Promise<{ success: boolean }>;
      
      getProducts: (accountId: string) => Promise<any[]>;
      createProduct: (product: any) => Promise<{ success: boolean; id: string }>;
      updateProduct: (id: string, product: any) => Promise<{ success: boolean }>;
      
      getSalesInvoices: (accountId: string) => Promise<any[]>;
      createSalesInvoice: (invoice: any) => Promise<{ success: boolean; id: string }>;
      
      getCategories: (accountId: string) => Promise<any[]>;
      
      createDBBackup: (backupPath: string) => Promise<{ success: boolean; path?: string; error?: string }>;
      restoreDBBackup: (backupPath: string) => Promise<{ success: boolean; error?: string }>;
      
      getDashboardStats: (accountId: string) => Promise<any>;
      
      // معلومات النظام
      isElectron: boolean;
      platform: string;
      versions: any;
    };
  }
}

export {};