// src/components/crm/tabs/EmbeddedChatView.tsx
'use client';

import React from 'react';
import { Box } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useChatMessages } from '@/hooks/useChatMessages';
import ChatArea from '@/components/chat/ChatArea'; // We will reuse the existing component
import * as api from '@/lib/api';
import { Contact } from '@/lib/api';

interface EmbeddedChatViewProps {
  contact: Contact;
  organizationId: string;
}

export default function EmbeddedChatView({ contact, organizationId }: EmbeddedChatViewProps) {
  const queryClient = useQueryClient();

  // The useChatMessages hook does all the heavy lifting for fetching and sending messages
  const { messages, isLoadingMessages, sendMessage, isSendingMessage } = useChatMessages(
    contact.id,
    contact.channel_id,
    organizationId
  );

  // The delete mutation is needed by ChatArea
  const { mutate: deleteContact } = useMutation({
    mutationFn: api.deleteContact,
    onSuccess: (data, contactId) => {
        queryClient.invalidateQueries({ queryKey: ['contacts', contact.channel_id] });
        queryClient.invalidateQueries({ queryKey: ['client', contact.crm_clients?.[0]?.id] }); // Refresh client page
        queryClient.removeQueries({ queryKey: ['messages', contactId] });
        // After deletion, we can't do much here, the parent page will show the contact is gone.
    }
  });

  const handleSendMessage = (text: string, platform: string) => {
    sendMessage({
        contact_id: contact.id,
        content_type: 'text',
        text_content: text,
        platform: platform,
    });
  };

  const handleSendImageByUrl = (url: string, platform: string) => {
    sendMessage({
        contact_id: contact.id,
        content_type: 'image',
        attachment_url: url,
        platform: platform,
    });
  };

  return (
    <Box sx={{ height: '75vh', width: '100%', position: 'relative' }}>
      <ChatArea
        contactId={contact.id}
        messages={messages}
        isLoadingMessages={isLoadingMessages}
        onSendMessage={handleSendMessage}
        onSendImageByUrl={handleSendImageByUrl}
        isSendingMessage={isSendingMessage}
        onDeleteContact={deleteContact}
      />
    </Box>
  );
}