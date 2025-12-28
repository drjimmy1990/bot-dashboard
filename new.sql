-- ====================================================================
-- SAFE UPDATE: SYNC & UTILITIES
-- This script adds functionality. It deletes NOTHING.
-- ====================================================================

-- 1. Ensure the sync function exists
-- This function keeps the CRM Name updated if the Contact Name changes in chat
CREATE OR REPLACE FUNCTION public.sync_contact_update_to_client()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Only update if the CRM name is currently empty OR matches the old contact name
  -- This prevents overwriting manual edits made by agents in the CRM
  UPDATE public.crm_clients
  SET 
    company_name = NEW.name, 
    updated_at = NOW()
  WHERE contact_id = NEW.id
  AND (company_name IS NULL OR company_name = OLD.name);
  
  RETURN NEW;
END;
$$;

-- 2. Safely add the trigger (Drop first to avoid "already exists" error, then recreate)
DROP TRIGGER IF EXISTS on_contact_update_sync_client ON public.contacts;

CREATE TRIGGER on_contact_update_sync_client
AFTER UPDATE OF name ON public.contacts
FOR EACH ROW EXECUTE FUNCTION public.sync_contact_update_to_client();

-- 3. Safely add a column to Order table to tracking status easier
-- This helps if you want to track "Preparing", "Cooking", "Ready"
ALTER TABLE public.crm_orders
ADD COLUMN IF NOT EXISTS fulfillment_status TEXT DEFAULT 'unfulfilled';

-- 4. Safely add a generic search index to help find clients faster
CREATE INDEX IF NOT EXISTS idx_crm_clients_search_safe 
ON public.crm_clients (email, phone, company_name);

-- ====================================================================
-- SAFE UPDATE: ANALYTICS
-- This script adds functionality. It deletes NOTHING.
-- ====================================================================

-- 1. Grant permission to the logged-in user role
GRANT EXECUTE ON FUNCTION public.refresh_all_analytics() TO authenticated;

-- 2. Grant permission to the service role (just in case)
GRANT EXECUTE ON FUNCTION public.refresh_all_analytics() TO service_role;

-- 3. Ensure the function runs as the database owner (Superuser)
-- This is critical because refreshing views requires high-level privileges.
ALTER FUNCTION public.refresh_all_analytics() OWNER TO postgres;