// src/components/chat/ContactList.tsx
import React, { useState, useMemo } from 'react';
import { Box, List, ListItem, ListItemButton, ListItemAvatar, ListItemText, Typography, Badge, CircularProgress, TextField, IconButton, InputAdornment, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import PlatformAvatar from '@/components/ui/PlatformAvatar';
import { Contact } from '@/lib/api';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import SearchIcon from '@mui/icons-material/Search';
import { useChannel } from '@/providers/ChannelProvider'; // <-- 1. IMPORT THE CHANNEL HOOK

interface ContactListProps {
  contacts: Contact[];
  isLoading: boolean;
  selectedContactId: string | null;
  onSelectContact: (id: string) => void;
  onUpdateName: (params: { contactId: string, newName: string }) => void;
  onToggleAi: (params: { contactId: string, newStatus: boolean }) => void;
}

const ContactList: React.FC<ContactListProps> = ({
  contacts,
  isLoading,
  selectedContactId,
  onSelectContact,
  onUpdateName,
  onToggleAi,
}) => {
  // 2. GET CHANNEL STATE AND CONTROLS
  const { channels, activeChannel, setActiveChannelId, isLoadingChannels } = useChannel();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleEditClick = (e: React.MouseEvent, contact: Contact) => {
    e.stopPropagation();
    setEditingId(contact.id);
    setEditingName(contact.name || '');
  };

  const handleSaveName = (contactId: string) => {
    onUpdateName({ contactId, newName: editingName });
    setEditingId(null);
  };
  
  // 3. This handler now updates the GLOBAL active channel ID
  const handleChannelChange = (event: SelectChangeEvent<string>) => {
    setActiveChannelId(event.target.value);
  };

  const displayedContacts = useMemo(() => {
    return contacts.filter(contact => 
      (!searchTerm) ||
      (contact.name && contact.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      contact.platform_user_id.includes(searchTerm)
    );
  }, [contacts, searchTerm]);

  // Use the isLoading from props (for contacts), not the one from the context (for channels)
  if (isLoading) {
    return (
      <Box sx={{ width: 320, p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: 320,
        flexShrink: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid', // Add border to separate from chat area
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ p: 2, pb: 1, flexShrink: 0 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Contacts</Typography>
        
        {/* 4. THE NEW CHANNEL SELECTOR */}
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel id="channel-selector-label">Channel</InputLabel>
          <Select
            labelId="channel-selector-label"
            label="Channel"
            value={activeChannel?.id || ''}
            onChange={handleChannelChange}
            disabled={isLoadingChannels}
          >
            {channels.length === 0 ? (
                <MenuItem disabled value="">No channels found</MenuItem>
            ) : (
              channels.map((channel) => (
                <MenuItem key={channel.id} value={channel.id}>
                  {/* 5. ADDING THE LOGO AND NAME */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <PlatformAvatar platform={channel.platform} sx={{ width: 24, height: 24 }} />
                    <Typography variant="body2">{channel.name}</Typography>
                  </Box>
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      <List sx={{ overflowY: 'auto', flexGrow: 1, overflowX: 'hidden' }}>
        {displayedContacts.length > 0 ? (
          displayedContacts.map((contact) => (
            <ListItem key={contact.id} disablePadding secondaryAction={
              <IconButton edge="end" onClick={() => onToggleAi({ contactId: contact.id, newStatus: !contact.ai_enabled })}>
                  {contact.ai_enabled ? <ToggleOnIcon color="success" /> : <ToggleOffIcon color="action" />}
              </IconButton>
            }>
              <ListItemButton
                selected={selectedContactId === contact.id}
                onClick={() => onSelectContact(contact.id)}
              >
                <ListItemAvatar>
                  <Badge badgeContent={contact.unread_count} color="error">
                    {/* The PlatformAvatar here is correct as it's for the specific contact */}
                    <PlatformAvatar platform={contact.platform} />
                  </Badge>
                </ListItemAvatar>
                {editingId === contact.id ? (
                   <TextField
                      variant="standard"
                      size="small"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.key === 'Enter' ? handleSaveName(contact.id) : e.key === 'Escape' && setEditingId(null)}
                      InputProps={{
                          endAdornment: (<IconButton size="small" onClick={(e) => { e.stopPropagation(); handleSaveName(contact.id); }}><CheckIcon fontSize="small" /></IconButton>)
                      }}
                      autoFocus
                    />
                ) : (
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography noWrap>{contact.name || contact.platform_user_id}</Typography>
                          <IconButton size="small" sx={{ opacity: 0.5, '&:hover': { opacity: 1 } }} onClick={(e) => handleEditClick(e, contact)}><EditIcon fontSize="small" /></IconButton>
                      </Box>
                    }
                    secondary={<Typography noWrap variant="body2" color="text.secondary">{contact.last_message_preview}</Typography>}
                  />
                )}
              </ListItemButton>
            </ListItem>
          ))
        ) : (
          <Typography sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
            No contacts found in this channel.
          </Typography>
        )}
      </List>
    </Box>
  );
};

export default React.memo(ContactList);