-- ====================================================================
-- UPDATE ANALYTICS FOR CHANNEL FILTERING
-- ====================================================================

-- 1. Drop existing views and functions (to recreate them)
DROP MATERIALIZED VIEW IF EXISTS public.analytics_revenue_metrics;
DROP MATERIALIZED VIEW IF EXISTS public.analytics_deal_metrics;
DROP MATERIALIZED VIEW IF EXISTS public.analytics_client_metrics;
DROP FUNCTION IF EXISTS public.get_crm_dashboard_summary(UUID);
DROP FUNCTION IF EXISTS public.get_conversion_funnel(UUID);

-- 2. Recreate Materialized Views with Channel ID

-- A. Revenue Metrics (Added channel_id)
CREATE MATERIALIZED VIEW public.analytics_revenue_metrics AS 
SELECT 
    o.organization_id, 
    co.channel_id, -- Added
    SUM(o.total) as total_revenue, 
    COUNT(DISTINCT o.client_id) as unique_customers, 
    COUNT(*) as order_count, 
    AVG(o.total) as avg_order_value, 
    SUM(CASE WHEN o.status = 'delivered' THEN o.total ELSE 0 END) as delivered_revenue, 
    SUM(CASE WHEN o.status = 'cancelled' OR o.status = 'refunded' THEN o.total ELSE 0 END) as lost_revenue, 
    DATE_TRUNC('day', o.order_date) as period_day, 
    DATE_TRUNC('week', o.order_date) as period_week, 
    DATE_TRUNC('month', o.order_date) as period_month, 
    DATE_TRUNC('year', o.order_date) as period_year 
FROM public.crm_orders o
LEFT JOIN public.crm_clients c ON o.client_id = c.id
LEFT JOIN public.contacts co ON c.contact_id = co.id
GROUP BY o.organization_id, co.channel_id, DATE_TRUNC('day', o.order_date), DATE_TRUNC('week', o.order_date), DATE_TRUNC('month', o.order_date), DATE_TRUNC('year', o.order_date);

CREATE INDEX idx_analytics_revenue_metrics_org_channel ON public.analytics_revenue_metrics(organization_id, channel_id);


-- B. Deal Metrics (Added channel_id)
CREATE MATERIALIZED VIEW public.analytics_deal_metrics AS 
SELECT 
    d.organization_id, 
    co.channel_id, -- Added
    d.stage, 
    d.owner_id, 
    COUNT(*) as deal_count, 
    SUM(d.deal_value) as total_value, 
    AVG(d.deal_value) as avg_deal_size, 
    SUM(CASE WHEN d.stage = 'closed_won' THEN d.deal_value ELSE 0 END) as won_value, 
    SUM(CASE WHEN d.stage = 'closed_lost' THEN d.deal_value ELSE 0 END) as lost_value, 
    AVG(d.probability) as avg_probability, 
    AVG(EXTRACT(EPOCH FROM (COALESCE(d.actual_close_date::timestamptz, NOW()) - d.created_at)) / 86400) as avg_deal_cycle_days, 
    DATE_TRUNC('month', d.created_at) as period_month 
FROM public.crm_deals d
LEFT JOIN public.crm_clients c ON d.client_id = c.id
LEFT JOIN public.contacts co ON c.contact_id = co.id
GROUP BY d.organization_id, co.channel_id, d.stage, d.owner_id, DATE_TRUNC('month', d.created_at);

CREATE INDEX idx_analytics_deal_metrics_org_channel ON public.analytics_deal_metrics(organization_id, channel_id);


-- C. Client Metrics (Added channel_id)
CREATE MATERIALIZED VIEW public.analytics_client_metrics AS 
SELECT 
    c.organization_id, 
    co.channel_id, -- Added
    c.lifecycle_stage, 
    c.client_type, 
    c.source, 
    c.assigned_to, 
    COUNT(*) as client_count, 
    SUM(c.total_revenue) as total_revenue, 
    AVG(c.total_revenue) as avg_revenue_per_client, 
    AVG(c.total_orders) as avg_orders_per_client, 
    AVG(c.average_order_value) as avg_order_value, 
    AVG(c.lead_score) as avg_lead_score, 
    DATE_TRUNC('month', c.created_at) as period_month 
FROM public.crm_clients c
LEFT JOIN public.contacts co ON c.contact_id = co.id
GROUP BY c.organization_id, co.channel_id, c.lifecycle_stage, c.client_type, c.source, c.assigned_to, DATE_TRUNC('month', c.created_at);

CREATE INDEX idx_analytics_client_metrics_org_channel ON public.analytics_client_metrics(organization_id, channel_id);


-- 3. Update RPC Functions

