-- Add check_type column to checks table
ALTER TABLE public.checks 
ADD COLUMN check_type TEXT NOT NULL DEFAULT 'incoming';

-- Add a check constraint for valid check types
ALTER TABLE public.checks 
ADD CONSTRAINT check_type_valid 
CHECK (check_type IN ('incoming', 'outgoing'));

-- Update existing records to have a default value
UPDATE public.checks 
SET check_type = 'incoming' 
WHERE check_type IS NULL;