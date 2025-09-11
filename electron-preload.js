const { contextBridge, ipcRenderer } = require('electron');

try {
  contextBridge.exposeInMainWorld('electronAPI', {
    // معرف الجهاز والنسخ الاحتياطي
    getMachineId: () => ipcRenderer.invoke('get-machine-id'),
    getDefaultBackupDir: () => ipcRenderer.invoke('get-default-backup-dir'),
    saveBackup: (backupId, json, dir) => ipcRenderer.invoke('save-backup', { backupId, json, dir }),

    // قاعدة البيانات المحلية - العملاء
    getCustomers: (accountId) => ipcRenderer.invoke('db-get-customers', accountId),
    createCustomer: (customer) => ipcRenderer.invoke('db-create-customer', customer),
    updateCustomer: (id, customer) => ipcRenderer.invoke('db-update-customer', id, customer),
    deleteCustomer: (id) => ipcRenderer.invoke('db-delete-customer', id),

    // المنتجات
    getProducts: (accountId) => ipcRenderer.invoke('db-get-products', accountId),
    createProduct: (product) => ipcRenderer.invoke('db-create-product', product),
    updateProduct: (id, product) => ipcRenderer.invoke('db-update-product', id, product),

    // فواتير المبيعات
    getSalesInvoices: (accountId) => ipcRenderer.invoke('db-get-sales-invoices', accountId),
    createSalesInvoice: (invoice) => ipcRenderer.invoke('db-create-sales-invoice', invoice),

    // الفئات
    getCategories: (accountId) => ipcRenderer.invoke('db-get-categories', accountId),

    // النسخ الاحتياطي
    createDBBackup: (backupPath) => ipcRenderer.invoke('db-create-backup', backupPath),
    restoreDBBackup: (backupPath) => ipcRenderer.invoke('db-restore-backup', backupPath),

    // الإحصائيات
    getDashboardStats: (accountId) => ipcRenderer.invoke('db-get-dashboard-stats', accountId),

    // فحص بيئة Electron
    isElectron: true,
    platform: process.platform,
    versions: process.versions
  });
} catch (e) {
  // In non-Electron environments
  // noop
}
