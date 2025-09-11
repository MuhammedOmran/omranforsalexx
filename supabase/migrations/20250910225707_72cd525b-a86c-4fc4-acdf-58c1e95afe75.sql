-- إنشاء bucket لشعارات الشركات
INSERT INTO storage.buckets (id, name, public) 
VALUES ('company-logos', 'company-logos', true);

-- إنشاء جدول شعارات الشركات
CREATE TABLE public.company_logos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  logo_filename TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تمكين RLS على الجدول
ALTER TABLE public.company_logos ENABLE ROW LEVEL SECURITY;

-- سياسات الوصول للجدول
CREATE POLICY "Users can view their own company logos" 
ON public.company_logos 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own company logos" 
ON public.company_logos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own company logos" 
ON public.company_logos 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own company logos" 
ON public.company_logos 
FOR DELETE 
USING (auth.uid() = user_id);

-- سياسات Storage للشعارات
CREATE POLICY "Company logos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'company-logos');

CREATE POLICY "Users can upload their own company logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own company logos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own company logos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_company_logos()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_company_logos_updated_at
BEFORE UPDATE ON public.company_logos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_company_logos();