// src/hooks/useChatMessages.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api';
import { supabase } from '@/lib/supabaseClient';
import { useEffect } from 'react';

// REMOVED: Hardcoded ID constants. We will get these from arguments.

// 1. Hook now accepts channelId and organizationId
export const useChatMessages = (contactId: string | null, channelId: string | null, organizationId: string | null) => {
  const queryClient = useQueryClient();
  
  // REMOVED: Validation for old hardcoded IDs

  // --- QUERY ---
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery<api.Message[]>({
    queryKey: ['messages', contactId],
    queryFn: async () => {
      if (!contactId) return [];
      
      await Promise.all([
        api.markChatAsRead(contactId),
        // 2. Invalidate the dynamic contacts query key
        queryClient.invalidateQueries({ queryKey: ['contacts', channelId] })
      ]);
      
      return api.getMessagesForContact(contactId);
    },
    // 3. Query is enabled only when we have all necessary IDs
    enabled: !!contactId && !!channelId,
  });

  // --- MUTATION for sending a message ---
  const sendMessageMutation = useMutation({
    // The mutation function's variables are defined by what we pass to `mutate()`
    mutationFn: (vars: {
        contact_id: string;
        content_type: string;
        text_content?: string;
        attachment_url?: string;
        platform: string;
    }) => {
        // 4. Critical: Ensure channelId and organizationId are passed to the API call
        if (!channelId || !organizationId) {
            // This should ideally not happen if the UI disables the send button, but it's a good safeguard.
            return Promise.reject(new Error("Cannot send message: channel or organization ID is missing."));
        }
        return api.sendMessage({
            ...vars,
            channel_id: channelId,
            organization_id: organizationId,
        });
    },
    onSuccess: (newMessage) => {
      if (!newMessage) return;
      
      queryClient.setQueryData(['messages', contactId], (oldData: api.Message[] | undefined) => {
        return oldData ? [...oldData, newMessage] : [newMessage];
      });
      
      // 5. Invalidate the dynamic contacts query key
      queryClient.invalidateQueries({ queryKey: ['contacts', channelId] });
    },
  });

  // --- REALTIME ---
  useEffect(() => {
    // 6. Do nothing if contactId or channelId is missing
    if (!contactId || !channelId) return;

    const channel = supabase
      .channel(`public-messages-contact-${contactId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `contact_id=eq.${contactId}` },
        (payload) => {
          console.log('New message via realtime:', payload);
          const newMessage = payload.new as api.Message;
          
          queryClient.setQueryData(['messages', contactId], (oldData: api.Message[] | undefined) => {
            if (oldData?.find(msg => msg.id === newMessage.id)) return oldData;
            return oldData ? [...oldData, newMessage] : [newMessage];
          });
          
          if (document.hasFocus()) {
            api.markChatAsRead(contactId)
              // 7. Invalidate the dynamic contacts query key
              .then(() => queryClient.invalidateQueries({ queryKey: ['contacts', channelId] }));
          } else {
             queryClient.invalidateQueries({ queryKey: ['contacts', channelId] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // 8. Add channelId to the dependency array
  }, [contactId, queryClient, channelId]);


  return {
    messages,
    isLoadingMessages,
    sendMessage: sendMessageMutation.mutate,
    isSendingMessage: sendMessageMutation.isPending,
  };
};