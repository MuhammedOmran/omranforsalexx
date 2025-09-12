-- إنشاء cron job للنسخ الاحتياطي التلقائي كل ساعة
SELECT cron.schedule(
  'auto-backup-scheduler',
  '0 * * * *', -- كل ساعة
  $$
  SELECT
    net.http_post(
        url:='https://srtwdqqxgbqkwfhuwvpx.supabase.co/functions/v1/auto-backup',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNydHdkcXF4Z2Jxa3dmaHV3dnB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjYzMzQsImV4cCI6MjA3Mjc0MjMzNH0.ZPQuH9eHylBxYtAJJECagjBdqDC21KRUlecLqAEGuro"}'::jsonb,
        body:='{"type": "automatic"}'::jsonb
    ) as request_id;
  $$
);