// src/hooks/useChatContacts.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api';
import { supabase } from '@/lib/supabaseClient';
import { useEffect } from 'react';

// Get the default channel ID from environment variables.
// This is how we tell the hook which channel to operate on.
const CHANNEL_ID = process.env.NEXT_PUBLIC_DEFAULT_CHANNEL_ID;

export const useChatContacts = () => {
  const queryClient = useQueryClient();

  // --- VALIDATION ---
  if (!CHANNEL_ID) {
    throw new Error("NEXT_PUBLIC_DEFAULT_CHANNEL_ID is not set in .env.local");
  }

  // --- QUERIES ---
  const { data: contacts = [], isLoading: isLoadingContacts } = useQuery<api.Contact[]>({
    // The query key now includes the channelId to ensure data is cached per-channel.
    queryKey: ['contacts', CHANNEL_ID],
    queryFn: () => api.getContacts(CHANNEL_ID), // Pass the channelId to the API function.
  });

  // --- MUTATIONS ---
  // These mutations don't need changes because they operate on a contactId,
  // which is already unique and implicitly tied to a channel.
  const updateNameMutation = useMutation({
    mutationFn: api.updateContactName,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts', CHANNEL_ID] });
    },
  });

  const toggleAiMutation = useMutation({
    mutationFn: api.toggleAiStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts', CHANNEL_ID] });
    },
  });
  
  const deleteContactMutation = useMutation({
    mutationFn: api.deleteContact,
    onSuccess: (data, contactId) => {
        queryClient.invalidateQueries({ queryKey: ['contacts', CHANNEL_ID] });
        queryClient.removeQueries({ queryKey: ['messages', contactId] });
    }
  });

  // --- REALTIME ---
  useEffect(() => {
    const channel = supabase
      // Subscribe to changes on the 'contacts' table specifically for our channel.
      .channel(`public-contacts-channel-${CHANNEL_ID}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contacts', filter: `channel_id=eq.${CHANNEL_ID}` },
        (payload) => {
          console.log('Realtime contact change received:', payload);
          // Invalidate the query for our specific channel.
          queryClient.invalidateQueries({ queryKey: ['contacts', CHANNEL_ID] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
  

  return {
    contacts,
    isLoadingContacts,
    updateName: updateNameMutation.mutate,
    toggleAi: toggleAiMutation.mutate,
    deleteContact: deleteContactMutation.mutate,
  };
};