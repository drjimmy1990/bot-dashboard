// src/providers/ChannelProvider.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useChannels, Channel } from '@/hooks/useChannels';
import { CircularProgress, Box, Typography } from '@mui/material';

// 1. Define the shape of the context data
interface ChannelContextType {
  channels: Channel[];
  activeChannel: Channel | null;
  setActiveChannelId: (id: string) => void;
  isLoadingChannels: boolean;
}

// 2. Create the context with a default value
const ChannelContext = createContext<ChannelContextType | undefined>(undefined);

// 3. Create the Provider component
export function ChannelProvider({ children }: { children: ReactNode }) {
  const { channels, isLoading: isLoadingChannels } = useChannels();
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);

  // Effect to set a default active channel when channels are loaded
  useEffect(() => {
    // If we don't have an active channel yet, but the channels have loaded
    // and there is at least one channel, set the first one as active.
    if (!activeChannelId && !isLoadingChannels && channels.length > 0) {
      setActiveChannelId(channels[0].id);
    }
  }, [channels, isLoadingChannels, activeChannelId]);

  // Memoize the activeChannel object to prevent unnecessary re-renders
  const activeChannel = React.useMemo(() => {
    return channels.find(c => c.id === activeChannelId) || null;
  }, [channels, activeChannelId]);


  const value = {
    channels,
    activeChannel,
    setActiveChannelId,
    isLoadingChannels,
  };
  
  // Optional: Show a loading screen while fetching initial channels
  // to prevent layout shifts or components trying to access null data.
  if (isLoadingChannels) {
      return (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
              <CircularProgress />
              <Typography sx={{ml: 2}}>Loading channel data...</Typography>
          </Box>
      )
  }

  return <ChannelContext.Provider value={value}>{children}</ChannelContext.Provider>;
}

// 4. Create a custom hook for easy access to the context
export function useChannel() {
  const context = useContext(ChannelContext);
  if (context === undefined) {
    throw new Error('useChannel must be used within a ChannelProvider');
  }
  return context;
}