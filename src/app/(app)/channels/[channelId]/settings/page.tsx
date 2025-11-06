// src/app/(app)/channels/[channelId]/settings/page.tsx
'use client';

import React from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import Link from 'next/link';

// Import all the setting components
import { useChannelConfig } from '@/hooks/useChannelConfig';
import AgentPromptsManager from '@/components/settings/AgentPromptsManager';
import GeneralSettings from '@/components/settings/GeneralSettings';
import KeywordActionsManager from '@/components/settings/KeywordActionsManager';
import ChannelDetails from '@/components/settings/ChannelDetails';
import ContentCollectionsManager from '@/components/settings/ContentCollectionsManager';

// This component displays the settings when a valid channelId is present
function ChannelSettingsDisplay({ channelId }: { channelId: string }) {
  const { data, isLoading, isError, error } = useChannelConfig(channelId);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading channel settings...</Typography>
      </Box>
    );
  }

  if (isError) {
    return <Alert severity="error">Error loading configuration: {error?.message}</Alert>;
  }

  // This check handles the case where data is still null after loading,
  // which can happen if the channel was just created and config hasn't populated yet.
  if (!data) {
    return <Alert severity="info">Configuration for this channel is not yet available. Please try again shortly.</Alert>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mt: 2 }}>
      
      {/* Card 1: Channel Details (Name, Platform ID) */}
      <ChannelDetails channelId={channelId} />
      
      {/* Card 2: General Bot Settings (Master Switch, AI Model, Temperature) */}
      <GeneralSettings config={data.config} />
      
      {/* Card 3: Agent Personas Editor */}
      <AgentPromptsManager prompts={data.prompts} />
      
      {/* Card 4: Keyword Actions & Variables */}
      <KeywordActionsManager keywords={data.keywords} />

      {/* Card 5: Content Collections (e.g., Image URLs for AI) */}
      <ContentCollectionsManager />

    </Box>
  );
}

// This is the main page component
export default function DynamicChannelSettingsPage({ params }: { params: { channelId: string } }) {
  const channelId = params.channelId;

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1">
        Channel Configuration
      </Typography>
      
      <Divider sx={{ my: 2 }} />

      <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
        Manage the AI behavior, automated actions, and content for this specific channel.
      </Typography>
      
      {!channelId ? (
        // This case should rarely be hit due to the file-based routing, but is good practice.
        <Paper sx={{ p: 4, textAlign: 'center', mt: 4 }}>
          <Typography variant="h6">No Channel ID Provided</Typography>
          <Typography color="text.secondary">
            Please return to the <Link href="/channels" style={{ textDecoration: 'underline' }}>Channels page</Link> and select a channel to configure.
          </Typography>
        </Paper>
      ) : (
        <ChannelSettingsDisplay channelId={channelId} />
      )}
    </Container>
  );
}