// src/components/settings/ContentCollectionsManager.tsx
'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
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
  IconButton,
  Tooltip
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { supabase } from '@/lib/supabaseClient';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query'; // Import useQueryClient
import { ContentCollection } from '@/hooks/useChannelConfig'; // Import the type

// Props interface for the component
interface ContentCollectionsManagerProps {
  collections: ContentCollection[];
}

// Dialog for adding a new collection
function AddCollectionDialog({ open, onClose, onSubmit, isAdding }: { open: boolean, onClose: () => void, onSubmit: (name: string) => void, isAdding: boolean }) {
    const [name, setName] = useState('');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(name);
    }

    return (
        <Dialog open={open} onClose={onClose} PaperProps={{component: 'form', onSubmit: handleSubmit}} fullWidth maxWidth="xs">
            <DialogTitle>Add New Collection</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    margin="dense"
                    name="name"
                    label="Collection Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                    required
                    helperText="e.g., 'Testimonials' or 'Product Images'"
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={isAdding}>Cancel</Button>
                <Button type="submit" variant="contained" disabled={isAdding || !name.trim()}>
                    {isAdding ? <CircularProgress size={24}/> : "Create"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}


// Main component now receives collections as a prop
export default function ContentCollectionsManager({ collections }: ContentCollectionsManagerProps) {
  const searchParams = useSearchParams();
  const channelId = searchParams.get('channelId');
  const queryClient = useQueryClient(); // Get query client instance

  const [isSaving, setIsSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  const [selectedCollection, setSelectedCollection] = useState<ContentCollection | null>(null);
  const [editText, setEditText] = useState('');
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' } | null>(null);
  
  // All internal data fetching logic (useEffect, fetchCollections) has been removed.

  const handleOpenEditDialog = (collection: ContentCollection) => {
    setSelectedCollection(collection);
    setEditText(collection.items.join('\n'));
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedCollection(null);
    setEditText('');
  };

  const handleSaveChanges = async () => {
    if (!selectedCollection) return;
    setIsSaving(true);
    const updatedItems = editText.split('\n').map(line => line.trim()).filter(line => line);

    const { error } = await supabase
      .from('content_collections')
      .update({ items: updatedItems })
      .eq('id', selectedCollection.id);

    if (error) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
    } else {
      setSnackbar({ open: true, message: 'Collection saved!', severity: 'success' });
      handleCloseEditDialog();
      // Invalidate the main config query to refetch all data for the page
      queryClient.invalidateQueries({ queryKey: ['channelConfig', channelId] });
    }
    setIsSaving(false);
  };

  const handleAddCollection = async (name: string) => {
    if (!channelId) return;
    setIsAdding(true);
    const { error } = await supabase.rpc('create_content_collection', {
        p_channel_id: channelId,
        p_name: name
    });
    
    if (error) {
        setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
    } else {
        setSnackbar({ open: true, message: 'Collection created!', severity: 'success' });
        setIsAddDialogOpen(false);
        // Invalidate the main config query to refetch all data
        queryClient.invalidateQueries({ queryKey: ['channelConfig', channelId] });
    }
    setIsAdding(false);
  };

  return (
    <>
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" gutterBottom sx={{mb: 0}}>Content Collections</Typography>
            <Tooltip title="Add New Collection">
                <IconButton onClick={() => setIsAddDialogOpen(true)} color="primary">
                    <AddCircleOutlineIcon />
                </IconButton>
            </Tooltip>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Manage lists of content, like image URLs, used by your AI agents.
        </Typography>
        <List dense>
          {collections.map(collection => (
            <ListItemButton key={collection.id} onClick={() => handleOpenEditDialog(collection)}>
              <ListItemText primary={collection.name} secondary={`ID: ${collection.collection_id}`} />
            </ListItemButton>
          ))}
          {collections.length === 0 && (
              <Typography color="text.secondary" textAlign="center" sx={{py: 2}}>No collections found. Click the '+' to add one.</Typography>
          )}
        </List>
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onClose={handleCloseEditDialog} fullWidth maxWidth="md">
        <DialogTitle>Edit "{selectedCollection?.name}"</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="Content Items (one per line)" value={editText} onChange={(e) => setEditText(e.target.value)} multiline rows={15} fullWidth variant="outlined" helperText="Enter URLs or text snippets, each on a new line."/>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSaveChanges} variant="contained" disabled={isSaving}>{isSaving ? <CircularProgress size={24} /> : 'Save Collection'}</Button>
        </DialogActions>
      </Dialog>
      
      {/* Add Dialog */}
      <AddCollectionDialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} onSubmit={handleAddCollection} isAdding={isAdding} />

      {snackbar && (
        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(null)}>
          <Alert onClose={() => setSnackbar(null)} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      )}
    </>
  );
}