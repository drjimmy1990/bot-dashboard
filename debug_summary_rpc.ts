
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env vars
const envPath = path.resolve('.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
const envVars: Record<string, string> = {};
envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) envVars[key.trim()] = value.trim();
});

const supabase = createClient(
    envVars['NEXT_PUBLIC_SUPABASE_URL']!,
    envVars['SUPABASE_SERVICE_ROLE_KEY']!
);

async function testRpc() {
    // Get an Org ID first
    const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
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
