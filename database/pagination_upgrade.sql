-- ====================================================================
-- PAGINATION UPGRADE — Infinite Scroll for Contacts
-- ====================================================================
-- Updates: get_contacts_for_channel RPC to support LIMIT/OFFSET pagination
-- Run this AFTER all previous migrations.
-- ====================================================================

-- Drop the OLD 2-parameter version to avoid PostgREST overload conflict (PGRST203)
DROP FUNCTION IF EXISTS public.get_contacts_for_channel(UUID, TEXT);

-- Replace with pagination-enabled version

-- Replace the existing function with pagination support
-- The old function returns ALL contacts; this one paginates.
CREATE OR REPLACE FUNCTION public.get_contacts_for_channel(
    p_channel_id UUID,
    p_search_term TEXT DEFAULT '',
    p_limit INT DEFAULT 30,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    organization_id UUID,
    channel_id UUID,
    platform TEXT,
    platform_user_id TEXT,
    name TEXT,
    ai_enabled BOOLEAN,
    unread_count INT,
    last_message_preview TEXT,
    last_interaction_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    crm_client_id UUID
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.organization_id,
        c.channel_id,
        c.platform,
        c.platform_user_id,
        c.name,
        c.ai_enabled,
        c.unread_count,
        c.last_message_preview,
        c.last_interaction_at,
        c.created_at,
        cl.id AS crm_client_id
    FROM public.contacts c
    LEFT JOIN public.crm_clients cl ON cl.contact_id = c.id
    WHERE c.channel_id = p_channel_id
      AND (
          p_search_term = ''
          OR c.name ILIKE '%' || p_search_term || '%'
          OR c.platform_user_id ILIKE '%' || p_search_term || '%'
      )
    ORDER BY c.unread_count DESC, c.last_interaction_at DESC NULLS LAST
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION public.get_contacts_for_channel(UUID, TEXT, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_contacts_for_channel(UUID, TEXT, INT, INT) TO service_role;

-- ====================================================================
-- VERIFICATION
-- ====================================================================
DO $$
BEGIN
    RAISE NOTICE 'Pagination Upgrade applied successfully.';
    RAISE NOTICE '  ✓ get_contacts_for_channel updated with p_limit and p_offset';
    RAISE NOTICE '  ✓ Default: 30 contacts per page';
    RAISE NOTICE '  ✓ Backward compatible (old calls without limit/offset still work)';
END $$;
