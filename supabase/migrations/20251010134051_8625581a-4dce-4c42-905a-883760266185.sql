-- Ensure profiles RLS and auto-creation are correctly configured

-- 1) Enable Row Level Security on profiles and add policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create a unique constraint on user_id to avoid duplicates
CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_unique ON public.profiles (user_id);

-- Allow users to view their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Profiles: users can select own'
  ) THEN
    CREATE POLICY "Profiles: users can select own"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Allow users to insert their own profile row
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Profiles: users can insert own'
  ) THEN
    CREATE POLICY "Profiles: users can insert own"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Allow users to update their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Profiles: users can update own'
  ) THEN
    CREATE POLICY "Profiles: users can update own"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- 2) Ensure the trigger to auto-create a profile exists when a new auth user is created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;
