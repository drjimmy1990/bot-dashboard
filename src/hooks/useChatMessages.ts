// src/hooks/useChatMessages.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api';
import { supabase } from '@/lib/supabaseClient';
import { useEffect } from 'react';

// Get default IDs from environment variables.
const CHANNEL_ID = process.env.NEXT_PUBLIC_DEFAULT_CHANNEL_ID;
const ORGANIZATION_ID = process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID;

export const useChatMessages = (contactId: string | null) => {
  const queryClient = useQueryClient();
  
  // --- VALIDATION ---
  if (!CHANNEL_ID || !ORGANIZATION_ID) {
    throw new Error("Default channel or organization ID is not set in .env.local");
  }

  // --- QUERY ---
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery<api.Message[]>({
    queryKey: ['messages', contactId],
    queryFn: async () => {
      if (!contactId) return [];
      
      // We can run these in parallel for a small performance boost.
      await Promise.all([
        api.markChatAsRead(contactId),
        // After marking as read, refetch contacts to update the unread count in the UI.
        queryClient.invalidateQueries({ queryKey: ['contacts', CHANNEL_ID] })
      ]);
      
      return api.getMessagesForContact(contactId);
    },
    enabled: !!contactId,
  });

  // --- MUTATION for sending a message ---
  const sendMessageMutation = useMutation({
    // Update the mutation function to include the new required IDs.
    mutationFn: (vars: {
        contact_id: string;
        content_type: string;
        text_content?: string;
        attachment_url?: string;
        platform: string;
    }) => api.sendMessage({
        ...vars,
        channel_id: CHANNEL_ID,
        organization_id: ORGANIZATION_ID,
    }),
    onSuccess: (newMessage) => {
      if (!newMessage) return; // Don't do anything if the function returns nothing
      
      // Optimistically update the messages list
      queryClient.setQueryData(['messages', contactId], (oldData: api.Message[] | undefined) => {
        return oldData ? [...oldData, newMessage] : [newMessage];
      });
      
      // Invalidate contacts to update the last message preview and order.
      queryClient.invalidateQueries({ queryKey: ['contacts', CHANNEL_ID] });
    },
  });

  // --- REALTIME ---
  useEffect(() => {
    if (!contactId) return;

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

          // Mark as read if the user is currently viewing this chat and has the window focused.
          if (document.hasFocus()) {
            api.markChatAsRead(contactId)
              .then(() => queryClient.invalidateQueries({ queryKey: ['contacts', CHANNEL_ID] }));
          } else {
             queryClient.invalidateQueries({ queryKey: ['contacts', CHANNEL_ID] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [contactId, queryClient]);


  return {
    messages,
    isLoadingMessages,
    sendMessage: sendMessageMutation.mutate,
    isSendingMessage: sendMessageMutation.isPending,
  };
};