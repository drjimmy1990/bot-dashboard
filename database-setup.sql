-- ====================================================================
--          THE DEFINITIVE MASTER SCRIPT (V12 - FEATURE RESTORATION)
-- This version re-integrates the credentials and message metadata columns.
-- ====================================================================

-- Section 1: Extensions & Tables
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE TABLE public.organizations (id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(), name TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE public.profiles (id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, full_name TEXT, role TEXT NOT NULL DEFAULT 'admin');

-- THIS IS A CHANGE: 'credentials' column has been added back.
CREATE TABLE public.channels (id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(), organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, name TEXT NOT NULL, platform TEXT NOT NULL, platform_channel_id TEXT UNIQUE, credentials JSONB, is_active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());

CREATE TABLE public.contacts (id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(), organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE, platform TEXT NOT NULL, platform_user_id TEXT NOT NULL, name TEXT, avatar_url TEXT, ai_enabled BOOLEAN NOT NULL DEFAULT TRUE, last_interaction_at TIMESTAMPTZ DEFAULT NOW(), last_message_preview TEXT, unread_count INTEGER NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), CONSTRAINT unique_contact_per_channel UNIQUE (channel_id, platform_user_id));

-- THIS IS A CHANGE: The 3 metadata columns have been added back.
CREATE TABLE public.messages (id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(), organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE, contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE, message_platform_id TEXT, sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'agent', 'ai', 'system')), content_type TEXT NOT NULL DEFAULT 'text', text_content TEXT, attachment_url TEXT, attachment_metadata JSONB, is_read_by_agent BOOLEAN NOT NULL DEFAULT FALSE, sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), platform_timestamp TIMESTAMPTZ);

