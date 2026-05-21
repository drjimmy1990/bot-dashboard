// src/components/team/InviteMemberDialog.tsx
'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
  Snackbar,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Box,
} from '@mui/material';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/providers/AuthProvider';
import { useChannels } from '@/hooks/useChannels';
import { useQueryClient } from '@tanstack/react-query';

interface InviteMemberDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function InviteMemberDialog({ open, onClose }: InviteMemberDialogProps) {
  const { profile } = useAuth();
  const { channels } = useChannels();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('agent');
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' } | null>(null);

  const handleChannelToggle = (channelId: string) => {
    setSelectedChannels(prev =>
      prev.includes(channelId)
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);

    try {
      // Use Supabase admin invite (requires service_role key or admin API)
      // For now, we'll use the signUp approach with metadata
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: crypto.randomUUID(), // Temporary random password — user resets on first login
        options: {
          data: {
            organization_id: profile.organization_id,
            role: role,
            full_name: fullName.trim(),
          },
        },
      });

      if (error) throw error;

      // If we got a user and role is not admin, assign channel access
      if (data.user && role !== 'admin' && selectedChannels.length > 0) {
        const accessRecords = selectedChannels.map(channelId => ({
          user_id: data.user!.id,
          channel_id: channelId,
          organization_id: profile.organization_id,
        }));

        const { error: accessError } = await supabase
          .from('user_channel_access')
          .insert(accessRecords);

        if (accessError) {
          console.error('Channel access assignment failed:', accessError);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['org_members'] });
      setSnackbar({ open: true, message: `Invitation sent to ${email}!`, severity: 'success' });

      // Reset form
      setEmail('');
      setFullName('');
      setRole('agent');
      setSelectedChannels([]);
      onClose();
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="sm"
        PaperProps={{ component: 'form', onSubmit: handleSubmit }}
      >
        <DialogTitle>Invite Team Member</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid size={12}>
              <TextField
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                required
                autoFocus
                size="small"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                fullWidth
                size="small"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Role</InputLabel>
                <Select value={role} onChange={(e) => setRole(e.target.value)} label="Role">
                  <MenuItem value="admin">Admin — Full access</MenuItem>
                  <MenuItem value="agent">Agent — Chat & CRM</MenuItem>
                  <MenuItem value="viewer">Viewer — Read-only</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {role !== 'admin' && channels.length > 0 && (
              <Grid size={12}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Channel Access
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Select which channels this member can access.
                </Typography>
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1, maxHeight: 200, overflow: 'auto' }}>
                  <FormGroup>
                    {channels.map((ch) => (
                      <FormControlLabel
                        key={ch.id}
                        control={
                          <Checkbox
                            checked={selectedChannels.includes(ch.id)}
                            onChange={() => handleChannelToggle(ch.id)}
                            size="small"
                          />
                        }
                        label={
                          <Typography variant="body2">
                            {ch.name} <Typography component="span" variant="caption" color="text.secondary">({ch.platform})</Typography>
                          </Typography>
                        }
                      />
                    ))}
                  </FormGroup>
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={24} /> : 'Send Invite'}
          </Button>
        </DialogActions>
      </Dialog>

      {snackbar && (
        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(null)}>
          <Alert onClose={() => setSnackbar(null)} severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      )}
    </>
  );
}
