'use client';

import React from 'react';
import { Paper, Typography, Box, useTheme } from '@mui/material';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { RevenueMetric } from '@/hooks/useAnalytics';

interface RevenueAnalyticsProps {
    data?: RevenueMetric[];
    isLoading: boolean;
}

export default function RevenueAnalytics({ data, isLoading }: RevenueAnalyticsProps) {
    const theme = useTheme();

    if (isLoading) {
        return (
            <Paper sx={{ p: 3, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="textSecondary">Loading chart data...</Typography>
            </Paper>
        );
    }

    if (!data || data.length === 0) {
        return (
            <Paper sx={{ p: 3, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="textSecondary">No revenue data available for this period.</Typography>
            </Paper>
        );
    }

    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                height: '100%',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3,
                transition: 'box-shadow 0.2s',
                '&:hover': {
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                }
            }}
        >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                Revenue Trends
            </Typography>
            <Box sx={{ height: 350, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={data}
                        margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 25,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                        <XAxis
                            dataKey="date"
                            stroke={theme.palette.text.secondary}
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        />
                        <YAxis
                            stroke={theme.palette.text.secondary}
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: theme.palette.background.paper,
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: 8
                            }}
                            formatter={(value: number) => [`$${value}`, 'Revenue']}
                            labelFormatter={(label) => new Date(label).toLocaleDateString()}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke={theme.palette.primary.main}
                            strokeWidth={3}
                            activeDot={{ r: 8 }}
                            name="Revenue"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </Box>
        </Paper>
    );
}
