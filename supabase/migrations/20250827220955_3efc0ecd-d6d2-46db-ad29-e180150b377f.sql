-- Fix critical security vulnerabilities - Step 1: Database schema fixes

-- 1. Fix profiles table RLS - make it private by default
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Only allow users to view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- 2. Fix nullable user_id columns that should be NOT NULL for RLS
ALTER TABLE public.checks 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.customers 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.installments 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.invoices 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.products 
ALTER COLUMN user_id SET NOT NULL;

-- 3. Fix user_id type inconsistency - first drop policies, then alter types
-- Drop all policies for device_registrations
DROP POLICY IF EXISTS "Users can delete own devices" ON public.device_registrations;
DROP POLICY IF EXISTS "Users can insert own devices" ON public.device_registrations;
DROP POLICY IF EXISTS "Users can read own devices" ON public.device_registrations;
DROP POLICY IF EXISTS "Users can update own devices" ON public.device_registrations;

-- Drop all policies for user_sessions  
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can read own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.user_sessions;

-- Disable RLS temporarily
ALTER TABLE public.device_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions DISABLE ROW LEVEL SECURITY;

-- Change user_id from text to uuid
ALTER TABLE public.device_registrations 
ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

ALTER TABLE public.user_sessions 
ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- Re-enable RLS
ALTER TABLE public.device_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Recreate policies with proper uuid comparison
CREATE POLICY "Users can delete own devices" 
ON public.device_registrations 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own devices" 
ON public.device_registrations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own devices" 
ON public.device_registrations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own devices" 
ON public.device_registrations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" 
ON public.user_sessions 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" 
ON public.user_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own sessions" 
ON public.user_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" 
ON public.user_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);