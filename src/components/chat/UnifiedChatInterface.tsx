// src/components/chat/UnifiedChatInterface.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Box, Paper, Typography, IconButton, Tooltip, Button } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import Link from 'next/link';
import ContactList from './ContactList';
import ChatArea from './ChatArea';
import { useChannel } from '@/providers/ChannelProvider';
import { useChatContacts } from '@/hooks/useChatContacts';
import { useChatMessages } from '@/hooks/useChatMessages';

export default function UnifiedChatInterface() {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [isContactListOpen, setContactListOpen] = useState(true);
  const toggleContactList = () => setContactListOpen(prev => !prev);
  
  const { activeChannel } = useChannel();
  
  const { contacts, isLoadingContacts, updateName, toggleAi, deleteContact } = useChatContacts(activeChannel?.id || null);
  
  const { messages, isLoadingMessages, sendMessage, isSendingMessage } = useChatMessages(
    selectedContactId,
    activeChannel?.id || null,
    activeChannel?.organization_id || null
  );
  
  const selectedContact = useMemo(() => {
    return contacts.find((c) => c.id === selectedContactId);
  }, [contacts, selectedContactId]);

  useEffect(() => {
    if (selectedContactId && !contacts.find(c => c.id === selectedContactId)) {
        setSelectedContactId(null);
    }
  }, [contacts, selectedContactId]);

  useEffect(() => {
    setSelectedContactId(null);
  }, [activeChannel?.id]);

  const handleSendMessage = (text: string) => {
    if (!selectedContact) return;
    sendMessage({
        contact_id: selectedContact.id,
        content_type: 'text',
        text_content: text,
        platform: selectedContact.platform,
    });
  }

  const handleSendImageByUrl = (url: string) => {
    if (!selectedContact) return;
    sendMessage({
        contact_id: selectedContact.id,
        content_type: 'image',
        attachment_url: url, 
        platform: selectedContact.platform,
    });
  }

  // This empty state handles when NO CHANNEL is selected at all.
  if (!activeChannel) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Paper sx={{ p: 4, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <QuestionAnswerIcon sx={{ fontSize: 60, color: 'text.secondary' }} />
                <Typography variant="h5">No Channel Selected</Typography>
                <Typography color="text.secondary">
                    Please select a channel from the list, or create one to begin.
                </Typography>
                <Button component={Link} href="/channels" variant="contained">
                    Manage Channels
                </Button>
            </Paper>
        </Box>
    );
  }
  
  // --- THIS IS THE FIX ---
  // The old "No Contacts Found" logic block that was here has been REMOVED.
  // This component will now ALWAYS render the main chat layout if a channel is active.
  
  return (
    <Box sx={{ display: 'flex', height: '100%', width: '100%' }}>
      <Box
        sx={{
          width: isContactListOpen ? 320 : 0,
          overflow: 'hidden',
          flexShrink: 0,
          transition: 'width 0.3s ease-in-out',
          height: '100%',
        }}
      >
        <ContactList
          contacts={contacts}
          isLoading={isLoadingContacts}
          selectedContactId={selectedContactId}
          onSelectContact={setSelectedContactId}
          onUpdateName={updateName}
          onToggleAi={toggleAi}
        />
      </Box>

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ p: 0.5, backgroundColor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
            <Tooltip title={isContactListOpen ? "Hide Contacts" : "Show Contacts"}>
                <IconButton onClick={toggleContactList}>
                    {isContactListOpen ? <MenuOpenIcon /> : <MenuIcon />}
                </IconButton>
            </Tooltip>
        </Box>
        <Box sx={{ flexGrow: 1, position: 'relative' }}>
          <ChatArea
            contact={selectedContact}
            messages={messages}
            isLoadingMessages={isLoadingMessages}
            onSendMessage={handleSendMessage}
            onSendImageByUrl={handleSendImageByUrl}
            isSendingMessage={isSendingMessage}
            onDeleteContact={deleteContact}
          />
        </Box>
      </Box>
    </Box>
  );
}