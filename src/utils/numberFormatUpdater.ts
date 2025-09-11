/**
 * مكتبة تحديث شاملة لجميع تنسيقات الأرقام في التطبيق
 * لضمان استخدام الأرقام الإنجليزية في جميع أنحاء النظام
 */

import { formatDateEnglish, formatDateTimeEnglish, formatNumberEnglish } from './numberLocalization';

/**
 * كلاس للتحديث الشامل لتنسيقات الأرقام
 */
export class NumberFormatUpdater {
  /**
   * قائمة بأنماط التنسيق المختلفة التي يجب تحديثها
   */
  private static readonly LOCALE_PATTERNS = [
    // أنماط toLocaleString
    /\.toLocaleString\(\s*['"`]ar[-\w]*['"`]\s*\)/g,
    /\.toLocaleString\(\s*['"`]ar['"`]\s*\)/g,
    
    // أنماط toLocaleDateString
    /\.toLocaleDateString\(\s*['"`]ar[-\w]*['"`]\s*\)/g,
    /\.toLocaleDateString\(\s*['"`]ar['"`]\s*\)/g,
    
    // أنماط toLocaleTimeString
    /\.toLocaleTimeString\(\s*['"`]ar[-\w]*['"`]\s*\)/g,
    /\.toLocaleTimeString\(\s*['"`]ar['"`]\s*\)/g,
  ];

  /**
   * تحديث تنسيق الأرقام في النص
   * @param content محتوى الملف
   * @returns المحتوى المحدث
   */
  static updateNumberFormats(content: string): string {
    let updatedContent = content;

    // تحديث toLocaleString للأرقام
    updatedContent = updatedContent.replace(
      /(\w+)\.toLocaleString\(\s*['"`]ar(?:-\w+)?['"`]\s*\)/g,
      "$1.toLocaleString('en-US')"
    );

    // تحديث toLocaleDateString مع إضافة numberingSystem
    updatedContent = updatedContent.replace(
      /(\w+)\.toLocaleDateString\(\s*['"`](ar(?:-\w+)?)['"`]\s*\)/g,
      "$1.toLocaleDateString('$2', { numberingSystem: 'latn' })"
    );

    // تحديث toLocaleDateString مع options موجودة
    updatedContent = updatedContent.replace(
      /(\w+)\.toLocaleDateString\(\s*['"`](ar(?:-\w+)?)['"`]\s*,\s*\{([^}]+)\}\s*\)/g,
      (match, obj, locale, options) => {
        // التحقق من وجود numberingSystem بالفعل
        if (options.includes('numberingSystem')) {
          return match; // لا تغيير إذا كان موجود بالفعل
        }
        return `${obj}.toLocaleDateString('${locale}', {${options}, numberingSystem: 'latn' })`;
      }
    );

    // تحديث toLocaleString للتاريخ والوقت
    updatedContent = updatedContent.replace(
      /(\w+)\.toLocaleString\(\s*['"`](ar(?:-\w+)?)['"`]\s*\)/g,
      "$1.toLocaleString('$2', { numberingSystem: 'latn' })"
    );

    // تحديث toLocaleString مع options موجودة
    updatedContent = updatedContent.replace(
      /(\w+)\.toLocaleString\(\s*['"`](ar(?:-\w+)?)['"`]\s*,\s*\{([^}]+)\}\s*\)/g,
      (match, obj, locale, options) => {
        // التحقق من وجود numberingSystem بالفعل
        if (options.includes('numberingSystem')) {
          return match; // لا تغيير إذا كان موجود بالفعل
        }
        return `${obj}.toLocaleString('${locale}', {${options}, numberingSystem: 'latn' })`;
      }
    );

    // تحديث toLocaleTimeString
    updatedContent = updatedContent.replace(
      /(\w+)\.toLocaleTimeString\(\s*['"`](ar(?:-\w+)?)['"`]\s*\)/g,
      "$1.toLocaleTimeString('$2', { numberingSystem: 'latn' })"
    );

    // تحديث toLocaleTimeString مع options موجودة
    updatedContent = updatedContent.replace(
      /(\w+)\.toLocaleTimeString\(\s*['"`](ar(?:-\w+)?)['"`]\s*,\s*\{([^}]+)\}\s*\)/g,
      (match, obj, locale, options) => {
        // التحقق من وجود numberingSystem بالفعل
        if (options.includes('numberingSystem')) {
          return match; // لا تغيير إذا كان موجود بالفعل
        }
        return `${obj}.toLocaleTimeString('${locale}', {${options}, numberingSystem: 'latn' })`;
      }
    );

    return updatedContent;
  }

  /**
   * استبدال الأرقام العربية في النص بالأرقام الإنجليزية
   * @param text النص المحتوي على أرقام عربية
   * @returns النص مع الأرقام الإنجليزية
   */
  static convertArabicNumbers(text: string): string {
    return text.replace(/[٠-٩]/g, (match) => {
      const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
      const englishDigits = '0123456789';
      return englishDigits[arabicDigits.indexOf(match)];
    });
  }

  /**
   * البحث عن الأرقام العربية في النص
   * @param text النص للبحث فيه
   * @returns true إذا وُجدت أرقام عربية
   */
  static hasArabicNumbers(text: string): boolean {
    return /[٠-٩]/.test(text);
  }

  /**
   * البحث عن تنسيقات الأرقام التي تحتاج تحديث
   * @param content محتوى الملف
   * @returns قائمة بالتنسيقات التي تحتاج تحديث
   */
  static findFormatsToUpdate(content: string): string[] {
    const formats: string[] = [];
    
    // البحث عن toLocaleString مع ar
    const localeStringMatches = content.match(/\.toLocaleString\(\s*['"`]ar(?:-\w+)?['"`].*?\)/g);
    if (localeStringMatches) {
      formats.push(...localeStringMatches);
    }

    // البحث عن toLocaleDateString مع ar
    const dateStringMatches = content.match(/\.toLocaleDateString\(\s*['"`]ar(?:-\w+)?['"`].*?\)/g);
    if (dateStringMatches) {
      formats.push(...dateStringMatches);
    }

    // البحث عن toLocaleTimeString مع ar
    const timeStringMatches = content.match(/\.toLocaleTimeString\(\s*['"`]ar(?:-\w+)?['"`].*?\)/g);
    if (timeStringMatches) {
      formats.push(...timeStringMatches);
    }

    return formats;
  }

  /**
   * إحصائيات عن التحديثات المطلوبة
   * @param content محتوى الملف
   * @returns إحصائيات التحديث
   */
  static getUpdateStats(content: string): {
    arabicNumbers: number;
    localeFormats: number;
    needsUpdate: boolean;
  } {
    const arabicNumberMatches = content.match(/[٠-٩]/g);
    const formatsToUpdate = this.findFormatsToUpdate(content);

    return {
      arabicNumbers: arabicNumberMatches ? arabicNumberMatches.length : 0,
      localeFormats: formatsToUpdate.length,
      needsUpdate: (arabicNumberMatches && arabicNumberMatches.length > 0) || formatsToUpdate.length > 0
    };
  }
}

/**
 * دوال مساعدة للاستخدام المباشر
 */

/**
 * تحديث تنسيق الأرقام في نص
 */
export const updateNumberFormats = NumberFormatUpdater.updateNumberFormats;

/**
 * تحويل الأرقام العربية إلى إنجليزية
 */
export const convertArabicNumbers = NumberFormatUpdater.convertArabicNumbers;

/**
 * البحث عن الأرقام العربية
 */
export const hasArabicNumbers = NumberFormatUpdater.hasArabicNumbers;

export default NumberFormatUpdater;