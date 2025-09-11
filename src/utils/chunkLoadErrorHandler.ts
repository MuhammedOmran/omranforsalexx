/**
 * معالج أخطاء تحميل الـ chunks المحسن
 */

interface ChunkLoadError extends Error {
  type?: string;
  target?: any;
}

class ChunkLoadErrorHandler {
  private retryAttempts = new Map<string, number>();
  private maxRetries = 3;
  private retryDelay = 1000;

  constructor() {
    this.setupGlobalErrorHandling();
  }

  private setupGlobalErrorHandling() {
    // معالجة أخطاء تحميل الـ chunks
    window.addEventListener('error', (event) => {
      if (this.isChunkLoadError(event.error)) {
        this.handleChunkLoadError(event.error);
      }
    });

    // معالجة أخطاء الـ dynamic imports
    window.addEventListener('unhandledrejection', (event) => {
      if (this.isDynamicImportError(event.reason)) {
        this.handleDynamicImportError(event.reason);
        event.preventDefault(); // منع الظهور في console
      }
    });
  }

  private isChunkLoadError(error: any): boolean {
    if (!error) return false;
    
    const message = error.message || '';
    return (
      message.includes('Loading chunk') ||
      message.includes('Loading CSS chunk') ||
      message.includes('ChunkLoadError') ||
      (error.name === 'ChunkLoadError')
    );
  }

  private isDynamicImportError(error: any): boolean {
    if (!error) return false;
    
    const message = error.message || '';
    return (
      message.includes('Failed to fetch dynamically imported module') ||
      message.includes('Loading chunk') ||
      message.includes('Loading CSS chunk')
    );
  }

  private async handleChunkLoadError(error: ChunkLoadError) {
    console.warn('Chunk load error detected:', error);
    
    const errorKey = this.getErrorKey(error);
    const attempts = this.retryAttempts.get(errorKey) || 0;
    
    if (attempts < this.maxRetries) {
      this.retryAttempts.set(errorKey, attempts + 1);
      
      console.log(`Retrying chunk load (attempt ${attempts + 1}/${this.maxRetries})`);
      
      // انتظار قبل إعادة المحاولة
      await this.delay(this.retryDelay * (attempts + 1));
      
      // محاولة إعادة تحميل الصفحة
      this.reloadWithCacheBust();
    } else {
      console.error('Max retry attempts reached for chunk loading');
      this.showUserFriendlyError();
    }
  }

  private async handleDynamicImportError(error: any) {
    console.warn('Dynamic import error detected:', error);
    
    const errorKey = error.message || 'dynamic_import_error';
    const attempts = this.retryAttempts.get(errorKey) || 0;
    
    if (attempts < this.maxRetries) {
      this.retryAttempts.set(errorKey, attempts + 1);
      
      console.log(`Retrying dynamic import (attempt ${attempts + 1}/${this.maxRetries})`);
      
      // محاولة مسح الذاكرة المؤقتة
      await this.clearServiceWorkerCache();
      
      // انتظار قبل إعادة المحاولة
      await this.delay(this.retryDelay);
      
      // إعادة تحميل الصفحة
      window.location.reload();
    } else {
      console.error('Max retry attempts reached for dynamic import');
      this.showUserFriendlyError();
    }
  }

  private getErrorKey(error: ChunkLoadError): string {
    return error.message || error.type || 'unknown_chunk_error';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async clearServiceWorkerCache() {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('Service worker cache cleared');
      } catch (error) {
        console.warn('Failed to clear service worker cache:', error);
      }
    }
  }

  private reloadWithCacheBust() {
    // إضافة timestamp لتجنب الذاكرة المؤقتة
    const url = new URL(window.location.href);
    url.searchParams.set('_reload', Date.now().toString());
    window.location.href = url.toString();
  }

  private showUserFriendlyError() {
    // إظهار رسالة خطأ للمستخدم
    const errorMessage = document.createElement('div');
    errorMessage.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        color: white;
        font-family: Arial, sans-serif;
      ">
        <div style="
          background: #1f2937;
          padding: 2rem;
          border-radius: 8px;
          max-width: 400px;
          text-align: center;
        ">
          <h2 style="margin: 0 0 1rem 0;">خطأ في التحميل</h2>
          <p style="margin: 0 0 1.5rem 0;">
            عذراً، فشل في تحميل جزء من التطبيق. 
            يرجى التحقق من اتصال الإنترنت وإعادة تحميل الصفحة.
          </p>
          <button 
            onclick="window.location.reload()"
            style="
              background: #3b82f6;
              color: white;
              border: none;
              padding: 0.5rem 1rem;
              border-radius: 4px;
              cursor: pointer;
            "
          >
            إعادة تحميل الصفحة
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(errorMessage);
  }

  // API عامة لإعادة تعيين المحاولات
  public resetRetryAttempts() {
    this.retryAttempts.clear();
  }

  // API للحصول على إحصائيات الأخطاء
  public getErrorStats() {
    return {
      totalErrors: this.retryAttempts.size,
      errors: Array.from(this.retryAttempts.entries()).map(([error, attempts]) => ({
        error,
        attempts
      }))
    };
  }
}

// إنشاء مثيل واحد للتطبيق
export const chunkLoadErrorHandler = new ChunkLoadErrorHandler();

// تصدير دالة للاستخدام في الـ dynamic imports
export const handleDynamicImport = async <T>(
  importFn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await importFn();
    } catch (error) {
      lastError = error;
      console.warn(`Dynamic import failed (attempt ${attempt + 1}/${maxRetries}):`, error);
      
      if (attempt < maxRetries - 1) {
        // انتظار متزايد قبل إعادة المحاولة
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }
  
  throw lastError;
};