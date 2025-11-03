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
  Divider,
} from '@mui/material';
import Link from 'next/link';

// Import all our components
import { useChannelConfig } from '@/hooks/useChannelConfig';
import AgentPromptsManager from '@/components/settings/AgentPromptsManager';
import GeneralSettings from '@/components/settings/GeneralSettings';
import KeywordActionsManager from '@/components/settings/KeywordActionsManager';
import ChannelDetails from '@/components/settings/ChannelDetails';
import ContentCollectionsManager from '@/components/settings/ContentCollectionsManager';

// This component now handles the polished single-column layout
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
    return <Alert severity="error">Error loading configuration: {error?.message}</Alert>;
  }

  if (!data) return null;

  return (
    // We use a Box with flexbox to stack the cards vertically with a consistent gap
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mt: 2 }}>
      
      {/* Card 1: Channel Details */}
      <ChannelDetails channelId={channelId} />
      
      {/* Card 2: General Bot Settings */}
      <GeneralSettings config={data.config} />
      
      {/* Card 3: Agent Personas Editor */}
      <AgentPromptsManager prompts={data.prompts} />
      
      {/* Card 4: Keyword Actions */}
      <KeywordActionsManager keywords={data.keywords} />

      {/* Card 5: Content Collections */}
      <ContentCollectionsManager />

    </Box>
  );
}

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const channelId = searchParams.get('channelId');

  return (
    // Use a smaller container for a more focused look
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1">
        Channel Settings
      </Typography>
      
      <Divider sx={{ my: 2 }} />
      
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