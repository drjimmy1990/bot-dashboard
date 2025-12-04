import React from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';
import { CrmClient, CrmDeal } from '@/lib/api';

interface ClientOverviewProps {
    client: CrmClient;
    deals: CrmDeal[];
    messageCount: number;
}

export default function ClientOverview({ client, deals, messageCount }: ClientOverviewProps) {
    // Calculate open deals value
    const openDealsValue = deals
        .filter(deal => deal.status !== 'won' && deal.status !== 'lost')
        .reduce((sum, deal) => sum + (deal.value || 0), 0);

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Overview</Typography>
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Total Revenue</Typography>
                        <Typography variant="h4">
                            ${client?.total_revenue?.toLocaleString() || '0.00'}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Open Deals Value</Typography>
                        <Typography variant="h4">
                            ${openDealsValue.toLocaleString()}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Total Messages</Typography>
                        <Typography variant="h4">{messageCount}</Typography>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
