/**
 * Type guards لتحسين Type Safety تدريجياً
 */

// Basic type guards
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

// Business domain type guards
export interface Invoice {
  id: string;
  customerId: string;
  items: InvoiceItem[];
  total: number;
  date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
}

export interface InvoiceItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category?: string;
  barcode?: string;
}

export function isInvoice(value: unknown): value is Invoice {
  if (!isObject(value)) return false;
  
  const obj = value as Record<string, unknown>;
  return (
    isString(obj.id) &&
    isString(obj.customerId) &&
    isArray(obj.items) &&
    isNumber(obj.total) &&
    isString(obj.date) &&
    isString(obj.status) &&
    ['draft', 'sent', 'paid', 'overdue'].includes(obj.status as string)
  );
}

export function isInvoiceItem(value: unknown): value is InvoiceItem {
  if (!isObject(value)) return false;
  
  const obj = value as Record<string, unknown>;
  return (
    isString(obj.id) &&
    isString(obj.productId) &&
    isNumber(obj.quantity) &&
    isNumber(obj.price) &&
    isNumber(obj.total)
  );
}

export function isCustomer(value: unknown): value is Customer {
  if (!isObject(value)) return false;
  
  const obj = value as Record<string, unknown>;
  return (
    isString(obj.id) &&
    isString(obj.name) &&
    isString(obj.createdAt) &&
    (obj.email === undefined || isString(obj.email)) &&
    (obj.phone === undefined || isString(obj.phone)) &&
    (obj.address === undefined || isString(obj.address))
  );
}

export function isProduct(value: unknown): value is Product {
  if (!isObject(value)) return false;
  
  const obj = value as Record<string, unknown>;
  return (
    isString(obj.id) &&
    isString(obj.name) &&
    isNumber(obj.price) &&
    isNumber(obj.stock) &&
    (obj.description === undefined || isString(obj.description)) &&
    (obj.category === undefined || isString(obj.category)) &&
    (obj.barcode === undefined || isString(obj.barcode))
  );
}

// Array validators
export function isInvoiceArray(value: unknown): value is Invoice[] {
  return isArray(value) && value.every(isInvoice);
}

export function isCustomerArray(value: unknown): value is Customer[] {
  return isArray(value) && value.every(isCustomer);
}

export function isProductArray(value: unknown): value is Product[] {
  return isArray(value) && value.every(isProduct);
}

// Safe parsing utilities
export function safeParseJSON<T>(
  value: string, 
  validator: (v: unknown) => v is T
): T | null {
  try {
    const parsed = JSON.parse(value);
    return validator(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function safeParseInvoice(value: string): Invoice | null {
  return safeParseJSON(value, isInvoice);
}

export function safeParseCustomer(value: string): Customer | null {
  return safeParseJSON(value, isCustomer);
}

export function safeParseProduct(value: string): Product | null {
  return safeParseJSON(value, isProduct);
}

// Utility functions for converting any types
export function convertToInvoice(value: any): Invoice | null {
  if (isInvoice(value)) return value;
  
  if (!isObject(value)) return null;
  
  const obj = value as Record<string, unknown>;
  
  // محاولة تحويل البيانات إلى Invoice صحيح
  try {
    return {
      id: String(obj.id || ''),
      customerId: String(obj.customerId || ''),
      items: isArray(obj.items) ? obj.items.filter(isInvoiceItem) : [],
      total: Number(obj.total) || 0,
      date: String(obj.date || new Date().toISOString()),
      status: ['draft', 'sent', 'paid', 'overdue'].includes(obj.status as string) 
        ? obj.status as Invoice['status'] 
        : 'draft'
    };
  } catch {
    return null;
  }
}

export function convertToCustomer(value: any): Customer | null {
  if (isCustomer(value)) return value;
  
  if (!isObject(value)) return null;
  
  const obj = value as Record<string, unknown>;
  
  try {
    return {
      id: String(obj.id || ''),
      name: String(obj.name || ''),
      email: obj.email ? String(obj.email) : undefined,
      phone: obj.phone ? String(obj.phone) : undefined,
      address: obj.address ? String(obj.address) : undefined,
      createdAt: String(obj.createdAt || new Date().toISOString())
    };
  } catch {
    return null;
  }
}

export function convertToProduct(value: any): Product | null {
  if (isProduct(value)) return value;
  
  if (!isObject(value)) return null;
  
  const obj = value as Record<string, unknown>;
  
  try {
    return {
      id: String(obj.id || ''),
      name: String(obj.name || ''),
      description: obj.description ? String(obj.description) : undefined,
      price: Number(obj.price) || 0,
      stock: Number(obj.stock) || 0,
      category: obj.category ? String(obj.category) : undefined,
      barcode: obj.barcode ? String(obj.barcode) : undefined
    };
  } catch {
    return null;
  }
}