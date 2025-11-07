// src/components/chat/ChatArea.tsx
import React, { useRef, useEffect, useState } from 'react';
import { Box, Typography, Paper, CircularProgress, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ChatIcon from '@mui/icons-material/Chat';
import { Contact, Message } from '@/lib/api';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

interface ChatAreaProps {
  contactId: string | null; // Changed from 'contact' object to just the ID
  messages: Message[];
  isLoadingMessages: boolean;
  onSendMessage: (text: string, platform: string) => void;
  onSendImageByUrl: (url: string, platform: string) => void;
  isSendingMessage: boolean;
  onDeleteContact: (id: string) => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({
  contactId,
  messages,
  isLoadingMessages,
  onSendMessage,
  onSendImageByUrl,
  isSendingMessage,
  onDeleteContact,
}) => {
  const [messageText, setMessageText] = useState('');
  const scrollableContainerRef = useRef<null | HTMLDivElement>(null);

  // Fetch the contact details based on the ID
  const { data: contact, isLoading: isLoadingContact } = useQuery<Contact>({
    queryKey: ['contact-details', contactId],
    queryFn: async () => {
        const { data, error } = await supabase.from('contacts').select('*').eq('id', contactId!).single();
        if (error) throw new Error(error.message);
        return data;
    },
    enabled: !!contactId,
  });


  const scrollToBottom = () => {
    if (scrollableContainerRef.current) {
        scrollableContainerRef.current.scrollTop = scrollableContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  useEffect(() => {
    setMessageText('');
  }, [contactId]);

  const handleSend = () => {
    if (messageText.trim() && contact) {
      onSendMessage(messageText, contact.platform);
      setMessageText('');
    }
  };

  const handleDelete = () => {
    if (contactId && window.confirm("Are you sure you want to delete this contact and all their messages? This action cannot be undone.")) {
        onDeleteContact(contactId);
    }
  };

  if (!contactId || isLoadingContact) {
    return (
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3, bgcolor: 'background.default' }}>
        {isLoadingContact ? <CircularProgress /> : (
            <Paper elevation={0} sx={{ p: 4, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'transparent' }}>
                <ChatIcon sx={{ fontSize: 60, color: 'text.secondary' }} />
                <Typography variant="h5">Select a Conversation</Typography>
                <Typography color="text.secondary">Choose a contact from the list on the left to view their messages.</Typography>
            </Paper>
        )}
      </Box>
    );
  }
  
  if (!contact) return null; // Or some error state

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ p: 1, pl: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <Box>
            <Typography variant="h6" component="div">{contact.name || 'Unknown Contact'}</Typography>
            <Typography variant="body2" color="text.secondary">{contact.platform_user_id}</Typography>
        </Box>
        <IconButton onClick={handleDelete} color="error" aria-label="delete contact"><DeleteIcon /></IconButton>
      </Box>

      <Box ref={scrollableContainerRef} sx={{ flexGrow: 1, overflowY: 'auto', p: 3, }} className="chat-background" >
        {isLoadingMessages ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} platform={contact.platform} />
          ))
        )}
      </Box>
      
      <Box sx={{ flexShrink: 0 }}>
        <MessageInput
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onSendText={handleSend}
          onSendImageByUrl={(url) => onSendImageByUrl(url, contact.platform)}
          disabled={isLoadingMessages}
          isSending={isSendingMessage}
        />
      </Box>
    </Box>
  );
};

export default ChatArea;