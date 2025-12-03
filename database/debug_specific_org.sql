-- Debug for Org ID: 650f4284-d53f-4e70-ae47-55e3f89be29d

-- 1. Test get_conversion_funnel RPC
SELECT * FROM public.get_conversion_funnel('650f4284-d53f-4e70-ae47-55e3f89be29d');

-- 2. Check Revenue Metrics View
SELECT * FROM public.analytics_revenue_metrics WHERE organization_id = '650f4284-d53f-4e70-ae47-55e3f89be29d';

-- 3. Check Deal Metrics View
SELECT * FROM public.analytics_deal_metrics WHERE organization_id = '650f4284-d53f-4e70-ae47-55e3f89be29d';

-- 4. Check Raw Deals
SELECT count(*) as raw_deals_count FROM public.crm_deals WHERE organization_id = '650f4284-d53f-4e70-ae47-55e3f89be29d';
