'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  TextField,
} from '@mui/material';
import { supabase } from '@/lib/supabaseClient';

// This component expects the channelId as a prop
interface ChannelCredentialsManagerProps {
  channelId: string;
}

export default function ChannelCredentialsManager({ channelId }: ChannelCredentialsManagerProps) {
  // We use local state to manage this component's data
  const [credentials, setCredentials] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' } | null>(null);

  // Fetch the credentials when the component loads
  useEffect(() => {
    async function fetchCredentials() {
      setIsLoading(true);
      setError('');
      
      const { data, error } = await supabase
        .from('channels')
        .select('credentials')
        .eq('id', channelId)
        .single();
      
      if (error) {
        setError(error.message);
      } else if (data && data.credentials) {
        // We'll use JSON.stringify to display the JSON object in the text field
        setCredentials(JSON.stringify(data.credentials, null, 2)); // The '2' formats it nicely
      }
      setIsLoading(false);
    }
    fetchCredentials();
  }, [channelId]);

  const handleSave = async () => {
    setIsSaving(true);
    let credentialsToSave;
    
    // Try to parse the text as JSON before saving
    try {
      credentialsToSave = JSON.parse(credentials);
    } catch (e) {
      setSnackbar({ open: true, message: 'Error: Invalid JSON format.', severity: 'error' });
      setIsSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from('channels')
      .update({ credentials: credentialsToSave })
      .eq('id', channelId);

    if (updateError) {
      setSnackbar({ open: true, message: `Error: ${updateError.message}`, severity: 'error' });
    } else {
      setSnackbar({ open: true, message: 'Credentials saved successfully!', severity: 'success' });
    }
    setIsSaving(false);
  };
  
  if (isLoading) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Channel Credentials
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Store sensitive information like API tokens or secrets for this channel's n8n workflows. This data is stored as a secure JSON object.
      </Typography>
      
      <TextField
        label="Credentials (JSON format)"
        value={credentials}
        onChange={(e) => setCredentials(e.target.value)}
        fullWidth
        multiline
        rows={8}
        variant="outlined"
        placeholder={`{\n  "api_key": "your-key",\n  "api_secret": "your-secret"\n}`}
        sx={{ '& .MuiInputBase-input': { fontFamily: 'monospace' } }}
      />
      
      <Box sx={{ textAlign: 'right', mt: 2 }}>
        <Button 
          variant="contained" 
          onClick={handleSave} 
          disabled={isSaving}
        >
          {isSaving ? <CircularProgress size={24} /> : 'Save Credentials'}
        </Button>
      </Box>

      {snackbar && (
        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(null)}>
          <Alert onClose={() => setSnackbar(null)} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      )}
    </Paper>
  );
}