// src/components/chat/ChatArea.tsx
import React, { useRef, useEffect, useState } from 'react';
import { Box, Typography, Paper, CircularProgress, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
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
    if (contact && window.confirm("Are you sure you want to delete this contact and all their messages?")) {
        onDeleteContact(contact.id);
    }
  };

  if (!contact) {
    return (
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5">Welcome to the Dashboard</Typography>
          <Typography color="text.secondary">Select a contact to start chatting.</Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        // THIS IS THE KEY CHANGE
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header of the chat area */}
      <Box sx={{ 
          p: 1, pl: 2, 
          backgroundColor: 'background.paper', 
          borderBottom: '1px solid', 
          borderColor: 'divider', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexShrink: 0 // Prevent header from shrinking
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

      {/* This is the scrollable message container */}
      <Box
        ref={scrollableContainerRef}
        sx={{
          flexGrow: 1, // Make it take up all available vertical space
          overflowY: 'auto', // ONLY this box will scroll vertically if content overflows
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
      
      {/* The message input area */}
      <Box sx={{ flexShrink: 0 }}> {/* Prevent input from shrinking */}
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