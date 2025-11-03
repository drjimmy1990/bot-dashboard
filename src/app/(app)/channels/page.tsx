// src/app/(app)/channels/page.tsx
'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Alert,
  Snackbar,
  IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import Link from 'next/link';

import { useChannels } from '@/hooks/useChannels';
import ChannelForm from '@/components/channels/ChannelForm';
import PlatformAvatar from '@/components/ui/PlatformAvatar';

export default function ChannelsPage() {
  const { channels, isLoading, isError, error, addChannel, isAdding } = useChannels();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' } | null>(null);


  const handleAddChannel = (channelData: any) => {
    addChannel(channelData, {
      onSuccess: () => {
        setIsFormOpen(false);
        setSnackbar({ open: true, message: 'Channel added successfully!', severity: 'success' });
      },
      onError: (err) => {
        setSnackbar({ open: true, message: `Error: ${err.message}`, severity: 'error' });
      },
    });
  };

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading Channels...</Typography>
      </Container>
    );
  }

  if (isError) {
    return (
      <Container maxWidth="md">
        <Alert severity="error">
          Failed to load channels: {error?.message}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Channel Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Add, view, and configure your communication channels.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsFormOpen(true)}
        >
          Add Channel
        </Button>
      </Box>

      <Paper>
        <List>
          {channels.map((channel) => (
            <ListItem
              key={channel.id}
              secondaryAction={
                <Button
                  component={Link}
                  href={`/settings?channelId=${channel.id}`} // Link to the settings page for this channel
                  startIcon={<SettingsIcon />}
                  aria-label="settings"
                  size="small"
                >
                  Configure
                </Button>
              }
            >
              <ListItemIcon>
                <PlatformAvatar platform={channel.platform} />
              </ListItemIcon>
              <ListItemText
                primary={channel.name}
                secondary={`ID: ${channel.platform_channel_id}`}
              />
            </ListItem>
          ))}
           {channels.length === 0 && (
            <ListItem>
                <ListItemText primary="No channels found." secondary="Click 'Add Channel' to get started." sx={{textAlign: 'center', py: 4}} />
            </ListItem>
           )}
        </List>
      </Paper>

      <ChannelForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleAddChannel}
        isSubmitting={isAdding}
      />
      
      {snackbar && (
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setSnackbar(null)} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      )}
    </Container>
  );
}