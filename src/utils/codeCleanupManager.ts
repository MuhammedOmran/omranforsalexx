/**
 * أداة تنظيف الكود الشاملة
 * تقوم بإزالة console logs، التعليقات التطويرية، وتحسين معالجة الأخطاء
 */

import { logger } from './logger';

export interface CleanupStats {
  consoleLogs: number;
  consoleErrors: number;
  consoleWarns: number;
  devComments: number;
  unusedImports: number;
  errorHandlingImprovements: number;
}

export class CodeCleanupManager {
  private static instance: CodeCleanupManager;

  static getInstance(): CodeCleanupManager {
    if (!CodeCleanupManager.instance) {
      CodeCleanupManager.instance = new CodeCleanupManager();
    }
    return CodeCleanupManager.instance;
  }

  /**
   * تنظيف console logs من النصوص
   */
  cleanConsoleLogs(content: string): { content: string; removedCount: number } {
    let removedCount = 0;
    
    // إزالة console.log مع الحفاظ على logger calls
    content = content.replace(/console\.log\([^)]*\);?\s*/g, (match) => {
      removedCount++;
      return '';
    });

    // إزالة console.error مع الحفاظ على logger.error
    content = content.replace(/console\.error\([^)]*\);?\s*/g, (match) => {
      removedCount++;
      return '';
    });

    // إزالة console.warn مع الحفاظ على logger.warn
    content = content.replace(/console\.warn\([^)]*\);?\s*/g, (match) => {
      removedCount++;
      return '';
    });

    // إزالة console.debug
    content = content.replace(/console\.debug\([^)]*\);?\s*/g, (match) => {
      removedCount++;
      return '';
    });

    return { content, removedCount };
  }

  /**
   * إزالة التعليقات التطويرية
   */
  removeDevComments(content: string): { content: string; removedCount: number } {
    let removedCount = 0;
    
    // أنماط التعليقات التطويرية
    const devCommentPatterns = [
      /\/\/ TODO:.*$/gm,
      /\/\/ FIXME:.*$/gm,
      /\/\/ HACK:.*$/gm,
      /\/\/ DEBUG:.*$/gm,
      /\/\/ TEST:.*$/gm,
      /\/\/ TEMP:.*$/gm,
      /\/\/ XXX:.*$/gm,
      /\/\* TODO:.*?\*\//gs,
      /\/\* FIXME:.*?\*\//gs,
      /\/\* DEBUG:.*?\*\//gs,
      // إزالة التعليقات التي تحتوي على "تجريبي" أو "مؤقت"
      /\/\/.*تجريبي.*$/gm,
      /\/\/.*مؤقت.*$/gm,
      /\/\/.*للاختبار.*$/gm,
    ];

    devCommentPatterns.forEach(pattern => {
      content = content.replace(pattern, (match) => {
        removedCount++;
        return '';
      });
    });

    return { content, removedCount };
  }

  /**
   * تحسين معالجة الأخطاء
   */
  improveErrorHandling(content: string): { content: string; improvementCount: number } {
    let improvementCount = 0;

    // استبدال console.error بـ logger.error
    content = content.replace(/console\.error\(/g, () => {
      improvementCount++;
      return 'logger.error(';
    });

    // استبدال try-catch بسيط بمعالجة محسنة
    content = content.replace(
      /try\s*{([^}]+)}\s*catch\s*\(([^)]+)\)\s*{([^}]+)}/g,
      (match, tryBlock, errorVar, catchBlock) => {
        if (!catchBlock.includes('logger.error')) {
          improvementCount++;
          return `try {${tryBlock}} catch (${errorVar}) {
        logger.error('خطأ في العملية:', ${errorVar});${catchBlock}
      }`;
        }
        return match;
      }
    );

    return { content, improvementCount };
  }

  /**
   * تنظيف الاستيراد غير المستخدم
   */
  cleanUnusedImports(content: string): { content: string; removedCount: number } {
    let removedCount = 0;
    const lines = content.split('\n');
    const imports: { [key: string]: string } = {};
    const usedImports = new Set<string>();

    // جمع جميع الاستيراد
    lines.forEach(line => {
      const importMatch = line.match(/import\s+(?:{([^}]+)}|\*\s+as\s+(\w+)|(\w+))\s+from\s+['"`]([^'"`]+)['"`]/);
      if (importMatch) {
        const [, namedImports, namespaceImport, defaultImport, modulePath] = importMatch;
        
        if (namedImports) {
          namedImports.split(',').forEach(imp => {
            const trimmed = imp.trim();
            imports[trimmed] = line;
          });
        }
        if (namespaceImport) {
          imports[namespaceImport] = line;
        }
        if (defaultImport) {
          imports[defaultImport] = line;
        }
      }
    });

    // البحث عن الاستيراد المستخدم
    const contentWithoutImports = lines.filter(line => 
      !line.match(/^import\s+/)
    ).join('\n');

    Object.keys(imports).forEach(importName => {
      const regex = new RegExp(`\\b${importName}\\b`, 'g');
      if (regex.test(contentWithoutImports)) {
        usedImports.add(importName);
      }
    });

    // إزالة الاستيراد غير المستخدم
    const cleanedLines = lines.filter(line => {
      const importMatch = line.match(/import\s+(?:{([^}]+)}|\*\s+as\s+(\w+)|(\w+))\s+from/);
      if (importMatch) {
        const [, namedImports, namespaceImport, defaultImport] = importMatch;
        
        let hasUsedImport = false;
        
        if (namedImports) {
          const imports = namedImports.split(',').map(imp => imp.trim());
          hasUsedImport = imports.some(imp => usedImports.has(imp));
        }
        if (namespaceImport && usedImports.has(namespaceImport)) {
          hasUsedImport = true;
        }
        if (defaultImport && usedImports.has(defaultImport)) {
          hasUsedImport = true;
        }

        if (!hasUsedImport) {
          removedCount++;
          return false;
        }
      }
      return true;
    });

    return { content: cleanedLines.join('\n'), removedCount };
  }

  /**
   * تنظيف شامل للملف
   */
  cleanupFile(content: string): { content: string; stats: CleanupStats } {
    const stats: CleanupStats = {
      consoleLogs: 0,
      consoleErrors: 0,
      consoleWarns: 0,
      devComments: 0,
      unusedImports: 0,
      errorHandlingImprovements: 0
    };

    // تنظيف console logs
    const consoleResult = this.cleanConsoleLogs(content);
    content = consoleResult.content;
    stats.consoleLogs = consoleResult.removedCount;

    // إزالة التعليقات التطويرية
    const commentsResult = this.removeDevComments(content);
    content = commentsResult.content;
    stats.devComments = commentsResult.removedCount;

    // تحسين معالجة الأخطاء
    const errorResult = this.improveErrorHandling(content);
    content = errorResult.content;
    stats.errorHandlingImprovements = errorResult.improvementCount;

    // تنظيف الاستيراد غير المستخدم
    const importsResult = this.cleanUnusedImports(content);
    content = importsResult.content;
    stats.unusedImports = importsResult.removedCount;

    // تنظيف الأسطر الفارغة الزائدة
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

    return { content, stats };
  }

  /**
   * تسجيل إحصائيات التنظيف
   */
  logCleanupStats(filename: string, stats: CleanupStats): void {
    const totalChanges = stats.consoleLogs + stats.consoleErrors + stats.consoleWarns + 
                        stats.devComments + stats.unusedImports + stats.errorHandlingImprovements;

    if (totalChanges > 0) {
      logger.info(`🧹 تنظيف الملف: ${filename}`, {
        consoleLogs: stats.consoleLogs,
        devComments: stats.devComments,
        unusedImports: stats.unusedImports,
        errorHandling: stats.errorHandlingImprovements,
        total: totalChanges
      });
    }
  }
}

export const codeCleanupManager = CodeCleanupManager.getInstance();