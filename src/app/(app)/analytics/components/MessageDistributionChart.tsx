'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Paper, Typography, Box, useTheme, Divider } from '@mui/material';
import { ChannelPerformance } from '@/hooks/useAnalytics';

interface MessageDistributionChartProps {
    data?: ChannelPerformance[];
    trendData?: any[];
    selectedChannelId?: string | null;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

export default function MessageDistributionChart({ data, trendData, selectedChannelId }: MessageDistributionChartProps) {
    const theme = useTheme();

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

    if (!data || data.length === 0) {
        return (
            <Paper sx={{ p: 3, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="textSecondary">No message data available</Typography>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Distribution (Pie Chart) */}
            <Box sx={{ height: 300, width: '100%' }}>
                <Typography variant="h6" gutterBottom>
                    Message Distribution
                </Typography>
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

            <Divider />

            {/* Message Volume Trends (Line Chart) */}
            {trendData && trendData.length > 0 && (
                <Box sx={{ height: 300, width: '100%' }}>
                    <Typography variant="h6" gutterBottom>
                        Message Volume Trend
                    </Typography>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={trendData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                            <XAxis
                                dataKey="date"
                                stroke={theme.palette.text.secondary}
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            />
                            <YAxis stroke={theme.palette.text.secondary} tick={{ fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 8 }}
                                labelFormatter={(label) => new Date(label).toLocaleDateString()}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="total_messages" name="Total" stroke="#8884d8" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="ai_responses" name="AI" stroke="#82ca9d" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="agent_responses" name="Agent" stroke="#ffc658" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </Box>
            )}
        </Paper>
    );
}
