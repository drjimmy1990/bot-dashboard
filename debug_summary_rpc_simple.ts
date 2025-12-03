
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ktxsljzwzfviaapaiuqs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0eHNsanp3emZ2aWFhcGFpdXFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjM1NDQwMCwiZXhwIjoyMDQ3OTMwNDAwfQ.PLbWm0j5VHiLYtj8dDTJQyMtxcItLXhn6QxVb7x5GEI';

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    }
});

async function testRpc() {
    console.log('Connecting to Supabase...');

    // Get an Org ID first
    const { data: orgs, error: orgError } = await supabase.from('organizations').select('id').limit(1);
    if (orgError) {
        console.error('Error fetching orgs:', orgError);
        return;
    }
    if (!orgs || orgs.length === 0) {
        console.error('No organization found');
        return;
    }
    const orgId = orgs[0].id;
    console.log('Testing with Org ID:', orgId);

    // Test 1: All Time (Null dates)
    console.log('\n--- Test 1: All Time ---');
    const { data: allTime, error: err1 } = await supabase.rpc('get_crm_dashboard_summary', {
        org_id: orgId,
        p_channel_id: null,
        start_date: null,
        end_date: null
    });
    if (err1) console.error('Error Test 1:', err1);
    else console.log('All Time Result:', allTime);

    // Test 2: Last 7 Days
    console.log('\n--- Test 2: Last 7 Days ---');
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);

    console.log(`Date Range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    const { data: last7Days, error: err2 } = await supabase.rpc('get_crm_dashboard_summary', {
        org_id: orgId,
        p_channel_id: null,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
    });
    if (err2) console.error('Error Test 2:', err2);
    else console.log('Last 7 Days Result:', last7Days);
}

testRpc();
