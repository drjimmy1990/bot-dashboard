// src/app/chat/layout.tsx
'use client';

import { useState } from 'react';
import AppHeader from '@/components/layout/AppHeader'; // Import the header here
import Box from '@mui/material/Box'; // Import Box
import React from 'react';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

  const toggleAdminPanel = () => {
    setIsAdminPanelOpen(prev => !prev);
  };

  // Inject props into the page component (children)
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { isAdminPanelOpen } as any);
    }
    return child;
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* The header is rendered ONLY for the chat layout */}
      <AppHeader onToggleAdminPanel={toggleAdminPanel} isAdminPanelOpen={isAdminPanelOpen} />
      
      {/* The main content area for the chat page */}
      <Box
        sx={{
          flexGrow: 1,
          // We need to account for the header's height
          height: 'calc(100% - 64px)', 
          mt: '64px', // Push content below the fixed header
          p: 3, // Add padding back here
        }}
      >
        {childrenWithProps}
      </Box>
    </Box>
  );
}