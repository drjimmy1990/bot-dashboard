-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant SELECT on all Materialized Views to authenticated users
GRANT SELECT ON public.analytics_deal_metrics TO authenticated;
GRANT SELECT ON public.analytics_client_metrics TO authenticated;
GRANT SELECT ON public.analytics_revenue_metrics TO authenticated;
GRANT SELECT ON public.analytics_channel_performance TO authenticated;
GRANT SELECT ON public.analytics_chatbot_effectiveness TO authenticated;

-- Grant EXECUTE on RPC functions
GRANT EXECUTE ON FUNCTION public.get_crm_dashboard_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_conversion_funnel(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_all_analytics() TO authenticated;

-- Also ensure RLS doesn't block access if enabled (though usually views don't have RLS by default)
-- If you want to be safe, you can disable RLS on views if it was accidentally enabled, 
-- OR ensure policies exist. For now, we assume no RLS on views, just missing permissions.
