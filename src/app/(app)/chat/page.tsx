// src/app/(app)/chat/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
// --- THIS IS THE FIX ---
// Import IconButton, Tooltip, and the necessary icons
import { Box, IconButton, Tooltip } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';

import ContactList from "@/components/chat/ContactList";
import ChatArea from "@/components/chat/ChatArea";
import { useChannel } from '@/providers/ChannelProvider';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api';

export default function ChatPage() {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  // --- THIS IS THE FIX ---
  // Add state to manage the visibility of the contact list
  const [isContactListOpen, setContactListOpen] = useState(true);
  const toggleContactList = () => setContactListOpen(prev => !prev);

  const { activeChannel } = useChannel();
  const queryClient = useQueryClient();

  const { mutate: deleteContact } = useMutation({
    mutationFn: api.deleteContact,
    onSuccess: (data, contactId) => {
      queryClient.invalidateQueries({ queryKey: ['contacts', activeChannel?.id] });
      queryClient.removeQueries({ queryKey: ['messages', contactId] });
      setSelectedContactId(null);
    }
  });

  const { messages, isLoadingMessages, sendMessage, isSendingMessage } = useChatMessages(
    selectedContactId,
    activeChannel?.id || null,
    activeChannel?.organization_id || null
  );

  useEffect(() => {
    setSelectedContactId(null);
  }, [activeChannel?.id]);

  const handleSendMessage = (text: string, platform: string) => {
    if (!selectedContactId) return;
    sendMessage({ contact_id: selectedContactId, content_type: 'text', text_content: text, platform: platform });
  }

  const handleSendImageByUrl = (url: string, platform: string) => {
    if (!selectedContactId) return;
    sendMessage({ contact_id: selectedContactId, content_type: 'image', attachment_url: url, platform: platform });
  }

  return (
    <Box sx={{ display: 'flex', height: '100%', width: '100%' }}>
      {/* --- THIS IS THE FIX --- */}
      {/* This Box now controls the width of the contact list based on state */}
      <Box
        sx={{
          width: isContactListOpen ? 320 : 0,
          overflow: 'hidden',
          flexShrink: 0,
          transition: 'width 0.2s ease-in-out',
          height: '100%',
        }}
      >
        <ContactList
          selectedContactId={selectedContactId}
          onSelectContact={setSelectedContactId}
        />
      </Box>

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* --- THIS IS THE FIX --- */}
        {/* A small header bar is added to contain the toggle button */}
        <Box sx={{ p: 0.5, backgroundColor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0, height: '49px' }}>
          <Tooltip title={isContactListOpen ? "Hide Contacts" : "Show Contacts"}>
            <IconButton onClick={toggleContactList}>
              {isContactListOpen ? <MenuOpenIcon /> : <MenuIcon />}
            </IconButton>
          </Tooltip>
        </Box>
        <Box sx={{ flexGrow: 1, position: 'relative' }}>
          <ChatArea
            contactId={selectedContactId}
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