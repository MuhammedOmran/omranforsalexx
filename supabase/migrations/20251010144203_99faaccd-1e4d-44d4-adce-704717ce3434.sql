-- Fix backup_logs RLS policies
-- The table has RLS enabled but no policies, making it completely inaccessible

-- Allow authenticated users to insert backup logs
CREATE POLICY "Authenticated users can insert backup logs"
ON public.backup_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to view backup logs
CREATE POLICY "Authenticated users can view backup logs"
ON public.backup_logs
FOR SELECT
TO authenticated
USING (true);

-- Note: UPDATE and DELETE are intentionally not allowed to preserve audit trail integrity