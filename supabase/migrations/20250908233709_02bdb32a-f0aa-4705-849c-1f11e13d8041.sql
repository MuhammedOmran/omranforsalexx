-- Create table for employee leave requests
CREATE TABLE IF NOT EXISTS public.employee_leave_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  employee_name TEXT NOT NULL,
  employee_position TEXT NOT NULL,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('annual', 'sick', 'emergency', 'maternity', 'study', 'unpaid')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  request_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_by TEXT,
  approved_date TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employee_leave_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own leave requests" 
ON public.employee_leave_requests 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create leave requests" 
ON public.employee_leave_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leave requests" 
ON public.employee_leave_requests 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leave requests" 
ON public.employee_leave_requests 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create table for leave balances
CREATE TABLE IF NOT EXISTS public.employee_leave_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  annual_leave INTEGER NOT NULL DEFAULT 30,
  sick_leave INTEGER NOT NULL DEFAULT 15,
  emergency_leave INTEGER NOT NULL DEFAULT 5,
  used_annual INTEGER NOT NULL DEFAULT 0,
  used_sick INTEGER NOT NULL DEFAULT 0,
  used_emergency INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, employee_id)
);

-- Enable RLS
ALTER TABLE public.employee_leave_balances ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own leave balances" 
ON public.employee_leave_balances 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create leave balances" 
ON public.employee_leave_balances 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leave balances" 
ON public.employee_leave_balances 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leave balances" 
ON public.employee_leave_balances 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create table for employee performance records
CREATE TABLE IF NOT EXISTS public.employee_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  period TEXT NOT NULL,
  goals INTEGER NOT NULL DEFAULT 100,
  achieved INTEGER NOT NULL DEFAULT 0,
  rating DECIMAL(3,2) NOT NULL DEFAULT 0,
  feedback TEXT,
  strengths JSONB DEFAULT '[]',
  improvements JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employee_performance ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own employee performance" 
ON public.employee_performance 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create employee performance records" 
ON public.employee_performance 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own employee performance" 
ON public.employee_performance 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own employee performance" 
ON public.employee_performance 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create table for employee documents
CREATE TABLE IF NOT EXISTS public.employee_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('contract', 'certificate', 'id', 'medical', 'other')),
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  size_mb DECIMAL(8,2),
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own employee documents" 
ON public.employee_documents 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create employee documents" 
ON public.employee_documents 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own employee documents" 
ON public.employee_documents 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own employee documents" 
ON public.employee_documents 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_employee_leave_requests_updated_at
  BEFORE UPDATE ON public.employee_leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_leave_balances_updated_at
  BEFORE UPDATE ON public.employee_leave_balances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_performance_updated_at
  BEFORE UPDATE ON public.employee_performance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_documents_updated_at
  BEFORE UPDATE ON public.employee_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();