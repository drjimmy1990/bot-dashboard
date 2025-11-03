// src/components/layout/AppHeader.tsx
'use client';
import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Link from 'next/link'; // Import the Next.js Link component
import SettingsIcon from '@mui/icons-material/Settings';
import { IconButton, Tooltip } from '@mui/material';

interface AppHeaderProps {
  onToggleAdminPanel: () => void;
  isAdminPanelOpen: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({ onToggleAdminPanel, isAdminPanelOpen }) => {
  return (
    <AppBar position="static" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <Link href="/" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
            BOT Dashboard
          </Link>
        </Typography>

        {/* NEW SETTINGS BUTTON */}
        <Tooltip title="Settings">
          <IconButton component={Link} href="/settings" color="inherit">
            <SettingsIcon />
          </IconButton>
        </Tooltip>

        <Button color="inherit" onClick={onToggleAdminPanel}>
          {isAdminPanelOpen ? 'Hide Actions' : 'Show Actions'}
        </Button>
      </Toolbar>
    </AppBar>
  );
}

export default AppHeader;