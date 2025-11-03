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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState<'all' | 'whatsapp' | 'facebook' | 'instagram'>('all');

  const handleEditClick = (e: React.MouseEvent, contact: Contact) => {
    e.stopPropagation();
    setEditingId(contact.id);
    setEditingName(contact.name || '');
  };

  const handleSaveName = (contactId: string) => {
    onUpdateName({ contactId, newName: editingName });
    setEditingId(null);
  };
  
  const handlePlatformChange = (event: SelectChangeEvent<'all' | 'whatsapp' | 'facebook' | 'instagram'>) => {
    setPlatformFilter(event.target.value as 'all' | 'whatsapp' | 'facebook' | 'instagram');
  };

  // This memoized value will now re-calculate if contacts, searchTerm, or platformFilter change
  const displayedContacts = useMemo(() => {
    const searched = contacts.filter(contact => 
      (!searchTerm) || // Return all if no search term
      (contact.name && contact.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      contact.platform_user_id.includes(searchTerm)
    );
    
    if (platformFilter === 'all') {
      return searched;
    }

    return searched.filter(contact => contact.platform === platformFilter);

  }, [contacts, searchTerm, platformFilter]);

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
        transition: 'width 0.3s ease-in-out',
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ p: 2, pb: 1, flexShrink: 0 }}>
        <Typography variant="h6" sx={{ mb: 2, whiteSpace: 'nowrap' }}>Contacts</Typography>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 2 }} // Add margin bottom
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        {/* --- MODIFICATION IS HERE: Platform Filter Dropdown --- */}
        <FormControl fullWidth size="small">
          <InputLabel id="platform-filter-label">Platform</InputLabel>
          <Select
            labelId="platform-filter-label"
            value={platformFilter}
            label="Platform"
            onChange={handlePlatformChange}
          >
            <MenuItem value="all">All Platforms</MenuItem>
            <MenuItem value="whatsapp">WhatsApp</MenuItem>
            <MenuItem value="facebook">Facebook</MenuItem>
            <MenuItem value="instagram">Instagram</MenuItem>
          </Select>
        </FormControl>
        {/* --- END MODIFICATION --- */}
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
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveName(contact.id)
                        } else if (e.key === 'Escape') {
                          setEditingId(null);
                        }
                      }}
                      InputProps={{
                          endAdornment: (
                              <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleSaveName(contact.id); }}>
                                  <CheckIcon fontSize="small" />
                              </IconButton>
                          )
                      }}
                      autoFocus
                    />
                ) : (
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography noWrap>{contact.name || contact.platform_user_id}</Typography>
                          <IconButton size="small" sx={{ opacity: 0.5, '&:hover': { opacity: 1 } }} onClick={(e) => handleEditClick(e, contact)}>
                              <EditIcon fontSize="small" />
                          </IconButton>
                      </Box>
                    }
                    secondary={
                      <Typography noWrap variant="body2" color="text.secondary">
                        {contact.last_message_preview}
                      </Typography>
                    }
                  />
                )}
              </ListItemButton>
            </ListItem>
          ))
        ) : (
          <Typography sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
            No contacts match filters.
          </Typography>
        )}
      </List>
    </Box>
  );
};

export default React.memo(ContactList);