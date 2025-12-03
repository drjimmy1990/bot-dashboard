'use client';

import React from 'react';
import { Paper, Typography, Box, useTheme, Divider, CircularProgress } from '@mui/material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    LineChart,
    Line
} from 'recharts';
import { DealMetric } from '@/hooks/useAnalytics';

interface DealAnalyticsProps {
    data?: DealMetric[];
    trendData?: any[];
    isLoading: boolean;
    showPipeline?: boolean;
    showTrend?: boolean;
}

export default function DealAnalytics({
    data,
    trendData,
    isLoading,
    showPipeline = true,
    showTrend = true
}: DealAnalyticsProps) {
    const theme = useTheme();

    if (isLoading) {
        return (
            <Paper sx={{ p: 3, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress />
            </Paper>
        );
    }

    if ((!data || data.length === 0) && (!trendData || trendData.length === 0)) {
        return (
            <Paper sx={{ p: 3, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="textSecondary">No deal data available.</Typography>
            </Paper>
        );
    }

    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3,
                transition: 'box-shadow 0.2s',
                '&:hover': {
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                }
            }}
        >
            {/* Pipeline Snapshot (Bar Chart) */}
            {showPipeline && (
                <Box sx={{ height: 300, minHeight: 300, width: '100%' }}>
                    <Typography variant="h6" gutterBottom>
                        Deal Pipeline (Current Snapshot)
                    </Typography>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            margin={{ top: 20, right: 30, left: 20, bottom: 25 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                            <XAxis
                                dataKey="stage"
                                stroke={theme.palette.text.secondary}
                                tick={{ fontSize: 12 }}
                                interval={0}
                            />
                            <YAxis yAxisId="left" orientation="left" stroke={theme.palette.primary.main} tick={{ fontSize: 12 }} />
                            <YAxis yAxisId="right" orientation="right" stroke={theme.palette.secondary.main} tick={{ fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 8 }}
                                formatter={(value, name) => {
                                    if (name === 'value') return [`$${value}`, 'Total Value'];
                                    return [value, 'Deal Count'];
                                }}
                            />
                            <Legend />
                            <Bar yAxisId="left" dataKey="count" name="Deal Count" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
                            <Bar yAxisId="right" dataKey="value" name="Total Value" fill={theme.palette.secondary.main} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </Box>
            )}

            {showPipeline && showTrend && <Divider />}

            {/* New Deals Trend (Line Chart) */}
            {showTrend && trendData && trendData.length > 0 && (
                <Box sx={{ height: 300, minHeight: 300, width: '100%' }}>
                    <Typography variant="h6" gutterBottom>
                        New Deals Trend
                    </Typography>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={trendData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 25 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                            <XAxis
                                dataKey="date"
                                stroke={theme.palette.text.secondary}
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            />
                            <YAxis yAxisId="left" orientation="left" stroke={theme.palette.primary.main} tick={{ fontSize: 12 }} />
                            <YAxis yAxisId="right" orientation="right" stroke={theme.palette.secondary.main} tick={{ fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 8 }}
                                labelFormatter={(label) => new Date(label).toLocaleDateString()}
                            />
                            <Legend />
                            <Line yAxisId="left" type="monotone" dataKey="new_deals_count" name="New Deals" stroke={theme.palette.primary.main} strokeWidth={2} activeDot={{ r: 6 }} />
                            <Line yAxisId="right" type="monotone" dataKey="new_deals_value" name="New Value" stroke={theme.palette.secondary.main} strokeWidth={2} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </Box>
            )}
        </Paper>
    );
}
