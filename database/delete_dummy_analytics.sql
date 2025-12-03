-- DATA CLEANUP SCRIPT
-- This script deletes data created by the 'generate_dummy_analytics.sql' script.

DO $$
DECLARE
    v_org_id UUID;
BEGIN
    -- Auto-select the first organization (same logic as generation)
    SELECT id INTO v_org_id FROM public.organizations LIMIT 1;

    RAISE NOTICE 'Cleaning up dummy data for Organization ID: %', v_org_id;

    -- 1. Delete Dummy Orders
    DELETE FROM public.crm_orders 
    WHERE order_number LIKE 'ORD-DUMMY-%';

    -- 2. Delete Dummy Deals
    DELETE FROM public.crm_deals 
    WHERE name LIKE 'Dummy Deal %';

    -- 3. Delete Dummy Clients
    DELETE FROM public.crm_clients 
    WHERE company_name LIKE 'Dummy Corp %';

    -- 4. Delete Dummy Messages
    -- We delete messages linked to dummy contacts
    DELETE FROM public.messages 
    WHERE contact_id IN (
        SELECT id FROM public.contacts 
        WHERE name LIKE 'Dummy User %'
    );

    -- 5. Delete Dummy Contacts
    DELETE FROM public.contacts 
    WHERE name LIKE 'Dummy User %';

    -- 6. Delete Dummy Channel (and cascade to everything else if FKs are set)
    DELETE FROM public.channels 
    WHERE name = 'Dummy Data Channel' OR platform_channel_id = 'dummy_whatsapp_123';

    -- 7. Refresh Analytics to clear the charts
    PERFORM public.refresh_all_analytics();

    RAISE NOTICE 'Dummy data cleanup complete!';
END $$;
