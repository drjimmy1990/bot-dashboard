// src/components/chat/MessageBubble.tsx
import React from 'react';
import { Box, Paper, Typography, Avatar } from '@mui/material';
import { Message } from '@/lib/api';
import PlatformAvatar from '@/components/ui/PlatformAvatar';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

interface MessageBubbleProps {
  message: Message;
  platform: 'whatsapp' | 'facebook' | 'instagram' | string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, platform }) => {
  const isUser = message.sender_type === 'user';
  const isAgent = message.sender_type === 'agent';
  const isAi = message.sender_type === 'ai';

  const getAvatar = () => {
    if (isUser) return <PlatformAvatar platform={platform} sx={{ width: 32, height: 32 }} />;
    if (isAgent) return <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}><AccountCircleIcon /></Avatar>;
    if (isAi) return <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}><SmartToyIcon /></Avatar>;
    return <Avatar sx={{ width: 32, height: 32 }} />;
  };

  // Define bubble colors for better management
  const userBubbleColor = '#FFFFFF';
  const agentBubbleColor = '#E1F5FE'; // Light blue for agent
  const aiBubbleColor = '#E8F5E9'; // Light green for AI

  const bubbleStyles = {
    p: '8px 12px',
    borderRadius: '18px',
    position: 'relative', // Needed for the tail
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
    maxWidth: '450px',
    wordWrap: 'break-word',
    '&::after': { // This pseudo-element creates the tail
      content: '""',
      position: 'absolute',
      bottom: '0px',
      width: '0px',
      height: '0px',
      border: '10px solid transparent',
    }
  };

  const userBubbleStyles = {
    ...bubbleStyles,
    bgcolor: userBubbleColor,
    borderBottomLeftRadius: '4px',
    '&::after': {
      ...bubbleStyles['&::after'],
      left: '-10px',
      borderRightColor: userBubbleColor,
      borderRightWidth: '12px'
    }
  };

  const sentBubbleStyles = {
    ...bubbleStyles,
    bgcolor: isAi ? aiBubbleColor : agentBubbleColor,
    borderBottomRightRadius: '4px',
    '&::after': {
      ...bubbleStyles['&::after'],
      right: '-10px',
      borderLeftColor: isAi ? aiBubbleColor : agentBubbleColor,
      borderLeftWidth: '12px'
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-start' : 'flex-end',
        mb: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: isUser ? 'row' : 'row-reverse',
          alignItems: 'flex-end', // Align to bottom for better tail placement
          gap: 1.5,
        }}
      >
        {getAvatar()}
        <Paper
          elevation={0} // Using our own shadow
          sx={isUser ? userBubbleStyles : sentBubbleStyles}
        >
          {message.text_content && (
            <Typography variant="body1" sx={{ color: 'text.primary', whiteSpace: 'pre-wrap' }}>{message.text_content}</Typography>
          )}
          {message.content_type === 'image' && message.attachment_url && (
            <Box
              component="img"
              src={message.attachment_url}
              alt="Chat attachment"
              sx={{
                mt: message.text_content ? 1 : 0,
                width: '100%',
                maxWidth: '300px', // Restrict image size
                borderRadius: 2,
                cursor: 'pointer',
              }}
              onClick={() => {
                if (message.attachment_url) {
                  window.open(message.attachment_url, '_blank');
                }
              }}
            />
          )}
          {message.content_type === 'audio' && message.attachment_url && (
            <Box component="audio" controls src={message.attachment_url} sx={{ width: '100%', maxWidth: '250px', mt: 1 }} />
          )}
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              textAlign: 'right',
              mt: 0.5,
              color: 'text.secondary',
              fontSize: '0.7rem' // Smaller timestamp
            }}
          >
            {new Date(message.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default React.memo(MessageBubble);