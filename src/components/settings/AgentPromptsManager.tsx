// src/components/settings/AgentPromptsManager.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useChannelConfig, AgentPrompt, AddPromptPayload } from '@/hooks/useChannelConfig';
import { useSearchParams } from 'next/navigation';

interface AgentPromptsManagerProps {
  prompts: AgentPrompt[];
}

// Component for the "Add New" dialog
function AddPromptDialog({ open, onClose, onSubmit, isAdding }: { open: boolean, onClose: () => void, onSubmit: (data: Omit<AddPromptPayload, 'channel_id'>) => void, isAdding: boolean }) {
    const [formData, setFormData] = useState({ name: '', agent_id: '', description: '', system_prompt: 'You are a helpful assistant.' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ component: 'form', onSubmit: handleSubmit }}>
            <DialogTitle>Add New Agent Persona</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ pt: 1 }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField name="name" label="Persona Name" value={formData.name} onChange={handleChange} fullWidth required autoFocus helperText="e.g., Support Agent" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField name="agent_id" label="Agent ID" value={formData.agent_id} onChange={handleChange} fullWidth required helperText="Machine-readable ID, e.g., 'support_agent'" />
                    </Grid>
                    <Grid size={12}>
                        <TextField name="description" label="Description" value={formData.description} onChange={handleChange} fullWidth multiline rows={2} helperText="A brief description of this agent's purpose." />
                    </Grid>
                    <Grid size={12}>
                        <TextField name="system_prompt" label="System Prompt" value={formData.system_prompt} onChange={handleChange} fullWidth multiline rows={10} />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={isAdding}>Cancel</Button>
                <Button type="submit" variant="contained" disabled={isAdding}>{isAdding ? <CircularProgress size={24}/> : "Add Persona"}</Button>
            </DialogActions>
        </Dialog>
    );
}


export default function AgentPromptsManager({ prompts }: AgentPromptsManagerProps) {
  const searchParams = useSearchParams();
  const channelId = searchParams.get('channelId');

  const { updatePrompt, isUpdatingPrompt, addPrompt, isAddingPrompt } = useChannelConfig(channelId);

  const [selectedPrompt, setSelectedPrompt] = useState<AgentPrompt | null>(prompts[0] || null);
  const [promptText, setPromptText] = useState(selectedPrompt?.system_prompt || '');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!selectedPrompt && prompts.length > 0) {
        setSelectedPrompt(prompts[0]);
    }
    if (selectedPrompt) {
        setPromptText(selectedPrompt.system_prompt);
    }
  }, [prompts, selectedPrompt]);

  const handleSelectPrompt = (prompt: AgentPrompt) => {
    setSelectedPrompt(prompt);
    setPromptText(prompt.system_prompt);
  };

  const handleSaveChanges = () => {
    if (!selectedPrompt) return;
    updatePrompt({ promptId: selectedPrompt.id, system_prompt: promptText }, {
      onSuccess: () => setSnackbar({ open: true, message: `"${selectedPrompt.name}" saved!`, severity: 'success' }),
      onError: (err) => setSnackbar({ open: true, message: `Error: ${err.message}`, severity: 'error' }),
    });
  };

  const handleAddPrompt = (data: Omit<AddPromptPayload, 'channel_id'>) => {
    addPrompt(data, {
        onSuccess: () => {
            setIsAddDialogOpen(false);
            setSnackbar({ open: true, message: 'New persona added!', severity: 'success' });
        },
        onError: (err) => setSnackbar({ open: true, message: `Error: ${err.message}`, severity: 'error' }),
    });
  };

  return (
    <>
      <Paper sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, height: { xs: 'auto', md: 'calc(80vh - 64px)' }, minHeight: '500px' }}>
        <Box sx={{ width: { xs: '100%', sm: '35%', md: '30%' }, borderRight: { sm: '1px solid' }, borderColor: 'divider', overflowY: 'auto' }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Agent Personas</Typography>
            <Button size="small" startIcon={<AddCircleOutlineIcon />} onClick={() => setIsAddDialogOpen(true)}>Add</Button>
          </Box>
          <List component="nav">
            {prompts.map(prompt => (
              <ListItemButton key={prompt.id} selected={selectedPrompt?.id === prompt.id} onClick={() => handleSelectPrompt(prompt)}>
                <ListItemText primary={prompt.name} secondary={prompt.description} secondaryTypographyProps={{ noWrap: true, fontSize: '0.8rem' }}/>
              </ListItemButton>
            ))}
          </List>
        </Box>
        <Box sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column' }}>
          {selectedPrompt ? (
            <>
              <Typography variant="h5">{selectedPrompt.name}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                ID: <code>{selectedPrompt.agent_id}</code>
              </Typography>
              <TextField label="System Prompt" value={promptText} onChange={(e) => setPromptText(e.target.value)} multiline fullWidth sx={{ flexGrow: 1, '& .MuiInputBase-root': { height: '100%' } }}/>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" onClick={handleSaveChanges} disabled={isUpdatingPrompt}>
                  {isUpdatingPrompt ? <CircularProgress size={24} /> : `Save Persona`}
                </Button>
              </Box>
            </>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Typography color="text.secondary">No agent personas found. Click "Add" to create one.</Typography>
            </Box>
          )}
        </Box>
      </Paper>
      
      <AddPromptDialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} onSubmit={handleAddPrompt} isAdding={isAddingPrompt} />
      
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