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
import { useChannelConfig, ContentCollection } from '@/hooks/useChannelConfig'; // Import the hook
// REMOVED: No longer need useSearchParams or supabase client directly

// --- THIS IS A FIX ---
// The component now expects a channelId to be passed in as a prop.
interface ContentCollectionsManagerProps {
  collections: ContentCollection[];
  channelId: string;
}

// Dialog for adding a new collection (No changes needed here)
function AddCollectionDialog({ open, onClose, onSubmit, isAdding }: { open: boolean, onClose: () => void, onSubmit: (name: string) => void, isAdding: boolean }) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(name);
    setName(''); // Reset form
  }

  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ component: 'form', onSubmit: handleSubmit }} fullWidth maxWidth="xs">
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
          {isAdding ? <CircularProgress size={24} /> : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}


// --- THIS IS THE MAIN FIX ---
// The component now receives and uses the channelId from its props.
export default function ContentCollectionsManager({ collections, channelId }: ContentCollectionsManagerProps) {
  // REMOVED: The broken useSearchParams logic is gone.

  // The hook now receives the correct channelId, and we get all mutation functions from it.
  const { addCollection, isAddingCollection, updateCollection, isUpdatingCollection } = useChannelConfig(channelId);

  const [selectedCollection, setSelectedCollection] = useState<ContentCollection | null>(null);
  const [editText, setEditText] = useState('');

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' } | null>(null);

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
    const updatedItems = editText.split('\n').map(line => line.trim()).filter(line => line);

    updateCollection({ id: selectedCollection.id, items: updatedItems }, {
      onSuccess: () => {
        setSnackbar({ open: true, message: 'Collection saved!', severity: 'success' });
        handleCloseEditDialog();
      },
      onError: (err) => setSnackbar({ open: true, message: `Error: ${err.message}`, severity: 'error' }),
    });
  };

  const handleAddCollection = async (name: string) => {
    addCollection({ name }, {
      onSuccess: () => {
        setSnackbar({ open: true, message: 'Collection created!', severity: 'success' });
        setIsAddDialogOpen(false);
      },
      onError: (err) => setSnackbar({ open: true, message: `Error: ${err.message}`, severity: 'error' }),
    });
  };

  return (
    <>
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>Content Collections</Typography>
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
            <Typography color="text.secondary" textAlign="center" sx={{ py: 2 }}>No collections found. Click the &apos;+&apos; to add one.</Typography>
          )}
        </List>
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onClose={handleCloseEditDialog} fullWidth maxWidth="md">
        <DialogTitle>Edit &quot;{selectedCollection?.name}&quot;</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="Content Items (one per line)" value={editText} onChange={(e) => setEditText(e.target.value)} multiline rows={15} fullWidth variant="outlined" helperText="Enter URLs or text snippets, each on a new line." />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} disabled={isUpdatingCollection}>Cancel</Button>
          <Button onClick={handleSaveChanges} variant="contained" disabled={isUpdatingCollection}>{isUpdatingCollection ? <CircularProgress size={24} /> : 'Save Collection'}</Button>
        </DialogActions>
      </Dialog>

      {/* Add Dialog */}
      <AddCollectionDialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} onSubmit={handleAddCollection} isAdding={isAddingCollection} />

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