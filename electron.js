const { app, BrowserWindow, session, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const LocalDatabase = require('./src/utils/localDatabase');
const isDev = process.env.NODE_ENV === 'development';

// إنشاء مثيل قاعدة البيانات
let localDB = null;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      preload: path.join(__dirname, 'electron-preload.js'),
      sandbox: false
    },
    icon: path.join(__dirname, 'public/omran-latest-logo.png'),
    show: false,
    titleBarStyle: 'default',
    autoHideMenuBar: true, // إخفاء شريط القوائم
    resizable: true,
    maximizable: true,
    fullscreenable: true
  });

  // تحميل التطبيق
  if (isDev) {
    mainWindow.loadURL('http://localhost:8080');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  // إظهار النافذة عند جاهزيتها
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // التعامل مع إغلاق النافذة
  mainWindow.on('closed', () => {
    app.quit();
  });
}

// تطبيق جاهز
app.whenReady().then(() => {
  // Block all external requests (allow only file://, devtools, and localhost in dev)
  try {
    const allowRequest = (url) => {
      if (url.startsWith('file://') || url.startsWith('devtools://')) return true;
      if (isDev && (url.startsWith('http://localhost') || url.startsWith('ws://localhost'))) return true;
      return false;
    };

    if (session && session.defaultSession) {
      session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
        const allowed = allowRequest(details.url);
        if (!allowed) {
          return callback({ cancel: true });
        }
        return callback({ cancel: false });
      });
    }
  } catch (e) {
    console.error('Failed to set request blocking:', e);
  }

  // IPC handlers for backup and device fingerprint
  const computeMachineId = () => {
    try {
      const nets = os.networkInterfaces();
      const macs = Object.values(nets)
        .flat()
        .filter(Boolean)
        .map((n) => n.mac)
        .filter((m) => m && m !== '00:00:00:00:00:00');
      const idSource = [os.hostname(), os.arch(), os.platform(), os.release(), os.userInfo().username, ...macs].join('|');
      return crypto.createHash('sha256').update(idSource).digest('hex');
    } catch {
      return 'unknown-machine';
    }
  };

  const ensureBackupDir = () => {
    const base = app.getPath('documents'); // default to Documents
    const dir = path.join(base, 'OmranBackups');
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch {}
    return dir;
  };

  // Enforce simple offline single-device lock (best-effort, offline)
  try {
    const lockDir = path.join(app.getPath('appData'), 'OmranApp');
    const lockFile = path.join(lockDir, 'device.lock.json');
    fs.mkdirSync(lockDir, { recursive: true });
    const currentId = computeMachineId();
    if (fs.existsSync(lockFile)) {
      const saved = JSON.parse(fs.readFileSync(lockFile, 'utf-8'));
      if (saved.machineId && saved.machineId !== currentId) {
        console.error('Device lock mismatch. Exiting.');
        app.quit();
        return;
      }
    } else {
      fs.writeFileSync(lockFile, JSON.stringify({ machineId: currentId, createdAt: new Date().toISOString() }, null, 2));
    }
  } catch (e) {
    console.warn('Device lock initialization warning:', e);
  }

  ipcMain.handle('get-machine-id', () => computeMachineId());

  ipcMain.handle('get-default-backup-dir', () => ensureBackupDir());

  ipcMain.handle('save-backup', async (_event, { backupId, json, dir }) => {
    try {
      const targetDir = dir && typeof dir === 'string' ? dir : ensureBackupDir();
      fs.mkdirSync(targetDir, { recursive: true });
      const filePath = path.join(targetDir, `${backupId}.json`);

      // Validate JSON and checksum before writing
      const obj = JSON.parse(json);
      if (!obj || !obj.metadata || !obj.data) {
        throw new Error('Invalid backup structure');
      }
      const dataString = JSON.stringify(obj.data);
      const checksum = crypto.createHash('sha256').update(dataString).digest('hex');
      if (checksum !== obj.metadata.checksum) {
        throw new Error('Checksum mismatch');
      }

      // Write atomically: temp then rename
      const tmpPath = filePath + '.tmp';
      fs.writeFileSync(tmpPath, json);
      fs.renameSync(tmpPath, filePath);

      return { success: true, path: filePath };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  });

  // تهيئة قاعدة البيانات
  initializeDatabase();

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// إنهاء التطبيق عند إغلاق جميع النوافذ
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// منع عدة مثيلات من التطبيق
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// تهيئة قاعدة البيانات
async function initializeDatabase() {
  try {
    localDB = new LocalDatabase();
    await localDB.initialize();
    console.log('تم تهيئة قاعدة البيانات المحلية بنجاح');
    
    // تسجيل جميع IPC handlers لقاعدة البيانات
    registerDatabaseHandlers();
  } catch (error) {
    console.error('فشل في تهيئة قاعدة البيانات:', error);
    
    // عرض رسالة خطأ للمستخدم
    dialog.showErrorBox(
      'خطأ في قاعدة البيانات',
      'فشل في تهيئة قاعدة البيانات. يرجى إعادة تشغيل التطبيق.'
    );
  }
}

// تسجيل جميع IPC handlers لقاعدة البيانات
function registerDatabaseHandlers() {
  // العملاء
  ipcMain.handle('db-get-customers', async (event, accountId) => {
    try {
      return await localDB.allQuery(
        'SELECT * FROM customers WHERE account_id = ? ORDER BY created_at DESC',
        [accountId]
      );
    } catch (error) {
      throw new Error(`خطأ في جلب العملاء: ${error.message}`);
    }
  });

  ipcMain.handle('db-create-customer', async (event, customer) => {
    try {
      const id = customer.id || `cust_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      await localDB.runQuery(
        `INSERT INTO customers (id, account_id, name, phone, email, address, notes, credit_limit)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, customer.account_id, customer.name, customer.phone, customer.email, 
         customer.address, customer.notes, customer.credit_limit || 0]
      );
      return { success: true, id };
    } catch (error) {
      throw new Error(`خطأ في إنشاء العميل: ${error.message}`);
    }
  });

  ipcMain.handle('db-update-customer', async (event, id, customer) => {
    try {
      await localDB.runQuery(
        `UPDATE customers SET name = ?, phone = ?, email = ?, address = ?, 
         notes = ?, credit_limit = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [customer.name, customer.phone, customer.email, customer.address,
         customer.notes, customer.credit_limit, id]
      );
      return { success: true };
    } catch (error) {
      throw new Error(`خطأ في تحديث العميل: ${error.message}`);
    }
  });

  ipcMain.handle('db-delete-customer', async (event, id) => {
    try {
      await localDB.runQuery('DELETE FROM customers WHERE id = ?', [id]);
      return { success: true };
    } catch (error) {
      throw new Error(`خطأ في حذف العميل: ${error.message}`);
    }
  });

  // المنتجات
  ipcMain.handle('db-get-products', async (event, accountId) => {
    try {
      return await localDB.allQuery(
        `SELECT p.*, c.name as category_name 
         FROM products p 
         LEFT JOIN categories c ON p.category_id = c.id 
         WHERE p.account_id = ? 
         ORDER BY p.created_at DESC`,
        [accountId]
      );
    } catch (error) {
      throw new Error(`خطأ في جلب المنتجات: ${error.message}`);
    }
  });

  ipcMain.handle('db-create-product', async (event, product) => {
    try {
      const id = product.id || `prod_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      await localDB.runQuery(
        `INSERT INTO products (id, account_id, name, description, category_id, barcode, sku,
         cost_price, selling_price, min_stock, current_stock, unit, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, product.account_id, product.name, product.description, product.category_id,
         product.barcode, product.sku, product.cost_price || 0, product.selling_price || 0,
         product.min_stock || 0, product.current_stock || 0, product.unit || 'قطعة', 1]
      );
      return { success: true, id };
    } catch (error) {
      throw new Error(`خطأ في إنشاء المنتج: ${error.message}`);
    }
  });

  ipcMain.handle('db-update-product', async (event, id, product) => {
    try {
      await localDB.runQuery(
        `UPDATE products SET name = ?, description = ?, category_id = ?, barcode = ?,
         sku = ?, cost_price = ?, selling_price = ?, min_stock = ?, current_stock = ?,
         unit = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [product.name, product.description, product.category_id, product.barcode,
         product.sku, product.cost_price, product.selling_price, product.min_stock,
         product.current_stock, product.unit, id]
      );
      return { success: true };
    } catch (error) {
      throw new Error(`خطأ في تحديث المنتج: ${error.message}`);
    }
  });

  // فواتير المبيعات
  ipcMain.handle('db-get-sales-invoices', async (event, accountId) => {
    try {
      return await localDB.allQuery(
        `SELECT si.*, c.name as customer_name 
         FROM sales_invoices si 
         LEFT JOIN customers c ON si.customer_id = c.id 
         WHERE si.account_id = ? 
         ORDER BY si.created_at DESC`,
        [accountId]
      );
    } catch (error) {
      throw new Error(`خطأ في جلب فواتير المبيعات: ${error.message}`);
    }
  });

  ipcMain.handle('db-create-sales-invoice', async (event, invoice) => {
    try {
      const invoiceId = invoice.id || `inv_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      
      // إدراج الفاتورة
      await localDB.runQuery(
        `INSERT INTO sales_invoices (id, account_id, invoice_number, customer_id,
         invoice_date, subtotal, tax_amount, discount_amount, total_amount, paid_amount, status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [invoiceId, invoice.account_id, invoice.invoice_number, invoice.customer_id,
         invoice.invoice_date, invoice.subtotal || 0, invoice.tax_amount || 0,
         invoice.discount_amount || 0, invoice.total_amount || 0, invoice.paid_amount || 0,
         invoice.status || 'pending', invoice.notes]
      );

      // إدراج عناصر الفاتورة
      if (invoice.items && invoice.items.length > 0) {
        for (const item of invoice.items) {
          const itemId = `item_${Date.now()}_${Math.random().toString(36).slice(2)}`;
          await localDB.runQuery(
            `INSERT INTO sales_invoice_items (id, invoice_id, product_id, quantity, unit_price, total_price, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [itemId, invoiceId, item.product_id, item.quantity, item.unit_price, item.total_price, item.notes]
          );

          // تحديث المخزون
          await localDB.runQuery(
            `UPDATE products SET current_stock = current_stock - ? WHERE id = ?`,
            [item.quantity, item.product_id]
          );

          // إضافة حركة مخزون
          const movementId = `mov_${Date.now()}_${Math.random().toString(36).slice(2)}`;
          await localDB.runQuery(
            `INSERT INTO inventory_movements (id, account_id, product_id, type, quantity, reference_id, reference_type)
             VALUES (?, ?, ?, 'out', ?, ?, 'sales_invoice')`,
            [movementId, invoice.account_id, item.product_id, item.quantity, invoiceId]
          );
        }
      }

      return { success: true, id: invoiceId };
    } catch (error) {
      throw new Error(`خطأ في إنشاء فاتورة المبيعات: ${error.message}`);
    }
  });

  // الفئات
  ipcMain.handle('db-get-categories', async (event, accountId) => {
    try {
      return await localDB.allQuery(
        'SELECT * FROM categories WHERE account_id = ? ORDER BY name',
        [accountId]
      );
    } catch (error) {
      throw new Error(`خطأ في جلب الفئات: ${error.message}`);
    }
  });

  // النسخ الاحتياطي
  ipcMain.handle('db-create-backup', async (event, backupPath) => {
    try {
      return await localDB.createBackup(backupPath);
    } catch (error) {
      throw new Error(`خطأ في إنشاء النسخة الاحتياطية: ${error.message}`);
    }
  });

  ipcMain.handle('db-restore-backup', async (event, backupPath) => {
    try {
      return await localDB.restoreBackup(backupPath);
    } catch (error) {
      throw new Error(`خطأ في استيراد النسخة الاحتياطية: ${error.message}`);
    }
  });

  // إحصائيات
  ipcMain.handle('db-get-dashboard-stats', async (event, accountId) => {
    try {
      const stats = {};
      
      // إجمالي العملاء
      const customerCount = await localDB.getQuery(
        'SELECT COUNT(*) as count FROM customers WHERE account_id = ?',
        [accountId]
      );
      stats.totalCustomers = customerCount?.count || 0;

      // إجمالي المنتجات
      const productCount = await localDB.getQuery(
        'SELECT COUNT(*) as count FROM products WHERE account_id = ?',
        [accountId]
      );
      stats.totalProducts = productCount?.count || 0;

      // مبيعات هذا الشهر
      const monthSales = await localDB.getQuery(
        `SELECT COALESCE(SUM(total_amount), 0) as total 
         FROM sales_invoices 
         WHERE account_id = ? AND strftime('%Y-%m', invoice_date) = strftime('%Y-%m', 'now')`,
        [accountId]
      );
      stats.monthSales = monthSales?.total || 0;

      // المنتجات منخفضة المخزون
      const lowStock = await localDB.allQuery(
        'SELECT * FROM products WHERE account_id = ? AND current_stock <= min_stock AND is_active = 1',
        [accountId]
      );
      stats.lowStockProducts = lowStock || [];

      return stats;
    } catch (error) {
      throw new Error(`خطأ في جلب الإحصائيات: ${error.message}`);
    }
  });

  console.log('تم تسجيل جميع IPC handlers لقاعدة البيانات');
}