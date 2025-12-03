-- Update get_channel_performance_snapshot to ensure date filtering is applied to total_contacts
DROP FUNCTION IF EXISTS public.get_channel_performance_snapshot(UUID, TIMESTAMPTZ, TIMESTAMPTZ);

CREATE OR REPLACE FUNCTION public.get_channel_performance_snapshot(
    org_id UUID, 
    start_date TIMESTAMPTZ DEFAULT NULL,
    end_date TIMESTAMPTZ DEFAULT NULL
) 
RETURNS TABLE (
    organization_id UUID,
    channel_id UUID,
    channel_name TEXT,
    platform TEXT,
    total_contacts BIGINT,
    total_messages BIGINT,
    incoming_messages BIGINT,
    agent_responses BIGINT,
    ai_responses BIGINT,
    period_month TEXT
) AS $$ 
BEGIN 
    RETURN QUERY 
    SELECT 
        ch.organization_id,
        ch.id as channel_id,
        ch.name as channel_name,
        ch.platform,
        (SELECT COUNT(*) FROM public.contacts co 
         WHERE co.channel_id = ch.id 
         AND (start_date IS NULL OR co.created_at >= start_date) 
         AND (end_date IS NULL OR co.created_at <= end_date)
        ) as total_contacts,
        COUNT(m.id) as total_messages,
        COUNT(m.id) FILTER (WHERE m.sender_type = 'user') as incoming_messages,
        COUNT(m.id) FILTER (WHERE m.sender_type = 'agent') as agent_responses,
        COUNT(m.id) FILTER (WHERE m.sender_type = 'ai') as ai_responses,
        TO_CHAR(NOW(), 'YYYY-MM') as period_month
    FROM public.channels ch
    LEFT JOIN public.messages m ON m.channel_id = ch.id 
        AND (start_date IS NULL OR m.sent_at >= start_date)
        AND (end_date IS NULL OR m.sent_at <= end_date)
    WHERE ch.organization_id = org_id
    GROUP BY ch.organization_id, ch.id, ch.name, ch.platform;
END; 
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';
