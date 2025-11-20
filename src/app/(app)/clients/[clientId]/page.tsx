// src/app/(app)/clients/[clientId]/page.tsx
'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Box, Container, CircularProgress, Alert, Typography, Breadcrumbs } from '@mui/material';
import Link from 'next/link';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

import { useClient } from '@/hooks/useClient';
import ClientHeader from '@/components/crm/ClientHeader';
import ClientTabs from '@/components/crm/ClientTabs';

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.clientId as string;

  const { clientData, isLoading, isError, error } = useClient(clientId);

  // Main content renderer
  const renderContent = () => {
    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading client data...</Typography>
        </Box>
      );
    }

    if (isError) {
      return (
        <Alert severity="error" sx={{ mt: 3 }}>
          <Typography>Error loading client data: {error?.message}</Typography>
        </Alert>
      );
    }

    if (!clientData) {
      return (
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography>Client not found. They may have been deleted.</Typography>
        </Alert>
      );
    }

    return (
      <>
        {/* Pass the main client record to the header */}
        <ClientHeader client={clientData.client} />
        
        {/* Pass all fetched data to the tabs component */}
        <ClientTabs
          client={clientData.client}
          contact={clientData.contact}
          notes={clientData.notes}
          activities={clientData.activities}
        />
      </>
    );
  };

  return (
    <Container maxWidth="xl">
      {/* Breadcrumbs for easy navigation */}
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link href="/clients" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Typography sx={{ '&:hover': { textDecoration: 'underline' } }}>Clients</Typography>
        </Link>
        <Typography color="text.primary">
          {isLoading ? 'Loading...' : clientData?.client.company_name || clientData?.client.email || 'Client Details'}
        </Typography>
      </Breadcrumbs>

      {renderContent()}
    </Container>
  );
}