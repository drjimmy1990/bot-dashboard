// src/app/page.tsx
'use client';
import React, { useState } from 'react';
import AppHeader from "@/components/layout/AppHeader";
import UnifiedChatInterface from "@/components/chat/UnifiedChatInterface";
import { Box } from "@mui/material";

export default function HomePage() {
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

  const toggleAdminPanel = () => {
    setIsAdminPanelOpen(prev => !prev);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <AppHeader onToggleAdminPanel={toggleAdminPanel} isAdminPanelOpen={isAdminPanelOpen} />
      <UnifiedChatInterface isAdminPanelOpen={isAdminPanelOpen} />
    </Box>
  );
}