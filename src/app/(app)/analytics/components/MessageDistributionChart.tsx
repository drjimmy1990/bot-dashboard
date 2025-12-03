'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Paper, Typography, Box } from '@mui/material';
import { ChannelPerformance } from '@/hooks/useAnalytics';

interface MessageDistributionChartProps {
    data?: ChannelPerformance[];
    selectedChannelId?: string | null;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

export default function MessageDistributionChart({ data, selectedChannelId }: MessageDistributionChartProps) {
    const chartData = React.useMemo(() => {
        if (!data) return [];

        const filteredData = selectedChannelId
            ? data.filter(c => c.channel_id === selectedChannelId)
            : data;

        const incoming = filteredData.reduce((sum, item) => sum + item.incoming_messages, 0);
        const agent = filteredData.reduce((sum, item) => sum + item.agent_responses, 0);
        const ai = filteredData.reduce((sum, item) => sum + item.ai_responses, 0);

        return [
            { name: 'User Messages', value: incoming },
            { name: 'Agent Responses', value: agent },
            { name: 'AI Responses', value: ai },
        ].filter(item => item.value > 0);
    }, [data, selectedChannelId]);

    if (chartData.length === 0) {
        return (
            <Paper sx={{ p: 3, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="textSecondary">No message data available</Typography>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 3, height: 400, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
                Message Distribution
            </Typography>
            <Box sx={{ flexGrow: 1, minHeight: 0, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius="80%"
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => new Intl.NumberFormat('en-US').format(value)} />
                        <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                </ResponsiveContainer>
            </Box>
        </Paper>
    );
}
