-- Note: Run this in the Supabase SQL Editor.
-- It requires pgcrypto extension to hash passwords.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  aditya_id UUID := '11111111-1111-1111-1111-111111111111';
  sarah_id UUID := '22222222-2222-2222-2222-222222222222';
  rahul_id UUID := '33333333-3333-3333-3333-333333333333';
BEGIN
  -- Insert into auth.users if not exists
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
  )
  VALUES
    ('00000000-0000-0000-0000-000000000000', aditya_id, 'authenticated', 'authenticated', 'aditya@example.com', crypt('demo1234', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', sarah_id, 'authenticated', 'authenticated', 'sarah@example.com', crypt('demo1234', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', rahul_id, 'authenticated', 'authenticated', 'rahul@example.com', crypt('demo1234', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '')
  ON CONFLICT (id) DO NOTHING;

  -- Insert into public.users
  INSERT INTO public.users (id, name, email)
  VALUES
    (aditya_id, 'Aditya Singh', 'aditya@example.com'),
    (sarah_id, 'Sarah Chen', 'sarah@example.com'),
    (rahul_id, 'Rahul Mehta', 'rahul@example.com')
  ON CONFLICT (id) DO NOTHING;

  -- Insert a demo document for Aditya
  INSERT INTO public.documents (id, title, content_json, owner_id)
  VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Welcome to Ajaia Docs',
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Welcome to Ajaia Docs!"}]},{"type":"paragraph","content":[{"type":"text","text":"This is a collaborative document editor built for the hiring assessment."}]}]}',
    aditya_id
  )
  ON CONFLICT (id) DO NOTHING;

  -- Share this document with Sarah
  INSERT INTO public.document_shares (document_id, user_id, shared_by)
  VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    sarah_id,
    aditya_id
  )
  ON CONFLICT (document_id, user_id) DO NOTHING;

END $$;
