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