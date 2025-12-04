-- ====================================================================
--          ADD ADDRESS COLUMNS & TEAMS SUPPORT
-- ====================================================================

-- 1. Add Explicit Address Columns to CRM Clients
-- We keep the old 'address' JSONB column for backward compatibility for now,
-- but we add specific columns for better querying and UI mapping.
ALTER TABLE public.crm_clients
ADD COLUMN IF NOT EXISTS street TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS country TEXT;

-- 2. Create Teams Table
-- Allows grouping users into teams (e.g., "Sales", "Support").
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on Teams
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view/manage teams in their organization
CREATE POLICY "Users can manage teams in their organization" ON public.teams
    FOR ALL USING (organization_id = public.get_my_organization_id())
    WITH CHECK (organization_id = public.get_my_organization_id());

-- 3. Add Team Membership to Profiles
-- A user can belong to one team (or you could create a many-to-many table, but simple is often better).
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;

-- 4. Add Team Assignment to CRM Clients
-- Allow assigning a client to a whole team instead of (or in addition to) a specific person.
ALTER TABLE public.crm_clients
ADD COLUMN IF NOT EXISTS assigned_team UUID REFERENCES public.teams(id) ON DELETE SET NULL;

-- 5. Add Team Assignment to CRM Deals
ALTER TABLE public.crm_deals
ADD COLUMN IF NOT EXISTS assigned_team UUID REFERENCES public.teams(id) ON DELETE SET NULL;

-- 6. Helper Function to Get Team Members
CREATE OR REPLACE FUNCTION public.get_team_members(p_team_id UUID)
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    email TEXT,
    role TEXT
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.full_name,
        u.email::TEXT,
        p.role
    FROM public.profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE p.team_id = p_team_id;
END;
$$;

-- 7. Trigger to update 'updated_at' on teams
CREATE TRIGGER trigger_teams_updated_at
    BEFORE UPDATE ON public.teams
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- ====================================================================
-- INSTRUCTIONS FOR USER:
-- 1. Run this script in your Supabase SQL Editor.
-- 2. To add a "Person": Invite them via Supabase Auth. They will appear in 'profiles'.
-- 3. To add a "Team": Insert into the 'teams' table.
-- ====================================================================
