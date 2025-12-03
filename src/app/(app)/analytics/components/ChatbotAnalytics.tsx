'use client';

import React from 'react';
import { Paper, Typography, Box } from '@mui/material';

export default function ChatbotAnalytics() {
    return (
        <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="h6" gutterBottom>
                Chatbot Effectiveness
            </Typography>
            <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="textSecondary" paragraph>
                    Detailed chatbot analytics coming soon.
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    This module will track AI resolution rates, average handling time, and sentiment analysis.
                </Typography>
            </Box>
        </Paper>
    );
}
