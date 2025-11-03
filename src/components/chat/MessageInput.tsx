// src/components/chat/MessageInput.tsx
import React, { useState } from 'react';
import { Box, TextField, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachmentIcon from '@mui/icons-material/Attachment';

interface MessageInputProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSendText: () => void;
  onSendImageByUrl: (url: string) => void; // New prop for sending image URL
  disabled: boolean;
  isSending: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ value, onChange, onSendText, onSendImageByUrl, disabled, isSending }) => {
  const [isUrlDialogOpen, setIsUrlDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (value.trim()) {
        onSendText();
      }
    }
  };
  
  const handleOpenUrlDialog = () => setIsUrlDialogOpen(true);
  const handleCloseUrlDialog = () => {
    setIsUrlDialogOpen(false);
    setImageUrl(''); // Reset on close
  };

  const handleSendUrl = () => {
    if (imageUrl.trim()) {
      onSendImageByUrl(imageUrl);
      handleCloseUrlDialog();
    }
  };

  return (
    <>
      <Box
        sx={{
          p: 2,
          backgroundColor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <IconButton onClick={handleOpenUrlDialog} disabled={disabled || isSending}>
          <AttachmentIcon />
        </IconButton>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type your message..."
          size="small"
          value={value}
          onChange={onChange}
          onKeyPress={handleKeyPress}
          disabled={disabled || isSending}
          multiline
          maxRows={4}
        />
        <IconButton
          color="primary"
          onClick={onSendText}
          disabled={disabled || isSending || !value.trim()}
        >
          <SendIcon />
        </IconButton>
      </Box>

      {/* Dialog for sending image by URL */}
      <Dialog open={isUrlDialogOpen} onClose={handleCloseUrlDialog} fullWidth maxWidth="sm">
        <DialogTitle>Send Image by URL</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Image URL"
            type="url"
            fullWidth
            variant="standard"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            onKeyPress={(e) => {
                if (e.key === 'Enter') {
                    handleSendUrl();
                }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUrlDialog}>Cancel</Button>
          <Button onClick={handleSendUrl} disabled={!imageUrl.trim()}>Send Image</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MessageInput;