-- A. Dashboard Summary (Added p_channel_id)
CREATE OR REPLACE FUNCTION public.get_crm_dashboard_summary(org_id UUID, p_channel_id UUID DEFAULT NULL) 
RETURNS TABLE (
    total_clients BIGINT, 
    total_customers BIGINT, 
    total_leads BIGINT, 
    total_deals BIGINT, 
    open_deals_value NUMERIC, 
    closed_won_deals BIGINT, 
    total_revenue NUMERIC, 
    avg_order_value NUMERIC, 
    pending_activities BIGINT
) AS $$ 
BEGIN 
    RETURN QUERY 
    SELECT 
        (SELECT COUNT(*) FROM public.crm_clients c LEFT JOIN public.contacts co ON c.contact_id = co.id WHERE c.organization_id = org_id AND (p_channel_id IS NULL OR co.channel_id = p_channel_id)), 
        (SELECT COUNT(*) FROM public.crm_clients c LEFT JOIN public.contacts co ON c.contact_id = co.id WHERE c.organization_id = org_id AND c.client_type = 'customer' AND (p_channel_id IS NULL OR co.channel_id = p_channel_id)), 
        (SELECT COUNT(*) FROM public.crm_clients c LEFT JOIN public.contacts co ON c.contact_id = co.id WHERE c.organization_id = org_id AND c.client_type = 'lead' AND (p_channel_id IS NULL OR co.channel_id = p_channel_id)), 
        (SELECT COUNT(*) FROM public.crm_deals d LEFT JOIN public.crm_clients c ON d.client_id = c.id LEFT JOIN public.contacts co ON c.contact_id = co.id WHERE d.organization_id = org_id AND (p_channel_id IS NULL OR co.channel_id = p_channel_id)), 
        (SELECT COALESCE(SUM(d.deal_value), 0) FROM public.crm_deals d LEFT JOIN public.crm_clients c ON d.client_id = c.id LEFT JOIN public.contacts co ON c.contact_id = co.id WHERE d.organization_id = org_id AND d.stage NOT IN ('closed_won', 'closed_lost') AND (p_channel_id IS NULL OR co.channel_id = p_channel_id)), 
        (SELECT COUNT(*) FROM public.crm_deals d LEFT JOIN public.crm_clients c ON d.client_id = c.id LEFT JOIN public.contacts co ON c.contact_id = co.id WHERE d.organization_id = org_id AND d.stage = 'closed_won' AND (p_channel_id IS NULL OR co.channel_id = p_channel_id)), 
        (SELECT COALESCE(SUM(o.total), 0) FROM public.crm_orders o LEFT JOIN public.crm_clients c ON o.client_id = c.id LEFT JOIN public.contacts co ON c.contact_id = co.id WHERE o.organization_id = org_id AND o.status NOT IN ('cancelled', 'refunded') AND (p_channel_id IS NULL OR co.channel_id = p_channel_id)), 
        (SELECT COALESCE(AVG(o.total), 0) FROM public.crm_orders o LEFT JOIN public.crm_clients c ON o.client_id = c.id LEFT JOIN public.contacts co ON c.contact_id = co.id WHERE o.organization_id = org_id AND o.status NOT IN ('cancelled', 'refunded') AND (p_channel_id IS NULL OR co.channel_id = p_channel_id)), 
        -- Note: Activities don't always link to a channel directly unless via client->contact. 
        -- But activities have client_id, so we can use that.
        (SELECT COUNT(*) FROM public.crm_activities a LEFT JOIN public.crm_clients c ON a.client_id = c.id LEFT JOIN public.contacts co ON c.contact_id = co.id WHERE a.organization_id = org_id AND a.status = 'pending' AND (p_channel_id IS NULL OR co.channel_id = p_channel_id)); 
END; 
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

-- B. Conversion Funnel (Added p_channel_id)
CREATE OR REPLACE FUNCTION public.get_conversion_funnel(org_id UUID, p_channel_id UUID DEFAULT NULL) 
RETURNS TABLE (lifecycle_stage TEXT, count BIGINT, percentage NUMERIC) AS $$ 
BEGIN 
    RETURN QUERY 
    SELECT 
        c.lifecycle_stage, 
        COUNT(*) as count, 
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage 
    FROM public.crm_clients c 
    LEFT JOIN public.contacts co ON c.contact_id = co.id
    WHERE c.organization_id = org_id 
      AND (p_channel_id IS NULL OR co.channel_id = p_channel_id)
    GROUP BY c.lifecycle_stage 
    ORDER BY CASE c.lifecycle_stage 
        WHEN 'lead' THEN 1 
        WHEN 'mql' THEN 2 
        WHEN 'sql' THEN 3 
        WHEN 'opportunity' THEN 4 
        WHEN 'customer' THEN 5 
        WHEN 'evangelist' THEN 6 
        WHEN 'churned' THEN 7 
    END; 
END; 
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

-- 4. Grant Permissions
GRANT SELECT ON public.analytics_revenue_metrics TO authenticated;
GRANT SELECT ON public.analytics_deal_metrics TO authenticated;
GRANT SELECT ON public.analytics_client_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_crm_dashboard_summary(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_conversion_funnel(UUID, UUID) TO authenticated;

-- 5. Refresh Views
SELECT public.refresh_all_analytics();
