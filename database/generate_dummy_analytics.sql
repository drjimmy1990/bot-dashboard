-- ENHANCED DATA GENERATION SCRIPT
-- Usage: Replace 'YOUR_ORG_ID_HERE' with your actual Organization ID before running.

DO $$
DECLARE
    v_org_id UUID;
    v_channel_id UUID;
    v_contact_id UUID;
    v_client_id UUID;
    v_deal_id UUID;
    i INT;
    j INT;
    v_date TIMESTAMPTZ;
    v_random_days INT;
BEGIN
    -- 1. Get Organization ID (Auto-select first one)
    SELECT id INTO v_org_id FROM public.organizations LIMIT 1;

    IF v_org_id IS NULL THEN
        RAISE EXCEPTION 'No organization found. Please create one first.';
    END IF;

    RAISE NOTICE 'Generating RICH dummy data for Organization ID: %', v_org_id;

    -- 2. Create a Dummy Channel
    INSERT INTO public.channels (organization_id, name, platform, platform_channel_id, is_active)
    VALUES (v_org_id, 'Dummy Data Channel', 'whatsapp', 'dummy_whatsapp_123', TRUE)
    ON CONFLICT (platform_channel_id) DO UPDATE SET name = 'Dummy Data Channel'
    RETURNING id INTO v_channel_id;

    -- 3. Create 20 Dummy Contacts & Messages (Spread over last 30 days)
    FOR i IN 1..20 LOOP
        -- Create Contact
        INSERT INTO public.contacts (organization_id, channel_id, platform, platform_user_id, name, unread_count, last_interaction_at)
        VALUES (v_org_id, v_channel_id, 'whatsapp', 'dummy_user_' || i, 'Dummy User ' || i, 0, NOW() - (floor(random() * 30) || ' days')::interval)
        ON CONFLICT (channel_id, platform_user_id) DO UPDATE SET name = 'Dummy User ' || i
        RETURNING id INTO v_contact_id;

        -- Generate 5-15 messages per contact
        FOR j IN 1..(5 + floor(random() * 10)::int) LOOP
            v_random_days := floor(random() * 30);
            v_date := NOW() - (v_random_days || ' days')::interval;

            -- User Message
            INSERT INTO public.messages (organization_id, channel_id, contact_id, sender_type, content_type, text_content, sent_at)
            VALUES (v_org_id, v_channel_id, v_contact_id, 'user', 'text', 'User message ' || j, v_date);

            -- AI Response (80% chance)
            IF random() < 0.8 THEN
                INSERT INTO public.messages (organization_id, channel_id, contact_id, sender_type, content_type, text_content, sent_at)
                VALUES (v_org_id, v_channel_id, v_contact_id, 'ai', 'text', 'AI response ' || j, v_date + INTERVAL '1 minute');
            END IF;

            -- Agent Response (20% chance)
            IF random() < 0.2 THEN
                INSERT INTO public.messages (organization_id, channel_id, contact_id, sender_type, content_type, text_content, sent_at)
                VALUES (v_org_id, v_channel_id, v_contact_id, 'agent', 'text', 'Agent response ' || j, v_date + INTERVAL '5 minutes');
            END IF;
        END LOOP;
    END LOOP;

    -- 4. Create 15 Dummy CRM Clients & Deals (Funnel Simulation)
    FOR i IN 1..15 LOOP
        -- Create Client
        INSERT INTO public.crm_clients (organization_id, company_name, client_type, lifecycle_stage, total_revenue, email, created_at)
        VALUES (
            v_org_id, 
            'Dummy Corp ' || i, 
            CASE WHEN i % 3 = 0 THEN 'customer' ELSE 'lead' END,
            CASE WHEN i % 3 = 0 THEN 'customer' WHEN i % 3 = 1 THEN 'opportunity' ELSE 'lead' END,
            CASE WHEN i % 3 = 0 THEN i * 1000 ELSE 0 END,
            'contact' || i || '@dummy.com',
            NOW() - (floor(random() * 60) || ' days')::interval
        )
        RETURNING id INTO v_client_id;

        -- Create Deal (Various Stages)
        INSERT INTO public.crm_deals (organization_id, client_id, name, deal_value, stage, expected_close_date, created_at)
        VALUES (
            v_org_id, 
            v_client_id, 
            'Dummy Deal ' || i, 
            i * 2000, 
            CASE 
                WHEN i % 5 = 0 THEN 'closed_won' 
                WHEN i % 5 = 1 THEN 'negotiation' 
                WHEN i % 5 = 2 THEN 'proposal' 
                WHEN i % 5 = 3 THEN 'qualification' 
                ELSE 'closed_lost' 
            END,
            NOW() + INTERVAL '10 days',
            NOW() - (floor(random() * 30) || ' days')::interval
        )
        RETURNING id INTO v_deal_id;
        
        -- Create Order (Revenue for won deals)
        IF i % 5 = 0 THEN
            INSERT INTO public.crm_orders (organization_id, client_id, deal_id, order_number, total, status, order_date)
            VALUES (v_org_id, v_client_id, v_deal_id, 'ORD-DUMMY-' || i, i * 2000, 'delivered', NOW() - (floor(random() * 10) || ' days')::interval);
        END IF;
    END LOOP;

    -- 5. Refresh Analytics
    PERFORM public.refresh_all_analytics();
    
    RAISE NOTICE 'Rich dummy data generation complete!';
END $$;
