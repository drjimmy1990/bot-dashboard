-- ====================================================================
-- REMOVE COMPREHENSIVE DUMMY DATA
-- ====================================================================

-- 1. Delete Dummy Clients
-- We target by specific email domains and patterns used in the generation script.
DELETE FROM public.crm_clients 
WHERE email LIKE '%@example.com' 
   OR email LIKE '%@test-corp.com'
   OR company_name IN ('Acme Corp', 'Global Tech', 'Nebula Innovations', 'Quantum Systems', 'Starlight Logistics', 'Blue Ocean Inc', 'Apex Dynamics', 'Horizon Ventures', 'Zenith Solutions', 'Pioneer Enterprises');

-- 2. Delete Dummy Contacts
DELETE FROM public.contacts 
WHERE platform_user_id LIKE 'user_%_test'
   OR name IN ('Alice Johnson', 'Bob Smith', 'Charlie Brown', 'Diana Prince', 'Evan Wright', 'Fiona Green', 'George King', 'Hannah White', 'Ian Black', 'Julia Roberts');

-- 3. Delete Dummy Channels
DELETE FROM public.channels
WHERE name IN ('Website Widget (Test)', 'WhatsApp Support (Test)');

-- 4. Delete Dummy Tags
DELETE FROM public.crm_tags
WHERE name IN ('VIP', 'High Value', 'Churn Risk', 'New Lead', 'Conference 2024', 'Partner', 'Reseller');

-- 5. Delete Dummy Profiles (Agents)
DELETE FROM public.profiles
WHERE full_name IN ('Sarah Connor', 'John Wick', 'Ellen Ripley');

-- 6. Refresh Analytics
SELECT public.refresh_all_analytics();
