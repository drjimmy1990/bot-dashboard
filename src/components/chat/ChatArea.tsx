// src/components/chat/ChatArea.tsx
import React, { useRef, useEffect, useState } from 'react';
import { Box, Typography, Paper, CircularProgress, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ChatIcon from '@mui/icons-material/Chat'; // Import the new icon
import { Contact, Message } from '@/lib/api';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

interface ChatAreaProps {
  contact: Contact | undefined;
  messages: Message[];
  isLoadingMessages: boolean;
  onSendMessage: (text: string) => void;
  onSendImageByUrl: (url: string) => void;
  isSendingMessage: boolean;
  onDeleteContact: (id: string) => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({
  contact,
  messages,
  isLoadingMessages,
  onSendMessage,
  onSendImageByUrl,
  isSendingMessage,
  onDeleteContact,
}) => {
  const [messageText, setMessageText] = useState('');
  const scrollableContainerRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollableContainerRef.current) {
        scrollableContainerRef.current.scrollTop = scrollableContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Clear the input field when the contact changes
  useEffect(() => {
    setMessageText('');
  }, [contact?.id]);

  const handleSend = () => {
    if (messageText.trim()) {
      onSendMessage(messageText);
      setMessageText('');
    }
  };

  const handleDelete = () => {
    if (contact && window.confirm("Are you sure you want to delete this contact and all their messages? This action cannot be undone.")) {
        onDeleteContact(contact.id);
    }
  };

  // --- THIS IS THE FIX ---
  // The "no contact selected" view is now enhanced.
  if (!contact) {
    return (
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3, bgcolor: 'background.default' }}>
        <Paper elevation={0} sx={{ p: 4, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'transparent' }}>
            <ChatIcon sx={{ fontSize: 60, color: 'text.secondary' }} />
            <Typography variant="h5">Select a Conversation</Typography>
            <Typography color="text.secondary">Choose a contact from the list on the left to view their messages.</Typography>
        </Paper>
      </Box>
    );
  }

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
      {/* Header of the chat area */}
      <Box sx={{ 
          p: 1, pl: 2, 
          borderBottom: '1px solid', 
          borderColor: 'divider', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexShrink: 0
      }}>
        <Box>
            <Typography variant="h6" component="div">
                {contact.name || 'Unknown Contact'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
                {contact.platform_user_id}
            </Typography>
        </Box>
        <IconButton onClick={handleDelete} color="error" aria-label="delete contact">
          <DeleteIcon />
        </IconButton>
      </Box>

      {/* Scrollable message container */}
      <Box
        ref={scrollableContainerRef}
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: 3,
        }}
        className="chat-background"
      >
        {isLoadingMessages ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} platform={contact.platform} />
          ))
        )}
      </Box>
      
      {/* Message input area */}
      <Box sx={{ flexShrink: 0 }}>
        <MessageInput
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onSendText={handleSend}
          onSendImageByUrl={onSendImageByUrl}
          disabled={isLoadingMessages}
          isSending={isSendingMessage}
        />
      </Box>
    </Box>
  );
};

export default ChatArea;