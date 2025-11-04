// src/hooks/useChatContacts.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api';
import { supabase } from '@/lib/supabaseClient';
import { useEffect } from 'react';

// REMOVED: const CHANNEL_ID = process.env.NEXT_PUBLIC_DEFAULT_CHANNEL_ID;

// 1. Hook now accepts a channelId argument
export const useChatContacts = (channelId: string | null) => {
  const queryClient = useQueryClient();

  // REMOVED: Validation for the old hardcoded CHANNEL_ID

  // --- QUERIES ---
  const { data: contacts = [], isLoading: isLoadingContacts } = useQuery<api.Contact[]>({
    // 2. Query key is now dynamic, including the channelId
    queryKey: ['contacts', channelId],
    // 3. The API call now passes the dynamic channelId
    queryFn: () => api.getContacts(channelId!),
    // 4. The query is only enabled when a channelId is provided
    enabled: !!channelId,
  });

  // --- MUTATIONS ---
  // Mutations operate on a unique contactId, so they don't need the channelId directly.
  // However, their onSuccess invalidation logic MUST be updated to use the dynamic channelId.
  const updateNameMutation = useMutation({
    mutationFn: api.updateContactName,
    onSuccess: () => {
      // 5. Invalidate the DYNAMIC query key
      queryClient.invalidateQueries({ queryKey: ['contacts', channelId] });
    },
  });

  const toggleAiMutation = useMutation({
    mutationFn: api.toggleAiStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts', channelId] });
    },
  });
  
  const deleteContactMutation = useMutation({
    mutationFn: api.deleteContact,
    onSuccess: (data, contactId) => {
        queryClient.invalidateQueries({ queryKey: ['contacts', channelId] });
        // Removing the messages query for the deleted contact is still correct.
        queryClient.removeQueries({ queryKey: ['messages', contactId] });
    }
  });

  // --- REALTIME ---
  useEffect(() => {
    // 6. Do nothing if no channel is selected
    if (!channelId) return;

    const channel = supabase
      // 7. Subscription channel name is now dynamic
      .channel(`public-contacts-channel-${channelId}`)
      .on(
        'postgres_changes',
        // 8. The filter for the subscription is also dynamic
        { event: '*', schema: 'public', table: 'contacts', filter: `channel_id=eq.${channelId}` },
        (payload) => {
          console.log('Realtime contact change received:', payload);
          // 9. Invalidate the correct dynamic query
          queryClient.invalidateQueries({ queryKey: ['contacts', channelId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // 10. Add channelId to the dependency array
  }, [queryClient, channelId]);
  

  return {
    contacts,
    isLoadingContacts,
    updateName: updateNameMutation.mutate,
    toggleAi: toggleAiMutation.mutate,
    deleteContact: deleteContactMutation.mutate,
  };
};