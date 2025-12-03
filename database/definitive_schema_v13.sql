-- ====================================================================
--          DEFINITIVE MASTER SCHEMA (V13 - FINAL CONSOLIDATED)
-- ====================================================================
-- This script contains the complete database schema for the application,
-- including Core Tables, CRM, Analytics, Functions, Triggers, RLS, and Permissions.
--
-- KEY FEATURES:
-- 1. Full CRM & Analytics Support.
-- 2. Hardened Security (RLS & SECURITY DEFINER functions).
-- 3. Optimized Indexes (including pg_trgm).
-- 4. Corrected Analytics Views (Data Mapping & Permissions).
-- 5. Disabled "Chatbot Activity" Trigger (as requested).
-- ====================================================================

-- ====================================================================
-- SECTION 1: EXTENSIONS & CORE TABLES
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- For text search performance

CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'admin'
);

CREATE TABLE public.channels (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    platform TEXT NOT NULL,
    platform_channel_id TEXT UNIQUE,
    credentials JSONB,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.contacts (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    platform_user_id TEXT NOT NULL,
    name TEXT,
    avatar_url TEXT,
    ai_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_preview TEXT,
    unread_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_contact_per_channel UNIQUE (channel_id, platform_user_id)
);

CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    message_platform_id TEXT,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'agent', 'ai', 'system')),
    content_type TEXT NOT NULL DEFAULT 'text',
    text_content TEXT,
    attachment_url TEXT,
    attachment_metadata JSONB,
    is_read_by_agent BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    platform_timestamp TIMESTAMPTZ
);

