-- Drop the existing role constraint and create a new one that includes 'developer'
ALTER TABLE profiles DROP CONSTRAINT profiles_role_check;

-- Add new constraint that includes 'developer' role
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role = ANY (ARRAY['admin'::text, 'manager'::text, 'user'::text, 'developer'::text]));

-- Now update the user role to developer
UPDATE profiles 
SET role = 'developer', 
    full_name = 'Developer - Omrani',
    updated_at = now()
WHERE id = '81f3fd55-18ed-4eb9-bc95-89ef96be6ad9';