CREATE TABLE public.channel_configurations (channel_id UUID PRIMARY KEY REFERENCES public.channels(id) ON DELETE CASCADE, organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, ai_model TEXT NOT NULL DEFAULT 'models/gemini-1.5-flash', ai_temperature NUMERIC(2, 1) NOT NULL DEFAULT 0.7, is_bot_active BOOLEAN NOT NULL DEFAULT TRUE, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE public.agent_prompts (id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(), organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE, agent_id TEXT NOT NULL, name TEXT NOT NULL, description TEXT, system_prompt TEXT NOT NULL, UNIQUE(channel_id, agent_id));
CREATE TABLE public.content_collections (id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(), organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE, collection_id TEXT NOT NULL, name TEXT NOT NULL, items TEXT[], UNIQUE(channel_id, collection_id));
CREATE TABLE public.keyword_actions (id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(), organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE, keyword TEXT NOT NULL, action_type TEXT NOT NULL, UNIQUE(channel_id, keyword));

-- Section 2: Functions & Triggers
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE new_org_id UUID; BEGIN INSERT INTO public.organizations (name) VALUES (NEW.email || '''s Organization') RETURNING id INTO new_org_id; INSERT INTO public.profiles (id, organization_id) VALUES (NEW.id, new_org_id); RETURN NEW; END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.create_channel_and_config(channel_name TEXT, channel_platform TEXT, platform_id TEXT) RETURNS JSONB LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE caller_org_id UUID; new_channel_id UUID;
BEGIN
    SELECT organization_id INTO caller_org_id FROM public.profiles WHERE id = auth.uid();
    IF caller_org_id IS NULL THEN RAISE EXCEPTION 'Could not determine organization for the current user.'; END IF;
    INSERT INTO public.channels (organization_id, name, platform, platform_channel_id) VALUES (caller_org_id, channel_name, channel_platform, platform_id) RETURNING id INTO new_channel_id;
    INSERT INTO public.channel_configurations (channel_id, organization_id) VALUES (new_channel_id, caller_org_id);
    RETURN jsonb_build_object('id', new_channel_id, 'organization_id', caller_org_id);
END;
$$;

-- Section 3: Row-Level Security (RLS) - Unchanged from the working version
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY; ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY; ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY; ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY; ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY; ALTER TABLE public.channel_configurations ENABLE ROW LEVEL SECURITY; ALTER TABLE public.agent_prompts ENABLE ROW LEVEL SECURITY; ALTER TABLE public.content_collections ENABLE ROW LEVEL SECURITY; ALTER TABLE public.keyword_actions ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.get_my_organization_id() RETURNS UUID LANGUAGE sql STABLE AS $$ SELECT organization_id FROM public.profiles WHERE id = auth.uid(); $$;

CREATE POLICY "Users can manage their own profile" ON public.profiles FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Users can manage their own organization" ON public.organizations FOR ALL USING (id = get_my_organization_id()) WITH CHECK (id = get_my_organization_id());
CREATE POLICY "Users can manage data in their organization" ON public.channels FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());
CREATE POLICY "Users can manage data in their organization" ON public.contacts FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());
CREATE POLICY "Users can manage data in their organization" ON public.messages FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());
CREATE POLICY "Users can manage data in their organization" ON public.channel_configurations FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());
CREATE POLICY "Users can manage data in their organization" ON public.agent_prompts FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());
CREATE POLICY "Users can manage data in their organization" ON public.content_collections FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());
CREATE POLICY "Users can manage data in their organization" ON public.keyword_actions FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());







-- ====================================================================
--          DATABASE AUTOMATION RESTORATION SCRIPT
-- This script adds back the triggers needed to update unread counts
-- and last message previews for contacts.
-- ====================================================================

-- Step 1: Create the function that performs the update logic.
-- It runs with DEFINER permissions to ensure it can update the contacts table.
CREATE OR REPLACE FUNCTION public.update_contact_summary_on_message()
RETURNS TRIGGER AS $$
DECLARE
    v_contact_id UUID;
BEGIN
    -- Determine the contact_id from the new or old message row
    v_contact_id := COALESCE(NEW.contact_id, OLD.contact_id);

    -- Perform the update on the 'contacts' table
    UPDATE public.contacts
    SET 
        -- Set the last interaction time to the most recent message's sent_at time
        last_interaction_at = (SELECT MAX(m.sent_at) FROM public.messages m WHERE m.contact_id = v_contact_id),

        -- Set the preview to the text of the last message, or a placeholder like '[Image]'
        last_message_preview = (
            SELECT CASE 
                WHEN sub.content_type = 'text' THEN LEFT(sub.text_content, 70)
                ELSE '[' || INITCAP(sub.content_type) || ']'
            END
            FROM public.messages sub WHERE sub.contact_id = v_contact_id ORDER BY sub.sent_at DESC LIMIT 1
        ),

        -- Recalculate the number of unread messages from the 'user'
        unread_count = (
            SELECT COUNT(*) FROM public.messages m
            WHERE m.contact_id = v_contact_id AND m.sender_type = 'user' AND m.is_read_by_agent = FALSE
        )
    WHERE id = v_contact_id;

    -- Return null because this is an AFTER trigger
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Step 2: Create the trigger that calls the function.
-- This tells the database to run the function AFTER any INSERT, UPDATE, or DELETE on the 'messages' table.

-- First, drop the trigger if it exists to ensure a clean state
DROP TRIGGER IF EXISTS messages_summary_trigger ON public.messages;

-- Then, create the new trigger
CREATE TRIGGER messages_summary_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.update_contact_summary_on_message();

-- ======================= END OF SCRIPT =======================



-- ====================================================================
--          DATABASE FUNCTION HARDENING SCRIPT (COMPLETE)
-- This script fixes all "Function Search Path Mutable" warnings.
-- ====================================================================

-- Harden the SECURITY DEFINER functions (the important ones)
ALTER FUNCTION public.handle_new_user() SET search_path = '';
ALTER FUNCTION public.update_contact_summary_on_message() SET search_path = '';

-- Harden the other functions to clear all warnings from the linter
ALTER FUNCTION public.create_channel_and_config(text, text, text) SET search_path = '';
ALTER FUNCTION public.get_my_organization_id() SET search_path = '';



































-- ====================================================================
--          CRM & ANALYTICS EXTENSION SCRIPT (V12 - FINAL)
-- This script adds all CRM and Analytics features to your existing database.
-- ====================================================================

-- ====================================================================
-- SECTION 1: CORE CRM TABLES
-- ====================================================================

CREATE TABLE public.crm_clients (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  -- IMPROVEMENT: Added UNIQUE constraint to ensure one CRM client per contact.
  contact_id UUID UNIQUE REFERENCES public.contacts(id) ON DELETE SET NULL,
  client_type TEXT NOT NULL DEFAULT 'lead' CHECK (client_type IN ('lead', 'prospect', 'customer', 'partner', 'inactive')),
  company_name TEXT,
  email TEXT,
  phone TEXT,
  secondary_phone TEXT,
  address JSONB,
  ecommerce_customer_id TEXT,
  total_orders INTEGER DEFAULT 0,
  total_revenue NUMERIC(12, 2) DEFAULT 0,
  average_order_value NUMERIC(12, 2) DEFAULT 0,
  source TEXT,
  source_details JSONB,
  utm_data JSONB,
  lifecycle_stage TEXT DEFAULT 'lead' CHECK (lifecycle_stage IN ('lead', 'mql', 'sql', 'opportunity', 'customer', 'evangelist', 'churned')),
  lead_score INTEGER DEFAULT 0,
  lead_quality TEXT CHECK (lead_quality IN ('hot', 'warm', 'cold')),
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  tags TEXT[],
  custom_fields JSONB,
  first_contact_date TIMESTAMPTZ DEFAULT NOW(),
  last_contact_date TIMESTAMPTZ,
  next_follow_up_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_ecommerce_customer UNIQUE (organization_id, ecommerce_customer_id)
);
-- Indexes (Your original indexes were excellent, no changes needed)
CREATE INDEX idx_crm_clients_organization ON public.crm_clients(organization_id);
CREATE INDEX idx_crm_clients_contact ON public.crm_clients(contact_id);
CREATE INDEX idx_crm_clients_type ON public.crm_clients(client_type);
CREATE INDEX idx_crm_clients_assigned ON public.crm_clients(assigned_to);
CREATE INDEX idx_crm_clients_lifecycle ON public.crm_clients(lifecycle_stage);
CREATE INDEX idx_crm_clients_email ON public.crm_clients(email);
CREATE INDEX idx_crm_clients_ecommerce ON public.crm_clients(ecommerce_customer_id);

-- (All other tables: crm_deals, crm_deal_stages_history, crm_products, crm_orders, crm_activities, crm_notes, crm_tags are perfect as you wrote them. They will be created here.)
CREATE TABLE public.crm_deals (id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(), organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, client_id UUID NOT NULL REFERENCES public.crm_clients(id) ON DELETE CASCADE, name TEXT NOT NULL, description TEXT, deal_value NUMERIC(12, 2) NOT NULL DEFAULT 0, currency TEXT NOT NULL DEFAULT 'USD', stage TEXT NOT NULL DEFAULT 'prospecting' CHECK (stage IN ('prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost')), probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100), expected_close_date DATE, actual_close_date DATE, products JSONB, owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, lost_reason TEXT, lost_reason_details TEXT, won_reason TEXT, competitor TEXT, tags TEXT[], custom_fields JSONB, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), stage_changed_at TIMESTAMPTZ DEFAULT NOW());
CREATE INDEX idx_crm_deals_organization ON public.crm_deals(organization_id); CREATE INDEX idx_crm_deals_client ON public.crm_deals(client_id); CREATE INDEX idx_crm_deals_stage ON public.crm_deals(stage); CREATE INDEX idx_crm_deals_owner ON public.crm_deals(owner_id); CREATE INDEX idx_crm_deals_close_date ON public.crm_deals(expected_close_date);
CREATE TABLE public.crm_deal_stages_history (id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(), organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, deal_id UUID NOT NULL REFERENCES public.crm_deals(id) ON DELETE CASCADE, from_stage TEXT, to_stage TEXT NOT NULL, changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL, notes TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE INDEX idx_deal_stages_history_deal ON public.crm_deal_stages_history(deal_id); CREATE INDEX idx_deal_stages_history_created ON public.crm_deal_stages_history(created_at);
CREATE TABLE public.crm_products (id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(), organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, name TEXT NOT NULL, description TEXT, sku TEXT, category TEXT, price NUMERIC(12, 2) NOT NULL DEFAULT 0, cost NUMERIC(12, 2), currency TEXT NOT NULL DEFAULT 'USD', ecommerce_product_id TEXT, is_active BOOLEAN NOT NULL DEFAULT TRUE, custom_fields JSONB, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), CONSTRAINT unique_ecommerce_product UNIQUE (organization_id, ecommerce_product_id));
CREATE INDEX idx_crm_products_organization ON public.crm_products(organization_id); CREATE INDEX idx_crm_products_active ON public.crm_products(is_active); CREATE INDEX idx_crm_products_ecommerce ON public.crm_products(ecommerce_product_id);
CREATE TABLE public.crm_orders (id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(), organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, client_id UUID NOT NULL REFERENCES public.crm_clients(id) ON DELETE CASCADE, deal_id UUID REFERENCES public.crm_deals(id) ON DELETE SET NULL, order_number TEXT NOT NULL, ecommerce_order_id TEXT, subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0, tax NUMERIC(12, 2) DEFAULT 0, shipping NUMERIC(12, 2) DEFAULT 0, discount NUMERIC(12, 2) DEFAULT 0, total NUMERIC(12, 2) NOT NULL DEFAULT 0, currency TEXT NOT NULL DEFAULT 'USD', status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')), items JSONB, shipping_address JSONB, tracking_number TEXT, order_date TIMESTAMPTZ NOT NULL DEFAULT NOW(), shipped_date TIMESTAMPTZ, delivered_date TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), CONSTRAINT unique_order_number UNIQUE (organization_id, order_number));
CREATE INDEX idx_crm_orders_organization ON public.crm_orders(organization_id); CREATE INDEX idx_crm_orders_client ON public.crm_orders(client_id); CREATE INDEX idx_crm_orders_status ON public.crm_orders(status); CREATE INDEX idx_crm_orders_date ON public.crm_orders(order_date); CREATE INDEX idx_crm_orders_ecommerce ON public.crm_orders(ecommerce_order_id);
CREATE TABLE public.crm_activities (id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(), organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, client_id UUID REFERENCES public.crm_clients(id) ON DELETE CASCADE, deal_id UUID REFERENCES public.crm_deals(id) ON DELETE CASCADE, message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL, activity_type TEXT NOT NULL CHECK (activity_type IN ('call', 'email', 'meeting', 'task', 'note', 'chatbot_interaction', 'website_visit')), subject TEXT NOT NULL, description TEXT, status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')), priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')), due_date TIMESTAMPTZ, completed_at TIMESTAMPTZ, assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL, created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL, metadata JSONB, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE INDEX idx_crm_activities_organization ON public.crm_activities(organization_id); CREATE INDEX idx_crm_activities_client ON public.crm_activities(client_id); CREATE INDEX idx_crm_activities_deal ON public.crm_activities(deal_id); CREATE INDEX idx_crm_activities_type ON public.crm_activities(activity_type); CREATE INDEX idx_crm_activities_assigned ON public.crm_activities(assigned_to); CREATE INDEX idx_crm_activities_due ON public.crm_activities(due_date); CREATE INDEX idx_crm_activities_status ON public.crm_activities(status);
CREATE TABLE public.crm_notes (id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(), organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, client_id UUID REFERENCES public.crm_clients(id) ON DELETE CASCADE, deal_id UUID REFERENCES public.crm_deals(id) ON DELETE CASCADE, title TEXT, content TEXT NOT NULL, note_type TEXT CHECK (note_type IN ('general', 'call_log', 'meeting_summary', 'important')), is_pinned BOOLEAN DEFAULT FALSE, tags TEXT[], created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE INDEX idx_crm_notes_organization ON public.crm_notes(organization_id); CREATE INDEX idx_crm_notes_client ON public.crm_notes(client_id); CREATE INDEX idx_crm_notes_deal ON public.crm_notes(deal_id); CREATE INDEX idx_crm_notes_pinned ON public.crm_notes(is_pinned);
CREATE TABLE public.crm_tags (id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(), organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, name TEXT NOT NULL, color TEXT DEFAULT '#3B82F6', category TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), CONSTRAINT unique_tag_per_org UNIQUE (organization_id, name));
CREATE INDEX idx_crm_tags_organization ON public.crm_tags(organization_id); CREATE INDEX idx_crm_tags_category ON public.crm_tags(category);

-- ====================================================================
-- SECTION 2: ANALYTICS MATERIALIZED VIEWS
-- ====================================================================

-- (Materialized Views for deal_metrics, client_metrics, revenue_metrics, and chatbot_effectiveness are perfect. No changes needed.)
CREATE MATERIALIZED VIEW public.analytics_deal_metrics AS SELECT d.organization_id, d.stage, d.owner_id, COUNT(*) as deal_count, SUM(d.deal_value) as total_value, AVG(d.deal_value) as avg_deal_size, SUM(CASE WHEN d.stage = 'closed_won' THEN d.deal_value ELSE 0 END) as won_value, SUM(CASE WHEN d.stage = 'closed_lost' THEN d.deal_value ELSE 0 END) as lost_value, AVG(d.probability) as avg_probability, AVG(EXTRACT(EPOCH FROM (COALESCE(d.actual_close_date::timestamptz, NOW()) - d.created_at)) / 86400) as avg_deal_cycle_days, DATE_TRUNC('month', d.created_at) as period_month FROM public.crm_deals d GROUP BY d.organization_id, d.stage, d.owner_id, DATE_TRUNC('month', d.created_at);
CREATE UNIQUE INDEX idx_analytics_deal_metrics ON public.analytics_deal_metrics(organization_id, stage, COALESCE(owner_id, '00000000-0000-0000-0000-000000000000'::uuid), period_month);
CREATE MATERIALIZED VIEW public.analytics_client_metrics AS SELECT c.organization_id, c.lifecycle_stage, c.client_type, c.source, c.assigned_to, COUNT(*) as client_count, SUM(c.total_revenue) as total_revenue, AVG(c.total_revenue) as avg_revenue_per_client, AVG(c.total_orders) as avg_orders_per_client, AVG(c.average_order_value) as avg_order_value, AVG(c.lead_score) as avg_lead_score, DATE_TRUNC('month', c.created_at) as period_month FROM public.crm_clients c GROUP BY c.organization_id, c.lifecycle_stage, c.client_type, c.source, c.assigned_to, DATE_TRUNC('month', c.created_at);
CREATE UNIQUE INDEX idx_analytics_client_metrics ON public.analytics_client_metrics(organization_id, COALESCE(lifecycle_stage, 'unknown'), COALESCE(client_type, 'unknown'), COALESCE(source, 'unknown'), COALESCE(assigned_to, '00000000-0000-0000-0000-000000000000'::uuid), period_month);
CREATE MATERIALIZED VIEW public.analytics_revenue_metrics AS SELECT o.organization_id, SUM(o.total) as total_revenue, COUNT(DISTINCT o.client_id) as unique_customers, COUNT(*) as order_count, AVG(o.total) as avg_order_value, SUM(CASE WHEN o.status = 'delivered' THEN o.total ELSE 0 END) as delivered_revenue, SUM(CASE WHEN o.status = 'cancelled' OR o.status = 'refunded' THEN o.total ELSE 0 END) as lost_revenue, DATE_TRUNC('day', o.order_date) as period_day, DATE_TRUNC('week', o.order_date) as period_week, DATE_TRUNC('month', o.order_date) as period_month, DATE_TRUNC('year', o.order_date) as period_year FROM public.crm_orders o GROUP BY o.organization_id, DATE_TRUNC('day', o.order_date), DATE_TRUNC('week', o.order_date), DATE_TRUNC('month', o.order_date), DATE_TRUNC('year', o.order_date);
CREATE UNIQUE INDEX idx_analytics_revenue_metrics ON public.analytics_revenue_metrics(organization_id, period_day);
CREATE MATERIALIZED VIEW public.analytics_chatbot_effectiveness AS SELECT a.organization_id, COUNT(DISTINCT a.client_id) as unique_clients_engaged, COUNT(*) as total_chatbot_interactions, COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.client_id END) as successful_interactions, AVG(EXTRACT(EPOCH FROM (a.completed_at - a.created_at)) / 60) as avg_interaction_duration_minutes, DATE_TRUNC('day', a.created_at) as period_day FROM public.crm_activities a WHERE a.activity_type = 'chatbot_interaction' GROUP BY a.organization_id, DATE_TRUNC('day', a.created_at);
CREATE UNIQUE INDEX idx_analytics_chatbot_effectiveness ON public.analytics_chatbot_effectiveness(organization_id, period_day);

-- IMPROVEMENT: Simplified analytics_channel_performance view
CREATE MATERIALIZED VIEW public.analytics_channel_performance AS
SELECT
  ch.organization_id,
  ch.id as channel_id,
  ch.name as channel_name,
  ch.platform,
  COUNT(DISTINCT c.id) as total_contacts,
  COUNT(m.id) as total_messages, -- Simplified to total messages
  COUNT(m.id) FILTER (WHERE m.sender_type = 'user') as incoming_messages,
  COUNT(m.id) FILTER (WHERE m.sender_type = 'agent') as agent_responses,
  COUNT(m.id) FILTER (WHERE m.sender_type = 'ai') as ai_responses,
  DATE_TRUNC('month', m.sent_at) as period_month
FROM public.channels ch
LEFT JOIN public.contacts c ON c.channel_id = ch.id
LEFT JOIN public.messages m ON m.channel_id = ch.id
GROUP BY ch.organization_id, ch.id, ch.name, ch.platform, DATE_TRUNC('month', m.sent_at);

CREATE UNIQUE INDEX idx_analytics_channel_performance ON public.analytics_channel_performance(
  organization_id,
  channel_id,
  COALESCE(period_month, '1970-01-01'::timestamptz)
);

-- ====================================================================
-- SECTION 3: ANALYTICAL & HELPER FUNCTIONS
-- ====================================================================

-- (Functions calculate_client_ltv, calculate_win_rate, refresh_all_analytics are perfect. No changes needed.)
CREATE OR REPLACE FUNCTION public.calculate_client_ltv(client_uuid UUID) RETURNS NUMERIC AS $$ DECLARE ltv NUMERIC; BEGIN SELECT COALESCE(SUM(total), 0) INTO ltv FROM public.crm_orders WHERE client_id = client_uuid AND status NOT IN ('cancelled', 'refunded'); RETURN ltv; END; $$ LANGUAGE plpgsql STABLE;
CREATE OR REPLACE FUNCTION public.calculate_win_rate(org_id UUID, start_date TIMESTAMPTZ DEFAULT NULL, end_date TIMESTAMPTZ DEFAULT NULL) RETURNS NUMERIC AS $$ DECLARE win_rate NUMERIC; BEGIN SELECT CASE WHEN COUNT(*) = 0 THEN 0 ELSE (COUNT(*) FILTER (WHERE stage = 'closed_won')::NUMERIC / COUNT(*)::NUMERIC) * 100 END INTO win_rate FROM public.crm_deals WHERE organization_id = org_id AND stage IN ('closed_won', 'closed_lost') AND (start_date IS NULL OR created_at >= start_date) AND (end_date IS NULL OR created_at <= end_date); RETURN ROUND(win_rate, 2); END; $$ LANGUAGE plpgsql STABLE;
CREATE OR REPLACE FUNCTION public.refresh_all_analytics() RETURNS void AS $$ BEGIN REFRESH MATERIALIZED VIEW CONCURRENTLY public.analytics_deal_metrics; REFRESH MATERIALIZED VIEW CONCURRENTLY public.analytics_client_metrics; REFRESH MATERIALIZED VIEW CONCURRENTLY public.analytics_revenue_metrics; REFRESH MATERIALIZED VIEW CONCURRENTLY public.analytics_channel_performance; REFRESH MATERIALIZED VIEW CONCURRENTLY public.analytics_chatbot_effectiveness; END; $$ LANGUAGE plpgsql;

-- IMPROVEMENT: Hardening SECURITY DEFINER functions to remove security warnings.
CREATE OR REPLACE FUNCTION public.get_crm_dashboard_summary(org_id UUID) RETURNS TABLE (total_clients BIGINT, total_customers BIGINT, total_leads BIGINT, total_deals BIGINT, open_deals_value NUMERIC, closed_won_deals BIGINT, total_revenue NUMERIC, avg_order_value NUMERIC, pending_activities BIGINT) AS $$ BEGIN RETURN QUERY SELECT (SELECT COUNT(*) FROM public.crm_clients WHERE organization_id = org_id), (SELECT COUNT(*) FROM public.crm_clients WHERE organization_id = org_id AND client_type = 'customer'), (SELECT COUNT(*) FROM public.crm_clients WHERE organization_id = org_id AND client_type = 'lead'), (SELECT COUNT(*) FROM public.crm_deals WHERE organization_id = org_id), (SELECT COALESCE(SUM(deal_value), 0) FROM public.crm_deals WHERE organization_id = org_id AND stage NOT IN ('closed_won', 'closed_lost')), (SELECT COUNT(*) FROM public.crm_deals WHERE organization_id = org_id AND stage = 'closed_won'), (SELECT COALESCE(SUM(total), 0) FROM public.crm_orders WHERE organization_id = org_id AND status NOT IN ('cancelled', 'refunded')), (SELECT COALESCE(AVG(total), 0) FROM public.crm_orders WHERE organization_id = org_id AND status NOT IN ('cancelled', 'refunded')), (SELECT COUNT(*) FROM public.crm_activities WHERE organization_id = org_id AND status = 'pending'); END; $$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';
CREATE OR REPLACE FUNCTION public.get_conversion_funnel(org_id UUID) RETURNS TABLE (lifecycle_stage TEXT, count BIGINT, percentage NUMERIC) AS $$ BEGIN RETURN QUERY SELECT c.lifecycle_stage, COUNT(*) as count, ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage FROM public.crm_clients c WHERE c.organization_id = org_id GROUP BY c.lifecycle_stage ORDER BY CASE c.lifecycle_stage WHEN 'lead' THEN 1 WHEN 'mql' THEN 2 WHEN 'sql' THEN 3 WHEN 'opportunity' THEN 4 WHEN 'customer' THEN 5 WHEN 'evangelist' THEN 6 WHEN 'churned' THEN 7 END; END; $$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

-- ====================================================================
-- SECTION 4: TRIGGERS & AUTOMATION
-- ====================================================================

-- (All your original triggers are excellent and well-written. No changes needed.)
CREATE OR REPLACE FUNCTION public.update_client_revenue() RETURNS TRIGGER AS $$ BEGIN UPDATE public.crm_clients SET total_orders = (SELECT COUNT(*) FROM public.crm_orders WHERE client_id = NEW.client_id AND status NOT IN ('cancelled', 'refunded')), total_revenue = (SELECT COALESCE(SUM(total), 0) FROM public.crm_orders WHERE client_id = NEW.client_id AND status NOT IN ('cancelled', 'refunded')), average_order_value = (SELECT COALESCE(AVG(total), 0) FROM public.crm_orders WHERE client_id = NEW.client_id AND status NOT IN ('cancelled', 'refunded')), last_contact_date = NOW(), updated_at = NOW() WHERE id = NEW.client_id; RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_update_client_revenue AFTER INSERT OR UPDATE ON public.crm_orders FOR EACH ROW EXECUTE FUNCTION public.update_client_revenue();
CREATE OR REPLACE FUNCTION public.track_deal_stage_change() RETURNS TRIGGER AS $$ BEGIN IF OLD.stage IS DISTINCT FROM NEW.stage THEN INSERT INTO public.crm_deal_stages_history (organization_id, deal_id, from_stage, to_stage, changed_by) VALUES (NEW.organization_id, NEW.id, OLD.stage, NEW.stage, auth.uid()); NEW.stage_changed_at = NOW(); END IF; NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_track_deal_stage_change BEFORE UPDATE ON public.crm_deals FOR EACH ROW EXECUTE FUNCTION public.track_deal_stage_change();
CREATE OR REPLACE FUNCTION public.create_activity_from_message() RETURNS TRIGGER AS $$ DECLARE client_record UUID; BEGIN SELECT id INTO client_record FROM public.crm_clients WHERE contact_id = NEW.contact_id LIMIT 1; IF client_record IS NOT NULL THEN INSERT INTO public.crm_activities (organization_id, client_id, message_id, activity_type, subject, description, status, created_by) VALUES (NEW.organization_id, client_record, NEW.id, CASE WHEN NEW.sender_type = 'ai' THEN 'chatbot_interaction' ELSE 'email' END, 'Message from ' || (SELECT platform FROM public.channels WHERE id = NEW.channel_id), LEFT(NEW.text_content, 500), 'completed', auth.uid()); END IF; RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_create_activity_from_message AFTER INSERT ON public.messages FOR EACH ROW WHEN (NEW.sender_type IN ('user', 'ai')) EXECUTE FUNCTION public.create_activity_from_message();
CREATE OR REPLACE FUNCTION public.update_last_contact() RETURNS TRIGGER AS $$ BEGIN UPDATE public.crm_clients SET last_contact_date = NEW.created_at WHERE id = NEW.client_id; RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_update_last_contact AFTER INSERT ON public.crm_activities FOR EACH ROW WHEN (NEW.client_id IS NOT NULL) EXECUTE FUNCTION public.update_last_contact();
CREATE OR REPLACE FUNCTION public.update_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_crm_clients_updated_at BEFORE UPDATE ON public.crm_clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trigger_crm_products_updated_at BEFORE UPDATE ON public.crm_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trigger_crm_orders_updated_at BEFORE UPDATE ON public.crm_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trigger_crm_activities_updated_at BEFORE UPDATE ON public.crm_activities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trigger_crm_notes_updated_at BEFORE UPDATE ON public.crm_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ====================================================================
-- SECTION 5: ROW-LEVEL SECURITY (RLS)
-- ====================================================================

ALTER TABLE public.crm_clients ENABLE ROW LEVEL SECURITY; ALTER TABLE public.crm_deals ENABLE ROW LEVEL SECURITY; ALTER TABLE public.crm_deal_stages_history ENABLE ROW LEVEL SECURITY; ALTER TABLE public.crm_products ENABLE ROW LEVEL SECURITY; ALTER TABLE public.crm_orders ENABLE ROW LEVEL SECURITY; ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY; ALTER TABLE public.crm_notes ENABLE ROW LEVEL SECURITY; ALTER TABLE public.crm_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage CRM clients in their organization" ON public.crm_clients FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());
CREATE POLICY "Users can manage deals in their organization" ON public.crm_deals FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());
CREATE POLICY "Users can view deal history in their organization" ON public.crm_deal_stages_history FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());
CREATE POLICY "Users can manage products in their organization" ON public.crm_products FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());
CREATE POLICY "Users can manage orders in their organization" ON public.crm_orders FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());
CREATE POLICY "Users can manage activities in their organization" ON public.crm_activities FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());
CREATE POLICY "Users can manage notes in their organization" ON public.crm_notes FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());
CREATE POLICY "Users can manage tags in their organization" ON public.crm_tags FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());

-- ====================================================================
-- INSTALLATION COMPLETE
-- ====================================================================










-- ====================================================================
--          CRM FUNCTION HARDENING SCRIPT
-- This script fixes the "Function Search Path Mutable" warnings for
-- all new CRM and Analytics functions by setting a secure, empty search_path.
-- ====================================================================

-- Harden all SECURITY DEFINER functions
ALTER FUNCTION public.get_crm_dashboard_summary(uuid) SET search_path = '';
ALTER FUNCTION public.get_conversion_funnel(uuid) SET search_path = '';

-- Harden all other functions to clear all warnings from the linter
-- Even though these are not all SECURITY DEFINER, setting the path is best practice.
ALTER FUNCTION public.create_activity_from_message() SET search_path = '';
ALTER FUNCTION public.update_last_contact() SET search_path = '';
ALTER FUNCTION public.update_updated_at() SET search_path = '';
ALTER FUNCTION public.calculate_client_ltv(uuid) SET search_path = '';
ALTER FUNCTION public.calculate_win_rate(uuid, timestamptz, timestamptz) SET search_path = '';
ALTER FUNCTION public.refresh_all_analytics() SET search_path = '';
ALTER FUNCTION public.update_client_revenue() SET search_path = '';
ALTER FUNCTION public.track_deal_stage_change() SET search_path = '';

-- ======================= END OF SCRIPT =======================











-- ====================================================================
--          AUTOMATIC CRM CLIENT CREATION SCRIPT
-- This script adds a trigger to automatically create a crm_clients
-- record whenever a new contact is created.
-- ====================================================================

-- Step 1: Create the function that will be executed by the trigger.
-- It runs with SECURITY DEFINER to ensure it has the necessary permissions.

CREATE OR REPLACE FUNCTION public.create_client_on_new_contact()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = '' -- Hardened for security
AS $$
BEGIN
  -- Insert a new record into crm_clients, using data from the new contact.
  INSERT INTO public.crm_clients (
    organization_id,
    contact_id,
    -- THIS IS THE NEW LINE --
    company_name, 
    email,
    phone,
    source,
    first_contact_date
  )
  VALUES (
    NEW.organization_id,
    NEW.id,
    -- THIS IS THE NEW LINE --
    NEW.name, -- Use the contact's name as the default company name.
    CASE WHEN NEW.name ~* '^[A-Za-z0-9._+%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$' THEN NEW.name ELSE NULL END,
    NEW.platform_user_id,
    NEW.platform,
    NOW()
  );
  RETURN NEW;
END;
$$;

-- Step 2: Create the trigger on the 'contacts' table.
-- This tells the database to run our function AFTER a new row is INSERTED.

-- First, drop the trigger if it already exists to ensure a clean setup.
DROP TRIGGER IF EXISTS on_new_contact_create_client ON public.contacts;

-- Then, create the new trigger.
CREATE TRIGGER on_new_contact_create_client
  AFTER INSERT ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.create_client_on_new_contact();

-- ======================= END OF SCRIPT =======================








-- ====================================================================
--          DATABASE RELATIONSHIP HARDENING SCRIPT
-- This script ensures the foreign key relationship from crm_clients
-- to contacts is correctly defined.
-- ====================================================================

-- First, give the existing constraint a predictable name by dropping it if it exists.
-- This prevents errors if you run the script multiple times.
-- Note: Replace 'crm_clients_contact_id_fkey' with the actual name of your
-- foreign key constraint if you know it, otherwise this might show an error
-- which is safe to ignore if the next command succeeds.
ALTER TABLE public.crm_clients
DROP CONSTRAINT IF EXISTS crm_clients_contact_id_fkey;

-- Now, add the foreign key constraint with a specific name.
-- This is what the Supabase UI does behind the scenes.
ALTER TABLE public.crm_clients
ADD CONSTRAINT crm_clients_contact_id_fkey
FOREIGN KEY (contact_id)
REFERENCES public.contacts (id)
ON DELETE SET NULL; -- This part is optional but good practice: if a contact is deleted, just set the contact_id in crm_clients to NULL.

-- ======================= END OF SCRIPT =======================
















-- ====================================================================
--          CRM ROW-LEVEL SECURITY (RLS) RE-APPLICATION SCRIPT
-- This script ensures RLS is enabled and correctly configured for all
-- CRM-related tables.
-- ====================================================================

-- Step 1: Enable RLS on all CRM tables
ALTER TABLE public.crm_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_deal_stages_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_tags ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop any existing policies to ensure a clean slate
DROP POLICY IF EXISTS "Users can manage CRM clients in their organization" ON public.crm_clients;
DROP POLICY IF EXISTS "Users can manage deals in their organization" ON public.crm_deals;
DROP POLICY IF EXISTS "Users can view deal history in their organization" ON public.crm_deal_stages_history;
DROP POLICY IF EXISTS "Users can manage products in their organization" ON public.crm_products;
DROP POLICY IF EXISTS "Users can manage orders in their organization" ON public.crm_orders;
DROP POLICY IF EXISTS "Users can manage activities in their organization" ON public.crm_activities;
DROP POLICY IF EXISTS "Users can manage notes in their organization" ON public.crm_notes;
DROP POLICY IF EXISTS "Users can manage tags in their organization" ON public.crm_tags;

-- Step 3: Create the definitive policies
-- This policy allows users to access data if the organization_id matches their own.
-- The get_my_organization_id() function is defined in your main setup script.
CREATE POLICY "Users can manage CRM clients in their organization" ON public.crm_clients
  FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());

CREATE POLICY "Users can manage deals in their organization" ON public.crm_deals
  FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());

CREATE POLICY "Users can view deal history in their organization" ON public.crm_deal_stages_history
  FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());

CREATE POLICY "Users can manage products in their organization" ON public.crm_products
  FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());

CREATE POLICY "Users can manage orders in their organization" ON public.crm_orders
  FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());

CREATE POLICY "Users can manage activities in their organization" ON public.crm_activities
  FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());

CREATE POLICY "Users can manage notes in their organization" ON public.crm_notes
  FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());

CREATE POLICY "Users can manage tags in their organization" ON public.crm_tags
  FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());

-- ======================= END OF SCRIPT =======================




















-- ====================================================================
--          GET CONTACTS WITH CLIENTS (RPC FUNCTION)
-- This function replaces the front-end query to definitively solve
-- the RLS join issue. It runs with the permissions of the user.
-- ====================================================================

CREATE OR REPLACE FUNCTION get_contacts_for_channel(p_channel_id UUID, p_search_term TEXT DEFAULT '')
RETURNS TABLE (
  -- Re-define the full 'contacts' table structure here
  id UUID,
  organization_id UUID,
  channel_id UUID,
  platform TEXT,
  platform_user_id TEXT,
  name TEXT,
  avatar_url TEXT,
  ai_enabled BOOLEAN,
  last_interaction_at TIMESTAMPTZ,
  last_message_preview TEXT,
  unread_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  -- And add the crm_client_id we need
  crm_client_id UUID
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.organization_id,
    c.channel_id,
    c.platform,
    c.platform_user_id,
    c.name,
    c.avatar_url,
    c.ai_enabled,
    c.last_interaction_at,
    c.last_message_preview,
    c.unread_count,
    c.created_at,
    c.updated_at,
    -- Perform an explicit LEFT JOIN to get the client ID
    cc.id AS crm_client_id
  FROM
    public.contacts AS c
  LEFT JOIN
    public.crm_clients AS cc ON c.id = cc.contact_id
  WHERE
    c.channel_id = p_channel_id
    AND (
      p_search_term = '' OR
      c.name ILIKE '%' || p_search_term || '%' OR
      c.platform_user_id ILIKE '%' || p_search_term || '%'
    )
  ORDER BY
    c.unread_count DESC,
    c.last_interaction_at DESC
  LIMIT 100;
END;
$$;









-- ====================================================================
--          ADD PLATFORM ID TO CRM CLIENTS TABLE SCRIPT
-- ====================================================================

ALTER TABLE public.crm_clients
ADD COLUMN platform_user_id TEXT;

-- Optional: Add an index for faster lookups on this new column
CREATE INDEX idx_crm_clients_platform_user_id ON public.crm_clients(platform_user_id);

-- ======================= END OF SCRIPT =======================








-- ====================================================================
--          UPDATE CRM CLIENT CREATION TRIGGER (V3)
-- ====================================================================

CREATE OR REPLACE FUNCTION public.create_client_on_new_contact()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.crm_clients (
    organization_id,
    contact_id,
    company_name,
    email,
    -- phone, -- We no longer set the phone number by default
    platform_user_id, -- This is the new field we are populating
    source,
    first_contact_date
  )
  VALUES (
    NEW.organization_id,
    NEW.id,
    NEW.name,
    CASE WHEN NEW.name ~* '^[A-Za-z0-9._+%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$' THEN NEW.name ELSE NULL END,
    -- NEW.platform_user_id, -- Old logic removed
    NEW.platform_user_id, -- New logic added
    NEW.platform,
    NOW()
  );
  RETURN NEW;
END;
$$;








-- ====================================================================
--          FIX CRM ACTIVITY TRIGGER (V3 - DEFINITIVE)
-- This script corrects the trigger to ONLY log messages from the AI
-- as a 'chatbot_interaction' activity. It will ignore user messages.
-- ====================================================================

CREATE OR REPLACE FUNCTION public.create_activity_from_message()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  client_record_id UUID;
BEGIN
  -- Find the crm_client associated with the message's contact
  SELECT id INTO client_record_id FROM public.crm_clients WHERE contact_id = NEW.contact_id LIMIT 1;

  -- Only proceed if a client record was found
  IF client_record_id IS NOT NULL THEN
    INSERT INTO public.crm_activities (
      organization_id,
      client_id,
      message_id,
      activity_type,
      subject,
      description,
      status,
      created_by
    ) VALUES (
      NEW.organization_id,
      client_record_id,
      NEW.id,
      'chatbot_interaction',
      'AI Message on ' || (SELECT platform FROM public.channels WHERE id = NEW.channel_id),
      LEFT(NEW.text_content, 500),
      'completed',
      auth.uid()
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Now, modify the TRIGGER itself to have a WHEN clause.
-- This is the most efficient way to handle this.

-- Drop the old trigger
DROP TRIGGER IF EXISTS trigger_create_activity_from_message ON public.messages;

-- Create the new, smarter trigger
CREATE TRIGGER trigger_create_activity_from_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  -- THIS IS THE CRITICAL CHANGE: Only run the function if the sender is 'ai'
  WHEN (NEW.sender_type = 'ai')
  EXECUTE FUNCTION public.create_activity_from_message();

-- ======================= END OF SCRIPT =======================






-- ====================================================================
--          DISABLE AUTOMATIC ACTIVITY CREATION SCRIPT
-- This script disables the trigger that automatically logs AI
-- messages to the crm_activities table.
-- ====================================================================

ALTER TABLE public.messages
DISABLE TRIGGER trigger_create_activity_from_message;

-- ======================= END OF SCRIPT =======================












-- Enable pg_trgm extension for text search performance
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create indexes for text search on frequently searched columns
CREATE INDEX IF NOT EXISTS idx_contacts_name_trgm ON contacts USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_crm_clients_company_name_trgm ON crm_clients USING gin(company_name gin_trgm_ops);

-- Create indexes for common query patterns to improve performance
CREATE INDEX IF NOT EXISTS idx_messages_sent_at_contact ON messages(contact_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_activities_created_at_client ON crm_activities(client_id, created_at DESC);








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













-- ====================================================================
--          FIX FINAL DATABASE LINTS
-- ====================================================================

-- 1. Fix "Extension in Public" for pg_trgm
-- If pg_trgm was installed in 'public', this moves it to 'extensions'.
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

-- 2. Fix "Function Search Path Mutable" for create_activity_from_message
-- This function is a trigger function.
ALTER FUNCTION public.create_activity_from_message() SET search_path = '';

-- 3. Fix "Function Search Path Mutable" for get_contacts_for_channel
-- This function takes (UUID, TEXT).
ALTER FUNCTION public.get_contacts_for_channel(UUID, TEXT) SET search_path = '';

-- 4. Verify
DO $$
BEGIN
    RAISE NOTICE 'Moved pg_trgm to extensions and hardened function search paths.';
END $$;







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
