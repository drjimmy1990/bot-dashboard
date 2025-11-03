// src/app/page.tsx
'use client'; 

import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import { useRouter } from 'next/navigation';
import ChatIcon from '@mui/icons-material/Chat';
import SettingsIcon from '@mui/icons-material/Settings';
import SimpleHeader from '@/components/layout/SimpleHeader'; // Import SimpleHeader

export default function HomePage() {
  const router = useRouter();

  return (
    <Box>
      <SimpleHeader />
      <Box sx={{ mt: '64px', p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Welcome to the Dashboard
        </Typography>
        {/* ... rest of your home page JSX ... */}
         <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
            Select a section to begin managing your automated communications.
        </Typography>
        <Grid container spacing={3}>
            {/* ... Grid items ... */}
        </Grid>
      </Box>
    </Box>
  );
}