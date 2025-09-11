-- إنشاء الأنواع المخصصة للإشعارات
CREATE TYPE notification_type AS ENUM (
  'invoice_due', 'invoice_overdue', 'low_stock', 'out_of_stock', 'check_due', 
  'check_overdue', 'low_cash_balance', 'customer_overdue', 'supplier_payment_due',
  'security_alert', 'monthly_report', 'system_notification'
);

CREATE TYPE notification_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE notification_status AS ENUM ('active', 'read', 'archived', 'expired');
CREATE TYPE notification_channel AS ENUM ('in_app', 'email', 'sms', 'push');

-- جدول الإشعارات الرئيسي
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  company_id UUID,
  type TEXT NOT NULL DEFAULT 'info',
  category TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type notification_type DEFAULT 'system_notification',
  status notification_status DEFAULT 'active',
  channels notification_channel[] DEFAULT ARRAY['in_app']::notification_channel[],
  
  -- معلومات الإجراء المطلوب
  action_required BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  action_text TEXT,
  
  -- ربط بالكيانات الأخرى
  related_entity_id TEXT,
  related_entity_type TEXT,
  
  -- إدارة الدورة الحياتية
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  auto_resolve BOOLEAN NOT NULL DEFAULT true,
  resolved_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- البيانات الوصفية
  metadata JSONB DEFAULT '{}',
  scheduled_for TIMESTAMP WITH TIME ZONE,
  parent_id UUID,
  group_id TEXT,
  tags TEXT[],
  template_id TEXT,
  recurring_pattern TEXT,
  
  -- التواريخ
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  archived_at TIMESTAMP WITH TIME ZONE
);

-- جدول القوالب
CREATE TABLE public.notification_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type notification_type NOT NULL,
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  email_template TEXT,
  sms_template TEXT,
  default_channels notification_channel[] DEFAULT ARRAY['in_app']::notification_channel[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- جدول إعدادات الإشعارات لكل مستخدم
CREATE TABLE public.notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email_enabled BOOLEAN DEFAULT true,
  email_address TEXT,
  sms_enabled BOOLEAN DEFAULT false,
  phone_number TEXT,
  push_enabled BOOLEAN DEFAULT true,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone TEXT DEFAULT 'Africa/Cairo',
  notification_preferences JSONB DEFAULT '{}',
  channel_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- جدول القوانين الذكية
CREATE TABLE public.notification_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL,
  conditions JSONB NOT NULL,
  actions JSONB NOT NULL,
  template_id UUID,
  priority notification_priority DEFAULT 'medium',
  is_active BOOLEAN DEFAULT true,
  cooldown_minutes INTEGER DEFAULT 60,
  trigger_count INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- جدول الإشعارات المجدولة
CREATE TABLE public.scheduled_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  notification_type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority notification_priority NOT NULL,
  channels notification_channel[] DEFAULT ARRAY['in_app']::notification_channel[],
  metadata JSONB DEFAULT '{}',
  
  -- جدولة
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  next_send_at TIMESTAMP WITH TIME ZONE,
  recurring_pattern TEXT,
  recurring_end_date TIMESTAMP WITH TIME ZONE,
  
  -- إحصائيات الإرسال
  send_count INTEGER DEFAULT 0,
  max_sends INTEGER,
  last_sent_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- جدول سجل التسليم
CREATE TABLE public.notification_delivery_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  notification_id UUID,
  scheduled_notification_id UUID,
  channel notification_channel NOT NULL,
  status TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  provider_response JSONB,
  metadata JSONB DEFAULT '{}'
);

-- تمكين RLS لجميع الجداول
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_delivery_log ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للإشعارات
CREATE POLICY "المستخدمون يمكنهم رؤية إشعاراتهم فقط" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم إضافة إشعارات" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم تحديث إشعاراتهم" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم حذف إشعاراتهم" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- سياسات القوالب
CREATE POLICY "Users can manage their templates" ON public.notification_templates
  FOR ALL USING (auth.uid() = user_id);

