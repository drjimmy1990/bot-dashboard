-- DEBUG SCRIPT: Check Analytics Data Integrity
-- Run this in the Supabase SQL Editor to see what data exists.

-- 1. Check Organizations
SELECT id, name, created_at FROM public.organizations;

-- 2. Check Channels (Do you have channels linked to your org?)
SELECT id, name, organization_id, platform FROM public.channels;

-- 3. Check Contacts (Are they linked to the correct channel and org?)
SELECT count(*) as total_contacts, channel_id, organization_id 
FROM public.contacts 
GROUP BY channel_id, organization_id;

-- 4. Check Messages (Are they linked correctly?)
SELECT count(*) as total_messages, channel_id, organization_id, sender_type 
FROM public.messages 
GROUP BY channel_id, organization_id, sender_type;

-- 5. Check CRM Clients (Did the backfill work?)
SELECT count(*) as total_clients, organization_id, client_type 
FROM public.crm_clients 
GROUP BY organization_id, client_type;

-- 6. Check the Analytics View directly (Is it empty?)
SELECT * FROM public.analytics_channel_performance;

-- 7. Check Dashboard Summary Function Output (Replace with your Org ID if known, or pick one from step 1)
-- SELECT * FROM public.get_crm_dashboard_summary('YOUR_ORG_ID_HERE');
