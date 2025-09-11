/**
 * مرافق تحويل الأرقام من العربية إلى الإنجليزية
 */

/**
 * تحويل الأرقام العربية إلى إنجليزية
 * @param text النص المحتوي على أرقام عربية
 * @returns النص مع الأرقام الإنجليزية
 */
export function convertArabicToEnglishNumbers(text: string): string {
  return text.replace(/[٠-٩]/g, (match) => {
    const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
    const englishDigits = '0123456789';
    return englishDigits[arabicDigits.indexOf(match)];
  });
}

/**
 * تنسيق الأرقام باستخدام الأرقام الإنجليزية
 * @param value القيمة المراد تنسيقها
 * @param defaultValue القيمة الافتراضية
 * @returns الرقم منسق بالأرقام الإنجليزية
 */
export function formatNumberEnglish(value: number | undefined | null, defaultValue: number = 0): string {
  const numValue = value ?? defaultValue;
  if (typeof numValue !== 'number' || isNaN(numValue)) {
    return defaultValue.toLocaleString('en-US');
  }
  return numValue.toLocaleString('en-US');
}

/**
 * تنسيق المبالغ المالية باستخدام الأرقام الإنجليزية
 * @param amount المبلغ المراد تنسيقه
 * @param currency رمز العملة
 * @param defaultValue القيمة الافتراضية
 * @returns المبلغ منسق بالأرقام الإنجليزية
 */
export function formatCurrencyEnglish(amount: number | undefined | null, currency: string = "ج.م", defaultValue: number = 0): string {
  return `${formatNumberEnglish(amount, defaultValue)} ${currency}`;
}

/**
 * تنسيق التاريخ باستخدام الأرقام الإنجليزية
 * @param date التاريخ المراد تنسيقه
 * @param locale المنطقة المحلية
 * @param options خيارات التنسيق
 * @returns التاريخ منسق بالأرقام الإنجليزية
 */
export function formatDateEnglish(
  date: Date | string, 
  locale: string = 'ar-SA', 
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const formatted = dateObj.toLocaleDateString(locale, {
    ...options,
    numberingSystem: 'latn' // استخدام الأرقام اللاتينية (الإنجليزية)
  });
  return convertArabicToEnglishNumbers(formatted);
}

/**
 * تنسيق التاريخ والوقت باستخدام الأرقام الإنجليزية
 * @param date التاريخ والوقت المراد تنسيقه
 * @param locale المنطقة المحلية
 * @param options خيارات التنسيق
 * @returns التاريخ والوقت منسق بالأرقام الإنجليزية
 */
export function formatDateTimeEnglish(
  date: Date | string, 
  locale: string = 'ar-SA', 
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const formatted = dateObj.toLocaleString(locale, {
    ...options,
    numberingSystem: 'latn' // استخدام الأرقام اللاتينية (الإنجليزية)
  });
  return convertArabicToEnglishNumbers(formatted);
}

/**
 * تنسيق الوقت باستخدام الأرقام الإنجليزية
 * @param date الوقت المراد تنسيقه
 * @param locale المنطقة المحلية
 * @param options خيارات التنسيق
 * @returns الوقت منسق بالأرقام الإنجليزية
 */
export function formatTimeEnglish(
  date: Date | string, 
  locale: string = 'ar-SA', 
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const formatted = dateObj.toLocaleTimeString(locale, {
    ...options,
    numberingSystem: 'latn' // استخدام الأرقام اللاتينية (الإنجليزية)
  });
  return convertArabicToEnglishNumbers(formatted);
}