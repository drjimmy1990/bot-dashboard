'use client';

import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, Chip, CircularProgress } from '@mui/material';
import { useParams } from 'next/navigation';
import { useClient } from '@/hooks/useClient';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';

export default function ClientDeals() {
    const params = useParams();
    const clientId = params.id as string;
    const { clientData } = useClient(clientId);

    if (!clientData) return <CircularProgress />;

    const { deals } = clientData;

    const getStageColor = (stage: string): 'success' | 'error' | 'warning' | 'info' | 'primary' | 'default' => {
        switch (stage) {
            case 'closed_won': return 'success';
            case 'closed_lost': return 'error';
            case 'negotiation': return 'warning';
            case 'proposal': return 'info';
            default: return 'primary';
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">Deals</Typography>
                {/* TODO: Add Deal Button */}
            </Box>

            <List>
                {deals.map((deal) => (
                    <Paper key={deal.id} sx={{ mb: 2 }} variant="outlined">
                        <ListItem>
                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            {deal.name || 'Untitled Deal'}
                                        </Typography>
                                        <Chip
                                            label={deal.stage?.replace('_', ' ') || 'New'}
                                            size="small"
                                            color={getStageColor(deal.stage)}
                                            variant="outlined"
                                        />
                                    </Box>
                                }
                                secondary={
                                    <Box sx={{ mt: 1, display: 'flex', gap: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <MonetizationOnIcon fontSize="small" color="action" />
                                            <Typography variant="body2">
                                                ${deal.deal_value?.toLocaleString() || '0'}
                                            </Typography>
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Close Date: {deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString() : 'TBD'}
                                        </Typography>
                                    </Box>
                                }
                                secondaryTypographyProps={{ component: 'div' }}
                            />
                        </ListItem>
                    </Paper>
                ))}
                {deals.length === 0 && (
                    <Typography color="text.secondary" textAlign="center">No deals found.</Typography>
                )}
            </List>
        </Box>
    );
}
