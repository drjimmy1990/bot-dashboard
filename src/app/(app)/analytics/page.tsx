'use client';

import React, { useState } from 'react';
import { Box, Typography, Button, Grid, Tab, Tabs, Select, MenuItem, FormControl, InputLabel, SelectChangeEvent } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useAuth } from '../../../providers/AuthProvider';
import {
    useDashboardSummary,
    useRevenueMetrics,
    useConversionFunnel,
    useDealMetrics,
    useChannelPerformance,
    useAnalyticsControl
} from '@/hooks/useAnalytics';
import { useChannels } from '@/hooks/useChannels';
import { useOrganization } from '@/hooks/useOrganization';

import DashboardMetricsGrid from './components/DashboardMetricsGrid';
import RevenueAnalytics from './components/RevenueAnalytics';
import ConversionFunnel from './components/ConversionFunnel';
import DealAnalytics from './components/DealAnalytics';
import ChannelPerformanceChart from './components/ChannelPerformance';
import ChatbotAnalytics from './components/ChatbotAnalytics';
import ClientMetrics from './components/ClientMetrics';
import MessageDistributionChart from './components/MessageDistributionChart';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ py: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

function a11yProps(index: number) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

export default function AnalyticsPage() {
    const { user } = useAuth();
    const { data: orgId } = useOrganization();
    const [tabValue, setTabValue] = useState(0);
    const [selectedChannelId, setSelectedChannelId] = useState<string>('');

    // Fetch data
    const { data: summary, isLoading: isSummaryLoading, refetch: refetchSummary } = useDashboardSummary(orgId || '');
    const { data: revenue, isLoading: isRevenueLoading } = useRevenueMetrics(orgId || '');
    const { data: funnel, isLoading: isFunnelLoading } = useConversionFunnel(orgId || '');
    const { data: deals, isLoading: isDealsLoading } = useDealMetrics(orgId || '');
    const { data: channelPerformance, isLoading: isChannelLoading } = useChannelPerformance(orgId || '');
    const { channels } = useChannels();
    const { refreshAnalytics } = useAnalyticsControl();

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleRefresh = async () => {
        try {
            await refreshAnalytics();
            // Refetch all data
            refetchSummary();
            // In a real app, we would refetch all queries, but React Query's invalidation would be better
            window.location.reload(); // Simple reload to ensure all data is fresh
        } catch (error) {
            console.error('Failed to refresh analytics:', error);
        }
    };

    const handleChannelChange = (event: SelectChangeEvent) => {
        setSelectedChannelId(event.target.value);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
                        Analytics Dashboard
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                        Track your business performance and customer insights
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControl sx={{ minWidth: 200 }} size="small">
                        <InputLabel id="channel-select-label">Filter by Channel</InputLabel>
                        <Select
                            labelId="channel-select-label"
                            id="channel-select"
                            value={selectedChannelId}
                            label="Filter by Channel"
                            onChange={handleChannelChange}
                        >
                            <MenuItem value="">
                                <em>All Channels</em>
                            </MenuItem>
                            {channels.map((channel) => (
                                <MenuItem key={channel.id} value={channel.id}>
                                    {channel.name} ({channel.platform})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={handleRefresh}
                    >
                        Refresh
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                    >
                        Export Report
                    </Button>
                </Box>
            </Box>



            <DashboardMetricsGrid
                data={summary}
                channelPerformance={channelPerformance}
                selectedChannelId={selectedChannelId || null}
                isLoading={isSummaryLoading || isChannelLoading}
            />

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="analytics tabs">
                    <Tab label="Overview" {...a11yProps(0)} />
                    <Tab label="Sales & Revenue" {...a11yProps(1)} />
                    <Tab label="Channels & AI" {...a11yProps(2)} />
                    <Tab label="Clients" {...a11yProps(3)} />
                </Tabs>
            </Box>

            <CustomTabPanel value={tabValue} index={0}>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 8 }}>
                        <RevenueAnalytics data={revenue} isLoading={isRevenueLoading} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <MessageDistributionChart
                            data={channelPerformance}
                            selectedChannelId={selectedChannelId || null}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <ConversionFunnel data={funnel} isLoading={isFunnelLoading} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <DealAnalytics data={deals} isLoading={isDealsLoading} />
                    </Grid>
                </Grid>
            </CustomTabPanel>

            <CustomTabPanel value={tabValue} index={1}>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                        <RevenueAnalytics data={revenue} isLoading={isRevenueLoading} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <DealAnalytics data={deals} isLoading={isDealsLoading} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <ConversionFunnel data={funnel} isLoading={isFunnelLoading} />
                    </Grid>
                </Grid>
            </CustomTabPanel>

            <CustomTabPanel value={tabValue} index={2}>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <ChannelPerformanceChart data={channelPerformance} isLoading={isChannelLoading} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <ChatbotAnalytics />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <MessageDistributionChart
                            data={channelPerformance}
                            selectedChannelId={selectedChannelId || null}
                        />
                    </Grid>
                </Grid>
            </CustomTabPanel>

            <CustomTabPanel value={tabValue} index={3}>
                <ClientMetrics />
            </CustomTabPanel>
        </Box>
    );
}
