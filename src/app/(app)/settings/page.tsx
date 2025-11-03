// src/app/(app)/settings/page.tsx
'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Box,
  Typography,
  Container,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import Link from 'next/link';

import { useChannelConfig } from '@/hooks/useChannelConfig';
import AgentPromptsManager from '@/components/settings/AgentPromptsManager';
import GeneralSettings from '@/components/settings/GeneralSettings'; // This import will now work correctly
import KeywordActionsManager from '@/components/settings/KeywordActionsManager';
import ChannelDetails from '@/components/settings/ChannelDetails';
import ContentCollectionsManager from '@/components/settings/ContentCollectionsManager';

function ChannelSettingsDisplay({ channelId }: { channelId: string }) {
  const { data, isLoading, isError, error } = useChannelConfig(channelId);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading settings for channel...</Typography>
      </Box>
    );
  }

  if (isError) {
    // --- FIX IS HERE: Changed error.message to error?.message ---
    return <Alert severity="error">Error loading configuration: {error?.message}</Alert>;
  }

  if (!data) return null;

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' },
        gap: 4 
      }}
    >
      <Box sx={{ width: { xs: '100%', md: '40%' }, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <ChannelDetails channelId={channelId} />
        <GeneralSettings config={data.config} />
        <KeywordActionsManager keywords={data.keywords} />
      </Box>
      
      <Box sx={{ width: { xs: '100%', md: '60%' }, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <AgentPromptsManager prompts={data.prompts} />
        <ContentCollectionsManager />
      </Box>
    </Box>
  );
}

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const channelId = searchParams.get('channelId');

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" component="h1" gutterBottom>
        Channel Settings
      </Typography>
      
      {!channelId ? (
        <Paper sx={{ p: 4, textAlign: 'center', mt: 4 }}>
          <Typography variant="h6">No Channel Selected</Typography>
          <Typography color="text.secondary">
            Please navigate to the <Link href="/channels" style={{ textDecoration: 'underline' }}>Channels page</Link> and click "Configure" on a channel to edit its settings.
          </Typography>
        </Paper>
      ) : (
        <ChannelSettingsDisplay channelId={channelId} />
      )}
    </Container>
  );
}