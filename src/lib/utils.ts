import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatNumberEnglish, formatCurrencyEnglish } from "@/utils/numberLocalization"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * دالة مساعدة لتنسيق الأرقام بشكل آمن
 * @param value - القيمة المراد تنسيقها
 * @param defaultValue - القيمة الافتراضية في حالة كانت القيمة undefined أو null
 * @returns القيمة منسقة أو القيمة الافتراضية
 */
export function formatNumber(value: number | undefined | null, defaultValue: number = 0): string {
  return formatNumberEnglish(value, defaultValue);
}

/**
 * دالة مساعدة لتنسيق المبالغ المالية
 * @param amount - المبلغ المراد تنسيقه
 * @param currency - رمز العملة
 * @param defaultValue - القيمة الافتراضية
 * @returns المبلغ منسق مع رمز العملة
 */
export function formatCurrency(amount: number | undefined | null, currency: string = "ج.م", defaultValue: number = 0): string {
  return formatCurrencyEnglish(amount, currency, defaultValue);
}
