/**
 * تنفيذ عملية التنظيف الشاملة للكود
 */

import { logger } from './logger';
import { comprehensiveCodeCleanup } from './comprehensiveCodeCleanup';
import { finalCleanup } from './finalCleanup';

/**
 * تنفيذ التنظيف الآن
 */
export const executeCodeCleanup = async () => {
  try {
    logger.info('🚀 بدء عملية التنظيف الشاملة للكود...');
    
    // 1. تنفيذ التنظيف الشامل
    const result = await comprehensiveCodeCleanup.performComprehensiveCleanup();
    
    // 2. تنفيذ التنظيف النهائي
    await finalCleanup.performFinalCleanup();
    
    // 3. تسجيل النتائج
    logger.info('✅ تم إكمال التنظيف بنجاح:', {
      filesProcessed: result.filesProcessed,
      consoleLogsRemoved: result.consoleLogsRemoved,
      todoItemsRemoved: result.todoItemsRemoved,
      temporaryCodeRemoved: result.temporaryCodeRemoved,
      commentsImproved: result.commentsImproved
    });
    
    // 4. إنشاء تقرير نهائي
    const report = comprehensiveCodeCleanup.generateCleanupReport();
    const status = comprehensiveCodeCleanup.validateCleanupStatus();
    
    logger.info('📊 تقرير التنظيف النهائي:', {
      report,
      status,
      cleanupScore: `${status.score}/100`
    });
    
    return {
      success: true,
      result,
      report,
      status
    };
    
  } catch (error) {
    logger.error('❌ خطأ في تنفيذ التنظيف:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// تنفيذ التنظيف فوراً
executeCodeCleanup().then(result => {
  if (result.success) {
    console.log('🎉 تم تنظيف الكود بنجاح!');
    console.log(`📈 نقاط النظافة: ${result.status?.score}/100`);
  } else {
    console.error('❌ فشل في تنظيف الكود:', result.error);
  }
});