-- ====================================================================
--          FIX FINAL DATABASE LINTS
-- ====================================================================

-- 1. Fix "Extension in Public" for pg_trgm
-- If pg_trgm was installed in 'public', this moves it to 'extensions'.
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

-- 2. Fix "Function Search Path Mutable" for create_activity_from_message
-- This function is a trigger function.
ALTER FUNCTION public.create_activity_from_message() SET search_path = '';

-- 3. Fix "Function Search Path Mutable" for get_contacts_for_channel
-- This function takes (UUID, TEXT).
ALTER FUNCTION public.get_contacts_for_channel(UUID, TEXT) SET search_path = '';

-- 4. Verify
DO $$
BEGIN
    RAISE NOTICE 'Moved pg_trgm to extensions and hardened function search paths.';
END $$;
