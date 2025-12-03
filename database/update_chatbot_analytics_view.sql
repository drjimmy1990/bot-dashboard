-- Drop the existing view and index
DROP MATERIALIZED VIEW IF EXISTS public.analytics_chatbot_effectiveness;

-- Re-create the view with channel_id
CREATE MATERIALIZED VIEW public.analytics_chatbot_effectiveness AS
SELECT
  a.organization_id,
  m.channel_id, -- Added channel_id
  COUNT(DISTINCT a.client_id) as unique_clients_engaged,
  COUNT(*) as total_chatbot_interactions,
  COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.client_id END) as successful_interactions,
  AVG(EXTRACT(EPOCH FROM (a.completed_at - a.created_at)) / 60) as avg_interaction_duration_minutes,
  DATE_TRUNC('day', a.created_at) as period_day
FROM public.crm_activities a
LEFT JOIN public.messages m ON a.message_id = m.id -- Join to get channel_id
WHERE a.activity_type = 'chatbot_interaction'
GROUP BY a.organization_id, m.channel_id, DATE_TRUNC('day', a.created_at);

-- Re-create the unique index including channel_id
CREATE UNIQUE INDEX idx_analytics_chatbot_effectiveness ON public.analytics_chatbot_effectiveness(organization_id, channel_id, period_day);

-- Refresh the view to populate data
REFRESH MATERIALIZED VIEW public.analytics_chatbot_effectiveness;
