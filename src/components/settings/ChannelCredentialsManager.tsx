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
  IconButton,
  Divider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { supabase } from '@/lib/supabaseClient';

// This component expects the channelId as a prop
interface ChannelCredentialsManagerProps {
  channelId: string;
}

interface CredentialField {
  key: string;
  value: string;
}

export default function ChannelCredentialsManager({ channelId }: ChannelCredentialsManagerProps) {
  // We use local state to manage this component's data
  const [fields, setFields] = useState<CredentialField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' | 'info' } | null>(null);

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
        // Parse the JSON object into an array of fields
        try {
          const credentialsObj = typeof data.credentials === 'string'
            ? JSON.parse(data.credentials)
            : data.credentials;

          if (credentialsObj && typeof credentialsObj === 'object' && !Array.isArray(credentialsObj)) {
            const newFields = Object.entries(credentialsObj).map(([key, value]) => ({
              key,
              value: String(value), // Ensure value is a string
            }));
            setFields(newFields);
          } else {
            // If it's not a valid object (e.g. null or array), start with empty or handle gracefully
            setFields([]);
          }
        } catch (e) {
          console.error("Failed to parse credentials", e);
          setFields([]);
        }
      }
      setIsLoading(false);
    }
    fetchCredentials();
  }, [channelId]);

  const handleFieldChange = (index: number, field: 'key' | 'value', newValue: string) => {
    const newFields = [...fields];
    newFields[index][field] = newValue;
    setFields(newFields);
  };

  const handleAddField = () => {
    setFields([...fields, { key: '', value: '' }]);
  };

  const handleDeleteField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index);
    setFields(newFields);
  };

  const handleSave = async () => {
    setIsSaving(true);

    // Convert array of fields back to JSON object
    const credentialsToSave: Record<string, string> = {};
    let hasEmptyKeys = false;

    fields.forEach((field) => {
      if (field.key.trim()) {
        credentialsToSave[field.key.trim()] = field.value;
      } else {
        // If key is empty but value exists, we might want to warn, but for now we just skip or flag
        if (field.value) hasEmptyKeys = true;
      }
    });

    if (hasEmptyKeys) {
      setSnackbar({ open: true, message: 'Warning: Fields with empty keys were ignored.', severity: 'warning' });
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
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage the API keys and secrets for this channel. Add key-value pairs below.
      </Typography>

      <Box sx={{ mb: 3 }}>
        {fields.map((field, index) => (
          <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'flex-start' }}>
            <TextField
              label="Key"
              value={field.key}
              onChange={(e) => handleFieldChange(index, 'key', e.target.value)}
              variant="outlined"
              size="small"
              sx={{ flex: 1 }}
              placeholder="e.g. api_key"
            />
            <TextField
              label="Value"
              value={field.value}
              onChange={(e) => handleFieldChange(index, 'value', e.target.value)}
              variant="outlined"
              size="small"
              sx={{ flex: 1 }}
              placeholder="e.g. 12345abcde"
              type="text"
            />
            <IconButton onClick={() => handleDeleteField(index)} color="error" size="small" sx={{ mt: 0.5 }}>
              <DeleteIcon />
            </IconButton>
          </Box>
        ))}

        {fields.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 2 }}>
            No credentials added yet.
          </Typography>
        )}

        <Button
          startIcon={<AddIcon />}
          onClick={handleAddField}
          variant="outlined"
          size="small"
        >
          Add Field
        </Button>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ textAlign: 'right' }}>
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