-- سياسات الإعدادات
CREATE POLICY "Users can manage their settings" ON public.notification_settings
  FOR ALL USING (auth.uid() = user_id);

-- سياسات القوانين
CREATE POLICY "Users can manage their notification rules" ON public.notification_rules
  FOR ALL USING (auth.uid() = user_id);

-- سياسات الإشعارات المجدولة
CREATE POLICY "Users can manage their scheduled notifications" ON public.scheduled_notifications
  FOR ALL USING (auth.uid() = user_id);

-- سياسات سجل التسليم
CREATE POLICY "Users can view their delivery logs" ON public.notification_delivery_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert delivery logs" ON public.notification_delivery_log
  FOR INSERT WITH CHECK (true);

-- دالة لحساب الوقت التالي للإشعار المتكرر
CREATE OR REPLACE FUNCTION calculate_next_notification_time(
  input_time TIMESTAMP WITH TIME ZONE,
  pattern TEXT
) RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
  next_time TIMESTAMP WITH TIME ZONE;
BEGIN
  CASE 
    WHEN pattern = 'daily' THEN
      next_time := input_time + INTERVAL '1 day';
    WHEN pattern = 'weekly' THEN
      next_time := input_time + INTERVAL '1 week';
    WHEN pattern = 'monthly' THEN
      next_time := input_time + INTERVAL '1 month';
    WHEN pattern LIKE 'every_%_minutes' THEN
      next_time := input_time + (SUBSTRING(pattern FROM 'every_(\d+)_minutes')::INTEGER || ' minutes')::INTERVAL;
    WHEN pattern LIKE 'every_%_hours' THEN
      next_time := input_time + (SUBSTRING(pattern FROM 'every_(\d+)_hours')::INTEGER || ' hours')::INTERVAL;
    ELSE
      next_time := input_time + INTERVAL '1 day';
  END CASE;
  
  RETURN next_time;
END;
$$ LANGUAGE plpgsql;

-- دالة لمعالجة الإشعارات المجدولة
CREATE OR REPLACE FUNCTION process_scheduled_notifications()
RETURNS INTEGER AS $$
DECLARE
  processed_count INTEGER := 0;
  scheduled_notification RECORD;
BEGIN
  FOR scheduled_notification IN 
    SELECT * FROM scheduled_notifications 
    WHERE is_active = true 
    AND next_send_at <= now()
    AND (max_sends IS NULL OR send_count < max_sends)
  LOOP
    -- إنشاء الإشعار
    INSERT INTO notifications (
      user_id, type, category, priority, title, message,
      notification_type, status, channels, metadata, created_at
    ) VALUES (
      scheduled_notification.user_id,
      scheduled_notification.notification_type::TEXT,
      'scheduled',
      scheduled_notification.priority::TEXT,
      scheduled_notification.title,
      scheduled_notification.message,
      scheduled_notification.notification_type,
      'active',
      scheduled_notification.channels,
      scheduled_notification.metadata,
      now()
    );
    
    -- تحديث الإشعار المجدول
    UPDATE scheduled_notifications 
    SET 
      last_sent_at = now(),
      send_count = send_count + 1,
      next_send_at = CASE 
        WHEN recurring_pattern IS NOT NULL AND 
             (recurring_end_date IS NULL OR now() < recurring_end_date) AND
             (max_sends IS NULL OR send_count + 1 < max_sends)
        THEN calculate_next_notification_time(now(), recurring_pattern)
        ELSE NULL 
      END,
      is_active = CASE 
        WHEN recurring_pattern IS NULL OR
             (recurring_end_date IS NOT NULL AND now() >= recurring_end_date) OR
             (max_sends IS NOT NULL AND send_count + 1 >= max_sends)
        THEN false
        ELSE true
      END
    WHERE id = scheduled_notification.id;
    
    processed_count := processed_count + 1;
  END LOOP;
  
  RETURN processed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;