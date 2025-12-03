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
    Cell,
} from 'recharts';
import { ConversionFunnelStep } from '@/hooks/useAnalytics';

interface ConversionFunnelProps {
    data?: ConversionFunnelStep[];
    isLoading: boolean;
}

export default function ConversionFunnel({ data, isLoading }: ConversionFunnelProps) {
    const theme = useTheme();

    // Colors for funnel stages
    const COLORS = [
        theme.palette.primary.light,
        theme.palette.primary.main,
        theme.palette.secondary.light,
        theme.palette.secondary.main,
        theme.palette.success.light,
        theme.palette.success.main,
    ];

    if (isLoading) {
        return (
            <Paper sx={{ p: 3, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="textSecondary">Loading funnel data...</Typography>
            </Paper>
        );
    }

    if (!data || data.length === 0) {
        return (
            <Paper sx={{ p: 3, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="textSecondary">No funnel data available.</Typography>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
                Conversion Funnel
            </Typography>
            <Box sx={{ height: 350, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{
                            top: 5,
                            right: 30,
                            left: 40,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme.palette.divider} />
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="stage"
                            type="category"
                            width={100}
                            tick={{ fontSize: 12, fill: theme.palette.text.primary }}
                        />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{
                                backgroundColor: theme.palette.background.paper,
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: 8
                            }}
                            formatter={(value: number, name: string, props: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                                const rate = props.payload.conversion_rate;
                                return [`${value} (${rate}%)`, 'Clients'];
                            }}
                        />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={40}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </Box>
        </Paper>
    );
}
