-- Check if the user has a profile and organization
SELECT 
    au.id as user_id,
    au.email,
    p.organization_id,
    o.name as org_name
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
LEFT JOIN public.organizations o ON p.organization_id = o.id
WHERE au.email = 'shiko30002000@gmail.com'; -- Assuming this is the user's email based on previous logs