CREATE TABLE public.channel_configurations (
    channel_id UUID PRIMARY KEY REFERENCES public.channels(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    ai_model TEXT NOT NULL DEFAULT 'models/gemini-1.5-flash',
    ai_temperature NUMERIC(2, 1) NOT NULL DEFAULT 0.7,
    is_bot_active BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.agent_prompts (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    system_prompt TEXT NOT NULL,
    UNIQUE(channel_id, agent_id)
);

CREATE TABLE public.content_collections (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
    collection_id TEXT NOT NULL,
    name TEXT NOT NULL,
    items TEXT[],
    UNIQUE(channel_id, collection_id)
);

CREATE TABLE public.keyword_actions (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    action_type TEXT NOT NULL,
    UNIQUE(channel_id, keyword)
);

-- ====================================================================
-- SECTION 2: CRM TABLES
-- ====================================================================

CREATE TABLE public.crm_clients (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    contact_id UUID UNIQUE REFERENCES public.contacts(id) ON DELETE SET NULL,
    client_type TEXT NOT NULL DEFAULT 'lead' CHECK (client_type IN ('lead', 'prospect', 'customer', 'partner', 'inactive')),
    company_name TEXT,
    email TEXT,
    phone TEXT,
    secondary_phone TEXT,
    address JSONB,
    ecommerce_customer_id TEXT,
    platform_user_id TEXT, -- Added field
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

CREATE TABLE public.crm_deals (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.crm_clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    deal_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',
    stage TEXT NOT NULL DEFAULT 'prospecting' CHECK (stage IN ('prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
    probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
    expected_close_date DATE,
    actual_close_date DATE,
    products JSONB,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    lost_reason TEXT,
    lost_reason_details TEXT,
    won_reason TEXT,
    competitor TEXT,
    tags TEXT[],
    custom_fields JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    stage_changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.crm_deal_stages_history (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    deal_id UUID NOT NULL REFERENCES public.crm_deals(id) ON DELETE CASCADE,
    from_stage TEXT,
    to_stage TEXT NOT NULL,
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.crm_products (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT,
    category TEXT,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    cost NUMERIC(12, 2),
    currency TEXT NOT NULL DEFAULT 'USD',
    ecommerce_product_id TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    custom_fields JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_ecommerce_product UNIQUE (organization_id, ecommerce_product_id)
);

CREATE TABLE public.crm_orders (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.crm_clients(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES public.crm_deals(id) ON DELETE SET NULL,
    order_number TEXT NOT NULL,
    ecommerce_order_id TEXT,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
    tax NUMERIC(12, 2) DEFAULT 0,
    shipping NUMERIC(12, 2) DEFAULT 0,
    discount NUMERIC(12, 2) DEFAULT 0,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    items JSONB,
    shipping_address JSONB,
    tracking_number TEXT,
    order_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    shipped_date TIMESTAMPTZ,
    delivered_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_order_number UNIQUE (organization_id, order_number)
);

CREATE TABLE public.crm_activities (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.crm_clients(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES public.crm_deals(id) ON DELETE CASCADE,
    message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('call', 'email', 'meeting', 'task', 'note', 'chatbot_interaction', 'website_visit')),
    subject TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.crm_notes (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.crm_clients(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES public.crm_deals(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT NOT NULL,
    note_type TEXT CHECK (note_type IN ('general', 'call_log', 'meeting_summary', 'important')),
    is_pinned BOOLEAN DEFAULT FALSE,
    tags TEXT[],
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.crm_tags (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3B82F6',
    category TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_tag_per_org UNIQUE (organization_id, name)
);

-- ====================================================================
-- SECTION 3: ANALYTICS MATERIALIZED VIEWS
-- ====================================================================

CREATE MATERIALIZED VIEW public.analytics_deal_metrics AS 
SELECT d.organization_id, d.stage, d.owner_id, COUNT(*) as deal_count, SUM(d.deal_value) as total_value, AVG(d.deal_value) as avg_deal_size, SUM(CASE WHEN d.stage = 'closed_won' THEN d.deal_value ELSE 0 END) as won_value, SUM(CASE WHEN d.stage = 'closed_lost' THEN d.deal_value ELSE 0 END) as lost_value, AVG(d.probability) as avg_probability, AVG(EXTRACT(EPOCH FROM (COALESCE(d.actual_close_date::timestamptz, NOW()) - d.created_at)) / 86400) as avg_deal_cycle_days, DATE_TRUNC('month', d.created_at) as period_month 
FROM public.crm_deals d 
GROUP BY d.organization_id, d.stage, d.owner_id, DATE_TRUNC('month', d.created_at);
CREATE UNIQUE INDEX idx_analytics_deal_metrics ON public.analytics_deal_metrics(organization_id, stage, COALESCE(owner_id, '00000000-0000-0000-0000-000000000000'::uuid), period_month);

CREATE MATERIALIZED VIEW public.analytics_client_metrics AS 
SELECT c.organization_id, c.lifecycle_stage, c.client_type, c.source, c.assigned_to, COUNT(*) as client_count, SUM(c.total_revenue) as total_revenue, AVG(c.total_revenue) as avg_revenue_per_client, AVG(c.total_orders) as avg_orders_per_client, AVG(c.average_order_value) as avg_order_value, AVG(c.lead_score) as avg_lead_score, DATE_TRUNC('month', c.created_at) as period_month 
FROM public.crm_clients c 
GROUP BY c.organization_id, c.lifecycle_stage, c.client_type, c.source, c.assigned_to, DATE_TRUNC('month', c.created_at);
CREATE UNIQUE INDEX idx_analytics_client_metrics ON public.analytics_client_metrics(organization_id, COALESCE(lifecycle_stage, 'unknown'), COALESCE(client_type, 'unknown'), COALESCE(source, 'unknown'), COALESCE(assigned_to, '00000000-0000-0000-0000-000000000000'::uuid), period_month);

CREATE MATERIALIZED VIEW public.analytics_revenue_metrics AS 
SELECT o.organization_id, SUM(o.total) as total_revenue, COUNT(DISTINCT o.client_id) as unique_customers, COUNT(*) as order_count, AVG(o.total) as avg_order_value, SUM(CASE WHEN o.status = 'delivered' THEN o.total ELSE 0 END) as delivered_revenue, SUM(CASE WHEN o.status = 'cancelled' OR o.status = 'refunded' THEN o.total ELSE 0 END) as lost_revenue, DATE_TRUNC('day', o.order_date) as period_day, DATE_TRUNC('week', o.order_date) as period_week, DATE_TRUNC('month', o.order_date) as period_month, DATE_TRUNC('year', o.order_date) as period_year 
FROM public.crm_orders o 
GROUP BY o.organization_id, DATE_TRUNC('day', o.order_date), DATE_TRUNC('week', o.order_date), DATE_TRUNC('month', o.order_date), DATE_TRUNC('year', o.order_date);
CREATE UNIQUE INDEX idx_analytics_revenue_metrics ON public.analytics_revenue_metrics(organization_id, period_day);

-- UPDATED: Includes channel_id for filtering
CREATE MATERIALIZED VIEW public.analytics_chatbot_effectiveness AS
SELECT
  a.organization_id,
  m.channel_id,
  COUNT(DISTINCT a.client_id) as unique_clients_engaged,
  COUNT(*) as total_chatbot_interactions,
  COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.client_id END) as successful_interactions,
  AVG(EXTRACT(EPOCH FROM (a.completed_at - a.created_at)) / 60) as avg_interaction_duration_minutes,
  DATE_TRUNC('day', a.created_at) as period_day
FROM public.crm_activities a
LEFT JOIN public.messages m ON a.message_id = m.id
WHERE a.activity_type = 'chatbot_interaction'
GROUP BY a.organization_id, m.channel_id, DATE_TRUNC('day', a.created_at);
CREATE UNIQUE INDEX idx_analytics_chatbot_effectiveness ON public.analytics_chatbot_effectiveness(organization_id, channel_id, period_day);

-- UPDATED: Simplified Channel Performance
CREATE MATERIALIZED VIEW public.analytics_channel_performance AS
SELECT
  ch.organization_id,
  ch.id as channel_id,
  ch.name as channel_name,
  ch.platform,
  COUNT(DISTINCT c.id) as total_contacts,
  COUNT(m.id) as total_messages,
  COUNT(m.id) FILTER (WHERE m.sender_type = 'user') as incoming_messages,
  COUNT(m.id) FILTER (WHERE m.sender_type = 'agent') as agent_responses,
  COUNT(m.id) FILTER (WHERE m.sender_type = 'ai') as ai_responses,
  DATE_TRUNC('month', m.sent_at) as period_month
FROM public.channels ch
LEFT JOIN public.contacts c ON c.channel_id = ch.id
LEFT JOIN public.messages m ON m.channel_id = ch.id
GROUP BY ch.organization_id, ch.id, ch.name, ch.platform, DATE_TRUNC('month', m.sent_at);
CREATE UNIQUE INDEX idx_analytics_channel_performance ON public.analytics_channel_performance(organization_id, channel_id, COALESCE(period_month, '1970-01-01'::timestamptz));

-- ====================================================================
-- SECTION 4: FUNCTIONS & TRIGGERS
-- ====================================================================

-- Auth & Org Setup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$ DECLARE new_org_id UUID; BEGIN INSERT INTO public.organizations (name) VALUES (NEW.email || '''s Organization') RETURNING id INTO new_org_id; INSERT INTO public.profiles (id, organization_id) VALUES (NEW.id, new_org_id); RETURN NEW; END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.get_my_organization_id() RETURNS UUID LANGUAGE sql STABLE SET search_path = '' AS $$ SELECT organization_id FROM public.profiles WHERE id = auth.uid(); $$;

CREATE OR REPLACE FUNCTION public.create_channel_and_config(channel_name TEXT, channel_platform TEXT, platform_id TEXT) RETURNS JSONB LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE caller_org_id UUID; new_channel_id UUID;
BEGIN
    SELECT organization_id INTO caller_org_id FROM public.profiles WHERE id = auth.uid();
    IF caller_org_id IS NULL THEN RAISE EXCEPTION 'Could not determine organization for the current user.'; END IF;
    INSERT INTO public.channels (organization_id, name, platform, platform_channel_id) VALUES (caller_org_id, channel_name, channel_platform, platform_id) RETURNING id INTO new_channel_id;
    INSERT INTO public.channel_configurations (channel_id, organization_id) VALUES (new_channel_id, caller_org_id);
    RETURN jsonb_build_object('id', new_channel_id, 'organization_id', caller_org_id);
END;
$$;

-- Contact Summary Updates
CREATE OR REPLACE FUNCTION public.update_contact_summary_on_message() RETURNS TRIGGER AS $$
DECLARE v_contact_id UUID;
BEGIN
    v_contact_id := COALESCE(NEW.contact_id, OLD.contact_id);
    UPDATE public.contacts
    SET 
        last_interaction_at = (SELECT MAX(m.sent_at) FROM public.messages m WHERE m.contact_id = v_contact_id),
        last_message_preview = (SELECT CASE WHEN sub.content_type = 'text' THEN LEFT(sub.text_content, 70) ELSE '[' || INITCAP(sub.content_type) || ']' END FROM public.messages sub WHERE sub.contact_id = v_contact_id ORDER BY sub.sent_at DESC LIMIT 1),
        unread_count = (SELECT COUNT(*) FROM public.messages m WHERE m.contact_id = v_contact_id AND m.sender_type = 'user' AND m.is_read_by_agent = FALSE)
    WHERE id = v_contact_id;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE TRIGGER messages_summary_trigger AFTER INSERT OR UPDATE OR DELETE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.update_contact_summary_on_message();

-- CRM & Analytics Helpers
CREATE OR REPLACE FUNCTION public.calculate_client_ltv(client_uuid UUID) RETURNS NUMERIC AS $$ DECLARE ltv NUMERIC; BEGIN SELECT COALESCE(SUM(total), 0) INTO ltv FROM public.crm_orders WHERE client_id = client_uuid AND status NOT IN ('cancelled', 'refunded'); RETURN ltv; END; $$ LANGUAGE plpgsql STABLE SET search_path = '';
CREATE OR REPLACE FUNCTION public.calculate_win_rate(org_id UUID, start_date TIMESTAMPTZ DEFAULT NULL, end_date TIMESTAMPTZ DEFAULT NULL) RETURNS NUMERIC AS $$ DECLARE win_rate NUMERIC; BEGIN SELECT CASE WHEN COUNT(*) = 0 THEN 0 ELSE (COUNT(*) FILTER (WHERE stage = 'closed_won')::NUMERIC / COUNT(*)::NUMERIC) * 100 END INTO win_rate FROM public.crm_deals WHERE organization_id = org_id AND stage IN ('closed_won', 'closed_lost') AND (start_date IS NULL OR created_at >= start_date) AND (end_date IS NULL OR created_at <= end_date); RETURN ROUND(win_rate, 2); END; $$ LANGUAGE plpgsql STABLE SET search_path = '';

-- UPDATED: Security Definer for Frontend Access
CREATE OR REPLACE FUNCTION public.refresh_all_analytics() RETURNS void AS $$ BEGIN REFRESH MATERIALIZED VIEW CONCURRENTLY public.analytics_deal_metrics; REFRESH MATERIALIZED VIEW CONCURRENTLY public.analytics_client_metrics; REFRESH MATERIALIZED VIEW CONCURRENTLY public.analytics_revenue_metrics; REFRESH MATERIALIZED VIEW CONCURRENTLY public.analytics_channel_performance; REFRESH MATERIALIZED VIEW CONCURRENTLY public.analytics_chatbot_effectiveness; END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- RPCs for Dashboard
CREATE OR REPLACE FUNCTION public.get_crm_dashboard_summary(org_id UUID) RETURNS TABLE (total_clients BIGINT, total_customers BIGINT, total_leads BIGINT, total_deals BIGINT, open_deals_value NUMERIC, closed_won_deals BIGINT, total_revenue NUMERIC, avg_order_value NUMERIC, pending_activities BIGINT) AS $$ BEGIN RETURN QUERY SELECT (SELECT COUNT(*) FROM public.crm_clients WHERE organization_id = org_id), (SELECT COUNT(*) FROM public.crm_clients WHERE organization_id = org_id AND client_type = 'customer'), (SELECT COUNT(*) FROM public.crm_clients WHERE organization_id = org_id AND client_type = 'lead'), (SELECT COUNT(*) FROM public.crm_deals WHERE organization_id = org_id), (SELECT COALESCE(SUM(deal_value), 0) FROM public.crm_deals WHERE organization_id = org_id AND stage NOT IN ('closed_won', 'closed_lost')), (SELECT COUNT(*) FROM public.crm_deals WHERE organization_id = org_id AND stage = 'closed_won'), (SELECT COALESCE(SUM(total), 0) FROM public.crm_orders WHERE organization_id = org_id AND status NOT IN ('cancelled', 'refunded')), (SELECT COALESCE(AVG(total), 0) FROM public.crm_orders WHERE organization_id = org_id AND status NOT IN ('cancelled', 'refunded')), (SELECT COUNT(*) FROM public.crm_activities WHERE organization_id = org_id AND status = 'pending'); END; $$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.get_conversion_funnel(org_id UUID) RETURNS TABLE (lifecycle_stage TEXT, count BIGINT, percentage NUMERIC) AS $$ BEGIN RETURN QUERY SELECT c.lifecycle_stage, COUNT(*) as count, ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage FROM public.crm_clients c WHERE c.organization_id = org_id GROUP BY c.lifecycle_stage ORDER BY CASE c.lifecycle_stage WHEN 'lead' THEN 1 WHEN 'mql' THEN 2 WHEN 'sql' THEN 3 WHEN 'opportunity' THEN 4 WHEN 'customer' THEN 5 WHEN 'evangelist' THEN 6 WHEN 'churned' THEN 7 END; END; $$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

-- RPC for Contacts with Client ID
CREATE OR REPLACE FUNCTION get_contacts_for_channel(p_channel_id UUID, p_search_term TEXT DEFAULT '')
RETURNS TABLE (id UUID, organization_id UUID, channel_id UUID, platform TEXT, platform_user_id TEXT, name TEXT, avatar_url TEXT, ai_enabled BOOLEAN, last_interaction_at TIMESTAMPTZ, last_message_preview TEXT, unread_count INTEGER, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, crm_client_id UUID)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.organization_id, c.channel_id, c.platform, c.platform_user_id, c.name, c.avatar_url, c.ai_enabled, c.last_interaction_at, c.last_message_preview, c.unread_count, c.created_at, c.updated_at, cc.id AS crm_client_id
  FROM public.contacts AS c
  LEFT JOIN public.crm_clients AS cc ON c.id = cc.contact_id
  WHERE c.channel_id = p_channel_id AND (p_search_term = '' OR c.name ILIKE '%' || p_search_term || '%' OR c.platform_user_id ILIKE '%' || p_search_term || '%')
  ORDER BY c.unread_count DESC, c.last_interaction_at DESC LIMIT 100;
END;
$$;

-- CRM Triggers
CREATE OR REPLACE FUNCTION public.update_client_revenue() RETURNS TRIGGER AS $$ BEGIN UPDATE public.crm_clients SET total_orders = (SELECT COUNT(*) FROM public.crm_orders WHERE client_id = NEW.client_id AND status NOT IN ('cancelled', 'refunded')), total_revenue = (SELECT COALESCE(SUM(total), 0) FROM public.crm_orders WHERE client_id = NEW.client_id AND status NOT IN ('cancelled', 'refunded')), average_order_value = (SELECT COALESCE(AVG(total), 0) FROM public.crm_orders WHERE client_id = NEW.client_id AND status NOT IN ('cancelled', 'refunded')), last_contact_date = NOW(), updated_at = NOW() WHERE id = NEW.client_id; RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = '';
CREATE TRIGGER trigger_update_client_revenue AFTER INSERT OR UPDATE ON public.crm_orders FOR EACH ROW EXECUTE FUNCTION public.update_client_revenue();

CREATE OR REPLACE FUNCTION public.track_deal_stage_change() RETURNS TRIGGER AS $$ BEGIN IF OLD.stage IS DISTINCT FROM NEW.stage THEN INSERT INTO public.crm_deal_stages_history (organization_id, deal_id, from_stage, to_stage, changed_by) VALUES (NEW.organization_id, NEW.id, OLD.stage, NEW.stage, auth.uid()); NEW.stage_changed_at = NOW(); END IF; NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = '';
CREATE TRIGGER trigger_track_deal_stage_change BEFORE UPDATE ON public.crm_deals FOR EACH ROW EXECUTE FUNCTION public.track_deal_stage_change();

-- UPDATED: Create Client on New Contact (V3 with platform_user_id)
CREATE OR REPLACE FUNCTION public.create_client_on_new_contact() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.crm_clients (organization_id, contact_id, company_name, email, platform_user_id, source, first_contact_date)
  VALUES (NEW.organization_id, NEW.id, NEW.name, CASE WHEN NEW.name ~* '^[A-Za-z0-9._+%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$' THEN NEW.name ELSE NULL END, NEW.platform_user_id, NEW.platform, NOW());
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_new_contact_create_client AFTER INSERT ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.create_client_on_new_contact();

-- UPDATED: Create Activity from Message (V3 - Logic present but trigger DISABLED)
CREATE OR REPLACE FUNCTION public.create_activity_from_message() RETURNS TRIGGER LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE client_record_id UUID;
BEGIN
  SELECT id INTO client_record_id FROM public.crm_clients WHERE contact_id = NEW.contact_id LIMIT 1;
  IF client_record_id IS NOT NULL THEN
    INSERT INTO public.crm_activities (organization_id, client_id, message_id, activity_type, subject, description, status, created_by)
    VALUES (NEW.organization_id, client_record_id, NEW.id, 'chatbot_interaction', 'AI Message on ' || (SELECT platform FROM public.channels WHERE id = NEW.channel_id), LEFT(NEW.text_content, 500), 'completed', auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger created but DISABLED as requested
CREATE TRIGGER trigger_create_activity_from_message AFTER INSERT ON public.messages FOR EACH ROW WHEN (NEW.sender_type = 'ai') EXECUTE FUNCTION public.create_activity_from_message();
ALTER TABLE public.messages DISABLE TRIGGER trigger_create_activity_from_message;

CREATE OR REPLACE FUNCTION public.update_last_contact() RETURNS TRIGGER AS $$ BEGIN UPDATE public.crm_clients SET last_contact_date = NEW.created_at WHERE id = NEW.client_id; RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = '';
CREATE TRIGGER trigger_update_last_contact AFTER INSERT ON public.crm_activities FOR EACH ROW WHEN (NEW.client_id IS NOT NULL) EXECUTE FUNCTION public.update_last_contact();

CREATE OR REPLACE FUNCTION public.update_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = '';
CREATE TRIGGER trigger_crm_clients_updated_at BEFORE UPDATE ON public.crm_clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trigger_crm_products_updated_at BEFORE UPDATE ON public.crm_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trigger_crm_orders_updated_at BEFORE UPDATE ON public.crm_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trigger_crm_activities_updated_at BEFORE UPDATE ON public.crm_activities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trigger_crm_notes_updated_at BEFORE UPDATE ON public.crm_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ====================================================================
-- SECTION 5: ROW-LEVEL SECURITY (RLS)
-- ====================================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keyword_actions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.crm_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_deal_stages_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_tags ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own profile" ON public.profiles FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Users can manage their own organization" ON public.organizations FOR ALL USING (id = get_my_organization_id()) WITH CHECK (id = get_my_organization_id());
CREATE POLICY "Users can manage data in their organization" ON public.channels FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());
CREATE POLICY "Users can manage data in their organization" ON public.contacts FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());
CREATE POLICY "Users can manage data in their organization" ON public.messages FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());
CREATE POLICY "Users can manage data in their organization" ON public.channel_configurations FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());
CREATE POLICY "Users can manage data in their organization" ON public.agent_prompts FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());
CREATE POLICY "Users can manage data in their organization" ON public.content_collections FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());
CREATE POLICY "Users can manage data in their organization" ON public.keyword_actions FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());

CREATE POLICY "Users can manage CRM clients in their organization" ON public.crm_clients FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());
CREATE POLICY "Users can manage deals in their organization" ON public.crm_deals FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());
CREATE POLICY "Users can view deal history in their organization" ON public.crm_deal_stages_history FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());
CREATE POLICY "Users can manage products in their organization" ON public.crm_products FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());
CREATE POLICY "Users can manage orders in their organization" ON public.crm_orders FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());
CREATE POLICY "Users can manage activities in their organization" ON public.crm_activities FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());
CREATE POLICY "Users can manage notes in their organization" ON public.crm_notes FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());
CREATE POLICY "Users can manage tags in their organization" ON public.crm_tags FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());

-- ====================================================================
-- SECTION 6: INDEXES & PERMISSIONS
-- ====================================================================

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contacts_name_trgm ON contacts USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_crm_clients_company_name_trgm ON crm_clients USING gin(company_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at_contact ON messages(contact_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_activities_created_at_client ON crm_activities(client_id, created_at DESC);
CREATE INDEX idx_crm_clients_organization ON public.crm_clients(organization_id);
CREATE INDEX idx_crm_clients_contact ON public.crm_clients(contact_id);
CREATE INDEX idx_crm_clients_platform_user_id ON public.crm_clients(platform_user_id);
CREATE INDEX idx_crm_clients_email ON public.crm_clients(email);
CREATE INDEX idx_crm_deals_organization ON public.crm_deals(organization_id);
CREATE INDEX idx_crm_deals_stage ON public.crm_deals(stage);
CREATE INDEX idx_crm_orders_organization ON public.crm_orders(organization_id);
CREATE INDEX idx_crm_activities_organization ON public.crm_activities(organization_id);

-- Permissions (CRITICAL FOR FRONTEND ACCESS)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

GRANT SELECT ON public.analytics_deal_metrics TO authenticated;
GRANT SELECT ON public.analytics_client_metrics TO authenticated;
GRANT SELECT ON public.analytics_revenue_metrics TO authenticated;
GRANT SELECT ON public.analytics_channel_performance TO authenticated;
GRANT SELECT ON public.analytics_chatbot_effectiveness TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_crm_dashboard_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_conversion_funnel(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_all_analytics() TO authenticated;

-- ======================= END OF DEFINITIVE SCHEMA =======================
