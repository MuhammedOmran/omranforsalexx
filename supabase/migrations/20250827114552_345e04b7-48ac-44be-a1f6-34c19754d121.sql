-- Update user role to developer for full access
UPDATE profiles 
SET role = 'developer', 
    full_name = 'Developer - Omrani',
    updated_at = now()
WHERE id = '81f3fd55-18ed-4eb9-bc95-89ef96be6ad9';