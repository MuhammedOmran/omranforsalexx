-- إنشاء جدول إعدادات النسخ الاحتياطي التلقائي
CREATE TABLE IF NOT EXISTS public.auto_backup_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    enabled BOOLEAN NOT NULL DEFAULT false,
    backup_interval TEXT NOT NULL DEFAULT 'daily', -- daily, weekly, monthly
    backup_time TIME NOT NULL DEFAULT '02:00:00', -- وقت النسخ الاحتياطي
    last_backup_date TIMESTAMP WITH TIME ZONE,
    next_backup_date TIMESTAMP WITH TIME ZONE,
    retention_days INTEGER NOT NULL DEFAULT 30, -- عدد الأيام لحفظ النسخ
    include_tables TEXT[] DEFAULT ARRAY['invoices', 'customers', 'products', 'cash_transactions'], -- الجداول المراد نسخها
    backup_location TEXT DEFAULT 'local', -- local, google_drive, etc
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل RLS للجدول
ALTER TABLE public.auto_backup_settings ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات الأمان
CREATE POLICY "Users can manage their auto backup settings"
    ON public.auto_backup_settings
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- إنشاء جدول سجل النسخ الاحتياطي التلقائي
CREATE TABLE IF NOT EXISTS public.auto_backup_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    backup_type TEXT NOT NULL DEFAULT 'automatic', -- automatic, manual
    status TEXT NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    file_size BIGINT,
    file_path TEXT,
    error_message TEXT,
    backup_duration INTERVAL,
    tables_included TEXT[],
    total_records INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل RLS للسجل
ALTER TABLE public.auto_backup_logs ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات الأمان للسجل
CREATE POLICY "Users can view their backup logs"
    ON public.auto_backup_logs
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert backup logs"
    ON public.auto_backup_logs
    FOR INSERT
    WITH CHECK (true);

-- إنشاء فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_auto_backup_settings_user_id ON public.auto_backup_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_auto_backup_settings_next_backup ON public.auto_backup_settings(next_backup_date) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_auto_backup_logs_user_id ON public.auto_backup_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_auto_backup_logs_created_at ON public.auto_backup_logs(created_at);

-- دالة لحساب موعد النسخ الاحتياطي التالي
CREATE OR REPLACE FUNCTION calculate_next_backup_time(
    backup_interval TEXT,
    backup_time TIME,
    last_backup TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
AS $$
DECLARE
    next_backup TIMESTAMP WITH TIME ZONE;
    current_time TIMESTAMP WITH TIME ZONE := NOW();
    today_backup TIMESTAMP WITH TIME ZONE;
BEGIN
    -- حساب وقت النسخ الاحتياطي لليوم الحالي
    today_backup := DATE_TRUNC('day', current_time) + backup_time;
    
    CASE backup_interval
        WHEN 'daily' THEN
            -- إذا لم يحن وقت النسخ لليوم، جدوله لليوم، وإلا لغداً
            IF current_time < today_backup THEN
                next_backup := today_backup;
            ELSE
                next_backup := today_backup + INTERVAL '1 day';
            END IF;
            
        WHEN 'weekly' THEN
            -- كل أسبوع يوم الأحد
            next_backup := DATE_TRUNC('week', current_time) + INTERVAL '6 days' + backup_time;
            IF next_backup <= current_time THEN
                next_backup := next_backup + INTERVAL '1 week';
            END IF;
            
        WHEN 'monthly' THEN
            -- كل شهر في اليوم الأول
            next_backup := DATE_TRUNC('month', current_time) + backup_time;
            IF next_backup <= current_time THEN
                next_backup := DATE_TRUNC('month', current_time) + INTERVAL '1 month' + backup_time;
            END IF;
            
        ELSE
            -- افتراضي يومي
            next_backup := today_backup + INTERVAL '1 day';
    END CASE;
    
    RETURN next_backup;
END;
$$;

-- دالة لتشغيل النسخ الاحتياطي التلقائي
CREATE OR REPLACE FUNCTION process_auto_backups()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    backup_setting RECORD;
    processed_count INTEGER := 0;
    log_id UUID;
BEGIN
    -- البحث عن الإعدادات التي حان وقت تنفيذها
    FOR backup_setting IN 
        SELECT * FROM public.auto_backup_settings 
        WHERE enabled = true 
        AND (next_backup_date IS NULL OR next_backup_date <= NOW())
    LOOP
        -- إنشاء سجل النسخ الاحتياطي
        INSERT INTO public.auto_backup_logs (
            user_id, backup_type, status, started_at, tables_included
        ) VALUES (
            backup_setting.user_id,
            'automatic',
            'pending', 
            NOW(),
            backup_setting.include_tables
        ) RETURNING id INTO log_id;
        
        -- تحديث موعد النسخ التالي
        UPDATE public.auto_backup_settings 
        SET 
            last_backup_date = NOW(),
            next_backup_date = calculate_next_backup_time(
                backup_interval, 
                backup_time, 
                NOW()
            ),
            updated_at = NOW()
        WHERE id = backup_setting.id;
        
        processed_count := processed_count + 1;
        
        -- هنا يمكن استدعاء edge function للقيام بالنسخ الفعلي
        -- سيتم تنفيذ ذلك عبر pg_net في المرحلة التالية
        
    END LOOP;
    
    RETURN processed_count;
END;
$$;

-- تريجر لتحديث next_backup_date عند تمكين النسخ الاحتياطي
CREATE OR REPLACE FUNCTION update_next_backup_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.enabled = true AND (OLD.enabled = false OR NEW.backup_interval != OLD.backup_interval OR NEW.backup_time != OLD.backup_time) THEN
        NEW.next_backup_date = calculate_next_backup_time(NEW.backup_interval, NEW.backup_time);
    ELSIF NEW.enabled = false THEN
        NEW.next_backup_date = NULL;
    END IF;
    
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_next_backup
    BEFORE UPDATE ON public.auto_backup_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_next_backup_trigger();