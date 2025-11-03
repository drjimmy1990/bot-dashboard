// src/app/(app)/page.tsx
'use client'; 
    
import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import { useRouter } from 'next/navigation';
import ChatIcon from '@mui/icons-material/Chat';
import SettingsIcon from '@mui/icons-material/Settings';

export default function HomePage() {
  const router = useRouter();

  return (
    <Box>
      {/* THIS IS THE LINE TO REMOVE/COMMENT OUT */}
      {/* <Typography variant="h4" gutterBottom>Welcome to the Dashboard</Typography> */}
      
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        Select a section to begin managing your automated communications.
      </Typography>
    
      <Grid container spacing={3}>
          {/* ... Grid items ... */}
      </Grid>
    </Box>
  );
}