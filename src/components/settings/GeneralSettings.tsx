// src/components/settings/GeneralSettings.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Slider,
  Switch,
  FormControlLabel,
  Snackbar,
  Alert,
  Button,
  CircularProgress
} from '@mui/material';
import { useChannelConfig, ChannelConfig } from '@/hooks/useChannelConfig';
import { useSearchParams } from 'next/navigation';

interface GeneralSettingsProps {
  config: ChannelConfig;
}

export default function GeneralSettings({ config }: GeneralSettingsProps) {
  const searchParams = useSearchParams();
  const channelId = searchParams.get('channelId');
  const { updateConfig, isUpdatingConfig } = useChannelConfig(channelId);

  const [formData, setFormData] = useState(config);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' } | null>(null);

  useEffect(() => {
    setFormData(config);
  }, [config]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };
  
  const handleSliderChange = (event: Event, newValue: number | number[]) => {
    setFormData(prev => ({ ...prev, ai_temperature: newValue as number }));
  };
  
  const handleSaveChanges = () => {
    const payload: Partial<ChannelConfig> = {
        is_bot_active: formData.is_bot_active,
        ai_model: formData.ai_model,
        ai_temperature: formData.ai_temperature,
    };

    updateConfig(payload, {
        onSuccess: () => setSnackbar({ open: true, message: 'Settings saved!', severity: 'success' }),
        onError: (err) => setSnackbar({ open: true, message: `Error: ${err.message}`, severity: 'error' }),
    });
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>General Settings</Typography>
      
      {/* CORRECTED Grid v2 Syntax */}
      <Grid container spacing={3} alignItems="center">
        <Grid size={12}>
           <FormControlLabel
                control={
                    <Switch
                        checked={formData.is_bot_active}
                        onChange={handleChange}
                        name="is_bot_active"
                        color="success"
                    />
                }
                label={formData.is_bot_active ? "Bot is ON" : "Bot is OFF"}
            />
            <Typography variant="caption" display="block" color="text.secondary">
                This is the master switch. If off, the AI will not respond to any messages.
            </Typography>
        </Grid>
        <Grid size={12}>
          <TextField
            name="ai_model"
            label="AI Model"
            value={formData.ai_model}
            onChange={handleChange}
            fullWidth
            required
            size="small"
            helperText="e.g., models/gemini-1.5-flash"
          />
        </Grid>
        <Grid size={12}>
          <Typography gutterBottom variant="body2">AI Temperature: {formData.ai_temperature}</Typography>
          <Slider
            name="ai_temperature"
            value={formData.ai_temperature}
            onChange={handleSliderChange}
            valueLabelDisplay="auto"
            step={0.1}
            marks
            min={0}
            max={1}
          />
        </Grid>
        <Grid size={12} sx={{ textAlign: 'right' }}>
            <Button variant="contained" onClick={handleSaveChanges} disabled={isUpdatingConfig}>
                {isUpdatingConfig ? <CircularProgress size={24} /> : 'Save General Settings'}
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