-- 1. Update refresh_all_analytics to be accessible by frontend (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.refresh_all_analytics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.analytics_deal_metrics;
  REFRESH MATERIALIZED VIEW public.analytics_client_metrics;
  REFRESH MATERIALIZED VIEW public.analytics_revenue_metrics;
  REFRESH MATERIALIZED VIEW public.analytics_channel_performance;
  REFRESH MATERIALIZED VIEW public.analytics_chatbot_effectiveness;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 2. Safe Backfill: Insert missing crm_clients for existing contacts
-- This respects the existing trigger by only inserting where no client exists.
INSERT INTO public.crm_clients (
    id,
    organization_id,
    contact_id,
    company_name,
    email,
    phone,
    client_type,
    lifecycle_stage,
    total_revenue,
    last_contact_date,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    c.organization_id,
    c.id,
    c.name,
    NULL, -- Email not always available in contacts
    NULL, -- Phone not always available in contacts
    'lead', -- Default to lead
    'lead', -- Default lifecycle stage
    0,
    c.last_interaction_at,
    c.created_at,
    c.updated_at
FROM
    public.contacts c
WHERE
    NOT EXISTS (
        SELECT 1 FROM public.crm_clients cc WHERE cc.contact_id = c.id
    );

-- 3. Run an immediate refresh to populate views with the backfilled data
SELECT public.refresh_all_analytics();
