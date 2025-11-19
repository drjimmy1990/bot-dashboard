// src/components/settings/KeywordActionsManager.tsx
'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  Button,
  Paper,
  Divider,
  Grid,
  CircularProgress,
  Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

import { useChannelConfig, KeywordAction } from '@/hooks/useChannelConfig';
// REMOVED: No longer need useSearchParams

// --- THIS IS A FIX ---
// The component now expects a channelId to be passed in as a prop.
interface KeywordActionsManagerProps {
  keywords: KeywordAction[];
  channelId: string;
}

type EditingState = {
  id: string;
  keyword: string;
  action_type: string;
};

// --- THIS IS THE MAIN FIX ---
// The component now receives and uses the channelId from its props.
export default function KeywordActionsManager({ keywords, channelId }: KeywordActionsManagerProps) {
  // REMOVED: The broken useSearchParams logic is gone.
  
  // The hook now receives the correct channelId, so all mutations will work.
  const { addKeyword, isAddingKeyword, deleteKeyword, isDeletingKeyword, updateKeyword, isUpdatingKeyword } = useChannelConfig(channelId);

  const [newKeyword, setNewKeyword] = useState('');
  const [newActionType, setNewActionType] = useState('DISABLE_AI');
  const [editingState, setEditingState] = useState<EditingState | null>(null);

  const handleAddAction = () => {
    if (newKeyword.trim()) {
      addKeyword({ keyword: newKeyword.trim(), action_type: newActionType }, {
        onSuccess: () => {
            setNewKeyword('');
            setNewActionType('DISABLE_AI'); // Reset form
        }
      });
    }
  };
  
  const handleStartEdit = (action: KeywordAction) => {
    setEditingState({ ...action });
  };
  
  const handleCancelEdit = () => {
    setEditingState(null);
  };
  
  const handleUpdateAction = () => {
    if (editingState) {
        updateKeyword(editingState, {
            onSuccess: () => setEditingState(null)
        });
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Keyword Actions & Variables</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Define automated actions or store variables for your n8n workflows.
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 2 }} alignItems="center">
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            label="New Keyword / Variable Name"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            variant="outlined"
            size="small"
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 5 }}>
          <TextField
            label="Action / Value"
            value={newActionType}
            onChange={(e) => setNewActionType(e.target.value)}
            variant="outlined"
            size="small"
            fullWidth
            helperText="e.g., DISABLE_AI or a Telegram Group ID"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Button
            onClick={handleAddAction}
            startIcon={isAddingKeyword ? <CircularProgress size={20} /> : <AddCircleOutlineIcon />}
            variant="contained"
            fullWidth
            disabled={!newKeyword.trim() || isAddingKeyword}
          >
            Add
          </Button>
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 2 }} />
      
      <List dense>
        {keywords.map(action => {
            const isCurrentlyEditing = editingState?.id === action.id;
            
            return isCurrentlyEditing ? (
                <ListItem key={action.id} sx={{ bgcolor: 'action.focus', borderRadius: 1, mb: 1, p: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid size={4}>
                            <TextField autoFocus value={editingState.keyword} onChange={(e) => setEditingState(s => s ? {...s, keyword: e.target.value} : null)} size="small" />
                        </Grid>
                        <Grid size={5}>
                            <TextField value={editingState.action_type} onChange={(e) => setEditingState(s => s ? {...s, action_type: e.target.value} : null)} size="small" fullWidth/>
                        </Grid>
                        <Grid size={3} textAlign="right">
                           <Tooltip title="Save">
                                <IconButton onClick={handleUpdateAction} disabled={isUpdatingKeyword}>{isUpdatingKeyword ? <CircularProgress size={20}/> : <SaveIcon color="primary"/>}</IconButton>
                            </Tooltip>
                            <Tooltip title="Cancel">
                                <IconButton onClick={handleCancelEdit}><CancelIcon /></IconButton>
                            </Tooltip>
                        </Grid>
                    </Grid>
                </ListItem>
            ) : (
                <ListItem
                    key={action.id}
                    secondaryAction={
                    <Box>
                        <Tooltip title="Edit">
                            <IconButton edge="end" sx={{mr: 0.5}} onClick={() => handleStartEdit(action)}><EditIcon fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                            <IconButton edge="end" onClick={() => deleteKeyword(action.id)}>{isDeletingKeyword ? <CircularProgress size={20}/> : <DeleteIcon color="error" />}</IconButton>
                        </Tooltip>
                    </Box>
                    }
                    sx={{ bgcolor: 'background.default', borderRadius: 1, mb: 1 }}
                >
                    <ListItemText
                        primary={<Typography variant="body2" component="span" sx={{ fontWeight: 'bold' }}>{action.keyword}</Typography>}
                        secondary={action.action_type}
                    />
                </ListItem>
            )
        })}
        {keywords.length === 0 && (
          <Typography color="text.secondary" textAlign="center" sx={{py: 2}}>No keywords or variables defined.</Typography>
        )}
      </List>
    </Paper>
  );
}