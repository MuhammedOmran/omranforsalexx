import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializePerformanceOptimizations } from './utils/performanceOptimizer'
import './utils/unifiedErrorHandler'
import './utils/phaseCompletion'
import { executeCodeCleanup } from './utils/executeCodeCleanup'

// تهيئة بسيطة ومحسنة مع التنظيف
const initializeApp = async () => {
  try {
    await initializePerformanceOptimizations();
    
    // تنفيذ تنظيف الكود في الإنتاج
    if (process.env.NODE_ENV === 'production') {
      await executeCodeCleanup();
    }
  } catch (error) {
    // تجاهل أخطاء التهيئة لتجنب توقف التطبيق
  }
};

// تهيئة التطبيق
initializeApp();

createRoot(document.getElementById("root")!).render(<App />);
