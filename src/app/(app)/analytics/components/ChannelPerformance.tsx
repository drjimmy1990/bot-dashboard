/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import { Paper, Typography, Box, useTheme } from '@mui/material';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { ChannelPerformance } from '@/hooks/useAnalytics';

interface ChannelPerformanceProps {
    data?: ChannelPerformance[];
    isLoading: boolean;
}

export default function ChannelPerformanceChart({ data, isLoading }: ChannelPerformanceProps) {
    const theme = useTheme();

    const COLORS = [
        theme.palette.primary.main,
        theme.palette.secondary.main,
        theme.palette.error.main,
        theme.palette.warning.main,
        theme.palette.info.main,
    ];

    if (isLoading) {
        return (
            <Paper sx={{ p: 3, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="textSecondary">Loading channel data...</Typography>
            </Paper>
        );
    }

    if (!data || data.length === 0) {
        return (
            <Paper sx={{ p: 3, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="textSecondary">No channel data available.</Typography>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
                Channel Volume
            </Typography>
            <Box sx={{ height: 350, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data as any[]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="message_count"
                            nameKey="channel_name"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: theme.palette.background.paper,
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: 8
                            }}
                        />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </Box>
        </Paper>
    );
}
