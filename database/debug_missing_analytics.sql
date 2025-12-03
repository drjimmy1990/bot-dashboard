-- Check counts in source tables
SELECT 'crm_deals' as table_name, count(*) as count FROM public.crm_deals
UNION ALL
SELECT 'crm_orders', count(*) FROM public.crm_orders
UNION ALL
SELECT 'crm_clients', count(*) FROM public.crm_clients;

-- Check counts in materialized views
SELECT 'analytics_deal_metrics' as view_name, count(*) as count FROM public.analytics_deal_metrics
UNION ALL
SELECT 'analytics_revenue_metrics', count(*) FROM public.analytics_revenue_metrics
UNION ALL
SELECT 'analytics_client_metrics', count(*) FROM public.analytics_client_metrics;

-- Check conversion funnel function output (needs an org_id, picking one if exists)
DO $$
DECLARE
    v_org_id UUID;
BEGIN
    SELECT id INTO v_org_id FROM public.organizations LIMIT 1;
    RAISE NOTICE 'Checking funnel for Org ID: %', v_org_id;
END $$;
