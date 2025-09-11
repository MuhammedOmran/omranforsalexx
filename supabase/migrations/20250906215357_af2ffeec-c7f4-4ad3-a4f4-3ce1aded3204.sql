-- إنشاء جدول الموظفين
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  department TEXT NOT NULL,
  salary NUMERIC NOT NULL DEFAULT 0,
  phone_number TEXT,
  email TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'vacation')),
  national_id TEXT,
  address TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل Row Level Security
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للموظفين
CREATE POLICY "المستخدمون يمكنهم رؤية موظفيهم فقط" 
ON public.employees 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم إضافة موظفين جدد" 
ON public.employees 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم تحديث موظفيهم" 
ON public.employees 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم حذف موظفيهم" 
ON public.employees 
FOR DELETE 
USING (auth.uid() = user_id);

-- إنشاء جدول الحضور والانصراف
CREATE TABLE public.employee_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  employee_name TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in_time TIME,
  check_out_time TIME,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل Row Level Security
ALTER TABLE public.employee_attendance ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للحضور
CREATE POLICY "المستخدمون يمكنهم رؤية حضور موظفيهم" 
ON public.employee_attendance 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم إضافة سجلات حضور" 
ON public.employee_attendance 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم تحديث سجلات الحضور" 
ON public.employee_attendance 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم حذف سجلات الحضور" 
ON public.employee_attendance 
FOR DELETE 
USING (auth.uid() = user_id);

-- إنشاء جدول الرواتب والمرتبات
CREATE TABLE public.payroll_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  employee_name TEXT NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  basic_salary NUMERIC NOT NULL DEFAULT 0,
  allowances NUMERIC DEFAULT 0,
  deductions NUMERIC DEFAULT 0,
  overtime_amount NUMERIC DEFAULT 0,
  net_salary NUMERIC NOT NULL DEFAULT 0,
  is_paid BOOLEAN DEFAULT FALSE,
  paid_date DATE,
  payment_method TEXT DEFAULT 'cash',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, employee_id, month, year)
);

-- تفعيل Row Level Security
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للرواتب
CREATE POLICY "المستخدمون يمكنهم رؤية رواتب موظفيهم" 
ON public.payroll_records 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم إضافة سجلات رواتب" 
ON public.payroll_records 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم تحديث سجلات الرواتب" 
ON public.payroll_records 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم حذف سجلات الرواتب" 
ON public.payroll_records 
FOR DELETE 
USING (auth.uid() = user_id);

-- إنشاء جدول أنشطة الموظفين (تتبع التغييرات)
CREATE TABLE public.employee_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  previous_value JSONB,
  new_value JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل Row Level Security
ALTER TABLE public.employee_activities ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان لأنشطة الموظفين
CREATE POLICY "المستخدمون يمكنهم رؤية أنشطة موظفيهم" 
ON public.employee_activities 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم إضافة أنشطة الموظفين" 
ON public.employee_activities 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- إنشاء trigger للتحديث التلقائي للوقت
CREATE TRIGGER update_employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_attendance_updated_at
BEFORE UPDATE ON public.employee_attendance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payroll_records_updated_at
BEFORE UPDATE ON public.payroll_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX idx_employees_user_id ON public.employees(user_id);
CREATE INDEX idx_employees_status ON public.employees(status);
CREATE INDEX idx_employee_attendance_user_id ON public.employee_attendance(user_id);
CREATE INDEX idx_employee_attendance_date ON public.employee_attendance(date);
CREATE INDEX idx_payroll_records_user_id ON public.payroll_records(user_id);
CREATE INDEX idx_payroll_records_month_year ON public.payroll_records(month, year);
CREATE INDEX idx_employee_activities_user_id ON public.employee_activities(user_id);