-- ====================================================================
-- GENERATE COMPREHENSIVE DUMMY DATA (FIXED - INTERVAL ERROR)
-- ====================================================================

DO $$
DECLARE
    v_org_id UUID;
    v_agent_ids UUID[];
    v_channel_web_id UUID;
    v_channel_wa_id UUID;
    v_contact_id UUID;
    v_client_id UUID;
    i INTEGER;
    
    -- Data Arrays for Realism
    v_first_names TEXT[] := ARRAY['Alice', 'Bob', 'Charlie', 'Diana', 'Evan', 'Fiona', 'George', 'Hannah', 'Ian', 'Julia', 'Kevin', 'Laura', 'Mike', 'Nina', 'Oscar', 'Paula', 'Quinn', 'Rachel', 'Steve', 'Tina'];
    v_last_names TEXT[] := ARRAY['Johnson', 'Smith', 'Brown', 'Prince', 'Wright', 'Green', 'King', 'White', 'Black', 'Roberts', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris'];
    v_companies TEXT[] := ARRAY['Acme Corp', 'Global Tech', 'Nebula Innovations', 'Quantum Systems', 'Starlight Logistics', 'Blue Ocean Inc', 'Apex Dynamics', 'Horizon Ventures', 'Zenith Solutions', 'Pioneer Enterprises'];
    v_domains TEXT[] := ARRAY['example.com', 'test-corp.com', 'demo.net', 'sample.org'];
    
    v_statuses TEXT[] := ARRAY['lead', 'mql', 'sql', 'opportunity', 'customer', 'evangelist', 'churned'];
    v_types TEXT[] := ARRAY['lead', 'prospect', 'customer', 'partner', 'inactive'];
    v_qualities TEXT[] := ARRAY['hot', 'warm', 'cold'];
    v_tags TEXT[] := ARRAY['VIP', 'High Value', 'Churn Risk', 'New Lead', 'Conference 2024', 'Partner', 'Reseller'];
    
    v_deal_stages TEXT[] := ARRAY['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
    
    -- Variables for loop
    v_name TEXT;
    v_company TEXT;
    v_email TEXT;
    v_phone TEXT;
    v_random_agent UUID;
    v_random_tag TEXT;
    v_msg_time TIMESTAMPTZ; -- Variable for consistent message timing
BEGIN
    -- 1. Get or Create Organization
    SELECT organization_id INTO v_org_id FROM public.profiles LIMIT 1;
    IF v_org_id IS NULL THEN
        INSERT INTO public.organizations (name) VALUES ('Demo Organization') RETURNING id INTO v_org_id;
    END IF;

    -- 2. Create Dummy Agents (Profiles)
    SELECT array_agg(id) INTO v_agent_ids FROM public.profiles WHERE organization_id = v_org_id;
    
    IF array_length(v_agent_ids, 1) IS NULL THEN
         INSERT INTO public.profiles (id, organization_id, full_name, role)
         VALUES (extensions.uuid_generate_v4(), v_org_id, 'Sarah Connor', 'admin')
         RETURNING id INTO v_random_agent;
         v_agent_ids := array_append(v_agent_ids, v_random_agent);
         
         INSERT INTO public.profiles (id, organization_id, full_name, role)
         VALUES (extensions.uuid_generate_v4(), v_org_id, 'John Wick', 'agent')
         RETURNING id INTO v_random_agent;
         v_agent_ids := array_append(v_agent_ids, v_random_agent);
    END IF;

    -- 3. Create Dummy Tags
    FOREACH v_random_tag IN ARRAY v_tags
    LOOP
        INSERT INTO public.crm_tags (organization_id, name, color)
        VALUES (v_org_id, v_random_tag, '#' || to_hex(floor(random()*16777215)::integer))
        ON CONFLICT (organization_id, name) DO NOTHING;
    END LOOP;

    -- 4. Create Dummy Channels
    INSERT INTO public.channels (organization_id, name, platform, platform_channel_id)
    VALUES (v_org_id, 'Website Widget (Test)', 'web', 'web_test_001')
    ON CONFLICT DO NOTHING RETURNING id INTO v_channel_web_id;
    
    INSERT INTO public.channels (organization_id, name, platform, platform_channel_id)
    VALUES (v_org_id, 'WhatsApp Support (Test)', 'whatsapp', 'wa_test_001')
    ON CONFLICT DO NOTHING RETURNING id INTO v_channel_wa_id;

    IF v_channel_web_id IS NULL THEN SELECT id INTO v_channel_web_id FROM public.channels WHERE platform='web' LIMIT 1; END IF;
    IF v_channel_wa_id IS NULL THEN SELECT id INTO v_channel_wa_id FROM public.channels WHERE platform='whatsapp' LIMIT 1; END IF;

    -- 5. Generate 50 Comprehensive Clients
    FOR i IN 1..50 LOOP
        -- Generate Random Data
        v_name := v_first_names[1 + floor(random() * array_length(v_first_names, 1))] || ' ' || v_last_names[1 + floor(random() * array_length(v_last_names, 1))];
        v_company := v_companies[1 + floor(random() * array_length(v_companies, 1))];
        v_email := lower(replace(v_name, ' ', '.')) || i || '@' || v_domains[1 + floor(random() * array_length(v_domains, 1))];
        v_phone := '+1555' || floor(random() * 8999999 + 1000000);
        v_random_agent := v_agent_ids[1 + floor(random() * array_length(v_agent_ids, 1))];

        -- Create Contact
        INSERT INTO public.contacts (organization_id, channel_id, platform, platform_user_id, name, last_interaction_at)
        VALUES (
            v_org_id, 
            CASE WHEN random() > 0.5 THEN v_channel_web_id ELSE v_channel_wa_id END, 
            CASE WHEN random() > 0.5 THEN 'web' ELSE 'whatsapp' END, 
            'user_' || i || '_test', 
            v_name,
            NOW() - (random() * 30 * '1 day'::INTERVAL)
        )
        RETURNING id INTO v_contact_id;

        -- Retrieve and Update Client (Trigger handles creation)
        SELECT id INTO v_client_id FROM public.crm_clients WHERE contact_id = v_contact_id;
        
        UPDATE public.crm_clients
        SET
            company_name = CASE WHEN random() > 0.3 THEN v_company ELSE v_name END,
            email = v_email,
            phone = v_phone,
            client_type = v_types[1 + floor(random() * array_length(v_types, 1))],
            lifecycle_stage = v_statuses[1 + floor(random() * array_length(v_statuses, 1))],
            lead_quality = v_qualities[1 + floor(random() * array_length(v_qualities, 1))],
            assigned_to = v_random_agent,
            tags = ARRAY[v_tags[1 + floor(random() * array_length(v_tags, 1))], v_tags[1 + floor(random() * array_length(v_tags, 1))]],
            platform_user_id = 'user_' || i || '_test',
            created_at = NOW() - (random() * 90 * '1 day'::INTERVAL),
            last_contact_date = NOW() - (random() * 30 * '1 day'::INTERVAL)
        WHERE id = v_client_id;

        -- Create Activities
        FOR j IN 1..(floor(random() * 5) + 1) LOOP
            INSERT INTO public.crm_activities (organization_id, client_id, activity_type, subject, description, status, created_at, assigned_to)
            VALUES (
                v_org_id,
                v_client_id,
                CASE WHEN random() > 0.6 THEN 'call' ELSE 'email' END,
                CASE WHEN random() > 0.5 THEN 'Follow up with ' || v_name ELSE 'Introductory meeting' END,
                'Discussed requirements and next steps.',
                CASE WHEN random() > 0.2 THEN 'completed' ELSE 'pending' END,
                NOW() - (random() * 60 * '1 day'::INTERVAL),
                v_random_agent
            );
        END LOOP;

        -- Create Deals
        IF random() > 0.5 THEN
            INSERT INTO public.crm_deals (organization_id, client_id, name, deal_value, stage, owner_id, created_at)
            VALUES (
                v_org_id,
                v_client_id,
                'Deal for ' || v_company,
                (random() * 10000 + 1000)::NUMERIC(12, 2),
                v_deal_stages[1 + floor(random() * array_length(v_deal_stages, 1))],
                v_random_agent,
                NOW() - (random() * 60 * '1 day'::INTERVAL)
            );
        END IF;

        -- Create Orders
        IF random() > 0.7 THEN
            INSERT INTO public.crm_orders (organization_id, client_id, order_number, total, status, order_date)
            VALUES (
                v_org_id,
                v_client_id,
                'ORD-' || i || '-' || floor(random()*1000), 
                (random() * 2000 + 100)::NUMERIC(12, 2),
                'delivered',
                NOW() - (random() * 30 * '1 day'::INTERVAL)
            );
        END IF;
        
        -- Create Messages (Fixed Interval Logic)
        v_msg_time := NOW() - (random() * 30 * '1 day'::INTERVAL);

        INSERT INTO public.messages (organization_id, channel_id, contact_id, sender_type, content_type, text_content, sent_at)
        VALUES (
            v_org_id,
            CASE WHEN random() > 0.5 THEN v_channel_web_id ELSE v_channel_wa_id END,
            v_contact_id,
            'user',
            'text',
            'Hi, I am interested in your services.',
            v_msg_time
        );
        
        INSERT INTO public.messages (organization_id, channel_id, contact_id, sender_type, content_type, text_content, sent_at)
        VALUES (
            v_org_id,
            CASE WHEN random() > 0.5 THEN v_channel_web_id ELSE v_channel_wa_id END,
            v_contact_id,
            'ai',
            'text',
            'Hello! How can I help you today?',
            v_msg_time + '1 minute'::INTERVAL
        );

    END LOOP;

    -- 6. Refresh Analytics
    PERFORM public.refresh_all_analytics();

    RAISE NOTICE 'Generated 50 comprehensive dummy clients with deals, activities, orders, and messages.';
END $$;
