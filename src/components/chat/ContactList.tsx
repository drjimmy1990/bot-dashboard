// src/components/chat/ContactList.tsx
'use client';

import React, { useState } from 'react';
import { Box, List, ListItem, ListItemButton, ListItemAvatar, ListItemText, Typography, Badge, CircularProgress, TextField, IconButton, InputAdornment, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, Tooltip } from '@mui/material';
import PlatformAvatar from '@/components/ui/PlatformAvatar';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import SearchIcon from '@mui/icons-material/Search';
import { useChannel } from '@/providers/ChannelProvider';
import { useChatContacts } from '@/hooks/useChatContacts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api';

interface ContactListProps {
  selectedContactId: string | null;
  onSelectContact: (id: string) => void;
}

const ContactList: React.FC<ContactListProps> = ({ selectedContactId, onSelectContact }) => {
  const queryClient = useQueryClient();
  const { channels, activeChannel, setActiveChannelId, isLoadingChannels } = useChannel();
  const [searchTerm, setSearchTerm] = useState('');
  const { contacts, isLoadingContacts } = useChatContacts(activeChannel?.id || null, searchTerm);
  const { mutate: toggleAi } = useMutation({ mutationFn: api.toggleAiStatus, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contacts', activeChannel?.id] }); }, });

  const handleChannelChange = (event: SelectChangeEvent<string>) => { setActiveChannelId(event.target.value); };

  return (
    <Box sx={{ width: 320, flexShrink: 0, height: '100%', display: 'flex', flexDirection: 'column', borderRight: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', }}>
      <Box sx={{ p: 2, pb: 1, flexShrink: 0 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Conversations</Typography>
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel id="channel-selector-label">Channel</InputLabel>
          <Select labelId="channel-selector-label" label="Channel" value={activeChannel?.id || ''} onChange={handleChannelChange} disabled={isLoadingChannels}>
            {channels.map((channel) => (<MenuItem key={channel.id} value={channel.id}> <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}> <PlatformAvatar platform={channel.platform} sx={{ width: 24, height: 24 }} /> <Typography variant="body2">{channel.name}</Typography> </Box> </MenuItem>))}
          </Select>
        </FormControl>
        <TextField fullWidth variant="outlined" size="small" placeholder="Search by name or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} InputProps={{ startAdornment: (<InputAdornment position="start"> <SearchIcon /> </InputAdornment>), }} />
      </Box>
      <List sx={{ overflowY: 'auto', flexGrow: 1, overflowX: 'hidden' }}>
        {isLoadingContacts ? (<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}> <CircularProgress /> </Box>) : contacts.length > 0 ? (
          contacts.map((contact) => {
            // --- THIS IS THE FIX ---
            // We extract the complex JSX into a variable. This simplifies the code
            // inside the <ListItem> props and resolves the obscure linter error.
            const secondaryActionContent = (
              <Tooltip title={contact.ai_enabled ? "AI is ON" : "AI is OFF"}>
                <IconButton
                  edge="end"
                  onClick={() => toggleAi({ contactId: contact.id, newStatus: !contact.ai_enabled })}
                >
                  {contact.ai_enabled ? <ToggleOnIcon color="success" /> : <ToggleOffIcon color="action" />}
                </IconButton>
              </Tooltip>
            );

            return (
              <ListItem key={contact.id} disablePadding secondaryAction={secondaryActionContent}>
                <ListItemButton
                  selected={selectedContactId === contact.id}
                  onClick={() => onSelectContact(contact.id)}
                >
                  <ListItemAvatar> <Badge badgeContent={contact.unread_count} color="error"> <PlatformAvatar platform={contact.platform} /> </Badge> </ListItemAvatar>
                  <ListItemText primary={<Typography noWrap>{contact.name || contact.platform_user_id}</Typography>} secondary={<Typography noWrap variant="body2" color="text.secondary">{contact.last_message_preview}</Typography>} />
                </ListItemButton>
              </ListItem>
            );
          })
        ) : (<Typography sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}> {searchTerm ? 'No contacts match your search.' : 'No contacts found in this channel.'} </Typography>)}
      </List>
    </Box>
  );
};

export default React.memo(ContactList);