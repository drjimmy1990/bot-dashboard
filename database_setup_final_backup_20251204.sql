-- ====================================================================
--          DEFINITIVE MASTER SCHEMA (FINAL INTEGRATED VERSION)
--          Includes: Core, CRM, Analytics, Automation, RLS, & Permissions
-- ====================================================================

-- ====================================================================
-- SECTION 1: EXTENSIONS
-- ====================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA extensions;

-- ====================================================================
-- SECTION 2: CORE TABLES & AUTH
-- ====================================================================

-- 1. Organizations
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 2. Profiles (Linked to auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'admin'
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Channels
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
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

-- 4. Contacts
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
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- 5. Messages
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
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 6. AI & Configuration Tables
CREATE TABLE public.channel_configurations (
    channel_id UUID PRIMARY KEY REFERENCES public.channels(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    ai_model TEXT NOT NULL DEFAULT 'models/gemini-1.5-flash',
    ai_temperature NUMERIC(2, 1) NOT NULL DEFAULT 0.7,
    is_bot_active BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.channel_configurations ENABLE ROW LEVEL SECURITY;

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
ALTER TABLE public.agent_prompts ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.content_collections (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
    collection_id TEXT NOT NULL,
    name TEXT NOT NULL,
    items TEXT[],
    UNIQUE(channel_id, collection_id)
);
ALTER TABLE public.content_collections ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.keyword_actions (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    action_type TEXT NOT NULL,
    UNIQUE(channel_id, keyword)
);
ALTER TABLE public.keyword_actions ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- SECTION 3: CRM CORE TABLES
-- ====================================================================

-- 1. CRM Clients
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
  platform_user_id TEXT, -- Added specifically for V3 logic
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
ALTER TABLE public.crm_clients ENABLE ROW LEVEL SECURITY;

-- 2. CRM Deals
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
ALTER TABLE public.crm_deals ENABLE ROW LEVEL SECURITY;

-- 3. CRM Deal History
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
ALTER TABLE public.crm_deal_stages_history ENABLE ROW LEVEL SECURITY;

-- 4. CRM Products
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
ALTER TABLE public.crm_products ENABLE ROW LEVEL SECURITY;

-- 5. CRM Orders
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
ALTER TABLE public.crm_orders ENABLE ROW LEVEL SECURITY;

-- 6. CRM Activities
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
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;

-- 7. CRM Notes
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
ALTER TABLE public.crm_notes ENABLE ROW LEVEL SECURITY;

-- 8. CRM Tags
CREATE TABLE public.crm_tags (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3B82F6',
    category TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_tag_per_org UNIQUE (organization_id, name)
);
ALTER TABLE public.crm_tags ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- SECTION 4: INDEXES
-- ====================================================================

-- CRM & Contacts Indexes
CREATE INDEX idx_contacts_name_trgm ON public.contacts USING gin(name gin_trgm_ops);
CREATE INDEX idx_crm_clients_company_name_trgm ON public.crm_clients USING gin(company_name gin_trgm_ops);
CREATE INDEX idx_messages_sent_at_contact ON public.messages(contact_id, sent_at DESC);
CREATE INDEX idx_crm_activities_created_at_client ON public.crm_activities(client_id, created_at DESC);
CREATE INDEX idx_crm_clients_organization ON public.crm_clients(organization_id);
CREATE INDEX idx_crm_clients_contact ON public.crm_clients(contact_id);
CREATE INDEX idx_crm_clients_email ON public.crm_clients(email);
CREATE INDEX idx_crm_clients_platform_user_id ON public.crm_clients(platform_user_id);
CREATE INDEX idx_crm_deals_organization ON public.crm_deals(organization_id);
CREATE INDEX idx_crm_deals_stage ON public.crm_deals(stage);
CREATE INDEX idx_crm_orders_organization ON public.crm_orders(organization_id);
CREATE INDEX idx_crm_activities_organization ON public.crm_activities(organization_id);

-- ====================================================================
-- SECTION 5: FUNCTIONS (CORE, HELPERS, & ANALYTICS)
-- ====================================================================

-- 1. Get Organization ID (Helper)
CREATE OR REPLACE FUNCTION public.get_my_organization_id() 
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$ 
    SELECT organization_id FROM public.profiles WHERE id = auth.uid(); 
$$;

-- 2. Handle New User (Auth Hook)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$ 
DECLARE new_org_id UUID; 
BEGIN 
    INSERT INTO public.organizations (name) VALUES (NEW.email || '''s Organization') RETURNING id INTO new_org_id; 
    INSERT INTO public.profiles (id, organization_id) VALUES (NEW.id, new_org_id); 
    RETURN NEW; 
END; 
$$;

-- 3. Create Channel Helper
CREATE OR REPLACE FUNCTION public.create_channel_and_config(channel_name TEXT, channel_platform TEXT, platform_id TEXT) 
RETURNS JSONB LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE caller_org_id UUID; new_channel_id UUID;
BEGIN
    SELECT organization_id INTO caller_org_id FROM public.profiles WHERE id = auth.uid();
    IF caller_org_id IS NULL THEN RAISE EXCEPTION 'Could not determine organization for the current user.'; END IF;
    INSERT INTO public.channels (organization_id, name, platform, platform_channel_id) VALUES (caller_org_id, channel_name, channel_platform, platform_id) RETURNING id INTO new_channel_id;
    INSERT INTO public.channel_configurations (channel_id, organization_id) VALUES (new_channel_id, caller_org_id);
    RETURN jsonb_build_object('id', new_channel_id, 'organization_id', caller_org_id);
END;
$$;

-- 4. RPC: Get Contacts with CRM ID
CREATE OR REPLACE FUNCTION get_contacts_for_channel(p_channel_id UUID, p_search_term TEXT DEFAULT '')
RETURNS TABLE (
  id UUID, organization_id UUID, channel_id UUID, platform TEXT, platform_user_id TEXT, name TEXT, avatar_url TEXT, ai_enabled BOOLEAN, last_interaction_at TIMESTAMPTZ, last_message_preview TEXT, unread_count INTEGER, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, crm_client_id UUID
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.organization_id, c.channel_id, c.platform, c.platform_user_id, c.name, c.avatar_url, c.ai_enabled, c.last_interaction_at, c.last_message_preview, c.unread_count, c.created_at, c.updated_at, cc.id AS crm_client_id
  FROM public.contacts AS c
  LEFT JOIN public.crm_clients AS cc ON c.id = cc.contact_id
  WHERE c.channel_id = p_channel_id AND (p_search_term = '' OR c.name ILIKE '%' || p_search_term || '%' OR c.platform_user_id ILIKE '%' || p_search_term || '%')
  ORDER BY c.unread_count DESC, c.last_interaction_at DESC LIMIT 100;
END;
$$;

-- 5. CRM: Calculate LTV
CREATE OR REPLACE FUNCTION public.calculate_client_ltv(client_uuid UUID) RETURNS NUMERIC LANGUAGE plpgsql STABLE SET search_path = '' AS $$ 
DECLARE ltv NUMERIC; 
BEGIN 
    SELECT COALESCE(SUM(total), 0) INTO ltv FROM public.crm_orders WHERE client_id = client_uuid AND status NOT IN ('cancelled', 'refunded'); 
    RETURN ltv; 
END; 
$$;

-- 6. CRM: Calculate Win Rate
CREATE OR REPLACE FUNCTION public.calculate_win_rate(org_id UUID, start_date TIMESTAMPTZ DEFAULT NULL, end_date TIMESTAMPTZ DEFAULT NULL) RETURNS NUMERIC LANGUAGE plpgsql STABLE SET search_path = '' AS $$ 
DECLARE win_rate NUMERIC; 
BEGIN 
    SELECT CASE WHEN COUNT(*) = 0 THEN 0 ELSE (COUNT(*) FILTER (WHERE stage = 'closed_won')::NUMERIC / COUNT(*)::NUMERIC) * 100 END INTO win_rate FROM public.crm_deals WHERE organization_id = org_id AND stage IN ('closed_won', 'closed_lost') AND (start_date IS NULL OR created_at >= start_date) AND (end_date IS NULL OR created_at <= end_date); 
    RETURN ROUND(win_rate, 2); 
END; 
$$;

-- 7. Analytics: Refresh All Views
CREATE OR REPLACE FUNCTION public.refresh_all_analytics() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.analytics_channel_performance;
  REFRESH MATERIALIZED VIEW public.analytics_deal_metrics;
  REFRESH MATERIALIZED VIEW public.analytics_revenue_metrics;
  REFRESH MATERIALIZED VIEW public.analytics_chatbot_effectiveness;
END;
$$;

-- 8. Analytics: Dashboard Summaries & Trends
-- A. Dashboard Summary
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

-- B. Conversion Funnel
CREATE OR REPLACE FUNCTION public.get_conversion_funnel(
    org_id UUID, 
    p_channel_id UUID DEFAULT NULL,
    start_date TIMESTAMPTZ DEFAULT NULL,
    end_date TIMESTAMPTZ DEFAULT NULL
) 
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
      AND (start_date IS NULL OR c.created_at >= start_date)
      AND (end_date IS NULL OR c.created_at <= end_date)
    GROUP BY c.lifecycle_stage;
END; 
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

-- C. Revenue Trends
CREATE OR REPLACE FUNCTION public.get_revenue_trends(
    org_id UUID, 
    period_type TEXT, 
    p_channel_id UUID DEFAULT NULL,
    start_date TIMESTAMPTZ DEFAULT NULL,
    end_date TIMESTAMPTZ DEFAULT NULL
) 
RETURNS TABLE (
    date TIMESTAMPTZ, 
    revenue NUMERIC, 
    order_count BIGINT, 
    avg_order_value NUMERIC
) AS $$ 
BEGIN 
    RETURN QUERY 
    SELECT 
        DATE_TRUNC(period_type, o.order_date) as date,
        SUM(o.total) as revenue,
        COUNT(*) as order_count,
        CASE WHEN COUNT(*) > 0 THEN SUM(o.total) / COUNT(*) ELSE 0 END as avg_order_value
    FROM public.crm_orders o
    LEFT JOIN public.crm_clients c ON o.client_id = c.id
    LEFT JOIN public.contacts co ON c.contact_id = co.id
    WHERE o.organization_id = org_id
      AND o.status NOT IN ('cancelled', 'refunded')
      AND (p_channel_id IS NULL OR co.channel_id = p_channel_id)
      AND (start_date IS NULL OR o.order_date >= start_date)
      AND (end_date IS NULL OR o.order_date <= end_date)
    GROUP BY 1
    ORDER BY 1;
END; 
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

-- D. Deal Trends
CREATE OR REPLACE FUNCTION public.get_deal_trends(
    org_id UUID, 
    period_type TEXT, 
    p_channel_id UUID DEFAULT NULL,
    start_date TIMESTAMPTZ DEFAULT NULL,
    end_date TIMESTAMPTZ DEFAULT NULL
) 
RETURNS TABLE (
    date TIMESTAMPTZ, 
    new_deals_count BIGINT, 
    new_deals_value NUMERIC
) AS $$ 
BEGIN 
    RETURN QUERY 
    SELECT 
        DATE_TRUNC(period_type, d.created_at) as date,
        COUNT(*) as new_deals_count,
        COALESCE(SUM(d.deal_value), 0) as new_deals_value
    FROM public.crm_deals d
    LEFT JOIN public.crm_clients c ON d.client_id = c.id
    LEFT JOIN public.contacts co ON c.contact_id = co.id
    WHERE d.organization_id = org_id
      AND (p_channel_id IS NULL OR co.channel_id = p_channel_id)
      AND (start_date IS NULL OR d.created_at >= start_date)
      AND (end_date IS NULL OR d.created_at <= end_date)
    GROUP BY 1
    ORDER BY 1;
END; 
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

-- E. Message Volume Trends
CREATE OR REPLACE FUNCTION public.get_message_volume_trends(
    org_id UUID, 
    period_type TEXT, 
    p_channel_id UUID DEFAULT NULL,
    start_date TIMESTAMPTZ DEFAULT NULL,
    end_date TIMESTAMPTZ DEFAULT NULL
) 
RETURNS TABLE (
    date TIMESTAMPTZ, 
    total_messages BIGINT,
    ai_responses BIGINT,
    agent_responses BIGINT
) AS $$ 
BEGIN 
    RETURN QUERY 
    SELECT 
        DATE_TRUNC(period_type, m.sent_at) as date,
        COUNT(*) as total_messages,
        COUNT(*) FILTER (WHERE m.sender_type = 'ai') as ai_responses,
        COUNT(*) FILTER (WHERE m.sender_type = 'agent') as agent_responses
    FROM public.messages m
    LEFT JOIN public.contacts co ON m.contact_id = co.id
    WHERE m.organization_id = org_id
      AND (p_channel_id IS NULL OR m.channel_id = p_channel_id)
      AND (start_date IS NULL OR m.sent_at >= start_date)
      AND (end_date IS NULL OR m.sent_at <= end_date)
    GROUP BY 1
    ORDER BY 1;
END; 
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

-- F. Deal Pipeline Snapshot (Filtered)
CREATE OR REPLACE FUNCTION public.get_deal_pipeline_snapshot(
    org_id UUID, 
    p_channel_id UUID DEFAULT NULL,
    start_date TIMESTAMPTZ DEFAULT NULL,
    end_date TIMESTAMPTZ DEFAULT NULL
) 
RETURNS TABLE (
    stage TEXT, 
    count BIGINT, 
    value NUMERIC
) AS $$ 
BEGIN 
    RETURN QUERY 
    SELECT 
        d.stage,
        COUNT(*) as count,
        COALESCE(SUM(d.deal_value), 0) as value
    FROM public.crm_deals d
    LEFT JOIN public.crm_clients c ON d.client_id = c.id
    LEFT JOIN public.contacts co ON c.contact_id = co.id
    WHERE d.organization_id = org_id
      AND (p_channel_id IS NULL OR co.channel_id = p_channel_id)
      AND (start_date IS NULL OR d.created_at >= start_date)
      AND (end_date IS NULL OR d.created_at <= end_date)
    GROUP BY d.stage;
END; 
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

-- G. Channel Performance Snapshot (Filtered)
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

-- ====================================================================
-- SECTION 6: AUTOMATION & TRIGGERS
-- ====================================================================

-- 1. Contact Summary Updater (Updates preview & unread count)
CREATE OR REPLACE FUNCTION public.update_contact_summary_on_message() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_contact_id UUID;
BEGIN
    v_contact_id := COALESCE(NEW.contact_id, OLD.contact_id);
    UPDATE public.contacts SET 
        last_interaction_at = (SELECT MAX(m.sent_at) FROM public.messages m WHERE m.contact_id = v_contact_id),
        last_message_preview = (SELECT CASE WHEN sub.content_type = 'text' THEN LEFT(sub.text_content, 70) ELSE '[' || INITCAP(sub.content_type) || ']' END FROM public.messages sub WHERE sub.contact_id = v_contact_id ORDER BY sub.sent_at DESC LIMIT 1),
        unread_count = (SELECT COUNT(*) FROM public.messages m WHERE m.contact_id = v_contact_id AND m.sender_type = 'user' AND m.is_read_by_agent = FALSE)
    WHERE id = v_contact_id;
    RETURN NULL;
END;
$$;
CREATE TRIGGER messages_summary_trigger AFTER INSERT OR UPDATE OR DELETE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.update_contact_summary_on_message();

-- 2. Auth Trigger
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Auto-Create CRM Client on New Contact (V3)
CREATE OR REPLACE FUNCTION public.create_client_on_new_contact() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.crm_clients (organization_id, contact_id, company_name, email, platform_user_id, source, first_contact_date)
  VALUES (NEW.organization_id, NEW.id, NEW.name, CASE WHEN NEW.name ~* '^[A-Za-z0-9._+%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$' THEN NEW.name ELSE NULL END, NEW.platform_user_id, NEW.platform, NOW());
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_new_contact_create_client AFTER INSERT ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.create_client_on_new_contact();

-- 4. Create Activity from Message (AI Only - DISABLED BY DEFAULT)
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
-- Creating the trigger but DISABLING it immediately as requested
CREATE TRIGGER trigger_create_activity_from_message AFTER INSERT ON public.messages FOR EACH ROW WHEN (NEW.sender_type = 'ai') EXECUTE FUNCTION public.create_activity_from_message();
ALTER TABLE public.messages DISABLE TRIGGER trigger_create_activity_from_message;

-- 5. Standard Updated_At Timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at() RETURNS TRIGGER LANGUAGE plpgsql SET search_path = '' AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;
CREATE TRIGGER trigger_crm_clients_updated_at BEFORE UPDATE ON public.crm_clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trigger_crm_products_updated_at BEFORE UPDATE ON public.crm_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trigger_crm_orders_updated_at BEFORE UPDATE ON public.crm_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trigger_crm_activities_updated_at BEFORE UPDATE ON public.crm_activities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trigger_crm_notes_updated_at BEFORE UPDATE ON public.crm_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 6. CRM Logic Triggers (Revenue, Stage History, Last Contact)
CREATE OR REPLACE FUNCTION public.update_client_revenue() RETURNS TRIGGER LANGUAGE plpgsql SET search_path = '' AS $$ BEGIN UPDATE public.crm_clients SET total_orders = (SELECT COUNT(*) FROM public.crm_orders WHERE client_id = NEW.client_id AND status NOT IN ('cancelled', 'refunded')), total_revenue = (SELECT COALESCE(SUM(total), 0) FROM public.crm_orders WHERE client_id = NEW.client_id AND status NOT IN ('cancelled', 'refunded')), average_order_value = (SELECT COALESCE(AVG(total), 0) FROM public.crm_orders WHERE client_id = NEW.client_id AND status NOT IN ('cancelled', 'refunded')), last_contact_date = NOW(), updated_at = NOW() WHERE id = NEW.client_id; RETURN NEW; END; $$;
CREATE TRIGGER trigger_update_client_revenue AFTER INSERT OR UPDATE ON public.crm_orders FOR EACH ROW EXECUTE FUNCTION public.update_client_revenue();

CREATE OR REPLACE FUNCTION public.track_deal_stage_change() RETURNS TRIGGER LANGUAGE plpgsql SET search_path = '' AS $$ BEGIN IF OLD.stage IS DISTINCT FROM NEW.stage THEN INSERT INTO public.crm_deal_stages_history (organization_id, deal_id, from_stage, to_stage, changed_by) VALUES (NEW.organization_id, NEW.id, OLD.stage, NEW.stage, auth.uid()); NEW.stage_changed_at = NOW(); END IF; NEW.updated_at = NOW(); RETURN NEW; END; $$;
CREATE TRIGGER trigger_track_deal_stage_change BEFORE UPDATE ON public.crm_deals FOR EACH ROW EXECUTE FUNCTION public.track_deal_stage_change();

CREATE OR REPLACE FUNCTION public.update_last_contact() RETURNS TRIGGER LANGUAGE plpgsql SET search_path = '' AS $$ BEGIN UPDATE public.crm_clients SET last_contact_date = NEW.created_at WHERE id = NEW.client_id; RETURN NEW; END; $$;
CREATE TRIGGER trigger_update_last_contact AFTER INSERT ON public.crm_activities FOR EACH ROW WHEN (NEW.client_id IS NOT NULL) EXECUTE FUNCTION public.update_last_contact();

-- ====================================================================
-- SECTION 7: MATERIALIZED VIEWS (ANALYTICS)
-- ====================================================================

-- 1. Channel Performance (Snapshot)
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
    COUNT(m.id) FILTER (WHERE m.sender_type = 'ai') as ai_responses
FROM public.channels ch 
LEFT JOIN public.contacts c ON c.channel_id = ch.id 
LEFT JOIN public.messages m ON m.channel_id = ch.id 
GROUP BY ch.organization_id, ch.id, ch.name, ch.platform;

CREATE INDEX idx_analytics_channel_perf_org ON public.analytics_channel_performance(organization_id);

-- 2. Deal Metrics (Snapshot by Stage)
CREATE MATERIALIZED VIEW public.analytics_deal_metrics AS 
SELECT 
    d.organization_id, 
    co.channel_id,
    d.stage, 
    COUNT(*) as deal_count, 
    SUM(d.deal_value) as total_value, 
    AVG(d.deal_value) as avg_deal_size
FROM public.crm_deals d
LEFT JOIN public.crm_clients c ON d.client_id = c.id
LEFT JOIN public.contacts co ON c.contact_id = co.id
GROUP BY d.organization_id, co.channel_id, d.stage;

CREATE INDEX idx_analytics_deal_metrics_org ON public.analytics_deal_metrics(organization_id);

-- 3. Revenue Metrics (Snapshot by Day)
CREATE MATERIALIZED VIEW public.analytics_revenue_metrics AS 
SELECT 
    o.organization_id, 
    co.channel_id,
    SUM(o.total) as total_revenue, 
    COUNT(*) as order_count, 
    DATE_TRUNC('day', o.order_date) as period_day
FROM public.crm_orders o
LEFT JOIN public.crm_clients c ON o.client_id = c.id
LEFT JOIN public.contacts co ON c.contact_id = co.id
GROUP BY o.organization_id, co.channel_id, DATE_TRUNC('day', o.order_date);

CREATE INDEX idx_analytics_revenue_metrics_org ON public.analytics_revenue_metrics(organization_id);

-- 4. Chatbot Effectiveness (Snapshot)
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

CREATE INDEX idx_analytics_chatbot_effectiveness_org ON public.analytics_chatbot_effectiveness(organization_id);

-- ====================================================================
-- SECTION 8: ROW-LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Organizations & Profiles
CREATE POLICY "Users can manage their own profile" ON public.profiles FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Users can manage their own organization" ON public.organizations FOR ALL USING (id = get_my_organization_id()) WITH CHECK (id = get_my_organization_id());

-- Core Channels/Contacts/Messages
CREATE POLICY "Users can manage channels" ON public.channels FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());
CREATE POLICY "Users can manage contacts" ON public.contacts FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());
CREATE POLICY "Users can manage messages" ON public.messages FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());

-- Configurations
CREATE POLICY "Users can manage config" ON public.channel_configurations FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());
CREATE POLICY "Users can manage prompts" ON public.agent_prompts FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());
CREATE POLICY "Users can manage content" ON public.content_collections FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());
CREATE POLICY "Users can manage keywords" ON public.keyword_actions FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());

-- CRM Tables
CREATE POLICY "Users can manage CRM clients" ON public.crm_clients FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());
CREATE POLICY "Users can manage CRM deals" ON public.crm_deals FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());
CREATE POLICY "Users can manage CRM history" ON public.crm_deal_stages_history FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());
CREATE POLICY "Users can manage CRM products" ON public.crm_products FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());
CREATE POLICY "Users can manage CRM orders" ON public.crm_orders FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());
CREATE POLICY "Users can manage CRM activities" ON public.crm_activities FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());
CREATE POLICY "Users can manage CRM notes" ON public.crm_notes FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());
CREATE POLICY "Users can manage CRM tags" ON public.crm_tags FOR ALL USING (organization_id = get_my_organization_id()) WITH CHECK (organization_id = get_my_organization_id());

-- ====================================================================
-- SECTION 9: PERMISSIONS & BACKFILL
-- ====================================================================

-- 1. Grant Access
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.analytics_deal_metrics TO authenticated;
GRANT SELECT ON public.analytics_revenue_metrics TO authenticated;
GRANT SELECT ON public.analytics_channel_performance TO authenticated;
GRANT SELECT ON public.analytics_chatbot_effectiveness TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_revenue_trends(UUID, TEXT, UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_deal_trends(UUID, TEXT, UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_message_volume_trends(UUID, TEXT, UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_crm_dashboard_summary(UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_conversion_funnel(UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_deal_pipeline_snapshot(UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_channel_performance_snapshot(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_all_analytics() TO authenticated;

-- 2. CRM Backfill (Safe for existing data)
-- This ensures that if you load this on a database that already has contacts,
-- they get corresponding CRM entries.
INSERT INTO public.crm_clients (organization_id, contact_id, company_name, email, client_type, lifecycle_stage, total_revenue, last_contact_date, created_at, updated_at)
SELECT c.organization_id, c.id, c.name, NULL, 'lead', 'lead', 0, c.last_interaction_at, c.created_at, c.updated_at
FROM public.contacts c
WHERE NOT EXISTS (SELECT 1 FROM public.crm_clients cc WHERE cc.contact_id = c.id);

-- 3. Initial Analytics Refresh
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
