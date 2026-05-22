// src/components/chat/ChatArea.tsx
import React, { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, Paper, CircularProgress, IconButton, Tooltip, Alert, Snackbar } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ChatIcon from '@mui/icons-material/Chat';
import PersonIcon from '@mui/icons-material/Person';
import { Contact, Message } from '@/lib/api';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useMediaUpload, getContentTypeFromMime } from '@/hooks/useMediaUpload';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';

type ContactWithClient = Contact & {
  crm_clients: { id: string } | null; // Adjusted to match the direct query result
  channels: { platform_channel_id: string } | null;
}

interface ChatAreaProps {
  contactId: string | null;
  channelPlatformId: string | null; // The real Facebook Page ID / WA number
  messages: Message[];
  isLoadingMessages: boolean;
  onSendMessage: (text: string, platform: string, platformUserId: string, platformChannelId: string) => void;
  onSendImageByUrl: (url: string, platform: string, platformUserId: string, platformChannelId: string) => void;
  onSendMedia: (params: {
    platform: string;
    platform_user_id: string;
    platform_channel_id: string;
    content_type: 'image' | 'audio' | 'video' | 'document';
    attachment_url: string;
    attachment_metadata?: {
      mime_type?: string;
      file_size?: number;
      duration_seconds?: number;
      file_name?: string;
    };
  }) => void;
  isSendingMessage: boolean;
  onDeleteContact: (id: string) => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({
  contactId,
  channelPlatformId,
  messages,
  isLoadingMessages,
  onSendMessage,
  onSendImageByUrl,
  onSendMedia,
  isSendingMessage,
  onDeleteContact,
}) => {
  const router = useRouter();
  const [messageText, setMessageText] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });
  const scrollableContainerRef = useRef<null | HTMLDivElement>(null);

  // Media upload hook
  const { uploadFile, isUploading, uploadProgress, error: uploadError } = useMediaUpload();

  // Voice recorder hook
  const {
    isRecording, duration: recordingDuration,
    startRecording, stopRecording, cancelRecording,
    error: recorderError,
  } = useVoiceRecorder();

  const { data: contact, isLoading: isLoadingContact } = useQuery<ContactWithClient>({
    queryKey: ['contact-details', contactId],
    queryFn: async () => {
      const { data: directData, error: directError } = await supabase
        .from('contacts')
        .select('*, crm_clients!contact_id(id), channels!channel_id(platform_channel_id)')
        .eq('id', contactId!)
        .single();

      if (directError) throw new Error(directError.message);

      // The result of a single() join is an object, not an array.
      // We need to reshape it slightly to match our expected type.
      const reshapedData = {
        ...directData,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        crm_clients: directData.crm_clients ? { id: (directData.crm_clients as any).id } : null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        channels: directData.channels ? { platform_channel_id: (directData.channels as any).platform_channel_id } : null,
      };

      return reshapedData as ContactWithClient;
    },
    enabled: !!contactId,
  });

  const scrollToBottom = () => { if (scrollableContainerRef.current) { scrollableContainerRef.current.scrollTop = scrollableContainerRef.current.scrollHeight; } };
  useEffect(() => { scrollToBottom(); }, [messages]);
  useEffect(() => { setMessageText(''); }, [contactId]);

  // Show errors as snackbar
  useEffect(() => {
    if (uploadError) {
      setSnackbar({ open: true, message: uploadError, severity: 'error' });
    }
  }, [uploadError]);
  useEffect(() => {
    if (recorderError) {
      setSnackbar({ open: true, message: recorderError, severity: 'error' });
    }
  }, [recorderError]);

  const handleSend = () => {
    if (messageText.trim() && contact) {
      onSendMessage(messageText, contact.platform, contact.platform_user_id, channelPlatformId || contact.channel_id);
      setMessageText('');
    }
  };

  const handleDelete = () => {
    if (contactId && window.confirm("Are you sure you want to delete this contact and all their messages? This action cannot be undone.")) {
      onDeleteContact(contactId);
    }
  };

  const handleViewProfile = () => {
    if (contact && contact.crm_clients?.id) {
      router.push(`/clients/${contact.crm_clients.id}`);
    }
  };

  // File upload handler
  const handleFileUpload = async (file: File) => {
    if (!contact) return;

    try {
      const result = await uploadFile(file, contact.channel_id);
      const contentType = getContentTypeFromMime(file.type);

      onSendMedia({
        platform: contact.platform,
        platform_user_id: contact.platform_user_id,
        platform_channel_id: channelPlatformId || contact.channel_id,
        content_type: contentType,
        attachment_url: result.url,
        attachment_metadata: {
          mime_type: result.mimeType,
          file_size: result.fileSize,
          file_name: result.fileName,
        },
      });

      setSnackbar({ open: true, message: 'File sent successfully!', severity: 'success' });
    } catch {
      // Error is already set via the hook's error state
    }
  };

  // Voice recording handler
  const handleStopRecording = async () => {
    if (!contact) return;

    const blob = await stopRecording();
    if (!blob) return;

    try {
      // Create a File from the Blob
      const extension = blob.type.includes('webm') ? 'webm' : blob.type.includes('mp4') ? 'm4a' : 'ogg';
      const fileName = `voice_${Date.now()}.${extension}`;
      const file = new File([blob], fileName, { type: blob.type });

      const result = await uploadFile(file, contact.channel_id);

      onSendMedia({
        platform: contact.platform,
        platform_user_id: contact.platform_user_id,
        platform_channel_id: channelPlatformId || contact.channel_id,
        content_type: 'audio',
        attachment_url: result.url,
        attachment_metadata: {
          mime_type: result.mimeType,
          file_size: result.fileSize,
          duration_seconds: recordingDuration,
          file_name: result.fileName,
        },
      });

      setSnackbar({ open: true, message: 'Voice message sent!', severity: 'success' });
    } catch {
      // Error handled by hook
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
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>;
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
          messages.map((msg) => (<MessageBubble key={msg.id} message={msg} platform={contact.platform} />))
        )}
      </Box>

      <Box sx={{ flexShrink: 0 }}>
        <MessageInput
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onSendText={handleSend}
          onSendImageByUrl={(url) => onSendImageByUrl(url, contact.platform, contact.platform_user_id, contact.channel_id)}
          onSendFileUpload={handleFileUpload}
          onSendVoice={() => { /* Handled via onStopRecording */ }}
          disabled={isLoadingMessages}
          isSending={isSendingMessage}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          isRecording={isRecording}
          recordingDuration={recordingDuration}
          onStartRecording={startRecording}
          onStopRecording={handleStopRecording}
          onCancelRecording={cancelRecording}
        />
      </Box>

      {/* Error/Success Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ChatArea;