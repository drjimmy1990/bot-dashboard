'use client';

import React from 'react';
import { Paper, Typography, Box, useTheme, Skeleton, Divider } from '@mui/material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    LabelList,
} from 'recharts';
import { SalesFunnelData } from '@/hooks/useAnalytics';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

interface SalesFunnelAnalyticsProps {
    data?: SalesFunnelData;
    isLoading: boolean;
}

// Stage card for the summary row
function StageCard({
    title,
    entered,
    completed,
    dropped,
    color,
}: {
    title: string;
    entered: number;
    completed: number;
    dropped: number;
    color: string;
}) {
    const completionRate = entered > 0 ? ((completed / entered) * 100).toFixed(1) : '0.0';

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2.5,
                flex: 1,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                borderTop: `3px solid ${color}`,
            }}
        >
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1.5 }}>
                {entered}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
                <Box>
                    <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                        ✓ {completed} passed
                    </Typography>
                </Box>
                <Box>
                    <Typography variant="caption" color="error.main" sx={{ fontWeight: 600 }}>
                        ✗ {dropped} dropped
                    </Typography>
                </Box>
            </Box>
            <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                {completionRate}% completion
            </Typography>
        </Paper>
    );
}

export default function SalesFunnelAnalytics({ data, isLoading }: SalesFunnelAnalyticsProps) {
    const theme = useTheme();

    if (isLoading) {
        return (
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    {[1, 2, 3].map(i => <Skeleton key={i} variant="rectangular" height={120} sx={{ flex: 1, borderRadius: 2 }} />)}
                </Box>
                <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
            </Paper>
        );
    }

    if (!data || (data.bmi_started === 0 && data.testimonials_shown === 0 && data.price_shown === 0)) {
        return (
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    height: 400,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3,
                    bgcolor: 'background.default',
                }}
            >
                <Box sx={{ p: 2, borderRadius: '50%', bgcolor: 'primary.main', opacity: 0.1, mb: 2 }}>
                    <FilterAltIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 1 }} />
                </Box>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Funnel Data Yet
                </Typography>
                <Typography variant="body2" color="text.disabled" textAlign="center" maxWidth={400}>
                    Sales funnel data will appear here once the bot starts tagging clients at each conversation stage (BMI → Testimonials → Price).
                </Typography>
            </Paper>
        );
    }

    const chartData = [
        { name: 'BMI Collection', entered: data.bmi_started, completed: data.bmi_completed, dropped: data.bmi_dropped },
        { name: 'Testimonials', entered: data.testimonials_shown, completed: data.testimonials_passed, dropped: data.testimonials_dropped },
        { name: 'Price Shown', entered: data.price_shown, completed: data.purchased, dropped: data.price_dropped },
    ];

    const COLORS = {
        entered: theme.palette.primary.main,
        completed: theme.palette.success.main,
        dropped: theme.palette.error.light,
    };

    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3,
                transition: 'box-shadow 0.2s',
                '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.05)' },
            }}
        >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterAltIcon color="primary" />
                Sales Funnel
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Track client progression: BMI Collection → Testimonials → Price
            </Typography>

            {/* Stage Summary Cards */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <StageCard
                    title="Stage 1: BMI Collection"
                    entered={data.bmi_started}
                    completed={data.bmi_completed}
                    dropped={data.bmi_dropped}
                    color={theme.palette.primary.main}
                />
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ArrowForwardIcon color="action" />
                </Box>
                <StageCard
                    title="Stage 2: Testimonials"
                    entered={data.testimonials_shown}
                    completed={data.testimonials_passed}
                    dropped={data.testimonials_dropped}
                    color={theme.palette.warning.main}
                />
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ArrowForwardIcon color="action" />
                </Box>
                <StageCard
                    title="Stage 3: Price Shown"
                    entered={data.price_shown}
                    completed={data.purchased}
                    dropped={data.price_dropped}
                    color={theme.palette.success.main}
                />
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Bar Chart */}
            <Box sx={{ height: 300, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: theme.palette.text.primary }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: theme.palette.background.paper,
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: 8,
                            }}
                        />
                        <Bar dataKey="entered" name="Entered" fill={COLORS.entered} radius={[4, 4, 0, 0]} barSize={32}>
                            <LabelList dataKey="entered" position="top" style={{ fontSize: 11, fontWeight: 600 }} />
                        </Bar>
                        <Bar dataKey="completed" name="Completed" fill={COLORS.completed} radius={[4, 4, 0, 0]} barSize={32}>
                            <LabelList dataKey="completed" position="top" style={{ fontSize: 11, fontWeight: 600 }} />
                        </Bar>
                        <Bar dataKey="dropped" name="Dropped" fill={COLORS.dropped} radius={[4, 4, 0, 0]} barSize={32}>
                            <LabelList dataKey="dropped" position="top" style={{ fontSize: 11, fontWeight: 600 }} />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </Box>
        </Paper>
    );
}
