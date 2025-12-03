'use client';

import React from 'react';
import { Grid, Paper, Typography, Box, Skeleton } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { DashboardSummary, ChannelPerformance } from '@/hooks/useAnalytics';
import ChatIcon from '@mui/icons-material/Chat';
import RateReviewIcon from '@mui/icons-material/RateReview';
import SmartToyIcon from '@mui/icons-material/SmartToy';

interface DashboardMetricsGridProps {
    data?: DashboardSummary;
    channelPerformance?: ChannelPerformance[];
    selectedChannelId?: string | null;
    isLoading: boolean;
}

export default function DashboardMetricsGrid({ data, channelPerformance, selectedChannelId, isLoading }: DashboardMetricsGridProps) {
    // Filter channel performance data
    const filteredChannels = React.useMemo(() => {
        if (!channelPerformance) return [];
        if (selectedChannelId) {
            return channelPerformance.filter(c => c.channel_id === selectedChannelId);
        }
        return channelPerformance;
    }, [channelPerformance, selectedChannelId]);

    // Calculate aggregated metrics
    const commsMetrics = React.useMemo(() => {
        const totalMessages = filteredChannels.reduce((sum, ch) => sum + ch.total_messages, 0);
        const totalContacts = filteredChannels.reduce((sum, ch) => sum + ch.total_contacts, 0);
        const totalAiResponses = filteredChannels.reduce((sum, ch) => sum + ch.ai_responses, 0);

        const engagementScore = totalContacts > 0 ? (totalMessages / totalContacts).toFixed(1) : '0';
        const aiResponseRate = totalMessages > 0 ? ((totalAiResponses / totalMessages) * 100).toFixed(1) : '0';

        return {
            totalMessages,
            totalContacts,
            engagementScore,
            aiResponseRate
        };
    }, [filteredChannels]);

    const metrics = [
        {
            label: 'Total Revenue',
            value: data?.total_revenue,
            format: (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v),
            icon: <MonetizationOnIcon color="primary" />,
            color: 'primary.main',
        },
        {
            label: 'Active Leads',
            value: data?.active_leads,
            format: (v: number) => v,
            icon: <PeopleIcon color="secondary" />,
            color: 'secondary.main',
        },
        {
            label: 'Open Deals Value',
            value: data?.open_deals_value,
            format: (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v),
            icon: <TrendingUpIcon color="success" />,
            color: 'success.main',
        },
        {
            label: 'Pending Activities',
            value: data?.pending_activities,
            format: (v: number) => v,
            icon: <AssignmentIcon color="warning" />,
            color: 'warning.main',
        },
    ];

    const communicationMetrics = [
        {
            label: selectedChannelId ? 'Channel Clients' : 'Total Clients',
            value: commsMetrics.totalContacts,
            format: (v: number) => v,
            icon: <PeopleIcon color="info" />,
            color: 'info.main',
        },
        {
            label: 'Total Messages',
            value: commsMetrics.totalMessages,
            format: (v: number) => v,
            icon: <ChatIcon color="primary" />,
            color: 'primary.main',
        },
        {
            label: 'Avg. Msgs / Client',
            value: commsMetrics.engagementScore,
            format: (v: string) => v,
            icon: <RateReviewIcon color="secondary" />,
            color: 'secondary.main',
        },
        {
            label: 'AI Response Rate',
            value: commsMetrics.aiResponseRate,
            format: (v: string) => `${v}%`,
            icon: <SmartToyIcon color="success" />,
            color: 'success.main',
        },
    ];

    if (isLoading) {
        return (
            <Grid container spacing={3} mb={4}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={item}>
                        <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
                    </Grid>
                ))}
            </Grid>
        );
    }

    return (
        <Box>
            <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 2 }}>
                Business Overview
            </Typography>
            <Grid container spacing={3} mb={4}>
                {metrics.map((metric, index) => (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                        <Paper
                            sx={{
                                p: 3,
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%',
                                position: 'relative',
                                overflow: 'hidden',
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                <Typography color="textSecondary" variant="subtitle2" sx={{ fontWeight: 600 }}>
                                    {metric.label}
                                </Typography>
                                <Box
                                    sx={{
                                        p: 1,
                                        borderRadius: '50%',
                                        bgcolor: `${metric.color}15`, // 15% opacity
                                        display: 'flex',
                                        color: metric.color,
                                    }}
                                >
                                    {metric.icon}
                                </Box>
                            </Box>
                            <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                                {metric.value !== undefined ? metric.format(metric.value) : '-'}
                            </Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2 }}>
                Communication & Engagement {selectedChannelId && '(Filtered)'}
            </Typography>
            <Grid container spacing={3} mb={4}>
                {communicationMetrics.map((metric, index) => (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                        <Paper
                            sx={{
                                p: 3,
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%',
                                position: 'relative',
                                overflow: 'hidden',
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                <Typography color="textSecondary" variant="subtitle2" sx={{ fontWeight: 600 }}>
                                    {metric.label}
                                </Typography>
                                <Box
                                    sx={{
                                        p: 1,
                                        borderRadius: '50%',
                                        bgcolor: `${metric.color}15`, // 15% opacity
                                        display: 'flex',
                                        color: metric.color,
                                    }}
                                >
                                    {metric.icon}
                                </Box>
                            </Box>
                            <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {(metric as any).value !== undefined ? (metric as any).format((metric as any).value) : '-'}
                            </Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
