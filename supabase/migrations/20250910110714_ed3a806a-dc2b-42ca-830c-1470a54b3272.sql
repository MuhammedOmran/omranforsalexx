-- إنشاء الجداول المطلوبة دون إعادة إنشاء الأنواع الموجودة

-- جدول القوالب إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS public.notification_templates (
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

-- جدول إعدادات الإشعارات إذا لم يكن موجوداً  
CREATE TABLE IF NOT EXISTS public.notification_settings (
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

-- جدول القوانين الذكية إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS public.notification_rules (
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

-- جدول الإشعارات المجدولة إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS public.scheduled_notifications (
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

-- جدول سجل التسليم إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS public.notification_delivery_log (
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

-- تمكين RLS للجداول الجديدة
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_delivery_log ENABLE ROW LEVEL SECURITY;

-- سياسات القوالب
DROP POLICY IF EXISTS "Users can manage their templates" ON public.notification_templates;
CREATE POLICY "Users can manage their templates" ON public.notification_templates
  FOR ALL USING (auth.uid() = user_id);

-- سياسات الإعدادات
DROP POLICY IF EXISTS "Users can manage their settings" ON public.notification_settings;
CREATE POLICY "Users can manage their settings" ON public.notification_settings
  FOR ALL USING (auth.uid() = user_id);

-- سياسات القوانين
DROP POLICY IF EXISTS "Users can manage their notification rules" ON public.notification_rules;
CREATE POLICY "Users can manage their notification rules" ON public.notification_rules
  FOR ALL USING (auth.uid() = user_id);

-- سياسات الإشعارات المجدولة
DROP POLICY IF EXISTS "Users can manage their scheduled notifications" ON public.scheduled_notifications;
CREATE POLICY "Users can manage their scheduled notifications" ON public.scheduled_notifications
  FOR ALL USING (auth.uid() = user_id);

-- سياسات سجل التسليم
DROP POLICY IF EXISTS "Users can view their delivery logs" ON public.notification_delivery_log;
CREATE POLICY "Users can view their delivery logs" ON public.notification_delivery_log
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert delivery logs" ON public.notification_delivery_log;
CREATE POLICY "System can insert delivery logs" ON public.notification_delivery_log
  FOR INSERT WITH CHECK (true);