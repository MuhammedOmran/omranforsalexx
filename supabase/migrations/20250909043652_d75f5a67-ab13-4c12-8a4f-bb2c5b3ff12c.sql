-- إنشاء Edge Function لإنشاء المستخدمين
-- هذا المايجريشن ينشئ الجداول المطلوبة للنظام

-- جدول طلبات إنشاء المستخدمين (مؤقت)
CREATE TABLE IF NOT EXISTS public.user_creation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  username TEXT,
  role_id UUID NOT NULL REFERENCES roles(id),
  company_id UUID REFERENCES companies(id),
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  error_message TEXT,
  created_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE public.user_creation_requests ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "Users can view their own requests" 
ON public.user_creation_requests 
FOR SELECT 
USING (requested_by = auth.uid());

CREATE POLICY "Users can create requests" 
ON public.user_creation_requests 
FOR INSERT 
WITH CHECK (requested_by = auth.uid());

-- تريجر لتحديث updated_at
CREATE TRIGGER update_user_creation_requests_updated_at
BEFORE UPDATE ON public.user_creation_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();