-- List all organizations and their data counts in the analytics views
SELECT 
    o.id as org_id, 
    o.name as org_name,
    (SELECT count(*) FROM public.analytics_revenue_metrics WHERE organization_id = o.id) as revenue_rows,
    (SELECT count(*) FROM public.analytics_deal_metrics WHERE organization_id = o.id) as deal_rows,
    (SELECT count(*) FROM public.analytics_client_metrics WHERE organization_id = o.id) as client_rows,
    (SELECT count(*) FROM public.analytics_chatbot_effectiveness WHERE organization_id = o.id) as chatbot_rows
FROM public.organizations o;

-- Also check the raw tables to see if data exists but views are empty
SELECT 
    o.id as org_id, 
    o.name as org_name,
    (SELECT count(*) FROM public.crm_orders WHERE organization_id = o.id) as raw_orders,
    (SELECT count(*) FROM public.crm_deals WHERE organization_id = o.id) as raw_deals
FROM public.organizations o;
