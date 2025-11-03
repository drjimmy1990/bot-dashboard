// src/components/channels/ChannelForm.tsx
'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid, // Grid import is correct
  CircularProgress,
  SelectChangeEvent, // Import the correct event type for Select
} from '@mui/material';
import { NewChannelPayload } from '@/hooks/useChannels';

interface ChannelFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (channelData: NewChannelPayload) => void;
  isSubmitting: boolean;
}

const initialState: NewChannelPayload = {
  name: '',
  platform: 'whatsapp',
  platform_channel_id: '',
};

export default function ChannelForm({ open, onClose, onSubmit, isSubmitting }: ChannelFormProps) {
  const [formData, setFormData] = useState<NewChannelPayload>(initialState);

  // Correctly typed handler for TextField
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name as string]: value }));
  };
  
  // Correctly typed handler for Select
  const handleSelectChange = (e: SelectChangeEvent) => {
      const { name, value } = e.target;
      setFormData(prev => ({...prev, [name]: value as 'whatsapp' | 'facebook' | 'instagram' }));
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };
  
  const handleClose = () => {
      onClose();
      setTimeout(() => setFormData(initialState), 300);
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" PaperProps={{ component: 'form', onSubmit: handleSubmit }}>
      <DialogTitle>Add New Channel</DialogTitle>
      <DialogContent>
        {/* --- GRID FIX IS HERE --- */}
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid size={12}>
            <TextField
              name="name"
              label="Channel Name"
              value={formData.name}
              onChange={handleTextChange} // Use correct handler
              fullWidth
              required
              autoFocus
              helperText="A friendly name for this channel, e.g., 'Main Clinic WhatsApp'."
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth required>
              <InputLabel>Platform</InputLabel>
              <Select
                name="platform"
                value={formData.platform}
                label="Platform"
                onChange={handleSelectChange} // Use correct handler
              >
                <MenuItem value="whatsapp">WhatsApp</MenuItem>
                <MenuItem value="facebook">Facebook</MenuItem>
                <MenuItem value="instagram">Instagram</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              name="platform_channel_id"
              label="Platform Channel ID"
              value={formData.platform_channel_id}
              onChange={handleTextChange} // Use correct handler
              fullWidth
              required
              helperText="e.g., WhatsApp Phone Number ID."
            />
          </Grid>
        </Grid>
        {/* --- END OF GRID FIX --- */}
      </DialogContent>
      <DialogActions sx={{ p: '0 24px 16px' }}>
        <Button onClick={handleClose} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? <CircularProgress size={24} /> : 'Add Channel'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}