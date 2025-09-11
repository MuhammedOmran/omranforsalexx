// أنواع البيانات المتوافقة مع جداول Supabase
export interface SupabaseProduct {
  id: string;
  user_id: string;
  name: string;
  code: string;
  barcode?: string;
  description?: string;
  category?: string;
  price: number;
  cost: number;
  stock: number;
  min_stock?: number;
  max_stock?: number;
  unit?: string;
  location?: string;
  supplier?: string;
  image_url?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupabaseCustomer {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  company?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SupabaseInvoice {
  id: string;
  user_id: string;
  customer_id?: string;
  invoice_number: string;
  invoice_date: string;
  due_date?: string;
  subtotal: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SupabaseInvoiceItem {
  id: string;
  invoice_id: string;
  product_id?: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface SupabaseProfile {
  id: string;
  user_id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupabaseSupplier {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  company?: string;
  contact_person?: string;
  tax_number?: string;
  payment_terms?: string;
  notes?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupabasePurchaseInvoice {
  id: string;
  user_id: string;
  supplier_id?: string;
  supplier_name: string;
  invoice_number: string;
  invoice_date: string;
  due_date?: string;
  subtotal: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount: number;
  paid_amount: number;
  status: string;
  payment_method: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SupabasePurchaseInvoiceItem {
  id: string;
  invoice_id: string;
  product_id?: string;
  product_name: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  notes?: string;
  created_at: string;
}

export interface SupabaseEmployeeLeaveRequest {
  id: string;
  user_id: string;
  employee_id: string;
  employee_name: string;
  employee_position: string;
  leave_type: 'annual' | 'sick' | 'emergency' | 'maternity' | 'study' | 'unpaid';
  start_date: string;
  end_date: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  request_date: string;
  approved_by?: string;
  approved_date?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface SupabaseEmployeeLeaveBalance {
  id: string;
  user_id: string;
  employee_id: string;
  annual_leave: number;
  sick_leave: number;
  emergency_leave: number;
  used_annual: number;
  used_sick: number;
  used_emergency: number;
  created_at: string;
  updated_at: string;
}

export interface SupabaseEmployeePerformance {
  id: string;
  user_id: string;
  employee_id: string;
  period: string;
  goals: number;
  achieved: number;
  rating: number;
  feedback?: string;
  strengths: string[];
  improvements: string[];
  created_at: string;
  updated_at: string;
}

export interface SupabaseEmployeeDocument {
  id: string;
  user_id: string;
  employee_id: string;
  name: string;
  type: 'contract' | 'certificate' | 'id' | 'medical' | 'other';
  upload_date: string;
  size_mb?: number;
  url?: string;
  created_at: string;
  updated_at: string;
}