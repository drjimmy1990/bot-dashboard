// src/app/(app)/page.tsx
'use client';

import React from 'react';
import { Box, Typography, Grid, Card, CardActionArea } from '@mui/material';
import { useRouter } from 'next/navigation';
import ChatIcon from '@mui/icons-material/Chat';
import DnsIcon from '@mui/icons-material/Dns';

export default function HomePage() {
  const router = useRouter();

  const sections = [
    {
      title: 'Chat Interface',
      description: 'View and manage live conversations with your contacts.',
      icon: <ChatIcon fontSize="large" color="primary" />,
      path: '/chat'
    },
    {
      title: 'Channel Management',
      description: 'Add, configure, and manage your communication channels.',
      icon: <DnsIcon fontSize="large" color="primary" />,
      path: '/channels'
    }
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome to the Dashboard
      </Typography>

      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        Select a section to begin managing your automated communications.
      </Typography>

      <Grid container spacing={3}>
        {sections.map((section) => (
          <Grid size={{ xs: 12, md: 6 }} key={section.title}>
            <Card sx={{ height: '100%' }}>
              <CardActionArea
                sx={{ p: 2, height: '100%', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 3 }}
                onClick={() => router.push(section.path)}
              >
                {section.icon}
                <Box>
                  <Typography variant="h6" component="div">
                    {section.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {section.description}
                  </Typography>
                </Box>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}