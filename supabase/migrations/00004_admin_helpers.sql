-- ============================================================
-- Migration 4: Admin helpers
-- Function to retrieve users list with email, restricted to admins.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_users_list()
RETURNS TABLE (
  id uuid,
  full_name text,
  role public.user_role,
  avatar_url text,
  created_at timestamptz,
  email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya admin yang dapat mengambil daftar pengguna.';
  END IF;

  RETURN QUERY
  SELECT p.id, p.full_name, p.role, p.avatar_url, p.created_at, u.email::text
  FROM public.profiles p
  JOIN auth.users u ON p.id = u.id;
END;
$$;
