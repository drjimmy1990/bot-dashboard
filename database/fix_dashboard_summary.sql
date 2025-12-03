-- Update get_crm_dashboard_summary to ensure date filtering is applied correctly
CREATE OR REPLACE FUNCTION public.get_crm_dashboard_summary(
    org_id UUID, 
    p_channel_id UUID DEFAULT NULL,
    start_date TIMESTAMPTZ DEFAULT NULL,
    end_date TIMESTAMPTZ DEFAULT NULL
) 
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
        (SELECT COUNT(*) FROM public.crm_clients c LEFT JOIN public.contacts co ON c.contact_id = co.id WHERE c.organization_id = org_id AND (p_channel_id IS NULL OR co.channel_id = p_channel_id) AND (start_date IS NULL OR c.created_at >= start_date) AND (end_date IS NULL OR c.created_at <= end_date)), 
        (SELECT COUNT(*) FROM public.crm_clients c LEFT JOIN public.contacts co ON c.contact_id = co.id WHERE c.organization_id = org_id AND c.client_type = 'customer' AND (p_channel_id IS NULL OR co.channel_id = p_channel_id) AND (start_date IS NULL OR c.created_at >= start_date) AND (end_date IS NULL OR c.created_at <= end_date)), 
        (SELECT COUNT(*) FROM public.crm_clients c LEFT JOIN public.contacts co ON c.contact_id = co.id WHERE c.organization_id = org_id AND c.client_type = 'lead' AND (p_channel_id IS NULL OR co.channel_id = p_channel_id) AND (start_date IS NULL OR c.created_at >= start_date) AND (end_date IS NULL OR c.created_at <= end_date)), 
        (SELECT COUNT(*) FROM public.crm_deals d LEFT JOIN public.crm_clients c ON d.client_id = c.id LEFT JOIN public.contacts co ON c.contact_id = co.id WHERE d.organization_id = org_id AND (p_channel_id IS NULL OR co.channel_id = p_channel_id) AND (start_date IS NULL OR d.created_at >= start_date) AND (end_date IS NULL OR d.created_at <= end_date)), 
        (SELECT COALESCE(SUM(d.deal_value), 0) FROM public.crm_deals d LEFT JOIN public.crm_clients c ON d.client_id = c.id LEFT JOIN public.contacts co ON c.contact_id = co.id WHERE d.organization_id = org_id AND d.stage NOT IN ('closed_won', 'closed_lost') AND (p_channel_id IS NULL OR co.channel_id = p_channel_id) AND (start_date IS NULL OR d.created_at >= start_date) AND (end_date IS NULL OR d.created_at <= end_date)), 
        (SELECT COUNT(*) FROM public.crm_deals d LEFT JOIN public.crm_clients c ON d.client_id = c.id LEFT JOIN public.contacts co ON c.contact_id = co.id WHERE d.organization_id = org_id AND d.stage = 'closed_won' AND (p_channel_id IS NULL OR co.channel_id = p_channel_id) AND (start_date IS NULL OR d.created_at >= start_date) AND (end_date IS NULL OR d.created_at <= end_date)), 
        (SELECT COALESCE(SUM(o.total), 0) FROM public.crm_orders o LEFT JOIN public.crm_clients c ON o.client_id = c.id LEFT JOIN public.contacts co ON c.contact_id = co.id WHERE o.organization_id = org_id AND o.status NOT IN ('cancelled', 'refunded') AND (p_channel_id IS NULL OR co.channel_id = p_channel_id) AND (start_date IS NULL OR o.order_date >= start_date) AND (end_date IS NULL OR o.order_date <= end_date)), 
        (SELECT COALESCE(AVG(o.total), 0) FROM public.crm_orders o LEFT JOIN public.crm_clients c ON o.client_id = c.id LEFT JOIN public.contacts co ON c.contact_id = co.id WHERE o.organization_id = org_id AND o.status NOT IN ('cancelled', 'refunded') AND (p_channel_id IS NULL OR co.channel_id = p_channel_id) AND (start_date IS NULL OR o.order_date >= start_date) AND (end_date IS NULL OR o.order_date <= end_date)), 
        (SELECT COUNT(*) FROM public.crm_activities a LEFT JOIN public.crm_clients c ON a.client_id = c.id LEFT JOIN public.contacts co ON c.contact_id = co.id WHERE a.organization_id = org_id AND a.status = 'pending' AND (p_channel_id IS NULL OR co.channel_id = p_channel_id) AND (start_date IS NULL OR a.created_at >= start_date) AND (end_date IS NULL OR a.created_at <= end_date)); 
END; 
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';
