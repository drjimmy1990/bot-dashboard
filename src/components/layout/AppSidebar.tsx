// src/components/layout/AppSidebar.tsx
'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import SettingsIcon from '@mui/icons-material/Settings';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import HomeIcon from '@mui/icons-material/Home';

const DRAWER_WIDTH = 240;

const menuItems = [
  { text: 'Home', href: '/', icon: <HomeIcon /> },
  { text: 'Chat', href: '/chat', icon: <ChatIcon /> },
  { text: 'Settings', href: '/settings', icon: <SettingsIcon /> },
  { text: 'Analytics', href: '/analytics', icon: <AnalyticsIcon />, disabled: true }, // Disabled for now
];

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: DRAWER_WIDTH, boxSizing: 'border-box' },
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <Tooltip title={item.disabled ? `${item.text} (Coming Soon)` : item.text} placement="right">
                {/* The div is necessary for the Tooltip to work on a disabled component */}
                <div> 
                  <ListItemButton
                    component={Link}
                    href={item.href}
                    selected={pathname === item.href}
                    disabled={item.disabled}
                    sx={{
                      // Custom styling for selected item
                      '&.Mui-selected': {
                        backgroundColor: 'action.selected',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      },
                    }}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </div>
              </Tooltip>
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
}