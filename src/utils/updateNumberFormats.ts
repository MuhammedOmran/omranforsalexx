/**
 * ملف لتحديث جميع تنسيقات الأرقام في التطبيق لاستخدام الأرقام الإنجليزية
 */

import { formatDateEnglish, formatDateTimeEnglish, formatTimeEnglish, formatNumberEnglish } from './numberLocalization';

/**
 * دالة مساعدة لاستبدال toLocaleString العادية بالإنجليزية
 */
export function replaceLocaleString(value: number, locale?: string): string {
  return formatNumberEnglish(value);
}

/**
 * دالة مساعدة لاستبدال toLocaleDateString العادية بالإنجليزية
 */
export function replaceDateString(date: Date | string, locale?: string, options?: Intl.DateTimeFormatOptions): string {
  return formatDateEnglish(date, locale, options);
}

/**
 * دالة مساعدة لاستبدال toLocaleString للتاريخ والوقت بالإنجليزية
 */
export function replaceDateTimeString(date: Date | string, locale?: string, options?: Intl.DateTimeFormatOptions): string {
  return formatDateTimeEnglish(date, locale, options);
}

/**
 * دالة مساعدة لاستبدال toLocaleTimeString بالإنجليزية
 */
export function replaceTimeString(date: Date | string, locale?: string, options?: Intl.DateTimeFormatOptions): string {
  return formatTimeEnglish(date, locale, options);
}

// إعادة تصدير الدوال من numberLocalization للوصول السهل
export { 
  formatDateEnglish,
  formatDateTimeEnglish,
  formatTimeEnglish,
  formatNumberEnglish,
  convertArabicToEnglishNumbers,
  formatCurrencyEnglish
} from './numberLocalization';