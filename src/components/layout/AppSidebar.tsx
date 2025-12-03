// src/components/layout/AppSidebar.tsx
'use client';

import React from 'react';
import { styled, Theme, CSSObject } from '@mui/material/styles';
import MuiDrawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUI } from '@/providers/UIProvider';
import HomeIcon from '@mui/icons-material/Home';
import ChatIcon from '@mui/icons-material/Chat';
import SettingsIcon from '@mui/icons-material/Settings';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import DnsIcon from '@mui/icons-material/Dns';
// --- THIS IS THE MODIFICATION ---
import PeopleIcon from '@mui/icons-material/People'; // Import the new icon

const drawerWidth = 240;

const menuItems = [
  { text: 'Home', href: '/', icon: <HomeIcon /> },
  { text: 'Chat', href: '/chat', icon: <ChatIcon /> },
  // --- THIS IS THE MODIFICATION ---
  // Add the new "Clients" link to navigate to our CRM dashboard.
  { text: 'Clients', href: '/clients', icon: <PeopleIcon /> },
  { text: 'Channels', href: '/channels', icon: <DnsIcon /> },
  { text: 'Settings', href: '/settings', icon: <SettingsIcon /> },
  { text: 'Analytics', href: '/analytics', icon: <AnalyticsIcon /> },
];

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && {
      ...openedMixin(theme),
      '& .MuiDrawer-paper': openedMixin(theme),
    }),
    ...(!open && {
      ...closedMixin(theme),
      '& .MuiDrawer-paper': closedMixin(theme),
    }),
  }),
);

export default function AppSidebar() {
  const { isSidebarOpen, toggleSidebar } = useUI();
  const pathname = usePathname();

  return (
    <Drawer variant="permanent" open={isSidebarOpen}>
      <DrawerHeader>
        <IconButton onClick={toggleSidebar}>
          <ChevronLeftIcon />
        </IconButton>
      </DrawerHeader>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              component={Link}
              href={item.href}
              selected={pathname.startsWith(item.href) && item.href !== '/'}
              // Special case for home page to avoid it always being selected
              {...(item.href === '/' && { selected: pathname === '/' })}
              sx={{ minHeight: 48, justifyContent: isSidebarOpen ? 'initial' : 'center', px: 2.5 }}
            >
              <ListItemIcon sx={{ minWidth: 0, mr: isSidebarOpen ? 3 : 'auto', justifyContent: 'center' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} sx={{ opacity: isSidebarOpen ? 1 : 0 }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}