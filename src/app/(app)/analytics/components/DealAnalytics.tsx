'use client';

import React from 'react';
import { Paper, Typography, Box, useTheme } from '@mui/material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { DealMetric } from '@/hooks/useAnalytics';

interface DealAnalyticsProps {
    data?: DealMetric[];
    isLoading: boolean;
}

export default function DealAnalytics({ data, isLoading }: DealAnalyticsProps) {
    const theme = useTheme();

    if (isLoading) {
        return (
            <Paper sx={{ p: 3, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="textSecondary">Loading deal data...</Typography>
            </Paper>
        );
    }

    if (!data || data.length === 0) {
        return (
            <Paper sx={{ p: 3, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="textSecondary">No deal data available.</Typography>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
                Deal Pipeline
            </Typography>
            <Box sx={{ height: 350, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                        <XAxis
                            dataKey="stage"
                            stroke={theme.palette.text.secondary}
                            tick={{ fontSize: 12 }}
                        />
                        <YAxis
                            yAxisId="left"
                            orientation="left"
                            stroke={theme.palette.primary.main}
                            tick={{ fontSize: 12 }}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke={theme.palette.secondary.main}
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: theme.palette.background.paper,
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: 8
                            }}
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="count" name="Deal Count" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="right" dataKey="value" name="Total Value" fill={theme.palette.secondary.main} radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </Box>
        </Paper>
    );
}
