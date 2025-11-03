// src/app/(app)/layout.tsx
'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import AppSidebar from '@/components/layout/AppSidebar';
import AppHeader from '@/components/layout/AppHeader';

const getPageTitle = (pathname: string): string => {
  if (pathname.startsWith('/chat')) return 'Chat Interface';
  if (pathname.startsWith('/settings')) return 'Settings';
  if (pathname.startsWith('/analytics')) return 'Analytics';
  return 'Home';
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <Box sx={{ display: 'flex' }}>
      <AppHeader title={title} />
      <AppSidebar />
      
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: '100%' }}>
        <Box sx={(theme) => ({ ...theme.mixins.toolbar })} />
        {children}
      </Box>
    </Box>
  );
}