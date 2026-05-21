// src/components/settings/ContentCollectionsManager.tsx
'use client';

import React, { useState } from 'react';
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
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useChannelConfig, ContentCollection } from '@/hooks/useChannelConfig';

interface ContentCollectionsManagerProps {
  collections: ContentCollection[];
  channelId: string;
}

// Dialog for adding a new collection
function AddCollectionDialog({ open, onClose, onSubmit, isAdding }: { open: boolean, onClose: () => void, onSubmit: (name: string, collectionId: string) => void, isAdding: boolean }) {
  const [name, setName] = useState('');
  const [collectionId, setCollectionId] = useState('');

  // Auto-generate collection_id from name
  const handleNameChange = (val: string) => {
    setName(val);
    // Only auto-set if user hasn't manually edited the ID
    if (!collectionId || collectionId === name.toLowerCase().replace(/\s+/g, '_')) {
      setCollectionId(val.toLowerCase().replace(/\s+/g, '_'));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(name, collectionId);
    setName('');
    setCollectionId('');
  };

  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ component: 'form', onSubmit: handleSubmit }} fullWidth maxWidth="xs">
      <DialogTitle>Add New Collection</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Collection Name"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          fullWidth
          required
          helperText="Display name, e.g. 'Testimonials'"
        />
        <TextField
          margin="dense"
          label="Collection ID"
          value={collectionId}
          onChange={(e) => setCollectionId(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
          fullWidth
          required
          helperText="Used by n8n to pick this collection, e.g. 'testimonials_1'"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isAdding}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={isAdding || !name.trim() || !collectionId.trim()}>
          {isAdding ? <CircularProgress size={24} /> : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Confirm delete dialog
function ConfirmDeleteDialog({ open, name, onClose, onConfirm, isDeleting }: { open: boolean; name: string; onClose: () => void; onConfirm: () => void; isDeleting: boolean }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs">
      <DialogTitle>Delete Collection</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to delete <strong>&quot;{name}&quot;</strong>? This cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isDeleting}>Cancel</Button>
        <Button onClick={onConfirm} color="error" variant="contained" disabled={isDeleting}>
          {isDeleting ? <CircularProgress size={24} /> : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}


export default function ContentCollectionsManager({ collections, channelId }: ContentCollectionsManagerProps) {
  const { addCollection, isAddingCollection, updateCollection, isUpdatingCollection, deleteCollection, isDeletingCollection } = useChannelConfig(channelId);

  const [selectedCollection, setSelectedCollection] = useState<ContentCollection | null>(null);
  const [editText, setEditText] = useState('');
  const [editName, setEditName] = useState('');
  const [editCollectionId, setEditCollectionId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ContentCollection | null>(null);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' } | null>(null);

  const handleOpenEditDialog = (collection: ContentCollection) => {
    setSelectedCollection(collection);
    setEditText(collection.items.join('\n'));
    setEditName(collection.name);
    setEditCollectionId(collection.collection_id);
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedCollection(null);
    setEditText('');
    setEditName('');
    setEditCollectionId('');
  };

  const handleSaveChanges = async () => {
    if (!selectedCollection) return;
    const updatedItems = editText.split('\n').map(line => line.trim()).filter(line => line);

    updateCollection({ id: selectedCollection.id, items: updatedItems, name: editName, collection_id: editCollectionId }, {
      onSuccess: () => {
        setSnackbar({ open: true, message: 'Collection saved!', severity: 'success' });
        handleCloseEditDialog();
      },
      onError: (err) => setSnackbar({ open: true, message: `Error: ${err.message}`, severity: 'error' }),
    });
  };

  const handleAddCollection = async (name: string, collectionId: string) => {
    addCollection({ name, collectionId }, {
      onSuccess: () => {
        setSnackbar({ open: true, message: 'Collection created!', severity: 'success' });
        setIsAddDialogOpen(false);
      },
      onError: (err) => setSnackbar({ open: true, message: `Error: ${err.message}`, severity: 'error' }),
    });
  };

  const handleDeleteCollection = () => {
    if (!deleteTarget) return;
    deleteCollection(deleteTarget.id, {
      onSuccess: () => {
        setSnackbar({ open: true, message: 'Collection deleted!', severity: 'success' });
        setDeleteTarget(null);
      },
      onError: (err) => {
        setSnackbar({ open: true, message: `Error: ${err.message}`, severity: 'error' });
        setDeleteTarget(null);
      },
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
          Manage lists of content, like image URLs, used by your AI agents. The <strong>Collection ID</strong> is what n8n uses to pick the right collection.
        </Typography>
        <List dense>
          {collections.map(collection => (
            <ListItem
              key={collection.id}
              disablePadding
              secondaryAction={
                <Box>
                  <Tooltip title="Edit Items">
                    <IconButton edge="end" size="small" onClick={() => handleOpenEditDialog(collection)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Collection">
                    <IconButton edge="end" size="small" color="error" onClick={() => setDeleteTarget(collection)} sx={{ ml: 0.5 }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
            >
              <ListItemButton onClick={() => handleOpenEditDialog(collection)}>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {collection.name}
                      <Chip label={collection.collection_id} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }} />
                    </Box>
                  }
                  secondary={`${collection.items.length} items`}
                />
              </ListItemButton>
            </ListItem>
          ))}
          {collections.length === 0 && (
            <Typography color="text.secondary" textAlign="center" sx={{ py: 2 }}>No collections found. Click the &apos;+&apos; to add one.</Typography>
          )}
        </List>
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onClose={handleCloseEditDialog} fullWidth maxWidth="md">
        <DialogTitle>Edit Collection</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              margin="dense"
              label="Collection Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              fullWidth
              size="small"
            />
            <TextField
              margin="dense"
              label="Collection ID (used by n8n)"
              value={editCollectionId}
              onChange={(e) => setEditCollectionId(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
              fullWidth
              size="small"
              sx={{ '& input': { fontFamily: 'monospace' } }}
              helperText="Change carefully — n8n references this ID"
            />
          </Box>
          <TextField margin="dense" label="Content Items (one per line)" value={editText} onChange={(e) => setEditText(e.target.value)} multiline rows={12} fullWidth variant="outlined" helperText="Enter URLs or text snippets, each on a new line." />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} disabled={isUpdatingCollection}>Cancel</Button>
          <Button onClick={handleSaveChanges} variant="contained" disabled={isUpdatingCollection}>{isUpdatingCollection ? <CircularProgress size={24} /> : 'Save Collection'}</Button>
        </DialogActions>
      </Dialog>

      {/* Add Dialog */}
      <AddCollectionDialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} onSubmit={handleAddCollection} isAdding={isAddingCollection} />

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        name={deleteTarget?.name || ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteCollection}
        isDeleting={isDeletingCollection}
      />

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