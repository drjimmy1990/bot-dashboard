// src/components/chat/ChatArea.tsx
import React, { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
// --- THIS IS THE FIX ---
// Import Alert from MUI
import { Box, Typography, Paper, CircularProgress, IconButton, Tooltip, Alert } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ChatIcon from '@mui/icons-material/Chat';
import PersonIcon from '@mui/icons-material/Person';
import { Contact, Message } from '@/lib/api';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

type ContactWithClient = Contact & {
  crm_clients: { id: string } | null; // Adjusted to match the direct query result
}

interface ChatAreaProps {
  contactId: string | null;
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
  const router = useRouter();
  const [messageText, setMessageText] = useState('');
  const scrollableContainerRef = useRef<null | HTMLDivElement>(null);

  const { data: contact, isLoading: isLoadingContact } = useQuery<ContactWithClient>({
    queryKey: ['contact-details', contactId],
    queryFn: async () => {
      const { data: directData, error: directError } = await supabase
        .from('contacts')
        .select('*, crm_clients!contact_id(id)')
        .eq('id', contactId!)
        .single();
      
      if (directError) throw new Error(directError.message);

      // The result of a single() join is an object, not an array.
      // We need to reshape it slightly to match our expected type.
      const reshapedData = {
          ...directData,
          crm_clients: directData.crm_clients ? { id: (directData.crm_clients as any).id } : null
      };

      return reshapedData as ContactWithClient;
    },
    enabled: !!contactId,
  });

  const scrollToBottom = () => { if (scrollableContainerRef.current) { scrollableContainerRef.current.scrollTop = scrollableContainerRef.current.scrollHeight; } };
  useEffect(() => { scrollToBottom(); }, [messages]);
  useEffect(() => { setMessageText(''); }, [contactId]);

  const handleSend = () => { if (messageText.trim() && contact) { onSendMessage(messageText, contact.platform); setMessageText(''); } };
  const handleDelete = () => { if (contactId && window.confirm("Are you sure you want to delete this contact and all their messages? This action cannot be undone.")) { onDeleteContact(contactId); } };

  const handleViewProfile = () => {
    if (contact && contact.crm_clients?.id) {
      router.push(`/clients/${contact.crm_clients.id}`);
    }
  };

  if (!contactId) {
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
  
  if (isLoadingContact) {
      return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>
  }
  
  if (!contact) return <Alert severity="error">Could not load contact details.</Alert>;

  return (
    <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      <Box sx={{ p: 1, pl: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <Box>
            <Typography variant="h6" component="div">{contact.name || 'Unknown Contact'}</Typography>
            <Typography variant="body2" color="text.secondary">{contact.platform_user_id}</Typography>
        </Box>
        <Box>
            <Tooltip title="View CRM Profile">
              <span>
                <IconButton onClick={handleViewProfile} disabled={!contact.crm_clients?.id} aria-label="view profile">
                  <PersonIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Delete Contact">
              <IconButton onClick={handleDelete} color="error" aria-label="delete contact"><DeleteIcon /></IconButton>
            </Tooltip>
        </Box>
      </Box>

      <Box ref={scrollableContainerRef} sx={{ flexGrow: 1, overflowY: 'auto', p: 3, }} className="chat-background" >
        {isLoadingMessages ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
        ) : (
          messages.map((msg) => ( <MessageBubble key={msg.id} message={msg} platform={contact.platform} /> ))
        )}
      </Box>
      
      <Box sx={{ flexShrink: 0 }}>
        <MessageInput value={messageText} onChange={(e) => setMessageText(e.target.value)} onSendText={handleSend} onSendImageByUrl={(url) => onSendImageByUrl(url, contact.platform)} disabled={isLoadingMessages} isSending={isSendingMessage} />
      </Box>
    </Box>
  );
};

export default ChatArea;