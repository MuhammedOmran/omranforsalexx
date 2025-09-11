-- Add 'paid' status to checks table constraint
ALTER TABLE public.checks 
DROP CONSTRAINT IF EXISTS check_status_valid;

ALTER TABLE public.checks 
ADD CONSTRAINT check_status_valid 
CHECK (status IN ('pending', 'cashed', 'bounced', 'paid'));