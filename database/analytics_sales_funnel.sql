-- ====================================================================
-- SALES FUNNEL ANALYTICS + TAG APPEND HELPER
-- Run this in Supabase SQL Editor
-- ====================================================================

-- ====================================================================
-- 1. Sales Funnel Analytics RPC
-- Counts clients by stage tags for the funnel chart
-- ====================================================================
CREATE OR REPLACE FUNCTION public.get_sales_funnel_analytics(
    org_id UUID,
    p_channel_id UUID DEFAULT NULL,
    start_date TIMESTAMPTZ DEFAULT NULL,
    end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
    bmi_started BIGINT,
    bmi_completed BIGINT,
    bmi_dropped BIGINT,
    testimonials_shown BIGINT,
    testimonials_passed BIGINT,
    testimonials_dropped BIGINT,
    price_shown BIGINT,
    purchased BIGINT,
    price_dropped BIGINT
) AS $$
DECLARE
    v_bmi_started BIGINT;
    v_bmi_completed BIGINT;
    v_testimonials_shown BIGINT;
    v_testimonials_passed BIGINT;
    v_price_shown BIGINT;
    v_purchased BIGINT;
BEGIN
    -- Stage 1: BMI Collection
    SELECT COUNT(*) INTO v_bmi_started
    FROM public.crm_clients c
    LEFT JOIN public.contacts co ON c.contact_id = co.id
    WHERE c.organization_id = org_id
      AND c.tags @> ARRAY['stage:bmi_started']
      AND (p_channel_id IS NULL OR co.channel_id = p_channel_id)
      AND (start_date IS NULL OR c.created_at >= start_date)
      AND (end_date IS NULL OR c.created_at <= end_date);

    SELECT COUNT(*) INTO v_bmi_completed
    FROM public.crm_clients c
    LEFT JOIN public.contacts co ON c.contact_id = co.id
    WHERE c.organization_id = org_id
      AND c.tags @> ARRAY['stage:bmi_completed']
      AND (p_channel_id IS NULL OR co.channel_id = p_channel_id)
      AND (start_date IS NULL OR c.created_at >= start_date)
      AND (end_date IS NULL OR c.created_at <= end_date);

    -- Stage 2: Testimonials
    SELECT COUNT(*) INTO v_testimonials_shown
    FROM public.crm_clients c
    LEFT JOIN public.contacts co ON c.contact_id = co.id
    WHERE c.organization_id = org_id
      AND c.tags @> ARRAY['stage:testimonials_shown']
      AND (p_channel_id IS NULL OR co.channel_id = p_channel_id)
      AND (start_date IS NULL OR c.created_at >= start_date)
      AND (end_date IS NULL OR c.created_at <= end_date);

    SELECT COUNT(*) INTO v_testimonials_passed
    FROM public.crm_clients c
    LEFT JOIN public.contacts co ON c.contact_id = co.id
    WHERE c.organization_id = org_id
      AND c.tags @> ARRAY['stage:testimonials_passed']
      AND (p_channel_id IS NULL OR co.channel_id = p_channel_id)
      AND (start_date IS NULL OR c.created_at >= start_date)
      AND (end_date IS NULL OR c.created_at <= end_date);

    -- Stage 3: Price / Purchase
    SELECT COUNT(*) INTO v_price_shown
    FROM public.crm_clients c
    LEFT JOIN public.contacts co ON c.contact_id = co.id
    WHERE c.organization_id = org_id
      AND c.tags @> ARRAY['stage:price_shown']
      AND (p_channel_id IS NULL OR co.channel_id = p_channel_id)
      AND (start_date IS NULL OR c.created_at >= start_date)
      AND (end_date IS NULL OR c.created_at <= end_date);

    SELECT COUNT(*) INTO v_purchased
    FROM public.crm_clients c
    LEFT JOIN public.contacts co ON c.contact_id = co.id
    WHERE c.organization_id = org_id
      AND c.client_type IN ('customer', 'repeat_customer')
      AND c.tags @> ARRAY['stage:price_shown']
      AND (p_channel_id IS NULL OR co.channel_id = p_channel_id)
      AND (start_date IS NULL OR c.created_at >= start_date)
      AND (end_date IS NULL OR c.created_at <= end_date);

    RETURN QUERY SELECT
        v_bmi_started,
        v_bmi_completed,
        v_bmi_started - v_bmi_completed,          -- bmi_dropped
        v_testimonials_shown,
        v_testimonials_passed,
        v_testimonials_shown - v_testimonials_passed, -- testimonials_dropped
        v_price_shown,
        v_purchased,
        v_price_shown - v_purchased;               -- price_dropped
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

-- ====================================================================
-- 2. Append Client Tags (Atomic)
-- Used by n8n bot to add tags without overwriting existing ones
-- ====================================================================
CREATE OR REPLACE FUNCTION public.append_client_tags(
    p_contact_id UUID,
    p_new_tags TEXT[]
)
RETURNS void AS $$
BEGIN
    UPDATE public.crm_clients
    SET tags = (
        SELECT ARRAY(
            SELECT DISTINCT unnest(COALESCE(tags, '{}') || p_new_tags)
        )
    ),
    updated_at = NOW()
    WHERE contact_id = p_contact_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ====================================================================
-- 3. Update Client Custom Fields (Atomic merge)
-- Used by n8n bot to store BMI data without overwriting other fields
-- ====================================================================
CREATE OR REPLACE FUNCTION public.update_client_custom_fields(
    p_contact_id UUID,
    p_fields JSONB
)
RETURNS void AS $$
BEGIN
    UPDATE public.crm_clients
    SET custom_fields = COALESCE(custom_fields, '{}'::JSONB) || p_fields,
        updated_at = NOW()
    WHERE contact_id = p_contact_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ====================================================================
-- 4. GIN index on tags for fast @> queries (if not exists)
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_crm_clients_tags ON public.crm_clients USING GIN (tags);
