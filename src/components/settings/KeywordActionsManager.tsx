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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid, // Import Grid
  CircularProgress,
  Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

import { useChannelConfig, KeywordAction } from '@/hooks/useChannelConfig';
import { useSearchParams } from 'next/navigation';

interface KeywordActionsManagerProps {
  keywords: KeywordAction[];
}

type EditingState = {
  id: string;
  keyword: string;
  action_type: 'DISABLE_AI' | 'ENABLE_AI';
};

export default function KeywordActionsManager({ keywords }: KeywordActionsManagerProps) {
  const searchParams = useSearchParams();
  const channelId = searchParams.get('channelId');
  
  const { addKeyword, isAddingKeyword, deleteKeyword, isDeletingKeyword, updateKeyword, isUpdatingKeyword } = useChannelConfig(channelId);

  const [newKeyword, setNewKeyword] = useState('');
  const [newActionType, setNewActionType] = useState<'DISABLE_AI' | 'ENABLE_AI'>('DISABLE_AI');
  const [editingState, setEditingState] = useState<EditingState | null>(null);

  const handleAddAction = () => {
    if (newKeyword.trim() && !keywords.find(a => a.keyword === newKeyword.trim())) {
      addKeyword({ keyword: newKeyword.trim(), action_type: newActionType }, {
        onSuccess: () => setNewKeyword('')
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
      <Typography variant="h6" gutterBottom>Keyword Actions</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Define automated actions when a user's message exactly matches a keyword.
      </Typography>
      
      {/* --- GRID FIX IS HERE --- */}
      <Grid container spacing={2} sx={{ mb: 2 }} alignItems="center">
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            label="New Keyword"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            variant="outlined"
            size="small"
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 5 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Action</InputLabel>
            <Select
              value={newActionType}
              label="Action"
              onChange={(e) => setNewActionType(e.target.value as 'DISABLE_AI' | 'ENABLE_AI')}
            >
              <MenuItem value="DISABLE_AI">Disable AI for user</MenuItem>
              <MenuItem value="ENABLE_AI">Enable AI for user</MenuItem>
            </Select>
          </FormControl>
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
      {/* --- END OF GRID FIX --- */}

      <Divider sx={{ my: 2 }} />
      
      <List dense>
        {keywords.map(action => {
            const isCurrentlyEditing = editingState?.id === action.id;
            
            return isCurrentlyEditing ? (
                <ListItem key={action.id} sx={{ bgcolor: 'action.focus', borderRadius: 1, mb: 1, p: 2 }}>
                    {/* --- GRID FIX FOR EDITING VIEW --- */}
                    <Grid container spacing={2} alignItems="center">
                        <Grid size={4}>
                            <TextField autoFocus value={editingState.keyword} onChange={(e) => setEditingState(s => s ? {...s, keyword: e.target.value} : null)} size="small" />
                        </Grid>
                        <Grid size={5}>
                            <Select value={editingState.action_type} onChange={(e) => setEditingState(s => s ? {...s, action_type: e.target.value as any} : null)} size="small" fullWidth>
                                <MenuItem value="DISABLE_AI">Disable AI for user</MenuItem>
                                <MenuItem value="ENABLE_AI">Enable AI for user</MenuItem>
                            </Select>
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
                    sx={{ bgcolor: 'action.hover', borderRadius: 1, mb: 1 }}
                >
                    <ListItemText
                    primary={<Typography variant="body2" component="span" sx={{ fontWeight: 'bold' }}>{action.keyword}</Typography>}
                    secondary={action.action_type === 'DISABLE_AI' ? 'Disables AI for user' : 'Enables AI for user'}
                    />
                </ListItem>
            )
        })}
        {keywords.length === 0 && (
          <Typography color="text.secondary" textAlign="center" sx={{py: 2}}>No keyword actions defined.</Typography>
        )}
      </List>
    </Paper>
  );
}