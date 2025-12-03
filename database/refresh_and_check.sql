-- Refresh all analytics views explicitly
REFRESH MATERIALIZED VIEW public.analytics_deal_metrics;
REFRESH MATERIALIZED VIEW public.analytics_client_metrics;
REFRESH MATERIALIZED VIEW public.analytics_revenue_metrics;
REFRESH MATERIALIZED VIEW public.analytics_channel_performance;
REFRESH MATERIALIZED VIEW public.analytics_chatbot_effectiveness;

-- Check counts in the views after refresh
SELECT 'analytics_deal_metrics' as view_name, count(*) as count FROM public.analytics_deal_metrics
UNION ALL
SELECT 'analytics_revenue_metrics', count(*) FROM public.analytics_revenue_metrics
UNION ALL
SELECT 'analytics_client_metrics', count(*) FROM public.analytics_client_metrics
UNION ALL
SELECT 'analytics_chatbot_effectiveness', count(*) FROM public.analytics_chatbot_effectiveness;

-- Check crm_clients count (for funnel)
SELECT 'crm_clients' as table_name, count(*) as count FROM public.crm_clients;
