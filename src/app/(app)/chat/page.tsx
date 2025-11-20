// src/app/(app)/chat/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import ContactList from "@/components/chat/ContactList";
import ChatArea from "@/components/chat/ChatArea";
import { useChannel } from '@/providers/ChannelProvider';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api';

export default function ChatPage() {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const { activeChannel } = useChannel();
  const queryClient = useQueryClient();

  // --- RESTORED MUTATION for deleting a contact ---
  const { mutate: deleteContact } = useMutation({
    mutationFn: api.deleteContact,
    onSuccess: (data, contactId) => {
        queryClient.invalidateQueries({ queryKey: ['contacts', activeChannel?.id] });
        queryClient.removeQueries({ queryKey: ['messages', contactId] });
        setSelectedContactId(null); // Deselect contact after deletion
    }
  });

  // --- RESTORED MESSAGE HOOK ---
  const { messages, isLoadingMessages, sendMessage, isSendingMessage } = useChatMessages(
    selectedContactId,
    activeChannel?.id || null,
    activeChannel?.organization_id || null
  );

  // When the active channel changes, deselect the current contact
  useEffect(() => {
    setSelectedContactId(null);
  }, [activeChannel?.id]);

  // --- RESTORED MESSAGE SENDING HANDLERS ---
  const handleSendMessage = (text: string, platform: string) => {
    if (!selectedContactId) return;
    sendMessage({
        contact_id: selectedContactId,
        content_type: 'text',
        text_content: text,
        platform: platform,
    });
  }

  const handleSendImageByUrl = (url: string, platform: string) => {
    if (!selectedContactId) return;
    sendMessage({
        contact_id: selectedContactId,
        content_type: 'image',
        attachment_url: url, 
        platform: platform,
    });
  }

  return (
    <Box sx={{ display: 'flex', height: '100%', width: '100%' }}>
      {/* --- THIS IS THE FIX --- */}
      {/* We now pass the required props to ContactList */}
      <ContactList
        selectedContactId={selectedContactId}
        onSelectContact={setSelectedContactId}
      />

      <Box sx={{ flexGrow: 1, position: 'relative' }}>
        {/* We also pass the required props to ChatArea */}
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
  );
}