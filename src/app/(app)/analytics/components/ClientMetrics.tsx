'use client';

import React from 'react';
import { Paper, Typography, Box } from '@mui/material';

export default function ClientMetrics() {
    return (
        <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="h6" gutterBottom>
                Client Segments
            </Typography>
            <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="textSecondary" paragraph>
                    Client segmentation metrics coming soon.
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    This module will analyze client lifetime value, churn risk, and acquisition sources.
                </Typography>
            </Box>
        </Paper>
    );
}
