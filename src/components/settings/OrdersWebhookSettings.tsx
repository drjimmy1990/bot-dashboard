// src/components/settings/OrdersWebhookSettings.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  InputAdornment,
  Chip,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useChannelConfig, ChannelConfig } from '@/hooks/useChannelConfig';

interface OrdersWebhookSettingsProps {
  config: ChannelConfig;
  channelId: string;
}

export default function OrdersWebhookSettings({ config, channelId }: OrdersWebhookSettingsProps) {
  const { updateConfig, isUpdatingConfig } = useChannelConfig(channelId);
  const [webhookUrl, setWebhookUrl] = useState(config.orders_webhook_url || '');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' } | null>(null);

  useEffect(() => {
    setWebhookUrl(config.orders_webhook_url || '');
  }, [config]);

  const handleSave = () => {
    updateConfig(
      { orders_webhook_url: webhookUrl.trim() || undefined },
      {
        onSuccess: () => setSnackbar({ open: true, message: 'Orders webhook saved!', severity: 'success' }),
        onError: (err) => setSnackbar({ open: true, message: `Error: ${err.message}`, severity: 'error' }),
      }
    );
  };

  const isConfigured = !!webhookUrl.trim();

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ShoppingCartIcon color="primary" />
        Orders Webhook
        <Chip
          label={isConfigured ? 'Configured' : 'Not Configured'}
          color={isConfigured ? 'success' : 'default'}
          size="small"
          sx={{ ml: 1 }}
        />
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure the n8n webhook URL used for fetching customer orders.
        The dashboard will call this URL to retrieve order data from your e-commerce platform.
      </Typography>

      <Grid container spacing={3} alignItems="center">
        <Grid size={12}>
          <TextField
            label="Orders Webhook URL"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            fullWidth
            size="small"
            placeholder="https://your-n8n.com/webhook/get-orders"
            helperText="The n8n webhook endpoint that returns customer orders from your e-commerce system."
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <ShoppingCartIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Grid>
        <Grid size={12} sx={{ textAlign: 'right' }}>
          <Button variant="contained" onClick={handleSave} disabled={isUpdatingConfig}>
            {isUpdatingConfig ? <CircularProgress size={24} /> : 'Save Orders Webhook'}
          </Button>
        </Grid>
      </Grid>

      {snackbar && (
        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(null)}>
          <Alert onClose={() => setSnackbar(null)} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      )}
    </Paper>
  );
}
