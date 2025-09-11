-- إنشاء جدول جلسات المستخدمين
CREATE TABLE public.user_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    company_id UUID,
    device_id TEXT NOT NULL,
    device_name TEXT,
    session_token TEXT UNIQUE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '30 days'),
    ip_address INET,
    user_agent TEXT,
    location TEXT,
    device_info JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- تمكين RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- سياسات RLS للمستخدمين العاديين
CREATE POLICY "Users can view their own sessions" 
ON public.user_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions" 
ON public.user_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" 
ON public.user_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" 
ON public.user_sessions 
FOR DELETE 
USING (auth.uid() = user_id);

-- إنشاء فهارس للأداء
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_active ON public.user_sessions(is_active);
CREATE INDEX idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON public.user_sessions(expires_at);

-- دالة لتنظيف الجلسات المنتهية الصلاحية
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    cleaned_count INTEGER;
BEGIN
    UPDATE public.user_sessions
    SET is_active = false,
        last_activity = now()
    WHERE expires_at < now()
        AND is_active = true;
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    
    -- تسجيل العملية في سجل الأمان
    INSERT INTO public.audit_logs (
        event_type,
        event_description,
        severity,
        metadata
    ) VALUES (
        'SYSTEM_CLEANUP',
        'تنظيف الجلسات المنتهية الصلاحية',
        'low',
        jsonb_build_object('cleaned_sessions', cleaned_count)
    );
    
    RETURN cleaned_count;
END;
$$;