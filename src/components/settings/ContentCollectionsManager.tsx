// src/components/settings/ContentCollectionsManager.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import { supabase } from '@/lib/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';

// This component will manage its own data for simplicity,
// as it's a distinct piece of functionality.
interface ContentCollection {
  id: string;
  name: string;
  collection_id: string;
  items: string[]; // We'll assume items is an array of strings (URLs)
}

export default function ContentCollectionsManager() {
  const searchParams = useSearchParams();
  const channelId = searchParams.get('channelId');
  const queryClient = useQueryClient();

  const [collections, setCollections] = useState<ContentCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<ContentCollection | null>(null);
  const [editText, setEditText] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!channelId) return;

    async function fetchCollections() {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('content_collections')
        .select('id, name, collection_id, items')
        .eq('channel_id', channelId);
      
      if (data) {
        setCollections(data as ContentCollection[]);
      }
      setIsLoading(false);
    }
    fetchCollections();
  }, [channelId]);

  const handleOpenDialog = (collection: ContentCollection) => {
    setSelectedCollection(collection);
    // Join the array of URLs into a single string with newlines for editing
    setEditText(collection.items.join('\n'));
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedCollection(null);
    setEditText('');
  };

  const handleSaveChanges = async () => {
    if (!selectedCollection) return;

    setIsSaving(true);
    // Split the text area content back into an array of strings, trimming whitespace
    const updatedItems = editText.split('\n').map(line => line.trim()).filter(line => line);

    const { error } = await supabase
      .from('content_collections')
      .update({ items: updatedItems })
      .eq('id', selectedCollection.id);

    if (error) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
    } else {
      setSnackbar({ open: true, message: 'Collection saved!', severity: 'success' });
      handleCloseDialog();
      // Refetch the collections list to show the updated data
      queryClient.invalidateQueries({ queryKey: ['content_collections', channelId] });
      // We also need to refetch the main channel config in case n8n uses this data
      queryClient.invalidateQueries({ queryKey: ['channelConfig', channelId] });
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <Paper sx={{ p: 2, textAlign: 'center' }}>
        <CircularProgress size={20} />
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Content Collections</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Manage lists of content, like testimonial image URLs, used by your AI agents.
      </Typography>
      <List dense>
        {collections.map(collection => (
          <ListItemButton key={collection.id} onClick={() => handleOpenDialog(collection)}>
            <ListItemText primary={collection.name} secondary={`ID: ${collection.collection_id}`} />
          </ListItemButton>
        ))}
        {collections.length === 0 && (
            <Typography color="text.secondary" textAlign="center" sx={{py: 2}}>No content collections found.</Typography>
        )}
      </List>

      <Dialog open={isDialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="md">
        <DialogTitle>Edit "{selectedCollection?.name}"</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Content Items (one per line)"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            multiline
            rows={15}
            fullWidth
            variant="outlined"
            helperText="Enter URLs or text snippets, each on a new line."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSaveChanges} variant="contained" disabled={isSaving}>
            {isSaving ? <CircularProgress size={24} /> : 'Save Collection'}
          </Button>
        </DialogActions>
      </Dialog>
      
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