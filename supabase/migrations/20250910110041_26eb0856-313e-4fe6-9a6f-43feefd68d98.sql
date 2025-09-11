-- إنشاء أنواع الإشعارات والحالات
CREATE TYPE notification_type AS ENUM (
  'invoice_due', 'invoice_overdue', 'low_stock', 'out_of_stock', 
  'check_due', 'low_cash', 'customer_overdue', 'supplier_payment',
  'security_alert', 'monthly_report', 'system_notification',
  'scheduled_reminder', 'task_reminder', 'payment_reminder'
);

CREATE TYPE notification_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE notification_status AS ENUM ('active', 'read', 'archived', 'resolved');
CREATE TYPE notification_channel AS ENUM ('in_app', 'email', 'sms', 'push');

-- تحديث جdول الإشعارات مع المزيد من الميزات
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS notification_type notification_type DEFAULT 'system_notification',
ADD COLUMN IF NOT EXISTS status notification_status DEFAULT 'active',
ADD COLUMN IF NOT EXISTS channels notification_channel[] DEFAULT ARRAY['in_app']::notification_channel[],
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS recurring_pattern TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS template_id TEXT,
ADD COLUMN IF NOT EXISTS group_id TEXT,
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES notifications(id),
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- إنشاء جدول قوالب الإشعارات
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- إنشاء جدول إعدادات الإشعارات
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  push_enabled BOOLEAN DEFAULT true,
  email_address TEXT,
  phone_number TEXT,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone TEXT DEFAULT 'Africa/Cairo',
  notification_preferences JSONB DEFAULT '{}',
  channel_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إنشاء جدول الإشعارات المجدولة
CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  template_id UUID REFERENCES notification_templates(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type notification_type NOT NULL,
  priority notification_priority DEFAULT 'medium',
  channels notification_channel[] DEFAULT ARRAY['in_app']::notification_channel[],
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  recurring_pattern TEXT,
  recurring_end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  last_sent_at TIMESTAMP WITH TIME ZONE,
  next_send_at TIMESTAMP WITH TIME ZONE,
  send_count INTEGER DEFAULT 0,
  max_sends INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إنشاء جدول سجل الإشعارات المرسلة
CREATE TABLE IF NOT EXISTS notification_delivery_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
  scheduled_notification_id UUID REFERENCES scheduled_notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  channel notification_channel NOT NULL,
  status TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  provider_response JSONB,
  metadata JSONB DEFAULT '{}'
);

-- إنشاء جدول قواعد الإشعارات الذكية
CREATE TABLE IF NOT EXISTS notification_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL,
  conditions JSONB NOT NULL,
  actions JSONB NOT NULL,
  template_id UUID REFERENCES notification_templates(id),
  is_active BOOLEAN DEFAULT true,
  priority notification_priority DEFAULT 'medium',
  cooldown_minutes INTEGER DEFAULT 60,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  trigger_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إضافة RLS policies للجداول الجديدة
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_delivery_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_rules ENABLE ROW LEVEL SECURITY;

-- Policies لجدول notification_templates
CREATE POLICY "Users can manage their templates" ON notification_templates
  FOR ALL USING (auth.uid() = user_id);

-- Policies لجدول notification_settings
CREATE POLICY "Users can manage their settings" ON notification_settings
  FOR ALL USING (auth.uid() = user_id);

-- Policies لجدول scheduled_notifications
CREATE POLICY "Users can manage their scheduled notifications" ON scheduled_notifications
  FOR ALL USING (auth.uid() = user_id);

-- Policies لجدول notification_delivery_log
CREATE POLICY "Users can view their delivery logs" ON notification_delivery_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert delivery logs" ON notification_delivery_log
  FOR INSERT WITH CHECK (true);

-- Policies لجدول notification_rules
CREATE POLICY "Users can manage their notification rules" ON notification_rules
  FOR ALL USING (auth.uid() = user_id);

-- إنشاء فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_notifications_user_status ON notifications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_for ON notifications(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_next_send ON scheduled_notifications(next_send_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_notification_delivery_log_user ON notification_delivery_log(user_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_rules_active ON notification_rules(user_id, is_active) WHERE is_active = true;

-- إنشاء دالة لحساب التوقيت التالي للإشعارات المتكررة
CREATE OR REPLACE FUNCTION calculate_next_notification_time(
  input_time TIMESTAMP WITH TIME ZONE,
  pattern TEXT
) RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
AS $$
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
$$;

-- إنشاء دالة لمعالجة الإشعارات المجدولة
CREATE OR REPLACE FUNCTION process_scheduled_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;