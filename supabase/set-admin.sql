-- Run this in the Supabase SQL Editor after creating the user in the UI
-- 1. Go to Authentication -> Add User -> Create admin@yourdomain.com
-- 2. Open the SQL Editor and run the following:

UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'admin@yourdomain.com';
