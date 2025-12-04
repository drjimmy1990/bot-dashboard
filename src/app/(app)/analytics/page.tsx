'use client';

import React, { useState } from 'react';
import { Box, Typography, Button, Grid, Tab, Tabs, Select, MenuItem, FormControl, InputLabel, SelectChangeEvent } from '@mui/material';

import RefreshIcon from '@mui/icons-material/Refresh';
import {
    useDashboardSummary,
    useRevenueMetrics,
    useConversionFunnel,
    useDealMetrics,
    useDealTrends,
    useChannelPerformance,
    useMessageVolumeTrends,
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
import DateRangePicker, { DateRangeOption } from './components/DateRangePicker';
import ExportButton from './components/ExportButton';

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
    const { data: orgId } = useOrganization();
    const [tabValue, setTabValue] = useState(0);
    const [selectedChannelId, setSelectedChannelId] = useState<string>('');
    const [dateRange, setDateRange] = useState<DateRangeOption>('30d');
    const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');

    // Calculate start and end dates based on dateRange
    const { startDate, endDate } = React.useMemo(() => {
        const now = new Date();
        // Normalize to end of day to avoid millisecond mismatches causing refetches
        now.setHours(23, 59, 59, 999);

        let start: Date | null = null;
        let end: Date | null = now;

        if (dateRange === '7d') {
            start = new Date(now);
            start.setDate(now.getDate() - 7);
            start.setHours(0, 0, 0, 0); // Start of day
        } else if (dateRange === '30d') {
            start = new Date(now);
            start.setDate(now.getDate() - 30);
            start.setHours(0, 0, 0, 0);
        } else if (dateRange === '90d') {
            start = new Date(now);
            start.setDate(now.getDate() - 90);
            start.setHours(0, 0, 0, 0);
        } else {
            start = null;
            end = null;
        }
        return { startDate: start, endDate: end };
    }, [dateRange]);

    // Fetch data
    const { data: summary, isLoading: isSummaryLoading, refetch: refetchSummary } = useDashboardSummary(orgId || '', selectedChannelId || null, startDate, endDate);
    const { data: revenue, isLoading: isRevenueLoading } = useRevenueMetrics(orgId || '', period, selectedChannelId || null, startDate, endDate);
    const { data: funnel, isLoading: isFunnelLoading } = useConversionFunnel(orgId || '', selectedChannelId || null, startDate, endDate);
    const { data: deals, isLoading: isDealsLoading } = useDealMetrics(orgId || '', selectedChannelId || null, startDate, endDate);
    const { data: dealsTrend, isLoading: isDealsTrendLoading } = useDealTrends(orgId || '', period, selectedChannelId || null, startDate, endDate);
    const { data: channelPerformance, isLoading: isChannelLoading } = useChannelPerformance(orgId || '', startDate, endDate);
    const { data: messageTrends } = useMessageVolumeTrends(orgId || '', period, selectedChannelId || null, startDate, endDate);
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
        <Box sx={{ p: 3, maxWidth: '100%', mx: 'auto', width: '100%' }}>
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
                    <FormControl sx={{ minWidth: 120 }} size="small">
                        <InputLabel id="period-select-label">Period</InputLabel>
                        <Select
                            labelId="period-select-label"
                            id="period-select"
                            value={period}
                            label="Period"
                            onChange={(e) => setPeriod(e.target.value as 'day' | 'week' | 'month')}
                        >
                            <MenuItem value="day">Daily</MenuItem>
                            <MenuItem value="week">Weekly</MenuItem>
                            <MenuItem value="month">Monthly</MenuItem>
                        </Select>
                    </FormControl>
                    <DateRangePicker value={dateRange} onChange={setDateRange} />
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
                    <ExportButton summary={summary} channelPerformance={channelPerformance} />
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
                    {/* Row 1: Revenue & Deal Pipeline */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <RevenueAnalytics data={revenue} isLoading={isRevenueLoading} height={250} />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <DealAnalytics
                            data={deals}
                            trendData={dealsTrend}
                            isLoading={isDealsLoading || isDealsTrendLoading}
                            showTrend={false}
                            showPipeline={true}
                            height={250}
                        />
                    </Grid>

                    {/* Row 2: Deal Trend & Funnel */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <DealAnalytics
                            data={deals}
                            trendData={dealsTrend}
                            isLoading={isDealsLoading || isDealsTrendLoading}
                            showTrend={true}
                            showPipeline={false}
                            height={250}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <ConversionFunnel data={funnel} isLoading={isFunnelLoading} height={250} />
                    </Grid>

                    {/* Row 3: Channel Volume & Message Distribution */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <ChannelPerformanceChart data={channelPerformance} isLoading={isChannelLoading} height={250} />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <MessageDistributionChart
                            data={channelPerformance}
                            trendData={messageTrends}
                            selectedChannelId={selectedChannelId || null}
                            showTrend={false}
                            showDistribution={true}
                            height={250}
                        />
                    </Grid>

                    {/* Row 4: Message Volume Trend */}
                    <Grid size={{ xs: 12 }}>
                        <MessageDistributionChart
                            data={channelPerformance}
                            trendData={messageTrends}
                            selectedChannelId={selectedChannelId || null}
                            showDistribution={false}
                            showTrend={true}
                            height={250}
                        />
                    </Grid>
                </Grid>
            </CustomTabPanel>

            <CustomTabPanel value={tabValue} index={1}>
                <Grid container spacing={3}>
                    {/* Sales & Revenue: Big, detailed charts, full width */}
                    <Grid size={{ xs: 12 }}>
                        <RevenueAnalytics data={revenue} isLoading={isRevenueLoading} height={500} />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <DealAnalytics
                            data={deals}
                            trendData={dealsTrend}
                            isLoading={isDealsLoading || isDealsTrendLoading}
                            showTrend={true}
                            height={500}
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <ConversionFunnel data={funnel} isLoading={isFunnelLoading} height={500} />
                    </Grid>
                </Grid>
            </CustomTabPanel>

            <CustomTabPanel value={tabValue} index={2}>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <ChannelPerformanceChart data={channelPerformance} isLoading={isChannelLoading} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <ChatbotAnalytics selectedChannelId={selectedChannelId || null} />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <MessageDistributionChart
                            data={channelPerformance}
                            trendData={messageTrends}
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
