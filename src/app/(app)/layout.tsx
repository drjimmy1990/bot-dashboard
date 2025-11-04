// src/app/(app)/layout.tsx
'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import AppSidebar from '@/components/layout/AppSidebar';
import AppHeader from '@/components/layout/AppHeader';

// getPageTitle is no longer needed in the header, we can remove it.

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Determine if padding should be applied. No padding for the chat page.
  const applyPadding = !pathname.startsWith('/chat');

  return (
    <Box sx={{ display: 'flex' }}>
      <AppHeader /> 
      <AppSidebar />
      
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          // Conditionally apply padding
          p: applyPadding ? 3 : 0, 
          width: '100%',
          // Ensure the main content area itself has a fixed height
          height: '100vh',
          overflow: 'hidden', // Prevent this main box from ever scrolling
        }}
      >
        <Box sx={(theme) => ({ ...theme.mixins.toolbar })} /> 
        {/* This Box will contain the actual page content and manage its height */}
        <Box sx={{ height: 'calc(100% - 64px)', width: '100%' }}>
            {children}
        </Box>
      </Box>
    </Box>
  );
}