// src/hooks/useChatContacts.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react'; // <-- THIS IS THE FIX: IMPORT useState and useEffect
import { RealtimeChannel } from '@supabase/supabase-js';

// --- DEBOUNCING UTILITY ---
// This is a simple hook to prevent firing a DB query on every keystroke.
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// 1. Hook now accepts an optional searchTerm
export const useChatContacts = (channelId: string | null, searchTerm?: string) => {
  const queryClient = useQueryClient();
  const debouncedSearchTerm = useDebounce(searchTerm || '', 300); // Debounce search for 300ms

  // 2. Query key is now dynamic with the debounced search term
  const queryKey = ['contacts', channelId, debouncedSearchTerm];

  const { data: contacts = [], isLoading: isLoadingContacts } = useQuery<api.Contact[]>({
    queryKey: queryKey,
    queryFn: async () => {
        if (!channelId) return [];

        let query = supabase
            .from('contacts')
            .select('*')
            .eq('channel_id', channelId);

        // --- THIS IS THE SEARCH LOGIC ---
        // 3. If there is a search term, build a dynamic 'or' filter
        if (debouncedSearchTerm) {
            query = query.or(
                // Search in 'name' (case-insensitive) OR in 'platform_user_id'
                `name.ilike.%${debouncedSearchTerm}%,platform_user_id.ilike.%${debouncedSearchTerm}%`
            );
        }

        // 4. The ORDER BY is now more robust. Unread messages always come first.
        query = query.order('unread_count', { ascending: false })
                     .order('last_interaction_at', { ascending: false })
                     .limit(100); // Add a limit to prevent fetching thousands of rows at once

        const { data, error } = await query;
        
        if (error) {
            console.error("Error fetching contacts:", error);
            throw new Error(error.message);
        }
        return data || [];
    },
    enabled: !!channelId,
  });

  // (Mutations remain the same)
  const updateNameMutation = useMutation({
    mutationFn: api.updateContactName,
    onSuccess: () => {
      // Invalidate all queries for this channel to refresh the list
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
        queryClient.removeQueries({ queryKey: ['messages', contactId] });
    }
  });
  
  // (Realtime logic remains the same)
  useEffect(() => {
    if (!channelId) return;
    
    // Using a more specific channel name to avoid potential conflicts
    const subscriptionChannel: RealtimeChannel = supabase
      .channel(`public:contacts:channel_id=eq.${channelId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contacts', filter: `channel_id=eq.${channelId}` },
        (payload) => {
          // Invalidate all contact queries for this channel to ensure UI updates
          queryClient.invalidateQueries({ queryKey: ['contacts', channelId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscriptionChannel);
    };
  }, [queryClient, channelId]);
  

  return {
    contacts,
    isLoadingContacts,
    updateName: updateNameMutation.mutate,
    toggleAi: toggleAiMutation.mutate,
    deleteContact: deleteContactMutation.mutate,
  };
};