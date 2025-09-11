-- جدول الأجهزة
CREATE TABLE public.user_devices (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID REFERENCES auth.users(id),
    device_id TEXT NOT NULL,
    device_name TEXT,
    platform TEXT, -- Web, Mobile
    browser_info TEXT,
    last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, device_id)
);

-- سياسات RLS
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own devices" 
ON public.user_devices 
FOR ALL 
USING (auth.uid() = user_id);

-- دالة للتحقق من تفعيل الجهاز
CREATE OR REPLACE FUNCTION public.is_device_authorized(p_user_id UUID, p_device_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_devices 
    WHERE user_id = p_user_id 
    AND device_id = p_device_id 
    AND is_active = true
  );
END;
$$;